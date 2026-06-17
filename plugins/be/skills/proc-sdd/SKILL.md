---
name: proc-sdd
description: >
  Use when a project spans more than two weeks, runs multiple features in
  parallel, or the AI starts contradicting earlier decisions (context drift).
  Spec-Driven Development: executable specs as source of truth — spec → plan
  → tasks hierarchy, EARS syntax, atomic task rules, and the context-as-graph
  model for token-efficient sessions.
---

# Skill: Spec-Driven Development (SDD)

SDD replaces ad-hoc prompting with a structured hierarchy of executable
artifacts — specs, plans, and tasks — that give the AI precise, minimal, and
verifiable context for every unit of work.

The core difference from vibe coding: **vibe coding generates code from
intent; SDD generates code from an executable spec**. This becomes critical
when the project grows beyond a single sprint, because context drift and
implicit decisions are the main causes of AI-generated bugs in long-running
systems.

Reference: `engineering-principles.md` §A and §Appendix C.

## When to use SDD

| Scenario | Recommendation |
|----------|---------------|
| Project spans more than 2 weeks | **Use SDD** from the start |
| Multiple features in parallel | **Use SDD** — prevents cross-feature context bleed |
| AI contradicts earlier decisions | **Adopt SDD immediately** — signals context drift |
| One-off script or prototype | Skip SDD — overhead exceeds benefit |
| Rapid exploration / learning phase | Skip SDD — decisions are still fluid |
| Team without discipline to maintain specs | Skip SDD — stale specs are worse than none |

> **The maturity test:** if you find yourself re-explaining architecture
> decisions made in a previous session, SDD is overdue.

## The `.specify/` structure

```
.specify/
  specs/    ← one spec per feature — WHAT the system does
  plans/    ← execution plan derived from the spec — IN WHAT ORDER
  tasks/    ← atomic task breakdown — EACH UNIT OF WORK
```

Each artifact is generated from the previous one, but can be edited by hand
if the AI decomposes incorrectly.

## Writing specs — EARS syntax

Use EARS (Easy Approach to Requirements Syntax) for requirements:

```
WHEN [trigger condition]
THE SYSTEM SHALL [action]
AND [additional constraint or output]
```

The format has zero ambiguity: trigger, condition, action, payload. An AI can
generate testable code directly from it; a human can verify it against
production behavior without interpretation. Every spec must also declare
**Non-goals** (explicit boundaries prevent scope creep and hallucination),
**Constraints**, and binary **Acceptance criteria**.

> Full spec/plan templates and worked good-vs-bad examples:
> [ears-reference.md](ears-reference.md).

## Writing tasks — the atomic unit

Tasks are the direct input to AI implementation sessions. A task is
well-formed when it satisfies all three properties:

1. **Single session** — implementable without refreshing context mid-task.
2. **Binary verification** — passes or fails a concrete test, no ambiguity.
3. **Explicit dependencies** — lists predecessor tasks by ID, or "none".

Each task isolates one technical decision and declares what is **out of
scope**. When the AI makes an error, the error is small and localized.

> Worked decomposition example (entity → endpoints → auth):
> [ears-reference.md](ears-reference.md).

## Context as graph — depth and breadth

- **Depth-first (default):** ai-context file → task spec → task file.
  Minimal token cost; use for any session with a defined task.
- **Breadth-first:** ai-context file → `docs/INDEX.md` →
  `docs/structural-analysis.md`. Use when starting a new feature, planning,
  or diagnosing cross-cutting issues.

The authority hierarchy doubles as a loading sequence — each layer narrower
than the previous:

```
engineering-principles → ai-context file → agent → skill → spec → task
```

**Without SDD**, the same hierarchy is simply the authority model ending at the
docs layer (`engineering-principles → ai-context → agent → skill → docs`): no
`.specify/` is required, and the "graph" is just that load order plus the
"most specific layer wins" rule — nothing more. Add `.specify/` only when the
"When to use SDD" table above says so.

**Golden rule:** default to the deepest (narrowest) layer that contains the
needed context. Move up only when the current layer is insufficient.

## Compliance verification

SDD changes what is reviewed, it does not eliminate review:

1. **Tests derived from the spec** — each `WHEN/SHALL` requirement maps to
   one or more test cases (AI + CI).
2. **Human review focused on spec alignment** — "does this code implement
   this spec?" is narrower and more objective than "is this code good?".

## Integration with session continuity

With `.specify/` in use, the depth-first flow replaces the full
HISTORY.md load for implementation sessions; at session end, mark the task
✅, update `docs/HISTORY.md`, and commit task file + code + docs together.
See the `proc-session-continuity` skill for the full protocol.

## Common mistakes

| Mistake | Solution |
|---------|----------|
| Task scope too large | Decompose until each task fits one session |
| Spec without non-goals | Always add a Non-goals section |
| Outdated spec after code changes | Add spec update to the Definition of Done |
| Using SDD for one-off scripts | Apply the "When to use SDD" table |
| Skipping the plan layer | The plan makes ordering explicit and reviewable |
