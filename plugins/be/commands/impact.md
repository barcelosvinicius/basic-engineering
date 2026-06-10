---
description: Analyze the blast radius of the current changes — risk level + targeted review checklist
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(git log:*)
---

Run the `proc-impact-analysis` skill on the current changes
($ARGUMENTS may narrow the scope to specific files or a described change):

1. Collect changed files via `git diff --name-only` against the default
   branch (fall back to staged/working-tree changes).
2. Classify each file: layer, bounded context (use the domain map in
   `docs/structural-analysis.md` if present), public contract or shared.
3. Map the impact radius for public/shared files: direct consumers, one hop
   of indirect consumers, affected flows and tests.
4. Assign the overall risk level (🟢/🟡/🟠/🔴) applying the escalators
   (missing tests, incident-prone files per `docs/lessons-learned.md`,
   > 400 net added lines, CVE-carrying dependency bumps).
5. Output the PR-description block from the skill: risk level, counts,
   high-risk files with reasons, the targeted review checklist for that
   level, and a rollback plan (or "N/A — purely additive").
