---
description: Bootstrap the engineering base in the current project — docs structure, CLAUDE.md, and session protocol
---

Run the kickoff guide (BOOTSTRAP.md at the plugin root) for the current
project. $ARGUMENTS may describe the project (stack, domain) — otherwise
derive it from the repository and ask only what cannot be inferred.

1. **AI context file:** create or update `CLAUDE.md` at the project root
   from the base's `ai-context.template.md` — fill every `<!-- CUSTOMIZE -->`
   section from the actual codebase (stack, structure, conventions, security,
   business rules, gotchas). Keep it under ~150 lines. If the user also uses
   other AI tools, offer to mirror it to `.github/copilot-instructions.md`
   and/or `.cursorrules`.
2. **Living documentation:** scaffold `docs/` from the base templates
   (`templates/docs/`): `INDEX.md`, `HISTORY.md` (with a first "project
   bootstrapped" entry), `structural-analysis.md`, `CHANGELOG.md`,
   `lessons-learned.md`, and `docs/adr/` with the ADR template. Skip files
   that already exist — never overwrite.
3. **Structural analysis:** if the project already has source code, offer to
   run `/be:structural-analysis` to baseline the architecture.
4. **SDD (optional):** if the project will span more than two weeks, offer to
   create the `.specify/specs|plans|tasks` structure per the `proc-sdd` skill.
5. **MCP (optional):** mention `mcp.recommended.json` at the plugin root as a
   reviewed-by-the-user starting point for the project's `.mcp.json`.
6. Finish by proposing the first commit
   (`chore(setup): initialize documentation structure`) and reminding the
   user of the session protocol: `/be:session-start` and `/be:session-end`.

Skills, agents, and commands themselves come from this plugin — do NOT copy
them into the project.
