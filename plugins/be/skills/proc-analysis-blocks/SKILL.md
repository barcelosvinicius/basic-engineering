---
name: proc-analysis-blocks
description: >
  Use when an analysis, sweep, migration or bulk edit is large enough that you
  cannot state its result in one verifiable sentence — splitting it into blocks
  that each close with a verdict and its evidence. Also use before a mass
  operation (renumber, rename, remap) and before reporting a sweep's findings.
---

# Skill: Analysis in Blocks

A large analysis does not fail by being wrong. It fails by **leaving things
behind**: the drift nobody re-checked, the obvious error inside the stretch
worked as one piece. Measured, same author and same document: **one batch of 34
edits let 2 defects escape and caught none; the same work in 11 batches, each
checked, let 0 escape and caught 5** — every one of them by reading the output,
not by re-reading the plan.

It is not about fitting in the context window. It is about **degrading** inside
it: the big batch fits and passes, and what it loses is attention per item.

**Rung:** recall — this is discipline, not a gate. Only rules 3 and 6 have a
mechanical check, over the shape of the report; the base says so instead of
pretending the other four can be enforced (`engineering-principles` §D).

## The six rules, each with the case that produced it

**1. Declare the blocks before looking.** Deciding the split while reading bends
it to what you already found.
*Case:* the 34-edit batch above was never declared as blocks; the 11-batch run
was, and it is the one that caught defects.

**2. A block is what closes in one verifiable statement.** That is the size
rule, and the only non-arbitrary one: if you cannot say "X is true, and here is
the command that shows it", the block is too big.
*Case:* a repository-wide rename ran as three blocks — replace the names
(`grep` returns nothing), rewrite the sentences that needed judgement (`grep`
returns nothing), rewrite the history (the pickaxe returns zero commits). Each
closed alone; a single block would have ended in "it looks clean".

**3. Every block closes with a verdict and its evidence — never "looks fine".**
The evidence carries the **denominator**: what was examined, not only what was
found.
*Case:* a sweep reported "0 routes undocumented". The number was worthless until
it came with *0 of 27, over 66 documents read* — and the hand-check of two of
them showed the ruler had been wrong twice before that.

**4. Report where the guard already works.** A report that lists only problems
becomes an alarm list, and an alarm list gets skipped.
*Case:* a blocking checklist item — "no `console.log` in production code" — sat
ticked for five months over 55 occurrences. It was never satisfiable, so it was
signed anyway, and the five real items beside it (hardcoded credentials, SQL
concatenation) learned to be ignored with it.

**5. Name the class before fixing the case, then re-sweep the other blocks for
siblings.** A case fixed alone comes back with another face.
*Case:* a guard refused any command that *mentioned* a flag — the class was
"judging a command by its text instead of by what it runs". Fixed as a case, it
came back months later in a second reader of the same commands; naming the class
fixed both, and the sweep found the sibling before it shipped.

**6. Re-measure at the end, because the object may have changed during the
analysis — possibly by you.**
*Case:* a mutation pass was started, the code was edited while it ran, and the
result became a statement about a tree that no longer existed. It had to be
discarded and re-run. The same session re-ran a session replay after each
narrowing: 54 findings became 17.

## The report shape (rules 3 and 6, the checkable ones)

```
BLOCK 3 of 5 — the hook dispatcher
Verdict:  CHANGED — 2 defects, 1 design gap
Evidence: 69 mutants over 1 module, 27 killed; tests: 22/22
          (command: npm run mutation -- --only <module>)
Re-measured after the fix: 66 of 69, 3 recorded as equivalent
```

A block without `Verdict:` or without a command under `Evidence:` is not closed.

## ✅ / ❌

```text
❌  "Reviewed the whole module. Looks consistent, only small issues."
    — no blocks, no denominator, no command; nothing here can be re-run.

✅  "Block 2 of 4 — input validation.
     Verdict: 3 endpoints accept an empty body.
     Evidence: 12 endpoints read (grep '@PostMapping' src/), 3 without @Valid.
     Class: the annotation is on the DTO, not on the parameter — re-swept the
     other 3 blocks, 1 sibling found in block 4."
```

## When NOT to split

- The work already closes in one verifiable statement — splitting it adds
  ceremony and two more places to drift.
- The blocks would not be independent: if block 2 can only be judged after
  block 1 changes the code, that is one block with two steps.

## Common mistakes

| Mistake | Instead |
|---|---|
| Splitting by file or by size | split by **what closes in one statement** |
| Deciding the blocks while reading | declare them first, then look |
| A verdict with no command | every verdict carries how to re-run it |
| Reporting only findings | report the healthy ones too, with the denominator |
| Fixing the case, moving on | name the class, then re-sweep the other blocks |
| Trusting the first measurement | re-measure at the end; the object may have changed |

## Activation edges

| Type | Target | When |
|---|---|---|
| `consult` | `qa-verification-loop` | to prove a block's ruler fails on a known case before believing a pass |
| `consult` | `proc-safe-removal` | when a block's operation is a removal or a relocation |
