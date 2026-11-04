---
description: Recommend which model tier (haiku / sonnet / opus) fits a task by complexity — spend capability where it pays, save cost where it doesn't
---

Recommend the cheapest model **tier** that will do $ARGUMENTS (the task)
reliably. Goal: don't pay opus prices for haiku work, don't risk opus-grade
reasoning on a cheaper tier. Reason about tiers (haiku / sonnet / opus), not
specific version numbers, so the advice doesn't age.

Routing heuristic:

| Tier | Use for |
| --- | --- |
| **haiku** | Mechanical, well-specified, low-ambiguity: formatting, simple edits, extraction/classification, boilerplate, quick lookups, log triage. |
| **sonnet** | The default working tier: feature implementation, code review, tests, refactors, build fixes, most agent work. |
| **opus** | Deep or high-stakes reasoning: architecture, ambiguous design, tricky debugging, security analysis, multi-constraint trade-offs, anything hard to reverse. |

Steps:

1. Classify the task on **ambiguity × stakes × reasoning depth**. When in doubt
   between two tiers, pick the cheaper one for a first pass and escalate only if
   it struggles.
2. State the recommended tier and one-line why; note if part of the task
   (e.g. the plan) wants opus while execution can drop to sonnet/haiku.
3. Remember the base already routes per agent: each `be` agent declares a
   `model` (opus for `mgmt-architect`/`mgmt-domain-expert`/`qa-security-reviewer`,
   sonnet otherwise). Delegating to the right agent routes the model for you.

## Handing work down a tier — the default is don't

Choosing a tier for a task is cheap. **Handing part of a task to a cheaper model
is not**, and the cost is easy to miss:

- **Cold start** — the subagent re-reads what the orchestrator already had.
- **Round trip** — writing the brief, waiting, reading and checking the result:
  3–5 orchestrator turns per dispatch in the measurement below.
- **Cache** — switching the *main* model mid-session drops the prompt cache.

So the default is **no delegation to a cheaper tier**. It pays only for a
**batch of independent items** (the same change across many similar files, a
read-only sweep whose findings a command can check), with **one agent per
batch, not per item**, and a brief proven on a pilot first. **Never** for
coupled implementation, and **never** for writing tests: the cheaper executor's
tests can pass while proving nothing.

*Evidence class: reported, not measured here.* akitaonrails' planner + executor
runs (April 2026): free-choice delegation happened **0 times in 7 of 7
configurations**; forced Opus → Haiku on a coupled app scored 90 against 97
solo, with 34 green tests mocking an API the model invented; the switch overhead
erased most of the savings. Single runs, one task shape — his own caveat. On a
subscription the gain is quota, not money.

Advisory only — the user picks the model. Pair with `/be:context-budget` to keep
the per-call context (and cost) lean.
