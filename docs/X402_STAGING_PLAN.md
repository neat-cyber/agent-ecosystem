# OSEILLE × x402 — staging-only integration plan

Status: **PREPARATION ONLY**. Not deployed. Not a payment integration. No production payments enabled.
Date: 2026-11-15. Owner approval: prepare technical changes and tests, explicitly **without** real payments.

## Boundaries
- Keep all four existing production MCP endpoints and free tools unchanged.
- First candidate: **Agent Dependency Radar**, separate optional advanced analysis. The existing `dependency_preflight` and `release_gate` remain free.
- 0.05 USDC per advanced analysis is a **pricing hypothesis**, not a live price.
- The receiving wallet address is an operator setting, never a private key. Do not hardcode the address in the public repository.
- The operator's EVM wallet supports Base, but possession and control of the address have not been cryptographically verified.
- Test on **base-sepolia** only; do not assume production Base USDC can be sent to Revolut (Revolut currently does not list Base deposits).

## Implementation track (not yet implemented)
1. Preserve and back up the deployed Radar Worker source, its bindings and existing `tools/list` response.
2. Introduce a **separate staging MCP Worker** using the Cloudflare Agents SDK with `withX402` and `paidTool`. Do not swap the live Radar endpoint.
3. Configure `network: "base-sepolia"`, `recipient` via a staging environment variable, and a verified testnet-capable facilitator. Use the documented SDK protocol, never invent custom 402 payloads.
4. Create a useful premium analysis with clearly different output from free Radar. Reject requests that exceed bounded package count, size, latency and external API quotas.
5. Add durable idempotency / replay defense and a transaction ledger before any production rollout; count **verified settlement** separately from challenge and fulfillment.
6. Run an x402-capable test client with explicit spending approval, test USDC only, and a test wallet distinct from the revenue wallet.
7. Validate: no payment -> correct challenge; invalid proof -> rejected; valid settled test payment -> one result; replay -> no duplicate fulfillment; facilitator failure -> no paid work; paid result error -> auditable; free MCP tools unchanged.
8. Verify official registry metadata and discoverability only after a stable staging pass; production requires a **separate explicit approval**.

## Cloudflare reference
https://developers.cloudflare.com/agents/tools/payments/x402/charge-for-mcp-tools/
Cloudflare documents `withX402` / `paidTool`, `base-sepolia` for testing and the Circle test-USDC faucet.
The SDK version and peer dependencies must be pinned and checked before building.

## Evidence ledger fields
`event_id`, `time`, `service`, `tool`, `environment`, `client_classification`, `challenge_issued`, `payment_verified`, `settlement_status`, `chain_id`, `tx_hash`, `amount_atomic`, `token_contract`, `recipient`, `idempotency_key`, `fulfilled`, `error_code`.
No private keys, seeds, auth tokens, raw sensitive request payloads or customer secrets in logs.

## Rollout gates
- G0: all free MCP endpoints still work.
- G1: staging isolated and tested.
- G2: testnet payment verified with on-chain evidence.
- G3: actual external agent has used the free tool with permission.
- G4: operator explicitly approves production address, facilitator, price, network and spending limits.
- G5: only then consider production x402.

## What has been checked
Production Workers: agent-guardian, agent-repair, agent-signals, agent-dependency-radar, agent-ecosystem.
Cloudflare D1 tables: existing tool telemetry is test/self-declared or unattributed, not proven independent customers.
Existing public hub reports payments disabled. Preserve that truthful status.
