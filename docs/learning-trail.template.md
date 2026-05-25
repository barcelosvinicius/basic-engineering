# Learning Trail — [Project Name]

> **What this document is:** A learning map of the technical practices adopted in the project.
> For each practice: what it is, why we adopted it, where it is in the code, and how to learn it.
>
> **Keep updated:** When adopting a new practice, creating a new skill, or approving an ADR,
> add an entry here. See the `proc-learning-trail.md` skill for the full process.
>
> **Last review:** <!-- DATE -->

---

## How to use this trail

```
🟢 Basic        — reading the official documentation is enough
🟡 Intermediate — requires guided practice or a sample project
🔴 Advanced     — requires prior experience or mentoring
```

---

## Process and Methodology

### SCRUM with GitHub Milestones

**What it is:** Sprint management with GitHub milestones, SCRUM labels, and automation via GitHub Actions.

**Why we adopted it:** Keeps the backlog visible in the same code environment and eliminates external tools for small teams.

**Where it is in the project:**
- `.github/workflows/scrum-*.yml` — sprint automations
- `.github/ISSUE_TEMPLATE/` — user story, bug, epic, and spike templates

**How to learn it:**
- Internal guide: `docs/processo/SCRUM.md`
- Skill: `proc-session-continuity.md` — session protocol

**Level:** 🟢 Basic

---

### Architectural Decision Records (ADRs)

**What it is:** Documents that record significant technical decisions with context, alternatives, and consequences.

**Why we adopted it:** Prevents important decisions from being lost in team memory. Anyone can understand *why* something was done that way.

**Where it is in the project:**
- `docs/adr/` — project ADRs
- Skill: `proc-adr.md`

**How to learn it:**
- [ADR GitHub (Michael Nygard)](https://github.com/joelparkerhenderson/architecture-decision-record)
- Internal skill: `proc-adr.md`

**Level:** 🟢 Basic

---

### Conventional Commits + automatic CHANGELOG

**What it is:** A commit message standard (`feat:`, `fix:`, `chore:`) that enables automatic CHANGELOG generation.

**Why we adopted it:** Clear traceability, automated release note generation, and readable history.

**Where it is in the project:**
- `CHANGELOG.md` — generated file
- Skill: `proc-changelog.md`

**How to learn it:**
- [Conventional Commits](https://www.conventionalcommits.org/)
- Internal skill: `proc-changelog.md`

**Level:** 🟢 Basic

---

## Backend

<!-- CUSTOMIZE: list your project's backend practices -->

### [Main Framework/Language]

**What it is:** <!-- describe -->

**Why we adopted it:** <!-- justification -->

**Where it is in the project:**
- <!-- main code path -->
- Skill: <!-- skill-name.md -->

**How to learn it:**
- Official documentation: <!-- link -->
- Example in the project: <!-- example file -->

**Level:** <!-- 🟢 / 🟡 / 🔴 -->

---

## Frontend

<!-- CUSTOMIZE: list your project's frontend practices -->

---

## Quality and Testing

<!-- CUSTOMIZE: list your project's QA practices -->

---

## Infrastructure

<!-- CUSTOMIZE: list your project's infrastructure practices -->

---

## Cross-references

| Skill | Trail practice |
|-------|----------------|
| `proc-session-continuity` | Session protocol — Process |
| `proc-adr` | ADRs — Process |
| `proc-changelog` | Conventional Commits — Process |
| `proc-skill-creator` | How to create skills — Process |
| [add when creating new skills] | |

---

*Template — copied from `base/docs/learning-trail.template.md`*
*Creation skill: `proc-learning-trail.md`*
