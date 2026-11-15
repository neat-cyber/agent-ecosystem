# Quickstart: use a remote MCP tool

## 1. Choose the endpoint

For example, Agent Dependency Radar:

https://agent-dependency-radar.saromy-export.workers.dev/mcp

Your MCP client must support remote **Streamable HTTP**. Some clients require manual approval to add an external tool server. Registration in an MCP directory does not automatically authorize a client to connect.

## 2. Discover available tools

Example using curl (this example lists tools but does not increment the tool-call usage counter):

```bash
curl --fail-with-body -sS \
  'https://agent-dependency-radar.saromy-export.workers.dev/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## 3. Run a useful check

The example checks two **direct** package versions against public OSV advisories. It is not a security certification and does not include transitive dependencies.

```bash
curl --fail-with-body -sS \
  'https://agent-dependency-radar.saromy-export.workers.dev/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"release_gate","arguments":{"packages":[{"ecosystem":"npm","package_name":"lodash","version":"4.17.15"},{"ecosystem":"PyPI","package_name":"requests","version":"2.19.1"}]}}}'
```

The returned structured response has fields such as decision, evaluated, results, advisory counts, and source information. Always inspect the **actual** tool schema with tools/list, since APIs may evolve.

### Typical decisions

- `review_known_advisories`: The submitted packages have known advisory records and need review.
- `no_known_direct_advisories_found`: No known direct-package OSV advisories were returned at the time of the check. **This does not mean safe**.
- `incomplete_needs_review`: At least one requested package could not be completely evaluated; do not infer that it is safe.

## Other MCP endpoints

- Guardian: https://agent-guardian.saromy-export.workers.dev/mcp
- Repair: https://agent-repair.saromy-export.workers.dev/mcp
- Signals: https://agent-signals.saromy-export.workers.dev/mcp

## Client safety

Connect to services only when approved by the tool operator. Never submit credentials, private source code, or regulated personal data. No paid call is available or required today.

## Task examples for MCP clients

Use the endpoint above for the selected service. For generic Streamable HTTP clients, send `initialize`, retain any returned `Mcp-Session-Id`, send `notifications/initialized`, then call `tools/list` and `tools/call`. Accept both `application/json` and `text/event-stream`. Send the negotiated `MCP-Protocol-Version` on subsequent requests. Pass the arguments below as `params.arguments`.

| Service | Tool | Arguments to try |
| --- | --- | --- |
| Guardian | `audit_mcp_contracts` | `{"tools":[{"name":"lookup","description":"Look up a public record","inputSchema":{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}}]}` |
| Repair | `diagnose_tool_failure` | `{"http_status":429,"idempotent":true,"retry_after_seconds":30}` |
| Signals | `search_public_tenders` | `{"keyword":"granulés","days_back":30,"max_results":3}` |
| Dependency Radar | `dependency_preflight` | `{"ecosystem":"npm","package_name":"lodash","version":"4.17.20"}` |

The [official registry](https://registry.modelcontextprotocol.io/) uses the namespace `io.github.neat-cyber`. The four [Glama connector listings](https://glama.ai/mcp/connectors) are available at [Guardian](https://glama.ai/mcp/connectors/io.github.neat-cyber/agent-guardian), [Repair](https://glama.ai/mcp/connectors/io.github.neat-cyber/agent-repair), [Signals](https://glama.ai/mcp/connectors/io.github.neat-cyber/agent-signals), and [Dependency Radar](https://glama.ai/mcp/connectors/io.github.neat-cyber/agent-dependency-radar).
