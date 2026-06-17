# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]


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
