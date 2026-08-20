# 📋 Session History — basic-engineering

> **Mandatory continuity file.** Every session reads this before touching code
> and updates it before committing. Operational state lives here;
> `docs/lessons-learned.md` holds errors and lasting rules;
> `docs/structural-analysis.md` holds the technical X-ray.
>
> Reference: `engineering-principles.md` §A.3 (Session Continuity).

---

## Current State

> ⚡ Last updated: 2026-08-19 (portability session, committed, not pushed)

**Project phase:** `main` is published at 3.0.0 and CI is green. A second
session on 2026-08-19 — the first ever run from the **Windows** workstation —
found and fixed a class of defect the Linux-side sessions could not see. That
work is **committed to local `main` in eight commits and not yet pushed**. No
version bump: `release.yml` publishes on push to `main` only when the version
changes, so pushing this does not release it.

> **Environment note.** This base is operated from more than one machine: a
> Linux environment (where every session up to 2026-08-19 ran, and where CI runs
> on `ubuntu-latest`) and a Windows workstation with Git Bash. Any fact about
> tooling, paths or installed versions is **machine-scoped** and must name its
> machine — see the lesson recorded for this in `lessons-learned.md`.

### In progress

- Nothing half-done. The portability work is committed in eight function-grouped
  commits, **each re-checked out in a separate worktree and verified on its
  own** — validate, the full suite, and both `--check`s.

### Recently completed

- **The audits stopped measuring the operating system.** Backlog probes were
  shell strings run through `cmd.exe` on Windows; they are filesystem
  predicates now (`scripts/lib/probes.js`).
- **The fact panel is generated end to end.** Its hand-kept half went stale
  *within one session* while the generated half failed the build — same file,
  same author, same hour.
- **`be doctor`** reports the per-machine state the repository cannot see.
- **Backlog item 18 closed** with `qa-comment-analyzer`,
  `qa-type-design-analyzer` and `mgmt-spec-miner`: 17 done · 1 partial · 2 not
  started.
- Earlier the same day: activation graph wired (orphans 3 → 0, hub out-degree
  1 → 7), size rule replaced by a trigger-keyed test, feedback queue U1–U10.

### Blockers

- **The plugin's hooks do not run on the Windows machine.** Proven by the
  session transcript: zero hook records for `be`, against four for another
  plugin in the same session, so failures *are* recorded and this was an
  absence. Two hypotheses were refuted (the `shell` field already defaults to
  bash; `${CLAUDE_PLUGIN_ROOT}` is substituted by Claude Code, not by a shell).
  The remaining candidate is the install itself: **v2.0.0 from 2026-06-10** on
  this machine against 3.0.0 in the repo, with 1 hook script of 5. The
  experiment that separates "stale install" from "environment" — registering a
  probe hook in `.claude/settings.local.json` — was **blocked by the permission
  classifier** and needs the user's authorisation.
- *(machine-scoped, resolved on the Linux machine)* The push credential gap of
  the earlier session was fixed there with a user-local `gh` install
  (`~/.local/bin`, no `sudo`) and device-flow login. That path **does not exist
  on the Windows machine**, where `gh` is the system install — the original note
  read as a false claim until it was scoped.

### Priority next steps

1. **Push `main`** — **done when:** `git rev-parse main` equals
   `git rev-parse origin/main` and the GitHub Actions run is green ·
   **blocked by:** nothing. The version is unchanged, so `release.yml` runs and
   deliberately publishes nothing.
2. **Settle the hook outage (D-5)** — **done when:** either the probe-hook
   experiment has run and named the cause, or `/plugin update be@basic-engineering`
   brings this machine to 3.0.0 and a later session shows the `be` SessionStart
   context on screen · **blocked by:** user authorisation for the settings
   experiment, or the user running the update.
3. **Decide whether to cut a release** — **done when:** either `npm run release`
   has run or a note here records the decision to wait · **blocked by:** nothing;
   the guard that blocked it from Windows is fixed and proven by a dry run.
4. Re-evaluate deferred proposal 13 (document dependency graph) — **done when:**
   a session records whether the fact panel answered *"what else must change?"*
   on its own · **blocked by:** a few sessions of real use.

---

## Delivery History

> Reverse chronological. Each entry is immutable.

### [2026-08-19] The first session from Windows, and what only Windows could see

**Owner:** vinicius + Claude Opus 5 · **Machine:** Windows workstation, Git Bash
(MINGW64). Every previous session ran on a Linux machine; CI runs `ubuntu-latest`.

**Deliveries:**
- **The backlog audit measured the operating system.** Its probes were shell
  one-liners run through `execSync`, which spawns `cmd.exe` on Windows — where
  `'…'` does not quote, so every probe containing a `|` was split into a real
  pipe and `$(…)` was never substituted. Five of 26 probes failed for that
  alone; the audit reported shipped work as *not started* (12·3·5 against the
  true 16·2·2) and, since `release.js` runs `--check` as a pre-flight guard,
  **`npm run release` could not run from this machine at all** — while CI stayed
  green. Probes are now filesystem predicates (`scripts/lib/probes.js`).
- **The fact panel is generated end to end.** Two payload rows carried a proof
  command (`cat … | wc -c`) whose value changes with `core.autocrlf`, and the
  skills row had drifted 7,752 B. Everything derivable is now generated with CR
  stripped; §0.2 became a *delivery surface* of verdicts, not counts.
- **`.gitattributes` pins `* text=auto eol=lf`** — the root of that whole class.
- **The stale-count guard now reads the manifests.** Both `plugin.json` and
  `marketplace.json` claimed "28 skills" with 29 shipped — the description the
  marketplace and npm show.
- **`be doctor`** reports what the repository cannot see: which plugin version
  is installed *on this machine*, which hook events are consequently not
  running, and whether the checkout normalises line endings.
- **The session start now asks whether this machine is on the latest base** —
  one bounded npm lookup (2s, cached a day, `BE_UPDATE_CHECK=off` to disable,
  silent on any failure). The "what you gain" line is derived by comparing the
  published description's counts with what is on disk, so it cannot drift; when
  the published description carries no counts the line is simply omitted rather
  than guessed, which is what happens today until the next release.
- **Backlog item 18 closed** — `qa-comment-analyzer`, `qa-type-design-analyzer`,
  `mgmt-spec-miner`. Backlog: 17 done · 1 partial · 2 not started.

**Decisions:**
- **Normalise, do not adapt.** Where a value differed by platform the fix was to
  make it the same everywhere (LF-normalised bytes, shell-free predicates), not
  to branch per platform. Adaptation was reserved for what is genuinely
  per-machine — and that got a diagnosis command instead of a branch.
- **The three technique agents were built, not declined.** The intake filter
  argued for declining (six weeks of use produced 23 proposals asking for none
  of them); the user chose to ship them, and that decision is recorded here
  rather than re-litigated later.
- `be doctor` **exits 1 when it finds something**, matching `be check`.

**Next steps:** commit this work; settle the hook outage; decide on the release.

**Blockers:** the hook outage (see Current State) — its decisive experiment
needs user authorisation.

**Verified:** `npm run validate` passes · `npm test` **65 pass · 0 fail** (was
39) · `node scripts/graph-audit.js --check` and `node scripts/backlog-audit.js
--check` both match · installer smoke test installs 18 agents · every new guard
exercised against a known positive, including a real mutation that reintroduced
`require('child_process')` and made the suite fail · **each of the seven commits
re-checked out in a separate worktree and verified on its own**.

*(This line first said 55 — the count at the moment it was written, stale two
commits later. Corrected, and noted rather than quietly patched: it is the
fourth instance this session of the rule that a derived number restated in prose
goes stale by construction. A `Verified:` line is a record of an instant, so the
number belongs to the instant the entry closes, which is now.)*

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
