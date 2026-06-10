---
description: Create a new Architecture Decision Record — /be:adr <short decision title>
---

Create a new ADR for the decision described in $ARGUMENTS, following the
`proc-adr` skill:

1. List `docs/adr/` to find the next sequential number (`ADR-NNN`). If the
   directory does not exist, create it and start at `ADR-001`.
2. Create `docs/adr/ADR-NNN-<title-in-kebab-case>.md` using the mandatory
   format: title, date (today), status **Proposed**, author, Context,
   Decision, Alternatives considered (at least one discarded alternative with
   a concrete reason), Consequences (positive and trade-offs), References.
3. Fill in as much as can be derived from the conversation and the codebase;
   leave clearly marked `[TODO]` placeholders for what only the user can
   decide — and ask for those decisions.
4. Remind the user: the ADR moves to **Accepted** when the implementing PR
   merges; superseding decisions get a new ADR, never an edit to this one.

If $ARGUMENTS is empty, ask for the decision title and a one-sentence
context before creating anything.
