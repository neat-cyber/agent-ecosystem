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

## Prepare a graph from an npm lockfile

Run these commands from an npm project with a valid lockfile. The first command must succeed. The second reads its local output and accepts one or more direct dependency names. It prints only names, resolved versions, and opaque graph IDs. Review the result and share only public package metadata. The helper skips network access and does not invoke installation or lifecycle commands.

```sh
npm ls --all --long --package-lock-only --json > npm-tree.local.json
node /path/to/x402-staging/scripts/npm-graph.mjs async < npm-tree.local.json > radar-graph.json
```

Keep the intermediate npm tree local. It can contain paths or registry URLs. The graph covers the selected branches as represented by npm, including optional or development dependencies that appear in that tree. Choose a small branch for the pilot. An unresolved, private-registry, or oversized branch is rejected instead of being presented as an exhaustive review.

## Recover an analysis after an uncertain testnet settlement

If the facilitator connection failed after submission and you have the confirmed transaction hash, retry the HTTP request with the same graph and original `PAYMENT-SIGNATURE`. Include the hash as `Payment-Recovery-Transaction`. The Worker checks Base Sepolia for the matching USDC authorization and transfer. A valid receipt returns the stored report without resubmitting payment. A recovery request never starts a new settlement.

Keep the original signature private. If the hash is unknown, find the corresponding authorization and transfer on Base Sepolia or obtain it from the facilitator before retrying recovery. This HTTP recovery path does not automatically discover a missing hash.

## Read-only CDP credentials preflight

On an operator machine, provide `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` through a private environment, then run `node scripts/check-cdp.mjs`. For example, Node 22+ can load an owner-only environment file outside the checkout with `node --env-file=/private/path/cdp.env scripts/check-cdp.mjs`. The check only makes a signed GET to Coinbase's x402 supported-kinds endpoint. It does not call verify or settle and does not print the credential or the token. A successful check confirms authenticated capability discovery, not that a real payment settles or that production is enabled.

Keep the key out of Git and logs. Do not put production credentials into the existing Sepolia Worker. When the separate disabled production Worker is ready and the account's costs have been checked, store the production credentials in that Worker's secret bindings.
