---
name: proc-session-continuity
description: >
  Use at the start and end of every work session (human or AI-assisted).
  At start: read docs/HISTORY.md, docs/structural-analysis.md, and git status
  before touching code. At end: update those docs and commit them with the code.
  Mandatory continuity protocol that prevents rework and context drift.
---

# Skill: Session Continuity

The mandatory continuity protocol between work sessions: follow it to avoid
rework, preserve context, and keep documentation synchronized with the code.

Reference: `engineering-principles.md` §A.3 (Session Briefs), §A.5 (Expected
AI Behavior), and §Appendix C (Context as Graph — Depth and Breadth).

## Activation edges

This skill runs at the start **and** end of every session — the base's main
dispatch point — so its hand-offs are declared, not left to memory. Edges are
**typed**: `consult` = read that skill's rules; `invoke` = may run its flow.
Only `invoke` edges can recurse, so only those are checked for cycles — in
prose, a mention and a hand-off look identical.

| Type | Target | When |
|---|---|---|
| `consult` | `proc-context-budget` | session start, before reading a living doc over ~2,000 lines |
| `invoke` | `qa-verification-loop` | session end, before claiming the declared goal was met |
| `invoke` | `proc-structural-analysis` | session end, when the session changed structure |
| `invoke` | `proc-learning-trail` | session end, when a lesson is worth keeping |
| `invoke` | `proc-adr` | session end, when a hard-to-reverse decision was made |
| `invoke` | `proc-skill-creator` | session end, when a lesson is project-independent (promotion) |
| `consult` | `engineering-principles` | any time the ground rules are needed |

> **Every edge is a reminder, never a block** — the rule the `Stop` hook follows.
> An edge you cannot honour now becomes a pending item, not a stop condition.

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

0. **Measure before reading:** `wc -lc docs/HISTORY.md`. Over ~800 lines it is
   due for compaction (rule in the history template — archive, never summarise);
   over ~2,000 read sections rather than the file and `consult`
   `proc-context-budget`. Prescribing a read without knowing its size is how a
   session start blows the context window.
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
   `invoke` `proc-learning-trail` when the lesson is a practice being adopted,
   and `proc-adr` when the session made a hard-to-reverse decision.
4. **Promotion check — one question per lesson:** *"does this depend on this
   project?"* If **no** — it is about method, not about this stack — the lesson
   belongs to the base. Queue it for the base's feedback intake, and `invoke`
   `proc-skill-creator` if it deserves a skill. A tool that never collects what
   it taught ages at the speed of whoever maintains it, not of whoever uses it.
5. **Delta sweep** — for each fact this session changed, ask *"where else is
   this written?"*, and check the record against `git log`. See *The close
   checks* below.
6. `invoke` `qa-verification-loop` before declaring the goal met.
7. **Close every repository this session touched**, not just the one you are
   standing in. Answer it by command, not memory — for each path in
   `companions` (see `.be-paths.json`): `git -C <path> log --since=<start>
   --oneline`. Any repo with commits gets steps 1–6 too. The protocol otherwise
   closes the current directory while the sibling starves silently.
8. Commit with Conventional Commits — docs in the **same commit** as the code.

### With SDD

1. Mark the task ✅ with date in `.specify/tasks/[task].md` (or record blocker).
2. Update `docs/HISTORY.md` — Current State, next task ID, Delivery History.
3. Record lessons learned if applicable — the promotion check, the delta sweep,
   the verification pass and the companion close (steps 4–7 above) apply here
   unchanged.
4. Commit task file + code + HISTORY.md together.

## Session goal validation

Before ending, answer explicitly: was the declared goal achieved? ✅ / ❌
If ❌: what prevented it, and what must be made explicit for the next session?
Reflect the answer in `docs/HISTORY.md` and `docs/structural-analysis.md`.

## Running work in parallel

Read in a fan-out; write in series — the three living docs absorb most of a
repo's writes and *every* close touches all three, so parallel closes collide on
exactly those (measurement in [resources.md](resources.md)).

1. Agents opened in parallel are **read-only** and return findings in a fixed
   shape (file · line · fact · evidence), never edits.
2. **One writer** integrates the findings into the artefacts.
3. If parallel writing is genuinely needed, each agent's **write scope is
   declared and must be disjoint** — and disjointness is checked by command,
   not assumed.

Sweep commands state the axis they parallelise on; an independent sweep is
exactly where serialising buys nothing.

## The close checks; it does not compose

A long session gets compacted, and context that was never written down is not
recoverable. So the fact is recorded **when it changes**, and the close
**confirms** — it does not reconstruct the session from memory at the hour when
memory is worst.

Two questions at close, both restricted to what this session touched:

1. **"Where else is this fact written?"** — for every fact the session changed.
   The update **replaces** the earlier record; where history matters, replace it
   under a dated correction banner. Additive updates leave two answers to one
   question, and whoever reads later picks the wrong one.
2. **"Does the record match the commits?"** — `git log <base>..HEAD` against what
   the living docs now claim. A behaviour change with no changelog entry, or an
   item still listed as open after its criterion was met, surfaces here.

Restricted to the delta on purpose: a whole-repo sweep is expensive and becomes
an empty ritual, while the delta sweep is cheap and catches exactly the class of
error this session was able to create.

## Golden rule

> **Every session that changes functional code MUST update
> `structural-analysis.md` and/or `HISTORY.md` in the same commit.**
> Documentation must never be more than 1 commit behind the code.

## Two memories — keep the boundary clean

`be` and the AI harness each persist state; do not blur them:

- **`be` living docs (`docs/`)** = the *project's* state and decisions — what
  was built, what's pending, what was decided and why. Versioned with the code,
  shared by the whole team. This is the source of truth a session loads.
- **The harness's own memory** (e.g. Claude Code's `CLAUDE.md` + memory files)
  = *how to work here* — the user's preferences, recurring feedback, tool and
  workflow conventions. Personal/assistant-scoped, not project history.

Rule of thumb: a fact another developer needs → `docs/`; a preference about how
the AI should work → harness memory. Session start reads **both**; never record
a project decision only in harness memory — it would vanish for the team.

## Size verdict

**Q1 — does the trigger split?** No: start and end are two halves of one
protocol producing one thing, a session that hands off cleanly. **Q2 — what is
lookup?** The tables of agents, skills and documents, and the measurements
behind the rules — all in `resources.md`. **Verdict: leave it.**

Moving the SDD variants out was tried and reverted: they are a *branch of the
procedure*, not a catalogue, and the move saved six lines at the cost of an
extra file and two jumps. The test says extract lookup, not extract volume —
this is the most-executed skill in the base, so keep it tight, but not by
pushing procedure out of reach.

## See also

- [resources.md](resources.md) — reference tables of available agents, skills,
  and key documents (load on demand).
