# Acceptance before production

Current state: code draft PR #3, deterministic tests and GitHub validation pass; no production deploy.

1. Review source synchronization and new product fields separately. Preserve active observability, signed test identity and budget bindings.
2. Build V5 candidates for each existing staging Worker from its own source. Preserve Radar staging premium modules, beneficiary and testnet-only settings; do not upload the free-only production entrypoint over premium staging.
3. Agree on private staging invocation access. Existing authenticated relay is closed. If the owner approves temporary relay activation, set an expiry of no more than 30 minutes, keep existing credential protection and endpoint allowlist, disable public previews, then close the route after checks. Do not create or distribute a new token.
4. Run initialize, tools/list and one real business call for each service, plus invalid inputs and unknown tools. Correlate every signed MCP event with D1. Assert the new structured product fields and old response fields. A failed target observation or incomplete upstream result must remain distinct from HTTP success.
5. Repeat the synthetic BOAMP malformed-deadline/HTML/partial-source tests without external requests. Measure client and Worker latency separately, record sample counts and cache hits. Do not run a load test on public upstreams.
6. On Base Sepolia only, first verify chain, asset, recipient control, allowed test payer and facilitator terms; then challenge, authorized test payment, independent transaction receipt, result, exact replay, changed-input refusal and lost-response recovery. Preserve evidence, never secrets. No mainnet fallback.
7. Submit concrete staging evidence, exact candidate version IDs, deployment order and rollback to the owner for production approval. Approval of a PR is not activation of real billing or authorization to contact communities.
