---
name: be-api-versioning
description: >
  /api/v1/ versioning strategy for REST endpoints — version creation, lifecycle,
  migration without breaking change, and gradual deprecation. Use when creating the initial
  structure of an API or migrating endpoints to a versioned model.
---

# Skill: REST API Versioning

## What this skill is

Defines the versioning strategy for REST endpoints. Use when creating the initial
structure of an API or migrating existing endpoints to a versioned model.

> **Why it matters:** without versioning, any breaking change forces all
> clients to update at the same time. With versioning, the API can evolve
> while keeping compatibility with clients that have not migrated yet.

---

## Recommended strategy — URL prefix

```
/api/v1/transactions       ← current version
/api/v2/transactions       ← new version (when there is a breaking change)
/api/transactions          ← temporary alias for /api/v1 during migration
```

**Why URL instead of header:**
- Easier to test (curl, browser, logs)
- More explicit in documentation and bookmarks
- Headers (`Accept-Version: v2`) are cleaner but less visible

---

## Spring Boot — implementation

### Base configuration

```java
// All routes under /api/v1/
@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController { ... }
```

```java
// Or via global prefix (application.properties)
server.servlet.context-path=/api/v1
// Warning: affects ALL endpoints including the health check
```

### Recommended approach — prefix per controller

```java
// Centralized constant avoids typos
public final class ApiVersion {
    public static final String V1 = "/api/v1";
    private ApiVersion() {}
}

@RestController
@RequestMapping(ApiVersion.V1 + "/transactions")
public class TransactionController { ... }

@RestController
@RequestMapping(ApiVersion.V1 + "/incomes")
public class IncomeController { ... }
```

### Migrating existing endpoints (without breaking clients)

```java
// Phase 1: keep old route + create new one
@RestController
public class TransactionController {

    // New route (explicit v1)
    @GetMapping("/api/v1/transactions")
    public Page<TransactionResponse> findAll(Pageable pageable) {
        return service.findAll(pageable);
    }

    // Legacy route — keep during the transition period
    @GetMapping("/api/transactions")
    @Deprecated
    public Page<TransactionResponse> findAllLegacy(Pageable pageable) {
        // Redirect to v1 or keep working
        return service.findAll(pageable);
    }
}
```

```java
// Phase 2: add Deprecation header to legacy endpoints
@GetMapping("/api/transactions")
public ResponseEntity<Page<TransactionResponse>> findAllLegacy(Pageable pageable) {
    return ResponseEntity.ok()
        .header("Deprecation", "true")
        .header("Sunset", "2026-12-31")  // RFC 8594
        .header("Link", "</api/v1/transactions>; rel=\"successor-version\"")
        .body(service.findAll(pageable));
}
```

---

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

---

## Version lifecycle

```
v1: Active       → used in production by everyone
v1: Deprecated   → announcement with sunset date (minimum 3 months)
v1: Sunset       → returns 410 Gone with migration link
v1: Removed      → endpoint deleted from the code
```

```java
// Endpoint with sunset
@GetMapping("/api/v1/old-endpoint")
public ResponseEntity<?> sunsetEndpoint() {
    return ResponseEntity.status(HttpStatus.GONE)
        .header("Link", "</api/v2/new-endpoint>; rel=\"successor-version\"")
        .body(Map.of(
            "error", "This endpoint was disabled on 2026-12-31.",
            "migration", "/api/v2/new-endpoint"
        ));
}
```

---

## OpenAPI documentation by version

```java
// SpringDoc — separate configuration by version
@Bean
public GroupedOpenApi v1Api() {
    return GroupedOpenApi.builder()
        .group("v1")
        .pathsToMatch("/api/v1/**")
        .build();
}

@Bean
public GroupedOpenApi v2Api() {
    return GroupedOpenApi.builder()
        .group("v2")
        .pathsToMatch("/api/v2/**")
        .build();
}
```

Access: `GET /swagger-ui.html` → select the version in the dropdown.

---

## Migration checklist (for unversioned projects)

```
Phase 1 — Add version (without breaking change):
□ Create ApiVersion.V1 constant
□ Add /api/v1/* to all controllers
□ Keep /api/* as alias (no deprecation yet)
□ Update frontend to use /api/v1/*
□ Commit and deploy

Phase 2 — Deprecate unversioned route:
□ Add Deprecation + Sunset headers to /api/* endpoints
□ Announce sunset date
□ Monitor logs to check whether legacy routes are still being called

Phase 3 — Remove legacy route:
□ Confirm that no client uses /api/* in the logs
□ Replace /api/* endpoints with 410 Gone
□ After the stabilization period: remove legacy code
```

---

*Skill — `.github/skills/be-api-versioning.md`*
*Reference: `engineering-principles.md` §4.4 (API Versioning)*
*Pending item: I-07 in `structural-analysis.md`*
