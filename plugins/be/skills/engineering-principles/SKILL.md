---
name: engineering-principles
description: >
  Use when making a design decision and needing the project-independent
  ground rules — UX, security, coupling, testing, observability, resilience,
  and the AI-assisted documentation protocol. One-page digest with pointers
  into the full engineering-principles.md document.
---

# Skill: Engineering Principles (Digest)

One-page digest of the universal principles in
[engineering-principles.md](../../engineering-principles.md) (the full
document ships at the base root). Load the full section only when the
decision at hand needs it.

## The principles at a glance

| § | Principle | Core rule |
|---|-----------|-----------|
| §1 | UX first | The interface exists to reduce the user's cognitive effort; accessibility (§1.5) is baseline quality, not a feature |
| §2 | Security by default | Validate server-side, hash passwords with modern KDFs, parameterize queries, audit dependencies (§2.8 supply chain) |
| §3 | Low coupling, high cohesion | Dependencies point inward (api → service → domain ← data); business logic never in controllers or repositories |
| §4 | Contracts and evolution | Public APIs are versioned (§4.4); breaking changes get a new version, never a silent change |
| §5 | Tests as specification | Every behavior has a test; tests are deterministic; coverage targets agreed, not implied |
| §6 | Performance is a feature | Paginate collections, index queried columns, measure before optimizing |
| §7 | Resilience | Timeouts on every external call; failures are expected inputs, not exceptions |
| §8 | Simplicity | The simplest design that meets today's requirement; complexity must pay rent |

## AI-assisted work appendices

| § | Topic | Core rule |
|---|-------|-----------|
| §A | Documentation protocol | Docs are a product: HISTORY.md, structural-analysis.md, and lessons-learned.md stay ≤ 1 commit behind the code |
| §A.3 | Session briefs | Every session starts from recorded state, not from memory — see `proc-session-continuity` |
| §B | Agent behavior | Agents declare a verifiable goal, stay in scope, and delegate outside their role |
| §C | Context as graph | Load the narrowest layer that answers the question; depth-first by default — see `proc-sdd` |

## How to use the hierarchy

When rules conflict, **the most specific wins**:

```
engineering-principles (universal)
  → AI context file (project)
    → agent (role)
      → skill (how-to)
        → spec/task (unit of work)
```

## Related skills

Security: `sec-secrets-management`, `be-jwt-auth-patterns` · Quality:
`proc-code-review`, `qa-test-data-builders` · Delivery:
`proc-release-checklist`, `infra-ci-cd` · Operations: `ops-observability`.
