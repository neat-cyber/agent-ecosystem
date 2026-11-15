import { readFileSync, appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const RADAR = "https://agent-dependency-radar.saromy-export.workers.dev/mcp";
const PUBLIC_NPM = /^https:\/\/registry\.npmjs\.org\//i;
const PACKAGE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/;

const directNames = lock => new Set(["dependencies", "devDependencies", "optionalDependencies"]
  .flatMap(section => Object.keys(lock.packages[""][section] ?? {})));

export function selectChanges(before, after, allowlist) {
  for (const lock of [before, after]) {
    if (![2, 3].includes(lock?.lockfileVersion) || !lock.packages?.[""]) {
      throw new Error("Expected root npm lockfiles with lockfileVersion 2 or 3.");
    }
  }
  const previousDirect = directNames(before);
  const direct = directNames(after);
  const packages = [];
  let skipped = 0;
  for (const name of direct) {
    const path = "node_modules/" + name;
    const entry = after.packages[path];
    if (entry && previousDirect.has(name) && entry.version === before.packages[path]?.version &&
      entry.resolved === before.packages[path]?.resolved) continue;
    if (!allowlist.has(name) || name.length > 100 || !PACKAGE.test(name) ||
      !VERSION.test(entry?.version ?? "") || entry.version.length > 60 || entry.link ||
      (entry.name && entry.name !== name) || !PUBLIC_NPM.test(entry.resolved ?? "")) {
      skipped++;
      continue;
    }
    packages.push({ ecosystem: "npm", package_name: name, version: entry.version });
  }
  if (packages.length > 3) {
    throw new Error("More than three approved dependencies changed. Use smaller updates to run the Radar check.");
  }
  return { packages, skipped };
}

async function responseMessage(response) {
  if (!response.ok) throw new Error("Radar returned HTTP " + response.status + ".");
  if (!(response.headers.get("content-type") ?? "").includes("text/event-stream")) return response.json();
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) throw new Error("Radar stream ended without a result.");
      buffer = (buffer + value).replaceAll("\r\n", "\n");
      if (buffer.length > 128_000) throw new Error("Radar stream exceeded the response limit.");
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = event.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n");
        if (!data) continue;
        const message = JSON.parse(data);
        if (message.id !== undefined) return message;
      }
    }
  } finally {
    void reader.cancel().catch(() => {});
  }
}

export async function releaseGate(packages, { internal = false, request = fetch } = {}) {
  const headers = { "content-type": "application/json", accept: "application/json, text/event-stream" };
  if (internal) headers["x-ecosystem-test"] = "1";
  async function send(method, params, id) {
    const response = await request(RADAR, {
      method: "POST", headers: { ...headers }, redirect: "error", signal: AbortSignal.timeout(18_000),
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    });
    if (id === undefined) {
      if (!response.ok) throw new Error("Radar rejected MCP initialization.");
      return;
    }
    const message = await responseMessage(response);
    if (message.id !== id || message.error || message.result?.isError || !message.result) {
      throw new Error("Radar did not return a successful MCP result.");
    }
    if (method === "initialize") {
      const session = response.headers.get("mcp-session-id");
      if (session) headers["mcp-session-id"] = session;
      if (typeof message.result.protocolVersion !== "string") throw new Error("Radar did not negotiate MCP.");
      headers["mcp-protocol-version"] = message.result.protocolVersion;
    }
    return message.result;
  }

  await send("initialize", {
    protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "oseille-npm-pr-check", version: "1.0.0" },
  }, 1);
  await send("notifications/initialized", {});
  const result = await send("tools/call", { name: "release_gate", arguments: { packages } }, 2);
  const data = result.structuredContent;
  if (![
    "review_known_advisories", "no_known_direct_advisories_found", "incomplete_needs_review",
  ].includes(data?.decision)) throw new Error("Radar returned an unrecognized decision.");
  return data;
}

function summary(data, { packages, skipped }) {
  const lines = ["## Agent Dependency Radar", ""];
  if (data) {
    lines.push(
      "**Decision** `" + data.decision + "`",
      "Checked versions " + packages.map(p => "`" + p.package_name + "@" + p.version + "`").join(", "),
    );
    const advisories = new Set((Array.isArray(data.results) ? data.results : []).flatMap(entry =>
      (Array.isArray(entry?.installed_sample) ? entry.installed_sample : [])
        .map(item => item?.id).filter(id => typeof id === "string" && /^[A-Z0-9-]{5,80}$/i.test(id)),
    ));
    if (advisories.size) lines.push("Advisory sample " + [...advisories].map(id => "`" + id + "`").join(", "));
  } else {
    lines.push("No changed, allowlisted npm version to check.");
  }
  if (skipped) lines.push(skipped + " other changed direct dependencies were outside the selected scope.");
  lines.push("", "Only selected direct dependencies are covered. Keep your existing npm audit and dependency review.");
  return lines.join("\n") + "\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const internal = args.includes("--internal");
    const [base, head, ...names] = args.filter(arg => arg !== "--internal");
    if (!base || !head || names.length === 0) {
      throw new Error("Usage: node radar-pr-check.mjs BASE_LOCK HEAD_LOCK PUBLIC_PACKAGE [...] [--internal]");
    }
    const selection = selectChanges(
      JSON.parse(readFileSync(base, "utf8")), JSON.parse(readFileSync(head, "utf8")), new Set(names),
    );
    const data = selection.packages.length ? await releaseGate(selection.packages, { internal }) : null;
    const report = summary(data, selection);
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  } catch (error) {
    console.error(error instanceof SyntaxError ? "Invalid npm lockfile or service response." : error.message);
    process.exitCode = 1;
  }
}
