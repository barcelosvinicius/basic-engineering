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

Advisory only — the user picks the model. Pair with `/be:context-budget` to keep
the per-call context (and cost) lean.
