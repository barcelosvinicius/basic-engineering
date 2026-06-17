# 🚀 BOOTSTRAP — Project Kickoff Guide

> **This is the first file to read in any new project.**
>
> It defines the documentation + agents + skills system and the exact
> creation sequence. The base is delivered through two channels — pick yours
> in Step 0 and the guide tells you which steps to skip.

---

## Step 0 — Choose your delivery channel

### Channel A — Claude Code (recommended)

Install the plugin once; skills, agents, slash commands, and the
session-continuity hook become available natively in every project:

```
/plugin marketplace add barcelosvinicius/basic-engineering
/plugin install be@basic-engineering
```

Then, inside your project, run:

```
/be:bootstrap
```

It creates the AI context file (`CLAUDE.md`) and the `docs/` structure for
you. **Skip Steps 1, 3, and 4 below** — skills and agents come from the
plugin; only the living documentation (Step 5) and process setup (Step 6)
remain, and `/be:bootstrap` covers most of Step 5.

> Update the base with `/plugin update be@basic-engineering`.

### Channel B — Other tools (Copilot, Cursor, Windsurf, …)

```bash
# Node.js ≥ 18
npx @barcelosvinicius/basic-engineering install   # install or update
npx @barcelosvinicius/basic-engineering check     # check for updates
```

The CLI copies the canonical content to `.be/` in your project:

| Scenario | CLI action |
|----------|-----------|
| No base found | Fresh install — copies everything to `.be/` |
| Installed version < package | Update — overwrites universal files; your customizations are preserved |
| Versions match | Skip (`--force` to reinstall) |
| Installed version > package | Warning only — no changes |

Follow **all steps** below.

---

## What is the base

The base contains the **universal foundational files** — the ones that work
in any software project, regardless of stack, domain, or size:

| Folder / file | What it is |
|---------------|------------|
| `BOOTSTRAP.md` (this file) | Structure and creation sequence |
| `engineering-principles.md` | Engineering principles independent of technology |
| `ai-context.template.md` | Template for the project's AI context file |
| `BE-GUIDE.md` | Generated catalog of every command/agent/skill + live guardrails (`/be:help` shows it; written to the project root on bootstrap) |
| `skills/` | 28 universal skills (`<name>/SKILL.md` + resources) |
| `semgrep/` | Bundled starter SAST rules (`/be:check` + `infra-ci-cd`) |
| `config/` | Data files: `stack-mappings.json` (per-stack build/test/lint commands) + `install-profiles.json` |
| `agents/` | 15 ready-to-use specialized agents (each declares a `model` + prompt-defense baseline) |
| `commands/` | Task recipes (Claude Code slash commands; readable as checklists by any tool) |
| `templates/docs/` | 11 documentation templates |
| `mcp.recommended.json` | Reviewed-by-you starting point for MCP servers (Claude Code) |
| `.be-paths.example.json` | Optional EN/PT path map — copy to `.be-paths.json` so commands/hooks find your doc names (e.g. `HISTORICO.md`) |

**Golden rule:** if a file contains names, technologies, or decisions from a
specific project → it belongs in the project (`docs/`, project skills/agents).
If it works in any project → it belongs in the base.

---

## The 5 layers of the system

```
LAYER 0 — PHILOSOPHICAL FOUNDATION   engineering-principles.md
  "How to think about software" — universal, immutable per project
        ↓ informs
LAYER 1 — PROJECT CONTEXT            CLAUDE.md (or tool-specific mirror)
  "What this project is and its rules" — specific, ~150 lines max
        ↓ consults
LAYER 2 — SPECIALIZED AGENTS         base agents/ (+ project agents)
  "Who does what" — work uncustomized; read project context at runtime
        ↓ uses
LAYER 3 — TECHNICAL KNOWLEDGE        base skills/ (+ project skills)
  "How to do it" — loaded on demand (progressive disclosure)
        ↓ updates
LAYER 4 — LIVING DOCUMENTATION       docs/
  "What was done and what remains" — changes every session
```

## Authority hierarchy (most specific prevails)

```
engineering-principles.md → AI context file → agent → skill
    → .specify/specs/ (optional) → .specify/tasks/ (optional)
```

---

## Creation sequence — new project from scratch

### Step 1 — Get the base *(Channel B only)*

Run the installer (Step 0-B). It populates `.be/` with everything.

### Step 2 — Create the AI context file *(both channels; `/be:bootstrap` automates it on A)*

Copy `ai-context.template.md`, fill in all `<!-- CUSTOMIZE -->` sections,
and save it as **`CLAUDE.md` at the project root** — the primary location.

**This file is the highest-impact point in the system** — if it becomes
outdated, all agents lose context. Keep it precise and concise (max ~150
lines).

If the team also uses other tools, mirror the same content to:

| AI Tool | Location |
|---------|----------|
| Claude Code | `CLAUDE.md` (project root) — **primary** |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursorrules` (or `.cursor/rules/`) |
| Windsurf | `.windsurfrules` |

> Maintain `CLAUDE.md` as the canonical copy and mirror on change — most
> tools also accept `CLAUDE.md` content unchanged.

### Step 3 — Agents *(Channel B only; Claude Code gets them from the plugin)*

The base agents in `.be/agents/` work **without customization** —
they read the project's stack and conventions from `CLAUDE.md` and `docs/`
at runtime. Point your tool at them (e.g., Copilot custom agents in
`.github/agents/` can reference or copy these files).

Create project-specific agents only for roles the base doesn't cover, using
the same frontmatter pattern (`name`, `description` with a delegation
trigger). Use only agents the project really needs — unused agents are
context noise.

### Step 4 — Skills and SAST rules *(Channel B: point your tool at `.be/skills/`)*

Universal skills ship with the base — each one is a folder
`skills/<name>/SKILL.md` with optional resource files. Create
project-specific skills with the `proc-skill-creator` skill (it contains the
template), in `.claude/skills/` (Claude Code) or alongside the base skills
(other tools).

**Custom Semgrep rules (`.semgrep/rules/`):** every project should add SAST
rules reflecting its domain-specific risks, organized by language — see the
`infra-ci-cd` skill for the rule template and recommended set (hardcoded
secrets, sensitive logging, weak hash, SQL concatenation, localStorage auth,
innerHTML XSS, eval).

### Step 5 — Initialize the living documentation *(both channels; `/be:bootstrap` automates it on A)*

Create `docs/` from `templates/docs/`:

```
docs/
├── INDEX.md               ← navigation hub (index.template.md)
├── HISTORY.md             ← session state (history.template.md) — MANDATORY
├── CHANGELOG.md           ← (changelog.template.md)
├── structural-analysis.md ← (structural-analysis.template.md)
├── lessons-learned.md     ← (lessons-learned.template.md)
├── GLOSSARIO.md           ← start empty; grows with the domain
├── architecture.md        ← layers, entities, flows, endpoints
├── diretrizes-tecnicas.md ← code conventions for this project
├── fundamentos/TECNOLOGIAS.md      ← justify stack choices
├── especificacao/REQUISITOS.md     ← FRs and NFRs (RF-01, RF-02…)
├── adr/                   ← adr-template.md + ADR-001-[title].md
└── processo/
    ├── SCRUM.md (or equivalent)
    ├── LEARNING-TRAIL.md  ← (learning-trail.template.md)
    └── runbooks/          ← (runbook.template.md per operation)
```

**Update frequency:**

| Document | When |
|----------|------|
| `HISTORY.md` | Beginning and end of **every** session (mandatory) |
| `structural-analysis.md` | When pending items change status |
| `lessons-learned.md` | After a session with an error or relevant discovery |
| `architecture.md` | On structural changes |
| `diretrizes-tecnicas.md` | When new conventions are decided |

### Step 5-A — SDD structure (optional, both channels)

Use when the project spans more than two weeks, has parallel features, or
has already suffered context drift (full criteria in the `proc-sdd` skill):

```bash
mkdir -p .specify/specs .specify/plans .specify/tasks
```

Specs use EARS syntax; tasks are atomic (single session, binary
verification, explicit dependencies). With SDD enabled, implementation
sessions load the task file instead of the full HISTORY.md.

### Step 5-B — MCP servers (optional, Claude Code)

Review `mcp.recommended.json` at the base root, keep only what the project
needs, and copy it to the project's `.mcp.json`. The base deliberately
ships **no auto-started servers** — every server adds processes,
permissions, and context tokens.

### Step 6 — Process automation (optional, GitHub)

```
.github/
├── PULL_REQUEST_TEMPLATE.md
├── ISSUE_TEMPLATE/        ← user-story, bug-report, task, epic,
│                            technical-debt, spike (.yml)
└── workflows/             ← SCRUM automation + ci-quality-gate
```

SCRUM labels: Status (`backlog`, `in-progress`, `review`, `done`,
`blocked`), Type (`user-story`, `bug`, `task`, `epic`, `spike`, `chore`),
Priority (`critical`–`low`), Points (Fibonacci).

### Step 7 — First commit

```bash
git add CLAUDE.md docs/ .github/
git commit -m "chore(setup): initialize documentation structure and engineering base"
```

---

## Prefixes and naming conventions

### Agents

| Prefix | Domain | Roles |
|--------|--------|-------|
| `dev-` | Development | backend, frontend, data-analyst |
| `qa-` | Quality | engineer, security-reviewer, pentest-engineer, silent-failure-hunter, release-sanitizer, pr-test-analyzer |
| `mgmt-` | Management | product-owner, project-manager, domain-expert, architect |
| `infra-` | Infrastructure | devops |
| `ops-` | Operations | sre |

### Skills

| Prefix | Layer |
|--------|-------|
| `be-` | Backend |
| `fe-` | Frontend |
| `da-` | Data |
| `qa-` | Quality |
| `sec-` | Security |
| `ops-` | Operations |
| `proc-` | Process (universal) |
| `infra-` | Infrastructure |

All names kebab-case; skill directory name == frontmatter `name`.

---

## The session continuity protocol

> The most critical piece of the system. Without it, every AI session
> starts from zero.

Every session follows the `proc-session-continuity` skill. On Claude Code,
`/be:session-start` and `/be:session-end` run it, and the SessionStart hook
injects the current state automatically.

**Start:** `HISTORY.md` → `structural-analysis.md` → `git status` → `lessons-learned.md`
**End:** `structural-analysis.md` (mark ✅) → `HISTORY.md` (new state) →
`lessons-learned.md` (if there was a lesson) → commit docs + code together

> **Golden rule:** every session that changes functional code MUST update
> `structural-analysis.md` and/or `HISTORY.md` in the same commit.
> Documentation must never be more than 1 commit behind the code.
