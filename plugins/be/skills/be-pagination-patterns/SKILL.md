---
name: be-pagination-patterns
description: >
  Use when implementing or fixing any REST endpoint that returns a
  collection. Never return an unbounded list — server-side pagination with
  offset or cursor strategies, response contract, and limits. Spring Boot and
  Angular examples as on-demand resources.
---

# Skill: REST Endpoint Pagination

Defines the server-side pagination pattern for list endpoints.

> **Why it is critical:** endpoints without pagination return all records at
> once. As data grows, this causes timeouts, memory overflow, and performance
> degradation for all users simultaneously.

## Rules

1. **Every collection endpoint is paginated** — no exceptions for "small"
   tables; they grow.
2. **Sane defaults, hard limits:** default page size 20–50; maximum page size
   capped server-side (e.g., 100) — never trust the client's `size`.
3. **Deterministic ordering:** always apply an explicit sort (typically most
   recent first); unordered pagination produces duplicates and gaps.
4. **Explicit response contract** — return pagination metadata alongside the
   data, never a bare array:

```json
{
  "content": [...],
  "page": 0,
  "size": 30,
  "totalElements": 247,
  "totalPages": 9,
  "first": true,
  "last": false
}
```

Standard query parameters: `?page=0&size=30&sort=createdAt,desc` (offset) or
`?cursorId=1234&size=30` (cursor).

## Offset vs cursor

**Offset** (`page=N`) — default, suitable for most cases:
- ✅ Simple; allows jumping to any page.
- ⚠️ Performance degrades at very high offsets (`OFFSET 10000` is slow);
  rows inserted mid-navigation shift pages (duplicates).

**Cursor** (based on last ID or timestamp) — for feeds and high-frequency lists:
- ✅ Constant performance at any position; consistent under concurrent writes.
- ⚠️ No jumping to an arbitrary page.
- Response shape: `{ content: [...], nextCursor: 1205, hasMore: true }`.

Use cursor for: real-time activity feeds, notifications, chat.
Use offset for: filtered tables, reports, "go to page N" UIs.

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Endpoint returns unbounded list | Repository method without pagination | Make pagination part of the data-access signature |
| Sorting silently ignored | Sort field doesn't exist in the model | Validate sort fields against an allowlist |
| `size=0` or `size=100000` accepted | No bounds validation | Enforce min 1 / server-side max |
| Very high page is slow | High SQL OFFSET | Switch to cursor for deep navigation |
| Frontend shows duplicates | Inserts between offset pages | Use cursor or de-duplicate by ID client-side |

## Resources

- [examples-spring-angular.md](examples-spring-angular.md) — full Spring Boot
  implementation (repository → service → controller → `PageResponse` DTO,
  `@PageableDefault`, max-page-size config, cursor query) and Angular
  client (typed model, service, infinite scroll + classic pagination).
