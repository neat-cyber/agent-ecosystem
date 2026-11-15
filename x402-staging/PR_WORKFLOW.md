# Run Dependency Radar when an npm dependency changes

This example is for a repository owner who wants an advisory check on pull requests that change the root npm lockfile, including Dependabot updates. The check is free and posts a job summary. Keep the job optional while evaluating it.

## Install in a pilot repository

1. Review and copy `scripts/radar-pr-check.mjs` to `.github/scripts/radar-pr-check.mjs` on the base branch.
2. Add the workflow below to `.github/workflows/dependency-radar.yml` on that same branch. Replace `lodash axios` with the exact public npm packages your team authorizes sending to Radar. The script sends only package names and pinned versions for approved direct dependencies. Keep private names out of the allowlist, including private packages hosted at npmjs.org.
3. Open a small pull request changing one approved dependency. Check the job summary. For automated updates, configure your own Dependabot schedule and enable npm in the pilot repository.

```yaml
name: Dependency Radar
on:
  pull_request:
    paths: ['package-lock.json']
permissions:
  contents: read
jobs:
  review:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0
          persist-credentials: false
      - name: Check approved direct dependencies
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
        run: |
          git show "$BASE_SHA:package-lock.json" > "$RUNNER_TEMP/radar-base.json"
          git show "$BASE_SHA:.github/scripts/radar-pr-check.mjs" > "$RUNNER_TEMP/radar-pr-check.mjs"
          node "$RUNNER_TEMP/radar-pr-check.mjs" "$RUNNER_TEMP/radar-base.json" package-lock.json lodash axios
```

The example assumes one npm project at the root and that a version 2 or 3 lockfile is present on both sides. A single call checks up to three changed, approved direct dependencies. If nothing in scope changed, the script skips the network call. Large groups and failed requests are explicit errors. Advisory findings are reported for human review. The job installs no project dependencies and uses no wallet or payment secret. For operator-run smoke checks, pass `--internal` so they can be recognized as internal traffic.

## Evaluating a paid follow-up

The production job uses the existing free check. The paid hypothesis is **0.05 USDC per transitive review** for a specific dependency branch. A candidate event is a PR where an existing audit points to a vulnerable transitive package and the team wants to know which direct dependency introduces it. A clean direct check cannot answer that question. An opt-in team can use the existing npm graph converter for a sample report and compare its decision with its normal triage.

Ask the team to confirm that the report changed or accelerated a concrete decision on one PR, then repeat on another PR before treating it as recurring use. Log which repository opted in, the occurrence date, whether a result was delivered, and whether payment settled when live payments are separately authorized. Internal checks and testnet settlements do not count as external use or revenue.
