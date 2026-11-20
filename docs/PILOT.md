# Dependency Radar: a real decision in five minutes

Check one to three public npm or PyPI releases before an install or release. Get registry evidence, known OSV advisories, source completeness and a review decision. Free beta, no account or wallet required.

## First task

1. Choose a dependency involved in a real decision. Download [radar-pilot.mjs](../scripts/radar-pilot.mjs), review the source and use Node 22 or newer. No npm install is needed.
2. Preview the public identifiers that will leave your machine:

```sh
node radar-pilot.mjs --package npm:lodash@4.17.21 --dry-run
```

3. Replace the example with your own public package and exact version, then run once:

```sh
node radar-pilot.mjs --package npm:lodash@4.17.21 --send-public-identifiers --output first-decision.json
```

The result stays on your machine. Inspect `result.structuredContent`: `decision`, advisory records and source completeness. `incomplete_needs_review` requires follow-up. An absence of known advisories is not a safety guarantee. Review compatibility yourself before upgrading.

For a real npm project, select direct dependencies from a local package-lock v2/v3:

```sh
node radar-pilot.mjs --lock package-lock.json --select lodash,axios --dry-run
node radar-pilot.mjs --lock package-lock.json --select lodash,axios --send-public-identifiers --output release-review.json
```

The lockfile stays local. Only the selected public package names, ecosystems and exact versions are sent. Choose up to three packages; larger selections fail instead of being silently truncated. This is a selected dependency check, not a complete lockfile audit or automatic transitive scan. Explicit PyPI example: `--package PyPI:requests@2.32.3`. The shared beta budget is 120 uncached checks per UTC day. The client has a timeout and sends no automatic retries or scheduled requests.

## Optional verified pilot

[Request a free pilot invitation](https://github.com/neat-cyber/agent-ecosystem/issues/new?template=pilot-request.yml). Describe a real decision and an optional public project. We review independence rather than inferring identity from IP addresses. A maintainer agrees on a private delivery channel before providing a token. Do not post tokens in issues.

After receiving your token through that channel, set `OSEILLE_PILOT_TOKEN` privately in your environment and repeat the command. MCP clients that support custom headers may supply `X-Oseille-Pilot-Token` on calls to the Radar endpoint. The token only supports attribution; the free tools also work without it. It expires after 30 days and can be revoked on request. A client saying a token was supplied is not proof the server accepted it.

One opaque identifier represents one reviewed team. Team members may share that identity privately; this does not count as multiple independent consumers. Please do not share the credential outside the team. Lost or publicly exposed credentials are revoked before replacement. A credential proves enrolled access, not which human or AI model performed a call.

## Return with a later real task

Run another check when a later install or release decision arises, using the same invitation token. Use a different local output filename. [Share voluntary redacted feedback](https://github.com/neat-cyber/agent-ecosystem/issues/new?template=pilot-feedback.yml): what you checked, the UTC time, what changed in your decision, and what evidence was missing. Do not upload the whole local report without reviewing it. Replaying the sample or repeating tests does not establish commercial demand.

Success over 14 days from the first independent task: three independent teams, two teams returning for a later real decision, one written use case worth 0.05 USDC for an advanced analysis. These are goals, not current results. Testnet payment validation is separate. No real payment is enabled.

[Privacy](PRIVACY.md) · [Live adoption counts](https://agent-ecosystem.saromy-export.workers.dev/adoption.json) · [MCP client configuration](../mcp-config.json)
