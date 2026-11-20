# Agent Ecosystem

Four free hosted MCP services for coding agents and research workflows. Connect an HTTPS endpoint, discover its tools, and run a concrete task.

[Open the public hub](https://agent-ecosystem.saromy-export.workers.dev/) · [Download Cursor configuration](mcp-config.json) · [Download Codex configuration](codex-config.toml) · [Read the HTTP quickstart](docs/QUICKSTART.md)

| Your next task | Service | Main tool | What you get |
| --- | --- | --- | --- |
| Review a dependency before release | Agent Dependency Radar | `release_gate` | Registry-verified versions, OSV advisory records and a review decision for up to three pinned npm/PyPI releases. |
| Check a changed tool contract | Agent Guardian | `audit_mcp_contracts` | Schema findings, a fingerprint and potentially breaking changes against a previous descriptor. |
| Understand a failed tool call | Agent Repair | `diagnose_tool_failure` | An error category and bounded next steps based on HTTP status or a redacted message. |
| Find French public tenders | Agent Signals | `search_public_tenders` | Matching BOAMP notices with buyer, dates and official source references. |

## Connect

All four servers use MCP Streamable HTTP. The free beta tools require no account or API key. Approve the external connection in your MCP client.

```json
{
  "mcpServers": {
    "guardian": {"url": "https://agent-guardian.saromy-export.workers.dev/mcp"},
    "repair": {"url": "https://agent-repair.saromy-export.workers.dev/mcp"},
    "signals": {"url": "https://agent-signals.saromy-export.workers.dev/mcp"},
    "radar": {"url": "https://agent-dependency-radar.saromy-export.workers.dev/mcp"}
  }
}
```

This JSON uses Cursor's configuration shape. Codex users can copy the entries in [codex-config.toml](codex-config.toml). Other clients may use a different configuration shape. Call `tools/list` after connecting to obtain the current input schemas.

## Try a task

For a dependency review, call Agent Dependency Radar with this request.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "release_gate",
    "arguments": {
      "packages": [
        {"ecosystem": "npm", "package_name": "lodash", "version": "4.17.15"}
      ]
    }
  }
}
```

Read `decision`, `evaluated`, the advisory records and source completeness. A result marked `incomplete_needs_review` needs follow-up. OSV coverage and software compatibility require review before any upgrade. Each supplied package must have an exact version.

The [examples.json](examples.json) file provides one task per service, its endpoint, request, expected response fields and limits. The public hub includes the same examples and a copy button.

## Join the Dependency Radar pilot

We are looking for three independent teams to try a dependency review on a real release decision, with two teams returning for a later decision. We also want to learn whether an advanced analysis would be worth 0.05 USDC per call for a specific use case.

Use the free tools first, then [submit redacted feedback](https://github.com/neat-cyber/agent-ecosystem/issues/new?template=pilot-feedback.yml). Share the finding and the decision it helped you make. Public feedback is optional. The advanced payment flow is an experiment on a separate private Base Sepolia service.

## Limits and data handling

- Dependency Radar accepts up to three pinned package versions per `release_gate` call, uses a cache and has a shared budget of 120 uncached checks per UTC day. Supply each dependency to be checked explicitly.
- Signals searches the DILA BOAMP source and has a shared limit of 30 searches per rolling 24 hours. Results can be empty or incomplete.
- Guardian checks a schema subset. Its health demonstrations concern a project-owned target.
- Repair provides deterministic diagnostics and a constrained JSON Schema argument check.
- Send public identifiers and redacted descriptors or errors. Keep credentials and private source code in your own systems.

Recorded MCP events contain service, tool, outcome, time, duration, version and origin classification. [Privacy details](docs/PRIVACY.md) describe the collection boundaries.

## Discovery and evidence

- [Live catalog](https://agent-ecosystem.saromy-export.workers.dev/catalog.json)
- [Agent-readable instructions](https://agent-ecosystem.saromy-export.workers.dev/llms.txt)
- [Measured usage](https://agent-ecosystem.saromy-export.workers.dev/metrics), with authenticated internal tests, declared tests, probes, unknown calls and verified external calls
- [Glama listings](https://glama.ai/mcp/connectors?query=io.github.neat-cyber)
- [Tools and source descriptions](docs/TOOLS.md)
- [Report an operational problem](https://github.com/neat-cyber/agent-ecosystem/issues)

An anonymous successful call establishes that an operation ran. Independent consumers and recurring use require additional attribution evidence. Public directory submissions are tracked as outreach.

This repository contains public documentation, client configuration and the public hub source. The four hosted services are experimental and maintained by neat-cyber.
