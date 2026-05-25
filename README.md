# basic-engineering

> A universal engineering base for AI-assisted software projects — structured to produce robust, efficient, and secure software from day one.

![Version](https://img.shields.io/badge/version-v20260511--144605-blue)

## What is this repository?

**basic-engineering** is a foundational framework designed to maximize the value of any AI assistant (GitHub Copilot, Claude, Cursor, Gemini, and others) in real-world software projects. It goes beyond templates: it defines *how to think* about software — with depth, rigor, and a long-term view.

The core belief behind this project is that AI tools are only as good as the context and structure surrounding them. Without clear principles, defined roles, reusable knowledge, and living documentation, AI assistance degrades into noise. This base provides the scaffolding that elevates AI from autocomplete to a genuine engineering partner.

### What this base delivers

- **🏗️ Engineering principles** — technology-agnostic rules that guide every decision: UX, security, data integrity, testing, observability, resilience, and more. Designed to be immutable per project and referenced by every agent and skill.
- **🤖 AI agent templates (roles)** — 13 ready-to-customize agent definitions covering every team role: backend developer, frontend developer, data analyst, product owner, project manager, domain expert, architect, QA engineer, security reviewer, pentest engineer, DevOps, and SRE. Each agent knows its responsibilities, the project's stack, and how to collaborate.
- **🛠️ Universal skills** — 16 reusable technical skill documents (backend patterns, frontend UX, CI/CD pipelines, security, testing, process protocols) that agents load on demand. Skills are the "how to do it" layer — concrete, actionable, stack-aware.
- **📄 Documentation templates** — 11 templates for the full documentation lifecycle: changelog, contributing guide, session history, project index, security policy, learning trail, structural analysis, lessons learned, onboarding, runbook, and ADRs.
- **🔄 Session continuity protocol** — a mandatory workflow ensuring that every AI session (and every human session) starts with full context and ends with updated documentation. Reduces token waste and eliminates the "lost context" problem across long-running projects.
- **📐 Spec-Driven Development (SDD)** — optional methodology for projects that outgrow vibe coding. Defines a `spec → plan → tasks` hierarchy with EARS-syntax requirements so every AI session gets precise, minimal, and verifiable context. See `skills/proc-sdd.md`.

### Design philosophy

This framework is built on five commitments:

1. **Depth over speed** — forcing a thinking-before-coding discipline that eliminates silent assumptions, reduces rework, and produces better decisions.
2. **Structured context for AI** — every agent and skill is designed to give AI assistants precisely the context they need to produce reliable, project-consistent outputs.
3. **Security and quality by default** — engineering principles embed security (OWASP, SAST, dependency scanning), performance, accessibility, and observability as first-class concerns — not afterthoughts.
4. **Permanent evolution** — the base is versioned and self-updating. As technology advances, principles and skills are updated. Projects built on this base inherit improvements without starting over.
5. **Token efficiency as engineering discipline** — context is treated as a graph: depth-first loading for implementation sessions (load only the current task's spec), breadth-first only when navigating across features. Saving tokens is not a workaround — it is part of responsible and scalable AI use.

---

## How to use

### 1. Prerequisites

- Git ≥ 2.x, curl or wget
- A GitHub account

### 2. Copy the base to your project

```bash
# Clone this repository (or download base-atualizacao.zip)
git clone https://github.com/barcelosvinicius/basic-engineering.git

# Copy the base to your project
cp -r basic-engineering/.github/base/ my-project/.github/base/
cp basic-engineering/check-version.sh my-project/check-version.sh
cp basic-engineering/BASE_VERSION my-project/BASE_VERSION
```

### 3. Check version <a name="step-0"></a>

```bash
cd my-project
bash check-version.sh
```

### 4. Follow BOOTSTRAP.md

Read `BOOTSTRAP.md` and follow the 7 steps to set up your complete project.

---

## Structure

```
basic-engineering/
├── BOOTSTRAP.md                      — Complete setup guide (read first)
├── engineering-principles.md         — Universal, technology-agnostic engineering principles
├── BASE_VERSION                      — Current base version
├── base-manifest.json                — Metadata and version check URL
├── check-version.sh                  — Version verification script
├── ai-context.template.md            — Template for your project's AI context file
├── roles/                            — 13 agent (role) templates
├── skills/                           — 17 universal skill documents (incl. proc-sdd)
└── docs/                             — 11 documentation templates
```

---

## The 5-layer system

```
LAYER 0 — PHILOSOPHICAL FOUNDATION    (engineering-principles.md)
          "How to think about software" — universal, project-immutable

LAYER 1 — PROJECT CONTEXT             (.github/ or project root)
          AI context file — project-specific, tool-deployed per BOOTSTRAP.md

LAYER 2 — SPECIALIZED ROLES           (.github/agents/)
          "Who does what" — customized from base/roles/ templates

LAYER 3 — TECHNICAL KNOWLEDGE         (.github/skills/)
          "How to do it" — domain and stack specific

LAYER 4 — LIVING DOCUMENTATION        (docs/)
          "What was done and what remains" — updated every session

LAYER 5 — SPEC-DRIVEN ARTIFACTS       (.specify/)  [optional]
          "What each feature must do" — specs, plans, tasks per feature
```

---

## Version

Version format: `vYYYYMMDD-HHMMSS`. Check `BASE_VERSION` for your installed version
and run `bash check-version.sh` to verify if updates are available.