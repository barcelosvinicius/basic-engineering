# Contributing to basic-engineering

Thank you for considering a contribution. This repository is both an engineering base
and a Claude Code plugin marketplace — contributions must keep both delivery channels
(plugin and npm installer) consistent.

## Repository layout

| Path | What it is |
|------|------------|
| `plugins/be/` | The canonical content: skills, agents, commands, hooks, templates |
| `bin/`, `lib/` | npm CLI installer (`npx @barcelosvinicius/basic-engineering`) |
| `scripts/validate.js` | Structural validation (frontmatter, manifests, versions) |
| `test/` | Installer tests (`node --test`) |

## Ground rules

1. **Content is written in English** — kebab-case file names, prefix conventions
   (`proc-`, `be-`, `fe-`, `qa-`, `sec-`, `ops-`, `infra-`, `dev-`, `mgmt-`).
2. **Skills** live in `plugins/be/skills/<name>/SKILL.md`:
   - Frontmatter `name` must equal the directory name.
   - Frontmatter `description` must lead with the trigger condition ("Use when…").
   - Keep `SKILL.md` under ~150 lines; move long tables, checklists, and stack-specific
     examples to sibling resource files loaded on demand.
   - Stack-agnostic principles in `SKILL.md`; framework examples in resources.
3. **Agents** live in `plugins/be/agents/<name>.md` and must work without
   customization — they read project conventions from `CLAUDE.md` and `docs/` at runtime.
4. **Never hardcode tool-specific paths** (e.g., `.github/base/...`) inside skills or
   agents — reference other skills by name instead.

## Before opening a PR

```bash
npm run validate   # structural checks
npm test           # installer tests
```

- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).
- Update `CHANGELOG.md` under the Unreleased section.
- If you added/removed skills, agents, or templates, update the counts in
  `base-manifest.json` and the plugin description in both manifests.

## Releasing

1. Bump `version` in `package.json`, `plugins/be/.claude-plugin/plugin.json`, and
   `.claude-plugin/marketplace.json` (keep them identical).
2. Regenerate `BASE_VERSION` (`vYYYYMMDD-HHMMSS`, UTC) and `base-manifest.json`.
3. Move the Unreleased changelog entries under the new version heading.
4. Tag and publish: `npm publish --access public`.
