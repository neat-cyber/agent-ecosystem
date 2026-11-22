# V5 release — 22 November 2026

This release record supersedes the pre-release/draft statuses in AUDIT.md and STAGING-ACCEPTANCE.md. The owner explicitly authorized proceeding after the V5 review.

## Validation and production

33 deterministic tests and the GitHub validation workflow passed. Two staging suites passed 28/28 checks each, the second asserting the V5 business fields on all four services. All 16 unique signed acceptance requests were found in the staging D1 databases as internal tests. Premium challenge, native MCP challenge, wrong-network rejection and invalid graph checks passed. No token was created.

The existing authenticated relay was temporarily enabled with a maximum 30-minute expiry, fixed staging service bindings and a fixed endpoint allowlist, then disabled. Its previous version was restored. Both public routing and previews are disabled; the endpoint returned HTTP 404 after closure.

The four V5 production candidates were then deployed with existing secrets, D1/service bindings, flags and free tools preserved. The post-deployment suite passed 20/20 public checks, including initialize, tools/list, one real business call and intentional invalid-tool call per agent. The business checks asserted the new CI/repair/coverage fields. All 16 signed post-deployment MCP requests were recorded in production D1 as verified_internal_test. No external adoption is claimed.

| Agent | Active V5 version | Previous rollback version |
|---|---|---|
| Guardian | 210a497c-af5e-4891-bc73-ffdd04f75d96 | 584443aa-b55a-4213-953b-38ebfc5ab815 |
| Repair | b5b1070b-8bd7-487d-bf3b-6376e8ca0703 | 931d11df-f092-46d0-a4d8-f32a1f2f2956 |
| Signals | e18f6d76-6044-4b5d-8a91-35ab1faaf8cc | 4096dce7-8e7d-4bf5-9cf3-9273d52ec206 |
| Radar | 2d6deac0-2a0d-42c2-a1df-2e95d9e6ea98 | 2f02856c-400b-49a8-bb89-4a6a03cbab68 |

Private code PR #3 was merged with the expected-head guard. Tested source commit: b99b48c692114bfb75f88b9dcdfcd6f7a51eda71; merge commit: 9f02cf90ac570da51c492efa8be396c9c559f228. Returning any Worker to its previous version remains reversible without deleting telemetry.

## Monetization verdict

Real billing remains disabled. A read-only RPC query confirmed Base Sepolia chain 84532 and zero test USDC in the configured test payer, address 0x5784C22E195005A08a980BDcAbe6B72A42aB948f. No payment authorization was signed or submitted. Test USDC previously requested for another address does not establish this payer's balance.

Technical readiness still needs a funded test payer, a full x402 settlement on Base Sepolia, independent receipt verification, delivered result and an exact replay proving no second charge. A real commercial launch also needs beneficiary ownership, provider costs and billing/fiscal handling verified. Demand remains unproven: no independent team enrolled or written willingness to pay established.

There is no justified calendar date for profitability. The next technical milestone can occur once the test wallet is funded and the complete acceptance flow passes; allow a 14-day pilot from the first genuine independent task to assess demand, without promising success or revenue. No mainnet fallback, new paid service or real charge was activated.
