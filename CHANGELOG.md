# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Roadmap (deliberately deferred)

- `sec-threat-modeling` skill
- `qa-performance-testing` skill
- Stack-specific resource packs for additional ecosystems (Python/FastAPI, Node/Nest, Go)

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
