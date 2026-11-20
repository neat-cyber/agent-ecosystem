# Discovery and pilot outreach

Updated 20 November 2026 UTC. This journal records publisher outreach and external acknowledgements. Business use is measured separately in the [public usage endpoint](https://agent-ecosystem.saromy-export.workers.dev/metrics).

| Destination | Services | Action | Verified result |
| --- | --- | --- | --- |
| AgentSearch | Agent Guardian | Submitted through its documented free API at `2026-11-20T10:11:40.265970+00:00` | HTTP 200, `submitted=true`, reachability `alive`. [Returned profile link](https://agentsearch.luthersystems.com/found-agent?url=https%3A%2F%2Fagent-guardian.saromy-export.workers.dev&name=Agent%20Guardian) |
| AgentSearch | Agent Repair | Submitted through its documented free API at `2026-11-20T10:12:02.121181+00:00` | HTTP 200, `submitted=true`, reachability `alive`. [Returned profile link](https://agentsearch.luthersystems.com/found-agent?url=https%3A%2F%2Fagent-repair.saromy-export.workers.dev&name=Agent%20Repair) |
| AgentSearch | Agent Signals | Submitted through its documented free API at `2026-11-20T10:12:07.618755+00:00` | HTTP 200, `submitted=true`, reachability `alive`. [Returned profile link](https://agentsearch.luthersystems.com/found-agent?url=https%3A%2F%2Fagent-signals.saromy-export.workers.dev&name=Agent%20Signals) |
| AgentSearch | Agent Dependency Radar | Submitted through its documented free API at `2026-11-20T10:12:12.971022+00:00` | HTTP 200, `submitted=true`, reachability `alive`. [Returned profile link](https://agentsearch.luthersystems.com/found-agent?url=https%3A%2F%2Fagent-dependency-radar.saromy-export.workers.dev&name=Agent%20Dependency%20Radar) |
| DomainScope / Awesome Live MCP Servers | All four | Submitted the public endpoints, examples and limits | [Submission #16](https://github.com/baditaflorin/awesome-live-mcp-servers/issues/16) is open. Listing acceptance is pending. |

AgentSearch returned null reputation and capability scores, and said the next daily crawl would fold the submissions into its ranked index. Its acknowledgement establishes receipt and a reachability probe. Independent use and a final ranking remain to be observed.

The BrethofAI directory accepts listing suggestions through issues. Our integration received HTTP 403 before creation. The browser fallback required GitHub sign-in. No issue was created there. Two potential agent communication channels were also unavailable during inspection, with Adam Network returning HTTP 404 and Anansi Haven returning HTTP 403. No message was published on either channel.

## Current public integration

- [Public hub](https://agent-ecosystem.saromy-export.workers.dev/)
- [Four task examples](https://agent-ecosystem.saromy-export.workers.dev/examples.json)
- [Cursor configuration](../mcp-config.json)
- [Codex configuration](../codex-config.toml)
- [Voluntary pilot feedback](https://github.com/neat-cyber/agent-ecosystem/issues/new?template=pilot-feedback.yml)

The publisher's signed checks passed 41 service checks and four further example calls on 20 November. These calls are classified as internal tests. The authoritative public counter reported zero verified external calls at the post-deployment check. Anonymous calls remain unattributed.

## Pilot success criteria

The 14-day observation window begins with the first voluntary independent task. We seek three independent teams trying Dependency Radar, two returning for a later decision, and one describing in writing a concrete advanced analysis they would pay 0.05 USDC for. A pilot report can supply a redacted result, a time and a decision. The operator reviews attribution evidence before classifying external use.

The existing daily private report checks submission replies, pilot feedback and subsequent usage. Follow-up messages are reviewed individually. Public tools remain available without a payment. Premium testnet validation and any future mainnet decision are recorded separately in the technical audit.

## Verified pilot setup, 20 November 2026

The [five-minute pilot guide](https://agent-ecosystem.saromy-export.workers.dev/pilot), [optional invitation request](https://github.com/neat-cyber/agent-ecosystem/issues/new?template=pilot-request.yml), local lockfile-selection client and [business recurrence measurements](https://agent-ecosystem.saromy-export.workers.dev/adoption.json) are live. Radar supports reviewed, expiring attribution tokens; anonymous calls remain unknown. No production participant has been enrolled.

[Public recruitment invitation #2](https://github.com/neat-cyber/agent-ecosystem/issues/2) was opened by the publisher at 16:16:34 UTC. This invitation is outreach, not an independent pilot report. [Three targeted drafts](OUTREACH-DRAFTS.md) are ready for channel/content review and have not been sent. Cline's explicit submission checks still require an actual Cline setup test and logo; no Cline submission is claimed.

[Release evidence and rollback](PILOT-RELEASE.md) records local tests, private staging attribution checks, signed production checks, active versions and post-deployment results. The existing daily private report now reviews pilot requests and recurrence without automatic token issuance or outreach.
