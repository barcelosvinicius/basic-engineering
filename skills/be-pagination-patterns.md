---
name: be-pagination-patterns
description: >
  Server-side pagination pattern with Pageable and Page<T> for REST endpoints that return
  collections. Use when implementing any list endpoint — never return List<> without
  pagination, because that causes timeouts and performance degradation as data grows.
---

# Skill: REST Endpoint Pagination

## What this skill is

Defines the server-side pagination pattern for list endpoints. Use when implementing
or fixing any endpoint that returns collections of data.

> **Why it is critical:** endpoints without pagination return all records at once.
> As data grows, this causes timeouts, memory overflow, and performance degradation
> for all users simultaneously.

---

## Spring Boot pattern — full implementation

### 1. Repository

```java
// Before (problematic)
List<Transaction> findByUserId(Long userId);

// After (correct)
Page<Transaction> findByUserId(Long userId, Pageable pageable);

// With filters
Page<Transaction> findByUserIdAndTransactionDateBetween(
    Long userId,
    LocalDate start,
    LocalDate end,
    Pageable pageable
);
```

### 2. Service

```java
@Transactional(readOnly = true)
public Page<TransactionResponse> findAll(Long userId, Pageable pageable) {
    return transactionRepository
        .findByUserId(userId, pageable)
        .map(this::toResponse);  // map preserves pagination metadata
}
```

### 3. Controller

```java
@GetMapping
public ResponseEntity<Page<TransactionResponse>> findAll(
        @PageableDefault(size = 30, sort = "transactionDate",
                         direction = Sort.Direction.DESC) Pageable pageable) {
    Long userId = getCurrentUserId();
    return ResponseEntity.ok(transactionService.findAll(userId, pageable));
}
```

**`@PageableDefault` — recommended parameters:**

| Parameter | Suggested value | Rationale |
|-----------|-----------------|-----------|
| `size` | 20–50 | Balance between UX and performance |
| `sort` | Date or relevance field | Most common ordering first |
| `direction` | `DESC` for dates | Most recent first |
| `max size` | 100 | Never allow unlimited size |

```java
// Limit maximum page size (avoid abuse)
// In application.properties:
spring.data.web.pageable.max-page-size=100
spring.data.web.pageable.default-page-size=30
```

### 4. Paginated response DTO

Spring's `Page<T>` interface already serializes the correct metadata, but it is recommended
to create an explicit DTO to control what is exposed:

```java
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isFirst(),
            page.isLast()
        );
    }
}
```

```json
// Expected response
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

---

## Query parameters accepted automatically

Spring automatically converts query params to `Pageable`:

```
GET /api/transactions?page=0&size=30&sort=transactionDate,desc
GET /api/transactions?page=1&size=20&sort=amount,asc&sort=transactionDate,desc
```

| Param | Type | Example |
|-------|------|---------|
| `page` | int (0-based) | `?page=0` |
| `size` | int | `?size=30` |
| `sort` | `field,direction` | `?sort=date,desc` |

---

## Cursor vs offset strategy

**Offset** (`page=N`) — Spring default, suitable for most cases:
- ✅ Simple to implement and navigate
- ✅ Allows jumping to any page
- ⚠️ Performance degrades for very high pages (`OFFSET 10000` is slow)

**Cursor** (based on last ID or date) — for feeds and long high-frequency lists:
- ✅ Constant performance regardless of position
- ✅ Consistent even when data is inserted/removed during navigation
- ⚠️ Does not allow jumping to an arbitrary page

```java
// Simple cursor by ID
Page<Transaction> findByUserIdAndIdLessThan(
    Long userId, Long cursorId, Pageable pageable);

// Frontend sends: ?cursorId=1234&size=30
// Backend returns: { content: [...], nextCursor: 1205, hasMore: true }
```

Use cursor when: real-time activity feed, notification list, chat.
Use offset when: filtered tables, reports, pagination with "go to page N".

---

## Pagination on the frontend (Angular)

```typescript
// Paginated response model
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Service
getTransactions(page = 0, size = 30): Observable<PageResponse<Transaction>> {
  const params = new HttpParams()
    .set('page', page)
    .set('size', size)
    .set('sort', 'transactionDate,desc');
  return this.http.get<PageResponse<Transaction>>('/api/transactions', { params });
}
```

```typescript
// Component — load more (infinite scroll)
loadMore(): void {
  if (this.currentPage >= this.totalPages - 1) return;
  this.currentPage++;
  this.service.getTransactions(this.currentPage).subscribe(result => {
    this.items = [...this.items, ...result.content];
    this.totalPages = result.totalPages;
  });
}

// Component — traditional pagination
goToPage(page: number): void {
  this.service.getTransactions(page).subscribe(result => {
    this.items = result.content;
    this.currentPage = result.page;
    this.totalPages = result.totalPages;
  });
}
```

---

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| `findAll()` returns `List<>` | Repository does not use `Pageable` | Change to `Page<>` + `Pageable` |
| Sorting ignored | `sort` in `@PageableDefault` without confirming it in the repository | Verify that the field exists in the entity |
| `size=0` accepted | No minimum size validation | Add `@Min(1)` to the parameter or use `max-page-size` |
| Very large page is slow | High OFFSET in SQL | Consider cursor for extreme cases |
| Frontend adds duplicates | Data inserted between offset pages | Use cursor or accept it as expected behavior |

---

*Skill — `.github/skills/be-pagination-patterns.md`*
*Reference: `engineering-principles.md` §1.2 (Perceived Performance), §6.4 (Backend)*
*Pending item: C-01 in `structural-analysis.md`*
