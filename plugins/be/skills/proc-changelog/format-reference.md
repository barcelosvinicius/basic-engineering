# CHANGELOG format and SemVer reference

Loaded on demand from `proc-changelog`. A worked file layout and the SemVer
rules are what you compare against while writing — not what you use to decide
what goes in a release.

---

## CHANGELOG.md format

```markdown
# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Added
- New features not yet in production

---

## [1.2.0] — 2026-04-15

### Added
- RF-25: Nubank CSV import with duplicate detection
- RF-26: File type validation using magic bytes

### Changed
- Dashboard now highlights the emergency reserve
- /api/v1/transactions endpoint performance improved (index added)

### Fixed
- Bug #47: commitment showed NaN when income was zero
- Timeout on CSV imports with more than 500 lines

### Security
- JJWT update 0.12.3 → 0.12.6 (CVE-2024-XXXX)

---

## [1.1.0] — 2026-03-01
...
```

---


---

## Semantic versioning (SemVer)

```
MAJOR.MINOR.PATCH

MAJOR: breaks compatibility (e.g.: endpoint change, API field removal)
MINOR: new feature without breaking changes (e.g.: new endpoint, new report)
PATCH: bug or vulnerability fix without a new feature
```

For projects in active development (before stable production):
- Use `0.x.y` — MINOR for features, PATCH for fixes
- Promote to `1.0.0` on the first stable production deploy

---

