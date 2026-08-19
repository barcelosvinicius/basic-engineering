# Skill lifecycle — provenance and pruning

Loaded on demand from `proc-skill-creator`. Both topics serve a subset of
skills — generated or imported ones, and periodic review — so they are
reference material rather than part of the authoring procedure.

## Provenance for generated / imported skills

A skill that was **AI-generated** (e.g. distilled from git history) or
**imported** from another source must be auditable — record where it came from
and how much to trust it, in the frontmatter:

```yaml
metadata:
  origin: generated        # generated | imported | first-party
  source: <url / path / session id>
  created_at: 2026-01-01
  confidence: 0.7          # 0–1: how validated it is
  author: <who or what produced it>
```

First-party base skills don't need it. Treat a low-confidence imported skill as
provisional until validated against real use.

## Prune by evidence, not by feel

The base stays lean by **measuring**, not guessing (see `proc-context-budget`):
periodically review skills and demote or remove ones that never trigger,
duplicate another, or repeatedly lead to bad output. A skill that isn't earning
its context cost is noise — delete it or move it to the project.

