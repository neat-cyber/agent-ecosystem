# Four services: one useful task each

Public free production tools remain available. The V5 output additions described below are a proposal awaiting deployment approval.

| Service | Agent-readable description | Economic task |
|---|---|---|
| Agent Guardian | Compare current and prior MCP tool contracts before a client or server release. Return static schema findings, compatibility changes and a scoped CI review decision. | Catch an interface incompatibility before it breaks an integration pipeline. |
| Agent Repair | Convert an HTTP/MCP failure into an evidence-based cause category and a proposed repair plan, validation steps and rollback. It never changes a third-party system. | Reduce repeated integration troubleshooting without unsafe retries. |
| Agent Signals | Find selected recent French BOAMP notices with literal title filtering, official source references, deadline state and coverage limits. | Help an SME qualify whether a tender deserves a detailed bid review. |
| Agent Dependency Radar | Review explicitly selected exact npm/PyPI releases against registry evidence and known OSV advisories. Return completeness and a scoped release review signal. | Prevent deploying a known affected pinned release while avoiding claims of full supply-chain coverage. |

## Install and first call

1. Download the existing [four-server client config](https://agent-ecosystem.saromy-export.workers.dev/mcp-config.json) or [Codex TOML](https://agent-ecosystem.saromy-export.workers.dev/codex-config.toml). Review and approve connections in your client.
2. Initialize using MCP Streamable HTTP, then discover `tools/list`. Names and schema are authoritative.
3. Use one [complete executable example](https://agent-ecosystem.saromy-export.workers.dev/examples.json). For real dependency decisions, follow the [five-minute pilot guide](https://agent-ecosystem.saromy-export.workers.dev/pilot). No wallet is required for free tools.

Examples are publisher fixtures, not customer evidence. Source code and tokens stay private. The local `radar-pilot.mjs` client from the hub supports selected direct dependencies in a package-lock v2/v3 without uploading the lockfile.

## Automated decisions

Clients must inspect JSON-RPC errors, `result.isError`, structured business completeness and then policy. HTTP 200 is insufficient. V5 `ci.exit_code` is a caller-side recommendation: 0 only passes the stated subset, 1 requests review and 2 blocks an incomplete or incompatible check. It does not authorize deployment. Store results locally in CI artifacts with secrets removed; never automatically apply Repair patches or use latest-version advice as proof of compatibility.

Guardian `PASS_SUBSET_ONLY` excludes unsupported/nested constraints. Radar `PASS_KNOWN_ADVISORIES_ONLY` covers selected releases and known advisories only, without full transitive or behavioral coverage. Signals invalid/missing deadlines are unknown and need source verification. Repair's plan is a hypothesis from supplied evidence.

## Marketplace package — prepared, not published

Use the descriptions above, current endpoint/config and examples. Disclose that the public repository includes docs, client and hub source while service implementation is private. Glama listings currently exist for all four. Cline #3963 is an inquiry; a real Cline-driven installation test and a 400×400 PNG logo remain outstanding. No installation by Cline has been claimed. Continue/MCP invitations require channel-rule checks, an authenticated session and renewed approval under V5 before posting. AgentSearch GET lookups returned 404 on 22 November; no resubmission occurred.

## Conversion experiment

Discovery requests are aggregate events, not individual visitors. Optional enrollment requires independent-team review, consent, private token delivery and explicit authorization before credential creation. Keep the free path useful. Ask about a real first decision, then a second decision on another day, then whether a specific missing analysis is worth paying for. No invented feedback, paid traffic or automatic outreach.
