---
name: proc-adr
description: >
  Process for recording Architectural Decision Records (ADRs) — when to create them, which format
  to use, and where to store them. Use when making any significant technical decision that affects
  structure, security, performance, or is difficult to reverse.
---

# Skill: Architectural Decision Records (ADR)

## What this skill is

Defines the process for creating and maintaining ADRs — records of architectural decisions.
Use when making technical decisions with structural impact: library choice, pattern change,
authentication strategy, data model, or any decision that is difficult to reverse.

---

## When to create an ADR

Create an ADR whenever the decision:
- Affects more than one application layer (e.g.: switching from H2 to PostgreSQL in tests)
- Is difficult or expensive to reverse (e.g.: choosing a password hashing algorithm)
- Has viable alternatives that were discarded
- Will be asked about by future team members ("why didn’t we use X?")

**Do not create an ADR for:**
- Trivial implementation decisions (e.g.: naming a variable)
- Conventions already documented in `diretrizes-tecnicas.md`
- Bug fixes without design change

---

## Mandatory format

```markdown
# ADR-[NNN]: [Short infinitive title — e.g.: "Use Argon2id for password hashing"]

**Date:** YYYY-MM-DD
**Status:** [Proposed | Accepted | Deprecated | Superseded by ADR-NNN]
**Author(s):** [name or agent]

---

## Context

[What problem or need motivated this decision? 2-4 sentences. Facts, not opinions.]

## Decision

[What was decided, in one clear sentence. "We decided to use X for Y."]

## Alternatives considered

| Alternative | Why it was discarded |
|-------------|----------------------|
| [option A]  | [concrete reason]    |
| [option B]  | [concrete reason]    |

## Consequences

**Positive:**
- [benefit 1]
- [benefit 2]

**Negative / Trade-offs:**
- [cost or limitation 1]
- [cost or limitation 2]

## References

- [link to issue, PR, external doc, RFC, etc.]
```

---

## Repository location

```
docs/
└── adr/
    ├── ADR-001-use-argon2id-for-password-hashing.md
    ├── ADR-002-jwt-with-database-blocklist.md
    ├── ADR-003-sessionstorage-vs-localstorage.md
    └── ...
```

**Naming rules:**
- Sequential numbering with 3 digits: `ADR-001`, `ADR-002`
- Filename: `ADR-NNN-title-in-kebab-case.md`
- Never renumber existing ADRs — only add new ones

---

## Status lifecycle

```
Proposed → Accepted → (in use)
              ↓
         Deprecated    (still valid, but gradually replaced)
              ↓
         Superseded    (replaced by a newer ADR-NNN)
```

- **Proposed**: under discussion, not yet implemented
- **Accepted**: approved and implemented — the current standard
- **Deprecated**: historically valid, but should not be used in new code
- **Superseded by ADR-NNN**: another ADR has taken its place

---

## Integration with the development flow

1. **Before implementation**: if the decision is significant, create an ADR as "Proposed" and open a PR for review
2. **During code review**: review the ADR together with the code that implements it
3. **When merging**: update the status to "Accepted"
4. **When changing the decision**: create a new ADR referencing the previous one, mark the old one as "Superseded"

---

## Existing ADRs in this project

| Number | Decision | Status |
|--------|----------|--------|
| Consult `docs/adr/` | — | — |

> Keep this table in `docs/INDEX.md`, not in this skill — it changes often.

---

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| ADR too generic | "Use good security practices" | Focus on one specific, verifiable decision |
| Missing alternatives | Looks like there was no choice | Always list at least one discarded alternative |
| Outdated status | Implementation changed, ADR did not | When changing the pattern, create a new ADR and supersede the old one |
| ADR without date | Chronology impossible to trace | Date is mandatory — use the PR merge date |

---

*Skill — `.github/skills/proc-adr.md`*
*Reference: `engineering-principles.md` §A.4 (Documentation as product)*
*Template: `docs/adr/adr-template.md`*
