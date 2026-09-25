# Evidence behind this skill

What the claims in `SKILL.md` rest on. Kept here rather than in the skill
because it is what you **look up** to check a claim, not what you need to
**decide** which tests a change requires.

## Mutation finds what a green suite hides

**This base, first pass over its own guards, 2026-09-22.** 53 of 199 mutants
survived a suite that was green.

- 25 of the survivors were in an audit written **that same day**, with tests in
  both directions — its command-line exit code had no test at all.
- The pass surfaced a design gap, not only a test gap: a half-deleted generated
  block would have been duplicated instead of refused.
- The tool's own mirror test caught a defect in the tool.
- It did **not** find the bug fixed two days earlier, which was a *missing
  boundary case*. Point mutation alters lines that exist; it cannot invent the
  case nobody wrote. That is the limit stated in the skill, measured.

**Second pass, 2026-09-24, after the suite was strengthened:** 682 mutants over
11 modules, 664 killed, 18 equivalents, zero survivors. Each equivalent carries
a written reason and the hash of the file it was accepted against.

## A ruler is only proven by both directions

Three defects in this base's own measurement tools, each caught by the mirror
rather than by the known positive:

- The mutation runner reported **131 of 131 killed over a red suite** — a
  perfect score while a broken test sat in the suite. A pass must first see
  green on unmutated code.
- `NODE_TEST_CONTEXT` inherited by the child process made every mutant
  "survive". The known positive still passed, for the wrong reason.
- A linter adopted on 2026-09-23 was verified against the real defect it was
  meant to catch — a function declared twice — before a single pass over the
  tree was trusted.

## Async completeness, under concurrency

Reported, from a practitioner's account of validating an incident fix in an
asynchronous order flow (2026-08): the API accepted, a queue and a stock check
finished the work, and an HTTP 200 was therefore a receipt rather than an
outcome. 500 independent requests were raised gradually from one, and each was
traced in the database to its final state — checking for loss, duplication and
records stuck in an intermediate state. The account also notes a reported count
that would have conveyed a wrong conclusion, found by checking the evidence
itself.

*Evidence class: reported. No measured load case in this base yet.*

## Where each common mistake is already answered

Removed from `SKILL.md` on 2026-09-25: every row restated a rule the procedure
already states, and a skill loads in full on every activation. Kept here as a
traceability map, so the check is still easy to run against the skill.

| Mistake | Already answered by |
|---|---|
| Chasing a coverage percentage | *The question behind every test* |
| Mocking the database to test a query | layers table — a mock encodes your belief about the boundary |
| An end-to-end test for every screen | layers table — cover the journey, not every screen |
| A load test with no target | *Load and performance* — a number first, the SLO |
| Mutation as a gate on every edit | *Rung* line, and *Mutation — When: a sweep* |
| "Equivalent" with no reason | *Mutation* — an equivalent without a reason is not allowed |
