# Session continuity — resource reference

Reference tables for the `proc-session-continuity` skill. Load on demand.

## Agents

| Prefix | Agent | When to use |
|--------|-------|-------------|
| `dev-` | dev-backend | Backend implementation |
| `dev-` | dev-frontend | Frontend implementation |
| `dev-` | dev-data-analyst | BI, insights, analytics |
| `qa-` | qa-engineer | Tests and coverage |
| `qa-` | qa-security-reviewer | Defensive OWASP review |
| `qa-` | qa-pentest-engineer | Offensive security, IDOR |
| `mgmt-` | mgmt-product-owner | Requirements, backlog |
| `mgmt-` | mgmt-domain-expert | Domain business rules |
| `mgmt-` | mgmt-project-manager | Coordination, API contracts |
| `mgmt-` | mgmt-architect | ADRs, technical debt, technical governance |
| `infra-` | infra-devops | CI/CD, Docker, GitHub Actions |
| `ops-` | ops-sre | Observability, SLOs, runbooks, incidents |

## Skills

### Universal (shipped with the base — do not customize)

| Skill | When to consult |
|-------|-----------------|
| `proc-session-continuity` | **This skill** — mandatory at the start of every session |
| `proc-sdd` | Spec-Driven Development — spec → plan → tasks, EARS syntax |
| `proc-code-review` | When reviewing a PR — who reviews what, how to give feedback |
| `proc-release-checklist` | Before any production deploy |
| `proc-adr` | When making a significant architectural decision |
| `proc-changelog` | When preparing a release or generating release notes |
| `proc-skill-creator` | When creating a new skill |
| `proc-learning-trail` | When documenting new practices adopted by the team |
| `proc-domain-mapping` | When discovering the domain model and glossary |
| `proc-impact-analysis` | Before a change with cross-module blast radius |
| `proc-structural-analysis` | When auditing technical debt and pending items |
| `proc-dependency-management` | When adding, upgrading, or auditing dependencies |
| `proc-code-documentation` | When writing or reviewing comments and docstrings |
| `engineering-principles` | Digest of the universal engineering principles |
| `be-pagination-patterns` | When implementing list endpoints |
| `be-api-versioning` | When creating or versioning REST endpoints |
| `be-api-error-handling` | Error contract, HTTP status, problem details |
| `be-jwt-auth-patterns` | Token-based authentication, revocation |
| `be-db-migrations` | Versioned database migrations |
| `qa-test-data-builders` | Builder pattern, test fixtures, AAA pattern |
| `fe-ux-patterns` | Visual hierarchy, colors, states, forms |
| `fe-accessibility-patterns` | ARIA, keyboard, WCAG contrast |
| `infra-ci-cd` | CI/CD pipeline, dependency audit |
| `sec-secrets-management` | Handling secrets, keys, and credentials |
| `ops-observability` | Logs, metrics, traces, SLOs, runbooks |

### Project-specific (create when customizing)

| Skill | When to consult |
|-------|-----------------|
| [prefix-name] | [when to use — add when creating it] |

## Key documents

| Document | Purpose |
|----------|---------|
| `docs/HISTORY.md` | Operational state + handoff between sessions |
| `docs/structural-analysis.md` | Technical X-ray (pending items + fixes) |
| `docs/lessons-learned.md` | Errors and lasting rules |
| `engineering-principles.md` (base) | Project-independent general principles |
| `docs/architecture.md` | Map of layers, entities, flows |
| `docs/diretrizes-tecnicas.md` | Code conventions + pre-commit checklist |
