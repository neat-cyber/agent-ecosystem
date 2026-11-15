import assert from "node:assert/strict";
import { test } from "node:test";
import { decodePaymentRequiredHeader, decodePaymentResponseHeader, encodePaymentSignatureHeader } from "@x402/core/http";
import { convertV4MiniflareOptions, Miniflare, Response } from "miniflare";
import { generatePrivateKey } from "viem/accounts";
import { encodeAbiParameters, padHex, toEventSelector } from "viem";
import { ASSET, NETWORK, parseProof } from "../src/payment.ts";
import { GRAPH, RECIPIENT, sign, TEST_TOKEN } from "./fixture.mjs";

const tx = `0x${"a".repeat(64)}`;
const options = {
  compatibilityDate: "2026-11-15",
  modules: true,
  scriptPath: ".wrangler/bundle/index.js",
  durableObjects: { PAYMENTS: { className: "TestnetPayments", useSQLite: true } },
  bindings: { X402_ENABLED: "true", X402_RECIPIENT: RECIPIENT, STAGING_ACCESS_TOKEN: TEST_TOKEN },
};
const base = "http://localhost";

test("Worker validates the graph, verifies, analyzes, settles, checks receipt, and replays safely", async t => {
  let settles = 0;
  let verified = 0;
  let analyses = 0;
  let receipts = 0;
  let failOsv = false;
  let failReceipt = false;
  let failSettlement = false;
  let auth;
  const secondTx = `0x${"b".repeat(64)}`;
  const wrongTx = `0x${"c".repeat(64)}`;
  const mf = new Miniflare(convertV4MiniflareOptions({ ...options, async outboundService(request) {
    const url = new URL(request.url);
    if (url.hostname === "x402.org") {
      const input = await request.json();
      auth = input.paymentPayload.payload.authorization;
      if (url.pathname.endsWith("/verify")) {
        verified++;
        return Response.json({ isValid: true, payer: auth.from });
      }
      assert.match(url.pathname, /\/settle$/);
      settles++;
      if (failSettlement) return new Response("timeout", { status: 504 });
      return Response.json({ success: true, transaction: tx, network: NETWORK, payer: auth.from });
    }
    if (url.hostname === "api.osv.dev") {
      analyses++;
      assert.equal((await request.json()).queries.length, GRAPH.nodes.length);
      if (failOsv) return new Response("unavailable", { status: 503 });
      return Response.json({ results: [{}, { vulns: [{ id: "GHSA-example" }] }] });
    }
    assert.equal(url.hostname, "sepolia.base.org");
    receipts++;
    const { params: [requestedTx] } = await request.json();
    if (failReceipt) return Response.json({ result: null });
    const actualTx = failSettlement ? secondTx : tx;
    return Response.json({
      result: {
        status: "0x1", transactionHash: requestedTx,
        logs: [{
          address: ASSET, topics: [toEventSelector("AuthorizationUsed(address,bytes32)"), padHex(auth.from.toLowerCase()),
            requestedTx === actualTx ? auth.nonce : `0x${"0".repeat(64)}`],
          data: "0x",
        }, {
          address: ASSET,
          topics: [toEventSelector("Transfer(address,address,uint256)"), padHex(auth.from.toLowerCase()), padHex(auth.to.toLowerCase())],
          data: encodeAbiParameters([{ type: "uint256" }], [BigInt(auth.value)]),
        }],
      },
    });
  }}));
  t.after(() => mf.dispose());
  const headers = { authorization: `Bearer ${TEST_TOKEN}`, "content-type": "application/json" };
  const send = (graph = GRAPH, payment, recoveryTx) => mf.dispatchFetch(`${base}/v1/dependency-graph-review`, {
    method: "POST", body: JSON.stringify(graph), headers: {
      ...headers, ...(payment ? { "payment-signature": payment } : {}),
      ...(recoveryTx ? { "payment-recovery-transaction": recoveryTx } : {}),
    },
  });
  const mcp = (method, params) => mf.dispatchFetch(`${base}/mcp`, {
    method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    headers: { ...headers, accept: "application/json, text/event-stream" },
  });
  const hidden = await mf.dispatchFetch(`${base}/v1/dependency-graph-review`, { method: "POST" });
  assert.equal(hidden.status, 404);
  assert.equal((await send({ ...GRAPH, roots: ["unknown"] })).status, 400);
  const oversized = await mf.dispatchFetch(`${base}/v1/dependency-graph-review`, {
    method: "POST", body: " ".repeat(48_001), headers,
  });
  assert.equal(oversized.status, 413);

  const first = await send();
  assert.equal(first.status, 402);
  assert.equal(first.headers.get("cache-control"), "private, no-store");
  const quote = decodePaymentRequiredHeader(first.headers.get("payment-required"));
  assert.equal(quote.accepts[0].amount, "50000");
  const tools = await (await mcp("tools/list", {})).json();
  assert.equal(tools.result.tools[0].name, "dependency_graph_review");
  const mcpChallenge = await (await mcp("tools/call", { name: "dependency_graph_review", arguments: GRAPH })).json();
  assert.equal(mcpChallenge.result._meta["x402/error"].error, "PAYMENT_REQUIRED");
  assert.equal((await send(GRAPH, "invalid")).status, 402);
  assert.equal(verified, 0);

  const key = generatePrivateKey();
  const signedProof = await sign(quote, key);
  const signature = encodePaymentSignatureHeader(signedProof);
  assert.ok(parseProof(signature, RECIPIENT));
  assert.equal((await send(GRAPH, signature, tx)).status, 409);
  assert.equal((await send(GRAPH, signature, "bad-hash")).status, 400);
  assert.equal(verified, 0);
  failOsv = true;
  assert.equal((await send(GRAPH, signature)).status, 502);
  assert.equal(settles, 0);
  failOsv = false;
  failReceipt = true;
  const simultaneous = await Promise.all([send(GRAPH, signature), send(GRAPH, signature)]);
  const outcomes = await Promise.all(simultaneous.map(async response => [response.status, await response.clone().text()]));
  assert.ok(simultaneous.every(response => response.status === 409 || response.status === 503), JSON.stringify(outcomes));
  assert.equal(settles, 1);
  assert.ok(receipts >= 1);
  failReceipt = false;

  const granted = await send(GRAPH, signature);
  assert.equal(granted.status, 200);
  assert.equal(decodePaymentResponseHeader(granted.headers.get("payment-response")).transaction, tx);
  const report = await granted.json();
  assert.deepEqual(report.findings[0].paths, [["fixture", "nested"]]);
  assert.deepEqual(report.findings[0].directAncestors, ["fixture"]);
  assert.equal((await send(GRAPH, signature)).status, 200);
  assert.equal((await send({ ...GRAPH, nodes: GRAPH.nodes.toReversed() }, signature)).status, 409);
  assert.equal(settles, 1);
  assert.equal(analyses, 2);

  failSettlement = true;
  const second = encodePaymentSignatureHeader(await sign(quote, key));
  assert.equal((await send(GRAPH, second)).status, 503);
  assert.equal((await send(GRAPH, second)).status, 409);
  assert.equal((await send(GRAPH, second, wrongTx)).status, 409);
  const recovered = await send(GRAPH, second, secondTx);
  assert.equal(recovered.status, 200);
  assert.equal(decodePaymentResponseHeader(recovered.headers.get("payment-response")).transaction, secondTx);
  assert.deepEqual((await recovered.json()).findings, report.findings);
  assert.equal((await send(GRAPH, second)).status, 200);
  assert.equal(settles, 2);

  const mcpReplay = await (await mcp("tools/call", {
    name: "dependency_graph_review", arguments: GRAPH, _meta: { "x402/payment": signature },
  })).json();
  assert.equal(mcpReplay.result._meta["x402/payment-response"].transaction, tx);
  assert.equal(settles, 2);
});
