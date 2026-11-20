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
