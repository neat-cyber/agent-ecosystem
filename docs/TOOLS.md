# Service reference and limitations

The information below describes public capabilities verified on **2026-11-15**. The live MCP tools/list response is authoritative for schemas and availability.

## Agent Guardian (0.8.0)

**Endpoint:** https://agent-guardian.saromy-export.workers.dev/mcp

- `audit_mcp_contracts` — static analysis of caller-supplied MCP tool descriptors; optional compatibility comparison with previous descriptors.
- `ecosystem_catalog` — task-relevant recommendations of sister tools.
- `check_demo`, `demo_history`, `check_live`, `live_history` — synthetic and strictly **Guardian-owned** test-service diagnostics.

**Not provided:** monitoring arbitrary customer domains, a generalized uptime service, runtime vulnerability scanning, guaranteed contract compatibility.

## Agent Repair (0.2.0)

**Endpoint:** https://agent-repair.saromy-export.workers.dev/mcp

- `diagnose_tool_failure` — classifies supplied error/status signals; offers bounded retry guidance.
- `validate_tool_arguments` — checks selected JSON Schema constraints, returning paths and problems. **Not** a complete schema validator.
- `ecosystem_catalog` — optional related-tool discovery.

**Not provided:** automatic retries, service probing, full JSON Schema certification, privileged system access.

## Agent Signals (0.1.0)

**Endpoint:** https://agent-signals.saromy-export.workers.dev/mcp

- `search_public_tenders` — searches recent public French procurement notices based on BOAMP/DILA open data.
- `data_sources` — data provenance and coverage.
- `ecosystem_catalog` — optional related-tool discovery.

**Limitations:** only available source data is searched; results and deadlines must be checked on the official notice. No exhaustive coverage guarantee. Official BOAMP open-data source: https://boamp-datadila.opendatasoft.com/.

## Agent Dependency Radar (0.2.0)

**Endpoint:** https://agent-dependency-radar.saromy-export.workers.dev/mcp

- `dependency_preflight` — verifies that a provided pinned npm/PyPI release exists in its official registry, reads the latest published version, checks publicly known OSV advisory IDs for both.
- `release_gate` — batch check for **one to three pinned direct dependencies** with a conservative, machine-readable review decision.
- `radar_methodology` — source attribution, safeguards, and data limits.
- `ecosystem_catalog` — optional related-tool discovery.

**Sources:** OSV https://osv.dev, npm https://registry.npmjs.org, PyPI https://pypi.org. Advisories are incomplete and the data may be cached temporarily. A newer version or zero returned advisories does not guarantee safety or application compatibility. No transitive dependency graph is inspected.

## Operations and payment status

All current services are experimental/free. The verified financial status is displayed at https://agent-ecosystem.saromy-export.workers.dev/metrics. **No x402 payments are accepted yet.** Quotas and responses may change under the operational beta limits.
