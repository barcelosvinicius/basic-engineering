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
  three-outcome test in `proc-skill-creator` rather than trimming blindly: does the
  **trigger** split into different outputs (→ new skill)? then, section by section,
  is this needed to **decide** or to **look up** (→ extract the lookup)? What is left
  is the procedure, whatever its length.
- Never hardcode tool-specific paths (`.be/...`) inside skills/agents —
  reference skills by name.
- Versions must stay in sync: `package.json`, `plugins/be/.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json` (semver) + `BASE_VERSION` (`vYYYYMMDD-HHMMSS`).
- Conventional Commits; update `CHANGELOG.md` (Unreleased) with every behavior change.

## Verification

```bash
npm run validate     # frontmatter/manifest/version checks (scripts/validate.js)
npm test             # installer tests (node --test)
npm run check:style  # biome: lint + format (phases 2-3 of qa-verification-loop)
npm run typecheck    # tsc --noEmit over scripts, hooks and lib
node bin/be.js install <tmpdir> --dry-run   # installer smoke test
```

**This repo wears its own hooks.** `.claude/settings.json` declares the same
events as `plugins/be/hooks/hooks.json`, rooted at `$CLAUDE_PROJECT_DIR` instead
of an installed copy, so the hook you are editing is the hook that runs — the
fix you just wrote does not wait for a release to reach you. `validate` fails if
the two declarations drift. If you also have the **published** `be` plugin
installed, disable it while working here (`/plugin`), or every hook fires twice.

## Gotchas

- The installer must **never delete user files** in target projects; legacy layouts get
  a printed migration notice only.
- `BASE_VERSION` comparison is lexicographic — keep the `vYYYYMMDD-HHMMSS` format.
- The plugin ships **no `.mcp.json`** on purpose (no auto-started servers);
  `plugins/be/mcp.recommended.json` is a copy-me template.
- `check-version.sh` is deprecated but kept for installed bases that reference it.
- `.harness-score.json` turns **HYG-08** off. That check asks that MCP credentials
  use `${ENV_VAR}` interpolation; this plugin ships no `.mcp.json` at all, on
  purpose, so there is nothing here to interpolate into. The reason lives here
  rather than in the file because their config schema rejects unknown keys.
  Two more checks are left failing **by decision**, not by omission: pre-commit
  tooling (`CI-04`) would add dependencies to duplicate what this base's own
  hooks already do, and scoped rule files (`CTX-03..06`) would fragment a
  60-line CLAUDE.md because a checklist awards points for it. `SKL-*`/`AGT-*`
  read a consumer layout (`.claude/skills/`) against a repo that *produces* the
  plugin; `npm run dev:link` bridges it locally, and local is the honest answer.
