---
name: qa-verification-loop
description: Use when finishing a change, before declaring work "done", or before opening a PR — a stack-agnostic verification loop (build, type-check, lint, tests, security scan, diff review) that produces a READY / NOT READY verdict so quality is checked in the generation loop, not just in CI.
---

# Verification Loop

The cheap, repeatable gate the AI runs **before saying "done"**. It catches in
the generation loop what would otherwise only fail in CI (or in production).
Backs the `/be:check` command and complements the `be` PreToolUse guardrails.

## When to use

- After completing a feature, fix, or refactor — before declaring it done.
- Before opening a PR or proposing a commit.
- Whenever you are about to claim "it works" without having run it.

## Discover the project's commands first

`be` is stack-agnostic — never assume a toolchain. Read the project's
`package.json` scripts, `Makefile`, `pyproject.toml`, `pom.xml`/`build.gradle`,
or `CLAUDE.md` to find the real build/lint/test commands. If the project defines
none, fall back to the plugin's `config/stack-mappings.json` (the detected
stack's default commands). If still nothing fits, say so in the report instead
of inventing one.

## The six phases

Run in order; stop and fix on the first hard failure (build/type) before moving on.

1. **Build** — the project compiles/builds. A failing build is a STOP.
2. **Type-check** — `tsc --noEmit`, `mypy`/`pyright`, etc. Report every error.
3. **Lint** — run the project's linter. Do **not** weaken its config to pass
   (the config-protection hook blocks that) — fix the code.
4. **Tests + coverage** — run the suite; report passed/failed and coverage vs
   the project's target. A bug fixed this session must have a failing test first
   (see `qa-test-data-builders`).
5. **Security scan** — no hardcoded secrets, no business data in `localStorage`,
   no `console.log`/`print` of sensitive data left in. Run Semgrep with the
   bundled rules if available (see `infra-ci-cd`), plus a quick grep.
6. **Diff review** — `git diff --stat` and read each changed file for
   unintended changes, missing error handling, and edge cases (null, empty,
   zero, overflow, unauthorized).

## Before you trust a ruler, make it fail

Every check you write — a CI gate, a validation rule, a done-criterion, a grep
that answers a question — is itself a measurement, and an unexercised
measurement proves nothing. **Feed it a known positive case and confirm it
fails, before you believe a pass.**

Three failure modes, all of which return a plausible number and announce
nothing:

1. **The ruler is written from the rule's wording, not the artefact's habit.**
   A pattern built from how the rule is phrased finds what the phrasing
   predicts. Search for what the codebase *actually writes* — enumerate a few
   real examples first, then build the pattern from them.
2. **The criterion matches the prose that explains it.** A check for "the string
   X is gone" still fires on the sentence documenting why X was removed. Anchor
   the criterion on the **structural form** the defect takes (a schema lives in
   a code block; an import lives in an import statement), not on a word.
3. **The criterion cannot distinguish done from not-done.** Run it against the
   current, unfixed state first: it must return the "not done" answer. If it
   already returns "done", it is measuring something else.

And when a count matters, do not hand-count it twice — turn it into a command.
Hand-counting the same inventory three times in one session can produce three
different answers, each plausible.

## Zero without a denominator is not a result

`SKIPPED` with a reason solves *"it did not run"*. It does not solve the worse
case: **it ran, it passed, and it passed over the wrong artefact.** Green from a
stale build cache is indistinguishable from legitimate green in the report.

So every phase that reports an **absence** — a green suite, zero security
findings, no lint errors — carries the evidence that it exercised the right
target:

| Phase reports | Carry with it |
|---|---|
| Tests green | how many tests **ran** (a suite that collected 0 tests is green) |
| No security findings | how many files were **scanned**, and the pattern set used |
| No lint errors | how many files the linter **saw** |
| Build OK | that the artefact is **newer than the source** — or that the cache was cleared |

If you cannot state the denominator, the phase is `SKIPPED`, not `PASS`. A
measurement that reports nothing found, without saying what it looked at, is
indistinguishable from a measurement that did not look.

## Report format

```
VERIFICATION REPORT
Build:    [PASS/FAIL]  (artefact newer than sources / cache cleared)
Types:    [PASS/FAIL]  (N errors)
Lint:     [PASS/FAIL]  (N warnings over F files)
Tests:    [PASS/FAIL]  (X/Y passed over T collected, Z% coverage)
Security: [PASS/FAIL]  (N findings over F files scanned)
Diff:     N files changed

Verdict:  [READY / NOT READY] for PR
Blocking issues:
1. ...
```

Do not declare work done while the verdict is NOT READY. If a phase cannot run
(missing tool/command), mark it `SKIPPED` with the reason — never report a
phase as PASS when it did not actually run, and never as PASS when it ran but
you cannot say over what.
