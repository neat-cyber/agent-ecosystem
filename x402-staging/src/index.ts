import { DurableObject } from "cloudflare:workers";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { encodePaymentRequiredHeader, encodePaymentResponseHeader } from "@x402/core/http";
import type { SettleResponse } from "@x402/core/types";
import { analyzeGraph, DESCRIPTION, graphSchema, graphShape, mapGraph, readBounded, TOOL_NAME } from "./radar.ts";
import {
  address, AMOUNT, availableWindow, challenge, confirmed, facilitator, NETWORK, parseProof,
  requirements, sha256, verifyReceipt,
} from "./payment.ts";
import type { z } from "zod";

type Bindings = Omit<Env, "X402_ENABLED" | "X402_RECIPIENT"> & {
  X402_ENABLED: string; X402_RECIPIENT: string; STAGING_ACCESS_TOKEN?: string;
};
type Graph = z.infer<typeof graphSchema>;
type Analysis = Awaited<ReturnType<typeof analyzeGraph>>;
type Proof = NonNullable<ReturnType<typeof parseProof>>;
type Outcome =
  | { status: 200; analysis: Analysis; settlement: SettleResponse }
  | { status: 402 | 409 | 429 | 502 | 503; error: string };

const PRIVATE = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const error = <Status extends number>(status: Status, error: string) => ({ status, error });
const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(data, { status, headers: { ...PRIVATE, ...headers } });
const CAP = 10;
const PAY_PATH = "/v1/dependency-graph-review";
const MAX_BODY = 48_000;

type Entry = {
  proof_hash: string;
  phase: "working" | "submitting" | "submitted" | "ready";
  analysis: string | null;
  settlement: string | null;
};

export class TestnetPayments extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS payments (
      payment_key TEXT PRIMARY KEY, proof_hash TEXT NOT NULL, phase TEXT NOT NULL,
      analysis TEXT, settlement TEXT, created_at INTEGER NOT NULL
    )`);
  }

  async execute(payment: Proof, graph: Graph, recipient: string): Promise<Outcome> {
    const { key, auth, proof, signature } = payment;
    const fingerprint = await sha256(JSON.stringify([signature, auth, graph]));
    const sql = this.ctx.storage.sql;
    const lookup = () => sql.exec<Entry>(
      "SELECT proof_hash,phase,analysis,settlement FROM payments WHERE payment_key = ?", key,
    ).toArray()[0];
    const previous = lookup();
    if (previous) {
      if (previous.proof_hash !== fingerprint) return error(409, "payment_already_bound");
      if (previous.phase === "ready" || previous.phase === "submitted") return this.deliver(previous, payment);
      return error(409, previous.phase === "submitting" ? "settlement_pending_reconciliation" : "analysis_in_progress");
    }
    if (!availableWindow(auth)) return error(402, "invalid_payment_window");
    if (sql.exec<{ n: number }>("SELECT count(*) AS n FROM payments").one().n >= CAP) {
      return error(429, "testnet_cap_reached");
    }

    const client = facilitator();
    const expected = requirements(recipient);
    try {
      const verification = await client.verify(proof, expected);
      if (verification.isValid !== true || verification.payer?.toLowerCase() !== auth.from.toLowerCase()) {
        return error(402, "invalid_payment_proof");
      }
    } catch {
      return error(502, "verification_unavailable");
    }

    // The verification request yields. Claim capacity and the nonce with a single SQL statement.
    const claim = sql.exec(`INSERT OR IGNORE INTO payments
      SELECT ?, ?, 'working', NULL, NULL, ?
      WHERE (SELECT count(*) FROM payments) < ? RETURNING payment_key`,
      key, fingerprint, Date.now(), CAP).toArray();
    if (!claim.length) return lookup() ? error(409, "payment_retry") : error(429, "testnet_cap_reached");

    let analysis: string;
    try {
      analysis = JSON.stringify(await analyzeGraph(graph));
    } catch {
      sql.exec("DELETE FROM payments WHERE payment_key = ? AND phase = 'working'", key);
      return error(502, "analysis_unavailable_no_settlement_attempted");
    }
    if (!availableWindow(auth)) {
      sql.exec("DELETE FROM payments WHERE payment_key = ? AND phase = 'working'", key);
      return error(402, "insufficient_time_for_settlement");
    }

    // Commit the pending state before submitting external payment. Never resubmit an uncertain transfer.
    sql.exec("UPDATE payments SET phase = 'submitting', analysis = ? WHERE payment_key = ?", analysis, key);
    await this.ctx.storage.sync();
    try {
      const settlement = await client.settle(proof, expected);
      if (!confirmed(settlement, auth.from)) return error(503, "settlement_pending_reconciliation");
      sql.exec("UPDATE payments SET phase = 'submitted', settlement = ? WHERE payment_key = ?",
        JSON.stringify(settlement), key);
    } catch {
      return error(503, "settlement_pending_reconciliation");
    }
    return this.deliver(lookup(), payment);
  }

  private async deliver(entry: Entry, payment: Proof): Promise<Outcome> {
    const settlement: SettleResponse = JSON.parse(entry.settlement!);
    if (entry.phase === "submitted") {
      try {
        if (!await verifyReceipt(settlement.transaction, payment.auth)) return error(503, "receipt_pending");
      } catch {
        return error(503, "receipt_pending");
      }
      this.ctx.storage.sql.exec("UPDATE payments SET phase = 'ready' WHERE payment_key = ?", payment.key);
      await this.ctx.storage.sync();
    }
    return { status: 200, analysis: JSON.parse(entry.analysis!), settlement };
  }
}

async function paid(graph: Graph, token: unknown, recipient: string, env: Bindings): Promise<Outcome> {
  const proof = parseProof(token, recipient);
  if (!proof) return error(402, "invalid_payment_proof");
  return env.PAYMENTS.getByName("isolated-sepolia-run").execute(proof, graph, recipient);
}

function recipientIfReady(env: Bindings) {
  const recipient = env.X402_RECIPIENT.trim();
  if (env.X402_ENABLED !== "true" || !address.safeParse(recipient).success ||
    /^0x0{40}$/i.test(recipient) || !env.STAGING_ACCESS_TOKEN || env.STAGING_ACCESS_TOKEN.length < 32) return null;
  return recipient;
}

async function authorized(request: Request, secret: string | undefined) {
  const supplied = request.headers.get("authorization");
  if (!secret || !supplied?.startsWith("Bearer ") || supplied.length > 256) return false;
  const [hash, expected] = await Promise.all([sha256(supplied.slice(7)), sha256(secret)]);
  let difference = 0;
  for (let i = 0; i < hash.length; i++) difference |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

const invalidMcp = (code: string) => ({
  isError: true,
  content: [{ type: "text" as const, text: code }],
});

async function handleMcp(request: Request, body: unknown, recipient: string, env: Bindings) {
  const server = new McpServer({ name: "oseille-dependency-radar-sepolia", version: "0.1.0" });
  server.registerTool(TOOL_NAME, {
    description: DESCRIPTION,
    inputSchema: graphShape,
    annotations: { readOnlyHint: true, openWorldHint: true },
    _meta: { "agents-x402/paymentRequired": true, "agents-x402/priceUSD": Number(AMOUNT) / 1e6 },
  }, async (graph, extra) => {
    try { mapGraph(graph); } catch { return invalidMcp("invalid_dependency_graph"); }
    const token = extra._meta?.["x402/payment"] ?? request.headers.get("payment-signature");
    const quote = challenge(recipient, `x402://${TOOL_NAME}`);
    if (token == null) return {
      ...invalidMcp("PAYMENT_REQUIRED"), _meta: { "x402/error": quote },
    };
    const result = await paid(graph, token, recipient, env);
    if (result.status === 402) return {
      ...invalidMcp(result.error), _meta: { "x402/error": { ...quote, error: result.error } },
    };
    if (result.status !== 200) return invalidMcp(result.error);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result.analysis) }],
      structuredContent: result.analysis,
      _meta: { "x402/payment-response": result.settlement },
    };
  });
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  await server.connect(transport);
  try { return await transport.handleRequest(request, { parsedBody: body }); }
  finally { await server.close(); }
}

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    const path = new URL(request.url).pathname;
    const recipient = recipientIfReady(env);
    if (path === "/health" && request.method === "GET") {
      return json({ ok: true, service: "oseille-x402-sepolia-staging", network: NETWORK, testnet_enabled: Boolean(recipient) });
    }
    if (path === "/readiness" && request.method === "GET") {
      return json({ ready: Boolean(recipient), network: NETWORK }, recipient ? 200 : 503);
    }
    if (path !== PAY_PATH && path !== "/mcp") return json({ error: "not_found" }, 404);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { allow: "POST" });
    if (!recipient || !await authorized(request, env.STAGING_ACCESS_TOKEN)) return json({ error: "not_found" }, 404);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return json({ error: "json_required" }, 415);
    }
    let body: unknown;
    try {
      body = JSON.parse(await readBounded(request.body, MAX_BODY));
    } catch (cause) {
      const tooLarge = cause instanceof RangeError;
      return json({ error: tooLarge ? "body_too_large" : "invalid_json" }, tooLarge ? 413 : 400);
    }
    if (path === "/mcp") {
      const response = await handleMcp(request, body, recipient, env);
      const headers = new Headers(response.headers);
      Object.entries(PRIVATE).forEach(([key, value]) => headers.set(key, value));
      return new Response(response.body, { status: response.status, headers });
    }
    const parsed = graphSchema.safeParse(body);
    if (!parsed.success) return json({ error: "invalid_dependency_graph" }, 400);
    try { mapGraph(parsed.data); } catch { return json({ error: "invalid_dependency_graph" }, 400); }
    const token = request.headers.get("payment-signature");
    const result = token === null ? error(402, "PAYMENT_REQUIRED") : await paid(parsed.data, token, recipient, env);
    if (result.status === 402) {
      const quote = { ...challenge(recipient, new URL(path, request.url).toString()), error: result.error };
      return json(quote, 402, { "payment-required": encodePaymentRequiredHeader(quote) });
    }
    if (result.status !== 200) return json({ error: result.error }, result.status);
    return json(result.analysis, 200, { "payment-response": encodePaymentResponseHeader(result.settlement) });
  },
};
