# 🚀 BOOTSTRAP — Project Kickoff Guide

> **This is the first file to read in any new project.**
>
> It defines the complete structure of the documentation + agents + skills system and the
> exact creation sequence. Everything in `.github/base/` can be copied
> to any software project. The rest is project-specific.

---

## Prerequisites

Before starting, make sure you have:

- **Git** ≥ 2.x installed
- **curl** or **wget** (for version checking)
- Access to the [base repository](https://github.com/barcelosvinicius/basic-engineering)
- A GitHub account with permission to create repositories

---

## Step 0 — Version check

> **Always run this check before using or updating the base.**

When copying the base to a new project — or after returning to an old project — confirm
that your copy is on the latest version:

```bash
bash check-version.sh
```

| Result | Action |
|--------|--------|
| ✅ `Your base is up to date` | Proceed to Step 1 |
| 🔄 `Update available` | Download the latest `base-atualizacao.zip` and follow the update procedure below |
| ⚠️ No connection / error | Proceed with caution; check the version manually in `BASE_VERSION` |

### How to update

1. Go to the [base repository](https://github.com/barcelosvinicius/basic-engineering) and download `base-atualizacao.zip`
2. Extract it over your project's `.github/base/` folder (it overwrites only universal files)
3. Run `bash check-version.sh` again to confirm
4. Review the base `CHANGELOG` and adapt your agents/skills if necessary

> **Note:** Customized files (`copilot-instructions.md`, `agents/`, `docs/`) are never
> overwritten by the update — they are specific to your project.

---

## What is `.github/base/`

The `base/` folder contains the **universal foundational files** — the ones that work
in any software project, regardless of stack, domain, or size.

| File / Folder | Type | What it does |
|---------------|------|--------------|
| `BOOTSTRAP.md` (this file) | Universal | Explains the structure and creation sequence |
| `engineering-principles.md` | Universal | Engineering principles independent of technology |
| `roles/` | Templates | Reusable skeletons for each agent role (9 templates) |
| `skills/` | Universal | Universal skills that can be copied to any project |

**Golden rule:** If a file contains names, technologies, or decisions from a
specific project → it belongs in `docs/` or `.github/agents/` (project). If it works in any
project → it belongs in `.github/base/`.

---

## The 5 layers of the documentation system

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 0 — PHILOSOPHICAL FOUNDATION       (.github/base/)       │
│  engineering-principles.md                                        │
│  "How to think about software" — universal, immutable per project │
└──────────────────────────┬──────────────────────────────────────┘
                           │ informs
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 1 — PROJECT CONTEXT            (.github/)                │
│  copilot-instructions.md                                         │
│  "What this project is and its rules" — specific                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ consults
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 2 — SPECIALIZED ROLES         (.github/agents/)          │
│  dev-backend.agent.md, qa-engineer.agent.md, ...                │
│  "Who does what" — templates in base/roles/, customized         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ uses
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 3 — TECHNICAL KNOWLEDGE       (.github/skills/)          │
│  be-pagination.md, fe-ux-patterns.md, proc-session-continuity, ... │
│  "How to do it" — domain- and stack-specific                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ updates
┌──────────────────────────▼──────────────────────────────────────┐
│  LAYER 4 — LIVING DOCUMENTATION      (docs/)                    │
│  HISTORY.md, structural-analysis.md, lessons-learned.md, ...   │
│  "What was done and what remains" — changes every session       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authority hierarchy (if there is conflict, the most specific prevails)

```
engineering-principles.md  (most generic — universal rules)
    ↓ specializes
copilot-instructions.md    (project context)
    ↓ specializes
*.agent.md                 (role and responsibilities)
    ↓ specializes
*.skill.md                 (how to do it — most specific)
```

---

## Creation sequence — new project from scratch

### Step 1 — Copy the universal base

```bash
cp -r .github/base/ new-project/.github/base/
cp .github/base/skills/proc-session-continuity.md \
   new-project/.github/skills/proc-session-continuity.md
```

Files copied **without editing**:
- ✅ `BOOTSTRAP.md` — this file
- ✅ `engineering-principles.md` — universal principles (includes Appendix A and B)
- ✅ `skills/proc-session-continuity.md` — universal session protocol

Templates to customize (copy from `base/roles/` to `agents/`):
- ⚙️ `roles/*.template.md` → customize and save as `agents/[prefix]-[name].agent.md`

---

### Step 2 — Create `copilot-instructions.md`

Copy `base/copilot-instructions.template.md` to `.github/copilot-instructions.md`
and fill in all sections marked with `<!-- CUSTOMIZE -->`.

This file is read by GitHub Copilot in **every** session of any agent.
It is the highest-impact point — if it becomes outdated, all agents lose context.

Mandatory sections:
```
# Copilot Instructions — [Project Name]
## About the project       ← 2-3 sentences: what it does, for whom, technologies
## Architecture            ← table: Layer | Technology | Port
## Repository structure    ← main folder tree
## Conventions — Backend   ← language/framework patterns
## Conventions — Frontend  ← UI framework patterns
## Security                ← authentication, authorization, secrets
## Business rules          ← 3-5 critical domain rules
## What NOT to do          ← forbidden anti-patterns
```

---

### Step 3 — Create the agents

For each required role, copy the correct template and customize it:

| Base template | Rename to |
|---|---|
| `roles/dev-backend.template.md` | `agents/dev-backend-developer.agent.md` |
| `roles/dev-frontend.template.md` | `agents/dev-frontend-developer.agent.md` |
| `roles/dev-data-analyst.template.md` | `agents/dev-data-analyst.agent.md` |
| `roles/mgmt-product-owner.template.md` | `agents/mgmt-product-owner.agent.md` |
| `roles/mgmt-project-manager.template.md` | `agents/mgmt-project-manager.agent.md` |
| `roles/mgmt-domain-expert.template.md` | `agents/mgmt-[domain]-advisor.agent.md` |
| `roles/mgmt-architect.template.md` | `agents/mgmt-architect.agent.md` |
| `roles/qa-engineer.template.md` | `agents/qa-engineer.agent.md` |
| `roles/qa-security-reviewer.template.md` | `agents/qa-security-reviewer.agent.md` |
| `roles/qa-pentest-engineer.template.md` | `agents/qa-pentest-engineer.agent.md` |
| `roles/infra-devops.template.md` | `agents/infra-devops-engineer.agent.md` |
| `roles/ops-sre.template.md` | `agents/ops-sre.agent.md` |

Each agent **must** have:
- [ ] YAML frontmatter with `name` and `description`
- [ ] Project-specific technologies section
- [ ] Mandatory code patterns section
- [ ] Session protocol: reference to `proc-session-continuity`
- [ ] `## Automatic delegation` section with a trigger table
- [ ] Delivery checklist (Definition of Done for the role)

> **Note:** Use only the agents relevant to the project. A simple project may
> not need a data analyst or pentest engineer. Instantiating agents without real use
> creates context noise.

---

### Step 4 — Create the skills and SAST rules

Skills are reusable technical knowledge that agents consult on demand.
Use `base/roles/skill.template.md` as the starting point for each new skill.

**Create custom Semgrep rules (`.semgrep/rules/`):**

In addition to skills, every project must have custom SAST rules that reflect
its domain-specific conventions and risks. Organized by language:

```
.semgrep/
  rules/
    [backend-language]/    # e.g.: java/, python/, go/
      no-secret-hardcoded.yml    — secrets in code
      no-sensitive-logging.yml   — sensitive data logging
      no-weak-hash.yml           — weak password hashing
      no-insecure-random.yml     — non-cryptographic PRNG
      no-sql-string-concat.yml   — SQL injection by concatenation
    [frontend-language]/   # e.g.: typescript/
      no-localstorage-auth.yml   — token in localStorage
      no-console-log-sensitive.yml — console logging
      no-innerhtml-xss.yml       — XSS by innerHTML
      no-eval.yml                — eval() / new Function()
```

See the `infra-ci-cd.md` skill for the full rule and workflow template.

**Universal skills (copy from `base/skills/`):**
- `proc-session-continuity.md` — mandatory session protocol (already copied in Step 1)
- `proc-code-review.md` — code review protocol between agents
- `proc-release-checklist.md` — universal pre-go-live checklist
- `proc-adr.md` — Architectural Decision Records process
- `proc-changelog.md` — CHANGELOG generation with Keep a Changelog + SemVer
- `proc-skill-creator.md` — meta-skill for creating new skills
- `proc-learning-trail.md` — learning trail for documenting adopted practices
- `fe-ux-patterns.md` — visual hierarchy, colors, loading states, forms
- `fe-accessibility-patterns.md` — semantic HTML, ARIA, keyboard, WCAG contrast
- `be-pagination-patterns.md` — offset and cursor pagination, Spring Boot + Angular
- `be-api-versioning.md` — `/v1/` strategy, lifecycle, migration without breaking change
- `be-api-error-handling.md` — exception hierarchy, HTTP statuses, ProblemDetail
- `be-jwt-auth-patterns.md` — JWT, token blocklist, sessionStorage
- `be-flyway-migrations.md` — Flyway migrations, naming, idempotency
- `qa-test-data-builders.md` — TestFixtures, builder pattern, AAA pattern
- `infra-ci-cd.md` — CI/CD pipeline with Semgrep SAST, OWASP Dependency Check, Dependabot, Conventional Commits

**Skills to create from scratch (project-specific):**

| Prefix | Layer | Common examples |
|--------|-------|-----------------|
| `be-` | Backend | jwt-auth, csv-import, migrations, error-handling, calculations |
| `fe-` | Frontend | chart-patterns, state-management, form-patterns |
| `da-` | Data | analytics, reporting, insight-detection |
| `qa-` | Quality | test-builders, e2e-patterns, security-checklist |
| `infra-` | Infrastructure | ci-cd, deploy, observability |
| `proc-` | Process | session-continuity, code-review, release-checklist |

Each skill must answer the question: **"How do I do X in this project?"**
It must not contain high-level decisions (that belongs to the agent) — only the concrete "how".

---

### Step 5 — Initialize the living documentation

Create the files in `docs/` using the templates below as a starting point:

```
docs/
├── INDEX.md               ← adapt the template from base/docs/index.template.md
├── HISTORY.md             ← adapt the template from base/docs/history.template.md
├── GLOSSARIO.md           ← start empty, fill in as the project grows
├── CHANGELOG.md           ← adapt base/docs/changelog.template.md
├── structural-analysis.md ← adapt base/docs/structural-analysis.template.md
├── architecture.md        ← map of layers, entities, flows, endpoints
├── diretrizes-tecnicas.md ← code conventions for this project
├── lessons-learned.md     ← adapt base/docs/lessons-learned.template.md
├── fundamentos/
│   └── TECNOLOGIAS.md     ← justify the stack choices
├── especificacao/
│   └── REQUISITOS.md      ← project FRs and NFRs (enumerate RF-01, RF-02...)
├── adr/
│   ├── adr-template.md    ← use the proc-adr.md skill to create each ADR
│   └── ADR-001-[title].md ← the project's first architectural decision
└── processo/
    ├── SCRUM.md (or equivalent)
    ├── LEARNING-TRAIL.md  ← adapt base/docs/learning-trail.template.md
    └── runbooks/          ← adapt base/docs/runbook.template.md for each operation
        └── [operation].md
```

**Update frequency for each document:**

| Document | When to update |
|----------|----------------|
| `HISTORY.md` | At the beginning and end of **every** session (mandatory) |
| `structural-analysis.md` | When pending items change status |
| `lessons-learned.md` | After a session with an error or relevant discovery |
| `architecture.md` | When there are structural changes (new modules, endpoints) |
| `diretrizes-tecnicas.md` | When new conventions are decided |
| `engineering-principles.md` | Rarely — team decision, not per session |

---

### Step 6 — Configure GitHub automation

```
.github/
├── PULL_REQUEST_TEMPLATE.md          ← standard PR checklist
├── ISSUE_TEMPLATE/
│   ├── user-story.yml               ← user story template with agent selector
│   ├── bug-report.yml               ← bug template with severity and selector
│   ├── task.yml                     ← technical task template
│   ├── epic.yml                     ← group of user stories with business objective
│   ├── technical-debt.yml           ← technical debt record with severity
│   └── spike.yml                    ← technical investigation with timebox
└── workflows/
    ├── scrum-issue-tracker.yml      ← updates labels automatically
    ├── scrum-pr-tracker.yml         ← syncs PR status ↔ issue
    ├── scrum-labels-setup.yml       ← creates all SCRUM labels (run once)
    ├── scrum-milestone-sprint.yml   ← manages sprints via milestones
    ├── scrum-sprint-report.yml      ← automatic daily report at 9am
    └── ci-quality-gate.yml          ← quality gate: build, test, coverage, security
```

SCRUM labels created automatically by `scrum-labels-setup.yml`:
- Status: `backlog`, `sprint-backlog`, `in-progress`, `review`, `done`, `blocked`
- Type: `user-story`, `bug`, `task`, `epic`, `spike`, `chore`
- Priority: `critical`, `high`, `medium`, `low`
- Points: `1`, `2`, `3`, `5`, `8`, `13`

---

### Step 7 — First commit

```bash
git add .github/ docs/
git commit -m "chore(setup): initialize documentation structure and agents

- .github/base/: principles, BOOTSTRAP, agent and skill templates
- .github/agents/: N customized agents for [project]
- .github/skills/: proc-session-continuity + M domain skills
- copilot-instructions.md: global project context
- .github/PULL_REQUEST_TEMPLATE.md + ISSUE_TEMPLATE/
- .github/workflows/: SCRUM automation
- docs/: initial structure with INDEX, HISTORY, REQUISITOS"
```

---

## Complete diagram — what to copy vs what to create

```
┌─────────────────────────────────────────────────────────┐
│  UNIVERSAL — copy as-is to any project                  │
├─────────────────────────────────────────────────────────┤
│  .github/base/BOOTSTRAP.md               (this file)    │
│  .github/base/engineering-principles.md  (incl §A & §B) │
│  .github/base/roles/*.template.md        (12 templates) │
│  .github/base/docs/*.template.md         (10 templates) │
│  .github/base/skills/proc-*.md           (5 proc skills)│
│  .github/base/skills/be-*.md             (4 be skills)  │
│  .github/base/skills/fe-*.md             (2 fe skills)  │
│  .github/base/skills/qa-*.md             (1 qa skill)   │
│  .github/base/skills/infra-ci-cd.md      (1 infra skill)│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ADAPT — copy and customize with project data           │
├─────────────────────────────────────────────────────────┤
│  .github/copilot-instructions.md    (from base template)│
│  .github/agents/*.agent.md          (from templates)    │
│  .github/PULL_REQUEST_TEMPLATE.md                       │
│  .github/ISSUE_TEMPLATE/*.yml                           │
│  docs/INDEX.md                                          │
│  docs/HISTORY.md                    (start with setup)  │
│  docs/structural-analysis.md                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CREATE FROM SCRATCH — project-specific                 │
├─────────────────────────────────────────────────────────┤
│  .semgrep/rules/                                        │
│    [lang-backend]/*.yml   (custom SAST rules)           │
│    [lang-frontend]/*.yml  (custom SAST rules)           │
│  .github/skills/be-*.md, fe-*.md, da-*.md, qa-*.md     │
│  .github/workflows/*.yml                                │
│  docs/especificacao/REQUISITOS.md                       │
│  docs/architecture.md                                   │
│  docs/diretrizes-tecnicas.md                            │
│  docs/lessons-learned.md               (start empty)    │
│  docs/fundamentos/TECNOLOGIAS.md                        │
│  docs/processo/SCRUM.md                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Prefixes and naming conventions

### Agents (`.github/agents/`)

| Prefix | Domain | Roles |
|--------|--------|-------|
| `dev-` | Development | backend, frontend, mobile, data-analyst |
| `qa-` | Quality | engineer, security-reviewer, pentest-engineer |
| `mgmt-` | Management | product-owner, project-manager, domain-expert/advisor |
| `infra-` | Infrastructure | devops, platform, sre |

### Skills (`.github/skills/`)

| Prefix | Layer | Domain |
|--------|-------|--------|
| `be-` | Backend | any server skill |
| `fe-` | Frontend | any UI skill |
| `da-` | Data | analytics, BI, ML |
| `qa-` | Quality | tests, automation, security |
| `proc-` | Process | workflows, protocols — universal ones start with `proc-` |
| `infra-` | Infrastructure | CI/CD, deploy, observability |

---

## The session continuity protocol

> This is the most critical piece of the system. Without it, every AI session starts from zero.

Every session (human or AI) must follow the protocol defined in
`.github/skills/proc-session-continuity.md`. The essential flow:

**Start:** `HISTORY.md` → `structural-analysis.md` → `git status` → `lessons-learned.md`

**End:** `structural-analysis.md` (mark ✅) → `HISTORY.md` (new state) →
`lessons-learned.md` (if there was a lesson) → commit docs + code together

> **Golden rule:** Every session that changes functional code MUST update
> `structural-analysis.md` and/or `HISTORY.md` in the same commit. Documentation
> must never be more than 1 commit behind the code.

---

*`.github/base/` · Universal · Copy to any project*
