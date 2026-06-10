---
name: proc-impact-analysis
description: >
  Use before opening a PR, after a large refactoring, or whenever a change
  touches a shared boundary. Determines which modules, flows, domain events,
  and downstream consumers are affected, assigns a risk level, and produces a
  focused review checklist.
---

# Skill: Change Impact Analysis

## What this skill is

Defines the process for assessing the blast radius of a set of changes before
they reach a PR review or are merged. The analysis answers three questions:

1. **What is directly changed?** (modified files and their layers)
2. **What is indirectly affected?** (callers, consumers, tests, documentation)
3. **What is the risk level?** (and what review actions follow from that level)

This is the pre-PR complement to the `proc-code-review` skill — impact analysis scopes
*what needs reviewing*; code review defines *how to review it*.

---

## When to run

| Trigger | Recommended scope |
|---------|-------------------|
| Before opening any PR | Run on all staged changes |
| After a refactoring session | Run on all modified files |
| Hotfix on production | Run even on single-file changes — hotfixes carry highest risk |
| Dependency version bump | Run on all files that import the bumped dependency |
| Schema migration | Run on all files that reference the affected table/entity |

---

## Input

The analysis takes as input:
- The list of changed files (`git diff --name-only origin/main`)
- The project's `docs/structural-analysis.md` (layer and dependency map)
- The project's domain map (output of the `proc-domain-mapping` skill)

---

## Step 1 — Classify changed files

For each changed file, record:

| Field | Value |
|-------|-------|
| `path` | Relative path |
| `change_type` | `added` · `modified` · `deleted` · `renamed` |
| `layer` | From structural-analysis.md layer assignment |
| `domain` | Bounded context this file belongs to |
| `is_public_contract` | Does this file expose a public API, event, or interface? |
| `is_shared` | Is this file imported by more than one bounded context? |

### High-risk file signals

The following file types carry elevated risk regardless of change size:

| File type | Risk reason |
|-----------|-------------|
| Entity / Aggregate root | Schema change may require migration; all consumers affected |
| Repository interface | Any change to a query contract breaks callers |
| API controller / DTO | Public contract — client-breaking risk |
| Security config | Auth bypass or over-restriction risk |
| Domain event | All event consumers must be re-validated |
| Database migration | Irreversible by default |
| CI/CD workflow | Can block all future deployments |
| Shared util / helper | Potentially used across the entire codebase |

---

## Step 2 — Map the impact radius

For each changed file with `is_public_contract = true` or `is_shared = true`:

1. Find all files that import or reference the changed file
2. Recurse one level: find files that import those importers
3. Stop at layer boundaries (do not cross bounded context borders unless
   the change is in a shared/common module)

Record the impact radius:

```
impact_radius:
  changed_file: [path]
  direct_consumers:   [list of files that directly import it]
  indirect_consumers: [list of files one hop further]
  affected_flows:     [flows from structural-analysis.md that pass through this file]
  affected_tests:     [test files that cover any of the above]
```

---

## Step 3 — Assign risk level

Compute an overall risk level for the PR:

| Level | Criteria |
|-------|---------|
| 🔴 **Critical** | Change in shared entity / security config / DB migration + missing tests |
| 🟠 **High** | Change in public API contract or domain event; or ≥ 3 bounded contexts affected |
| 🟡 **Medium** | Change confined to one bounded context; existing tests cover the flows |
| 🟢 **Low** | Change in util, config, or docs only; or pure additive change with no existing consumers |

### Risk level escalators (automatically raise level by one)

- No tests added or modified for a non-trivial behaviour change
- Change in a file that has caused a production incident in the last 3 months
  (check `docs/lessons-learned.md`)
- More than 400 lines of net additions in a single PR
- Dependency version bump with known CVEs in the release notes

---

## Step 4 — Generate review checklist

Based on the risk level and affected layers, produce a targeted checklist:

### Always (all levels)

- [ ] Does the PR description explain *why* the change was made?
- [ ] Are all changed files accounted for in the impact analysis?
- [ ] Do the tests cover the critical paths in the impact radius?

### Level 🟡 Medium and above

- [ ] Are all direct consumers of the changed file still compatible?
- [ ] Is the change backward-compatible? If not, is there a migration plan?
- [ ] Are the affected flows documented in `docs/structural-analysis.md` updated?

### Level 🟠 High

- [ ] Have all bounded contexts in the impact radius been notified / reviewed?
- [ ] Is there a rollback plan if the change causes a regression in production?
- [ ] Has the security reviewer been assigned if auth / data isolation is affected?

### Level 🔴 Critical

- [ ] Mandatory synchronous review by `qa-security-reviewer` (for security changes)
  or `mgmt-architect` (for schema / contract changes)
- [ ] Feature flag or canary deployment required before full rollout
- [ ] Runbook updated (`docs/runbook/`) for any new failure mode introduced
- [ ] Stakeholder communication prepared if the change is user-visible

---

## Step 5 — PR description template

Paste the following into the PR description after running the analysis:

```markdown
## Impact Analysis

**Risk level:** [🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical]

**Changed files:** N
**Directly affected consumers:** N files
**Affected flows:** [flow names]
**Bounded contexts touched:** [context names]

### High-risk files
- [ ] [path] — [reason for high risk]

### Impact review checklist
[paste the checklist generated in Step 4]

### Rollback plan
[describe how to revert if necessary — or "N/A — purely additive change"]
```

---

## Integration with other skills

| Skill | How impact analysis interacts |
|-------|-------------------------------|
| `proc-structural-analysis` | Provides the layer and dependency map consumed by Step 2 |
| `proc-domain-mapping` | Provides bounded context map consumed by Step 2 and Step 3 |
| `proc-code-review` | Impact analysis runs first; its checklist feeds the code review |
| `proc-release-checklist` | Release checklist references the PR's impact analysis risk level |

---

## Automation hint

For projects with CI/CD:

```yaml
# .github/workflows/ci.yml — add to PR trigger
- name: Impact analysis report
  run: |
    git diff --name-only origin/main > /tmp/changed-files.txt
    # Pass to an AI agent using proc-impact-analysis skill
    # Output as a PR comment via gh pr comment
```

The analysis can be automated as a CI step that posts the impact summary
as a PR comment before reviewers are assigned.

---

*See also: the `proc-structural-analysis`, `proc-domain-mapping`, and `proc-code-review` skills.*
