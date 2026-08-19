# basic-engineering — repo context

Engineering base distributed two ways from one canonical source (`plugins/be/`):

1. **Claude Code plugin** — marketplace manifest at `.claude-plugin/marketplace.json`,
   plugin at `plugins/be/` (skills, agents, commands, hooks).
2. **npm installer** — `bin/be.js` + `lib/installer.js` copy `plugins/be/` content into
   a target project's `.be/` for Copilot/Cursor/other tools.

## Structure

- `plugins/be/skills/<name>/SKILL.md` — canonical skills (Agent Skills format)
- `plugins/be/agents/*.md` — subagents (work uncustomized; read project conventions at runtime)
- `plugins/be/commands/*.md` — slash commands (`/be:*`)
- `plugins/be/hooks/` — SessionStart + PreToolUse guardrails + Stop reminder (scripts in `hooks/scripts/`; fail-open, opt-out via `BE_HOOKS`)
- `plugins/be/templates/docs/` — documentation templates for target projects
- `plugins/be/BOOTSTRAP.md` — kickoff guide for target projects

## Conventions

- All content in **English**, kebab-case names, prefixes: `proc-`, `be-`, `fe-`, `qa-`,
  `sec-`, `ops-`, `infra-` (skills); `dev-`, `mgmt-`, `qa-`, `infra-`, `ops-` (agents).
  **One declared exception:** `engineering-principles` carries no prefix — it is the
  digest every other skill points at, not a member of a family. Enforced by
  `npm run validate`, exception list included, so tooling stops guessing: an
  undeclared exception once made a prefix-based sweep miss it and misreport the
  activation graph.
- Skill frontmatter: `name` == directory name; `description` leads with the trigger
  condition ("Use when…"). SKILL.md loads in full on every activation while sibling
  resources load on demand, so keep it within ~150 lines — and over that, apply the
  three-outcome test in `proc-skill-creator` (leave it / extract to resources / new
  skill) rather than trimming blindly. The discriminator is the **trigger**, not the
  line count.
- Never hardcode tool-specific paths (`.be/...`) inside skills/agents —
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
