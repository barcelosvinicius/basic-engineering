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

## Phase 7 — queued for promotion into the shipped base

Every lesson recorded on 2026-08-19/20 came out `Scope: method`, which in this
repo means it does not belong only in `docs/` — it belongs in what other
projects install. Queued rather than written today, because the session's
subject was portability and a rule shipped in a hurry is the next drift.

| Lesson | Where it belongs | Done when |
|--------|------------------|-----------|
| A fact about tooling belongs to a machine | `proc-session-continuity` — living-doc facts about paths, credentials or installed versions must name their machine | the skill states it and the `HISTORY.md` template carries the field |
| Fail-open plus silence hides a total outage | `qa-verification-loop` / `sec-agent-security` — anything that degrades silently needs an interrogable second channel | the rule is stated with `be doctor` as its worked example |
| A guard that shells out measures the shell | `proc-skill-creator` checklist — a check that decides a fact reads the filesystem, it does not delegate to a shell | the checklist item exists and names the cmd.exe quoting case |
| If you distribute files, you own their line endings | `infra-ci-cd` — `.gitattributes` from the first commit for any repo that ships files | the skill says it, with the re-clone-not-update caveat |
| Generated rows held while hand-kept rows drifted | already enforced here by `graph-audit --check`; the *rule* belongs in `proc-structural-analysis` | the skill tells authors to generate the panel, not to write it |
| *(2026-09-20)* A guard's suite that only asserts what must block never measures what must pass | `qa-verification-loop` and `proc-skill-creator` — the known-positive checklist item gains its mirror: the nearest case that must be **allowed** | the checklist asks for both directions, with the bypass-guard false positive as the worked example |
| *(2026-09-20)* A check nobody automated was green because nobody ran it | `infra-ci-cd` — a `--check` mode is wired the day it is written, and a check that needs a manual step first is a defect in the check | the skill states it, with `--write` as the worked answer |
| *(2026-09-20)* We shipped the rule and exempted ourselves | `proc-skill-creator` — a skill that tells others to run something is tried against this repo before it ships; the failure usually names the missing half of the rule | the checklist item exists and cites the SHA-pinning case, where the advice gap and the practice gap were the same gap |

**Blocked by:** nothing. **Effort:** low each; they are sentences, not systems.
**Do not batch them into one commit** — a rule per commit, each with the case
that makes it fail, is the discipline the base itself prescribes.

---

## Phase 8 — the second wave from the `nao-depende-de-lembrar` analysis

Source: `feedback/nao-depende-de-lembrar-2026-09-20/DE-PARA.md`. The first wave
shipped on 2026-09-20 (nine commits). What is left divides into one item waiting
on evidence and three that **decide better together than apart** — all three are
the same conversation about narrowing a trigger until it can be left on.

**Merged in on 2026-09-22:** the triage of `project A` proposals 24–29
(`feedback/project-a-2026-08-19/TRIAGEM.md` §6). They joined this phase
instead of opening a new one, because four of the six were objects already here:
26 is the ladder of 8.2–8.4 reached from another origin, 27 is the case 8.1 was
waiting for, 21 was already 8.3. What is genuinely new is 8.0, 8.6 and 8.7.

### 8.0 ✅ done 2026-09-22 (`f116efc`) — The proposal ledger accuses a proposal without a state

| | |
|---|---|
| **What** | `scripts/proposals-audit.js`: every numbered proposal in a `feedback/**/SUGESTOES.md` carries an `**Estado:**` line under its title; numbers are unique and contiguous; an `implantada` state cites the commit that proves it. `--draft <path>` regenerates the status index at the top of the project's own draft copy and lists the proposals that exist there but not here. |
| **Why** | `project A` proposal 28, measured by its own triage: proposals 24–28 lived only in the project's unversioned draft — the oldest from a fact of 2026-09-10 — and the number 24 was used for two different proposals — with nothing to say so. The triage of 2026-08-19 was a snapshot; nothing declared it stale. |
| **Done when** | the check fails on a known-positive fixture (a missing state, a repeated number, a proof-less `implantada`) and passes on its mirror (a heading that only *mentions* a number); it runs inside `node --test`, so CI and the release execute it the day it is written. |
| **Blocked by** | nothing. **First**, because it is what stops the next proposal from getting lost. |

### 8.1 ✅ done 2026-09-22 — Divide to conquer, as a skill

| | |
|---|---|
| **What** | `proc-analysis-blocks` — the general rule for splitting an analysis into blocks that each close with a verifiable verdict. Not a new review: `proc-code-review` (by layer) and `proc-impact-analysis` (by fixed axes) are instances of it for questions whose axes are already known; both would declare an activation edge to it rather than duplicate it. |
| **Why** | Stated by the owner from repeated observation: analyses that are too large always left drifts and obvious errors behind. This session is evidence on both sides — the seven-finding sweep worked because it was partitioned by surface, and the two silly errors of the same session (a blocked heredoc, a panel that drifted mid-session) happened in the stretches worked as one block. |
| **The six rules, provisional** | declare the blocks before looking · a block is what closes in one verifiable statement (that is the size rule, and the only non-arbitrary one) · every block closes with verdict + evidence, never "looks fine" · report where the guard already works, or the output becomes an alarm list people learn to skip · name the class before fixing the case, then re-sweep the other blocks for siblings · re-measure at the end, because the object may have changed during the analysis — possibly by you |
| **The case from outside** | `project A` proposal 27 (triaged 2026-09-22), same author and same document: **one batch of 34 edits** — 2 defects escaped, 0 caught; **11 batches, each checked** — 0 escaped, 5 caught, all by reading the generated output. The owner's formulation: *"dividing to conquer is directly related to the context window — a window that is too large drastically reduces our capacity and quality of analysis."* Its three rules land on rules 1, 2–3 and 6 above. Proposal 12 is the other axis — the cost of reading — and is already shipped. |
| **Blocked by** | **partly lifted on 2026-09-22** by proposal 27, which gives measured cases to rules 1, 2, 3 and 6. Rules 4 and 5 still need theirs; each rule must cite the measured case that produced it, the way the reference repo's gates do, and a rule without a case gets pruned rather than shipped. |
| **Done when** | the skill exists with a case per rule, passes the `proc-skill-creator` checklist, and at least one existing skill declares an edge to it. Rules 3 and 6 are the only two with a plausible mechanical check (over the shape of the report); the other four are discipline, and the skill says so instead of pretending otherwise. |

### 8.2 ✅ done 2026-09-22 — The map that already exists gains a trigger

**Measured on the same 19 sessions, and narrowed by what they showed** — 54
reminders became **17**, at most 3 in a session:
- the stack is read from the edited file's directory upward: at the project root
  only, an Angular component was offered the **Java backend** skills;
- tests and files outside the project ask for no stack;
- a bulk rewrite needs **many** targets — a one-file `sed -i` (fixing a typo) and
  rewrites of scratch files were firing the lot rule;
- **31 of the first 54 fires were repeats**: the gate's 30-minute idle expiry
  also cleared the once-per-session reminders. Reminders now survive it.

The five removal reminders were relevant as first written (`git rm` of
components, blocks of 17–21 lines).

`plugins/be/config/stack-mappings.json` already maps **7 stacks → their skills**,
detected by file indicators (`pom.xml` → five `be-*` skills, `tsconfig.json` →
four, and so on). Measured 2026-09-20: it is read by `commands/check.md`,
`commands/bootstrap.md`, `qa-verification-loop` and `BOOTSTRAP.md` — all markdown,
all degree 2 — and by **zero hooks**. The catalog, the map and the detection
indicators are already shipped; only the trigger is missing.

The reference repo's form is `catalogo_na_porta`: the catalogue arrives at the
second the piece is created, because *the trigger is the action, not the word*.
Ours does not need to block — `_lib.js` already has `warn()`, which injects
context and lets the tool through.

**State (2026-09-22): implemented, awaiting the measurement** — with 8.3, in the
same session. The first code edit per session offers the detected stack's skills;
a bulk-rewrite gesture brings the lot rule; a removal gesture brings
`proc-safe-removal`. Advisory, once per kind, logged beside the gate's fires.
**Done when:** a narrow trigger (first new code file per session, or the first
touch of a known directory class) offers the mapped skills, and a measured real
session shows **≤2 interruptions**. **Blocked by:** 8.3, which is the same
narrowing question.

**Absorbs `project A` proposal 26** (triaged 2026-09-22): its gesture → rule
map — `renumber | rename | remap | bulk replace` → the lot rule of 8.1, `remove a
file or block` → `proc-safe-removal` — is a concrete form of this trigger. The
case behind it: a rule that named its own failure mode in writing, nineteen days
old, did not prevent that exact failure, because it was read at session start and
the risk arrived hours later.

### 8.3 ✅ done 2026-09-22 — Narrow the gateguard trigger until it can ship on

**Measured, and it is born on.** Not by one live session but by replaying **19
recorded sessions** of `project A` (5,949 tool calls, 569 edits) through the
new gate, with file existence taken from the repository *at each session's
start*: **0 interruptions**, against **165** the old every-file gate would have
made. It guards **10 of that project's 395 versioned files** — `pom.xml`,
`src/main/frontend/package.json`, `Dockerfile`, `Jenkinsfile` and six security
files. The honest limit of this evidence: none of those 19 sessions edited a
guarded file, so the replay proves it does not interrupt, while the tests prove
it fires where it should. The replay is cheaper and wider than a live session —
19 sessions of real work instead of one arranged task — and it is repeatable.

The fact-forcing gate is opt-in and off by default because it stops the first
edit of *any* file. The reference repo refused it for exactly that reason
(`DECISOES.md §10`, third objection), and the objection is correct. The fix is
not to switch it on — it is to narrow the trigger to conditions a machine
decides alone, the way their gates do.
**State (2026-09-22): implemented, awaiting the measurement.** Narrow by default:
the first edit of an existing file in a high-impact class, judged on the
project-relative path; every fire is logged per session. **Measured by:** the
owner's ordinary session in `project A` with the development build, then
counting that session's log.
**Done when:** measured in a real session, interruptions ≤2 and the gate can be
born on. **Blocked by:** nothing. **Absorbs `project A` proposal 21** — the
same gate, the same objection, asked for from the project side — as its evidence
step: the real session is run in that project pair.

### 8.4 ✅ done 2026-09-22 (`7f12372`) — Write the entry criterion for "a rule becomes a gate"

The ladder of enforcement (prose → keyword recall → periodic sweep → gate at the
door), the entry test — *only a rule a machine decides alone; a gate that judges
becomes noise, and noise trains people to ignore red* — and the division **gate
at the start, watcher after**. Belongs in `engineering-principles` and
`proc-skill-creator`.
`project A` proposal 26 adds a fifth rung above the gate — **make the illegal
state unrepresentable** (an operation that only accepts a frozen target) —
because a gate is an enumeration, and what nobody enumerated passes.
**Done when:** the next new skill declares which rung it operates on.
**Blocked by:** nothing. **Effort:** low — these are sentences.

### 8.5 — Queued, to judge with evidence first

| Item | Note |
|---|---|
| PR template with the rite and a mandatory number | theirs refuses "improves performance" without a measurement |
| `o_basico` executable, probably as `be doctor <projects>` | the largest capability gap: they **measure** seven basics across every project daily, we **advise** one project when asked. Carry over their split of *has tests* from *the CI runs the tests*, and their lesson that a detector ignorant of the house's shape measures itself |
| ~~Mutation testing for our own scripts~~ | **promoted to 8.9 on 2026-09-22** — the owner's decision, with the bypass-guard defect as its measured case |
| Gate at the commit, and a first-class place for refused decisions | a refusal with a reopen trigger does not come back as a new idea |

### 8.6 ✅ done 2026-09-22 — `/be:check` reports the measured distance

**Shipped and measured on `project A`:** 6 of 8 controllers with no test
class — hand-checked against an independent count, and the two that do have one
are correctly absent from the list —
and 0 of 27 routes undocumented, with 2 found only inside a longer path, counted
apart. Building it against a real project corrected the ruler four times (a
first-argument regex saw 32 of 38 annotations; the docs write the external path;
`produces` is not a route; an unresolvable prefix must not invent `/`). The
`distance` rules live per stack in `config/stack-mappings.json`; a stack without
them prints NOT MEASURED. Mutation: 132/134, 2 equivalent — and that pass found
that the tool scored a **red** suite as perfect, now refused.

| | |
|---|---|
| **What** | One new phase in `qa-verification-loop` / `commands/check.md`, **report-only**, printing a count per line: the project checklist's quantifiable items, each run by its own command (`project A` 25); routes declared in code × routes the docs cite, resolving path constants rather than reading only the literal (29); controllers — or the stack's equivalent — with no test class at all (29). |
| **Why** | Two proposals, one shape. 25: all 6 blocking security items of a real checklist are measurable by a command, `/be:check` ran 0, and `console.log` stood at 55 under a "blocking" box for five months. 29: 9 endpoints absent from every doc and 5 of 8 controllers without a test, found only by a manual audit that nobody repeats. |
| **Rules it is born with** | **report, never block** — blocking on 55 pre-existing hits makes the gate unusable, and an unusable gate is switched off the next week · runs after `clean` (stale surefire XML counted a deleted test class) · never rewrites a file · reads the stack from `config/stack-mappings.json`, which `check.md` already consults — no second detector. |
| **Done when** | run against a real Spring project, the phase prints the three lists, and at least two items of each are re-checked by hand against the code; the skill carries a known-positive case and its mirror (an endpoint documented through a path constant is **not** reported). |
| **Blocked by** | nothing; sequenced after 8.4 so it is born declaring its rung (watcher, not gate). |

### 8.7 ✅ done 2026-09-22 (`3900476`) — A checklist item is answerable from the diff alone

`project A` proposal 24. Every checklist the base generates or reviews
(`proc-code-review`, `proc-release-checklist`, the pre-commit checklist of
`bootstrap`) phrases each item as a property of the **diff** — "not added", "not
introduced" — never as a state of the tree — "none in the project". A tree-state
item turns false for every later commit the moment one occurrence lands anywhere,
so everyone ticks it in good faith. Tree state keeps mattering; its place is the
debt record, with a count and a measurement date.
**Done when:** the three checklists are phrased that way and the rule sits next to
the 22nd's *the rule lives in the schema*. **Blocked by:** nothing. **Effort:**
low — sentences.

### 8.8 ✅ done 2026-09-22 (`cb3bb89`, load criteria `203638f`) — `qa-test-strategy`: which verification a change needs, and whether the tests prove anything

| | |
|---|---|
| **What** | One skill, not five. It decides, per change, which layers the change needs — unit, integration, end-to-end, load — and it carries **mutation as the ruler of test quality**: a test no mutant can kill passes without proving anything. Also: the TDD cycle where it pays (new behaviour with a clear contract), the integration/mock boundary, a few critical E2E journeys, and when a load test is required and against which number (the SLO of `ops-observability`). Stack commands as on-demand resources. |
| **Why, with each evidence class named** | **Measured, here (8.9):** the first mutation pass over the base's own guards — 53 of 199 mutants survived a green suite, 25 of them in an audit written that day with tests in both directions. *(Corrected 2026-09-22: this row first cited A-14 as "a surviving mutant in all but name". Measured, it is not — the old suite's two allowed cases kill the block-everything mutant; A-14 was a missing boundary case, which point mutation cannot produce.)* **Measured, in the field:** 5 of 8 controllers with no test class, and only what was touched recently had any (`project A` 29). **Reported by the owner:** mutation-shaped defects recur across past projects, and load becomes a problem as systems grow — no measured case in this repo yet, and the skill says so instead of borrowing one. |
| **The owner's framing, which decides the design** | the aim is not tests that pass, but tests that improve the construction and take the automatic out of a bad implementation. So mutation is not a coverage number to reach: it is the question *would any test notice if this line were wrong?* |
| **Done when** | the skill exists within the `proc-skill-creator` checklist (rung declared), `qa-verification-loop` phase 4 and `qa-engineer` reach it, and its mutation rule is exercised on this repo by 8.9 before it ships. |
| **Blocked by** | nothing. Enters this version by the owner's decision of 2026-09-22. |

### 8.9 ✅ done 2026-09-22 — Mutation applied to ourselves first

The ruler of 8.8, run on the base's own guards before it is recommended to anyone:
`scripts/mutation-check.js`, zero-dependency, over the hook guards in
`plugins/be/hooks/scripts/_lib.js` and the audits in `scripts/`.

| Module | First pass | Now |
|---|---|---|
| `hooks/scripts/_lib.js` | 31/41 | 39/41 + 2 equivalent |
| `scripts/proposals-audit.js` | 56/81 | 88/88 |
| `scripts/lib/probes.js` | 18/24 | 24/24 |
| `scripts/lib/edges.js` | 18/25 | 21/25 + 4 equivalent |
| `scripts/lib/inventory.js` | 23/28 | 28/28 |

**What it taught, which the skill must carry:**
- **Mutation measures the tests you have; it cannot find the case you never
  wrote.** Restored in a scratch copy, the pre-A-14 guard shows 10 survivors of
  34 — and **not** A-14. A-14 was a missing boundary case (a command that only
  *mentions* the flag); no single-point change produces it. The two rulers are
  complementary: mutation for the tests that exist, *the nearest case that must
  be allowed* for the ones that do not.
- **It finds design gaps, not only missing tests:** a half-deleted generated
  block would have been duplicated; it is now refused.
- **The ruler needed its own mirror.** Its known-failing case passed while the
  tool was broken — inside a test runner every mutant "survived". Only the
  mirror test caught it.

**Wired:** `npm run release` runs `--check` (about two minutes — too slow for
every push). CI is pending: a workflow edit cannot be pushed from the WSL
machine until its `gh` token gains the `workflow` scope.

---

## Phase 9 — the harness moves (2026-09-22)

The base uses the part of the harness that **blocks** and not the part that
**carries state**. Measured against Claude Code 2.1.278: of its **10 hook
events, the base used 3**. The rule it exists to enforce — continuity — sat on
the weakest rung: read at session start, reminded at Stop, and nothing at the
two moments the thread actually breaks.

### 9.1 ✅ done 2026-09-22 — Continuity at the moments it is lost

`PreCompact` writes the session state — branch, last commit, what is
uncommitted, whether the living docs are behind — to the session log and hands
it back as context, so a compaction cannot take it. `SessionEnd` leaves a note
when the session ended with code changed and the docs untouched; the next
`SessionStart` reads it **once** and clears it. The three read the same fact
from `_state.js`, and `stop.js` was moved onto it — it had its own copy,
through a shell.

**The case:** this session, 50 commits, kept its HISTORY true only because a
checkpoint was written by hand in the middle of it. **Found while building it:**
trimming `git status --porcelain` eats the leading space of a fixed-width
prefix, which silently turned `app.js` into `pp.js`; the test caught it before
the hook shipped. Mutation on the new module: 15/15.

### 9.2 ✅ done 2026-09-22 — Permissions become configuration, not description

`config/stack-mappings.json` already carries `allow`/`deny` per stack — and
**zero hooks or commands apply them**. `/be:bootstrap` writes them into the
project's settings, so least privilege is the default rather than advice.
**Done:** `scripts/permissions.js` writes the detected stack's allow/deny into
the project's `.claude/settings.json`, and `/be:bootstrap` step 6 runs it.
It only ever adds: the project's own entries and its `deny` win, a settings
file that does not parse is left untouched with the reason, and no stack means
no change. The stack detector that was copied in two scripts now lives once,
in `scripts/_stacks.js`. Mutation: permissions 48/48, detector 17/18 with one
equivalent.

### 9.3 — The sweep the owner asked for, before the version *(in progress)*

**Done so far:** the four remaining entry points have tests that run them as
processes (`test/entrypoints.test.js`), and the mutation pass now estimates
before it waits, runs in parallel (~22 min → ~6), measures only what changed
with `--since`, and stamps each equivalent with the hash of the file it was
accepted against — a stale one prints RE-CHECK and fails `--check`.

**Found while writing those tests, and worth keeping:** a script resolves its
paths from its own location, so running *this* repository's script with `cwd`
pointed at a copy measures — and edits — this repository. A release dry run
bumped this repo's version twice from inside a test before the cause was named.

**Left:** extract `test/helpers.js` (ten ad-hoc fixture helpers across nine test
files, `quiet()` duplicated verbatim), and extend the mutation targets past the
guards once the suites are split into fast and process-based.

---

## Sequencing

**Phase 1 → Phase 2 (+2.4) → Phase 3.1 → Phase 4 — done on 2026-08-19**, in ten
plus three commits, each one re-checked out and verified in isolation. Every
active drift is closed, each with a guard behind it; the size number is a test;
and this repo now runs the protocol it sells.

**Phase 3.2, 3.3 and Phase 5** are separate sessions. 3.2 is careful surgery on
600 lines of material that must be moved without loss; Phase 5 is seven
independent units, each small, none blocking the others.

**Phase 8, as unified on 2026-09-22:** **8.0 first** — it stops the next proposal
from getting lost. Then **8.4 with 8.7** (sentences that decide the rung the rest
is born on) → **8.3** → **8.2** → **8.6**. **8.1** runs on its own, in lots.
**8.8 with 8.9** (added the same day, owner's decision): the ruler is run on
ourselves before the skill ships it.
**Phase 7** in parallel, one rule per commit. Then the README, then the release.

## Phase 10 — the ruler that also subtracts (2026-09-23)

An external scan (harness-score, 36 deterministic checks) put this repository at
**L1, 39/108**, and closing the parts that were real took it to **74/105**. The
useful part was not the number: it was that the 69 missing points split into
four kinds, and **two of them were right to refuse**.

- **Real, and embarrassing:** no linter, no type checker, no `.env` rule, in a
  base that ships a verification loop and a secrets skill. Fixed.
- **A measurement artefact hiding a real gap:** it looked for `.claude/skills/`
  and found none, because this repo *produces* the plugin. But the question
  underneath — does this repo run what it sells? — had the answer **no**, and
  that cost a fix that never reached the machine. Fixed.
- **Deliberate, now recorded as configuration:** no `.mcp.json`, on purpose.
- **Refused:** pre-commit tooling, and splitting a 60-line CLAUDE.md into scoped
  rule files. Both would add weight to raise a number.

### 10.1 — Apply the same ruler inward, to subtract

**The owner's framing, 2026-09-23:** *"quantidade não é qualidade na construção
real de software"* — and the ruler that refused two additions should also be
able to **remove** what is cosmetic.

So the question becomes symmetric. For every skill, agent, command and hook this
base ships: **what measured thing goes wrong if it disappears?** Not "is it
nice", not "does it round out the set" — what incident, what drift, what silent
failure does it catch that nothing else catches. Anything whose answer is "it
completes the family" is a candidate for removal under `proc-safe-removal`.

The evidence already exists and is not being read: every skill carries an
evidence class, `proc-context-budget` already measures what each one costs to
load, and the activation graph says which are reachable at all. A skill that is
expensive, unreachable, and justified only by symmetry is exactly what this
phase should find.

**Not started.** Runs after the push, on a repository whose numbers are settled.

### 10.1b — A pass that dies mid-run reports green

**Measured three times on 2026-09-23/24**, when the WSL connection dropped and
took the run with it. The report left behind looked finished: nine `✔` lines and
two targets carrying only their `·` start marker. Counting the `✔`s, or reading
the tail, shows green. Nothing says *how many targets were supposed to run*, and
a killed process returns no exit code to contradict the impression.

This is the base's own rule failing inside the base's own tool: **zero without a
denominator is not a result** — and here the denominator is never printed at all.
The final measurement of v3.2.0 is sound, but the evidence that all 11 targets
were covered lives in a human reconciling two output files, not in the tool.

**Fix:** the pass ends with an explicit roster — `N of M targets measured` — and
exits non-zero when any target has no verdict. A run that cannot finish must be
unable to look finished. Cheap, and it belongs with 10.2, which will make the
roster carry *measured now* vs *inherited, at this hash, on this date*.

Two smaller things the same incident surfaced: the leftover sweep only removes
temp copies older than two hours, so an interrupted run leaves 150+ repository
copies competing for I/O with the next one (measured: the suite went from 17s to
23s per run); and the three tests added to `entrypoints.test.js` copy the whole
repository, which every mutant of `_lib.js` then pays for.

**Not started.**

### 10.2 — Mutation selection that is *safe*, not merely cheap

The release re-measures all 677 mutants even when the commit touched only
documentation, ~13 minutes each time. `mutation-check --since` exists and the
release does not use it — correctly, because the naive version would under-measure:
`pre-tooluse.js` requires `_gateguard.js` and `_lib.js`, so a change to `_lib.js`
can turn a killed mutant of `pre-tooluse.js` into a survivor while
`pre-tooluse.js` itself is untouched.

The field settled this thirty years ago. Rothermel & Harrold define a selection
as **safe** when it excludes no test that would reveal a fault; Leung & White's
**class firewall** (1990) is the retest set around a changed module; **Ekstazi**
(Gligoric et al., ISSTA 2015) showed that tracking each test's **file-level**
dependencies, observed dynamically, cuts 32–54% of test time in practice — and
that finer granularity does not pay. **Regression Mutation Testing** (Zhang,
Marinov, Zhang & Khurshid, ISSTA 2012) is this applied to mutation exactly:
reuse the previous version's results where a static analysis proves it safe.

Google's diff-scoped mutation (Petrović & Ivanković, ICSE-SEIP 2018) is the
deliberate counter-example — it mutates only changed lines — and it does not
authorise us to narrow, because there mutation is a **review aid** and here it
is a **release gate**. An aid may be incomplete; a gate that says "green" may not.

**The design:** re-measure on the transitive closure of observed dependencies,
keep a ledger of `{file hash, test hashes, closure hash, result, date, commit}`,
and **always print all 11 targets** — N re-measured now, M inherited with the
hash and date they were measured at. Never inherit silently. The precedent is in
the code: `mutation-equivalents.json` already carries the hash of the file each
equivalent was accepted against and prints `RE-CHECK` when it changes.

**Not started.**

---

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
