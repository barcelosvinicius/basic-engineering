---
name: proc-skill-creator
description: >
  Meta-skill that guides the creation of new skills — discovery process, mandatory
  structure, quality criteria, and delivery checklist. Use when you need to
  create a new domain, process, or infrastructure skill for this project or for the base.
---

# Skill: Creating New Skills (Meta-Skill)

## What this skill is

Defines the process for creating and iterating skills — the technical knowledge documents
in `.github/skills/`. Use when you identify that a domain skill is missing, when an
existing skill needs significant refactoring, or when expanding the base kit for new projects.

---

## Anatomy of a well-made skill

```
.github/skills/
└── [prefix]-[name].md
    ├── YAML frontmatter (name + description) ← mandatory
    ├── ## What this skill is             ← 1-2 sentences: problem solved + when to use
    ├── ## When to consult this skill     ← concrete triggers
    ├── ## [Main sections]                ← code, examples, patterns — the concrete "how"
    ├── ## Common mistakes                ← table: Mistake | Cause | Solution
    └── Footer with references            ← other skills, principles, external docs
```

---

## Creation process — step by step

### Step 1: Identify the need

Questions to diagnose whether a new skill is needed:

- "Is this knowledge repeatedly needed or has it been rewritten more than once?"
- "Is there a project-specific pattern that is not documented?"
- "Would another agent ask 'how do I do X?' without having anywhere to look?"
- "Is this 'how to do it' specific enough that it does not belong in `copilot-instructions.md`?"

If the answer is **yes** to any of them → create the skill.

### Step 2: Define the scope

The skill must answer **exactly one** of these questions:
- "How do I implement [pattern] in this project?"
- "How do I follow the [process] in this project?"
- "How do I configure [tool] for this context?"

❌ If the skill answers "What is [concept]?" → it belongs in `docs/fundamentos/`
❌ If the skill answers "Why use [approach]?" → it belongs in the ADR or the agent

### Step 3: Choose the correct prefix and name

| Prefix | Layer | When to use |
|--------|-------|-------------|
| `be-` | Backend | Java/Spring Boot — any server skill |
| `fe-` | Frontend | Angular/TypeScript — any UI skill |
| `da-` | Data | Analytics, BI, insight queries |
| `qa-` | Quality | Tests, automation, security |
| `proc-` | Process | Workflows, protocols — **proc skills are universal** |
| `infra-` | Infrastructure | CI/CD, Docker, observability |

**Naming:** `[prefix]-[hyphenated-noun].md`
- ✅ `be-caching-patterns.md`, `proc-incident-response.md`, `fe-state-management.md`
- ❌ `backend-cache.md`, `how-to-cache.md`, `cache.md`

### Step 4: Decide where it goes (project vs base)

| Criteria | Goes in `.github/skills/` (project) | Goes in `.github/base/skills/` (base) |
|----------|-------------------------------------|--------------------------------------|
| Mentions specific technologies | ✅ | ❌ |
| Mentions domain entities | ✅ | ❌ |
| Works in any similar project | ❌ | ✅ |
| Is a universal process | ❌ | ✅ |

**Rule:** If the skill mentions `TransactionService`, `gestao_db`, or `Vinicius & Renata` → project.
If it works equally well in an e-commerce project → base.

### Step 5: Write the skill

Use the template in `.github/base/roles/skill.template.md` as a starting point.

**Writing principles:**
- Imperative/infinitive language, not second person: "Use X when doing Y" (not "You must use X")
- Concrete before abstract: code first, explanation after
- Mandatory examples: at least one ✅ correct and one ❌ wrong
- Common mistakes: table with at least 2-3 real traps
- Self-contained: another instance of the agent must be able to follow it without extra context

### Step 6: Add YAML frontmatter

```yaml
---
name: [prefix]-[name]        ← same as the filename without .md
description: >
  [One sentence: what it solves]. [When to use — concrete trigger].
  [Complement if needed — max 3 sentences].
---
```

The `description` is read **before** opening the skill — it is what determines whether the agent will consult it.
It must be specific enough not to trigger in the wrong contexts.

### Step 7: Reference it in proc-session-continuity

Every new skill must be added to the reference table in `proc-session-continuity.md`:

```markdown
| `[prefix]-` | [name] | [When to consult — 1 sentence] |
```

---

## Quality checklist

Before considering the skill ready:

- [ ] YAML frontmatter with descriptive `name` and `description`
- [ ] "What this skill is" section with problem + usage trigger
- [ ] At least one complete and executable code example
- [ ] Examples with ✅ correct and ❌ wrong
- [ ] "Common mistakes" section with Mistake | Cause | Solution table
- [ ] References to related skills in the footer
- [ ] Imperative language, not second person
- [ ] Added to the table in `proc-session-continuity.md`
- [ ] If universal: also added to `.github/base/skills/`

---

## When to update vs create a new skill

| Situation | Action |
|-----------|--------|
| Pattern evolved but belongs to the same domain | Update the existing skill |
| New technology or library | Create a new skill |
| Skill became too large (> 300 lines) | Split into 2 specialized skills |
| Skill covers 2 different domains | Split by prefix |
| Pattern was deprecated | Add deprecation note + reference to the new skill |

---

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Skill without frontmatter | Created before the YAML standard | Add `---` block with name and description |
| Description too generic | Copy of the title | Describe the specific usage trigger |
| Skill without examples | Theoretical documentation | Add executable code snippet |
| Skill in base with domain names | Confusion between base and project | Extract specific references into the project version |
| Forgot to reference it in proc-session-continuity | Skill not discoverable | Check the table before finishing |

---

*Skill — `.github/skills/proc-skill-creator.md`*
*Reference: `.github/base/roles/skill.template.md` · `.github/base/BOOTSTRAP.md` §Step 4*
