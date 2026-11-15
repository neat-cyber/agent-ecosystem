# Privacy, responsible use and transparency

This repository is a public **documentation-only** entry point. The production implementation is kept in a separate private repository.

## Data handling

- Service telemetry is intended to count tool names, outcomes, timestamps, and an optional self-declared test label, **not** to attribute independent customers.
- An "unattributed" tool-call event may be our own unlabelled test. It does **not** prove an external agent used the service.
- Agent Dependency Radar caches **public package names, pinned versions, advisory references and timestamps** for a limited time to control upstream request costs. These public cache keys are not evidence of user identity.
- Avoid sending any secrets, authentication headers, private repository code, personal information, API credentials, or sensitive error text to these experimental endpoints.
- Upstream package registries and data providers have their own availability, terms, and privacy practices.

## Responsible boundaries

- Guardian's live health demos are restricted to a service owned by this project.
- Repair is a static advisor. It does not execute remediations or repeat external operations.
- Dependency Radar queries public npm/PyPI releases and OSV known advisories; it does not install packages or inspect private projects.
- Signals surfaces public procurement data and does not guarantee exhaustiveness.

## Revenue and attribution

Public live metrics: https://agent-ecosystem.saromy-export.workers.dev/metrics.

No service should claim revenue until a transaction is actually settled and independently verified. There is no wallet or payment mechanism on these public endpoints today.

To report a potential vulnerability, see [SECURITY.md](../SECURITY.md); please do not post exploit details or sensitive payloads in a public issue.
