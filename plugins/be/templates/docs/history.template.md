# 📋 Session History — [PROJECT]

> **Mandatory continuity file.** Every new work session (human or
> AI-assisted) **must** consult this file before starting any task.
> At the end of each significant session, it **must** update the corresponding section.
>
> **Management complement:** `docs/lessons-learned.md` records errors and
> lasting rules. This file records **operational state** — what is in
> progress, what has been completed, and what needs immediate attention.
>
> Reference: `engineering-principles.md` §A.3 (Session Continuity / Session Briefs).

---

## How to use this file

### Session start (mandatory)

1. Read the **Current State** section below
2. Check **Blockers** and **Next Steps**
3. Consult `lessons-learned.md` for errors to avoid
4. Start work with full context

### Session end (mandatory)

1. Update **Current State** with what was done
2. Move completed items to **Delivery History**
3. Update **Next Steps** and **Blockers**
4. If there was an error or relevant discovery → record it in `lessons-learned.md`

### Format of each entry

```
### [YYYY-MM-DD] Short session title

**Owner:** Name or agent
**Deliveries:** What was completed
**Decisions:** Technical or product decisions made
**Next steps:** What the next session should do, each with its done-criterion
**Blockers:** Identified impediments (or "None")
**Verified:** How the declared session goal was checked (command + result),
  or ❌ and what prevented it
```

> The close **checks** what was recorded during the session; it does not
> compose it from memory. A long session is compacted, and context that was
> never written down is not recoverable — record the fact when it changes, and
> use the close to confirm the record matches what the commits show.

---

## Current State

> ⚡ Last updated: [YYYY-MM-DD]

**Project phase:** [e.g.: Initial setup / Active development / Stabilization]
**Current sprint:** Consult `docs/processo/SCRUM.md` for details

### In progress

<!-- List what is being worked on now -->
- [item in progress]

### Recently completed

<!-- List deliveries from the last days/weeks -->
- [recently completed item]

### Blockers

<!-- List active impediments or "No active blockers." Each blocker states what
     would clear it, so it can be closed by someone other than its author. -->
- No active blockers.

### Priority next steps

<!-- Number in priority order. Each step carries how you will know it is done —
     verifiable by command — and what must be true first. A step with no
     done-criterion is a feeling and will still be here next month; a step whose
     criterion depends on an open blocker is a trap that looks resolved. -->
1. [most urgent next step] — **done when:** `[command / observable result]` ·
   **blocked by:** [item ID, or "nothing"]
2. [second most urgent] — **done when:** `[…]` · **blocked by:** [...]
3. Consult `docs/structural-analysis.md` for technical pending items

---

## Delivery History

> Reverse chronological record (most recent first). Each entry is immutable —
> but this section is **compacted**, not grown without bound. See below.

### Compaction rule — this file has a ceiling

The session protocol reads this file **first, every session**. Left alone it
only grows: measured in a real project, 1,092 → 1,650 lines in fifteen days
(+51%), 244 KB, with one line of 5,967 characters — large enough to be unusable
as a first read.

The three living docs have **different natures, and only one of them compacts**:

| File | Nature | Maintenance |
|---|---|---|
| `HISTORY.md` | operational state | **compact** — the past is archived, not deleted |
| `structural-analysis.md` | current X-ray | **replace** — a fact that changed is rewritten, never appended beside the old one |
| `lessons-learned.md` | historical record | **grows** — it is supposed to; never compact it |

**When:** at session close, if this file passes **~800 lines** (`wc -l`).

**How:**
1. Keep in `Delivery History` the entries from the **last 90 days** (or the last
   ~10 sessions, whichever is more).
2. Move older entries verbatim into `docs/history/YYYY-Qn.md` — moving, not
   summarising: a decision loses its "why" the moment it is paraphrased.
3. Leave one index line per archived quarter here, with its date range.
4. Verify the move by counting, not by reading: entry headings before must equal
   entry headings after, across the pair (see `proc-safe-removal`).

**Never compact `Current State`, `Blockers` or `Next Steps`** — those are not
history, they are the file's reason to exist.

### [YYYY-MM-DD] Initial project setup

**Owner:** [name]
**Deliveries:**
- Engineering base set up (Claude Code plugin `be`, or `.be/` via the npm installer)
- AI context file deployed (`CLAUDE.md`; mirrors for other tools — see BOOTSTRAP.md Step 2)
- `docs/` initialized with folder structure

**Decisions:**
- Chosen stack: [technologies]
- [important architectural decision]

**Next steps:** Implement RF-01 to RF-[N] according to `REQUISITOS.md`
**Blockers:** None
**Verified:** `[command]` → [result]

---

*Reference: `engineering-principles.md` §A.3 · Complement: `lessons-learned.md`*
