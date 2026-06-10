---
name: proc-code-documentation
description: >
  Use when writing or reviewing comments, docstrings, and inline
  documentation in code. When to comment vs. when to rename, the
  "why not what" rule, documenting public/business-rule functions, and
  avoiding comment rot. Per-language doc-comment formats as resources.
---

# Skill: Code Documentation and Comments

Defines what to comment, what *not* to comment, and how to keep comments from
rotting. Operationalizes `engineering-principles.md` §4.1 (naming reveals
intent) and §11.2 (comments on key functions).

> **Core principle:** code says *how*; comments say *why*. A comment that
> restates the code is noise that will drift out of sync. A missing "why" on
> a non-obvious decision is a future bug.

## Comment vs. rename — decide first

Before writing a comment, ask whether a better name removes the need:

```js
// ❌ Comment compensating for a bad name
const d = 86400000; // milliseconds in a day

// ✅ The name carries the meaning — no comment needed
const MILLIS_PER_DAY = 86_400_000;
```

```js
// ❌ Comment explaining what the code already says
// increment the counter by one
counter += 1;

// ✅ Comment explaining WHY (non-obvious business reason)
// Retry budget is 1 higher than the SLA allows — the gateway eats the first
// attempt during cold start (see incident 2026-03 in lessons-learned.md).
maxRetries += 1;
```

Rule: if a clearer name, a named constant, or an extracted function removes
the comment, prefer that. Comment only what the code **cannot** express.

## What MUST be documented

- **Public functions in services, controllers, utilities, and business-rule
  modules** — a doc comment stating purpose, parameters, return, thrown
  errors, and side effects (if any). This is the API surface others rely on.
- **Non-obvious "why"** — workarounds, deliberate deviations from the obvious
  approach, ordering that matters, performance/security trade-offs. Link to
  the ADR or `lessons-learned.md` entry when one exists.
- **Units, ranges, and invariants** that the type system doesn't capture
  (e.g., "amount in cents", "0–1 inclusive", "must be called after `init()`").
- **TODO/FIXME** with an owner and a tracking reference
  (`// TODO(#123): …`) — a bare TODO is invisible.

## What must NOT be documented

- Restatements of the code (`// loop over users`).
- Commented-out code — delete it; git remembers.
- Changelog/author noise in the body (`// modified by X on date`) — that is
  git's job.
- Comments that duplicate an enforced type or validation.

## Avoiding comment rot

- A comment lives **next to** what it explains; if the code moves, the
  comment moves with it.
- When you change behavior, update or delete the surrounding comment in the
  **same commit** — a stale comment is worse than none.
- During code review, treat an out-of-date comment as a blocking finding
  (see `proc-code-review`).

## Module / file-level documentation

Each non-trivial module/package gets a short header or README explaining its
responsibility and its place in the architecture (which layer, what it owns).
Keep it to a few lines — deep design rationale belongs in `docs/architecture.md`
or an ADR, not in source headers.

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Comment repeats the code | Commenting by habit | Comment the *why*, or delete |
| Comment compensates a bad name | Naming skipped | Rename / extract instead |
| Stale comment after a change | Updated code, not the comment | Same-commit rule; review catches it |
| Commented-out blocks pile up | "Might need it later" | Delete — git has history |
| Bare `TODO` never resolved | No owner/tracking | `TODO(#issue): …` |

## Resources

- [doc-comment-formats.md](doc-comment-formats.md) — per-language doc-comment
  syntax and examples (JSDoc/TSDoc, Javadoc, Python docstrings, Go doc
  comments, JavaDoc-style for C#).
