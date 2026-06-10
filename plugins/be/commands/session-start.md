---
description: Start a work session — load HISTORY.md, structural-analysis, git status, and declare a verifiable goal
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git log:*)
---

Run the session-start protocol from the `proc-session-continuity` skill:

1. If `.specify/` exists (SDD in use), prefer the depth-first flow: read the
   current task in `.specify/tasks/` and its spec. Otherwise:
2. Read `docs/HISTORY.md` — report Current State, Blockers, and Next Steps.
3. Read `docs/structural-analysis.md` — report open pending items relevant to
   the next steps.
4. Run `git status` — report uncommitted changes and whether they look like
   work to continue or discard.
5. Consult `docs/lessons-learned.md` if it has entries relevant to the
   planned work.
6. If any of these files do not exist, say which ones and suggest running
   `/be:bootstrap`.

Then, based on what you found and on $ARGUMENTS (the user's intent for this
session, if provided), propose a **verifiable session goal** in the form:

> "At the end of this session, I will know I am done when: [criterion]"

Wait for the user to confirm or adjust the goal before implementing anything.
