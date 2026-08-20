# Lessons Learned — basic-engineering

> Errors, discoveries and lasting rules. Entries are immutable — an outdated
> lesson is marked ✅, never deleted. This file **should** grow; it is a
> historical record, the opposite in nature from the fact panel in
> `docs/structural-analysis.md`, which must stay current.
>
> `Evidence:` states how the lesson is known — an unlabelled hypothesis
> inherits the authority of a measurement. `Scope: method` marks a lesson that
> does not depend on this project; in this repo that means it belongs in the
> shipped base, not only here.
>
> Reference: `engineering-principles.md` §11.2, §11.4.

---

## Process

### [2026-08] If you distribute files, you own how they land on the other machine

**Context:** the plugin's hooks never executed on the Windows workstation, while
another plugin — installed the same way, same day, same scope, also
auto-discovered from `hooks/hooks.json` — ran its hooks in the same session.

**Problem:** after manifest shape, schema, scope, enablement and script presence
were checked and all matched, exactly one mechanical difference remained. The
working plugin ships a `.gitattributes` pinning `* text=auto eol=lf`, so its
installed copy is LF. This base shipped none, so a clone made on Windows
(`core.autocrlf=true`) wrote **CRLF** into every file of the plugin cache — the
manifest the loader reads included. Whether that is the cause is not yet known;
what is certain is that the repository never decided what its files would look
like on the machines it ships to, and inherited whatever each machine's git
config chose.

**Rule:** a repository that distributes files decides their line endings, in
`.gitattributes`, from the first commit. Anything else delegates a property of
your artefact to a setting on someone else's machine. And note the shape of the
fix: `.gitattributes` in a *fresh* clone produces LF, but an existing clone
keeps CRLF in files git has no reason to rewrite — so the repair for an affected
machine is to re-clone, not to update.

**Evidence:** measured 2026-08-20 — `head -c 4` on both installed manifests
(`{\r\n` against `{\n`), and `.gitattributes` present in one repo and absent in
the other. An experiment isolating the variable is recorded as P-08.
**Scope:** method — every repo that ships files, not only this one.

### [2026-08] A fact about tooling belongs to a machine, not to a project

**Context:** the first session run from the Windows workstation, reading a
`HISTORY.md` written entirely on a Linux machine.

**Problem:** the recorded resolution of a blocker said the `gh` CLI was
installed at `~/.local/bin` without `sudo`. On this machine that path does not
exist and `gh` is the system install — so a true, useful note read as a false
claim, and the first instinct was to treat it as drift and "fix" it. The same
shape hides worse: the installed plugin version, which hooks exist, whether the
checkout normalises line endings, and which shell `execSync` spawns are all
**per machine**, and the repository cannot see any of them.

**Rule:** when a living doc records a fact about tooling, paths, credentials or
installed versions, **name the machine or environment it holds for**. An
unscoped environment fact is a claim about every machine, and it will be false
on the next one. Where the fact matters operationally, do not record it at all —
have a command report it, which is why `be doctor` exists.

**Evidence:** measured — `~/.local/bin` absent, `gh` at `/c/Program Files/GitHub CLI`,
`wsl -l -v` shows no user distro, and this project's transcript directory held
exactly one session (this one) on 2026-08-19.
**Scope:** method — belongs in the base's session-continuity protocol.

### [2026-08] A guard that shells out measures the shell

**Context:** `scripts/backlog-audit.js` decided each backlog item by running a
shell one-liner through `execSync`.

**Problem:** on Windows `execSync` spawns `cmd.exe`, where `'…'` is not a
quoting construct. Every probe containing a `|` — a regex alternation like
`'pin|version'` — was split into a real pipe, and `$(…)` was never substituted.
Five of 26 probes failed for that reason alone. The audit then reported shipped
work as **not started**, and because a release guard reads it, `npm run release`
refused to run from that machine. On Linux, and therefore in CI, everything was
green. The failure was silent, inverted, and shaped like the platform.

**Rule:** a check that decides a fact must not delegate to a shell. Read the
filesystem, parse the file, compare in the language you already have. Where a
shell is unavoidable, the verdict must be proven on every platform that runs it
— otherwise the check measures the interpreter, not the corpus.

**Evidence:** measured — `12 done · 3 partial · 5 not started` from the shell
version against `16 · 2 · 2` from the predicates, same commit, same day.
**Scope:** method.

### [2026-08] Fail-open plus silence makes absence indistinguishable from calm

**Context:** the plugin's guardrail hooks — secret scanning, linter-config
protection, `--no-verify` blocking, the session-end reminder.

**Problem:** hooks are fail-open by design, and that design is right: a
guardrail must never break the session. But the installed plugin on this machine
was v2.0.0 from two months earlier, carrying **one hook script of five**. So
four guardrails simply did not exist, every session looked exactly as it should,
and the base that prescribes verification had no way to report its own absence.
Nothing was broken; nothing was running either.

**Rule:** fail-open is correct for the guardrail and insufficient for the
system. Anything that degrades silently needs a second channel that can be
**asked** — a diagnosis that states what is installed, what is declared, and
what is consequently not running. Keep the failure silent; make the state
interrogable.

**Evidence:** measured — session transcript shows zero hook records for `be`
against four for a plugin installed the same way, and `be doctor` names the two
hook events (`PreToolUse`, `Stop`) not running here.
**Scope:** method.

### [2026-08] The same document, one session: generated rows held, hand-kept rows drifted

**Context:** adding three agents while the fact panel of
`docs/structural-analysis.md` had a generated half and a hand-kept half.

**Problem:** the generated rows **failed the build** until every count was
corrected. The hand-kept rows beside them — agents shipped, read-only agents,
`model:` declared, prompt-injection defense — kept claiming the inventory of an
hour earlier and said nothing. Four wrong rows, produced inside the very session
whose subject was drift.

**Rule:** this is the controlled version of the lesson recorded above about
counts restated in prose — same file, same session, same author, and the only
variable was whether a command produced the row. Stop arguing the point: if a
number is derivable, generate it; if it is not derivable, do not write it as a
number. The panel is now generated end to end, and what remains hand-kept are
verdicts (`PASS`, `0 failures`), which do not go stale the way counts do.

**Evidence:** measured — 2026-08-19, `graph-audit --check` failed on the
generated rows while the hand-kept table stayed silently wrong.
**Scope:** method.

### [2026-08] A ruler written from the rule's wording measures the wording

**Context:** measuring the plugin's activation graph, its trigger conformance,
and which backlog items were implemented.

**Problem:** four independent measurements were wrong in the same way, and
**none announced itself** — each returned a plausible number.
- A prefix regex `\b(proc|be|qa|…)-[a-z-]+` silently skipped
  `engineering-principles`, which carries no prefix: 9 graph leaves reported
  instead of 7, and the second most-referenced skill invisible.
- A trigger check for `Use (when|for|before)` returned 25/28 and would have
  "refuted" a correct claim; three skills write *"Use **at** project kickoff"*.
  The real figure is 28/28.
- Backlog items were probed at the paths in the item's *description* (inherited
  from another repo) instead of this project's real layout: two items reported
  as never started were shipped.
- A case-sensitive `grep provenance` missed the heading `## Provenance`.

**Rule:** design the check against the **artefact's actual habit**, not against
the sentence of the rule; then feed it a **known positive case and confirm it
fails** before trusting a pass. Hand-counting is not a fallback — it produced
three different answers (10, 12, 16) for one backlog in one session. Turn the
count into a command.

**Evidence:** measured — `node scripts/graph-audit.js`, `node scripts/backlog-audit.js`, 2026-08-19.
**Scope:** method — promoted into the base as the U10 discipline and enforced in
`test/graph.test.js` and `test/inventory.test.js`.
**Reference:** `feedback/project-a-2026-08-19/SUGESTOES.md` §23.

### [2026-08] When a new check fires, first ask whether the check is wrong

**Context:** two rulers written this session fired on their very first run.

**Problem:** in one case the corpus was wrong (`README.md` claimed 28 skills
when there were 29 — a real defect). In the other the *ruler* was wrong: the
dangling-reference check flagged `be-caching-patterns` and
`proc-incident-response`, which are the hypothetical names in a good/bad naming
example, not references to anything. Treating the second as a corpus defect
would have "fixed" correct documentation.

And the negative test written to prove that same check was itself invalid: the
mutation used `qa-security-reviewerX`, whose capital letter the pattern cannot
match at all, so nothing was detected and the check briefly looked broken.

**Rule:** a check's first run is data about **the check** as much as about the
corpus — read both before acting. And a known positive case must be
**representative**, not merely wrong: a mutation the pattern cannot match proves
nothing about the pattern.

**Evidence:** measured — both runs on 2026-08-19, both resolved by inspection.
**Scope:** method — extends the ruler discipline in `qa-verification-loop`.
**Reference:** `feedback/project-a-2026-08-19/SUGESTOES.md` §23.

### [2026-08] A count restated in prose goes stale by construction

**Context:** the same figure written in two places — an inventory count in
`README.md`, and a per-skill line count inside the pending item that tracked
those skills.

**Problem:** both drifted within hours of being written, in a session whose
entire subject was preventing drift. `README.md` said 28 skills from the moment
there were 29; the P-06 table's "after" column was stale for two skills and
missing a third.

**Rule:** do not restate a derived number in prose. Either a command generates
it, or it is not written down. Where the historical value matters, keep the
"before" — which is fixed — and let the current value live only in the generated
block. The generated §0.2 of `structural-analysis.md` survived thirteen commits
unchanged while the hand-kept table beside it drifted twice; same document, same
day, same author, and the only variable was whether a command produced the row.

**Evidence:** measured — `npm run validate` now fails on both classes.
**Scope:** method.

### [2026-08] An undeclared exception becomes someone else's measurement error

**Context:** `engineering-principles` is the only skill without a prefix, by
decision, and that decision was written nowhere.

**Problem:** the convention drifted from silent-exception to measurement bug —
every tool built on the prefix convention inherited the blind spot.

**Rule:** an exception to a convention is part of the convention. Declare it in
one place and let tooling read it from there.

**Evidence:** measured — the wrong leaf count above traces directly to it.
**Scope:** method.

### [2026-08] Read the generator before "fixing" the documentation

**Context:** a drift finding claimed `BASE_VERSION`'s documented format lied,
because a committed value used the time field as a sequence.

**Problem:** the finding was wrong. `scripts/release.js` generates a real
timestamp; the odd values are legacy from before that script existed. Acting on
the finding would have propagated the error into six files that document the
format correctly.

**Rule:** when documentation and data disagree, read the **code that produces
the data** before changing either. The real drift was underneath: the generator
used local time while `CONTRIBUTING.md` documents UTC — invisible until someone
released from another timezone.

**Evidence:** measured — `grep getHours scripts/release.js`, 2026-08-19.
**Scope:** method.

### [2026-08] A criterion that greps a string will match the prose that explains it

**Context:** the done-criterion for removing a duplicated schema was
`grep -rl entry_module` returns 0.

**Problem:** the replacement text explained *why the schema was removed* and
named the field, so the criterion kept failing after a correct fix. A second
version of the criterion was also wrong: it would have forced deleting a
heading the skill legitimately owns.

**Rule:** write the criterion against the **structural form** the defect takes
(a schema lives in a code block), not against a word that also appears in prose
about it. And test the criterion on the current state before adopting it — a
criterion that cannot distinguish "not done" from "done" is not a criterion.

**Evidence:** measured — both criterion versions failed on a correct fix.
**Scope:** method.

### [2026-08] A dry run that writes files must not advise a destructive revert

**Context:** `npm run release -- --dry-run` writes the release files on purpose
so the diff can be read, and it skips the clean-tree guard.

**Problem:** it printed `git checkout -- <all release files>` as the revert
instruction. That is the one mode where those files may hold unrelated
uncommitted work — following the advice would have destroyed this session's
`CHANGELOG.md`.

**Rule:** any instruction a tool prints must be safe in the state that tool
creates. If the tool relaxed a guard, the advice has to account for it.

**Evidence:** measured — reproduced on 2026-08-19, then fixed and re-proved.
**Scope:** method.

### [2026-08] Slice markdown by verified line ranges, not by string index arithmetic

**Context:** extracting two sections from a `SKILL.md` into a resource file.

**Problem:** combining `str.index()` slicing with a later `replace()` on the
same string duplicated content — the file went from 219 to 376 lines and the
resource came out empty. It looked like a successful edit.

**Rule:** for structural edits to a document, resolve the boundaries as **line
numbers**, assert each anchor is unique first, and verify the delta (line counts
before/after, key blocks present in the destination and absent from the source)
before moving on.

**Evidence:** measured — 219 → 376 lines, resource file 7 lines with 0 of the
moved content.
**Scope:** method.

---

*Last updated: 2026-08-20 (session close) · Reference: `engineering-principles.md` §11.2, §11.4*
