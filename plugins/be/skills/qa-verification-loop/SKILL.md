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

## Report format

```
VERIFICATION REPORT
Build:    [PASS/FAIL]
Types:    [PASS/FAIL] (N errors)
Lint:     [PASS/FAIL] (N warnings)
Tests:    [PASS/FAIL] (X/Y passed, Z% coverage)
Security: [PASS/FAIL] (N findings)
Diff:     N files changed

Verdict:  [READY / NOT READY] for PR
Blocking issues:
1. ...
```

Do not declare work done while the verdict is NOT READY. If a phase cannot run
(missing tool/command), mark it `SKIPPED` with the reason — never report a
phase as PASS when it did not actually run.
