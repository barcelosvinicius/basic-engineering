---
name: be-api-versioning
description: >
  Use when creating the initial structure of a REST API, introducing a
  breaking change, or migrating unversioned endpoints to a versioned model.
  URL-prefix strategy (/api/v1/), breaking-change criteria, deprecation
  lifecycle with Sunset headers, and a phased migration checklist.
---

# Skill: REST API Versioning

Defines the versioning strategy for REST endpoints.

> **Why it matters:** without versioning, any breaking change forces all
> clients to update at the same time. With versioning, the API can evolve
> while keeping compatibility with clients that have not migrated yet.

## Recommended strategy — URL prefix

```
/api/v1/transactions       ← current version
/api/v2/transactions       ← new version (when there is a breaking change)
/api/transactions          ← temporary alias for /api/v1 during migration
```

**Why URL instead of header:** easier to test (curl, browser, logs), more
explicit in documentation and bookmarks. Header versioning
(`Accept-Version: v2`) is cleaner but less visible.

Centralize the prefix in one constant/config so controllers/routes never
hand-type it.

## When to create v2

Create a new version only for **breaking changes**:

| Change | Breaking? | Action |
|--------|-----------|--------|
| Add optional field to response | ❌ | No new version needed |
| Add new endpoint | ❌ | No new version needed |
| Remove field from response | ✅ | New version required |
| Rename field | ✅ | New version required |
| Change field type | ✅ | New version required |
| Change behavior of an existing endpoint | ✅ | New version required |

## Version lifecycle

```
v1: Active       → used in production by everyone
v1: Deprecated   → announcement with sunset date (minimum 3 months)
v1: Sunset       → returns 410 Gone with migration link
v1: Removed      → endpoint deleted from the code
```

Deprecated endpoints must signal it in-band with standard headers:

```
Deprecation: true
Sunset: 2026-12-31                                  (RFC 8594)
Link: </api/v1/transactions>; rel="successor-version"
```

After sunset, return `410 Gone` with a body pointing to the successor route.

## Migration checklist (for unversioned projects)

```
Phase 1 — Add version (without breaking change):
□ Centralize the /api/v1 prefix constant
□ Add /api/v1/* to all routes
□ Keep /api/* as alias (no deprecation yet)
□ Update clients to use /api/v1/*
□ Commit and deploy

Phase 2 — Deprecate the unversioned route:
□ Add Deprecation + Sunset headers to /api/* endpoints
□ Announce the sunset date
□ Monitor logs to check whether legacy routes are still called

Phase 3 — Remove the legacy route:
□ Confirm in the logs that no client uses /api/*
□ Replace /api/* endpoints with 410 Gone
□ After the stabilization period: remove legacy code
```

## Documentation

Publish one API-docs group per version (e.g., separate OpenAPI groups for
`/api/v1/**` and `/api/v2/**`) so clients browse only the version they use.

## Resources

- [examples-spring.md](examples-spring.md) — Spring Boot implementation:
  prefix constant, legacy-route coexistence, Deprecation/Sunset headers,
  410 Gone responder, SpringDoc `GroupedOpenApi` per version.
