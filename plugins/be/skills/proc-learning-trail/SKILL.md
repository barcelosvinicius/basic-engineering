---
name: proc-learning-trail
description: >
  Use when adopting a new practice, technology, or pattern in the project, or
  when onboarding needs a guided path. Creates and maintains the Learning
  Trail — the record of adopted practices, why each exists, and learning
  resources for the team.
---

# Skill: Learning Trail

## What this skill is

Defines how to create and maintain the `docs/processo/LEARNING-TRAIL.md` document — the living
record of the technical practices adopted in the project, with decision context and learning
resources for the team.

> **Principle:** A well-documented project teaches its own team. The learning trail
> turns technical decisions into transferable knowledge — not only
> for the project, but for each team member's career.

---

## Why create a learning trail

The trail serves two purposes at the same time:

1. **Onboarding:** New members understand *why* the project uses X, not just *that* it uses X
2. **Team evolution:** The team tracks the adoption curve of each practice and knows where to go deeper

---

## When to update the trail

| Event | Action |
|-------|--------|
| New technology added to the stack | Add an entry to the trail with decision context |
| New code pattern decided | Document it in the trail with a link to the corresponding skill |
| ADR approved | Extract the resulting practice and add it to the trail |
| Postmortem completed | Add the prevention practice to the trail |
| New skill created | Link it in the corresponding trail section |

---

## Structure of each entry

Each practice in the trail must have:

```markdown
### [Practice Name]

**What it is:** 1-2 sentences describing the practice.

**Why we adopted it:** Decision context — problem it solves, alternatives considered.

**Where it is in the code:**
- Main file/package: `[path]`
- Reference skill: `[skill-name.md]`

**How to learn it:**
- Official documentation: [link]
- Internal guide: [skill or project doc]
- Example in the project: [file with a good usage example]

**Recommended level for new entry:** 🟢 Basic / 🟡 Intermediate / 🔴 Advanced
```

---

## Step by step: create the trail from scratch

### Step 1: Inventory existing practices

List all technologies and patterns in use:

```bash
# Technologies — see the AI context file (Architecture section)
# Patterns — list the project's skills (one skill = one practice)
```

### Step 2: Group by layer

Organize the practices into the template sections:
- **Process** — how the team works (SCRUM, ADRs, sessions)
- **Backend** — stack, code patterns, security
- **Frontend** — stack, components, state
- **Quality** — tests, CI/CD, coverage
- **Infrastructure** — deploy, observability, containers

### Step 3: Fill in the template

Use `templates/docs/learning-trail.template.md` from the base as a starting point.
Adapt it to the project following the entry structure described above.

### Step 4: Link skill → trail

When creating a new skill, add it to the trail:

```markdown
### [Skill Name]
**Reference skill:** `[skill-name.md]`
```

And in the created skill, add to the footer:
```markdown
*Learning trail: `docs/processo/LEARNING-TRAIL.md` → section [Section Name]*
```

---

## Continuous maintenance

The trail is updated by any agent at the end of a session that:
- Adopts a new practice or pattern
- Creates a new skill
- Approves an ADR with code impact
- Resolves an incident with a lesson learned

**Minimum frequency:** One review per sprint (check whether new practices were adopted
and not documented).

---

## Checklist when adding a new practice to the trail

- [ ] Entry created with all required fields (what it is, why, where, how to learn)
- [ ] Corresponding skill created/updated with a link back to the trail
- [ ] Difficulty level defined (🟢 / 🟡 / 🔴)
- [ ] Example of use in the project referenced
- [ ] `proc-session-continuity` updated if a new skill was created

---

*Trail template: `templates/docs/learning-trail.template.md` in the base.*
