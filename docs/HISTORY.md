# 📋 Session History — basic-engineering

> **Mandatory continuity file.** Every session reads this before touching code
> and updates it before committing. Operational state lives here;
> `docs/lessons-learned.md` holds errors and lasting rules;
> `docs/structural-analysis.md` holds the technical X-ray.
>
> Reference: `engineering-principles.md` §A.3 (Session Continuity).

---

## Current State

> ⚡ Last updated: 2026-08-19 (session close)

**Project phase:** the session's work is merged into `main` (unreleased; version
deliberately still 3.0.0 — `release.yml` publishes on push to `main` only when
the version changes).

### In progress

- Nothing in flight. Every planned unit is delivered; what remains is a
  decision, not implementation.

### Recently completed

- Activation graph wired: orphans 3 → 0, hub out-degree 1 → 7, cycles 0.
- Doc templates carry the fields their rules demand.
- Drift sweep: 4 findings closed, each with a guard behind it.
- Size rule replaced by a trigger-keyed test; all 7 over-budget skills treated.
- Feedback queue U1–U10 complete.
- Three further holes found by measurement and closed: dangling names, stale
  inventory counts, and `companions` having no mechanical trigger.

### Blockers

- No active blockers. The push credential gap from earlier the same day was
  resolved: `gh` CLI installed user-local (`~/.local/bin`, no `sudo`), device-flow
  login as `barcelosvinicius`, `gh auth setup-git` wired it into `git`. All 37
  commits were rewritten (author/committer → `viniciusbsilva10@gmail.com`,
  `Co-Authored-By` trailers stripped) and fast-forwarded directly into `main` —
  the feature branch was deleted, local and remote, once its tip matched
  `main`'s.

### Priority next steps

1. Confirm CI is green on `origin/main` for this push — **done when:** the
   GitHub Actions run for commit `69216d7` shows passing · **blocked by:**
   nothing; `release.yml` will run but should not publish, since the version
   did not change (3.0.0 → 3.0.0).
2. Decide whether to cut a release — **done when:** either `npm run release`
   has run or a note here records the decision to wait · **blocked by:**
   nothing.
3. Re-evaluate deferred proposal 13 (document dependency graph) — **done when:**
   a session records whether the §0 fact panel answered *"what else must
   change?"* on its own · **blocked by:** a few sessions of real use.

---

## Delivery History

> Reverse chronological. Each entry is immutable.

### [2026-08-19] Push, identity, and unification into `main`

**Owner:** vinicius + Claude Opus 5

**Deliveries:**
- Resolved the push credential gap recorded at session close: `gh` CLI
  installed user-local (no `sudo`), authenticated via device flow as
  `barcelosvinicius` (the repo owner), `gh auth setup-git` wired it into `git`.
- All 37 commits rewritten: author/committer unified to
  `viniciusbsilva10@gmail.com` (was `the corporate identity`,
  mismatched against this repo's prior history and the pushing account);
  `Co-Authored-By` trailers stripped from every message.
- `main` fast-forwarded to the branch tip (no merge commit) and pushed to
  `origin/main`. The feature branch `feat/wire-session-continuity-graph` was
  then deleted, local and remote — the user asked why it existed at all, and
  once the identity was fixed and pushed directly, keeping it served no
  purpose.

**Decisions:**
- Unify directly into `main` rather than open a PR. The branch had existed as a
  precaution against `release.yml` publishing unintentionally; that risk does
  not apply here since the version was never bumped.

**Next steps:** confirm CI is green on `origin/main`.

**Blockers:** none.

**Verified:** `git rev-parse main` == `git rev-parse origin/main` == `69216d7`
· `npm run validate` and `npm test` (39/39) re-run after both the identity
rewrite and the fast-forward · commit messages and authorship spot-checked
after rewrite.

### [2026-08-19] Phase 5, the size test, and three holes found by measuring

**Owner:** vinicius + Claude Opus 5

**Deliveries:**
- Feedback queue completed: U4 (parallel agents read, one writer writes),
  U5 (history ceiling + each doc names its nature), U6 (the close checks rather
  than composes), U7 (`companions`), U8 (zero without a denominator),
  U9 (`proc-safe-removal`), U10 (a rule ships with a case that makes it fail).
- Size rule became a trigger-keyed test; all seven over-budget skills treated —
  three came under the line, four record *leave it*. Skills with a resource file
  10 → 16.
- Three holes closed after this round's own measurement: a renamed skill left
  prose references pointing at nothing and passed the build; `README.md` claimed
  28 skills when there were 29; `companions` was protocol with nothing
  mechanical behind it.
- `docs/HISTORY.md`, `docs/lessons-learned.md`, `docs/action-plan.md` created;
  this repo now runs the protocol it ships.

**Decisions:**
- `proc-safe-removal` shipped **larger than triaged** — the proposal asked for a
  deletion protocol; the errors made here showed relocation has the same silent
  shape, so it covers both.
- Moving the SDD variants out of the hub was tried and **reverted**: 6 lines
  saved for an extra file and two jumps. The test extracts lookup, not volume.
- Typed edges stay at 4 of 29 by decision, recorded as P-07: prose does not
  execute, so there is no hidden cycle, and forcing 22 declarations is
  bureaucracy.

**Next steps:** push the branch, open the PR, decide on the release.

**Blockers:** no push credential in this environment (see Current State).

**Verified:** `npm run validate` passes · `npm test` 39 pass / 0 fail ·
`node scripts/graph-audit.js --check` matches · `node scripts/backlog-audit.js
--check` matches · `node bin/be.js install <tmp> --dry-run` ok · all 36 commits
re-checked out and verified individually · goal declared at session start ✅
achieved and exceeded.

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
