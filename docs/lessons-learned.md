# Lessons Learned — basic-engineering

> Errors, discoveries and lasting rules. Entries are immutable — an outdated
> lesson is marked ✅, never deleted. This file **should** grow; it is a
> historical record, the opposite in nature from the fact panel in
> `docs/structural-analysis.md`, which must stay current.
>
> `Evidence:` states how the lesson is known — an unlabelled hypothesis
> inherits the authority of a measurement. `Scope: method` marks a lesson that
> does not depend on this project; in this repo that means it belongs in the
> shipped base, not only here.
>
> Reference: `engineering-principles.md` §11.2, §11.4.

---

## Process

### [2026-08] A ruler written from the rule's wording measures the wording

**Context:** measuring the plugin's activation graph, its trigger conformance,
and which backlog items were implemented.

**Problem:** four independent measurements were wrong in the same way, and
**none announced itself** — each returned a plausible number.
- A prefix regex `\b(proc|be|qa|…)-[a-z-]+` silently skipped
  `engineering-principles`, which carries no prefix: 9 graph leaves reported
  instead of 7, and the second most-referenced skill invisible.
- A trigger check for `Use (when|for|before)` returned 25/28 and would have
  "refuted" a correct claim; three skills write *"Use **at** project kickoff"*.
  The real figure is 28/28.
- Backlog items were probed at the paths in the item's *description* (inherited
  from another repo) instead of this project's real layout: two items reported
  as never started were shipped.
- A case-sensitive `grep provenance` missed the heading `## Provenance`.

**Rule:** design the check against the **artefact's actual habit**, not against
the sentence of the rule; then feed it a **known positive case and confirm it
fails** before trusting a pass. Hand-counting is not a fallback — it produced
three different answers (10, 12, 16) for one backlog in one session. Turn the
count into a command.

**Evidence:** measured — `node scripts/graph-audit.js`, `node scripts/backlog-audit.js`, 2026-08-19.
**Scope:** method — promoted into the base as the U10 discipline and enforced in
`test/graph.test.js` and `test/inventory.test.js`.
**Reference:** `feedback/project-a-2026-08-19/SUGESTOES.md` §23.

### [2026-08] An undeclared exception becomes someone else's measurement error

**Context:** `engineering-principles` is the only skill without a prefix, by
decision, and that decision was written nowhere.

**Problem:** the convention drifted from silent-exception to measurement bug —
every tool built on the prefix convention inherited the blind spot.

**Rule:** an exception to a convention is part of the convention. Declare it in
one place and let tooling read it from there.

**Evidence:** measured — the wrong leaf count above traces directly to it.
**Scope:** method.

### [2026-08] Read the generator before "fixing" the documentation

**Context:** a drift finding claimed `BASE_VERSION`'s documented format lied,
because a committed value used the time field as a sequence.

**Problem:** the finding was wrong. `scripts/release.js` generates a real
timestamp; the odd values are legacy from before that script existed. Acting on
the finding would have propagated the error into six files that document the
format correctly.

**Rule:** when documentation and data disagree, read the **code that produces
the data** before changing either. The real drift was underneath: the generator
used local time while `CONTRIBUTING.md` documents UTC — invisible until someone
released from another timezone.

**Evidence:** measured — `grep getHours scripts/release.js`, 2026-08-19.
**Scope:** method.

### [2026-08] A criterion that greps a string will match the prose that explains it

**Context:** the done-criterion for removing a duplicated schema was
`grep -rl entry_module` returns 0.

**Problem:** the replacement text explained *why the schema was removed* and
named the field, so the criterion kept failing after a correct fix. A second
version of the criterion was also wrong: it would have forced deleting a
heading the skill legitimately owns.

**Rule:** write the criterion against the **structural form** the defect takes
(a schema lives in a code block), not against a word that also appears in prose
about it. And test the criterion on the current state before adopting it — a
criterion that cannot distinguish "not done" from "done" is not a criterion.

**Evidence:** measured — both criterion versions failed on a correct fix.
**Scope:** method.

### [2026-08] A dry run that writes files must not advise a destructive revert

**Context:** `npm run release -- --dry-run` writes the release files on purpose
so the diff can be read, and it skips the clean-tree guard.

**Problem:** it printed `git checkout -- <all release files>` as the revert
instruction. That is the one mode where those files may hold unrelated
uncommitted work — following the advice would have destroyed this session's
`CHANGELOG.md`.

**Rule:** any instruction a tool prints must be safe in the state that tool
creates. If the tool relaxed a guard, the advice has to account for it.

**Evidence:** measured — reproduced on 2026-08-19, then fixed and re-proved.
**Scope:** method.

### [2026-08] Slice markdown by verified line ranges, not by string index arithmetic

**Context:** extracting two sections from a `SKILL.md` into a resource file.

**Problem:** combining `str.index()` slicing with a later `replace()` on the
same string duplicated content — the file went from 219 to 376 lines and the
resource came out empty. It looked like a successful edit.

**Rule:** for structural edits to a document, resolve the boundaries as **line
numbers**, assert each anchor is unique first, and verify the delta (line counts
before/after, key blocks present in the destination and absent from the source)
before moving on.

**Evidence:** measured — 219 → 376 lines, resource file 7 lines with 0 of the
moved content.
**Scope:** method.

---

*Last updated: 2026-08-19 · Reference: `engineering-principles.md` §11.2, §11.4*
