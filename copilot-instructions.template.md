# Copilot Instructions — [Project Name]

<!-- CUSTOMIZE: This file is read by GitHub Copilot in EVERY session of any
agent. It is the highest-impact point in the system — if it becomes outdated, all agents
lose context. Keep it precise and concise (max ~150 lines).
Delete this instruction block when the file is filled in. -->

---

## About the project

<!-- CUSTOMIZE: 2-3 sentences: what it does, for whom, usage context -->
[Project description in 2-3 sentences.]

## Architecture

| Layer | Technology | Port |
|--------|-----------|-------|
| Frontend | [e.g.: Angular 19 + TypeScript] | [e.g.: 4200] |
| Backend | [e.g.: Java 17 + Spring Boot 3.2] | [e.g.: 8080] |
| Database | [e.g.: PostgreSQL 14+] | [e.g.: 5432] |

<!-- CUSTOMIZE: add or remove layers according to the project's stack -->

## Repository structure

```
[repository root]/
  [backend-folder]/      — [description]
  [frontend-folder]/     — [description]
  docs/
    fundamentos/         — engineering-principles.md, TECNOLOGIAS.md
    especificacao/       — REQUISITOS.md, MELHORIAS.md
    (docs root)          — architecture.md, diretrizes-tecnicas.md,
                           structural-analysis.md, lessons-learned.md
    processo/            — SCRUM.md, PLANO_TESTES.md
    guias/               — COMO_USAR.md, COMO_USAR_AGENTS.md
    (root)               — INDEX.md, HISTORY.md, GLOSSARIO.md
  .github/
    agents/              — dev-*, qa-*, mgmt-* agents
    skills/              — be-*, fe-*, da-*, qa-*, proc-* skills
    base/                — universal principles and templates
```

## Code conventions — Backend

<!-- CUSTOMIZE: adapt to the project's language and framework -->
- **[Entities/Models]**: [convention]
- **[Services/Controllers]**: [dependency injection convention]
- **[Transfer objects (DTOs)]**: [rule: never expose the entity directly]
- **[Transactions/Operations]**: [convention]
- **[Tests]**: [framework] + [mocking tool]; mirror package in [path]

## Code conventions — Frontend

<!-- CUSTOMIZE -->
- [Framework]: [component convention]
- [Client authentication]: [how token is stored, interceptor, guard]
- [HTTP communication]: [how to type, how to handle errors]
- [Forms]: [reactive vs template-driven]
- [Tests]: [framework]

## Security

<!-- CUSTOMIZE -->
- **Passwords**: [hash algorithm] — [parameters]
- **Authentication**: [pattern — e.g.: JWT HS256 with expiration]
- **Logout**: [how tokens are revoked]
- **Upload**: [file type validation]
- **Data isolation**: [how to ensure user X does not see user Y's data]
- **CORS**: [allowed origins]

## Main business rules

<!-- CUSTOMIZE: 3-5 critical domain rules every agent must know -->
1. **[Rule 1]**: [definition + when it applies]
2. **[Rule 2]**: [definition + when it applies]
3. **[Rule 3]**: [definition + when it applies]
<!-- add more as needed -->

## SCRUM process

- [N]-week sprints; milestones = sprints
- Labels: `type:`, `priority:`, `status:`, `points:`
- Story Points: Fibonacci (1, 2, 3, 5, 8, 13)
- Definition of Done: code + code review + tests ≥ [N]% coverage + docs
- Functional requirements: RF-01 to RF-[N] in `docs/especificacao/REQUISITOS.md`

## What NOT to do

<!-- CUSTOMIZE: anti-patterns forbidden in this project -->
- [Anti-pattern 1] — [reason]
- [Anti-pattern 2] — [reason]
- [Anti-pattern 3] — [reason]
- Never commit secrets (passwords, keys, tokens) into the code
- Never create business logic in the [wrong layer]

## Session continuity

**Mandatory action:** Read and follow `.github/skills/proc-session-continuity.md` in EVERY session — beginning AND end.
The end-of-session flow (updating `docs/HISTORY.md`, `docs/structural-analysis.md`, and `docs/lessons-learned.md`)
is mandatory to maintain traceability and reduce token consumption in the next session.

> **Consult `docs/HISTORY.md` at the start of every session** — it contains the current state, blockers, and next steps.
