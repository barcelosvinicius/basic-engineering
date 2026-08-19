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

### Step 7: Register it, and declare who reaches it

Add the new skill to the table in the `proc-session-continuity` skill's
`resources.md`, so it is discoverable from the session protocol.

**Then answer: which existing skill hands off to this one?** A skill nothing
points at is an *orphan* — it works, and it activates only when someone
remembers it exists. Three skills in this base were orphans until measured;
one of them was the reason a project's `lessons-learned` sat 65 commits stale
while the skill that maintains it was shipped and idle.

Declare the hand-off in the **referring** skill, under an `## Activation edges`
heading, as a three-column table:

```markdown
## Activation edges

| Type | Target | When |
|---|---|---|
| `invoke` | `your-new-skill` | [the condition that makes this apply] |
```

- **`consult`** = read the target's rules; no execution, cannot re-enter.
- **`invoke`** = may run the target's flow. Only these can form a cycle, so
  only these are checked — in prose, a mention and a hand-off look identical,
  and a graph with untyped edges cannot be verified at all.
- **Every edge is a reminder, never a block.** An edge that cannot be honoured
  now becomes a pending item, not a stop condition.

## Quality checklist

- [ ] Directory name == frontmatter `name`, correct prefix
- [ ] `description` leads with "Use when …" trigger
- [ ] `SKILL.md` within ~150 lines — over it, apply the three-outcome test and
      record which outcome applies, rather than trimming blindly
- [ ] At least one ✅/❌ example pair
- [ ] "Common mistakes" table
- [ ] Imperative language
- [ ] Registered in `proc-session-continuity/resources.md`
- [ ] At least one existing skill declares an `## Activation edges` row pointing
      at it — a skill nobody reaches is a skill nobody runs
- [ ] Any rule the skill makes **verifiable** ships with a known positive case
      that makes the check fail (see `qa-verification-loop`) — an unexercised
      ruler proves nothing

## When a skill gets too big — three outcomes, not two

`SKILL.md` loads **in full every time the skill triggers**; resource files load
on demand. The ~150-line budget is therefore a budget on what you pay **at every
activation**, not on how much the skill knows — a 100-line `SKILL.md` with 14 KB
of resources is well shaped, not oversized.

Line count is an **alarm that says "apply the test"**, never the verdict: it
cannot tell cohesion from depth. Two questions, in this order.

**1. Does the trigger split?** Do the situations in the `description` lead to
different outputs, each needing its own decision? If yes → **new skill**, and
declare the edge between them. If someone arriving via trigger A can skip most
of the file, the file is two things. This question is about cohesion and is
**independent of size** — a 60-line skill can fail it.

**2. Section by section: is this needed to _decide_, or to _look up_?**
Everything you consult *while* doing the work — catalogues, output templates,
per-stack examples, reference tables — is lookup. → **extract to a resource**.
What remains is the decision procedure. → **leave it**, whatever its length.

| Symptom | Outcome |
|---|---|
| Trigger enumerates situations with different outputs | **New skill** |
| One trigger, but the file carries a catalogue or an output template | **Extract to a resource** |
| One trigger, and what is left is how to decide | **Leave it** — a pipeline skill can exceed 150 lines and be right |

Question 2 applies even when the trigger does **not** split: a single-trigger
skill carrying a big output template is still paying for that template on every
activation.

**Do not use "percentage of the file that is code" as a rule.** Measured across
all 28 skills of this base it gave 2 false positives out of 5 flags — it fires on
small skills where code *is* the content, and on templates. A hint when you are
already looking; not a gate.

## When to update vs create a new skill

| Situation | Action |
|-----------|--------|
| Pattern evolved within the same domain | Update the existing skill |
| New technology or library | New skill (or a new resource file if the principles are shared) |
| SKILL.md grew past ~150 lines | Apply the three-outcome test above — extraction is one answer of three |
| Skill covers 2 different domains | Split by prefix |
| Pattern deprecated | Add a deprecation note + reference to the replacement |

## Skill lifecycle — provenance and pruning

Applying this skill's own test: both topics are **lookup** for a subset of skills,
not part of deciding how to write one. See [lifecycle.md](lifecycle.md) —
provenance frontmatter for AI-generated or imported skills, and how to prune by
measurement instead of by feel.

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Description is a copy of the title | No trigger condition | Lead with "Use when …" |
| Everything in SKILL.md | No progressive disclosure | Split stack examples into resources |
| Skill without examples | Theoretical documentation | Add an executable snippet |
| Base skill with project names | Base/project confusion | Generalize or move to the project |
| Not registered in session-continuity resources | Skill hard to discover | Update the table before finishing |

## This skill's own verdict

**Q1 — does the trigger split?** No: every situation in the `description`
produces one output, a skill. **Q2 — what is lookup?** The blank skill template
(`skill-template.md`) and the provenance/pruning policy (`lifecycle.md`) — both
already extracted. **Verdict: leave it.** What remains is the decision procedure,
and the ~150-line budget is the wrong instrument for one; it stays as the alarm
that made this check happen.

## Resources

- [skill-template.md](skill-template.md) — starting template for new skills.
- [lifecycle.md](lifecycle.md) — provenance for generated/imported skills, and
  pruning by measurement.
