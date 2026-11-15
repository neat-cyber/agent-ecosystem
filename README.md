# Agent Ecosystem — Remote MCP Tools for AI Agents

**Four free, hosted MCP services for developers and AI agents:** validate tool contracts, diagnose failures, inspect software dependency advisories, and search French public procurement notices.

> **Status:** experimental public services, running on Cloudflare Workers. No customer subscriptions, payment collection, or verified independent paid users. This repository contains **documentation and public connection details only** — not the private implementation.

## Start here

**Product hub:** https://agent-ecosystem.saromy-export.workers.dev/

**Machine-readable service catalog:** https://agent-ecosystem.saromy-export.workers.dev/catalog.json

**Real usage / payment status:** https://agent-ecosystem.saromy-export.workers.dev/metrics

| Service | Remote MCP endpoint | Agent use case |
| --- | --- | --- |
| **Agent Guardian** | `https://agent-guardian.saromy-export.workers.dev/mcp` | Audit supplied MCP `tools/list` contracts and flag possible breaking schema changes. Owned-target health demos are not third-party uptime monitoring. |
| **Agent Repair** | `https://agent-repair.saromy-export.workers.dev/mcp` | Classify common HTTP/MCP failures and check argument objects against a **limited** JSON Schema subset. |
| **Agent Signals** | `https://agent-signals.saromy-export.workers.dev/mcp` | Search public French BOAMP procurement notices with source references; incomplete public-data beta, not a complete procurement search. |
| **Agent Dependency Radar** | `https://agent-dependency-radar.saromy-export.workers.dev/mcp` | Check exact npm/PyPI package versions against official registries and known OSV advisories. `release_gate` checks up to three direct dependencies per call. |

### A coding agent can use these tools to

- Check whether an updated MCP tool schema introduced a new required argument — **Guardian**.
- Explain an HTTP `429` or an invalid tool-call argument — **Repair**.
- Compare known OSV advisories for a pinned package versus the latest published version — **Dependency Radar**.
- Search recent French public tender notices by keywords — **Signals**.

Each service can suggest other relevant services through `ecosystem_catalog`; suggestions are optional, never forced, and do **not** automatically invoke a paid operation.

## Connect from an MCP-compatible client

All four endpoints use remote **MCP Streamable HTTP**. Configure your client with one of the HTTPS `/mcp` URLs above; call `tools/list` to see the actual, current schemas. Example JSON-RPC requests are in [Quickstart](docs/QUICKSTART.md).

No authentication token or subscription is required for the currently free beta tools. **Do not send API keys, passwords, private repository content, or sensitive errors.** Some tools use public data and enforce conservative limits.

## Official MCP Registry

Our independently named listings are published in the official registry:

- [Agent Guardian](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.neat-cyber%2Fagent-guardian)
- [Agent Repair](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.neat-cyber%2Fagent-repair)
- [Agent Signals](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.neat-cyber%2Fagent-signals)
- [Agent Dependency Radar](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.neat-cyber%2Fagent-dependency-radar)

Registry presence is **not** proof of active external users, autonomous agent discovery, or commercial demand.

## Documentation

- [Quickstart and example MCP requests](docs/QUICKSTART.md)
- [Tools, scope, limitations, and sources](docs/TOOLS.md)
- [Privacy and operational boundaries](docs/PRIVACY.md)
- [Free directory submission checklist](docs/DIRECTORIES.md)
- [Responsible vulnerability reporting](SECURITY.md)
- [Machine-readable static directory snapshot](catalog.json) and [agent-readable summary](llms.txt)

## Why this exists

The goal is to provide **small, reliable, task-specific capabilities** that autonomous agents can discover and reuse. Any future monetization would be clearly advertised as an *optional, metered, pay-per-call* tool with user/operator authorization; **billing is currently disabled**. No earnings or adoption are guaranteed.

*Résumé en français : quatre outils MCP publics et gratuits, utilisables par des agents IA. Le code des Workers reste privé. Pas d'abonnement ni de paiement activé actuellement.*