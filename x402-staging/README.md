# Dependency Radar x402 on Base Sepolia

An isolated staging Worker for `dependency_graph_review`, available over MCP Streamable HTTP and HTTP POST. The analysis identifies known OSV advisories in supplied resolved npm dependencies, including transitives, and gives a shortest path per affected direct root. The four free production services keep their current endpoints.

## Run locally

Use Node.js 24. Run `npm ci`, `npm run check`, and `npm test` from this directory. The tests use a local Worker and Durable Object, real SDK signatures, plus simulated facilitator, OSV, and RPC responses. They do not move any tokens.

`node scripts/testnet.mjs --probe` accesses Base Sepolia, x402.org and OSV. It verifies the free facilitator capability and submits an unfunded signature to the facilitator's **verify** endpoint. It never calls **settle**.

## Run the on-chain test

1. Use two separate test-only EVM addresses. Use the [Circle testnet faucet](https://faucet.circle.com/) to fund the payer with Base Sepolia test USDC.
2. Supply `X402_ENABLED=true`, `X402_RECIPIENT=<test-recipient>`, and a secret `STAGING_ACCESS_TOKEN` of at least 32 characters. Use an untracked `.dev.vars` for local Wrangler. Defaults keep paid routes disabled. A remote run requires a confirmed zero-cost test environment. Deploy only the separately named staging Worker with its own SQLite Durable Object and no production binding, route, or domain.
3. With `TESTNET_WORKER_URL`, `TESTNET_RECIPIENT`, `STAGING_ACCESS_TOKEN`, and `TESTNET_SIGNER_KEY` supplied privately through the environment, run `node scripts/testnet.mjs --settle-testnet`. The client checks the chain, token, amount and recipient before signing. Keep the printed transaction hash and analysis as evidence. The signer key and access token never belong in Git or in the evidence.

Input for `POST /v1/dependency-graph-review` or the MCP tool `dependency_graph_review`:

```json
{
  "roots": ["async"],
  "nodes": [
    {"id":"async","name":"async","version":"2.6.3","dependencies":["lodash"]},
    {"id":"lodash","name":"lodash","version":"4.17.20","dependencies":[]}
  ]
}
```

The JSON payload must describe a resolved graph, with up to 10 roots, 40 nodes, and 200 edges. Derive edges from a lockfile. Locations or opaque IDs can distinguish instances of the same package. Use public npm names. OSV receives only package names and versions. Findings cover only supplied nodes and matched OSV records. Incomplete upstream results fail before a settlement attempt.

The HTTP route returns a v2 `PAYMENT-REQUIRED` header with HTTP 402; the MCP result carries `_meta["x402/error"]`. Retry with the signed `PAYMENT-SIGNATURE` header or MCP `_meta["x402/payment"]`. On success, the receipt and analysis can be read again using the same proof and exact graph. Keep proofs private. The test ledger accepts at most ten payment claims and stores results and receipts without raw keys or signed proofs. If settlement is uncertain, reconcile it via the Base Sepolia USDC nonce and transfer logs before considering any fresh payment. A submitted transaction with a temporarily unavailable receipt can be retried with the same proof without submitting it again.

This staging application fixes the network, currency, amount, and facilitator in source. Production operation requires separate approval and production-specific operational controls.
