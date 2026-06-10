---
name: proc-skill-creator
description: >
  Use when a needed domain/process/infrastructure skill is missing, when an
  existing skill needs significant refactoring, or when expanding the base
  kit. Meta-skill: discovery process, mandatory structure (SKILL.md +
  resources), naming, quality criteria, and delivery checklist.
---

# Skill: Creating New Skills (Meta-Skill)

Defines the process for creating and iterating skills — reusable technical
knowledge documents. Use when you identify that a skill is missing, when an
existing one needs significant refactoring, or when expanding the base kit.

## Anatomy of a well-made skill

Each skill is a **directory** containing a `SKILL.md` plus optional resource
files loaded on demand:

```
skills/
└── [prefix]-[name]/
    ├── SKILL.md            ← frontmatter + the concise "how" (≤ ~150 lines)
    └── [resource].md       ← optional: long examples, checklists, stack-specific code
```

`SKILL.md` structure:

- YAML frontmatter (`name` + `description`) — mandatory
- One-paragraph statement of the problem solved and when to use it
- Main sections — patterns, rules, short examples: the concrete "how"
- `## Common mistakes` — table: Mistake | Cause | Solution
- `## Resources` — links to sibling resource files, if any

**Token economy rule:** only the frontmatter description is loaded until the
skill triggers; only `SKILL.md` is loaded until a resource is needed. Put
stack-specific or lengthy material in resource files.

## Creation process — step by step

### Step 1: Identify the need

- "Is this knowledge repeatedly needed or rewritten more than once?"
- "Is there a project-specific pattern that is not documented?"
- "Would another agent ask 'how do I do X?' without having anywhere to look?"
- "Is this 'how' too specific for the AI context file?"

If **yes** to any → create the skill.

### Step 2: Define the scope

The skill must answer **exactly one** of: "How do I implement [pattern]?",
"How do I follow [process]?", "How do I configure [tool]?"

❌ "What is [concept]?" → belongs in `docs/fundamentos/`.
❌ "Why use [approach]?" → belongs in an ADR or the agent.

### Step 3: Choose the correct prefix and name

| Prefix | Layer | When to use |
|--------|-------|-------------|
| `be-` | Backend | Any server-side skill |
| `fe-` | Frontend | Any UI skill |
| `da-` | Data | Analytics, BI, insight queries |
| `qa-` | Quality | Tests, automation |
| `sec-` | Security | Secrets, hardening, threat patterns |
| `ops-` | Operations | Observability, incidents, runbooks |
| `proc-` | Process | Workflows, protocols — **proc skills are universal** |
| `infra-` | Infrastructure | CI/CD, containers, deploy |

**Naming:** `[prefix]-[hyphenated-noun]` — directory name == frontmatter `name`.
✅ `be-caching-patterns`, `proc-incident-response` · ❌ `backend-cache`, `how-to-cache`

### Step 4: Decide where it goes (project vs base)

If the skill mentions specific project entities or internal names → project
skill (`.claude/skills/` for Claude Code, or the project's skills folder).
If it works equally well in an unrelated project → candidate for the base.

### Step 5: Write it

Start from [skill-template.md](skill-template.md). Writing principles:

- Imperative language: "Use X when doing Y" (not "You must use X").
- Concrete before abstract: code first, explanation after.
- At least one ✅ correct and one ❌ wrong example.
- Self-contained: another agent must be able to follow it without extra context.
- Stack-agnostic principles in `SKILL.md`; framework code in resources.

### Step 6: Write the frontmatter description (the discovery surface)

```yaml
---
name: [prefix]-[name]        # same as the directory name
description: >
  Use when [concrete trigger]. [What it covers — max 3 sentences].
---
```

The `description` is read **before** the skill is opened — it alone
determines whether the skill triggers. Lead with the trigger condition and
be specific enough not to fire in wrong contexts.

### Step 7: Register it

Add the new skill to the table in the `proc-session-continuity` skill's
`resources.md`, so it is discoverable from the session protocol.

## Quality checklist

- [ ] Directory name == frontmatter `name`, correct prefix
- [ ] `description` leads with "Use when …" trigger
- [ ] `SKILL.md` ≤ ~150 lines; long material moved to resources
- [ ] At least one ✅/❌ example pair
- [ ] "Common mistakes" table
- [ ] Imperative language
- [ ] Registered in `proc-session-continuity/resources.md`

## When to update vs create a new skill

| Situation | Action |
|-----------|--------|
| Pattern evolved within the same domain | Update the existing skill |
| New technology or library | New skill (or a new resource file if the principles are shared) |
| SKILL.md grew past ~150 lines | Move detail into resource files |
| Skill covers 2 different domains | Split by prefix |
| Pattern deprecated | Add a deprecation note + reference to the replacement |

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Description is a copy of the title | No trigger condition | Lead with "Use when …" |
| Everything in SKILL.md | No progressive disclosure | Split stack examples into resources |
| Skill without examples | Theoretical documentation | Add an executable snippet |
| Base skill with project names | Base/project confusion | Generalize or move to the project |
| Not registered in session-continuity resources | Skill hard to discover | Update the table before finishing |

## Resources

- [skill-template.md](skill-template.md) — starting template for new skills.
