# basic-engineering

> A universal engineering base for AI-assisted software projects — delivered
> as a **Claude Code plugin** (skills, agents, commands, hooks) and as an
> **npm installer** for Copilot, Cursor, and any other AI tool.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## What is this repository?

**basic-engineering** is a foundational framework designed to maximize the
value of any AI assistant in real-world software projects. AI tools are only
as good as the context and structure surrounding them — without clear
principles, defined roles, reusable knowledge, and living documentation, AI
assistance degrades into noise. This base provides the scaffolding that
elevates AI from autocomplete to a genuine engineering partner.

## Quickstart

### Claude Code (recommended)

```
/plugin marketplace add barcelosvinicius/basic-engineering
/plugin install be@basic-engineering
```

Then, in your project: `/be:bootstrap`. Done — 28 skills, 15 agents, 11
commands, and the live guardrail hooks are active. Update later with
`/plugin update be@basic-engineering`.

### Other tools (Copilot, Cursor, Windsurf, …)

```bash
npx @barcelosvinicius/basic-engineering install   # copies the base to .be/
npx @barcelosvinicius/basic-engineering check     # check for updates
```

Then follow `.be/BOOTSTRAP.md`. The content is identical — plain
markdown readable by any tool.

> `check-version.sh` is **deprecated** — use `be check` instead.

## Updating

- **Claude Code:** `/plugin update be@basic-engineering`.
- **Other tools:** re-run `npx @barcelosvinicius/basic-engineering install` — it
  compares `BASE_VERSION` and refreshes only the universal files in `.be/`,
  never touching your customizations (`be check` reports whether an update is
  available).

Releasing a new version of this base? See **[RELEASING.md](RELEASING.md)**: bump
with `npm run release`, push to `main`, and both channels publish — the
marketplace serves from `main`, and npm publishes via the OIDC CI workflow.

## What this base delivers

| Component | Count | What it is |
|-----------|-------|------------|
| **Skills** | 28 | Reusable technical knowledge in Agent Skills format (`skills/<name>/SKILL.md` + on-demand resources): process protocols (session continuity, SDD, ADR, code review, code documentation, impact/structural/domain analysis, dependency management), backend patterns (errors, versioning, migrations, auth, pagination), frontend (UX, accessibility), security (secrets), operations (observability), CI/CD, testing |
| **Agents** | 15 | Ready-to-use specialized subagents — dev (backend, frontend, data), mgmt (PO, PM, domain expert, architect), qa (engineer, security reviewer, pentest), infra (devops), ops (SRE). They work **without customization**: each reads the project's conventions from `CLAUDE.md` and `docs/` at runtime. Analyst/security agents are tool-restricted to read-only |
| **Commands** | 11 | Session: `/be:session-start`, `/be:session-end`; quality: `/be:check`, `/be:impact`; setup & help: `/be:bootstrap`, `/be:help`; decisions & release: `/be:adr`, `/be:structural-analysis`, `/be:release-check`; context & cost: `/be:context-budget`, `/be:model-route` |
| **Guardrail hooks** | live | **Fail-open, opt-out** (`BE_HOOKS=off`): PreToolUse blocks hardcoded secrets, weakening linter configs, and `git --no-verify`; an opt-in fact-forcing gate (`BE_GATEGUARD`); a Stop reminder for `/be:session-end`; SessionStart injects `HISTORY` state and drops the capabilities guide at the project root |
| **Capabilities guide** | EN + PT | `BE-GUIDE.md` / `BE-GUIDE.pt.md` — generated catalog + scenario→action playbooks; shown by `/be:help` |
| **Bundled extras** | — | Starter Semgrep rule (`semgrep/`), stack mappings + install profiles (`config/`), and the `.be-paths.json` EN/PT doc-path map |
| **Doc templates** | 11 | Changelog, contributing, history, index, security policy, learning trail, structural analysis, lessons learned, onboarding, runbook, ADR |
| **Principles** | 1 | `engineering-principles.md` — technology-agnostic rules for UX, security, coupling, testing, observability, resilience, plus the AI documentation protocol |

### MCP

The plugin deliberately ships **no auto-started MCP servers** — every server
adds processes, permissions, and context tokens. `plugins/be/mcp.recommended.json`
is a reviewed-by-you starting point (GitHub, docs server, read-only DB) to
copy into your project's `.mcp.json`.

## Design philosophy

1. **Depth over speed** — thinking-before-coding discipline that eliminates
   silent assumptions and rework.
2. **Structured context for AI** — agents and skills give assistants
   precisely the context they need, when they need it.
3. **Security and quality by default** — OWASP, SAST, dependency scanning,
   accessibility, and observability as first-class concerns.
4. **Permanent evolution** — versioned and self-updating; projects inherit
   improvements without starting over.
5. **Token efficiency as engineering discipline** — progressive disclosure
   everywhere: skill descriptions load first, bodies on trigger, resources on
   demand; sessions load context depth-first (see the `proc-sdd` skill).

## Repository layout

```
.claude-plugin/marketplace.json   ← plugin marketplace manifest
plugins/be/                       ← the canonical content (one source of truth)
  ├── .claude-plugin/plugin.json
  ├── skills/<name>/SKILL.md      ← 28 skills + resources
  ├── agents/*.md                 ← 15 subagents
  ├── commands/*.md               ← 11 slash commands
  ├── hooks/                      ← SessionStart + PreToolUse guardrails + Stop
  ├── semgrep/ · config/          ← SAST rules, stack mappings, install profiles
  ├── BE-GUIDE.md · BE-GUIDE.pt.md ← generated capabilities guide (EN/PT)
  ├── templates/docs/             ← 11 documentation templates
  ├── BOOTSTRAP.md                ← project kickoff guide
  ├── engineering-principles.md
  ├── ai-context.template.md      ← CLAUDE.md template
  └── mcp.recommended.json
bin/be.js · lib/installer.js      ← npm CLI for non-Claude tools
scripts/validate.js · test/       ← structural validation + installer tests
```

## Versioning

- **Semver** (`3.0.0`) in `package.json`, `plugin.json`, and
  `marketplace.json` — always identical.
- **`BASE_VERSION`** (`vYYYYMMDD-HHMMSS`) drives the npm installer's
  update detection in target projects.
- Changes are tracked in [CHANGELOG.md](CHANGELOG.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Before opening a PR:

```bash
npm run validate && npm test
```

## License

[MIT](LICENSE)
