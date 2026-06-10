# AI Context File — [Project Name]

<!-- CUSTOMIZE: This file is the single source of project context for any AI
assistant. It is the highest-impact point in the system — if it becomes
outdated, all agents lose context. Keep it precise and concise (max ~150 lines).
Delete this instruction block when the file is filled in. -->

<!-- TOOL DEPLOYMENT: Save this file as CLAUDE.md at the project root —
the primary location. If the team also uses other tools, mirror the same
content to their expected paths:
| AI Tool            | Expected filename / location                     |
|--------------------|--------------------------------------------------|
| Claude Code        | `CLAUDE.md` (project root) — PRIMARY            |
| GitHub Copilot     | `.github/copilot-instructions.md`               |
| Cursor             | `.cursorrules` (or `.cursor/rules/`)            |
| Windsurf           | `.windsurfrules` (project root)                 |
Maintain CLAUDE.md as the canonical copy and mirror on change.
Delete this instruction block when the file is deployed. -->

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
    fundamentos/       — engineering-principles.md, TECNOLOGIAS.md
    especificacao/     — REQUISITOS.md, MELHORIAS.md
    (docs root)        — architecture.md, diretrizes-tecnicas.md,
                           structural-analysis.md, lessons-learned.md
    processo/          — SCRUM.md, PLANO_TESTES.md
    guias/             — usage guide, agents guide
    (root)             — INDEX.md, HISTORY.md, GLOSSARIO.md
  .claude/             — project-specific agents/skills (Claude Code)
  .github/
    base/              — universal engineering base (non-Claude tools)
  .specify/            — SDD artifacts (optional — see proc-sdd.md)
    specs/             — one spec per feature (WHAT)
    plans/             — execution plan derived from spec (IN WHAT ORDER)
    tasks/             — atomic task breakdown (EACH UNIT OF WORK)
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

## Architecture gotchas

<!-- CUSTOMIZE: non-obvious things every AI agent must know before touching the code.
     Based on the CLAUDE.md "Gotchas" pattern from Understand-Anything. -->

- **[Gotcha 1]:** [e.g., "Module X uses WASM instead of native bindings — never replace with the native library on ARM64"]
- **[Gotcha 2]:** [e.g., "Dashboard must only import from core's browser-safe subpath exports — importing the main entry point pulls in Node.js modules"]
- **[Gotcha 3]:** [e.g., "The `model` field must be omitted from agent frontmatter — setting it to `inherit` causes ProviderModelNotFoundError on non-Claude platforms"]
- **[Gotcha 4]:** [e.g., "Flyway migrations are ordered lexicographically — always use the V{timestamp}__ prefix format, never sequential numbers"]
<!-- Add one line per genuine footgun. Remove examples above. -->

## Session continuity

**Mandatory action:** Follow the `proc-session-continuity` skill in EVERY session — beginning AND end (on Claude Code: `/be:session-start` and `/be:session-end`).
The end-of-session flow (updating `docs/HISTORY.md`, `docs/structural-analysis.md`, and `docs/lessons-learned.md`)
is mandatory to maintain traceability and reduce token consumption in the next session.

**Context strategy:** Apply depth-first loading by default — load only the current task's
spec (from `.specify/tasks/` if the project uses SDD) plus this file. Use breadth-first
(loading `docs/INDEX.md` + `docs/structural-analysis.md`) only when navigating to a new
feature or diagnosing a cross-cutting issue. See `skills/proc-sdd.md` for the full graph
traversal model.

> **Consult `docs/HISTORY.md` at the start of every session** — it contains the current state, blockers, and next steps.
