---
description: Run the pre-go-live checklist and draft the changelog entry for the release
---

Prepare the release described in $ARGUMENTS (version and/or scope; ask if
unclear):

1. Run the `proc-release-checklist` skill section by section — Security,
   Database, Backend/API, Frontend, Observability, Process. For each item,
   verify what can be verified from the repository (configs, workflows,
   migrations, tests) and mark it ✅ / ⚠️ needs manual check / ❌ failing,
   with evidence. For a small incremental release, apply the relevant subset
   and say which sections were skipped and why.
2. Draft the changelog entry following the `proc-changelog` skill: collect
   commits since the last tag, keep only feat/fix/perf/security, translate to
   user-facing language, order by impact, and update `CHANGELOG.md` under the
   new version heading with today's date.
3. Output: the checklist results table, the blockers that must be resolved
   before go-live, the drafted changelog entry, and the release record block
   to append to `docs/HISTORY.md`.

Do not tag or publish anything — preparation only.
