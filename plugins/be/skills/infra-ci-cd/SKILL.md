---
name: infra-ci-cd
description: >
  Use when configuring or evolving a project's CI/CD pipeline — stage
  ordering, dependency audit (SCA), static analysis (SAST), automated
  dependency updates, commit message validation, and merge gates.
  Stack-agnostic principles with GitHub Actions / Maven / npm examples
  available as on-demand resources.
---

# Skill: CI/CD Pipeline and Dependency Audit

Defines the structure of the continuous integration and delivery pipeline,
with special focus on automatic security auditing. Use when configuring or
evolving the project's workflows.

Reference: `engineering-principles.md` §2.8 (Supply Chain).

## Minimum pipeline structure

```
lint → build → test-unit → test-integration → security-scan → build-image → deploy
```

Each stage runs only if the previous one passes. A broken build blocks
everything.

## Dependency audit (SCA)

Every pipeline must scan third-party dependencies for known CVEs and fail
the build above an agreed severity threshold:

- **JVM/Maven:** OWASP Dependency Check (`failBuildOnCVSS`).
- **Node:** `npm audit --audit-level=high` (use `npm ci`, never `npm install`, in CI).
- **Python:** `pip-audit`; **Go:** `govulncheck`; **Rust:** `cargo audit`.

Keep a documented suppression file for confirmed false positives — never
silence findings ad hoc.

**Gradual adoption strategy** (avoid blocking the team on day one):

| Phase | Threshold | Goal |
|-------|-----------|------|
| Week 1 | Critical only | Visibility, no blocking |
| Week 2–4 | High + Critical | Block only severe issues |
| Stable | Moderate and up | Recommended standard |

## Supply-chain integrity (beyond CVEs)

SCA finds *known-vulnerable* versions; it misses *known-malicious* ones
(compromised releases, typosquats, install-script exfiltration). Add:

- **Advisory / IOC scan:** check installed versions against malicious-package
  feeds — OSV-Scanner, Socket, or the OpenSSF malicious-packages / GitHub
  Advisory data — and fail on a match. Re-run on every lockfile change.
- **Provenance & signatures:** prefer packages with build provenance and verify
  it in CI (`npm audit signatures`, sigstore/cosign).
- **Neutralize install scripts:** install with scripts disabled where feasible
  (`npm ci --ignore-scripts`) so a malicious `postinstall` cannot run in CI.
- **Pin + review new deps** before adding (`proc-dependency-management`); pin
  transitive versions via the lockfile.

## Static application security testing (SAST)

SCA checks dependencies; SAST checks the code you wrote. Use both:

- **Semgrep OSS** (recommended default): no build step, works in private
  repos without paid add-ons, community rulesets (`p/owasp-top-ten`,
  `p/secrets`, per-language packs) plus custom YAML rules in
  `.semgrep/rules/<language>/`.
- **Language-native linters with security plugins** where they add value
  (e.g., SpotBugs + find-sec-bugs for Java).

Typical custom rules every project should have: hardcoded secrets, sensitive
data logging, weak hashing, non-cryptographic PRNG, SQL string concatenation,
`eval`/dynamic code, auth tokens in `localStorage`, `innerHTML` XSS.

## Automated dependency updates

Enable a bot (Dependabot, Renovate) with a weekly schedule and a PR limit
(e.g., 5 open PRs max) so updates arrive continuously instead of as a yearly
big-bang upgrade. Label the PRs for triage. See also the
`proc-dependency-management` skill.

## Mandatory gates before merge

- Required status checks: every CI job green.
- At least 1 approving review; stale reviews dismissed on new commits.
- Branch up to date with the target before merge.
- Force push to the default branch: never.

## Commit and quality conventions in CI

- Validate **Conventional Commits** automatically (commitlint or equivalent).
- Enforce coverage thresholds where the team has agreed on them.
- Frontend projects: run accessibility checks (e.g., Lighthouse CI with
  `categories:accessibility` minScore 0.9) — see `fe-accessibility-patterns`.

## Common mistakes

| Mistake | Solution |
|---------|----------|
| Slow pipeline (> 10 min) | Configure dependency caches per ecosystem |
| False positives blocking adoption | Start at critical-only threshold, tighten gradually |
| Non-deterministic installs in CI | Use lockfile-strict installs (`npm ci`, `--frozen-lockfile`) |
| Update bot floods the repo | Cap open PRs, schedule weekly |

## Resources

- [examples-github-actions.md](examples-github-actions.md) — copy-paste
  GitHub Actions pipelines: Maven OWASP Dependency Check, SpotBugs +
  find-sec-bugs, Semgrep workflow and custom rule template, Dependabot
  config, full backend+frontend pipeline, commitlint, Lighthouse CI.
