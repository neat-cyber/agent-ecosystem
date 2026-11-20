# Pilot operator procedure

1. Review incoming pilot requests and voluntary feedback daily. Confirm a real use case, independence from this project and consent. A checkbox alone is insufficient: inspect the public workflow/project or request a contextual explanation. Record the reviewed issue/comment URL. Do not infer affiliation from IP or User-Agent.
2. Check existing enrollment evidence to avoid issuing another consumer ID to the same team. Agree on a private token-delivery channel. Without one, leave the request pending and keep anonymous tools available. Do not publish a token or accept a token pasted in a public issue.
3. Prepare a credential locally: `node scripts/enroll-pilot.mjs --evidence-url https://github.com/neat-cyber/agent-ecosystem/issues/N --verified-independent --output-dir PRIVATE_NEW_DIRECTORY`. The helper does not enroll anyone itself. It writes a 32-byte opaque token privately, a parameterized D1 batch and a revocation request. Never commit its output directory.
4. Submit enrollment-request.json to the production ecosystem D1 query endpoint in the authenticated Cloudflare connector. The audit evidence and credential insert must both succeed. Only SHA-256 token digest and opaque consumer ID enter the credential table. Do not register internal tests as external consumers.
5. Deliver pilot-token.txt privately. Check their first voluntary result against `mcp_events_v4_detail`: expected consumer ID, business tool, outcome, time, production version. Keep feedback and proof references separate from operational telemetry. Unknown historical calls remain unknown.
6. Daily: count successful `release_gate` and `dependency_preflight` calls per enrolled team, distinct UTC active days and elapsed-day retention. A second successful call on another day is technical recurrence; feedback must establish a second real decision. Report denominators and immature cohorts. Testnet, mainnet and written payment intent are separate categories.
7. Revoke using the credential UPDATE for that consumer ID with the CURRENT UTC timestamp. The generated request timestamp is its preparation time; refresh it before execution. Preserve existing history. Replacement credentials for the same team must reuse its existing consumer ID, not create another team. The automatic helper is for first enrollment; rotation requires reviewing the existing record.

## Infrastructure and rollback

Radar alone enables optional pilot attribution and anonymous discovery event logging. Existing authenticated internal-test signatures take precedence over pilot tokens. Discovery events contain no IP, User-Agent, arguments or stable visitor ID, so they measure requests rather than unique visitors or conversion cohorts.

The additive `mcp_pilot_enrollments_v4` table stores opaque team ID, reviewed evidence URL, verification/expiry time and service scope. No enrollment is created until a real participant is reviewed. The existing `mcp_pilot_credentials_v4` table enforces expiry/revocation. No public signup endpoint can issue verified status.

To stop attribution, set Radar `OSEILLE_PILOT_ENABLED=0`; anonymous service continues. Set `OSEILLE_DISCOVERY_LOGGING=0` to stop anonymous discovery rows. Preserve all other bindings, especially secrets. Restore the previous production Worker version if needed (recorded in docs/PILOT-RELEASE.md). Never delete events during rollback.

## Distribution

Track existing directory submissions in OUTREACH.md. Invite only where a project explicitly welcomes integration or pilot requests; disclose publisher affiliation and the assistant's role. Never impersonate an independent user. Do not create issues in unrelated projects, post repeated messages, auto-follow up, scrape private contacts or run tests that look like demand. New targeted invitations are drafted with a source and suitable channel for review before sending.
