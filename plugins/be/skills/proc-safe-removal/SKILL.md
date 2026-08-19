---
name: proc-safe-removal
description: >
  Use before deleting code, configuration, or documentation, and before moving
  content between files. Removal is the only operation whose error no test
  catches — the test dies with the code. Four axes to clear before deleting, a
  verification protocol for relocations, and the `// NB:` note that keeps the
  reason alive for whoever asks again.
---

# Skill: Safe Removal and Relocation

Deleting is the one change that **cannot fail loudly**. A broken feature fails a
test; deleted code takes its test with it, so the suite goes green precisely
because the evidence is gone. Moving content has the same shape: each half looks
correct on its own, and only the pair is wrong.

A move is a removal plus an insertion. Both halves can fail independently — so
both are covered here.

Reference: `engineering-principles.md` §11.1 (Conscious Technical Debt).

## Activation edges

| Type | Target | When |
|---|---|---|
| `consult` | `qa-verification-loop` | to prove the check you wrote actually fails on a known case |
| `consult` | `proc-impact-analysis` | when the removal touches a shared boundary |

## Part 1 — Before deleting: four axes

"No callers" is not an answer. A framework can bind by class name, a job by
string, a template by convention, a schema by column name — none of which a
reference search finds. Clear all four, in writing:

| Axis | Question | Not satisfied by |
|---|---|---|
| **Provenance** | Why was this added? Which commit, issue, or incident? | "it looks unused" |
| **Supersession** | What replaced it, and is the replacement live in every environment? | "there is a newer one" |
| **Damage** | What breaks if this is wrong — silently, and for whom? | "probably nothing" |
| **Unreachability** | Reachable by reflection, DI, config, string key, schema, template, or an external caller? | a grep for the identifier |

If any axis is unanswered, the item is **not ready to delete** — it is ready to
be marked. Deprecate, log on use, wait one release, then re-check the damage
axis with real data.

## Part 2 — What survives keeps its reason

Whatever you decided **not** to remove gets a note where it lives:

```
// NB: kept deliberately — the scheduler binds this by class name, not by
// import, so a reference search shows zero callers. See ADR-005.
```

Without it, the next analysis reopens the same discussion without the evidence,
and eventually someone wins the argument by deleting it.

## Part 3 — Moving content between files

The failure is silent in both directions: content **duplicated** (present in
both) or **evaporated** (present in neither), while each file still reads fine.

1. **Resolve the boundaries as line numbers, and assert each anchor is unique.**
   A heading matched twice slices the wrong range.
2. **Remove multiple ranges bottom-up.** Removing the top range first invalidates
   every line number below it.
3. **Verify by counting, not by reading** — before and after, across the pair:
   total lines, lines inside code blocks, number of headings. Content that moved
   must be *present in the destination and absent from the source*; assert both.
4. **Check the seams**, which is where the damage actually shows:
   - numbering that now skips (`2` → `8`) in either file
   - the footer or trailing separator carried away with the last range
   - cross-references pointing at a section that left
   - a schema or rule now defined in **two** places, or in none

## Correct vs wrong

```bash
# ✅ anchors verified, bottom-up, integrity asserted
grep -c "^## Section A$" file.md          # must be 1
sed -n '40,80p' file.md > moved.md
sed -i '40,80d' file.md
[ "$(before_code_lines)" = "$(after_code_lines)" ] || echo "content lost"

# ❌ index arithmetic on a whole string, then another edit on the same string
#    — silently duplicated a file from 219 to 376 lines while the destination
#    came out empty, and both files still parsed
```

## Common mistakes

| Mistake | Cause | Solution |
|---|---|---|
| "0 callers, safe to delete" | Reference search treated as proof | Clear the unreachability axis: reflection, DI, config, strings |
| Deleted code, suite still green | The test went with it | Green after a deletion is not evidence; check the damage axis |
| Half the fact corrected | Fixed where it was most visible | Ask "where else does this live?" and fix every copy in one pass |
| Move looks fine, content duplicated | Verified by reading, not counting | Assert present-in-destination **and** absent-from-source |
| Section numbering jumps after a move | Only the moved half was reviewed | Check the seams in **both** files |
| Footer vanished with the last range | Range ran to end of file | Read the tail of both files before committing |
