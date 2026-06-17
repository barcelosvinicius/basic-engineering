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
**Next steps:** What the next session should do
**Blockers:** Identified impediments (or "None")
```

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

<!-- List active impediments or "No active blockers." -->
- No active blockers.

### Priority next steps

<!-- Number in priority order -->
1. [most urgent next step]
2. [second most urgent]
3. Consult `docs/structural-analysis.md` for technical pending items

---

## Delivery History

> Reverse chronological record (most recent first). Each entry is immutable.

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

---

*Reference: `engineering-principles.md` §A.3 · Complement: `lessons-learned.md`*
