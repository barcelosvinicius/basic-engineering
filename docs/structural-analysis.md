# Structural Analysis — basic-engineering (`be`)

> Technical X-ray of the plugin/distribution repo itself. Written to the format
> `feedback/project-a-2026-08-19/SUGESTOES.md` §3 asks for: **every number
> carries the command that produces it and the date it was measured.**
> A value without a date is forbidden; a fact without a command is an impression.
>
> Reference: `engineering-principles.md` §11.1 (Conscious Technical Debt).

**Last updated:** 2026-08-19 · **Measured against:** `be` 3.0.0 · `BASE_VERSION v20260617-000002`

---

## §0 — Verifiable fact panel

Run from the repo root. Re-run this whole section on every release; a stale row
is a defect, not a detail.

### §0.1 — Inventory

| Fact | Proof command | Value | Measured on |
|---|---|--:|---|
| Skills shipped | `ls plugins/be/skills \| wc -l` | **28** | 2026-08-19 |
| Agents shipped | `ls plugins/be/agents/*.md \| wc -l` | **15** | 2026-08-19 |
| Slash commands | `ls plugins/be/commands/*.md \| wc -l` | **11** | 2026-08-19 |
| Hook scripts | `ls plugins/be/hooks/scripts/*.js \| wc -l` | **5** | 2026-08-19 |
| Hook events wired | `node -p "Object.keys(require('./plugins/be/hooks/hooks.json').hooks).join(',')"` | **3** (SessionStart, PreToolUse, Stop) | 2026-08-19 |
| Doc templates | `ls plugins/be/templates/docs/ \| wc -l` | **11** | 2026-08-19 |
| Config data files | `ls plugins/be/config/ \| wc -l` | **2** (stack-mappings, install-profiles) | 2026-08-19 |
| Skills payload | `cat plugins/be/skills/*/SKILL.md \| wc -c` | **131,501 B** | 2026-08-19 |
| Agents payload | `cat plugins/be/agents/*.md \| wc -c` | **50,128 B** | 2026-08-19 |

### §0.2 — Activation graph

Measured with `scripts/graph-audit.js` (see *Applied Fixes*), which resolves
references by exact skill/agent name rather than by prefix regex.

| Fact | Proof command | Value | Measured on |
|---|---|--:|---|
| Skills citing ≥1 other skill | `node scripts/graph-audit.js` | **21 / 28** | 2026-08-19 |
| Skills citing **no** other skill (leaves) | idem | **7 / 28** | 2026-08-19 |
| Skills cited by **nothing** (orphans) | idem | **0** (was 3 earlier today — see A-03) | 2026-08-19 |
| Agents delegating to ≥1 other agent | idem | **15 / 15** | 2026-08-19 |
| Highest in-degree skill | idem | **`proc-session-continuity` — 18 inbound** | 2026-08-19 |
| Out-degree of that same skill | idem | **7** declared, typed (was 1 earlier today — see A-03) | 2026-08-19 |
| Read-only agents (`tools:` restricted) | `grep -l '^tools: Read, Grep, Glob, Bash$' plugins/be/agents/*.md \| wc -l` | **9 / 15** | 2026-08-19 |
| Agents declaring `model:` | `grep -l '^model:' plugins/be/agents/*.md \| wc -l` | **15 / 15** | 2026-08-19 |
| Agents carrying prompt-injection defense | `grep -lie 'prompt.injection\|prompt defense\|untrusted' plugins/be/agents/*.md \| wc -l` | **15 / 15** | 2026-08-19 |
| Skills over the ~150-line budget | `for f in plugins/be/skills/*/SKILL.md; do [ $(wc -l < $f) -gt 150 ] && echo $f; done \| wc -l` | **7** | 2026-08-19 |

> **Reading of §0.2 — the finding, and its fix.** As first measured today, the
> node with the **highest in-degree (18)** had an **out-degree of 1**, and that
> single edge was a reference, not a delegation: `proc-session-continuity` ran at
> the start *and* end of every session and forwarded to nothing. Three working
> skills (`proc-learning-trail`, `proc-skill-creator`, `sec-agent-security`) were
> reachable only if the user remembered their name. It was a **wiring** defect,
> not a missing-capability defect — the capability was already shipped. Fixed the
> same day (A-03): out-degree **7**, orphans **0**, cycles **0**.

### §0.3 — Delivery surface

| Fact | Proof command | Value | Measured on |
|---|---|--:|---|
| Version triple in sync | `npm run validate` | **PASS** (3.0.0 × 3) | 2026-08-19 |
| Test suite | `npm test` | **25 pass · 0 fail** | 2026-08-19 |
| Living docs in this repo | `ls docs/` | **1** (this file) | 2026-08-19 |
| Backlog items shipped | `node scripts/backlog-audit.js` | **16 done · 2 partial · 2 todo** (of 20) | 2026-08-19 |
| Invoke cycles in the activation graph | `npm run validate` | **0** | 2026-08-19 |

---

## §1 — What the repo is

One canonical source (`plugins/be/`) distributed two ways:

| Layer | Path | Role |
|---|---|---|
| Canonical content | `plugins/be/` | skills · agents · commands · hooks · templates |
| Claude Code plugin | `.claude-plugin/marketplace.json` | marketplace manifest |
| npm installer | `bin/be.js` + `lib/installer.js` | copies `plugins/be/` into a target project's `.be/` |
| Validation | `scripts/validate.js` | frontmatter · manifests · version sync · guide drift |
| Feedback intake | `feedback/` | dated snapshots from real projects → `BACKLOG.md` |

**Dependency direction:** `bin/` → `lib/` → `plugins/be/` (content is a leaf;
nothing in `plugins/be/` imports repo code). No layer violation found.

---

> **Open items are scheduled in [`action-plan.md`](action-plan.md)** — phases,
> done-criteria and blockers live there, not in a second place.

## §2 — Technical pending items

Every item carries **how we will know it is done**, verifiable by command
(SUGESTOES §5), plus **what must be true first** (SUGESTOES §16). An item
without a done-criterion is a feeling; one with an unreachable criterion is a trap.

### 🔴 Critical

*No critical pending items. P-01 closed 2026-08-19 — see Applied Fixes A-03.*

### 🟠 Important

#### P-04 — This repo did not follow its own protocol until today
- **Problem:** `docs/HISTORY.md`, `docs/lessons-learned.md` do not exist; this
  file is the first living doc. The repo prescribing session continuity did not
  practise it, so the plugin has no record of its own decisions since 3.0.0.
- **Done when:** `ls docs/` lists `structural-analysis.md`, `HISTORY.md`, and
  `lessons-learned.md`, and the Stop hook stops firing its reminder on a
  code-changing session.
- **Blocked by:** nothing.

#### P-05 — Nothing forces the backlog status to be re-run *(mostly addressed)*
- **Where:** `feedback/BACKLOG.md`, `scripts/backlog-audit.js`
- **Problem:** the backlog stated "nothing implemented yet" for two months while
  **16 of its 20 items were shipped**. Worse, hand-counting it produced three
  different wrong answers in one session (10, then 12; the truth is 16) — every
  one plausible, none self-announcing. Causes: a path taken from the item's
  *description* (inherited from another repo) instead of this project's real
  layout, and a case-sensitive `grep` against a capitalised heading.
- **Done so far (2026-08-19, A-05):** status is now a command
  (`node scripts/backlog-audit.js`, `--md` regenerates the table); each item
  declares the checks that prove it; the outbound half of the promotion loop
  landed in A-03.
- **Still open:** nothing re-runs it. The table can go stale between releases.
- **Done when:** the release checklist runs `backlog-audit.js` and refuses a
  release whose committed table differs from the command's output.
- **Blocked by:** nothing.

### 🟡 Minor

#### P-06 — Seven skills exceed the ~150-line budget
- `fe-accessibility-patterns` (293), `fe-ux-patterns` (275),
  `proc-structural-analysis` (255), `proc-domain-mapping` (227),
  `proc-impact-analysis` (207), `proc-skill-creator` (193), `proc-changelog` (158).
- **Two of them grew today** (A-06): `proc-structural-analysis` +12 and
  `proc-skill-creator` +26 lines. The content earns its place, but the honest
  reading is that this item got slightly worse, not better — the overflow
  belongs in sibling resource files.
- **Done when:** the count command above returns only skills that have a sibling
  resource file absorbing the overflow.

---

## §3 — What must not change

Recorded because the temptation in any review is to discard what works.

| Mechanism | Evidence | Verdict |
|---|---|---|
| `Stop` hook is a reminder, never a block | `stop.js` header: *"Reminder only — never blocks"* | keep — correct anti-loop shape |
| `_gateguard.js` fail-open, 30-min expiry, first-edit-per-file only | `_gateguard.js` §header | keep — any new guard must copy this |
| `/be:model-route` reasons by **tier**, not model version | `commands/model-route.md` | keep — survived a model generation unchanged |
| `qa-verification-loop` marks a phase `SKIPPED` **with reason** | skill body | keep — distinguishes "did not run" from "passed" |
| Ship **no** `.mcp.json` | `plugins/be/mcp.recommended.json` is a copy-me template | keep — supply-chain posture |
| Hooks fail-open, opt-out via `BE_HOOKS` / `BE_HOOK_<ID>` | `_lib.js` | keep |

---

## §4 — Applied fixes

| # | Description | File(s) | Date |
|---|---|---|---|
| A-01 | First structural analysis of the repo itself; §0 fact panel established | `docs/structural-analysis.md` | 2026-08-19 |
| A-02 | Graph audit made reproducible instead of ad-hoc grep | `scripts/graph-audit.js` | 2026-08-19 |
| A-03 | **P-01/P-02 closed** — hub declares 7 typed activation edges; orphans 3 → 0; promotion channel back to the base added at session end | `skills/proc-session-continuity`, `skills/sec-secrets-management` | 2026-08-19 |
| A-06 | Templates carry the fields the rules demand: §0 fact panel, `Done when:`/`Blocked by:`, `Evidence:`/`Scope:`, `Verified:` | `templates/docs/*`, `skills/proc-structural-analysis`, `skills/proc-skill-creator` | 2026-08-19 |
| A-05 | Backlog status turned into a command after hand-counting gave three different wrong answers | `scripts/backlog-audit.js`, `feedback/BACKLOG.md` | 2026-08-19 |
| A-04 | **P-03 closed** — `invoke`-cycle detection in `npm run validate`, exercised against planted cycles (`npm test`) and proven end-to-end by temporarily introducing a real cycle | `scripts/lib/edges.js`, `scripts/validate.js`, `test/graph.test.js` | 2026-08-19 |

---

## §5 — Out of scope (conscious decisions)

- **JSON schemas for manifests** (`BACKLOG` 14) and an **always-on `rules/`
  layer** (`BACKLOG` 17): the only two backlog items never started, and six weeks
  of daily use in two real repos produced 23 proposals asking for **neither**
  (`feedback/project-a-2026-08-19/TRIAGEM.md` §3). A `rules/` layer also
  contradicts the on-demand skill model — it spends context on every session to
  serve a few. That is a negative result, and it counts.
- **`/be:cost-report`** (`BACKLOG` 16): `/be:model-route` already covers the
  decision that matters; a tracker is measurement without a decision attached.

---

*Last updated: 2026-08-19 · Reference: `engineering-principles.md` · Re-run §0 before each release.*
