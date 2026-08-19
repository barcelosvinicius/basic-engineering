# Impact analysis — PR template and automation

Loaded on demand from `proc-impact-analysis`. The PR description template is
what you fill in after the analysis, and the automation snippet is what you
paste into a pipeline — both are consulted, not used to decide. The five steps
that produce the analysis stay in `SKILL.md`.

---

## Step 5 — PR description template

Paste the following into the PR description after running the analysis:

```markdown
## Impact Analysis

**Risk level:** [🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical]

**Changed files:** N
**Directly affected consumers:** N files
**Affected flows:** [flow names]
**Bounded contexts touched:** [context names]

### High-risk files
- [ ] [path] — [reason for high risk]

### Impact review checklist
[paste the checklist generated in Step 4]

### Rollback plan
[describe how to revert if necessary — or "N/A — purely additive change"]
```

---


---

## Automation hint

For projects with CI/CD:

```yaml
# .github/workflows/ci.yml — add to PR trigger
- name: Impact analysis report
  run: |
    git diff --name-only origin/main > /tmp/changed-files.txt
    # Pass to an AI agent using proc-impact-analysis skill
    # Output as a PR comment via gh pr comment
```

The analysis can be automated as a CI step that posts the impact summary
as a PR comment before reviewers are assigned.
