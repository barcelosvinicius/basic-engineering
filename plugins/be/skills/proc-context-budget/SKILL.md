---
name: proc-context-budget
description: Use when the session feels sluggish, output quality drops, after adding several skills/agents/MCP servers, or to decide whether there is room to add more — audits what consumes the context window (agents, skills, MCP tools, rules, CLAUDE.md) and returns prioritized token-savings recommendations.
---

# Context Budget

Make the "unused = context noise" principle measurable. Audit token overhead
across every always-loaded component and surface the cheapest cuts. The biggest
lever is almost always MCP tools, then agent descriptions and CLAUDE.md.

## When to use

- The session feels slow or output quality is degrading.
- You just added several skills, agents, or MCP servers.
- You want to know how much headroom is left before adding more.
- Backs the `/be:context-budget` command.

## What costs context (and when)

| Component | Loaded | Rough cost |
| --- | --- | --- |
| **MCP tools** | always, while a server is enabled | ~500 tokens **per tool** (schema) |
| **Agent `description`** | always (every Task invocation) | the frontmatter description, every spawn |
| **CLAUDE.md chain** | always | the whole file (project + user) |
| **Always-on rules** | always | each file |
| **Skill `description`** | always (body only on trigger) | one line per skill; bodies are on-demand |
| **Agent / skill bodies** | on demand | free until invoked |

Key insight: skills are cheap (progressive disclosure — only the description is
always loaded). **MCP servers and CLAUDE.md are where bloat hides.**

## How it works

1. **Inventory** — estimate tokens per component (`words × 1.3` for prose,
   `chars / 4` for code/JSON). Count MCP servers and total tools (`.mcp.json`).
2. **Classify** each into a bucket:
   - **Always needed** — referenced in CLAUDE.md / backs an active command /
     matches the project's stack → keep.
   - **Sometimes** — domain/stack-specific, not referenced → activate on demand.
   - **Rarely** — no reference, overlaps another component → remove or lazy-load.
3. **Flag issues:** MCP over-subscription (>10 servers, or servers that wrap a
   CLI you already have like `gh`/`git`/`npm`); bloated agent descriptions
   (>30 words load on every spawn); CLAUDE.md bloat (>~150 lines / outdated
   sections); duplicate components.
4. **Report** ranked by token savings.

## Report format

```
Context Budget — estimated overhead ~XX,XXX tokens
| Component  | Count | ~Tokens |
| Agents     | N     | X,XXX   |
| Skills     | N     | X,XXX   |
| MCP tools  | N     | XX,XXX  |
| CLAUDE.md  | N     | X,XXX   |

Top savings:
1. <action> → ~X,XXX tokens
2. ...
```

## Best practices

- **MCP first:** a 30-tool server costs more than all your skills combined.
  Disable what the current task doesn't need; pair with `mcp.recommended.json`.
- **Keep CLAUDE.md ≤ ~150 lines** — move durable conventions into skills/rules.
- **Agent descriptions are always loaded** — keep them one tight sentence.
- Re-audit after adding any agent, skill, or MCP server to catch creep early.
