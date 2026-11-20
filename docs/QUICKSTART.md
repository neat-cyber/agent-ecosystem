# Run a useful MCP check

## Connect an endpoint

Choose the service that fits your task. Download the [Cursor JSON](../mcp-config.json) or [Codex TOML](../codex-config.toml), or add one endpoint manually in your MCP client.

| Service | Endpoint |
| --- | --- |
| Agent Guardian | `https://agent-guardian.saromy-export.workers.dev/mcp` |
| Agent Repair | `https://agent-repair.saromy-export.workers.dev/mcp` |
| Agent Signals | `https://agent-signals.saromy-export.workers.dev/mcp` |
| Agent Dependency Radar | `https://agent-dependency-radar.saromy-export.workers.dev/mcp` |

The transport is Streamable HTTP. The public beta tools are free and accept requests without a token. Approve the external connection in your client and discover the current schemas through `tools/list`.

## Try Dependency Radar with curl

Initialize the connection.

```bash
curl --fail-with-body -sS \
  'https://agent-dependency-radar.saromy-export.workers.dev/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"dependency-review","version":"1.0"}}}'
```

Discover the current tools.

```bash
curl --fail-with-body -sS \
  'https://agent-dependency-radar.saromy-export.workers.dev/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

Check a pinned dependency before deciding on an upgrade.

```bash
curl --fail-with-body -sS \
  'https://agent-dependency-radar.saromy-export.workers.dev/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"release_gate","arguments":{"packages":[{"ecosystem":"npm","package_name":"lodash","version":"4.17.15"}]}}}'
```

The result is in `result.structuredContent`. Check `isError` as well as HTTP status because an MCP tool error can arrive in an HTTP 200 response.

| Returned decision | Next step |
| --- | --- |
| `review_known_advisories` | Read the advisory records and assess the affected versions. |
| `no_known_direct_advisories_found` | Continue compatibility testing and review the coverage limitations. |
| `incomplete_needs_review` | Inspect the unavailable source or invalid package version and repeat only when appropriate. |

## Choose another concrete task

The machine-readable [examples.json](../examples.json) contains one reproducible request for each service, with expected response fields.

- Guardian compares the same tool descriptor before and after adding a required argument.
- Repair classifies a supplied HTTP 429 and provides bounded retry advice.
- Signals searches recent BOAMP notices containing `maintenance` and supplies provenance.
- Radar evaluates the pinned package and returns source completeness.

Signals can return an empty results array. Quotas are shared across the free beta. Check the service response before retrying.

## Report a result

The [pilot feedback form](https://github.com/neat-cyber/agent-ecosystem/issues/new?template=pilot-feedback.yml) asks which decision the check helped you make, whether you returned for another task, and what would justify an advanced paid analysis. Redact private identifiers, credentials and source code before publishing.
