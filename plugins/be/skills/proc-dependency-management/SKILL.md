---
name: proc-dependency-management
description: >
  Use when adding a new dependency, upgrading existing ones, or auditing the
  dependency tree. Selection criteria, lockfile discipline, update cadence,
  CVE response, and removal hygiene for any package ecosystem.
---

# Skill: Dependency Management

Process for adding, updating, auditing, and removing third-party
dependencies in any ecosystem (npm, Maven, pip, Go modules, Cargo…).

Reference: `engineering-principles.md` §2.8 (Supply Chain), §8 (Simplicity).

## Adding a dependency — selection criteria

A new dependency must pay rent. Before adding, check:

- [ ] **Need:** would < ~50 lines of own code do? Then write the code.
- [ ] **Health:** maintained (commits/releases in the last year), responsive
      to security reports, more than one maintainer.
- [ ] **Footprint:** transitive dependency count; what else it drags in.
- [ ] **License:** compatible with the project (beware copyleft in
      proprietary code).
- [ ] **Security history:** open CVEs, advisories pattern.
- [ ] **Exit cost:** how hard to replace later? Wrap it behind an interface
      if the answer is "very".

Record non-obvious choices (framework, ORM, auth library) as an ADR
(see `proc-adr`).

## Lockfile discipline

- Lockfiles (`package-lock.json`, `poetry.lock`, `go.sum`…) are **always
  committed**.
- CI installs strictly from the lockfile (`npm ci`, `--frozen-lockfile`) —
  never resolution at build time.
- Version ranges in the manifest stay narrow; the lockfile is the truth.

## Update cadence

- **Automated bot** (Dependabot/Renovate) weekly, PR cap ~5 — see the
  `infra-ci-cd` skill for configuration.
- **Patch/minor:** merge routinely once CI is green.
- **Major:** one PR per major upgrade, with changelog read and breaking
  changes listed in the PR description; never bundle several majors.
- Never let the gap grow — upgrading 20 majors at once is a rewrite.

## CVE response

| Severity (CVSS) | Response window |
|------------------|-----------------|
| Critical (9.0+) | Same day — patch or mitigate |
| High (7.0–8.9) | Within the week |
| Medium/Low | Next scheduled update cycle |

If no patched version exists: check for a mitigation (config flag, disabling
the vulnerable path), document a suppression with justification and an
expiry date, and track it in `docs/structural-analysis.md`.

## Removal hygiene

- Audit unused dependencies quarterly (`depcheck`, `mvn dependency:analyze`,
  or ecosystem equivalent) — every unused package is attack surface.
- When replacing a library, remove the old one in the same PR.

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Left-pad syndrome | Dependency for trivial code | Apply the < 50 lines rule |
| Lockfile in .gitignore | Misunderstanding reproducibility | Always commit lockfiles |
| Suppression without expiry | "Temporary" forever | Date + justification on every suppression |
| Mega-upgrade PR | Updates postponed for months | Weekly bot cadence, one major per PR |
| Abandoned transitive dep | Only direct deps reviewed | Audit the full tree, not just the manifest |
