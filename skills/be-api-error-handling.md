---
name: be-api-error-handling
description: >
  Defines exception hierarchy, HTTP statuses, and error response patterns for REST APIs.
  Use when creating a GlobalExceptionHandler, adding new error types, or defining
  the API's error response contract.
---

# Skill: API Error Handling (Universal)

## What this skill is

Universal error-handling patterns for REST APIs. Use when creating the centralized
exception handler, defining status codes, or implementing consistent error responses
in any project with a REST API.

---

## Recommended exception hierarchy

```
RuntimeException (base)
├── ResourceNotFoundException (404)
├── BusinessRuleException (422 Unprocessable Entity)
├── UnauthorizedException (401)
├── ForbiddenException (403)
├── ConflictException (409)
└── ValidationException (400)
```

---

## Error response format (RFC 7807 / ProblemDetail)

```json
{
  "type": "https://api.example.com/errors/resource-not-found",
  "title": "Resource not found",
  "status": 404,
  "detail": "Transaction with ID 42 was not found",
  "instance": "/api/v1/transactions/42",
  "timestamp": "2026-03-15T10:30:00Z"
}
```

---

## Spring Boot — GlobalExceptionHandler

```java
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(ResourceNotFoundException e) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, e.getMessage()
        );
        detail.setTitle("Resource not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(detail);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> errors = e.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        detail.setTitle("Invalid data");
        detail.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(detail);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGeneric(Exception e) {
        log.error("Unexpected error", e);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "Internal error — please try again"
        );
        detail.setTitle("Internal error");
        return ResponseEntity.internalServerError().body(detail);
    }
}
```

---

## Exception-to-HTTP-status mapping

| Exception | Status | When to use |
|-----------|--------|-------------|
| `ResourceNotFoundException` | 404 | Entity does not exist |
| `UnauthorizedException` | 401 | No authentication |
| `ForbiddenException` | 403 | No permission |
| `ConflictException` | 409 | Duplicate idempotency key |
| `BusinessRuleException` | 422 | Business rule violated |
| `ValidationException` | 400 | Invalid input data |

---

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Stack trace in the response | `e.getMessage()` returns trace | Never expose stack trace — log it and return a friendly message |
| 500 status for 404 | Exception not mapped | Map all business exceptions in the handler |
| Response without `Content-Type` | Handler without `@ResponseBody` | Use `ResponseEntity<ProblemDetail>` |

---

*Universal template — `.github/base/skills/be-api-error-handling.md`*
*Adapt to the project-specific exception hierarchy*
