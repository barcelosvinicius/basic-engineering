# Structural Analysis — [PROJECT]

> Technical X-ray of the project. Pending items classified by severity;
> applied fixes recorded with date. Update in every development
> session.
>
> Reference: `engineering-principles.md` §11.1 (Conscious Technical Debt).

**Last updated:** [YYYY-MM-DD]

---

## §0 — Verifiable fact panel

Every claim this document makes about the system goes here first, with the
command that reproduces it. Two hard rules:

- **A value without a date is not a fact** — it is a value that was true once.
- **A fact without a command is an impression** — if you cannot write the
  command, say so in the Class column and call it what it is.

`Class` is part of the fact, not of the style: **measured** (a command produced
it) · **inferred** (derived from something measured) · **reported** (someone
said so) · **hypothesis** (instrumented guess). An unlabelled hypothesis
inherits the authority of a measurement, and readers stop investigating.

| Fact | Proof command | Value | Class | Measured on |
|------|---------------|-------|-------|-------------|
| *[e.g. endpoints without pagination]* | `[command]` | `[value]` | measured | [YYYY-MM-DD] |

> Re-run this whole table before each release. A stale row is a defect, not a
> detail — it is the row someone will trust.

---

## Summary by Level

| Level | Description | Qty | Status |
|-------|-------------|-----|--------|
| 🔴 Critical | Impacts behavior or security in production | 0 | — |
| 🟠 Important | Quality, maintainability, and bug risk | 0 | — |
| 🟡 Minor | Standardization and cleanup | 0 | — |
| ✅ Resolved | Fixed in a previous session | 0 | — |

---

## Technical Pending Items

### 🔴 Critical

<!-- Format — the last two fields are not optional:
#### C-01 — [Short title]
- **File(s):** [where it is]
- **Problem:** [incorrect behavior]
- **Cause:** [why it happens]
- **Solution:** [what to do]
- **Done when:** [criterion verifiable BY COMMAND — write the command]
- **Blocked by:** [what must be true first — another item's ID, or "nothing"]
- **Reference:** §X.X of `engineering-principles.md`

Why those two fields exist, measured in real projects:
  - An item with no done-criterion is not a pending item, it is a feeling. It
    reappears in every future analysis and never closes. "Reduce the God Class"
    has no finish line; "0 `@Autowired` in the repo" closed in one session.
  - An item whose criterion is verifiable but UNREACHABLE is worse than a vague
    one: it looks resolved and never closes. If satisfying it depends on another
    open item, say so here — the item is born blocked instead of born orphaned.
-->

*No critical pending items at the moment.*

---

### 🟠 Important

*No important pending items at the moment.*

---

### 🟡 Minor

*No minor pending items at the moment.*

---

## Security Analysis — Summary

<!-- Adapt the items to the project's actual implementation -->
| Item | Status | Reference |
|------|--------|-----------|
| Passwords hashed securely (Argon2id/bcrypt) | ❌ Pending | §2.2 |
| Token-based authentication (JWT/OAuth) | ❌ Pending | §2.2 |
| Upload validation (magic bytes) | ❌ Pending | §2.3 |
| Credentials outside the code | ❌ Pending | §2.7 |
| CORS restricted to authorized origins | ❌ Pending | §2.5 |
| Rate limiting on authentication endpoints | ❌ Pending | §2.6 |
| HTTP security headers (CSP, HSTS, etc.) | ❌ Pending | §2.5 |
| Environment variables validated at startup | ❌ Pending | §4.5 |
| Health check endpoint | ❌ Pending | §8.2 |
| RLS or per-user data isolation | ❌ Pending | §2.1 |

---

## Applied Fixes

| # | Description | File(s) | Proof it holds | Date |
|---|-------------|---------|----------------|------|
| — | *No fixes recorded yet.* | — | — | — |

---

## Out-of-Scope Items

<!-- List conscious decisions not to implement -->
- **[Item]**: [reason why it is out of scope for now]

---

*Last updated: [YYYY-MM-DD] · Reference: `engineering-principles.md` · Re-run §0 before each release.*
