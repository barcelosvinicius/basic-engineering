# basic-engineering

> A universal engineering base for AI-assisted software projects — delivered
> as a **Claude Code plugin** (skills, agents, commands, hooks) and as an
> **npm installer** for Copilot, Cursor, and any other AI tool.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
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

Then, in your project: `/be:bootstrap`. Done — 25 skills, 12 agents, 7
commands, and the session-continuity hook are active. Update later with
`/plugin update be@basic-engineering`.

### Other tools (Copilot, Cursor, Windsurf, …)

```bash
npx @barcelosvinicius/basic-engineering install   # copies the base to .be/
npx @barcelosvinicius/basic-engineering check     # check for updates
```

Then follow `.be/BOOTSTRAP.md`. The content is identical — plain
markdown readable by any tool.

> `check-version.sh` is **deprecated** — use `be check` instead.

## What this base delivers

| Component | Count | What it is |
|-----------|-------|------------|
| **Skills** | 25 | Reusable technical knowledge in Agent Skills format (`skills/<name>/SKILL.md` + on-demand resources): process protocols (session continuity, SDD, ADR, code review, code documentation, impact/structural/domain analysis, dependency management), backend patterns (errors, versioning, migrations, auth, pagination), frontend (UX, accessibility), security (secrets), operations (observability), CI/CD, testing |
| **Agents** | 12 | Ready-to-use specialized subagents — dev (backend, frontend, data), mgmt (PO, PM, domain expert, architect), qa (engineer, security reviewer, pentest), infra (devops), ops (SRE). They work **without customization**: each reads the project's conventions from `CLAUDE.md` and `docs/` at runtime. Analyst/security agents are tool-restricted to read-only |
| **Commands** | 7 | `/be:session-start`, `/be:session-end`, `/be:adr`, `/be:impact`, `/be:release-check`, `/be:structural-analysis`, `/be:bootstrap` |
| **Hooks** | 1 | SessionStart — injects `docs/HISTORY.md` Current State / Next Steps automatically (silent when the file doesn't exist) |
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
  ├── skills/<name>/SKILL.md      ← 25 skills + resources
  ├── agents/*.md                 ← 12 subagents
  ├── commands/*.md               ← 7 slash commands
  ├── hooks/                      ← SessionStart hook
  ├── templates/docs/             ← 11 documentation templates
  ├── BOOTSTRAP.md                ← project kickoff guide
  ├── engineering-principles.md
  ├── ai-context.template.md      ← CLAUDE.md template
  └── mcp.recommended.json
bin/be.js · lib/installer.js      ← npm CLI for non-Claude tools
scripts/validate.js · test/       ← structural validation + installer tests
```

## Versioning

- **Semver** (`2.0.0`) in `package.json`, `plugin.json`, and
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
