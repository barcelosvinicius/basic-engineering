# 📋 Session History — basic-engineering

> **Mandatory continuity file.** Every session reads this before touching code
> and updates it before committing. Operational state lives here;
> `docs/lessons-learned.md` holds errors and lasting rules;
> `docs/structural-analysis.md` holds the technical X-ray.
>
> Reference: `engineering-principles.md` §A.3 (Session Continuity).

---

## Current State

> ⚡ Last updated: 2026-08-19

**Project phase:** active development on `feat/wire-session-continuity-graph`
(unreleased; version deliberately still 3.0.0 — `release.yml` publishes on push
to `main` when the version changes).

### In progress

- Action plan Phase 3.2/3.3, Phase 5 — see [action-plan.md](action-plan.md).

### Recently completed

- Activation graph wired (orphans 3 → 0, hub out-degree 1 → 7, cycles 0).
- Doc templates carry the fields their rules demand.
- Drift sweep: 4 findings, all closed; each with a guard in `npm run validate`
  or in the release path.
- Size rule replaced by a three-outcome test keyed on the trigger.

### Blockers

- No active blockers.

### Priority next steps

<!-- Each step carries how we will know it is done, and what must be true first. -->
1. Phase 3.3 — record the three-outcome verdict for the five remaining
   over-budget skills — **done when:** each of the five carries a one-line
   verdict · **blocked by:** nothing.
2. Phase 3.2 — extract the `fe-*` catalogues — **done when:** both `SKILL.md`
   under 150 lines, both with resource siblings, and `git diff --stat` shows
   lines moved rather than lost · **blocked by:** nothing.
3. Phase 5 — U4 (parallel agents read, one writer writes) then U8 — **done
   when:** the rule is stated in `proc-session-continuity` and each sweep
   command declares its parallel axis · **blocked by:** nothing.

---

## Delivery History

> Reverse chronological. Each entry is immutable.

### [2026-08-19] Wire the activation graph, close the drift, guard the rules

**Owner:** vinicius + Claude Opus 5

**Deliveries:**
- `proc-session-continuity` declares 7 typed activation edges; promotion channel
  back to the base at session end; measure-before-read at session start.
- Cycle detection (`scripts/lib/edges.js`) and inventory enforcement
  (`scripts/lib/inventory.js`) in `npm run validate`.
- `proc-domain-mapping` is the single owner of the `## Domain map` section.
- Doc templates carry `§0 fact panel`, `Done when:`, `Blocked by:`,
  `Evidence:`, `Scope:`, `Verified:`.
- `BASE_VERSION` from UTC with a monotonicity guard; `--dry-run` no longer
  advises a destructive revert.
- Reproducible audits: `npm run audit:graph`, `npm run audit:backlog`
  (`--check` gates the release).
- First `docs/structural-analysis.md`, `docs/action-plan.md`, and this file.

**Decisions:**
- Do **not** merge `proc-structural-analysis` with `proc-domain-mapping` —
  refuted by measurement (vocabularies nearly disjoint).
- Do **not** rename `engineering-principles` — declare the exception instead;
  a rename breaks every installed base for a cosmetic gain.
- Do **not** ship the code-percentage heuristic as a gate — it failed validation
  (2 false positives of 5 flags).

**Next steps:** action plan Phase 3.2, 3.3 and Phase 5.

**Blockers:** None.

**Verified:** `npm run validate` (passes) · `npm test` (31 pass, 0 fail) ·
`node scripts/graph-audit.js` (0 orphans, 0 cycles) ·
`node scripts/backlog-audit.js --check` (16 done · 2 partial · 2 todo) ·
`node bin/be.js install <tmp> --dry-run` (ok) · every commit in the series
re-checked out and re-verified individually.

---

*Reference: `engineering-principles.md` §A.3 · Complement: `lessons-learned.md`*
