---
description: Close a work session — update HISTORY.md, structural-analysis, lessons-learned, and commit docs with the code
---

Run the session-end protocol from the `proc-session-continuity` skill:

1. **Validate the session goal:** state whether the goal declared at session
   start was achieved (✅/❌). If ❌, record what prevented it and what the
   next session must know.
2. Update `docs/structural-analysis.md`: mark resolved pending items ✅ with
   today's date, add new fixes to Applied Fixes, record newly discovered
   pending items.
3. Update `docs/HISTORY.md`: refresh the "Current State" section; append a
   Delivery History entry (`### [YYYY-MM-DD] Title` with Owner, Deliveries,
   Decisions, Next steps, Blockers); update "Next Steps".
4. If something was learned that prevents future rework, add an entry to
   `docs/lessons-learned.md` (Context / Problem / Rule / Reference).
5. If the project uses SDD, mark the current task in `.specify/tasks/` as ✅
   (or record the blocker).
6. Stage the updated docs **together with the session's code changes** and
   propose a Conventional Commit message. Show the user the proposed commit
   before executing it.

Golden rule: documentation must never be more than 1 commit behind the code.
