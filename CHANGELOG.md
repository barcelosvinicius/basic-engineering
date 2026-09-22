# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- **The `--no-verify` guardrail no longer blocks writing about `--no-verify`.**
  The check tested the flag against the whole Bash command, so any command that
  merely mentioned the string — writing documentation, echoing a message,
  grepping for it — was refused as if it were bypassing git hooks. It surfaced
  by refusing this repo's own written analysis of the rule. The check is now
  scoped to a segment git actually runs (leading env assignments and
  `sudo`/`command`/`time` wrappers included), and quoted text is treated as
  data, so `git commit -m "document the --no-verify rule"` passes while
  `git commit --no-verify` and `git commit -n` still block. Tests pin both
  directions; the old suite's two allowed cases were ordinary commands with
  nothing resembling the flag, which is why a detector that blocked everything
  *containing the string* passed it.
- **`npm run release` could not complete a clean run.** The generated fact panel
  names the version it was measured against, the release bumps that version, and
  nothing regenerated the panel before `node --test` checked it — so step 4
  failed by construction. The v3.1.1 release had already hit this and been
  patched by hand, with no record. The release now rewrites the panel after the
  bump and commits it with the other release files.

### Added

- **`scripts/graph-audit.js --write`** rewrites the fact panel in
  `docs/structural-analysis.md` in place. `--md` only ever printed the block for
  a human to paste, which is fine for a hand edit and wrong for the one moment
  the panel is guaranteed to go stale. It refuses a document with no generated
  block marker rather than guessing where the block belongs.
- **CI runs the audits that already had a `--check` mode.**
  `graph-audit --check` ran in *zero* automated places and `backlog-audit
  --check` only at release time; both were green whenever someone remembered to
  run them. They now run on every push and pull request, and at release.
- **CI runs the Semgrep rules this base ships**, and validates them. A rule that
  nothing executes can be broken for months and look exactly like a working one.
- **Release asks what the README reader needs to know.** When a release changes
  `plugins/be/commands/`, `plugins/be/hooks/`, `bin/` or `lib/installer.js` and
  `README.md` did not change since the previous tag, the release stops and names
  the files. Either the README changes, or the reason it does not is recorded
  with `--readme-ok="<reason>"`. Derived from a measured miss: v3.1.0 and v3.1.1
  shipped `be doctor`, the session-start update check and the `.gitattributes`
  seeding, and the README named none of them while `validate.js` passed — it
  checks that what is written is true, never that what exists is described.
- **`/be:check` reports the measured distance** — a seventh phase, report-only:
  units of work with **no test file at all**, and routes declared in code that
  **no document mentions**. `plugins/be/scripts/distance.js` (Channel B:
  `.be/scripts/distance.js`), zero dependencies, driven by a `distance` block
  per stack in `config/stack-mappings.json`; a stack without one prints NOT
  MEASURED with the reason, never a zero. Measured on a real Spring project:
  **6 of 8 controllers with no test class** (hand-checked) and 0 of 27 routes
  undocumented, 2 of them found only inside a longer path — reported apart,
  because only a person can say whether `/jobs` inside `/admin/jobs` is the same
  endpoint. Building it against that project corrected it four times: a
  first-argument regex saw 32 of the 38 annotations; two documented routes were
  called missing because the docs write the external path; `@GetMapping(produces
  = "…")` would have published `application/json` as an endpoint; and an
  unresolvable class prefix invented the route `/`.
- **`qa-test-strategy` — which tests a change needs, and whether they prove
  anything.** A new skill (30 skills now): the layers per kind of change (unit,
  integration against the real dependency, one end-to-end test per critical
  journey, load against the SLO), where TDD pays and where it does not, and
  **mutation as the ruler of test quality** — the question is not whether a line
  ran but whether any test would notice it wrong. It says what mutation cannot
  do (find the case nobody wrote) and pairs it with the nearest boundary case.
  Load criteria anticipate rather than react: a number first, the expected peak
  and a growth horizon, production-sized data. Tools per stack (PIT, Stryker,
  mutmut, Testcontainers, Playwright, k6, Gatling) in an on-demand resource.
  Reached from `qa-verification-loop` phase 4 and the `qa-engineer` agent.
  The release checklist gains a load item for releases that change a hot path,
  and `ops-observability` states that an SLO is verified before release by a
  load test — the alert is the second line, not the first.
- **The mutation pass refuses to measure a red suite.** A broken test sat in a
  suite while the pass ran, and every mutant came out killed — 131 of 131, a
  perfect score over a failing suite. It now runs the unmutated tests first and
  reports NOT MEASURED for that module; `--check` exits 1.
- **`scripts/mutation-check.js` — the base's own guards are measured by whether
  their tests would notice a wrong line**, not by whether the lines ran. A
  zero-dependency pass over the hook guards and the audits: one small change at
  a time (flip a comparison, swap `&&`/`||`, force a condition), in a throwaway
  copy, never in the working tree. The first pass: **53 of 199 mutants
  survived** — including 25 in an audit written the same day with tests in both
  directions, whose CLI exit code had no test at all. All are now killed, or
  recorded in `scripts/mutation-equivalents.json` with the reason they cannot
  change behaviour (6). It also found a design gap — a half-deleted generated
  block would have been duplicated instead of refused. `npm run release` runs it.
  Its own mirror test caught a defect in it: run inside a test runner, the child
  inherited `NODE_TEST_CONTEXT` and every mutant "survived".
- **A per-change checklist item is answerable from the diff alone.**
  `proc-code-review` states the rule and its items now ask what the change
  *added* ("no `console.log` of sensitive data added", "none added to the
  code"); `qa-security-reviewer`'s definition of done does the same for secrets,
  stack traces and CVEs. `proc-release-checklist` says why it is the exception —
  a release is the whole system at one moment, so its items stay states. Derived
  from a blocking pre-commit item phrased as a tree state ("no `console.log` in
  production code") that sat ticked for five months over 55 occurrences:
  everyone checked their own diff, found it clean, and signed a false box.
- **The enforcement ladder, and the test for when a rule becomes a gate.**
  `engineering-principles.md` Appendix D: five rungs — prose, recall, periodic
  sweep, gate at the door, illegal state unrepresentable — and one entry test:
  only a rule a machine decides alone may become a gate; tree-wide debt is
  watched and reported, never gated. The digest carries it as §D,
  `proc-skill-creator`'s checklist asks every new skill to state its rung, and
  the skill template has the field. Derived from a written rule that named its
  own failure mode and still did not prevent it, because it was read at session
  start and the risk arrived hours later.
- **`scripts/proposals-audit.js` — a feedback proposal cannot lose its state
  silently.** Every numbered proposal in a `feedback/<dir>/SUGESTOES.md` now
  carries an `**Estado:**` line (`aberta` · `implantada` with date and commit ·
  `descartada` with date and reason); numbers must be unique and gap-free. It
  runs inside `node --test`, so CI and the release execute it. `--draft <file>
  --from <ledger>` regenerates a status index at the top of a project's own
  draft copy and lists what the draft has that the ledger lacks. Derived from a
  measured miss: five proposals lived only in a project's unversioned draft, the
  oldest from a fact of 2026-09-10, and the number 24 named two different proposals — the
  triage of 2026-08-19 was a snapshot, and nothing said it had gone stale.

### Changed

- **Rules arrive at the gesture, as one line.** The stack map that only markdown
  read now has a trigger: the first code edit of a session names the skills of
  the stack detected at the project root (`pom.xml` → the five Java backend
  skills). A bulk rewrite — `sed -i`, `perl -i`, `git mv`, `find -exec sed`,
  `rename` — brings the lot rule: run it on text already at rest, never in the
  same step as new writing, and read the generated output. A removal — `git rm`,
  or an edit that deletes 15+ lines — brings `proc-safe-removal`'s four axes.
  Advisory, once per kind per session, logged, `BE_HOOK_REMINDERS=off`. Derived
  from a written rule that named its own failure and did not prevent it, because
  it was read at session start and the risk came hours later. **Narrowed by
  measurement**, replaying 19 recorded sessions of a real project (5,949 tool
  calls): the stack is read from the edited file's own directory upward — at the
  root only, an Angular component was offered the Java backend skills — tests and
  files outside the project ask for none; and a bulk rewrite now means *many*
  targets (several files, a glob, `find -exec`, `git mv`, `rename`), because a
  one-file `sed -i` is an edit, not a bulk rewrite. The same replay found that
  the gate's 30-minute idle expiry also reset the once-per-session reminders, so
  a long session repeated them: 31 of 54 fires were repeats. Reminders now
  survive the expiry; the files the gate checked still do not. Result over the
  same 19 sessions: 54 → 17 reminders, each one on a real gesture. Gestures are read
  from the commands a line **runs**: the shell line is now split outside quotes,
  as the shell splits it — the first version split inside them, so
  `echo "a; sed -i x"` read `sed -i x` as a command, a defect the bypass guard
  shared and no test had exercised.
- **The fact-forcing gate is on by default, and narrow.** It used to gate the
  first edit of *every* file, so it shipped off. It now gates only the first
  edit of an **existing** file in a high-impact class — schema/migrations,
  security/auth, API contracts, build/dependency manifests, CI/deploy pipelines —
  decided by the path relative to the project, never by judgement. New files,
  docs, tests and lockfiles pass. `BE_GATEGUARD=all` restores the old behaviour,
  `off` disables it. Every gate that fires leaves one line in a per-session log
  (`BE_HOOK_LOG_DIR`, default the OS temp dir): the default stays on only if a
  measured real session shows ≤2 interruptions — **measured: 0 interruptions
  across 19 recorded sessions of a real project, against 165 the old behaviour
  would have made**, and it guards 10 of that project's 395 versioned files
  (`pom.xml`, `package.json`, `Dockerfile`, `Jenkinsfile`, six security files).
  The dispatcher it lives in had
  one test path; it now has end-to-end tests for every guard it runs (mutation:
  27/69 → 66/69, 3 equivalent).
- **This repo's workflows now follow the skill it ships.** Actions pinned by
  commit SHA instead of mutable tags, least-privilege `permissions:`,
  `timeout-minutes` and `concurrency` on CI. `infra-ci-cd` gained the two rules
  it was missing (pin actions by SHA; declare permissions and a timeout in the
  workflow file) — the practice gap was also a gap in the advice.

## [3.1.1] — 2026-08-20

### Added

- **LF ships with the base, not just with this repo.** The npm installer and
  `/be:bootstrap` now seed `.gitattributes` with `* text=auto eol=lf` at the
  target project root when none exists — an existing file is never modified
  (at most an advisory when it lacks the pin). `npm run validate` fails if
  this repo ever loses its own pin, and BOOTSTRAP.md documents the rule as
  Step 5-C. This closes the P-08 class at the source: a Windows checkout with
  `core.autocrlf=true` otherwise holds CRLF where git, CI, and every other
  machine hold LF, and hook scripts, hashes, and byte-level facts silently
  diverge per machine.

## [3.1.0] — 2026-08-20

### Added

- **`proc-session-continuity` declares its activation edges.** The skill that
  runs at the start and end of every session had the highest in-degree of the
  graph (18) and an out-degree of 1 — the one node every session passes through
  forwarded to nothing, so reaching `proc-learning-trail`,
  `proc-context-budget`, `qa-verification-loop`, `proc-structural-analysis` or
  `proc-adr` depended on the user recalling the name. It now declares seven
  typed edges with the condition for each. Edges are **reminders, never blocks**
  — the rule the `Stop` hook already follows.
- **Promotion channel back to the base.** Session end asks one question per
  lesson: *"does this depend on this project?"* A method lesson that does not
  is queued for the base's feedback intake instead of staying in the project's
  `docs/`, where only that project benefits.
- **Measure before reading** at session start (`wc -lc`): over ~2,000 lines,
  read sections rather than the whole living doc and consult
  `proc-context-budget`.
- **A name that resolves to nothing, and a count that went stale, now fail the
  build.** Renaming a skill or agent used to leave every prose reference to it
  pointing at a ghost with nothing noticing, and `README.md` claimed 28 skills
  from the moment there were 29. Both are checked across skills, agents,
  commands and the root docs.
- **The SessionStart hook reports declared `companions`** — last commit and
  whether they have uncommitted work — so "close every repo the session touched"
  is a fact on screen rather than something to remember. Reporting only:
  unreachable paths, non-repos and a malformed `.be-paths.json` are all silent.
- **The session close checks the record instead of composing it.** A long
  session gets compacted and unwritten context is not recoverable, so the fact
  is recorded when it changes and the close confirms — with two questions
  restricted to the session's delta: *where else is this fact written?* (the
  update replaces, it does not accumulate) and *does the record match the
  commits?*
- **`HISTORY.md` has a ceiling, and each living doc states its own nature.**
  Over ~800 lines, entries older than 90 days move verbatim into
  `docs/history/YYYY-Qn.md` — moved, never summarised. `HISTORY.md` compacts,
  `structural-analysis.md` is rewritten, `lessons-learned.md` grows and is never
  compacted; confusing the three is what makes people prune the wrong one.
- **`.be-paths.json` gains `companions`** — the close runs in every repository
  the session committed to, answered by command rather than memory. Measured in
  a real pair, the sibling's `lessons-learned` was 65 commits behind while the
  same file in the active repo was current.
- **`proc-safe-removal`** — a new skill for the one change that cannot fail
  loudly. Deleting takes its own test with it, so the suite goes green because
  the evidence is gone; moving content fails silently in both directions, with
  each file still reading fine. Four axes before deleting (provenance,
  supersession, damage, unreachability), a `// NB:` note on whatever survives,
  and a verification protocol for relocations. Reachable from
  `proc-impact-analysis`.
- **The session start asks whether this machine is running the latest base.**
  One bounded request to the npm registry (2s timeout, cached for a day, opt-out
  via `BE_UPDATE_CHECK=off`, and silent on every failure — offline, malformed,
  unwritable cache). When a newer version exists, the notice states the version
  delta, **what this machine gains** — derived by comparing the published
  description's counts against what is actually on disk here, never
  hand-written — and which hook events the installed copy currently runs. Hooks
  have no terminal, so it does not prompt: it asks the assistant to put the
  question to the user, with both update commands ready (`/plugin update` must
  be typed by the user; `npx … update` can be run for a project's `.be/`).
  Declining persists nothing — `SessionStart` fires once per session, so the
  next session asks again and the notice disappears the day the versions match.
  `be doctor` does the same lookup live, bypassing the cache; `--offline` skips
  it. Because the notice reads counts from the published description,
  `package.json`'s description now carries them and the stale-count guard checks
  it — a wrong count there would become a wrong promise.
- **`be doctor` — the base can now say whether it is actually running here.**
  Three pieces of state are **per machine** and invisible from the repository:
  which plugin version is installed, whether its hook scripts exist on disk, and
  whether the checkout pins `eol=lf`. This base is operated from several
  machines, and on one of them the installed plugin sat at v2.0.0 for two months
  — 25 skills against 29, one hook script against five — so the secret scan, the
  linter-config protection, the `--no-verify` block and the session-end reminder
  simply did not run. Hooks fail open by design (correct), which is exactly why a
  total outage is indistinguishable from a quiet session. `be doctor` names the
  gap, including **which hook events** are missing on this machine, and exits 1
  when there is something to act on.
- **`.gitattributes` pins `* text=auto eol=lf`.** Without it a Windows checkout
  holds CRLF while git and CI (`ubuntu-latest`) store LF, and `wc -c` over the
  same commit answers 142,752 here and 139,253 there. Invariance beats
  per-platform branching: a value that is the same everywhere needs no
  adaptation.
- **Three technique agents close the last open backlog item (18).**
  `qa-comment-analyzer` judges whether the prose inside the code earns its place
  — noise, a comment standing in for a rename, and rot, which is the severe one
  because nothing fails when a comment stops being true. `qa-type-design-analyzer`
  asks which invalid states the types still allow, and **declares itself
  inapplicable** in a dynamically typed codebase with no schema layer rather than
  manufacturing findings. `mgmt-spec-miner` recovers the specification a codebase
  already implements, in EARS form, citing `file:line` for every requirement and
  labelling the rest `UNVERIFIED`; it returns text instead of writing files, so
  several miners can read in parallel without colliding on one document.
- **The parallel-work rule is stated: read in a fan-out, write in series.**
  Three files absorb 179 of 200 commits' writes and every session close touches
  all three, so N agents closing in parallel collide on exactly those. Parallel
  agents are read-only and return findings; one writer integrates. Five sweep
  commands now declare the axis they parallelise on.
- **A phase reporting an absence carries its denominator.** Tests collected,
  files scanned, files linted, artefact newer than sources — green over a stale
  cache is otherwise indistinguishable from legitimate green.
- **A verifiable rule ships with a known positive case that makes it fail.**
  Written into `qa-verification-loop` with the three failure modes that produce
  a plausible number and announce nothing, and added to the skill checklist.
- **Every skill now keeps its catalogue and output templates out of `SKILL.md`.**
  All seven skills over the ~150-line budget embedded the shape of their own
  deliverable inline — paid for on every activation, opened only while writing
  the output. That was a pattern of this base, not seven coincidences. Skills
  carrying a resource file went from 10 to 16:
  `fe-accessibility-patterns` 293 → 138 (`component-patterns.md`),
  `fe-ux-patterns` 275 → 146 (`ui-patterns.md`),
  `proc-changelog` 158 → 118 (`format-reference.md`),
  `proc-structural-analysis` 255 → 222 (`output-schemas.md`),
  `proc-domain-mapping` 227 → 200 (`output-schemas.md`),
  `proc-impact-analysis` 207 → 182 (`pr-template.md`),
  `proc-skill-creator` (`lifecycle.md`). The last four stay over the line by
  decision — their lookup material is out and what remains is procedure. Each
  extraction preserved its code line-for-line, verified per commit.
- **`proc-domain-mapping` states that it owns the `## Domain map` schema**, and
  the skeleton in `proc-structural-analysis` now points at it instead of
  describing the fields again — the surviving half of the duplication fixed
  earlier in this series.
- **The `SKILL.md` size rule is a test, not a number.** `SKILL.md` loads in full
  on every activation while sibling resources load on demand, so the ~150-line
  budget is a budget on cost per activation — and it cannot tell cohesion from
  depth. Over it, `proc-skill-creator` now asks the **trigger** and gives three
  outcomes: *leave it* (one trigger, one output, decision material — a pipeline
  skill can be longer and still be right), *extract to a resource* (the trigger
  enumerates cases needing lookup), or *new skill* (the trigger splits and each
  part has its own decision and output). The quantitative shortcut was tested
  against all 28 skills and **not shipped**: ">30% of the file in code blocks"
  gave 2 false positives out of 5 flags. `proc-skill-creator` applied the test to
  itself — `lifecycle.md` now holds the provenance/pruning material.
- **`docs/structural-analysis.md` §0.2 is generated and verified.**
  `npm run audit:graph -- --md` regenerates it and `--check` fails when it drifts;
  a test runs the check on every push. Rows that cannot be machine-derived stay
  in a separate hand-kept table with their proof command, labelled as such.
- *(repo-internal)* `docs/HISTORY.md` and `docs/lessons-learned.md` — this repo
  now keeps the living docs it prescribes to others, in the new formats.
- **The rule now lives in the template, not only in the prose.** Measured in a
  real project: two tables in the *same file*, written by the same team under
  the same "no value without a date" rule, scored **100%** and **0%**
  conformance — the only difference was whether the table had a date column.
  So the templates carry the fields:
  - `structural-analysis.template.md` gains a **§0 verifiable fact panel**
    (fact · proof command · value · class · measured on) as its first section,
    and its pending-item format now requires **`Done when:`** (verifiable by
    command) and **`Blocked by:`**. An item with no finish line is a feeling
    and reappears in every future analysis; an item whose criterion is
    verifiable but unreachable is worse — it looks resolved and never closes.
  - `lessons-learned.template.md` gains **`Evidence:`** (measured · inferred ·
    reported · hypothesis) and **`Scope:`** (`project` / `method`). An
    unlabelled hypothesis inherits the authority of a measurement and readers
    stop investigating; a `method` lesson is the one that gets promoted back to
    the base.
  - `history.template.md` gains a done-criterion and blocker on each next step,
    and a **`Verified:`** field on session entries — the close checks what was
    recorded rather than composing it from memory.
  - `proc-structural-analysis` prescribes emitting §0 first and rejects a
    percentage no command reproduces; `proc-skill-creator` documents the
    `## Activation edges` convention and now requires a new skill to have at
    least one referrer.
- **Cycle detection over the activation graph** in `npm run validate`
  (`scripts/lib/edges.js`). Edges are typed — `consult` (read the rules) vs
  `invoke` (may run the flow) — and only `invoke` edges can recurse, so only
  those are checked. Declared targets must be real skills.
- **`scripts/graph-audit.js`** — reports the activation graph (leaves, orphans,
  in/out degree, declared edges, cycles) so the shape is measured, not assumed.
- **`npm run audit:backlog` / `npm run audit:graph`** expose the two audits, and
  `backlog-audit.js --check` fails when the committed status table no longer
  matches reality — wired as a pre-flight guard in `scripts/release.js`, so a
  release cannot ship a stale claim about what is implemented.
- *(repo-internal)* **`scripts/backlog-audit.js`** — reproduces the
  implementation status of `feedback/BACKLOG.md` by command. It existed because
  hand-counting that backlog gave three different wrong answers in one session
  (10, then 12; the real figure is **16 of 20 shipped**), each one plausible and
  none self-announcing.
- *(repo-internal, not shipped)* `docs/structural-analysis.md` — this repo now
  keeps the living doc it prescribes to others, with a §0 fact panel where every
  number carries its proof command and measurement date.

### Fixed

- **The backlog audit measured the operating system, not the backlog.** Its
  probes were shell one-liners run through `execSync`, which spawns `cmd.exe` on
  Windows — where `'...'` does not quote, so every probe containing a `|` was
  split into a real pipe, and `$(...)` was never substituted. Five of 26 probes
  failed for that alone: the audit reported shipped work as *not started*
  (12·3·5 against the true 16·2·2) and, because `scripts/release.js` runs
  `--check` as a pre-flight guard, **`npm run release` refused to run from
  Windows at all** — while CI stayed green on Linux. The probes are now
  filesystem predicates (`scripts/lib/probes.js`) that never touch a shell, and
  a test fails if a process spawner is reintroduced.
- **Two rows of the fact panel changed value with the reader's git config.**
  `cat … | wc -c` returns one extra byte per line on a CRLF checkout — 142,752
  against 139,253 for the same commit. The payload rows moved into the generated
  §0.2 block and are now counted with CR stripped, so the number matches what
  git stores on every platform. The skills row had also gone stale by 7,752 B
  (5.9%) in the time it was kept by hand.
- **The stale-count guard did not read the manifests** — the one place where a
  wrong count is published. Both `plugin.json` and `marketplace.json` still
  claimed "28 skills" three commits after the 29th shipped, and that description
  is what the marketplace listing and the npm page show. Manifest descriptions
  are now checked alongside `README.md`, `CLAUDE.md` and `BOOTSTRAP.md`.
- **Two skills prescribed incompatible schemas for the same section.**
  `proc-structural-analysis` Phase 4 carried a YAML domain schema while
  `proc-domain-mapping` prescribed Markdown tables — both for `## Domain map` in
  the same output file, so whichever ran last won. Phase 4 now delegates through
  a declared `invoke` edge to the skill that owns that section.
- **The session index had drifted 14%.** `proc-session-continuity/resources.md`
  was missing 3 skills and 3 agents of 43 entries. Registering them was already
  an instruction (`proc-skill-creator` Step 7); nothing checked it. Now
  `npm run validate` fails on an unregistered skill or agent.
- **The naming convention had an undeclared exception.**
  `engineering-principles` carries no prefix by decision, but that was written
  nowhere — an omission that made a prefix-based sweep miss the second
  most-referenced skill and misreport the activation graph. The exception is now
  declared in one place and enforced.
- **`BASE_VERSION` was generated from local time** while `CONTRIBUTING.md`
  documents UTC. For a value compared lexicographically across machines, two
  releases cut the same day from different timezones can order backwards and the
  installer would read the newer base as older. `scripts/release.js` now derives
  both `BASE_VERSION` and the CHANGELOG date from the same UTC instant, and
  **refuses to write a value that is not strictly greater** than the previous.
- **`npm run release -- --dry-run` could tell you to destroy your own work.** It
  writes the release files on purpose (so the diff is readable) and skips the
  clean-tree guard, then printed `git checkout -- <all release files>` as the
  revert instruction — discarding any unrelated uncommitted changes in them. It
  now detects the collision, names the files, and leaves them out of the command.


- **Three skills were unreachable from the graph** — `proc-learning-trail`,
  `proc-skill-creator` and `sec-agent-security` were referenced by no skill,
  agent or command, so they activated only if the user remembered they existed.
  Now 0 orphans (`node scripts/graph-audit.js`). `sec-secrets-management` gained
  a section on credentials consumed by AI agents, which is where
  `sec-agent-security` belongs.


## [3.0.0] — 2026-06-17

### Changed (BREAKING)

- **npm installer target moved from `.github/base/` to `.be/`** at the project
  root — the installed base is now self-contained and not tied to GitHub's
  folder. An existing `.github/base/` install is **detected and left untouched**
  (migrate your customizations, then remove it manually). `be check` now reads
  `.be/BASE_VERSION`. Claude Code plugin users are unaffected (no file copies).

### Added

- **Bilingual capabilities guide with Playbooks**: `BE-GUIDE.md` (English) and
  `BE-GUIDE.pt.md` (Portuguese), generated from frontmatter, now carry a
  scenario → action **Playbooks** section ("building a backend feature → …",
  "shipping to production → `/be:release-check`", "repo going public →
  `qa-release-sanitizer`", "session feels heavy → `/be:context-budget`", …).
- **SessionStart drops `BE-GUIDE.md` at the project root on first run** (create
  once, never overwrite) and tells the user what was created and why — so the
  base gets discovered and used instead of forgotten.

## [2.3.0] — 2026-06-17

Tier 3 of the ECC-informed backlog: deeper guardrails and security/governance
assets, applied through the mission filter (a couple of ECC ideas were
deliberately sliced down rather than copied — see notes).

### Added

- **Fact-forcing gate** (opt-in `BE_GATEGUARD=on`): a PreToolUse gate that
  blocks the first Edit/Write of each file until the agent states importers,
  affected API, data shape, and the user's verbatim instruction. Per-session
  state, 30-min expiry, fail-open; off by default (deliberate friction).
- **`sec-agent-security` skill**: the threat model and defenses for agentic
  systems — direct/indirect prompt injection, bidi/zero-width sanitization,
  least agency, approval boundaries, kill switches, minimum-bar checklist.
- **`qa-pr-test-analyzer` agent**: judges whether a change is *adequately*
  tested (diff→test mapping, edge/error/authorization paths, regression
  discipline) — not raw coverage. Read-only.
- **`/be:model-route` command**: recommends the cheapest model tier
  (haiku/sonnet/opus) for a task by complexity — the cost lever that pairs with
  per-agent `model` routing.
- **Config & hook validation** in `validate.js`: hook scripts referenced in
  `hooks.json` must exist; `stack-mappings.json` / `install-profiles.json` /
  shipped JSON must be well-formed.

### Changed

- `infra-ci-cd` skill: new **supply-chain integrity** section (advisory/IOC
  scanning, provenance/signatures, neutralizing install scripts) beyond CVE SCA.
- `proc-skill-creator` skill: **provenance** frontmatter required for
  generated/imported skills, plus "prune by evidence, not by feel".
- `engineering-principles` skill: makes the **always-on (rules) vs on-demand
  (skills)** boundary explicit — and why `be` ships no separate `rules/` dir.
- `proc-session-continuity` now declares the **memory boundary**: `be` docs =
  project state/decisions (team-shared, versioned); harness memory = work
  preferences/feedback (personal). `proc-sdd` makes SDD explicitly optional —
  without `.specify/`, the "graph" is just the authority/load order ending at docs.
- Counts: **28 skills**, **15 agents**, **11 commands**.

### Deliberately not copied from ECC

- A separate `rules/` directory (would duplicate `engineering-principles` +
  `CLAUDE.md`); a runtime cost/telemetry tracker (overlaps external memory
  tooling — `/be:model-route` delivers the cost win instead).

## [2.2.0] — 2026-06-17

Tier 2 of the ECC-informed backlog: specialists without context bloat, plus
EN/PT portability and cost awareness (see `feedback/BACKLOG.md`).

### Added

- **Stack-aware quality gate**: `plugins/be/config/stack-mappings.json` maps
  project indicators (`pom.xml`, `pyproject.toml`, `go.mod`, …) to real
  build/test/lint/format commands, relevant skills, and permission hints.
  `/be:check`, the `qa-verification-loop` skill, and `/be:bootstrap` consult it
  instead of guessing.
- **Install profiles** (npm installer): `--profile=minimal|backend|frontend|full`
  selects which skills are copied to `.github/base/skills` (default `full`,
  backward-compatible). Defined in `plugins/be/config/install-profiles.json`.
- **`.be-paths.json` path map** (EN/PT portability): an optional per-project map
  so commands/hooks find your doc names (e.g. `docs/HISTORICO.md`). The
  SessionStart hook resolves it with EN→PT fallback. Ships
  `.be-paths.example.json`.
- **Two technique-specialist agents**: `qa-silent-failure-hunter` (swallowed
  errors, empty catches, error→null, weak logging) and `qa-release-sanitizer`
  (audits tree + git history for leaked secrets/PII/internal refs before
  publishing — PASS/FAIL, read-only).
- **`proc-context-budget` skill + `/be:context-budget` command**: measure what
  consumes the context window (MCP tools, agent descriptions, CLAUDE.md) and get
  ranked token-savings — the measurement behind "unused = context noise".

### Changed

- `mcp.recommended.json` enriched: per-server **data-boundary** notes, a
  version-pinning recommendation, a "keep under ~10 servers" budget note, and
  `sequential-thinking` + `playwright` added (still curated, no auto-start).
- Counts: **27 skills**, **14 agents**. The installer now ships `config/` and
  `.be-paths.example.json` to `.github/base/`.

## [2.1.0] — 2026-06-16

Enforcement-in-the-loop release: brings a thin slice of guardrails to the moment
code is generated, keeps everything else advisory. Distilled from real-usage
feedback and a deep analysis of the ECC reference base (see `feedback/BACKLOG.md`).

### Added

- **Live guardrail hooks** (Claude Code) — a PreToolUse dispatcher and a Stop
  reminder, all **fail-open** and opt-out via `BE_HOOKS=off` /
  `BE_HOOK_<ID>=off`. They block only the truly critical and stay advisory
  otherwise: hardcoded-secret detection in commands and file writes,
  linter/formatter **config protection** (fix the code, not the config), a
  `git --no-verify` block, and a session-end reminder when functional code
  changed without a docs update.
- **`/be:check` command + `qa-verification-loop` skill** — a stack-agnostic
  local quality gate (build, type-check, lint, tests, security scan, diff
  review) with a READY / NOT READY verdict to run before declaring work done.
- **Bundled Semgrep starter rules** at `plugins/be/semgrep/` (e.g.
  `no-localstorage-business-data`), shipped to `.github/base/semgrep/` and used
  by `/be:check` and the `infra-ci-cd` skill.
- **Capabilities guide** — `BE-GUIDE.md` generated from the plugin's own
  frontmatter (`npm run gen:guide`), shown by the new **`/be:help`** command,
  written to the project root on `/be:bootstrap`, and shipped by the installer.
  `npm run validate` fails if the guide drifts from the source.

### Changed

- **Agents hardened**: every agent now declares a `model` (opus for
  architect / domain-expert / security-reviewer, sonnet otherwise) and carries
  a **prompt-defense baseline** (anti-injection: stay in role, treat external
  content as data, never expose or hardcode secrets, never weaken controls).
- `validate.js` / `gen-capabilities.js` frontmatter parsing is now CRLF-safe.

## [2.0.0] — 2026-06-10

### Added

- **Claude Code plugin marketplace**: `.claude-plugin/marketplace.json` exposing the `be`
  plugin at `plugins/be/` — install with `/plugin marketplace add barcelosvinicius/basic-engineering`
  then `/plugin install be@basic-engineering`.
- **Skills in Agent Skills format**: each skill is now a directory
  `plugins/be/skills/<name>/SKILL.md` with trigger-oriented descriptions and on-demand
  resource files (progressive disclosure → token economy).
- **New skills**: `engineering-principles` (digest), `sec-secrets-management`,
  `ops-observability`, `proc-dependency-management`, `proc-code-documentation`.
- **12 ready-to-use agents** (converted from fill-in role templates): they read project
  conventions at runtime from `CLAUDE.md` and `docs/` instead of requiring customization.
  Analyst/security agents are tool-restricted to read-only.
- **7 slash commands**: `/be:session-start`, `/be:session-end`, `/be:adr`, `/be:impact`,
  `/be:release-check`, `/be:structural-analysis`, `/be:bootstrap`.
- **SessionStart hook** that injects the Current State / Next Steps of `docs/HISTORY.md`
  into context automatically (silent when the file does not exist).
- **MCP guidance**: `plugins/be/mcp.recommended.json` template (no auto-started servers).
- Repository governance: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CLAUDE.md`, CI
  workflow, `scripts/validate.js`, installer tests (`node --test`).

### Changed

- **Generalized backend skills**: `be-flyway-migrations` → `be-db-migrations`; JWT,
  pagination, and error-handling skills are now stack-agnostic with Java/Spring and
  Angular examples moved to resource files.
- `BOOTSTRAP.md` now forks at Step 0: Claude Code users install the plugin (skipping
  manual agent/skill copies); other tools keep the npm installer path.
- `ai-context.template.md` targets `CLAUDE.md` as the primary deployment, with
  Copilot/Cursor/Windsurf paths as mirrors.
- npm installer copies from `plugins/be/` to `.github/base/` (skills keep directory
  format); prints a migration notice when a legacy flat layout is detected.

### Deprecated

- `check-version.sh` — use `npx @barcelosvinicius/basic-engineering check` instead.
- Legacy layout `.github/base/roles/` and flat `.github/base/skills/*.md`.

## [1.0.0] — 2026-05-11

- Initial npm release: universal engineering base with 13 role templates, 20 flat
  skills, 11 documentation templates, engineering principles, and the `be` CLI installer.

## Roadmap (not yet scheduled)

- `sec-threat-modeling` skill
- `qa-performance-testing` skill
- Stack-specific resource packs for additional ecosystems (Python/FastAPI, Node/Nest, Go)
