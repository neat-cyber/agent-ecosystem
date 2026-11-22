# Evaluate one exact dependency change

Experimental local workflow, free hosted Radar calls. Download both scripts from `scripts/`: `review-dependency-change.mjs` and its existing `radar-pilot.mjs` dependency. Review the code, then use Node 22+.

```sh
node review-dependency-change.mjs --ecosystem npm --name lodash --from 4.17.15 --to 4.17.21 --dry-run
node review-dependency-change.mjs --ecosystem npm --name lodash --from 4.17.15 --to 4.17.21 --send-public-identifiers --output review.json
```

Replace sample versions with the actual public versions in your change. Only public package identifiers leave the machine; no lockfile, private source, token or customer data is included in the local report. An optional previously issued OSEILLE_PILOT_TOKEN supports attribution; this workflow issues no credentials. No automatic retries, package installation, upgrade or deployment occurs.

The report compares the current version with the explicit candidate, rather than substituting the latest published version. It lists cited advisory IDs not observed in the target and newly observed in the target only when evidence is complete and identities match. Incomplete or truncated results block a conclusion. A missing advisory ID is not proof a vulnerability was fixed. Remaining/new advisories require review; a result with none still requires compatibility tests and transitive review.

The report makes uncertainty visible. It does not read changelogs, execute your tests or give an unconditional GO. Run your normal pipeline before making a release decision.

For a real voluntary trial, describe the decision, prior method, what changed, time spent and missing evidence through the existing pilot feedback form. Never publish a token or an unreviewed full report. The included EXAMPLE-CHANGE-REVIEW.json is an authenticated internal publisher demo, not adoption or a customer testimonial.
