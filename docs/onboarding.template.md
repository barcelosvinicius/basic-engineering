# Onboarding Guide — [PROJECT]

> **For new team members** — humans or AI agents.

## Welcome

<!-- CUSTOMIZE -->
Welcome to [PROJECT]! This guide will help you understand the system,
set up the environment, and contribute with quality from day one.

---

## In 5 minutes: what this project is

<!-- CUSTOMIZE — answer these 3 questions -->
**What it does:** [main functionality in 1-2 sentences]
**Who it is for:** [end users]
**Why it exists:** [problem it solves]

---

## Map of where to find everything

| I want to know... | Where it is |
|-------------------|-------------|
| What the project is | `.github/copilot-instructions.md` |
| Engineering principles | `.github/base/engineering-principles.md` |
| What is happening now | `docs/HISTORY.md` |
| What is pending | `docs/arquitetura/structural-analysis.md` |
| The requirements | `docs/especificacao/REQUISITOS.md` |
| The technical architecture | `docs/arquitetura/architecture.md` |
| How to do X in the backend | `.github/skills/be-*.md` |
| How to do X in the frontend | `.github/skills/fe-*.md` |
| Architectural decisions | `docs/adr/` |
| Lessons learned | `docs/arquitetura/lessons-learned.md` |

---

## Environment setup

<!-- CUSTOMIZE -->

### Prerequisites

```bash
# Check versions
[list verification commands]
```

### Steps

```bash
# 1. Clone
git clone [url]
cd [project]

# 2. Environment variables
cp .env.example .env
# Edit .env with dev values

# 3. Start the stack
[command]

# 4. Verify health
[health check command]
```

---

## First flow to understand the system

<!-- CUSTOMIZE — list a manual flow that gives an overview of the system -->
```
1. [step 1]
2. [step 2]
3. [step 3]
```

---

## Architectural tour — ordered by dependency

> **Read the code in this order** — each module only makes sense after the one
> before it, because it depends on it.

<!-- CUSTOMIZE — list modules ordered from least to most dependent.
     Inspired by the Understand-Anything dependency-ordered tour approach:
     start with shared primitives, end with orchestrators. -->

| Order | Module / Package | Layer | What to read first |
|-------|-----------------|-------|--------------------|
| 1 | `[shared / common / domain model]` | domain | Entities and value objects — the vocabulary of the system |
| 2 | `[repositories / data access]` | data | How data is persisted and retrieved |
| 3 | `[domain services]` | service | Business rules that span multiple entities |
| 4 | `[application services / use cases]` | service | Orchestration of domain objects — the "what happens when" |
| 5 | `[API layer / controllers]` | api | How the outside world triggers use cases |
| 6 | `[UI / frontend components]` | ui | How the user sees and triggers the flows |
| 7 | `[infrastructure / adapters]` | infra | External integrations (queues, email, storage, etc.) |

> Re-run `skills/proc-structural-analysis.md` to regenerate this order
> whenever the module structure changes significantly.

### Key entry point files

<!-- CUSTOMIZE — list 3–5 files a new developer should read on day 1 -->
| File | Why it matters |
|------|----------------|
| `[main entry point]` | Application bootstrap — shows all wired components |
| `[core entity]` | Central aggregate — everything else orbits around it |
| `[primary use case]` | Most-executed flow — good proxy for the whole system |

---

## Development flow

```
1. Choose an issue from the backlog
2. Create a branch: git checkout -b feature/ISSUE-NNN-description
3. Implement (following the relevant skills)
4. Write tests (coverage ≥ target)
5. git commit -m "feat(scope): description"
6. Open a PR using the template
7. Wait for CI and review
```

---

## Summary conventions

<!-- CUSTOMIZE with the project's main conventions -->

| Aspect | Convention |
|--------|------------|
| Commits | Conventional Commits |
| Branches | `feature/`, `fix/`, `chore/` |
| Tests | AAA pattern, coverage ≥ [N]% |
| [other] | [convention] |

---

## Frequently asked questions

<!-- CUSTOMIZE with the most common questions for new contributors -->

**"Where is the business logic?"**
→ [answer]

**"Why [technical decision]?"**
→ See the ADR in `docs/adr/`

---

*Template — `.github/base/docs/onboarding.template.md` · Customize for each project*
