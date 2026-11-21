# Improvements from daily monitoring — 21 November 2026

Today's scheduled report observed 419 Radar initializations and 312 tools/list requests in its rolling window. They establish discovery requests, not unique visitors or independent use. Its undifferentiated success count included catalogues. A later D1 extraction grouped by service, tool, origin and outcome confirmed that the unknown successful Radar call was ecosystem_catalog; dependency_preflight and release_gate each had one invalid_arguments error. Different rolling windows are not directly comparable. No external identity was inferred.

## Released correction

Radar tool descriptions now distinguish a single package comparison from a grouped release decision. Every release_gate input property has an explanation. MCP initialize returns instructions with exact-version requirements, confidentiality boundaries and the optional pilot guide. Invalid argument errors retain isError=true and now supply an exact-schema lookup and example; unknown-tool and other error classes do not receive misleading validation hints. The four free tools, business validation, quotas, attribution flags and payment settings are preserved.

Code: private repository neat-cyber/agent-guardian, branch fix/radar-discovery-2026-11-21, commit 0c1bb7ca97f3840062d496a62145367c836727b6. The current production code was downloaded and backed up before changes. Runtime checks were run on the dedicated implementation before release.

Active Radar version: 2f02856c-400b-49a8-bb89-4a6a03cbab68. Previous production version for rollback: 546e9a41-daa7-4a4f-9b88-2ff48f885ceb. Restore the previous version at 100% to roll back; preserve D1 history. The other three service deployments were not changed.

## Evidence

Local checks passed initialize instructions and protocol version, four-tool discovery, complete grouped parameter descriptions, three invalid-input cases and separation of unknown tools. At 13:42:25 UTC (14:42 Paris), live signed production checks passed initialize, tools/list, invalid-input recovery and a real release_gate evaluation of one pinned package. All four health endpoints returned HTTP 200. This is point-in-time availability, not continuous availability certification. Functional calls were authenticated internal tests, not adoption.

The existing daily automation now requires tool-level breakdowns, explicit UTC windows and separation of catalogues, demonstrations and business use. A failed DNS lookup from the control environment remains a monitoring limitation rather than an inferred public outage.

No new paid service or real payment was activated. Discovery-to-business improvement remains a hypothesis to measure after deployment. No customers, recurring independent teams or new revenue are claimed.
