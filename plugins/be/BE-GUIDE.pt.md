<!-- GERADO por scripts/gen-capabilities.js — não edite à mão. Rode: npm run gen:guide -->

# `be` — o que esta base faz por você

Seu projeto tem a base **basic-engineering (`be`)** instalada. Ela transforma a ajuda da IA em parceria de engenharia: 11 comandos, 15 agentes especializados, 28 skills sob demanda e guardrails ao vivo. Este arquivo é gerado — use como seu mapa.

## Comece por aqui

- **Toda sessão:** `/be:session-start` para carregar o contexto, `/be:session-end` antes de commitar.
- **Antes de dizer "pronto":** `/be:check` roda o quality gate local (build, lint, testes, segurança) com veredito PRONTO / NÃO PRONTO.
- **Projeto novo:** `/be:bootstrap` cria `CLAUDE.md` + `docs/`.
- **Ver este guia quando quiser:** `/be:help`. Versão em inglês: `BE-GUIDE.md`.

## Playbooks — o que usar, e quando

Cenários concretos → o comando / agente / skill que encaixa.

| Situação | Faça isto |
| --- | --- |
| **Começando uma sessão / um novo dia** | `/be:session-start` — carrega HISTÓRICO + análise estrutural + git status e exige declarar uma meta verificável. |
| **Construindo uma feature de backend** | Delegue ao agente `dev-backend` — ele aplica as skills `be-*` de API/DB/auth e delega segurança ao `qa-security-reviewer`, testes ao `qa-engineer`. |
| **Construindo UI** | Delegue ao `dev-frontend` (aplica `fe-ux-patterns` + `fe-accessibility-patterns`). |
| **Uma decisão técnica relevante** | `/be:adr` para registrar; consulte o `mgmt-architect` em decisões transversais. |
| **Antes de dizer "pronto" / antes do PR** | `/be:check` (build, lint, testes, segurança → veredito) + `/be:impact` para o raio de impacto; `qa-pr-test-analyzer` para julgar adequação de testes. |
| **Indo para produção** | `/be:release-check` — checklist pré-go-live + rascunho do changelog. |
| **Repo vai ficar público / open-source** | O agente `qa-release-sanitizer` audita a árvore E o histórico do git por segredos/PII/refs internas primeiro. |
| **Caçando bug oculto/intermitente** | `qa-silent-failure-hunter` para erros engolidos; escreva o teste que falha primeiro (`qa-engineer`). |
| **Sessão lenta / contexto pesado** | `/be:context-budget` para achar excesso de tokens; `/be:model-route` para escolher o tier de modelo. |
| **Encerrando a sessão** | `/be:session-end` — atualiza os docs vivos e os commita junto com o código. |

## Guardrails ao vivo (sempre ativos, fail-open)

O plugin roda algumas checagens de alta confiança **enquanto o código é gerado** — bloqueia só o crítico, o resto é aviso:

- **Segredos hardcoded** em um comando ou escrita de arquivo são bloqueados.
- **Afrouxar um config de linter/formatter existente** é bloqueado (conserte o código, não o config).
- **`git --no-verify`** (burlar hooks) é bloqueado.
- **Lembrete de fim de sessão** quando muda código funcional sem atualizar docs.
- **Fact-forcing gate** (opt-in: `BE_GATEGUARD=on`) — bloqueia a 1ª edição de cada arquivo até você declarar importadores / API afetada / formato dos dados / a instrução do usuário.

Desligue por sessão com `BE_HOOKS=off`, ou uma checagem só com ex. `BE_HOOK_SECRET_SCAN=off` / `BE_HOOK_CONFIG_PROTECTION=off` / `BE_HOOK_NO_VERIFY=off`.

## Comandos

| Nome | O que faz |
| --- | --- |
| `/be:adr` | Create a new Architecture Decision Record — /be:adr <short decision title> |
| `/be:bootstrap` | Bootstrap the engineering base in the current project — docs structure, CLAUDE.md, and session protocol |
| `/be:check` | Run the local quality gate before declaring work done — build, lint, tests, security scan, and a READY / NOT READY verdict |
| `/be:context-budget` | Audit what consumes the context window — agents, skills, MCP tools, rules, CLAUDE.md — and report prioritized token savings |
| `/be:help` | Show the be capabilities guide — every command, agent, and skill the base offers, plus the live guardrails |
| `/be:impact` | Analyze the blast radius of the current changes — risk level + targeted review checklist |
| `/be:model-route` | Recommend which model tier (haiku / sonnet / opus) fits a task by complexity — spend capability where it pays, save cost where it doesn't |
| `/be:release-check` | Run the pre-go-live checklist and draft the changelog entry for the release |
| `/be:session-end` | Close a work session — update HISTORY.md, structural-analysis, lessons-learned, and commit docs with the code |
| `/be:session-start` | Start a work session — load HISTORY.md, structural-analysis, git status, and declare a verifiable goal |
| `/be:structural-analysis` | Generate or refresh docs/structural-analysis.md — layers, dependencies, domain map, risks, pending items |

## Agentes

Delegue trabalho especializado a estes subagentes (eles leem as convenções do seu projeto em tempo de execução):

| Nome | O que faz |
| --- | --- |
| `dev-backend` _(model: sonnet)_ | Use for backend implementation tasks — REST endpoints, business rules, persistence, database migrations, and server-side security. Delegates security… |
| `dev-data-analyst` _(model: sonnet)_ | Use for BI, analytics, and automatic-insight tasks — designing analytical queries, defining metrics and KPIs, and implementing anomaly/trend detectio… |
| `dev-frontend` _(model: sonnet)_ | Use for frontend implementation tasks — UI components, client-side state, HTTP integration, forms, client auth, and visualizations. Applies the fe-ux… |
| `infra-devops` _(model: sonnet)_ | Use for infrastructure and delivery tasks — CI/CD pipelines, Dockerfiles and compose files, environment variable management, reproducible builds, hea… |
| `mgmt-architect` _(model: opus)_ | Use for cross-cutting architectural decisions — creating/reviewing ADRs, technical-debt triage, design review before implementation, dependency and l… |
| `mgmt-domain-expert` _(model: opus)_ | Use for business-domain questions — defining business rules, formulas, metrics, alert thresholds, and validating that implementations match the domai… |
| `mgmt-product-owner` _(model: sonnet)_ | Use for requirements and backlog work — writing/refining user stories with testable acceptance criteria, prioritizing by impact × effort, and keeping… |
| `mgmt-project-manager` _(model: sonnet)_ | Use for coordination work — sequencing multi-agent features, maintaining API contracts before development, removing blockers, and running the sprint… |
| `ops-sre` _(model: sonnet)_ | Use for reliability and operations work — defining SLOs, configuring monitoring and alerts, writing runbooks, incident response coordination, and pos… |
| `qa-engineer` _(model: sonnet)_ | Use for test design and implementation — unit, integration, and E2E tests, coverage analysis, and bug reproduction. Rule: a bug becomes a failing tes… |
| `qa-pentest-engineer` _(model: sonnet)_ | Use for offensive runtime security validation of the project's own application in authorized test environments — IDOR, JWT attacks, brute force, mali… |
| `qa-pr-test-analyzer` _(model: sonnet)_ | Use before merging a PR or finishing a change to judge whether the tests are adequate for what changed — new/changed logic covered, edge cases and er… |
| `qa-release-sanitizer` _(model: sonnet)_ | Use before making a repository public, open-sourcing a fork, or cutting a release — independently audits the working tree AND git history for leaked… |
| `qa-security-reviewer` _(model: opus)_ | Use for defensive security review — OWASP Top 10 analysis of PRs, authentication/authorization changes, and sensitive-data handling. Read-only: repor… |
| `qa-silent-failure-hunter` _(model: sonnet)_ | Use to review a change (or a file/module) specifically for silent failures — swallowed exceptions, empty catch blocks, errors converted to null/empty… |

## Skills

Carregadas sob demanda quando o gatilho casa — você raramente as invoca direto.

### Backend

| Nome | O que faz |
| --- | --- |
| `be-api-error-handling` | Use when creating a centralized exception handler, adding new error types, or defining a REST API's error response contract. Exception hierarchy, HTT… |
| `be-api-versioning` | Use when creating the initial structure of a REST API, introducing a breaking change, or migrating unversioned endpoints to a versioned model. URL-pr… |
| `be-db-migrations` | Use when creating tables, adding columns, creating indexes, changing constraints, or migrating data with any versioned migration tool (Flyway, Liquib… |
| `be-jwt-auth-patterns` | Use when implementing token-based authentication (JWT), deciding how to revoke tokens on logout, or choosing where to store tokens on the client. Sta… |
| `be-pagination-patterns` | Use when implementing or fixing any REST endpoint that returns a collection. Never return an unbounded list — server-side pagination with offset or c… |

### engineering

| Nome | O que faz |
| --- | --- |
| `engineering-principles` | Use when making a design decision and needing the project-independent ground rules — UX, security, coupling, testing, observability, resilience, and… |

### Frontend

| Nome | O que faz |
| --- | --- |
| `fe-accessibility-patterns` | Use when implementing any interactive component, form, modal, or table. Concrete WCAG 2.1 AA accessibility patterns — semantic HTML, ARIA attributes,… |
| `fe-ux-patterns` | Use when creating or reviewing any UI component, screen, or form. Operational UX guide — visual hierarchy, colors, loading states, forms, perceived p… |

### Infrastructure

| Nome | O que faz |
| --- | --- |
| `infra-ci-cd` | Use when configuring or evolving a project's CI/CD pipeline — stage ordering, dependency audit (SCA), static analysis (SAST), automated dependency up… |

### Operations

| Nome | O que faz |
| --- | --- |
| `ops-observability` | Use when adding logging, metrics, or tracing; defining SLOs and alerts; writing runbooks; or preparing a service for production operation. Structured… |

### Process (universal)

| Nome | O que faz |
| --- | --- |
| `proc-adr` | Use when making any significant technical decision that affects structure, security, performance, or is difficult to reverse. Process for recording A… |
| `proc-changelog` | Use when preparing a release, creating release notes, generating user-facing updates, or closing a sprint with deliverables. Maintains CHANGELOG.md f… |
| `proc-code-documentation` | Use when writing or reviewing comments, docstrings, and inline documentation in code. When to comment vs. when to rename, the "why not what" rule, do… |
| `proc-code-review` | Use when reviewing a PR, requesting review from another agent, or implementing a quality gate before merge. Structured review protocol — per-layer ch… |
| `proc-context-budget` | Use when the session feels sluggish, output quality drops, after adding several skills/agents/MCP servers, or to decide whether there is room to add… |
| `proc-dependency-management` | Use when adding a new dependency, upgrading existing ones, or auditing the dependency tree. Selection criteria, lockfile discipline, update cadence,… |
| `proc-domain-mapping` | Use at project kickoff, before introducing a new bounded context, or when domain boundaries seem to have drifted. DDD-based pipeline: identifies boun… |
| `proc-impact-analysis` | Use before opening a PR, after a large refactoring, or whenever a change touches a shared boundary. Determines which modules, flows, domain events, a… |
| `proc-learning-trail` | Use when adopting a new practice, technology, or pattern in the project, or when onboarding needs a guided path. Creates and maintains the Learning T… |
| `proc-release-checklist` | Use before any production delivery — first deploy, release with schema or security changes, or any release after more than two weeks of inactivity. P… |
| `proc-sdd` | Use when a project spans more than two weeks, runs multiple features in parallel, or the AI starts contradicting earlier decisions (context drift). S… |
| `proc-session-continuity` | Use at the start and end of every work session (human or AI-assisted). At start: read docs/HISTORY.md, docs/structural-analysis.md, and git status be… |
| `proc-skill-creator` | Use when a needed domain/process/infrastructure skill is missing, when an existing skill needs significant refactoring, or when expanding the base ki… |
| `proc-structural-analysis` | Use at project kickoff, after a major refactoring, or whenever the architecture diverges from its documentation. Guided pipeline: scans the project,… |

### Quality

| Nome | O que faz |
| --- | --- |
| `qa-test-data-builders` | Use when writing unit or integration tests that need test data. Centralize object creation in fixture builders, follow the AAA pattern (Arrange, Act,… |
| `qa-verification-loop` | Use when finishing a change, before declaring work "done", or before opening a PR — a stack-agnostic verification loop (build, type-check, lint, test… |

### Security

| Nome | O que faz |
| --- | --- |
| `sec-agent-security` | Use when building or operating an AI agent / LLM feature, when wiring tools or MCP servers, or when an agent will read untrusted content (web, issues… |
| `sec-secrets-management` | Use when handling any credential — API keys, database passwords, signing secrets, certificates — or when configuring environments and CI. Storage, in… |

---

*Gerado a partir do frontmatter do plugin. Para regenerar: `npm run gen:guide`.*
