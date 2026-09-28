---
description: Run a mutation pass under governance — scope and cost stated first, you decide, survivors each get an answer. Reports, never blocks.
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(npm:*), Bash(npx:*), Bash(mvn:*), Bash(./gradlew:*), Bash(dotnet:*), Bash(mutmut:*), Bash(python:*)
---

Run a mutation pass following `qa-test-strategy`. $ARGUMENTS may name the scope
(a module, a package, a path). **This command reports; it never blocks.**

The point is not a score. It is the question coverage cannot answer: *would any
test notice if this line were wrong?* A pass that nobody chose to run, at a cost
nobody stated, is the kind of automation people switch off.

1. **Decide the scope, and never default to everything.**
   In order: `$ARGUMENTS` · the modules touched by the current diff · the
   critical modules named in `docs/structural-analysis.md`. A whole-codebase run
   produces a list nobody reads — say so and propose a narrower scope instead.
   State the scope you picked and why.

2. **Find the tool the project already has.** Look for its own script first
   (`package.json` scripts, `Makefile`, `pom.xml` plugins). Only then fall back
   to `qa-test-strategy`'s `stack-commands.md`. If the stack has no tool there,
   stop and say **NOT MEASURED** with the reason — never a zero.

3. **State the cost before anyone waits.** Time the test suite once and report
   `N mutants × <suite time> ÷ <jobs> ≈ <estimate>`. If the tool cannot be timed
   that way, say what is unknown rather than guessing a number.

4. **Ask, and accept "not now".** Offer three: run the stated scope · narrow it
   further · skip. **A skip is recorded with its reason, not treated as a
   pass.** Proceed without asking only when the session is non-interactive, and
   say that is why.

5. **Run it, scoped.** Prefer the tool's own narrowing flag over filtering the
   output afterwards.

6. **Read the report as a list of lines, not as a percentage.** For every
   survivor exactly one of:
   - a test that kills it — the usual and best answer;
   - **equivalent, with the reason it cannot change behaviour written down.**
     "Equivalent" with no reason is not allowed;
   - removal, when it exposes dead code — follow `proc-safe-removal`.

   **Equivalents need a home, or the next pass rediscovers them from zero.**
   Keep them in the repository — `docs/mutation-equivalents.md` unless the
   project already has a place — one entry per accepted mutant: the file, the
   mutation, **the reason**, and the date plus the commit it was accepted at.
   That last part is what makes the judgment expire: "this cannot change
   behaviour" was a statement about a version of the code, so when the file
   moves, the entry is re-confirmed rather than inherited. If the tool has an
   incremental mode of its own (Stryker, PIT and mutmut each do), use it — and
   say in the report what was re-measured and what was carried over.

7. **Report with its denominator.** Scope · tool · modules measured **of**
   modules in scope · mutants killed/total · each survivor and what it became ·
   and what was **not** measured, with the reason. A pass that could not finish
   must not read as a pass — see `qa-verification-loop`, *zero without a
   denominator is not a result*.

**Governance:** the base makes the cost visible and the result honest; **the
person operating it decides scope and timing.** Mutation is a sweep — at a
release, or after changing a critical module — never a gate on every edit
(`engineering-principles` §D). And when reporting a score, read
`engineering-principles` §E first: a mutation score rises by recording more
equivalents, so it means something only beside the reasons that produced it.
