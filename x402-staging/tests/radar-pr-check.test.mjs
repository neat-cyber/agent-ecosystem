import assert from "node:assert/strict";
import { test } from "node:test";
import { releaseGate, selectChanges } from "../scripts/radar-pr-check.mjs";

const lock = lodash => ({ lockfileVersion: 3, packages: {
  "": { dependencies: { lodash: "4", "@internal/library": "1", alias: "npm:lodash@4" } },
  "node_modules/lodash": { version: lodash, resolved: "https://registry.npmjs.org/lodash/tarball" },
  "node_modules/@internal/library": { version: lodash, resolved: "https://registry.npmjs.org/@internal/library/tarball" },
  "node_modules/alias": { version: lodash, name: "lodash", resolved: "https://registry.npmjs.org/lodash/tarball" },
  "node_modules/indirect": { version: lodash },
} });

test("selects changed direct versions only and excludes non-allowlisted or aliased entries", () => {
  const allowed = new Set(["lodash", "alias", "indirect"]);
  assert.deepEqual(selectChanges(lock("4.17.19"), lock("4.17.20"), allowed), {
    packages: [{ ecosystem: "npm", package_name: "lodash", version: "4.17.20" }], skipped: 2,
  });
  assert.deepEqual(selectChanges(lock("4.17.20"), lock("4.17.20"), allowed), { packages: [], skipped: 0 });
});

test("initializes MCP, preserves session and identifies the internal check", async () => {
  const calls = [];
  const packages = [{ ecosystem: "npm", package_name: "lodash", version: "4.17.20" }];
  const data = await releaseGate(packages, { internal: true, request: async (_url, init) => {
    const payload = JSON.parse(init.body);
    calls.push(payload.method);
    assert.equal(init.headers["x-ecosystem-test"], "1");
    if (payload.method === "initialize") {
      return Response.json({ id: 1, result: { protocolVersion: "2025-03-26" } }, { headers: { "mcp-session-id": "test-session" } });
    }
    assert.equal(init.headers["mcp-session-id"], "test-session");
    if (payload.method === "notifications/initialized") return new Response(null, { status: 202 });
    assert.deepEqual(payload.params, { name: "release_gate", arguments: { packages } });
    return new Response(
      'data: {"id":2,"result":{"structuredContent":{"decision":"review_known_advisories"}}}\r\n\r\n',
      { headers: { "content-type": "text/event-stream" } },
    );
  } });
  assert.deepEqual(calls, ["initialize", "notifications/initialized", "tools/call"]);
  assert.equal(data.decision, "review_known_advisories");
});
