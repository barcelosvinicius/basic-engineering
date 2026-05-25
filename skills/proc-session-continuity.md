---
name: proc-session-continuity
description: >
  Mandatory continuity protocol between human or AI-assisted work sessions —
  read HISTORY.md at the start and update docs at the end. Every agent
  must follow this flow to avoid rework and keep documentation synchronized.
---

# Skill: Session Continuity

## What this skill is

Defines the mandatory continuity protocol between work sessions (human or
AI-assisted). Every agent starting a development session must follow
this flow to avoid rework, preserve context, and keep documentation
synchronized with the code.

This skill is **universal** — copied from `.github/base/skills/` to all projects
without modification. It references documents using the project's standard relative paths.

Reference: `engineering-principles.md` §A.3 (Session Briefs) and §A.5 (Expected
AI Behavior).

---

## Mandatory flow — Session start

```
1. Read docs/HISTORY.md
   ├── Current State → what is in progress
   ├── Blockers → active impediments
   └── Next Steps → session priorities

2. Read docs/structural-analysis.md
   ├── Technical Pending Items → what NOT to do again
   └── Applied Fixes → what has ALREADY been resolved

3. Check git status
   └── Uncommitted modified files → continue or discard

4. Consult docs/lessons-learned.md (if relevant)
   └── Past errors → patterns to avoid
```

> **Estimated cost:** ~400 lines of critical context (vs ~8,000+ lines reading everything).
> Savings of ~60% in tokens per session without losing operational context.

---

## Session goal (mandatory)

Before starting any implementation, the session **must explicitly declare**
a verifiable goal.

> **"At the end of this session, I will know I am done when:"**

- [verifiable criterion 1]
- [verifiable criterion 2] (if necessary)

### Valid examples
- "The `POST /api/v1/[resource]` endpoint returns 200 and passes the integration tests."
- "Bug #N is reproduced by a test and the test passes after the fix."
- "Migration `V3__...sql` applies without errors in the test environment."

### Rules
- The goal must be **verifiable**, not abstract.
- Terms like "improve", "adjust", or "refactor" are **not valid**
  without a measurable criterion.
- The goal **does not replace any step in the flow** — it only guides execution.

---

## Mandatory flow — Session end

```
1. Update docs/structural-analysis.md
   ├── Mark resolved pending items as ✅ with date
   ├── Add new fixes to the Applied Fixes table
   └── Record newly discovered pending items

2. Update docs/HISTORY.md
   ├── "Current State" section → reflect the new state
   ├── "Delivery History" section → new entry with format:
   │   ### [YYYY-MM-DD] Short title
   │   **Owner:** Name or agent
   │   **Deliveries:** What was completed
   │   **Decisions:** Technical or product decisions
   │   **Next steps:** What the next session should do
   │   **Blockers:** Impediments (or "None")
   └── "Next Steps" section → update priorities

3. Record in docs/lessons-learned.md (if applicable)
   ├── Format: ### [Month/Year] Lesson title
   │   **Context:** [situation]
   │   **Problem:** [what went wrong / was discovered]
   │   **Rule:** [what to do differently — include code if relevant]
   │   **Reference:** §X.X of engineering-principles.md
   └── Only for discoveries that prevent future rework

4. Commit with Conventional Commits
   └── Include updated docs in the same commit as the code
```

---

## Session goal validation

Before ending the session, answer explicitly:

- Was the goal defined at the start of the session achieved? ✅ / ❌

If ❌:
- What prevented it?
- What should be made explicit for the next session?

This validation **must be reflected** in:
- `docs/HISTORY.md` (Current State / Next Steps)
- `docs/structural-analysis.md` (if there are new pending items)

---

## Available resources in this repository

### Agents (`.github/agents/`)

<!-- KEEP UPDATED: list the agents configured in the project -->
| Prefix | Agent | When to use |
|--------|-------|-------------|
| `dev-` | dev-backend-developer | Backend implementation |
| `dev-` | dev-frontend-developer | Frontend implementation |
| `dev-` | dev-data-analyst | BI, insights, analytics |
| `qa-` | qa-engineer | Tests and coverage |
| `qa-` | qa-security-reviewer | Defensive OWASP review |
| `qa-` | qa-pentest-engineer | Offensive security, IDOR |
| `mgmt-` | mgmt-product-owner | Requirements, backlog |
| `mgmt-` | mgmt-domain-expert | Domain business rules |
| `mgmt-` | mgmt-project-manager | Coordination, API contracts |
| `mgmt-` | mgmt-architect | ADRs, technical debt, technical governance |
| `infra-` | infra-devops-engineer | CI/CD, Docker, GitHub Actions |
| `ops-` | ops-sre | Observability, SLOs, runbooks, incidents |

### Skills (`.github/skills/`)

<!-- KEEP UPDATED: add project-specific skills below the universal ones -->

#### Universal (copied from `base/skills/` — do not customize)
| Skill | When to consult |
|-------|-----------------|
| `proc-session-continuity` | **This file** — mandatory at the start of every session |
| `proc-code-review` | When reviewing a PR — who reviews what and how to give feedback |
| `proc-release-checklist` | Before any production deploy |
| `proc-adr` | When making a significant architectural decision |
| `proc-changelog` | When preparing a release or generating release notes |
| `proc-skill-creator` | When creating a new skill — process, structure, and criteria |
| `proc-learning-trail` | When documenting new practices adopted by the team |
| `be-pagination-patterns` | When implementing list endpoints |
| `be-api-versioning` | When creating or versioning REST endpoints |
| `be-api-error-handling` | GlobalExceptionHandler, HTTP status, ProblemDetail |
| `be-jwt-auth-patterns` | JWT authentication, token blocklist |
| `be-flyway-migrations` | Database migrations with Flyway |
| `qa-test-data-builders` | Builder pattern, TestFixtures, AAA pattern |
| `fe-ux-patterns` | Visual hierarchy, colors, states, forms |
| `fe-accessibility-patterns` | ARIA, keyboard, WCAG contrast |
| `infra-ci-cd` | CI/CD pipeline, dependency audit |

#### Project-specific (create when customizing)
| Skill | When to consult |
|-------|-----------------|
| [prefix-name] | [when to use — add when creating it] |

### Key documents

| Document | Purpose |
|----------|---------|
| `docs/HISTORY.md` | Operational state + handoff between sessions |
| `docs/structural-analysis.md` | Technical X-ray (pending items + fixes) |
| `docs/lessons-learned.md` | Errors and lasting rules |
| `.github/base/engineering-principles.md` | Project-independent general principles |
| `docs/architecture.md` | Map of layers, entities, flows |
| `docs/diretrizes-tecnicas.md` | Code conventions + pre-commit checklist |

---

## Golden rule

> **Every session that changes functional code MUST update `structural-analysis.md`
> and/or `HISTORY.md` in the same commit.** Documentation must never be more than 1 commit
> behind the code.

---

*Universal — `.github/base/skills/proc-session-continuity.md`*
*Copy to `.github/skills/` of each project without modification.*
*Reference: `engineering-principles.md` §A.3, §A.4, §A.5*
