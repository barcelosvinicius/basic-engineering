# Pagination examples — Spring Boot + Angular

Supporting material for the `be-pagination-patterns` skill.

## Spring Boot — full implementation

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

`@PageableDefault` recommended parameters:

| Parameter | Suggested value | Rationale |
|-----------|-----------------|-----------|
| `size` | 20–50 | Balance between UX and performance |
| `sort` | Date or relevance field | Most common ordering first |
| `direction` | `DESC` for dates | Most recent first |
| max size | 100 | Never allow unlimited size |

```properties
# application.properties — limit maximum page size (avoid abuse)
spring.data.web.pageable.max-page-size=100
spring.data.web.pageable.default-page-size=30
```

### 4. Paginated response DTO

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

### Query parameters handled automatically

```
GET /api/transactions?page=0&size=30&sort=transactionDate,desc
GET /api/transactions?page=1&size=20&sort=amount,asc&sort=transactionDate,desc
```

### Cursor query

```java
// Simple cursor by ID
Page<Transaction> findByUserIdAndIdLessThan(
    Long userId, Long cursorId, Pageable pageable);

// Frontend sends: ?cursorId=1234&size=30
// Backend returns: { content: [...], nextCursor: 1205, hasMore: true }
```

## Angular — client side

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
