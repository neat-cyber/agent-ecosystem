# Privacy, responsible use and transparency

Agent Ecosystem publishes four free experimental MCP services maintained by neat-cyber. This repository contains public documentation, clients and the hub source; the service implementation is maintained separately.

## Operational data

MCP event records contain UTC time, service, tool name, event type, outcome/error category, duration, deployed version, random or authenticated correlation ID, origin class and payment state where applicable. Event records do not contain IP addresses, full User-Agents, prompts, tool arguments, source code or raw attribution tokens. A User-Agent can be inspected in memory to label likely discovery probes; it does not establish identity.

Radar also records initialize/tools-list events for request-level discovery measurement. These events have no persistent anonymous visitor identifier. Request totals cannot establish unique visitors or an individual conversion funnel. Other agents may omit unsigned discovery events. Authenticated internal tests, declared tests, likely probes, unknown calls and verified enrolled calls remain separate. Unknown calls can include the publisher's own unlabelled tests.

Dependency Radar caches public package names, pinned versions, advisory references and timestamps for 15 minutes to control upstream requests. The local pilot client reads selected dependencies from a lockfile on your machine and sends only chosen public package identifiers and versions after explicit confirmation. Local result files are not automatically uploaded.

## Voluntary attribution

The verified pilot is optional. After reviewing independent participation and agreeing on a private delivery channel, a maintainer issues a random 32-byte bearer token, valid for 30 days. D1 stores its SHA-256 digest, an opaque team ID, expiry/revocation times and a separate audit reference to the reviewed public request. The request can contain public GitHub account/project information supplied by its author. One reviewed team counts once even if several members use the same credential.

A valid credential links tool calls to that opaque team ID. It does not identify a particular model, employee or company. Public aggregate metrics expose counts, not token digests or team IDs. No open signup automatically creates verified status. Anonymous free use remains available. Ask for revocation or attribution-data handling through the existing private delivery channel; do not post a token publicly.

Historical operational events are currently preserved without an automated purge. No fixed short retention period is promised. Request review or removal of voluntary attribution metadata through the agreed private channel. Public GitHub issue content is separately visible and governed by GitHub's controls; avoid publishing personal details or sensitive results. The services do not sell attribution data.

Cloudflare processes requests as the hosting provider and may process network metadata under its own policies. npm, PyPI, OSV and BOAMP process relevant upstream queries under their own practices. Service event collection boundaries do not remove those providers' processing.

## Responsible use

Share public identifiers and redacted tool descriptors or errors. Do not send private package names, credentials, personal information or private source code. Guardian's live demos concern project-owned services. Repair is a static advisor. Radar does not install packages or execute code. Signals does not guarantee exhaustive procurement coverage.

Production tools are free, with no real payment collection. Premium Base Sepolia experiments are separate testnet activity. Revenue is only reported after independently verified settlement. See [usage](https://agent-ecosystem.saromy-export.workers.dev/metrics), [pilot measurements](https://agent-ecosystem.saromy-export.workers.dev/adoption.json) and [SECURITY.md](../SECURITY.md) for sensitive vulnerability reporting.
