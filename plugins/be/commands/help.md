---
description: Show the be capabilities guide — every command, agent, and skill the base offers, plus the live guardrails
---

Show the user what the `be` base can do for them.

1. Read and present the generated guide at `${CLAUDE_PLUGIN_ROOT}/BE-GUIDE.md`
   (Channel B / other tools: `.be/BE-GUIDE.md`). Lead with the
   start-here commands and the live guardrails (and how to opt out with
   `BE_HOOKS` / `BE_HOOK_<ID>`), then point to the Commands / Agents / Skills
   tables.
2. If $ARGUMENTS names a topic (e.g. "security", "session", "backend"), focus
   the answer on the matching commands, agents, and skills.
3. If `BE-GUIDE.md` is not already at the project root, offer to write it there
   (via `/be:bootstrap`) so the team can discover the base without asking.

Do not edit or regenerate `BE-GUIDE.md` from here — it is generated from the
plugin's own frontmatter (`npm run gen:guide`).
