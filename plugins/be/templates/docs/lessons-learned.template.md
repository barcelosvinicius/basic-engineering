# Lessons Learned — [PROJECT]

> Record of errors, discoveries, and important technical decisions from each session.
> Format: **Context → Problem → Rule**. Each entry is immutable — outdated lessons
> are marked with ✅, never deleted.
>
> **This file is meant to grow, and is never compacted.** It is a historical
> record; `HISTORY.md` is operational state and has a ceiling, and
> `structural-analysis.md` is a current X-ray that gets rewritten. Confusing the
> three is what makes people prune the one record that should keep everything.
>
> Reference: `engineering-principles.md` §11.2 (Documentation as Code) and §11.4 (PCS).

---

## How to use this file

- **When to record:** after any session in which an error was made, an important
  decision was taken, or a pattern was discovered that would prevent future rework.
- **When to consult:** at the start of each session (via `proc-session-continuity`), before
  applying any pattern in an area that has had issues before.
- **Required entry format:**

```
### [YYYY-MM] Short descriptive title

**Context:** What was being done when the problem was found.
**Problem:** What went wrong or what was discovered. Be specific —
  include the symptom, observed behavior, and how to reproduce if relevant.
**Rule:** What to do (or not do) in the future. Include a correct/incorrect
  code example when applicable.
**Evidence:** measured · inferred · reported · hypothesis — and how you know.
**Scope:** `project` (depends on this stack/domain) or `method` (would be true
  in any project — see the promotion step below).
**Reference:** §X.X of `engineering-principles.md` or a related file.
```

- **`Evidence` is part of the lesson, not decoration.** A hypothesis written
  without its class inherits the authority of a measurement, and whoever reads
  it stops investigating. "Measured" and "instrumented guess" are equally
  useful and are not interchangeable.
- **`Scope: method` means the lesson does not belong here.** A lesson about
  method improves one project while it sits in `docs/`; sent back to the
  engineering base it improves every project using it. At session end, each
  `method` lesson is queued for the base — see `proc-session-continuity`.

- **Grouping:** when the file grows, group by category:
  `## Backend`, `## Frontend`, `## Database`, `## Security`, `## Process`

---

<!-- 
EXAMPLE — remove this block and replace it with real project lessons

### [YYYY-MM] Lesson title

**Context:** Description of what was being implemented.
**Problem:** What went wrong, observed symptom, how to reproduce.
**Rule:** 
```
// ✅ Correct
[correct code or instruction]

// ❌ Wrong — and why
[incorrect code or instruction]
```
**Evidence:** measured — `[command that produced it]`, [YYYY-MM-DD]
**Scope:** project
**Reference:** §X.X of `engineering-principles.md`
-->

---

*Last updated: [YYYY-MM-DD] · Reference: `engineering-principles.md` §11.2, §11.4*
