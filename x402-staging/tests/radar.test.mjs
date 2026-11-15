import assert from "node:assert/strict";
import { test } from "node:test";
import { GRAPH } from "./fixture.mjs";
import { analyzeGraph, mapGraph } from "../src/radar.ts";
import { availableWindow, confirmed, NETWORK, parseProof } from "../src/payment.ts";

test("cycles are bounded; each direct ancestor has one shortest path; dangling nodes are rejected", () => {
  const common = { id: "common", name: "lodash", version: "4.17.20", dependencies: ["a"] };
  const graph = {
    roots: ["a", "b"],
    nodes: [
      { ...common, id: "a", dependencies: ["common"] },
      { ...common, id: "b", dependencies: ["common", "a"] },
      common,
    ],
  };
  assert.deepEqual(mapGraph(graph).get("common"), [["a", "common"], ["b", "common"]]);
  assert.throws(() => mapGraph({ ...graph, roots: ["missing"] }), /unknown_dependency_id/);
  assert.throws(() => mapGraph({ ...GRAPH, nodes: [...GRAPH.nodes, common] }), /unreachable_dependency_id/);
});

test("partial OSV responses fail closed", async () => {
  await assert.rejects(analyzeGraph(GRAPH, async () => Response.json({ results: [{}, { next_page_token: "next" }] })), /osv_incomplete/);
  await assert.rejects(analyzeGraph(GRAPH, async () => Response.json({ results: [{}] })), /osv_incomplete/);
});

test("rejects malformed proofs, future authorizations, expired windows and wrong-chain receipts", () => {
  assert.equal(parseProof("bad-proof", "0x123"), null);
  assert.equal(availableWindow({ validAfter: "0", validBefore: "1100" }, 1000), true);
  assert.equal(availableWindow({ validAfter: "1001", validBefore: "1100" }, 1000), false);
  assert.equal(availableWindow({ validAfter: "0", validBefore: "1020" }, 1000), false);
  assert.equal(confirmed({ success: true, network: "eip155:8453", transaction: `0x${"a".repeat(64)}`, payer: "alice" }, "alice"), false);
  assert.equal(confirmed({ success: true, network: NETWORK, transaction: "fake", payer: "alice" }, "alice"), false);
});
