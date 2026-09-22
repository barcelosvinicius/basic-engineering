---
name: qa-test-strategy
description: >
  Use when deciding which tests a change needs, judging whether the existing
  tests actually prove anything, or before a release that touches a hot path —
  the layers (unit, integration, end-to-end, load), where TDD pays, mutation as
  the ruler of test quality, and when a load test is required against which number.
---

# Skill: Test Strategy

Decides, per change, **which verification it needs** and **whether the tests
would notice if the code were wrong**. The aim is not tests that pass — it is
tests that improve the construction and take the automatic out of a bad
implementation.

**Rung:** recall for the layer decisions; periodic sweep for mutation and load —
run at release or on a critical module, never as a per-edit gate
(`engineering-principles` §D).

## The question behind every test

A test earns its place when **it would fail if the code were wrong**. Coverage
answers *"did the line run?"*; mutation answers *"would any test notice it
changing?"*. A green suite that no mutant can break proves nothing.

```javascript
// ❌ 100% coverage of isAdult, and every mutant of it survives
test('isAdult returns a boolean', () => {
  assert.strictEqual(typeof isAdult(30), 'boolean');
});

// ✅ Pins the boundary — turning >= into >, or forcing the condition, fails it
test('isAdult is true from 18 and false below', () => {
  assert.strictEqual(isAdult(18), true);
  assert.strictEqual(isAdult(17), false);
});
```

## Which layers a change needs

| The change | Needs | Why |
|---|---|---|
| Pure logic — a rule, a calculation, a parser | unit tests; TDD when the contract is clear | fast and precise; the test states the rule |
| Crosses a boundary you own — database, queue, filesystem, another module | an integration test against the real thing (container, temp dir) | a mock encodes your belief about the boundary, and the defect lives in the belief |
| A journey that makes money or loses data | one end-to-end test per critical journey | few, slow, costly — cover the journey, not every screen |
| A hot path — a critical endpoint, a query over a growing table, a batch | a load test against the SLO, before release | capacity fails with growth, not with correctness |
| A bug fix | a failing test first, then the fix | the test is the proof the bug was understood |

Mock only what you do not own: third-party APIs, the clock, randomness.

## TDD — where it pays

- **Pays:** new behaviour with a clear contract, every bug fix, a refactor of
  code that has a spec.
- **Does not:** an exploratory UI or a spike. Write the test once the shape
  settles — and say that you did.
- **The cycle:** red → green → refactor. **Red must fail for the right reason** —
  read the failure message; a test failing on its own typo proves nothing.

## Mutation — the ruler of the tests

Small changes to the code — flip a comparison, swap `&&` and `||`, force a
condition true or false — then run the tests. A mutant the suite does not kill
has **survived**: a line whose correctness nothing checks.

- **Where:** modules whose failure is silent or expensive — guards, validation,
  money, authorization, parsers. Not the whole codebase: a report that long
  becomes a list people learn to skip.
- **When:** a sweep — before a release, or after changing a critical module.
- **Each survivor gets exactly one of:** a test that kills it · a record that it
  is *equivalent*, with the reason it cannot change behaviour · removal, when it
  shows dead code (`proc-safe-removal`). "Equivalent" without a reason is not
  allowed.
- **What it cannot do:** find the case nobody wrote. Mutation measures the
  tests you have; *the nearest case that must be allowed — or refused* — at each
  boundary measures the ones you do not (`qa-verification-loop`). Use both.
- **Prove the ruler too:** run it once on a suite known to be weak (it must
  report survivors) and once on a strong one (it must not). A mutation tool can
  report "all survived" for a reason that has nothing to do with the tests.

**Worked example — this base, 2026-09-22.** The first pass over its own guards:
53 of 199 mutants survived a green suite. 25 were in an audit written that same
day with tests in both directions — its command-line exit code had no test at
all. The pass also found a design gap (a half-deleted generated block would have
been duplicated instead of refused), and its own mirror test caught a defect in
the tool. And it did **not** find the bug fixed two days earlier, which was a
missing boundary case — the limit above, measured.

## Load and performance — criteria that anticipate

- **A number first:** the SLO — p95/p99 latency, error rate, throughput — from
  `ops-observability`. A load test without a target is a demo.
- **Required when:** a new or changed endpoint on a critical route; a query over
  a table that grows with use; a batch or import that scales with data; a
  runtime or dependency upgrade on a hot path.
- **Load profile:** the expected peak **and** a growth horizon (e.g. twice the
  current peak) — capacity problems arrive with growth.
- **Data:** production-sized. An empty database makes every query fast.
- **Report:** SLO · load profile · measured p95/p99 and error rate · pass or fail
  against the SLO · date · evidence class.

*Evidence class of this section: reported — the owner's history that load
becomes the problem as systems grow. No measured case in this base yet.*

## Checklist — per change, answerable from the diff

- [ ] Each new or changed behaviour has a test that would fail if it were wrong
- [ ] A fixed bug has a test that failed before the fix
- [ ] New boundary code has an integration test against the real dependency
- [ ] A new critical journey has its end-to-end test
- [ ] A change to a hot path names its SLO and carries a load result, or says why not
- [ ] A change to a critical module ran the mutation pass; survivors killed or recorded

## Common mistakes

| Mistake | Instead |
|---|---|
| Chasing a coverage percentage | ask whether a test would notice a wrong line |
| Mocking the database to test a query | an integration test against a real one |
| An end-to-end test for every screen | one per critical journey |
| A load test with no target | the SLO first |
| Mutation as a gate on every edit | a sweep, at release or on critical modules |
| "Equivalent" with no reason | write the reason, or kill the mutant |

## Activation edges

| Type | Target | When |
|---|---|---|
| `consult` | `qa-test-data-builders` | when a test needs data — builders, AAA |
| `consult` | `ops-observability` | when a load test needs its SLO |
| `consult` | `qa-verification-loop` | to prove a new check fails on a known case |

Tools and commands per stack — mutation, integration, end-to-end, load — are in
[stack-commands.md](stack-commands.md).
