# basic-engineering — repo context

Engineering base distributed two ways from one canonical source (`plugins/be/`):

1. **Claude Code plugin** — marketplace manifest at `.claude-plugin/marketplace.json`,
   plugin at `plugins/be/` (skills, agents, commands, hooks).
2. **npm installer** — `bin/be.js` + `lib/installer.js` copy `plugins/be/` content into
   a target project's `.github/base/` for Copilot/Cursor/other tools.

## Structure

- `plugins/be/skills/<name>/SKILL.md` — canonical skills (Agent Skills format)
- `plugins/be/agents/*.md` — subagents (work uncustomized; read project conventions at runtime)
- `plugins/be/commands/*.md` — slash commands (`/be:*`)
- `plugins/be/hooks/` — SessionStart hook only
- `plugins/be/templates/docs/` — documentation templates for target projects
- `plugins/be/BOOTSTRAP.md` — kickoff guide for target projects

## Conventions

- All content in **English**, kebab-case names, prefixes: `proc-`, `be-`, `fe-`, `qa-`,
  `sec-`, `ops-`, `infra-` (skills); `dev-`, `mgmt-`, `qa-`, `infra-`, `ops-` (agents).
- Skill frontmatter: `name` == directory name; `description` leads with the trigger
  condition ("Use when…"). Keep SKILL.md ≤ ~150 lines; long examples go in sibling
  resource files.
- Never hardcode tool-specific paths (`.github/base/...`) inside skills/agents —
  reference skills by name.
- Versions must stay in sync: `package.json`, `plugins/be/.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json` (semver) + `BASE_VERSION` (`vYYYYMMDD-HHMMSS`).
- Conventional Commits; update `CHANGELOG.md` (Unreleased) with every behavior change.

## Verification

```bash
npm run validate   # frontmatter/manifest/version checks (scripts/validate.js)
npm test           # installer tests (node --test)
node bin/be.js install <tmpdir> --dry-run   # installer smoke test
```

## Gotchas

- The installer must **never delete user files** in target projects; legacy layouts get
  a printed migration notice only.
- `BASE_VERSION` comparison is lexicographic — keep the `vYYYYMMDD-HHMMSS` format.
- The plugin ships **no `.mcp.json`** on purpose (no auto-started servers);
  `plugins/be/mcp.recommended.json` is a copy-me template.
- `check-version.sh` is deprecated but kept for installed bases that reference it.
