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
| `qa-` | qa-pr-test-analyzer | Whether a PR's tests are adequate for what changed |
| `qa-` | qa-silent-failure-hunter | Swallowed exceptions, errors turned into null, logs without context |
| `qa-` | qa-release-sanitizer | Secrets, PII and internal refs before going public or releasing |
| `qa-` | qa-comment-analyzer | Comments that mislead: noise, rot, a comment standing in for a rename |
| `qa-` | qa-type-design-analyzer | Invalid states the types still allow (typed codebases only) |
| `mgmt-` | mgmt-product-owner | Requirements, backlog |
| `mgmt-` | mgmt-domain-expert | Domain business rules |
| `mgmt-` | mgmt-project-manager | Coordination, API contracts |
| `mgmt-` | mgmt-architect | ADRs, technical debt, technical governance |
| `mgmt-` | mgmt-spec-miner | Recovering EARS requirements from code that already exists |
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
| `proc-safe-removal` | Before deleting code/config/docs, or moving content between files |
| `proc-structural-analysis` | When auditing technical debt and pending items |
| `proc-dependency-management` | When adding, upgrading, or auditing dependencies |
| `proc-code-documentation` | When writing or reviewing comments and docstrings |
| `proc-context-budget` | When the session drags or after adding skills/agents/MCP servers |
| `engineering-principles` | Digest of the universal engineering principles |
| `be-pagination-patterns` | When implementing list endpoints |
| `be-api-versioning` | When creating or versioning REST endpoints |
| `be-api-error-handling` | Error contract, HTTP status, problem details |
| `be-jwt-auth-patterns` | Token-based authentication, revocation |
| `be-db-migrations` | Versioned database migrations |
| `qa-verification-loop` | Before declaring work done — build, lint, tests, security, READY verdict |
| `qa-test-data-builders` | Builder pattern, test fixtures, AAA pattern |
| `proc-analysis-blocks` | Splitting an analysis into blocks that each close with a verdict and its evidence |
| `qa-test-strategy` | Which tests a change needs; mutation as the ruler of test quality; load criteria against the SLO |
| `fe-ux-patterns` | Visual hierarchy, colors, states, forms |
| `fe-accessibility-patterns` | ARIA, keyboard, WCAG contrast |
| `infra-ci-cd` | CI/CD pipeline, dependency audit |
| `sec-secrets-management` | Handling secrets, keys, and credentials |
| `sec-agent-security` | Building or operating an AI agent / MCP tool that reads untrusted content |
| `ops-observability` | Logs, metrics, traces, SLOs, runbooks |

### Project-specific (create when customizing)

| Skill | When to consult |
|-------|-----------------|
| [prefix-name] | [when to use — add when creating it] |

## Why the close is a check, and why writing is serial

Measured over 200 commits in a real pair of repositories:

| File | Writes in 200 commits |
|---|--:|
| `HISTORY.md` | 68 |
| `structural-analysis.md` | 65 |
| `lessons-learned.md` | 46 |

**179 of 200**, concentrated in the three files that *every* session close
touches. N agents closing a session in parallel produce N concurrent writes to
those same three — and a hand-resolved conflict is itself a source of drift.

On the same corpus, 47 versioned documents referenced each other 10 times, while
a single identifier reached up to 16 files. A fact reaches ~8 files on average
and almost nothing declares the relationship, which is why *"where else is this
written?"* has to be asked per changed fact rather than left to recall — under
pressure, recall fails before lookup does.

## Why writing is serial, and why the close is a sweep

Measured over 200 commits in a real pair of repositories:

| File | Writes in 200 commits |
|---|--:|
| `HISTORY.md` | 68 |
| `structural-analysis.md` | 65 |
| `lessons-learned.md` | 46 |

**179 of 200**, concentrated in the three files that *every* session close
touches. N agents closing a session in parallel produce N concurrent writes to
those same three, and a hand-resolved conflict is itself a source of drift.

On the same corpus, 47 versioned documents referenced each other **10** times
while a single identifier reached up to **16** files. A fact reaches ~8 files on
average and almost nothing declares the relationship — which is why *"where else
is this written?"* is asked per changed fact instead of left to recall. Under
pressure, recall fails before lookup does.

## When a project is a pair of repositories

Measured in a real pair, at the same moment:

| Artefact (sibling repo) | Last touched | Rule in the close |
|---|---|---|
| `analise-estrutural.md` | same day | step 1, unconditional |
| `HISTORICO.md` | 12 days behind | step 2, unconditional |
| `lessons-learned.md` | **65 commits behind** | step 3, *"if applicable"* |

The delay orders itself by how strongly the step is worded, and the only current
artefact was current because an audit happened to touch it. The same
`lessons-learned` in the repo where sessions actually ran was up to date with 169
entries against 26. **The rule works; it just does not reach the repo next door.**

Two distinct problems, often confused: a fact that belongs clearly to the sibling
and never gets there (this one — solved by `companions` and step 7), and a fact
that belongs to **neither** repo because it is an invariant of the pair — retry
budgets, timeouts, page ceilings. The second needs a mirrored section declared as
deliberate duplication, with the rule *"change here, change there"*, and is not
solved by closing both repos.

## Key documents

| Document | Purpose |
|----------|---------|
| `docs/HISTORY.md` | Operational state + handoff between sessions |
| `docs/structural-analysis.md` | Technical X-ray (pending items + fixes) |
| `docs/lessons-learned.md` | Errors and lasting rules |
| `engineering-principles.md` (base) | Project-independent general principles |
| `docs/architecture.md` | Map of layers, entities, flows |
| `docs/diretrizes-tecnicas.md` | Code conventions + pre-commit checklist |
