---
name: proc-code-review
description: >
  Use when reviewing a PR, requesting review from another agent, or
  implementing a quality gate before merge. Structured review protocol —
  per-layer checklists, responsibility by change type, feedback categories,
  and delegation between agents.
---

# Skill: Code Review Protocol

## What this skill is

Defines the structured protocol for code review between agents and humans.
Use when reviewing a PR, requesting review from another agent, or implementing
a quality gate before merge.

> **Principle:** Code review is not style auditing. It is the moment to catch
> what the author cannot see because they are too close to the code.

---

## Responsibility by change type

| Change type | Primary reviewer | Additional reviewer |
|------------|------------------|---------------------|
| New endpoint or DTO | `backend-developer` | `security-reviewer` |
| Change in authentication/authorization | `security-reviewer` | `qa-engineer` |
| New UI component | `frontend-developer` | QA (if there is E2E) |
| Change in business calculation | `backend-developer` | `domain-expert` |
| Complex JPQL/SQL query | `backend-developer` | `data-analyst` |
| Database migration | `backend-developer` | PM (confirm window) |
| Upload or file processing | `security-reviewer` | `backend-developer` |
| Full feature (backend + frontend) | `project-manager` coordinates | All of the above |

---

## Activation edges

| Type | Target | When |
|---|---|---|
| `consult` | `proc-analysis-blocks` | when the change is too large to review in one pass — this checklist is that rule with the axes already fixed |

## What to review — by layer

Every item is answerable from **the diff alone** — "not added", "not introduced";
never a state of the tree ("none in the project"). A tree-state item turns false
for every later commit once one occurrence lands anywhere, so everyone ticks it
in good faith. Tree state belongs in the debt record, with a count and a date.

The checklists themselves — **Backend**, **Frontend**, **General** — are
look-up, one layer per change: [checklists.md](checklists.md).

---

## How to give review feedback

### Tone and structure

```
❌ "This is wrong."

✅ "This method may generate N+1 when `transactions` has many records.
   Consider using @Query with JOIN FETCH or a batch fetch.
   Ref: engineering-principles.md §4.3"
```

**Comment categories:**
- `[BLOCKING]` — cannot merge without resolving
- `[SUGGESTION]` — improvement, not mandatory for this PR
- `[QUESTION]` — understand the intent before judging
- `[PRAISE]` — acknowledge good practices found

### What is NOT review responsibility

- Code style covered by linter (leave it to automation)
- Personal preferences without technical justification
- Nitpicks in code that will be refactored next sprint

---

## Delegation protocol between agents

When an agent identifies something outside its area during review:

```
backend-developer reviews PR → finds Angular component with XSS potential
→ Trigger security-reviewer: "Line 42 of transaction-list.component.html
  uses innerHTML without sanitization. See OWASP A03."

security-reviewer reviews PR → finds incorrect commitment calculation
→ Trigger domain-expert: "Formula in DashboardService.calcComprometimento()
  divides expenses by gross_income. Confirm whether it should be net_income."
```

---

## Review rounds — a budget, and a fresh reviewer

A review that is re-run until nothing is found does not converge: each fix
invites the next opinion, and the loop drifts into problems outside the
change's context. Two rules keep it finite and honest:

1. **Budget.** Each review gate gets **one review and at most two re-reviews**.
   Ask for a re-review only when a fix changed a decision or a risk — never for
   a mechanical edit already verified. A re-review checks the open findings and
   what the fixes introduced; it does not reopen points already accepted. When
   the budget runs out, record the remaining risk and **the owner decides**:
   accept it, narrow the scope, or authorise one more round.
2. **Fresh reviewer.** The reviewer of round N+1 does not read round N's
   findings — an anchored reviewer confirms the old list and misses what the
   fixes broke. Give it the current diff only. A separate step then compares the
   rounds: gone, persisting, new.

*Evidence class: reported.* The budget is from a published orchestrator workflow
(akitaonrails, `my-skills/deepwork`); the fresh reviewer from his book's reader
rounds, where an apology added beside a contradiction was flagged by 5 of 5
reviewers in the next round.

---

## Automatic gates before merge

```yaml
# What must be green before any merge:
- Build: no compilation errors
- Tests: all passing (coverage ≥ project target)
- Linter: no errors (warnings tolerated)
- Static analysis: no critical issues
- Security scan: no unmitigated critical/high CVEs
- 1 human approval: mandatory (agents do not approve merge)
```

---

*Reference: `engineering-principles.md` §10.2 (Branch Protection), §11.3 (Checklist)*
