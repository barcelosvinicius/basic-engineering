# Runbook: [Operation Name]

> **Authorization level:** [everyone / tech lead / devops]
> **Impact:** [none / users affected / system unavailable]
> **Estimated duration:** [X minutes]

---

## When to use this runbook

<!-- Describe when this runbook is needed -->
- [scenario 1]
- [scenario 2]

---

## Prerequisites

<!-- Required tools and access -->
- [ ] Access to the server / environment
- [ ] [tool] installed
- [ ] Environment variables configured

---

## Steps

### 1. Check current state

```bash
# Diagnostic commands
[command]
```

**Expected output:**
```
[expected output]
```

**If output differs:** [what to do]

---

### 2. [Step name]

```bash
[command]
```

⚠️ **Attention:** [important warnings before executing]

---

### 3. Verify result

```bash
# Confirm the operation succeeded
[verification command]
```

**Success criteria:** [what confirms it worked]

---

## Rollback

If something goes wrong:

```bash
# Undo the operation
[rollback command]
```

---

## Post-execution

- [ ] Record the operation in `docs/processo/operacoes.md` (date, who, reason)
- [ ] Notify the team if the operation affected users
- [ ] Update this runbook if the procedure changed

---

*Runbook — `docs/processo/runbooks/[name].md`*
*Last updated: [date]*
