# 📋 Session History — basic-engineering

> **Mandatory continuity file.** Every session reads this before touching code
> and updates it before committing. Operational state lives here;
> `docs/lessons-learned.md` holds errors and lasting rules;
> `docs/structural-analysis.md` holds the technical X-ray.
>
> Reference: `engineering-principles.md` §A.3 (Session Continuity).

---

## Current State

> ⚡ Last updated: 2026-09-28 (session closed)

**Project phase:** **v3.3.0 is published and Phase 10 is closed.** npm carries
`latest: 3.3.0`, the marketplace follows `main`, CI is green through run #29.
The base now ships the governance around mutation testing, not only the doctrine.

*For anyone who cloned before 2026-09-24:* the history was rewritten and
`v3.0.0`, `v3.1.0` and `v3.1.1` changed SHA. An older clone cannot fast-forward
— re-clone, or reset local `main` onto the remote. No published npm artifact
changed.

> **Environment note.** Three environments: a Linux machine (CI runs on
> `ubuntu-latest`), a Windows workstation with Git Bash, and **WSL2 on that
> workstation**. They hold **separate `gh` tokens and separate plugin caches** —
> updating one says nothing about the other. The interactive CLI does not
> connect from this WSL, and `/plugin` is unavailable in this environment, so
> the plugin was updated by hand (see P-10). **WSL also drops the VS Code
> connection under load**: four mutation runs died with it. Long runs go through
> `setsid nohup`, which survives both the connection and the session.

### In progress

- **Nothing.** Phase 10 closed; 10.1c and 10.7 are recorded and deliberately
  not started.

### Recently completed (this session)

- **v3.3.0 published.** 187 tests, 12 of 12 mutation targets (727 mutants, 706
  killed, 21 equivalents, **zero survivors**), validate, lint, format, typecheck
  and both audits green.
- **Mutation became governable, and portable.** Selection follows the transitive
  closure rather than the file; a ledger keyed on the target, its tests, its
  closure **and the runner's own hash** lets a result be inherited only while all
  four still hold; a pass prints `N of M accounted for` and fails `--check` when
  anything lacks a verdict; the cost is stated before anyone waits and the
  person waiting can narrow or decline. `/be:mutation` carries that discipline to
  projects using PIT, Stryker or mutmut — the runner is deliberately not shipped,
  because imposing a JavaScript mutator on a Java project is the opposite of the
  point.
- **Fail-open stopped being a blanket.** A blocking detector that throws now
  refuses the call and names itself; advisory hooks still cost nothing. Events
  carry the `promptId` of the request that produced them.
- **Four outside articles were triaged against what the base already held**, and
  only what was genuinely missing was added — including
  `engineering-principles` §E: a number that improves when the guard weakens is
  not a quality number, which lands on two of this base's own rulers.
- **The inward ruler found nothing to remove**, which is the honest answer: 30
  of 31 skills were already reachable. It found instead that the item's own
  premise was false (1 skill of 31 declares an evidence class, not all of them)
  and that `sec-agent-security` — the most topical skill here — was reachable
  from nothing. Now routed from the hub and from the loop that runs every change.
- **P-09 closed** (CI green since run #21) and **P-10 closed for WSL**.

### Blockers

- **None.**
- **P-10 remains open on the Windows workstation**, which has its own cache.

### Priority next steps

1. Update the plugin on the **Windows workstation** (P-10). That machine's cache
   is independent; `be doctor` there should report 3.3.0.
2. **This session's own Claude Code process still runs 3.1.1** — the plugin path
   is resolved at start. The next session picks up 3.3.0.
3. **Phase 10.1c** — 1 skill of 31 declares an evidence class. Deliberately not
   a sweep: a class asserted in bulk is the same unmeasured claim, once per file.
4. **Phase 10.7** — the base records what was built and not what was asked.
   `docs/action-plan.md` is a living requirements document in all but name, and
   the base teaches nobody to keep one.
5. The queue that waits for evidence: `be doctor <projects>`, the PR template
   with a mandatory number, proposal 13.

---

## Delivery History

> Reverse chronological. Each entry is immutable.

### [2026-09-28] v3.3.0 — mutation becomes governable, and the guards get guards

**Owner:** vinicius · **Sessions:** 2026-09-23 → 2026-09-28 (one thread)

**Goal declared at start:** verify the `be` identity on this machine, then close
the improvement flow and ship a version. ✅ **Achieved** — v3.2.0 on 2026-09-24
and v3.3.0 on 2026-09-28, both published to npm with provenance.

**Deliveries**
- **Phase 10, all six items** — the inward ruler (10.1), a pass that cannot look
  finished (10.1b), safe selection with a ledger (10.2), fail-open per class
  (10.3), the trail that says who asked (10.4), and the cost stated before the
  wait (10.5); plus 10.6, four gaps four outside articles exposed.
- **`/be:mutation`** — the governance a project actually receives, around
  whatever tool its stack has.
- **The base runs its own verification loop** — Biome and `tsc --noEmit`, absent
  until now over 7,183 lines, in a base that sells lint and type-check as phases
  2 and 3.
- **This repo wears what it ships** — hooks, skills, agents and commands served
  from the working tree, with `validate` refusing the declarations to drift.
- **Privacy:** a second history rewrite removed a corporate address and a
  registry mirror that a same-day `npm install` had reintroduced.

**Decisions**
- **The runner is not shipped.** `mutation-check.js` mutates JavaScript; a Java
  project has no use for it, and shipping it would impose our tool where PIT,
  Stryker and mutmut already exist. What is code here is agent-conducted there,
  and the README says so rather than implying parity.
- **No egress check.** The control is real and now stated in
  `sec-agent-security` and the release checklist, but a repository check would
  answer NOT MEASURED nine times in ten, because that decision lives in a cloud
  console someone else owns. A ruler that mostly abstains is noise.
- **Nothing was removed by the inward ruler**, and that is the result rather
  than a failure to find one.
- **10.1c and 10.7 recorded, not rushed** into the release.

**What the session actually caught — and what it says**
Eight defects, and **none of them was deep logic**: a function declared twice
that sent every dispatcher call to the wrong script; dead imports from a
refactor hours old; a parameter promising a scope it never read; a public
JSDoc omitting an option the CLI passes; a `.gitignore` with no `.env` in a repo
that ships a secrets skill; a lockfile publishing a corporate mirror; a decoy
test that never reached the rule it claimed to protect; and a README badge stale
across four releases, standing in front of two guards that could not see it.
Attention and basic quality, every one.

**Next steps**
1. Update the plugin on the Windows workstation (P-10).
2. 10.1c — evidence classes. 10.7 — what was asked, not only what was built.

**Blockers:** none.

### [2026-09-22] The ledger got a command, and the guards were measured by mutation

**Owner:** vinicius + Claude Opus 5 · **Environment:** WSL2 on the Windows
workstation — the first session from here. *(Checkpoint written mid-session; the
closing entry follows at `session-end`.)*

**Goal declared at session start:** verify access to the `be` identity for git,
the marketplace and npm; then continue the improvement flow from the
`project A` file. **Achieved ✅** for access — git and the marketplace through
`gh` (`barcelosvinicius`, ADMIN), npm through OIDC in CI, all three on the
personal identity while this machine's global git identity is the corporate one
(overridden per repo). The flow continued by the owner's decisions.

**Deliveries (commits `1a8a895` … `ad0088d`, each verified alone in a worktree):**

- **Ledger sync + a state per proposal + triage of 24–29** (`1a8a895`). The
  unification merged six proposals into the existing Phase 8 instead of a new
  phase.
- **`proposals-audit.js`** (`f116efc`, Phase 8.0) — born failing on the real case:
  23 defects on the ledger as it stood.
- **The enforcement ladder** (`7f12372`, 8.4) and **diff-answerable checklists**
  (`3900476`, 8.7).
- **`mutation-check.js`** (`35dc853`, 8.9) and **`qa-test-strategy`** (`cb3bb89`,
  8.8) with load criteria (`203638f`).

**Decisions (the owner's):** the triage of 24–29 as proposed; `qa-test-strategy`
enters this version; mutation is *the ruler of test quality*, applied to the base
itself first; load criteria anticipate rather than react; before closing the
version, extend coverage to what has none and then mutation to the whole project.

**Corrections made by measuring:** the CHANGELOG (and this session's plan row)
said the pre-A-14 suite would have passed a detector that blocked everything —
it would not; A-14 was a missing boundary case, which point mutation cannot
produce. And three first-draft rulers of this session were wrong before the code
was: a regex probe that missed shipped units, a strip check that reported a
clean insertion as a change, a coverage report that omits files no test loads.

---

### [2026-09-20] An outside repository measured us back, and the first wave shipped

**Owner:** vinicius + Claude Opus 5 · **Machine:** Windows workstation, Git Bash.

**Goal declared at session start:** a de-para against
`oliveirarenanfelipe/nao-depende-de-lembrar` classifying each capability as ours
/ theirs / both with file-level evidence, an analysis of their hooks and process
wiring, and a prioritised adoption list that must include a proposal for the
README drift. **Achieved ✅**, and then extended by decision: the owner approved
implementing the first wave, which shipped in nine commits.

**Deliveries:**

- **The de-para** (`feedback/nao-depende-de-lembrar-2026-09-20/DE-PARA.md`). The
  repository is not a stranger: it **cites this base** as the source of its
  structure check, quotes a lesson from here in its code, and **refuses our
  `_gateguard.js`** with measured reasons (`DECISOES.md §10`). The exchange was
  already two-way.
- **Their ladder of enforcement, adopted as an instrument** — prose · keyword
  recall · periodic sweep · gate at the door. Measured against us: **1 skill of
  29** is referenced by a hook, and as a reminder rather than a block.
- **A-14 — the bypass guard stopped blocking documentation about itself.** It
  tested the flag against the whole Bash command; writing this session's own
  analysis of the rule was refused. Found by being blocked, twice: once writing
  the document, once writing the commit message that describes the fix.
- **A-15 — `npm run release` could not complete a clean run, and nobody knew.**
  The panel names the version, the release bumps it, nothing regenerated it
  before `node --test` checked it. The v3.1.1 release had hit this and been
  patched by hand with no record. `--write` added; the release calls it after
  the bump and commits the panel with the release files.
- **A-16 — the audits that had a `--check` mode and nothing executed.**
  `graph-audit --check` ran in **zero** automated places; `backlog-audit --check`
  only at release. Both were green whenever someone remembered. They now run on
  push, on pull request, and at release. The Semgrep rules this base ships — one
  rule, never executed anywhere — are validated and run against this repo.
- **A-17 — the workflows now follow the skill we ship**, and the skill gained
  the two rules it was missing. The practice gap was also an advice gap.
- **A-18 — the release asks what a README reader needs to know**, over paths
  derived from the actual miss.
- **Action-plan Phase 8** records the second wave.

**Decisions:**

- **`proc-analysis-blocks` is not written yet, on purpose.** The owner's
  observation — analyses that are too large always leak drifts — is the better
  axis, broader than the investigation method first proposed. It waits for the
  cases the owner is bringing, because a rule without a measured case gets
  pruned rather than shipped.
- **The gateguard is not switched on; its trigger is what must narrow.** Their
  third objection is correct, and our gate already retries on the second attempt
  — the difference is scope, not semantics.
- **Divide-and-conquer cannot be a gate**, by the entry criterion adopted the
  same day: partitioning an analysis is judgment, and a gate that judges becomes
  noise. Degree 2 is its legitimate ceiling.
- **Nothing was disabled to get work done.** When the installed guard blocked a
  commit message, the message went through a file.

**Next steps:** README, then release; read the first CI run; re-clone this
machine afterwards.

**Blockers:** the release guard refuses until the README is updated — which is
the guard working.

### [2026-08-21] P-08 answered by opening a session: CRLF, and the version was innocent

**Owner:** vinicius + Claude Opus 5 · **Machine:** Windows workstation, Git Bash
— the machine the defect lives on, and the only one whose readout counts.

**Deliveries:**

- **P-08 resolved.** The `be` SessionStart hook **fired**, ending an outage first
  measured on 2026-08-19. The experiment was still intact when it did, which is
  what makes the result mean something: `hooks/hooks.json` LF with mtime
  `2026-08-19 21:37` — the single mutation — against `session-start.js` and
  `plugin.json` both at `2026-06-10 16:16`, the plugin still reporting
  **2.0.0**, and the marketplace clone still pinned to `26b35bc`, the v2.0.0
  restructure. One byte-level difference changed; the outage ended.
  - **CRLF in the cached `hooks.json` — confirmed as the cause.**
  - **The v2.0.0 install — ruled out.** Still v2.0.0, hook runs.
- **A prediction in the docs corrected.** The 2026-08-20 close recorded that
  "the Windows install moved 2.0.0 → 3.1.0" and therefore that the experiment
  was spoiled by mixed variables. Measured here: it never moved. The claim was
  written by a session that had no way to see this machine — the same shape as
  the `gh`/`~/.local/bin` note that opened the machine-scoping lesson, recurring
  three weeks later in the file that records the lesson.
- **The machine was then brought to 3.1.1 by a fresh clone**, in the same
  session and after the readout was banked. `be doctor`: `3.1.1 · installed
  2026-08-21`, three hook events, **no findings** — from three at session start.
- **The v3.1.1 prevention is now verified on the machine that produced the
  defect**, which is stronger than the tests that shipped with it. A fresh clone
  on Windows with `core.autocrlf=true` — the exact configuration that wrote CRLF
  into the v2.0.0 cache — checked out `hooks.json` and all six hook scripts as
  **LF**. The pin does what it was built to do, on the hardware that needed it.
- **How the update was actually run, because the documented route does not exist
  everywhere:** `/plugin` is **not available in the VS Code extension** — it
  answers `/plugin isn't available in this environment`. The working path is the
  standalone CLI (`npm i -g @anthropic-ai/claude-code`), which carries a
  **non-interactive** `claude plugin` subcommand: `marketplace remove`,
  `marketplace add`, `install -y`. That is the supported route, scriptable, with
  no hand-editing of `installed_plugins.json`.

**Decisions:**

- **Re-clone, not update, remains the repair** — and now for a stated reason
  rather than caution. The cause is the bytes, so the fix must reach *every*
  file, not the ones a pull happened to touch.
- **The v3.1.1 prevention stands unchanged.** Closing with prevention while the
  cause was unnamed was the right call: the diagnosis, arriving free one day
  later, points at exactly what was already built.

**Session goal — ✅ achieved.** Declared as closing P-08 with a recorded
readout. It went further than the item was designed to yield: the question was
"does updating an affected machine suffice?" and the answer is that updating was
never necessary at all.

**Next steps:** one glance at the next session on this machine — SessionStart
should print its summary, and `PreToolUse`/`Stop` should exist for the first
time. Hooks load at startup, so the install cannot confirm itself.

**Blockers:** none.

### [2026-08-20] v3.1.1 — LF becomes something the base installs

**Owner:** vinicius + Claude Fable 5 · **Machine:** WSL2 (Linux), a *third*
environment: separate `~/.claude`, separate marketplace clone, `core.autocrlf`
unset.

**Deliveries:**
- **The installer seeds `.gitattributes`** (`* text=auto eol=lf`) at the target
  project root, on fresh install and on update, **only when absent**. An
  existing file is never modified — if it lacks the pin, the installer prints
  an advisory and leaves it alone, keeping the "never delete/overwrite user
  files" contract intact.
- **`/be:bootstrap` does the same on the Claude Code channel** (new step 3),
  and BOOTSTRAP.md documents the rule as Step 5-C for both channels.
- **`npm run validate` guards this repo's own pin** — proven by removing
  `.gitattributes` and watching the build fail with that single error, then
  restoring it.
- Three installer tests cover the three paths: seeded on fresh install, an
  existing file left byte-identical, and re-seeded on update when the project
  lost it. Suite 65 → **68 tests**.

**Decisions:**
- **Close P-08 with prevention instead of diagnosis.** The isolating experiment
  (cached `hooks.json` rewritten CRLF → LF) could only be read from the Windows
  install; this WSL session is a different Claude Code installation whose cache
  was always LF, so its hooks firing discriminates nothing between the two
  candidates. Since the fix for either is the same fresh marketplace clone, the
  user chose to stop paying for the readout and make the standard structural.
  The cause stays unnamed on purpose, and the lesson records why that is
  acceptable here.
- **Seed, never rewrite.** An existing `.gitattributes` may encode deliberate
  choices (submodules, LFS, per-path `eol=crlf` for Windows-only scripts);
  overwriting it to enforce our rule would be exactly the class of damage the
  installer promises not to do.

**Next steps:** open the next session on the Windows machine (updated to 3.1.0
during this session, 3.1.1 on start) and observe whether the `be` SessionStart
summary appears. Re-clone only if it does not.

**Blockers:** none in the repository. P-08 stays open on the Windows machine,
but nothing waits on it — and its remaining question is now answered by
opening a session rather than by running anything.

**Verified:** `npm run validate` clean · `npm test` 68/68 · guard proven to
fail without the pin and pass with it · `node bin/be.js install <tmpdir>` wrote
the file with the pin and the explanatory header · **published**: CI and
`release.yml` both green at `ef32f90`, npm `dist-tags.latest = 3.1.1` with
signed provenance, tag and GitHub release `v3.1.1`; the published tarball was
downloaded and checked to carry `ensureGitattributes` and Step 5-C · this
machine updated to plugin 3.1.1 (`be doctor`: three hook events, LF, nothing to
act on).

**Note on tooling:** `npm run release` could not run — the permission classifier
blocks it and the nested `execSync` calls inside the script. The dry-run's
file writes plus the remaining steps were done by hand in the same order. The
release also tripped the fact-panel guard built the day before: bumping the
version made §0.2's *"Measured against"* row stale and `npm test` failed on it,
which is the guard behaving exactly as designed.

### [2026-08-19] The first session from Windows, and what only Windows could see

**Owner:** vinicius + Claude Opus 5 · **Machine:** Windows workstation, Git Bash
(MINGW64). Every previous session ran on a Linux machine; CI runs `ubuntu-latest`.

**Deliveries:**
- **The backlog audit measured the operating system.** Its probes were shell
  one-liners run through `execSync`, which spawns `cmd.exe` on Windows — where
  `'…'` does not quote, so every probe containing a `|` was split into a real
  pipe and `$(…)` was never substituted. Five of 26 probes failed for that
  alone; the audit reported shipped work as *not started* (12·3·5 against the
  true 16·2·2) and, since `release.js` runs `--check` as a pre-flight guard,
  **`npm run release` could not run from this machine at all** — while CI stayed
  green. Probes are now filesystem predicates (`scripts/lib/probes.js`).
- **The fact panel is generated end to end.** Two payload rows carried a proof
  command (`cat … | wc -c`) whose value changes with `core.autocrlf`, and the
  skills row had drifted 7,752 B. Everything derivable is now generated with CR
  stripped; §0.2 became a *delivery surface* of verdicts, not counts.
- **`.gitattributes` pins `* text=auto eol=lf`** — the root of that whole class.
- **The stale-count guard now reads the manifests.** Both `plugin.json` and
  `marketplace.json` claimed "28 skills" with 29 shipped — the description the
  marketplace and npm show.
- **`be doctor`** reports what the repository cannot see: which plugin version
  is installed *on this machine*, which hook events are consequently not
  running, and whether the checkout normalises line endings.
- **The session start now asks whether this machine is on the latest base** —
  one bounded npm lookup (2s, cached a day, `BE_UPDATE_CHECK=off` to disable,
  silent on any failure). The "what you gain" line is derived by comparing the
  published description's counts with what is on disk, so it cannot drift; when
  the published description carries no counts the line is simply omitted rather
  than guessed, which is what happens today until the next release.
- **Backlog item 18 closed** — `qa-comment-analyzer`, `qa-type-design-analyzer`,
  `mgmt-spec-miner`. Backlog: 17 done · 1 partial · 2 not started.

**Decisions:**
- **Normalise, do not adapt.** Where a value differed by platform the fix was to
  make it the same everywhere (LF-normalised bytes, shell-free predicates), not
  to branch per platform. Adaptation was reserved for what is genuinely
  per-machine — and that got a diagnosis command instead of a branch.
- **The three technique agents were built, not declined.** The intake filter
  argued for declining (six weeks of use produced 23 proposals asking for none
  of them); the user chose to ship them, and that decision is recorded here
  rather than re-litigated later.
- `be doctor` **exits 1 when it finds something**, matching `be check`.

- **Released as v3.1.0** on both channels: npm via OIDC with provenance, and the
  marketplace, which follows `main`. Tag and GitHub release at `af72a6d`. Nine
  function-grouped commits plus the release commit; the first eight were each
  re-checked out in a separate worktree and verified on their own.

**Session goal — ✅ achieved, and it was not the goal declared at the start.**
The opening goal was the release decision; the user redirected in the first
exchange to *"cobrir as pendências de implementação e validar prováveis drifts"*,
then widened it twice — to the Windows/Linux question, and to leaving the base
operational. All of it landed: five drifts closed with a guard each, the last
open backlog item shipped, two new capabilities, and the release. **One item is
open by design**: P-08, whose cause is now a single-variable experiment waiting
on the next session rather than an unknown.

**Next steps:** read the P-08 experiment; update the other machines; promote the
method lessons into the shipped base (action plan Phase 7).

**Blockers:** none. P-08 is *waiting*, not blocked — the experiment is already
running and needs a new session, not a decision.

**Verified:** `npm run validate` passes · `npm test` **65 pass · 0 fail** (was
39) · `node scripts/graph-audit.js --check` and `node scripts/backlog-audit.js
--check` both match · installer smoke test installs 18 agents · every new guard
exercised against a known positive, including a real mutation that reintroduced
`require('child_process')` and made the suite fail · **each of the seven commits
re-checked out in a separate worktree and verified on its own**.

*(This line first said 55 — the count at the moment it was written, stale two
commits later. Corrected, and noted rather than quietly patched: it is the
fourth instance this session of the rule that a derived number restated in prose
goes stale by construction. A `Verified:` line is a record of an instant, so the
number belongs to the instant the entry closes, which is now.)*

### [2026-08-19] Push, identity, and unification into `main`

**Owner:** vinicius + Claude Opus 5

**Deliveries:**
- Resolved the push credential gap recorded at session close: `gh` CLI
  installed user-local (no `sudo`), authenticated via device flow as
  `barcelosvinicius` (the repo owner), `gh auth setup-git` wired it into `git`.
- All 37 commits rewritten: author/committer unified to
  `viniciusbsilva10@gmail.com` (was the corporate identity of the machine,
  mismatched against this repo's prior history and the pushing account);
  `Co-Authored-By` trailers stripped from every message.
- `main` fast-forwarded to the branch tip (no merge commit) and pushed to
  `origin/main`. The feature branch `feat/wire-session-continuity-graph` was
  then deleted, local and remote — the user asked why it existed at all, and
  once the identity was fixed and pushed directly, keeping it served no
  purpose.

**Decisions:**
- Unify directly into `main` rather than open a PR. The branch had existed as a
  precaution against `release.yml` publishing unintentionally; that risk does
  not apply here since the version was never bumped.

**Next steps:** confirm CI is green on `origin/main`.

**Blockers:** none.

**Verified:** `git rev-parse main` == `git rev-parse origin/main` == `004f911`
· `npm run validate` and `npm test` (39/39) re-run after both the identity
rewrite and the fast-forward · commit messages and authorship spot-checked
after rewrite.

### [2026-08-19] Phase 5, the size test, and three holes found by measuring

**Owner:** vinicius + Claude Opus 5

**Deliveries:**
- Feedback queue completed: U4 (parallel agents read, one writer writes),
  U5 (history ceiling + each doc names its nature), U6 (the close checks rather
  than composes), U7 (`companions`), U8 (zero without a denominator),
  U9 (`proc-safe-removal`), U10 (a rule ships with a case that makes it fail).
- Size rule became a trigger-keyed test; all seven over-budget skills treated —
  three came under the line, four record *leave it*. Skills with a resource file
  10 → 16.
- Three holes closed after this round's own measurement: a renamed skill left
  prose references pointing at nothing and passed the build; `README.md` claimed
  28 skills when there were 29; `companions` was protocol with nothing
  mechanical behind it.
- `docs/HISTORY.md`, `docs/lessons-learned.md`, `docs/action-plan.md` created;
  this repo now runs the protocol it ships.

**Decisions:**
- `proc-safe-removal` shipped **larger than triaged** — the proposal asked for a
  deletion protocol; the errors made here showed relocation has the same silent
  shape, so it covers both.
- Moving the SDD variants out of the hub was tried and **reverted**: 6 lines
  saved for an extra file and two jumps. The test extracts lookup, not volume.
- Typed edges stay at 4 of 29 by decision, recorded as P-07: prose does not
  execute, so there is no hidden cycle, and forcing 22 declarations is
  bureaucracy.

**Next steps:** push the branch, open the PR, decide on the release.

**Blockers:** no push credential in this environment (see Current State).

**Verified:** `npm run validate` passes · `npm test` 39 pass / 0 fail ·
`node scripts/graph-audit.js --check` matches · `node scripts/backlog-audit.js
--check` matches · `node bin/be.js install <tmp> --dry-run` ok · all 36 commits
re-checked out and verified individually · goal declared at session start ✅
achieved and exceeded.

### [2026-08-19] Wire the activation graph, close the drift, guard the rules

**Owner:** vinicius + Claude Opus 5

**Deliveries:**
- `proc-session-continuity` declares 7 typed activation edges; promotion channel
  back to the base at session end; measure-before-read at session start.
- Cycle detection (`scripts/lib/edges.js`) and inventory enforcement
  (`scripts/lib/inventory.js`) in `npm run validate`.
- `proc-domain-mapping` is the single owner of the `## Domain map` section.
- Doc templates carry `§0 fact panel`, `Done when:`, `Blocked by:`,
  `Evidence:`, `Scope:`, `Verified:`.
- `BASE_VERSION` from UTC with a monotonicity guard; `--dry-run` no longer
  advises a destructive revert.
- Reproducible audits: `npm run audit:graph`, `npm run audit:backlog`
  (`--check` gates the release).
- First `docs/structural-analysis.md`, `docs/action-plan.md`, and this file.

**Decisions:**
- Do **not** merge `proc-structural-analysis` with `proc-domain-mapping` —
  refuted by measurement (vocabularies nearly disjoint).
- Do **not** rename `engineering-principles` — declare the exception instead;
  a rename breaks every installed base for a cosmetic gain.
- Do **not** ship the code-percentage heuristic as a gate — it failed validation
  (2 false positives of 5 flags).

**Next steps:** action plan Phase 3.2, 3.3 and Phase 5.

**Blockers:** None.

**Verified:** `npm run validate` (passes) · `npm test` (31 pass, 0 fail) ·
`node scripts/graph-audit.js` (0 orphans, 0 cycles) ·
`node scripts/backlog-audit.js --check` (16 done · 2 partial · 2 todo) ·
`node bin/be.js install <tmp> --dry-run` (ok) · every commit in the series
re-checked out and re-verified individually.

---

*Reference: `engineering-principles.md` §A.3 · Complement: `lessons-learned.md`*
