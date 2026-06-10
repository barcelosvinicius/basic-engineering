# SDD reference — EARS examples, spec/plan templates, task decomposition

Supporting material for the `proc-sdd` skill. Load on demand.

## EARS — good vs bad

**Bad (narrative):**

> "The system should warn when fallbacks are high."

**Good (EARS):**

```
WHEN a worker emits a fallback metric above 30% for more than 5 minutes
THE SYSTEM SHALL generate a WARNING severity alert on channel #scrapers
AND include in the alert payload: source, affected field, and current rate
```

## Spec file template

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

## Plan file template

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

## Task decomposition — worked example

**Bad task:**

```
Task 1: Implement monitoring API.
```

Problems: open scope, no verification criterion, unclear dependencies. The AI
must load context about the database, REST endpoints, authentication, and
observability all at once.

**Good decomposition:**

```markdown
# Task 1.1 — Define WorkerStatus entity

**Spec:** `.specify/specs/monitoring.md`
**Dependency:** None
**Scope:** Define entity `WorkerStatus` with fields: id, source,
  last_seen (timestamp), status (enum: OK | DEGRADED | DOWN).
**Verification:** Entity persists in the database; migration applied
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
