# OSEILLE x402 isolated staging skeleton

**Not an operational x402 payment endpoint.** This Worker exposes only `GET /health` and `GET /readiness`. It cannot charge or accept money. Production services are unchanged.

The next code change must integrate the official Cloudflare Agents SDK `withX402` and `paidTool` with a separate premium Radar analysis, a pinned tested dependency set, Base Sepolia facilitator and an approved test-wallet recipient. Do not expose a fake 402 challenge or count a challenge as revenue.

Run `npm install`, `npm run check`, `npm test` and `npm run deploy` only after confirming Cloudflare Free plan quotas and SDK versions. `X402_ENABLED` must stay false in this skeleton. This repository branch is not deployed automatically.

See [the staging plan](../docs/X402_STAGING_PLAN.md).
