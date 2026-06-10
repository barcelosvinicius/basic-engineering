# Lessons Learned — [PROJECT]

> Record of errors, discoveries, and important technical decisions from each session.
> Format: **Context → Problem → Rule**. Each entry is immutable — outdated lessons
> are marked with ✅, never deleted.
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
### [Month/Year] Short descriptive title

**Context:** What was being done when the problem was found.
**Problem:** What went wrong or what was discovered. Be specific —
  include the symptom, observed behavior, and how to reproduce if relevant.
**Rule:** What to do (or not do) in the future. Include a correct/incorrect
  code example when applicable.
**Reference:** §X.X of `engineering-principles.md` or a related file.
```

- **Grouping:** when the file grows, group by category:
  `## Backend`, `## Frontend`, `## Database`, `## Security`, `## Process`

---

<!-- 
EXAMPLE — remove this block and replace it with real project lessons

### [Month/Year] Lesson title

**Context:** Description of what was being implemented.
**Problem:** What went wrong, observed symptom, how to reproduce.
**Rule:** 
```
// ✅ Correct
[correct code or instruction]

// ❌ Wrong — and why
[incorrect code or instruction]
```
**Reference:** §X.X of `engineering-principles.md`
-->

---

*Last updated: [YYYY-MM-DD] · Reference: `engineering-principles.md` §11.2, §11.4*
