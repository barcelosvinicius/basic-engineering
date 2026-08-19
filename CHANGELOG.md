# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
