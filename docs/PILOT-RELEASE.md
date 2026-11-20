# Pilot release — 20 November 2026

## Changes

- New `/pilot` guide and `/radar-pilot.mjs` local client download on the existing hub.
- Local package-lock v2/v3 selection of 1–3 direct pinned dependencies. Dry-run and explicit public-identifier submission; lockfiles and result files remain local. No install, polling or automatic retry.
- Optional reviewed enrollment request, operator preparation helper, 30-day random attribution token, expiry/revocation and auditable evidence references. No automatic public issuance.
- Radar production pilot-attribution flag enabled and minimal initialize/tools-list event counting enabled. Anonymous use remains free and unknown. The other three production Workers keep their previous configuration.
- Additive enrollment-evidence table; existing events and credentials preserved.
- `/adoption.json` reports business calls, unknown successes, enrolled-team recurrence on distinct UTC days and elapsed 7/30-day retention with eligible denominators. Catalogues, demonstrations and internal tests are excluded from business adoption.
- Privacy documentation updated and three targeted invitation drafts prepared. Drafts have not been sent.

## Validation evidence

Six local tests cover selected-lockfile boundaries, outbound request sequence and token redaction, no retries, enrollment review/expiry preparation, unknown/test/catalogue exclusions, recurrence and immature retention cohorts. Existing telemetry tests passed 4/4.

Private staging fixture at 16:09–16:10 UTC: valid token produced one attributed row; identical replay produced no extra row; forged token and revoked token remained unknown; a signed internal test took precedence over the pilot token. The fixture exists only in staging and is explicitly internal test data, never adoption. Its credential was revoked. The protected audit relay was enabled temporarily with a one-hour timeout for the checks, then its public route and preview URLs were disabled again.

The published local client completed an authenticated internal production `release_gate` request at 16:12:34 UTC with one package evaluated. This is an internal functional check, not external demand.

## Rollback

Before this release, production Radar version was `d6094655-73bd-4615-baf9-53b8a105618a`; hub version was `93946402-fab2-4fab-96c4-09eb6d53ef3e`. Both code downloads and non-secret settings were backed up privately before mutation. Restore those versions through Cloudflare deployments to reverse Worker changes. Reverting hub source to public commit `9607957fdc4ea7e7dbb760cd4132bd2d1592c431` removes the pilot additions. Keep event and enrollment tables intact during rollback. Disabling only `OSEILLE_PILOT_ENABLED` and `OSEILLE_DISCOVERY_LOGGING` also leaves anonymous tools available.

## Remaining evidence

No real pilot was enrolled at release preparation, and no production test credential was issued. A maintainer must review a genuine independent request, agree on private token delivery and run the enrollment batch. Written willingness to pay and testnet payment settlement remain separate validation requirements. No commercial success or actual payment is claimed by this release.

## Deployment and post-check

Code commit: `adc9e7f9411d344b3701f65cbe3cb6961f27aae9`, tested first on dedicated branch `pilot/verified-adoption-2026-11-20`, then fast-forwarded to main with an expected-head guard.

Active hub version: `92e76cdb-506f-455e-8688-8a3a5deefc5f`; deployment `e123b059-109f-4c97-a8ab-9f8dada7a68b`. Active Radar settings version: `546e9a41-daa7-4a4f-9b88-2ff48f885ceb`. Radar business logic and production secrets were preserved; only the two optional telemetry flags changed.

At 16:15:45 UTC, seven hub routes passed live checks, the client download matched the tested SHA-256 bytes, adoption metrics were available, and all four service health endpoints returned HTTP 200. This is a point-in-time check. The audit relay returned 404 after its public route was disabled. Local hub checks covered eight routes, example switching, download bytes, HEAD and method restrictions.

The second authenticated production runner check at 16:14:59 UTC evaluated one package successfully. D1 confirmed its initialize, tools-list and business-call rows were all `verified_internal_test`. Both production enrollment tables remained empty; verified teams and successful external business calls were zero. Immature 7/30-day retention is `null`, not a fabricated zero-percent retention rate.

The existing private daily automation was updated, retaining its schedule, to review new pilot requests and report recurrence. It never auto-issues credentials or sends outreach.

Cline's submission README was inspected. Its submission requires a 400×400 logo and confirmation of a successful Cline-driven setup from the README or llms-install guide. Those checks were not performed here. The Cline draft remains pending; no Cline submission or acceptance is claimed. Continue and MCP community drafts also require confirmation of an appropriate channel and posting rules before sending.

No paid service was subscribed to and no real payment was activated. This release does not certify the account's billing totals as zero.
