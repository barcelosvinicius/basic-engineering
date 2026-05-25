---
name: proc-sdd
description: >
  Spec-Driven Development (SDD) — methodology for building software with AI
  assistants using executable specs as source of truth. Covers the spec →
  plan → tasks hierarchy, EARS syntax, atomic task rules, compliance
  verification, and the context-as-graph model for token-efficient sessions.
  Use when the project reaches a scale where vibe coding starts generating
  inconsistency, or from the start on any project expected to span more than
  two weeks.
---

# Skill: Spec-Driven Development (SDD)

## What this skill is

Defines how to apply Spec-Driven Development in a project that uses AI
assistants. SDD replaces ad-hoc prompting with a structured hierarchy of
executable artifacts — specs, plans, and tasks — that give the AI precise,
minimal, and verifiable context for every unit of work.

The core difference from vibe coding: **vibe coding generates code from
intent; SDD generates code from an executable spec**. This distinction
becomes critical when the project grows beyond a single sprint, because
context drift and implicit decisions are the main causes of AI-generated
bugs in long-running systems.

Reference: `engineering-principles.md` §A (AI-Assisted Documentation Protocol)
and §Appendix C (Context as Graph — Depth and Breadth).

---

## When to use SDD

| Scenario | Recommendation |
|----------|---------------|
| Project spans more than 2 weeks | **Use SDD** from the start |
| Multiple features in parallel | **Use SDD** — prevents cross-feature context bleed |
| AI contradicts earlier decisions | **Adopt SDD immediately** — signals context drift |
| One-off script or prototype | Skip SDD — overhead exceeds benefit |
| Rapid exploration / learning phase | Skip SDD — decisions are still fluid |
| Team without discipline to maintain specs | Skip SDD — stale specs are worse than none |

> **The maturity test:** If you find yourself re-explaining architecture
> decisions that were made in a previous session, SDD is overdue.

---

## The `.specify/` structure

```
.specify/
  specs/    ← one spec per feature — WHAT the system does
  plans/    ← execution plan derived from the spec — IN WHAT ORDER
  tasks/    ← atomic task breakdown — EACH UNIT OF WORK
```

Each artifact is generated from the previous one, but can be edited by hand
if the AI decomposes incorrectly. The hierarchy is intentional:

- **Spec** → describes WHAT (requirements, constraints, non-goals)
- **Plan** → describes IN WHAT ORDER (sequencing, dependencies, milestones)
- **Task** → describes EACH UNIT OF WORK (scope, verification, dependencies)

---

## Writing specs — EARS syntax

Use EARS (Easy Approach to Requirements Syntax) for requirements inside
specs. It eliminates ambiguity by forcing a structured declaration:

```
WHEN [trigger condition]
THE SYSTEM SHALL [action]
AND [additional constraint or output]
```

### Example — bad (narrative)

> "The system should warn when fallbacks are high."

### Example — good (EARS)

```
WHEN a worker emits a fallback metric above 30% for more than 5 minutes
THE SYSTEM SHALL generate a WARNING severity alert on channel #scrapers
AND include in the alert payload: source, affected field, and current rate
```

The EARS format has zero ambiguity: trigger, condition, action, payload.
An AI can generate testable code directly from it. A human can verify
it against production behavior without interpretation.

### Spec file structure

```markdown
# Spec: [Feature Name]

## What this feature does
[1-2 sentences: domain purpose, not technical implementation]

## Non-goals
<!-- Explicit boundaries prevent scope creep and AI hallucination -->
- [what this spec does NOT cover]

## Constraints
<!-- Non-negotiable rules within this scope -->
- [hard constraint 1]
- [hard constraint 2]

## Requirements (EARS)

WHEN [trigger]
THE SYSTEM SHALL [action]
AND [constraint/output]

WHEN [trigger 2]
THE SYSTEM SHALL [action 2]

## Acceptance criteria
<!-- Binary verification — each criterion maps to a test case -->
- [ ] [criterion 1]
- [ ] [criterion 2]
```

---

## Writing plans

A plan translates the spec into a sequenced list of deliverables with
explicit dependencies. It does not contain implementation details — only
ordering logic.

```markdown
# Plan: [Feature Name]

Spec: `.specify/specs/[feature].md`

## Delivery sequence

1. [Task group 1] — no dependencies
2. [Task group 2] — depends on 1
3. [Task group 3] — depends on 1 and 2

## Milestones

| Milestone | Tasks completed | Verifiable state |
|-----------|----------------|-----------------|
| M1        | 1.1, 1.2       | [observable outcome] |
| M2        | 2.1–2.3        | [observable outcome] |
```

---

## Writing tasks — the atomic unit

Tasks are the most important artifact in SDD. They are the direct input to
AI implementation sessions. A task that is poorly scoped will produce
inconsistent or over-reaching code.

### Rules for well-formed tasks

A task is well-formed when it satisfies all three properties:

1. **Single session** — implementable without refreshing context mid-task
2. **Binary verification** — passes or fails a concrete test, no ambiguity
3. **Explicit dependencies** — lists predecessor tasks by ID, or "none"

### Example — bad task

```
Task 1: Implement monitoring API.
```

Problems: open scope, no verification criterion, unclear dependencies.
The AI must load context about Postgres, REST endpoints, authentication,
and observability all at once.

### Example — good task decomposition

```markdown
# Task 1.1 — Define WorkerStatus entity

**Spec:** `.specify/specs/monitoring.md`
**Dependency:** None
**Scope:** Define entity `WorkerStatus` with fields: id, source,
  last_seen (timestamp), status (enum: OK | DEGRADED | DOWN).
**Verification:** Entity persists in Postgres; migration applied
  without errors in test environment.
**Out of scope:** endpoints, authentication, alert logic.
```

```markdown
# Task 1.2 — Implement GET /health (aggregate)

**Spec:** `.specify/specs/monitoring.md`
**Dependency:** Task 1.1
**Scope:** Endpoint returns 200 with payload `{status, workers[]}`.
  Aggregate status: OK if all workers OK; DEGRADED if any DEGRADED;
  DOWN if any DOWN.
**Verification:** Returns 200 with correct aggregate status for each
  combination of worker states.
**Out of scope:** authentication, per-source endpoint, alert logic.
```

```markdown
# Task 1.3 — Implement GET /health/{source}

**Spec:** `.specify/specs/monitoring.md`
**Dependency:** Task 1.1
**Scope:** Endpoint returns details for a single source or 404.
**Verification:** Returns 200 with source details; returns 404 for
  unknown source.
**Out of scope:** authentication, aggregate endpoint.
```

```markdown
# Task 1.4 — Add API key authentication to all /health endpoints

**Spec:** `.specify/specs/monitoring.md`
**Dependency:** Task 1.2, Task 1.3
**Scope:** Validate `X-API-Key` header on all /health routes.
**Verification:** Request without X-API-Key returns 401; valid key
  returns expected response.
**Out of scope:** key rotation, audit logging.
```

> Each task isolates one technical decision. When the AI makes an error,
> the error is small and localized. In vibe coding, errors are large and
> spread across the codebase.

---

## Context as graph — depth and breadth

Loading context is a graph traversal problem. The two strategies are:

### Depth-first (default — task scope)

Load only what is needed for the current task:

```
This file (ai-context) → task spec → task file
```

**Token cost:** minimal — only the current task's context.
**When to use:** any implementation session with a defined task.

### Breadth-first (project map)

Load the broad project map to navigate across features:

```
This file (ai-context) → docs/INDEX.md → docs/structural-analysis.md
```

**Token cost:** higher — structural overview of the full project.
**When to use:** starting a new feature, diagnosing cross-cutting
issues, planning a plan or spec.

### The hierarchy as a loading sequence

Each layer is narrower and more specific than the previous one:

```
engineering-principles.md     ← universal rules (load rarely — load once)
    ↓
ai-context file                ← project context (load at session start)
    ↓
*.agent.md                     ← role context (load when switching roles)
    ↓
*.skill.md                     ← how-to knowledge (load on demand)
    ↓
.specify/specs/[feature].md    ← feature scope (load per feature)
    ↓
.specify/tasks/[task].md       ← task scope (load per session — default)
```

**Golden rule:** default to the deepest (narrowest) layer that contains
the context needed. Only move up the hierarchy when the current layer is
insufficient.

---

## Compliance verification

SDD does not eliminate the need for human review — it changes what is
reviewed.

| Verification layer | What it checks | Who does it |
|--------------------|---------------|-------------|
| Behavioral tests | Does code implement the EARS requirements? | AI + CI |
| Semantic review | Does code align with spec intent? | Human |

In practice, use two layers:

1. **Tests derived from the spec** — each `WHEN/SHALL` requirement maps to
   one or more test cases. These tests verify behavioral compliance.
2. **Human review focused on spec alignment** — instead of "is this code
   well written?", the question is "does this code implement this spec?".
   The narrower question makes review faster and more objective.

> The compliance gap between spec and code remains human work in 2026.
> SDD makes that work smaller and more focused, not zero.

---

## Integration with session continuity

When the project uses `.specify/`:

**Session start — depth-first flow:**
```
1. Read this file (ai-context) — project context
2. Read .specify/tasks/[current-task].md — task scope
3. Read .specify/specs/[feature].md — feature requirements
4. Check git status — uncommitted changes
```

This replaces the full `HISTORY.md + structural-analysis.md` load for
implementation sessions. Load `HISTORY.md` only when the task context
is insufficient to determine what to do next.

**Session end:**
```
1. Update task status in .specify/tasks/[task].md (mark ✅ if done)
2. Update docs/HISTORY.md — record delivery and next task
3. Commit: task file + implementation code + updated HISTORY.md
```

> See `proc-session-continuity.md` for the full end-of-session flow.

---

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Task scope too large | Treating a feature as a single task | Decompose until each task fits one session |
| Spec without non-goals | Assuming the AI knows the boundaries | Always add a Non-goals section |
| Outdated spec after code changes | Not updating spec in the same PR | Add spec update to the Definition of Done |
| Using SDD for one-off scripts | Over-engineering | Apply the "When to use SDD" table |
| Skipping the plan layer | Going directly spec → tasks | Plan makes task ordering explicit and reviewable |

---

*Universal — `.github/base/skills/proc-sdd.md`*
*Copy to `.github/skills/` of each project without modification.*
*Reference: `engineering-principles.md` §A, §Appendix C*
