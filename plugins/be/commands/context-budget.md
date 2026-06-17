---
description: Audit what consumes the context window — agents, skills, MCP tools, rules, CLAUDE.md — and report prioritized token savings
---

Run the `proc-context-budget` skill against the current setup. $ARGUMENTS may
focus the audit (e.g. "mcp" or "claude.md") — otherwise audit everything.

1. **Inventory** the always-loaded components and estimate token cost
   (`words × 1.3` for prose, `chars / 4` for code/JSON):
   - MCP servers + total tool count (read `.mcp.json` if present) — ~500 tokens
     per tool schema, the usual biggest lever.
   - Agent `description` fields (loaded on every Task spawn).
   - The `CLAUDE.md` chain (project + user) and any always-on rules.
   - Skill descriptions (bodies are on-demand → cheap).
2. **Classify** each as always / sometimes / rarely needed for THIS project,
   and **flag** MCP over-subscription, bloated agent descriptions (>30 words),
   CLAUDE.md bloat (>~150 lines), and duplicates.
3. **Report** in the skill's format, ranked by token savings, with the top 3
   concrete actions and the estimated reclaim.

Read-only and advisory — recommend cuts; let the user decide what to remove.
