# OSEILLE × x402 staging

The staging implementation and runbook are in [x402-staging](../x402-staging/README.md). The four production services are free. No mainnet settlement route exists in the staging Worker.

The implementation uses x402 v2 `exact` and MCP SDK v1 with a paid-tool metadata exchange, plus a standard HTTP 402 route. The official x402 SDK handles encoding, verification and settlement with x402.org. The Worker owns the payment lifecycle so the analysis is prepared before settlement, a persistent nonce claim prevents duplicate submission, and a successful Base Sepolia USDC receipt is required before release. The graph review is isolated from the free preflight and does not read the production database.

Before enabling the test Worker remotely, confirm the account's no-cost conditions and fund a separate payer using test USDC. The acceptance test needs the transaction hash, the matching USDC transfer and authorization nonce on Base Sepolia, the delivered analysis and an idempotent replay.

Before production, add reconciliation and customer recovery for settlements with unknown outcome, agree retention and deletion with the operator, validate billing and spend limits, capture repeat opt-in external use and willingness to pay, and obtain separate explicit approval for network, token, recipient, provider, price and caps.
