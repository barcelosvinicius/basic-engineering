---
name: be-api-error-handling
description: >
  Use when creating a centralized exception handler, adding new error types,
  or defining a REST API's error response contract. Exception hierarchy,
  HTTP status mapping, and RFC 9457 problem-details format, with a Spring
  Boot example as a resource.
---

# Skill: API Error Handling

Universal error-handling patterns for REST APIs. Use when creating the
centralized exception handler, defining status codes, or implementing
consistent error responses in any project with a REST API.

## Principles

1. **One centralized handler** — controllers/routes never format errors
   themselves; a single middleware/handler maps exceptions to responses.
2. **Typed exception hierarchy** — business code throws semantic exceptions;
   the handler owns the HTTP mapping:

```
RuntimeException (base)
├── ResourceNotFoundException (404)
├── BusinessRuleException (422 Unprocessable Entity)
├── UnauthorizedException (401)
├── ForbiddenException (403)
├── ConflictException (409)
└── ValidationException (400)
```

3. **Never leak internals** — no stack traces, SQL, or framework messages in
   responses. Log the full error server-side with a correlation ID; return a
   friendly message.
4. **Machine-readable contract** — use the problem-details format
   (RFC 9457, formerly RFC 7807):

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

Validation errors additionally carry a field→message map in an `errors`
property.

## Exception-to-HTTP-status mapping

| Exception | Status | When to use |
|-----------|--------|-------------|
| `ResourceNotFoundException` | 404 | Entity does not exist |
| `UnauthorizedException` | 401 | Not authenticated |
| `ForbiddenException` | 403 | Authenticated but no permission |
| `ConflictException` | 409 | State conflict, duplicate idempotency key |
| `BusinessRuleException` | 422 | Valid input, business rule violated |
| `ValidationException` | 400 | Malformed/invalid input data |
| Unmapped exception | 500 | Always log; return generic message |

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Stack trace in the response | Raw exception message exposed | Log it; return a friendly problem-details body |
| 500 returned for a 404 case | Business exception not mapped | Map every semantic exception in the handler |
| Different error shapes per endpoint | Ad-hoc error formatting | Single handler, single contract |
| Sensitive data in `detail` | Echoing internal state | Review messages — they are part of the public API |

## Resources

- [examples-spring.md](examples-spring.md) — Spring Boot
  `@ControllerAdvice` GlobalExceptionHandler with `ProblemDetail`.
