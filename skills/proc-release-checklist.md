---
name: proc-release-checklist
description: >
  Universal pre-go-live validation protocol — security, tests, database,
  observability, and rollback plan. Mandatory before any production delivery,
  first deploy, or release with schema changes.
---

# Skill: Release Checklist (Pre-Go-Live)

## What this skill is

Validation protocol before any production delivery — first deploy or
significant new version. Universal: adapt the sections to the project's context.

> **Principle:** A release checklist is not bureaucracy. It is the last line of
> defense before a problem reaches a real user.

---

## When to use it

- First production deploy of a project
- Release with database schema changes
- Release with authentication or security changes
- Release with newly exposed public endpoints
- Any release after an inactivity period > 2 weeks

For small incremental releases (hotfix, visual adjustment), a subset of the
sections below is enough.

---

## 1. Security — mandatory before any public release

- [ ] **Passwords hashed securely**: Argon2id or bcrypt with proper parameters
- [ ] **JWT/tokens**: expiration configured, revocation implemented, strong secret (≥ 256 bits)
- [ ] **Environment variables**: all secrets in env, nothing hardcoded in code
- [ ] **HTTP headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options configured
- [ ] **CORS**: explicit origins configured (no wildcard `*` on credentialed APIs)
- [ ] **Rate limiting**: authentication endpoints and public endpoints protected
- [ ] **File upload**: magic-bytes validation active before processing
- [ ] **SQL**: confirmation of parameterized queries (no input concatenation)
- [ ] **Dependency audit**: no open critical or high CVEs (`npm audit`, `mvn dependency-check`)
- [ ] **Minimum pentest**: IDOR tested, brute force tested, post-logout token tested

---

## 2. Database

- [ ] **Versioned migrations**: all schema changes are in Flyway/Liquibase migrations
- [ ] **Validated backup**: recent backup tested (restore verified, not just snapshot)
- [ ] **Indexes created**: dashboard/report queries checked with EXPLAIN
- [ ] **Rollback planned**: rollback strategy documented if the migration is destructive
- [ ] **RLS / isolation**: if multi-user system, data isolation validated

---

## 3. Backend / API

- [ ] **Health check**: `/health` endpoint or equivalent working and monitored
- [ ] **Required variables**: startup fails clearly if a required variable is missing
- [ ] **Timeouts**: external calls with explicit timeout configured
- [ ] **Error handling**: GlobalExceptionHandler does not expose stack trace to the client
- [ ] **Logs**: structured, without PII or secrets; correlation ID per request
- [ ] **Pagination**: list endpoints do not return all records without pagination

---

## 4. Frontend

- [ ] **Environment variables**: API URLs not hardcoded; env file configured
- [ ] **Production build**: build with minification and tree-shaking enabled
- [ ] **Lazy loading**: initial bundle does not load all modules
- [ ] **Console errors**: zero errors in the console during normal usage flow
- [ ] **No-JS flow**: fallback page or proper message if JS is disabled
- [ ] **Accessibility**: axe/Lighthouse with no critical errors in the main flows

---

## 5. Observability

- [ ] **Alerts configured**: alert for error rate above baseline
- [ ] **Metrics dashboard**: latency, error rate, throughput visible
- [ ] **Runbook**: document describing what to do if the system becomes unavailable
- [ ] **On-call contact**: who to contact if there is an incident outside business hours

---

## 6. Process

- [ ] **REQUISITOS.md**: FRs implemented in this release marked as ✅
- [ ] **structural-analysis.md**: new pending items discovered during the release recorded
- [ ] **HISTORY.md**: release entry created with what was delivered and decisions made
- [ ] **User documentation**: COMO_USAR.md updated with new functionality (if applicable)
- [ ] **Maintenance window**: users notified if downtime is expected
- [ ] **Rollback plan**: documented procedure if the release needs to be reverted

---

## 7. Post-deploy validation (first 30 minutes)

```
□ Application responds (health check green)
□ Login works
□ Main critical flow (e.g.: create transaction, import CSV) works
□ Logs with no unexpected critical errors
□ Latency metrics within baseline
□ No user reported a problem in the first accesses
```

---

## Release record format

Add to `HISTORY.md`:

```markdown
### [YYYY-MM-DD] Release [version or description]

**Owner:** [name]
**Deliveries:**
- [RF-XX] [feature description]
- [fix] [bug fix description]

**Release checklist:** ✅ Complete | ⚠️ Pending items: [list]
**Decisions:** [decisions made during the release]
**Next steps:** [what to monitor in the next hours/days]
**Blockers:** None
```

---

*Skill — `.github/skills/proc-release-checklist.md`*
*Reference: `engineering-principles.md` §2 (Security), §9 (Observability), §10 (CI/CD)*
