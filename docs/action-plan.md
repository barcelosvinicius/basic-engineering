# Action Plan — correction and adjustment

> Consolidates everything open after the 2026-08-19 session: the drift sweep, the
> baseline's pending items, and the triaged feedback queue. Written to the format
> this base now prescribes — every item states **how we will know it is done**
> (verifiable by command) and **what must be true first**.
>
> Sources: `docs/structural-analysis.md` (baseline) ·
> `feedback/project-a-2026-08-19/TRIAGEM.md` (23 proposals → 10 units) ·
> drift sweep of 2026-08-19.

**Created:** 2026-08-19 · **Against:** `be` 3.0.0

---

## The principle that orders this plan

Every fix in **Phase 1** gets its guard in **Phase 2**. Fixing an instance without
leaving something that catches the next one is how this base got here: the rules
were right and nothing checked them, so `resources.md` drifted 14%, the backlog
claimed "nothing implemented" while 16 of 20 items shipped, and two skills
prescribed incompatible formats for the same section for months.

A correction with no guard is maintenance. A correction with a guard is a fix.

---

## Phase 1 — Close the active drifts ✅ done 2026-08-19

These are wrong *right now* and mislead whoever reads them next.

### 1.1 ✅ One owner for the `## Domain map` section — DR-01

- **Measured:** `proc-structural-analysis` Phase 4 prescribes a YAML block
  (`name / entry_module / flows / entities`); `proc-domain-mapping` Phase 5
  prescribes Markdown tables (`Bounded contexts / Context relationships /
  Domain event catalogue / Flow index`). Same target section of the same file,
  two incompatible schemas — whichever skill runs last wins.
- **Do:** delete Phase 4's schema from `proc-structural-analysis`; replace it
  with an `invoke` edge to `proc-domain-mapping`, which already declares it owns
  this output. The relationship was declared on one side only; make it mutual
  and executable.
- **Side effect predicted:** `proc-structural-analysis` drops ~20 lines.
  **Actual: net zero** (255 → 255). The delegation text plus the edge table cost
  what the schema cost. The duplication is gone, the size problem is not — that
  belongs to 3.3, not here.
- **Done when:** no `SKILL.md` carries the competing schema **inside a code
  block** — `awk '/^```/{c=!c;next} c&&/entry_module/{k++} END{print k+0}'` over
  each file returns 0 for all — and `node scripts/graph-audit.js` shows the new
  edge. *(The first version of this criterion said `grep -l '## Domain map'` must
  return one file. Wrong: `proc-structural-analysis` legitimately lists that
  heading among the output document's sections — it owns the document, while
  `proc-domain-mapping` owns that section's schema. The conflict was never the
  heading; it was the fields underneath. Caught while executing the plan.)*
- **Blocked by:** nothing. **Effort:** low.

### 1.2 ✅ Refresh the hub's index — DR-02

- **Measured:** `proc-session-continuity/resources.md` omits 3 skills
  (`proc-context-budget`, `qa-verification-loop`, `sec-agent-security`) and 3
  agents (`qa-pr-test-analyzer`, `qa-release-sanitizer`,
  `qa-silent-failure-hunter`) — 6 of 43 entries, 14%.
- **Do:** add the six. Do not restructure the file.
- **Done when:** every directory in `skills/` and every file in `agents/` is
  named in `resources.md` (the check added in 2.1 passes).
- **Blocked by:** nothing. **Effort:** low.

### 1.3 ✅ Declare the naming exception — DR-03

- **Measured:** `engineering-principles` is the only skill outside the prefix
  set `CLAUDE.md` declares. The undeclared exception is not cosmetic: it made a
  prefix-based measurement miss the second most-referenced skill in the base and
  report 9 graph leaves instead of 7.
- **Do:** either rename it to a declared prefix, or state the exception in
  `CLAUDE.md` and in the check from 2.2. **Recommendation: declare, do not
  rename** — it is referenced 12 times, and a rename is a breaking change to
  every installed base for a cosmetic gain.
- **Done when:** the prefix check in 2.2 passes with the exception listed
  explicitly, not silently tolerated.
- **Blocked by:** nothing. **Effort:** low.

### 1.4 ✅ `BASE_VERSION` — the diagnosis was wrong, the drift was elsewhere — DR-04

- **What DR-04 claimed:** the format is documented as `vYYYYMMDD-HHMMSS` but
  `v20260617-000002` uses the time field as a sequence, so the doc lies.
- **What the code says:** `scripts/release.js` generates a **real timestamp**
  (`getHours/getMinutes/getSeconds`). The format is correct; the two odd values
  are hand-written legacy from before that script existed. **DR-04 as written
  was wrong**, and "fixing" it would have propagated an error to six files that
  document the format. Caught by reading the generator before editing the docs.
- **The real drift, found underneath it:** `release.js` used **local time** while
  `CONTRIBUTING.md` documents **UTC**. For a value compared lexicographically
  across machines, that can invert: two releases cut on the same day from
  different timezones can order backwards, and the installer would read the
  newer base as older.
- **Done:** `release.js` now derives `BASE_VERSION` **and** the CHANGELOG date
  from the same UTC instant (so they can never disagree about the day), and
  **refuses to write a value that is not strictly greater** than the one it
  replaces — the failure class is now unrepresentable, not merely avoided.
- **Also fixed, found while proving the guard:** `--dry-run` deliberately writes
  the release files so the diff can be read, and it skips the clean-tree guard —
  so it is precisely the mode where a file may hold unrelated uncommitted work.
  It used to print `git checkout -- <all release files>` as the revert
  instruction, which would **discard that work**. It now detects the collision,
  names the affected files, and omits them from the suggested command.
- **Proof:** a `BASE_VERSION` from the future makes `npm run release -- --dry-run`
  refuse before writing anything; a dirty `CHANGELOG.md` makes the dry run print
  the warning instead of the destructive command. Both exercised on 2026-08-19.

## Phase 2 — Give each rule a guard ✅ done 2026-08-19

`npm run validate` already runs in CI and now carries the cycle detector. Each
check below follows the same discipline: **it ships with a known positive case
that makes it fail**, or it does not count (SUGESTOES §23).

### 2.1 ✅ Index completeness check

- **Do:** `validate.js` fails when a skill directory or agent file is not named
  in `proc-session-continuity/resources.md`.
- **Prevents:** DR-02 recurring. `proc-skill-creator` Step 7 already commands
  the registration; nothing enforced it.
- **Done:** `checkInventory()` in `scripts/validate.js`, predicates in
  `scripts/lib/inventory.js`, pinned by `test/inventory.test.js`.
- **Proof:** removing `sec-agent-security` from `resources.md` produced
  `"sec-agent-security" is not registered in …` and failed the build. Restored.

### 2.2 ✅ Naming-convention check

- **Do:** `validate.js` fails on a skill/agent whose prefix is outside the
  declared sets, with the exception list held in one place.
- **Prevents:** DR-03 recurring, and the class of measurement error it caused.
- **Done:** same module; the exception list lives in one place
  (`PREFIX_EXCEPTIONS`), so tooling stops rediscovering it as an anomaly.
- **Proof:** a planted `zzz-planted` skill failed validation with
  `prefix outside proc-, be-, fe-, qa-, sec-, ops-, infra-`. Removed.

### 2.3 ✅ Backlog status can go stale but not silently — closes P-05

- **Do:** `/be:release-check` (and `RELEASING.md`) run `node scripts/backlog-audit.js --md`
  and refuse a release whose committed table differs from the command's output.
- **Prevents:** the two-month drift that produced three wrong hand-counts in one
  session.
- **Done:** `node scripts/backlog-audit.js --check` (also `npm run audit:backlog`),
  wired as a **pre-flight guard in `scripts/release.js`** — before any file is
  written — and documented in `RELEASING.md`.
- **Proof:** flipping item 17 from `❌ todo` to `✅ done` in `BACKLOG.md` made
  both the check and `npm run release -- --dry-run` fail, with the version files
  untouched. Restored.

---

### 2.4 ✅ The fact panel re-runs itself

- **Why it was added:** phases 1–2 guarded the inventory and the backlog, but
  nothing re-ran the numbers in `docs/structural-analysis.md` §0 — the same
  failure class one level up, and the one that bites hardest when several fronts
  advance at once. The hand-kept counts in §0.2 went stale twice inside a single
  day of work.
- **Done:** §0.2 is now a **generated block** (`node scripts/graph-audit.js --md`),
  verified by `--check`, which runs as a test so CI catches staleness on every
  push. Rows that cannot be machine-derived stay in a separate hand-kept table
  with their proof command, labelled as such — no pretending.
- **Proof:** flipping the orphan count from 0 to 3 in the doc fails `npm test`.
- **Deliberately not automated:** parsing the free-form fact rows. A fragile
  parser would become its own false-alarm source — the same mistake as the
  code-percentage heuristic rejected in 3.1.

## Phase 3 ✅ done 2026-08-19 — Size: the criterion, then the extraction

### 3.1 ✅ Replace the bare number with a test

- **Measured, and this is the point:** the current rule ("`SKILL.md` ≤ ~150
  lines; long material goes to resources") has **near-zero compliance where it
  matters** — 5 of the 7 over-budget skills have **zero** resource files. A rule
  that says *how much* but not *what to move* does not get applied.
- **Do:** state the criterion in `CLAUDE.md` and `proc-skill-creator` as three
  outcomes, not two:
  - **Leave it** — one trigger, one output, the material is decision procedure.
  - **Extract to a resource** — the trigger enumerates cases, but each case needs
    *lookup*, not a decision of its own.
  - **New skill** — the trigger splits **and** each part has its own decision and
    its own output.
  The discriminator is the **trigger**, never the line count. Size is the alarm
  that says "apply the test"; it is never the verdict.
- **Do not ship the quantitative heuristic.** ">30% of the file in code blocks"
  was tested against all 28 skills and produced **2 false positives out of 5
  flags** (`qa-test-data-builders` at 93 lines, `proc-adr` whose block is the ADR
  template). A compound form (`>150 lines AND ≥6 code blocks`) flags exactly the
  two real catalogues — but it was tuned on the same corpus it was validated
  against, which is weak evidence. Ship it as a **reporting hint**, never as a
  gate.
- **Done:** the three outcomes are stated in `proc-skill-creator` and summarised
  in `CLAUDE.md`; the checklist now says to apply the test and record the outcome
  instead of trimming blindly. The stale row telling authors that growth always
  means extraction was corrected in the same pass.
- **Applied to itself first:** `proc-skill-creator` moved provenance and pruning
  to `lifecycle.md` (lookup for a subset of authors) and records its own verdict
  — *leave it*, a single-trigger procedure. It is still 211 lines, and that is
  the point: the budget is the alarm, not the verdict.

### 3.2 ✅ Extract the embedded lookup material — closes P-06

- **Measured:** `fe-accessibility-patterns` costs ~2,130 tokens per activation
  and has 10 sections, one per component type. A session implementing a modal
  loads all ten; the modal-specific material is 27 of 293 lines — **~9%
  relevance**. `fe-ux-patterns` is the same shape at 275 lines and 8 blocks.
- **Do:** keep in each `SKILL.md` the decision procedure and move the lookup
  material to sibling resource files. Six skills, one per commit:
  `fe-accessibility-patterns` and `fe-ux-patterns` (per-component catalogues),
  `proc-structural-analysis`, `proc-domain-mapping`, `proc-impact-analysis` and
  `proc-changelog` (each embeds its own output template).
- **Done:** all seven, one per commit, each verifying that its code lines were
  preserved exactly. Three came under the budget; four record *leave it*.
  Full before/after table in `structural-analysis.md` P-06.
- **What the exercise found:** the pattern was systematic — every one of the
  seven carried its own output template or catalogue inline.

### 3.3 ✅ (folded into 3.2) The remaining over-budget skills

- **Do:** apply 3.1's test to `proc-structural-analysis` (255, minus ~20 after
  1.1), `proc-domain-mapping` (227), `proc-impact-analysis` (207),
  `proc-skill-creator` (193), `proc-changelog` (158).
- **Predicted verdict was wrong.** The plan expected *"all five are
  single-trigger pipelines, so leave them"*. Applying the corrected test
  (2026-08-19) gives **extract** for all six, for a reason the prediction
  missed: single-trigger is only question 1. Question 2 — *decide or look up?* —
  catches what every one of them embeds, its **own output template**. That is a
  systematic pattern in this base, not six coincidences: the pipeline skills all
  carry the shape of their deliverable inline, and pay for it on every
  activation.
- **Consequence for this item:** there is nothing to record separately. A
  verdict of *extract* is discharged by extracting, so 3.3 folds into 3.2 and
  the per-skill note is not written — a temporary note that disappears on the
  next commit is drift waiting to happen.
- **Do NOT merge `proc-structural-analysis` with `proc-domain-mapping`** — an
  earlier suggestion in this session, refuted by measurement: their vocabularies
  are nearly disjoint (`bounded context` 0 vs 14; `risk` 7 vs 1).
- **Done when:** every skill over the budget has had the test applied and the
  outcome discharged — extraction done, or a recorded *leave it*.
- **Blocked by:** 3.1 (done). **Effort:** folded into 3.2.

---

## Phase 4 ✅ done 2026-08-19 — This repo follows its own protocol — closes P-04

- **Measured:** `docs/HISTORY.md` and `docs/lessons-learned.md` do not exist. The
  repo that prescribes session continuity has no record of its own decisions
  since 3.0.0.
- **Do:** create both from the base's own templates (now carrying the fields from
  A-06), and close this session through `/be:session-end` rather than by hand.
- **Done:** both created from the base's own templates, in the formats added by
  A-06 — next steps carry a done-criterion and a blocker, the session entry
  carries `Verified:`, each lesson carries `Evidence:` and `Scope:`.
- **Note worth keeping:** every lesson recorded came out `Scope: method`, which
  in this repo means it belongs in the shipped base. The promotion question
  answered itself on its first run.

---

## Phase 5 ✅ done 2026-08-19 — The remaining feedback units

From `TRIAGEM.md`; U1–U3 landed on 2026-08-19. Ordered by effect/cost, unchanged.

| U | Unit | Proposals | Effort | Note |
|---|------|-----------|--------|------|
| **U4** | ✅ Parallel agents read; one writer writes. Five sweep commands declare their axis | 14, 11 | Low | done 2026-08-19 |
| **U8** | ✅ Zero without a denominator | 9 | Low | done 2026-08-19 |
| **U10** | ✅ Every verifiable rule ships with a case that makes it fail | 23 | Medium | done 2026-08-19 — six instances from this branch as evidence |
| **U9** | ✅ `proc-safe-removal`: four axes + `// NB:`, **plus content relocation** | 10 | Medium | done 2026-08-19 — Part 3 is a gap found by making the mistakes |
| **U6** | ✅ The close **checks** rather than composes; delta contradiction sweep | 17, 2, 4 | Medium | done 2026-08-19 — both failure modes were produced while building this branch |
| **U5** | ✅ History compaction rule + each doc names its own nature | 1, 12 | Medium | done 2026-08-19 — ceiling at ~800 lines, archive verbatim, never summarise |
| **U7** | ✅ Close every repo the session touched (`companions:`) | 7, 6 | Medium | done 2026-08-19 |

---

## Phase 6 ✅ done 2026-08-19 — What only another machine could see

Opened by the first session ever run from the **Windows** workstation. Every
finding below existed for weeks and was invisible from Linux, which is where all
prior sessions and CI run.

| # | Finding | Fix | Guard |
|---|---------|-----|-------|
| D-1 | Backlog probes ran through `cmd.exe`; every probe with a `\|` broke, reporting shipped work as not started and **blocking `npm run release`** from this machine | filesystem predicates, no shell | `test/probes.test.js`, proven by a real mutation |
| D-2 | `Skills payload` stale by 7,752 B (5.9%) | row generated | `graph-audit --check` |
| D-3 | Payload proof command changed value with `core.autocrlf` (142,752 vs 139,253) | counted with CR stripped; `.gitattributes` pins `eol=lf` | `test/doctor.test.js` |
| D-6 | Both manifests claimed "28 skills" with 29 shipped — the marketplace/npm description | descriptions corrected | count guard extended to manifests |
| D-7 | Four hand-kept panel rows went stale **inside this session** while the generated rows failed the build | panel generated end to end | `graph-audit --check` as a test |
| P-08 | The plugin's hooks never execute on this machine (v2.0.0 installed, 1 hook script of 5) | **open** — see `structural-analysis.md` | `be doctor` makes the outage visible meanwhile |

**Item 18 was also closed here** — `qa-comment-analyzer`,
`qa-type-design-analyzer`, `mgmt-spec-miner`. The intake filter argued for
declining all three (23 proposals from real use asked for none of them); the
user chose to ship them. Recorded as a decision, not an oversight.

**The principle this phase adds to the one at the top of this plan:** *normalise
before adapting.* Where a value differed by platform, the fix was to make it the
same everywhere — LF-normalised bytes, shell-free predicates — not to branch per
platform. Branching multiplies the states you must test; normalising removes
them. Adaptation was reserved for what is genuinely per-machine (which plugin
version is installed), and even there the answer was a **diagnosis**, not a
branch.

---

## Sequencing

**Phase 1 → Phase 2 (+2.4) → Phase 3.1 → Phase 4 — done on 2026-08-19**, in ten
plus three commits, each one re-checked out and verified in isolation. Every
active drift is closed, each with a guard behind it; the size number is a test;
and this repo now runs the protocol it sells.

**Phase 3.2, 3.3 and Phase 5** are separate sessions. 3.2 is careful surgery on
600 lines of material that must be moved without loss; Phase 5 is seven
independent units, each small, none blocking the others.

## Explicitly not in this plan

- **Renaming `engineering-principles`** — breaking change to every installed
  base for a cosmetic gain (1.3).
- **Merging the two analysis skills** — refuted by measurement (3.3).
- **Shipping the code-percentage heuristic as a gate** — failed validation (3.1).
- **`BACKLOG` items 14 and 17** (JSON schemas, always-on `rules/` layer) — the
  only two never started, and six weeks of daily use produced 23 proposals
  asking for neither.
- **A version bump or release** — nothing here is published until the work is
  reviewed; `release.yml` publishes on push to `main` when the version changes.

---

*Created 2026-08-19 · Update item status here, not in a second place.*
