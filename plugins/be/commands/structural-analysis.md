---
description: Generate or refresh docs/structural-analysis.md — layers, dependencies, domain map, risks, pending items
---

Run the `proc-structural-analysis` skill pipeline on this project
($ARGUMENTS may limit the scope, e.g. a subdirectory or "incremental"):

1. If `docs/structural-analysis.md` already exists, run the **incremental
   update**: re-analyze only changed areas, close resolved pending items,
   add new ones, and refresh the metadata section.
2. Otherwise run the full pipeline: project scan → file-level analysis →
   architecture analysis (layer assignment, coupling violations, risk
   checklist) → domain extraction (use the `proc-domain-mapping` skill for
   the domain map) → review and assembly.
3. Write the result to `docs/structural-analysis.md` using the base template
   structure: executive summary with risk level, architectural layers table,
   module map, domain map, numbered pending items (I-NN) with severity, and
   analysis metadata (date, analyzer, file count).
4. Finish with the output quality checklist from the skill and report the
   top 5 pending items by severity.

**Parallel axis:** per repository, then per top-level module — Phases 1–3 of the pipeline are independent per module; Phase 5 (assembly) is serial and single-writer.
Agents opened in parallel are read-only and return findings; a single writer
integrates them (see `proc-session-continuity`).
