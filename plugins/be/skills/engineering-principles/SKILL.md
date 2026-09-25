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
| §D | Enforcement ladder | Every rule declares its rung — prose · recall · sweep · gate · unrepresentable. Only a rule a machine decides alone may become a gate; tree-wide debt is watched, never gated |
| §E | Rulers that measure themselves | A number that improves when the guard weakens is not a quality number. Read it next to what produced it, and record every exclusion with its reason |

### §E — a number that rises when the guard loosens

"How many PRs the agent approved" grows when the automation gets more
permissive, and it grows fastest when quality is getting worse. The shape
generalises, and it is the one bias a metric cannot report about itself.

Two of this base's own rulers have it:

- **Mutation score** rises by recording more *equivalents*. The defence is the
  rule already in `qa-test-strategy` — an equivalent without a written reason is
  not allowed — plus the hash of the file it was accepted against, so the
  judgment expires when the code moves.
- **A harness or maturity score** rises by excluding more checks. The defence is
  that every exclusion is written down with its reason, and that an excluded
  check leaves **both sides** of the fraction — never silently hidden.

So, before trusting any score: *would this number go up if I did less?* If yes,
it must be read beside its denominator and its exclusions, never alone. The
companion rule is already here — **zero without a denominator is not a result**
(`qa-verification-loop`); §E is its mirror, for numbers that move the other way.

## How to use the hierarchy

When rules conflict, **the most specific wins**:

```
engineering-principles (universal)
  → AI context file (project)
    → agent (role)
      → skill (how-to)
        → spec/task (unit of work)
```

## Always-on vs on-demand (the "rules" layer)

`be` keeps the always-loaded layer thin so context stays cheap:

- **Always on (the rules):** these universal principles, the project's
  `CLAUDE.md`, and each agent's prompt-defense guardrail banner — paid on every
  call, so keep them short (`proc-context-budget`).
- **On demand:** skills (only the description loads until one triggers) and
  their resource files. Detailed "how" lives here, not in the always-on layer.

There is deliberately **no separate `rules/` directory** — it would duplicate
this digest and `CLAUDE.md`. Put a durable, always-true rule in `CLAUDE.md`
(project-specific) or a skill (reusable how-to) — never both.

## Activation edges

| Type | Target | When |
|---|---|---|
| `consult` | `sec-agent-security` | when the work builds or operates an agent, wires tools or MCP servers, or will read untrusted content — §2 is about the application's threat model, and an agent has its own |

## Related skills

Security: `sec-secrets-management`, `be-jwt-auth-patterns`,
`sec-agent-security` · Quality: `proc-code-review`,
`qa-test-data-builders` · Delivery: `proc-release-checklist`, `infra-ci-cd` ·
Operations: `ops-observability`.
