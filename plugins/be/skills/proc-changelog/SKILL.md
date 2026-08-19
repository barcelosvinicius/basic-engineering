---
name: proc-changelog
description: >
  Use when preparing a release, creating release notes, generating
  user-facing updates, or closing a sprint with deliverables. Maintains
  CHANGELOG.md from Conventional Commits following Keep a Changelog + SemVer.
---

# Skill: Changelog Generation

## What this skill is

Defines the process for maintaining `CHANGELOG.md` following the
[Keep a Changelog](https://keepachangelog.com) standard with Conventional Commits.
Use when preparing releases, creating release notes, or documenting changes for users.

---

## CHANGELOG.md format

Keep a Changelog layout, with a worked example of `[Unreleased]` and two
released versions, in [format-reference.md](format-reference.md).

## Conventional Commits → sections mapping

| Commit type | Changelog section | Include? |
|------------|-------------------|----------|
| `feat:` | **Added** | ✅ Always |
| `fix:` | **Fixed** | ✅ Always |
| `perf:` | **Changed** | ✅ Always |
| `refactor:` | **Changed** | ⚠️ If it affects observable behavior |
| `security:` or `fix(security):` | **Security** | ✅ Always |
| `docs:` | — | ❌ Do not include |
| `test:` | — | ❌ Do not include |
| `chore:` | — | ❌ Do not include (except deps) |
| `chore(deps):` or Dependabot | **Security** | ✅ If a CVE was fixed |
| `ci:` | — | ❌ Do not include |

---

## How to generate changelog from git commits

```bash
# View commits since the last tag
git log v1.1.0..HEAD --oneline --no-merges

# More detailed format
git log v1.1.0..HEAD \
  --pretty=format:"- %s (%h)" \
  --no-merges \
  | grep -E "^- (feat|fix|perf|refactor|security)"

# View all existing tags
git tag --sort=-version:refname | head -10
```

---

## Release process — step by step

```
1. Create section [x.y.z] above [Unreleased]
   └── Move items from [Unreleased] to the new section

2. Filter: include only feat, fix, perf, security
   └── Translate into user-facing language (not technical)

3. Sort within each section: impact → stability → security
   └── Most impactful to the user comes first

4. Review: each line must answer "what can the user do now?"
   └── ❌ "refactors TransactionService to use Strategy pattern"
   └── ✅ "Transaction categorization is now 30% faster"

5. Commit together with the release code
   └── git commit -m "chore(release): v1.2.0 — changelog and version bump"
```

---

## Semantic versioning (SemVer)

MAJOR / MINOR / PATCH rules and the pre-1.0 caveat are in
[format-reference.md](format-reference.md).

## User-oriented writing

```
❌ Technical (do not include in the public changelog):
"Adds composite index (date, user_id) to the transactions table"
"Refactors GlobalExceptionHandler to use ProblemDetail"

✅ User-oriented:
"Transaction history now loads up to 3x faster"
"Error messages now indicate the specific field with a problem"
```

---

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Outdated changelog | Not updated at merge time | Update `[Unreleased]` in every feat/fix PR |
| Too technical items | Copying commits without filtering | Filter to feat, fix, perf, security and translate |
| Versions without date | Release date not recorded | Always include the date in YYYY-MM-DD format |
| Duplicate version | Numbering error | Check git tags before creating a new section |

---

## Resources

- [format-reference.md](format-reference.md) — the Keep a Changelog file layout
  with a worked example, and the SemVer rules.

---

*Reference: [Keep a Changelog](https://keepachangelog.com) · [SemVer](https://semver.org)*
