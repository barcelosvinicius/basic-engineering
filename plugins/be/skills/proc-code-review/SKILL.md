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

## What to review — by layer

### Backend

**Correctness:**
- [ ] Does the implemented logic match the requirement (RF-XX)?
- [ ] Are edge cases handled (null, empty, zero value, overflow)?
- [ ] Are database transactions correct (readOnly on reads, rollback on failures)?
- [ ] Is N+1 avoided (batch queries, no select loops)?

**Security:**
- [ ] Is the new endpoint mapped in SecurityConfig (public or protected)?
- [ ] Is authorization checked on the server, not only on the client?
- [ ] Is input validated before use (Bean Validation, sanitization)?
- [ ] Is the JPA entity not returned directly (use DTO)?
- [ ] Are secrets out of the code?

**Quality:**
- [ ] Constructor injection used (not field `@Autowired`)?
- [ ] Are custom exceptions thrown (not generic exceptions)?
- [ ] Do unit tests cover the new behavior?
- [ ] Was a versioned migration created if the schema changed? (see `be-db-migrations`)

### Frontend

**Correctness:**
- [ ] Does the component consume the API correctly (typing, error handling)?
- [ ] Is a loading state present for async operations?
- [ ] Is the empty state handled for lists?

**UX (see the `fe-ux-patterns` skill):**
- [ ] Visual feedback after actions (toast, button disable)?
- [ ] Confirmation before destructive actions?
- [ ] Clear visual hierarchy (is the most important thing highlighted)?

**Accessibility (see the `fe-accessibility-patterns` skill):**
- [ ] Interactive elements with semantic tags?
- [ ] Inputs with associated labels?
- [ ] Visible focus on all interactive elements?

**Performance:**
- [ ] Chart instances destroyed in OnDestroy?
- [ ] Subscriptions canceled in OnDestroy?
- [ ] Debounce on search fields?

### General

- [ ] No `console.log` / `println` of sensitive data?
- [ ] Comments explain *why*, not *what*; no stale or commented-out code? (see `proc-code-documentation`)
- [ ] Naming consistent with the rest of the system?
- [ ] Does the PR reference an issue with `Closes #N`?
- [ ] Were docs updated if there was an architectural decision?

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
