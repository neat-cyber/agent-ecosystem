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
