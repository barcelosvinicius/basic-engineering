---
name: proc-session-continuity
description: >
  Use at the start and end of every work session (human or AI-assisted).
  At start: read docs/HISTORY.md, docs/structural-analysis.md, and git status
  before touching code. At end: update those docs and commit them with the code.
  Mandatory continuity protocol that prevents rework and context drift.
---

# Skill: Session Continuity

Defines the mandatory continuity protocol between work sessions. Every agent
starting a development session must follow this flow to avoid rework, preserve
context, and keep documentation synchronized with the code.

Reference: `engineering-principles.md` §A.3 (Session Briefs), §A.5 (Expected
AI Behavior), and §Appendix C (Context as Graph — Depth and Breadth).

## Context loading strategy

Loading context is a graph traversal problem. Choose the strategy based on
what the session needs to accomplish:

- **Depth-first (default — implementation sessions):** AI context file →
  `.specify/tasks/[current-task].md` → `.specify/specs/[feature].md`.
  Token cost ~200–500 lines. Use for any session with a defined task.
  If the project does not use SDD, replace the task file with the
  HISTORY.md + structural-analysis.md load below.
- **Breadth-first (planning and cross-cutting sessions):** AI context file →
  `docs/INDEX.md` → `docs/structural-analysis.md` → `docs/HISTORY.md`.
  Token cost ~400–800 lines. Use when starting a new feature, writing a spec,
  or diagnosing a cross-cutting bug.

## Mandatory flow — Session start

### Without SDD (`.specify/` not in use)

1. Read `docs/HISTORY.md` — Current State (in progress), Blockers, Next Steps.
2. Read `docs/structural-analysis.md` — Technical Pending Items (what NOT to
   redo), Applied Fixes (what is ALREADY resolved).
3. Check `git status` — uncommitted modified files: continue or discard.
4. Consult `docs/lessons-learned.md` if relevant — past errors, patterns to avoid.

### With SDD (`.specify/` in use — depth-first)

1. Read `.specify/tasks/[current-task].md` — scope, verification, dependencies.
2. Read `.specify/specs/[feature].md` if needed — EARS-syntax constraints.
3. Check `git status`.
4. Read `docs/HISTORY.md` only if task context is insufficient.

> Estimated cost: ~400 lines of critical context without SDD (vs ~8,000+
> reading everything); ~200–500 lines with SDD depth-first.

## Session goal (mandatory)

Before starting any implementation, declare a **verifiable** goal:

> "At the end of this session, I will know I am done when: [criterion]"

- Valid: "the `POST /api/v1/[resource]` endpoint returns 200 and passes the
  integration tests"; "bug #N is reproduced by a test and the test passes
  after the fix".
- Not valid: "improve", "adjust", "refactor" without a measurable criterion.
- The goal does not replace any step in the flow — it only guides execution.

## Mandatory flow — Session end

### Without SDD

1. Update `docs/structural-analysis.md` — mark resolved items ✅ with date,
   add new fixes to Applied Fixes, record newly discovered pending items.
2. Update `docs/HISTORY.md` — refresh "Current State"; add a "Delivery
   History" entry (`### [YYYY-MM-DD] Title` with Owner, Deliveries, Decisions,
   Next steps, Blockers); update "Next Steps".
3. Record in `docs/lessons-learned.md` if applicable — only discoveries that
   prevent future rework (Context / Problem / Rule / Reference format).
4. Commit with Conventional Commits — docs in the **same commit** as the code.

### With SDD

1. Mark the task ✅ with date in `.specify/tasks/[task].md` (or record blocker).
2. Update `docs/HISTORY.md` — Current State, next task ID, Delivery History.
3. Record lessons learned if applicable.
4. Commit task file + code + HISTORY.md together.

## Session goal validation

Before ending, answer explicitly: was the declared goal achieved? ✅ / ❌
If ❌: what prevented it, and what must be made explicit for the next session?
Reflect the answer in `docs/HISTORY.md` and `docs/structural-analysis.md`.

## Golden rule

> **Every session that changes functional code MUST update
> `structural-analysis.md` and/or `HISTORY.md` in the same commit.**
> Documentation must never be more than 1 commit behind the code.

## See also

- [resources.md](resources.md) — reference tables of available agents, skills,
  and key documents (load on demand).
