---
description: Run the local quality gate before declaring work done — build, lint, tests, security scan, and a READY / NOT READY verdict
---

Run the `qa-verification-loop` skill against the current changes **before**
declaring the task done. $ARGUMENTS may narrow the scope (e.g. a path or
"security only") — otherwise verify everything touched this session.

1. **Discover commands** from `package.json`, `Makefile`, `pyproject.toml`,
   `pom.xml`/`build.gradle`, or `CLAUDE.md`. If a phase has no project-defined
   script, fall back to the plugin's `config/stack-mappings.json` (Channel B:
   `.be/config/stack-mappings.json`) for the detected stack's
   build/test/lint/format commands. Do not assume a toolchain; if a phase has
   no command, mark it SKIPPED with the reason.
2. **Run the six phases** (build → type-check → lint → tests+coverage →
   security scan → diff review) per the `qa-verification-loop` skill.
3. **Security scan:** if `semgrep` is on PATH, run it with the bundled rules at
   the plugin's `semgrep/` directory (Channel B: `.be/semgrep/`),
   e.g. `semgrep --config <rules-dir> --error <changed-paths>`. Always also
   grep changed files for: hardcoded secrets, business data written to
   `localStorage`, and `console.log`/`print` of sensitive data.
4. **Never weaken a linter/formatter config** to make a phase pass — fix the
   code (the config-protection hook enforces this).
5. **Report** in the skill's format and end with a **READY / NOT READY**
   verdict. If NOT READY, list the blocking issues and fix them (or ask),
   then re-run. Do not claim "done" while NOT READY.

This is advisory tooling, not a hook — run it yourself before handing work back.
