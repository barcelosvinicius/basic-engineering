# 🗺️ Documentation Index — [PROJECT]

> Centralized navigation for all project documents.
> This file is the **authoritative source** for the documentation catalog.
> Update it whenever a new document is created or removed.

**Total: [N] documents · Last updated: [YYYY-MM-DD]**

---

## Reading Paths by Profile

### 🟢 Any profile — Start here (15 min)

| # | Document | What you learn |
|---|----------|----------------|
| 1 | `README.md` | Overview, architecture, features |
| 2 | This file (`INDEX.md`) | How to navigate the documentation |
| 3 | `HISTORY.md` | ⚡ **Mandatory** — Current state and next steps |
| 4 | `especificacao/REQUISITOS.md` | What the system does (FR and NFR) |
| 5 | `GLOSSARIO.md` | Technical terms used throughout the documentation |

---

### 🔧 Backend Developer

| # | Document | Focus |
|---|----------|-------|
| 4 | `guias/COMO_USAR.md` | Full environment setup |
| 5 | `arquitetura/diretrizes-tecnicas.md` | Code conventions, pre-commit checklist |
| 6 | `arquitetura/architecture.md` | Entities, services, endpoints, flows |
| 7 | `arquitetura/lessons-learned.md` | Past mistakes not to repeat |
| 8 | `arquitetura/structural-analysis.md` | Technical pending items and priorities |

### 🎨 Frontend Developer

| # | Document | Focus |
|---|----------|-------|
| 4 | `guias/COMO_USAR.md` | Environment setup |
| 5 | `arquitetura/diretrizes-tecnicas.md` §frontend | Component and state patterns |
| 6 | `arquitetura/architecture.md` §frontend | Component structure and routes |
| 📚 | `fundamentos/TECNOLOGIAS.md` | Why each technology was chosen |

### 📋 Product Owner / Manager

| # | Document | Focus |
|---|----------|-------|
| 4 | `especificacao/MELHORIAS.md` | Prioritized strategic backlog |
| 5 | `processo/SCRUM.md` | Process, sprints, Definition of Done |
| 6 | `processo/GUIA_MELHORIA_SCORE.md` | Evolution plan by dimension |

### 🧪 QA / Tester

| # | Document | Focus |
|---|----------|-------|
| 4 | `processo/PLANO_TESTES.md` | Test pyramid, cases, target coverage |
| 5 | `guias/COMO_USAR.md` | How to use each feature (test basis) |
| 6 | `arquitetura/structural-analysis.md` | Technical debt that impacts quality |

### 🔒 Security Review

| # | Document | Focus |
|---|----------|-------|
| 4 | `.github/base/engineering-principles.md` §2 | Security principles |
| 5 | `arquitetura/diretrizes-tecnicas.md` §security | Project-specific implementation |
| 6 | `arquitetura/structural-analysis.md` §security | Implemented / pending checklist |

### 🤖 AI Agents

| # | Document | Focus |
|---|----------|-------|
| 4 | `guias/COMO_USAR_AGENTS.md` | Available agents and how to use them |
| 5 | `.github/base/engineering-principles.md` §A | Assisted documentation protocol |

### 🎓 Study

| # | Document | Focus |
|---|----------|-------|
| 4 | `fundamentos/LEARNING-TRAIL.md` | Guided study path with exercises |
| 5 | `GLOSSARIO.md` | Terms with simple definitions |
| 6 | `arquitetura/lessons-learned.md` | Real bugs + extracted lessons |

---

## All Documents by Category

### 📌 Root

| Document | Content |
|----------|---------|
| `INDEX.md` | This file |
| `HISTORY.md` | Operational state, sessions, next steps |
| `GLOSSARIO.md` | Technical terms with simple definitions |

### 📋 Specification (`especificacao/`)

| Document | Content |
|----------|---------|
| `REQUISITOS.md` | System FRs and NFRs (SRS) |
| `MELHORIAS.md` | Prioritized strategic backlog |

### 🏗️ Architecture (`arquitetura/`)

| Document | Content |
|----------|---------|
| `architecture.md` | Layers, entities, flows, endpoints |
| `diretrizes-tecnicas.md` | Code conventions and checklist |
| `structural-analysis.md` | Technical X-ray — pending items and fixes |
| `lessons-learned.md` | Lessons in Context→Problem→Rule format |

### 🎓 Foundations (`fundamentos/`)

| Document | Content |
|----------|---------|
| `.github/base/engineering-principles.md` | Universal engineering guide |
| `TECNOLOGIAS.md` | Guide to the chosen technologies |
| `LEARNING-TRAIL.md` | Guided learning trails |

### 🏃 Process (`processo/`)

| Document | Content |
|----------|---------|
| `SCRUM.md` | Ceremonies, labels, story points, DoD |
| `PLANO_TESTES.md` | Test pyramid and cases |
| `GUIA_MELHORIA_SCORE.md` | Evolution by dimension |

### 🛠️ Guides (`guias/`)

| Document | Content |
|----------|---------|
| `COMO_USAR.md` | Setup and troubleshooting |
| `COMO_USAR_AGENTS.md` | Copilot agents and skills |

---

## Authority Hierarchy

> If documents conflict, the most specific one in the hierarchy below prevails.

| Topic | Authoritative Source |
|------|----------------------|
| General principles | `.github/base/engineering-principles.md` |
| Requirements (FR/NFR) | `especificacao/REQUISITOS.md` |
| Security (patterns) | `arquitetura/diretrizes-tecnicas.md` §security |
| Code conventions | `arquitetura/diretrizes-tecnicas.md` |
| Technical state | `arquitetura/structural-analysis.md` |
| Continuity across sessions | `HISTORY.md` |
| Document catalog | `INDEX.md` (this file) |
| Technical terms | `GLOSSARIO.md` |

---

*[PROJECT] · Documentation Index · [YYYY-MM-DD]*
