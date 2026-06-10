# API versioning examples — Spring Boot

Supporting material for the `be-api-versioning` skill.

## Prefix per controller (recommended)

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

Global prefix alternative (affects ALL endpoints including health checks):

```properties
server.servlet.context-path=/api/v1
```

## Migrating existing endpoints without breaking clients

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
        return service.findAll(pageable);
    }
}
```

```java
// Phase 2: add Deprecation/Sunset headers to legacy endpoints
@GetMapping("/api/transactions")
public ResponseEntity<Page<TransactionResponse>> findAllLegacy(Pageable pageable) {
    return ResponseEntity.ok()
        .header("Deprecation", "true")
        .header("Sunset", "2026-12-31")  // RFC 8594
        .header("Link", "</api/v1/transactions>; rel=\"successor-version\"")
        .body(service.findAll(pageable));
}
```

```java
// Phase 3: endpoint after sunset
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

## OpenAPI documentation by version (SpringDoc)

```java
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
