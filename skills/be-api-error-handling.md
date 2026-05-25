---
name: be-api-error-handling
description: >
  Define hierarquia de exceções, status HTTP e padrões de response de erro para APIs REST.
  Usar ao criar GlobalExceptionHandler, adicionar novos tipos de erro ou definir
  o contrato de resposta de erro da API.
---

# Skill: Tratamento de Erros da API (Universal)

## O que é esta skill

Padrões universais de tratamento de erros para APIs REST. Usar ao criar o handler
centralizado de exceções, ao definir status codes ou ao implementar responses de erro
consistentes em qualquer projeto com API REST.

---

## Hierarquia de exceções recomendada

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

## Formato de response de erro (RFC 7807 / ProblemDetail)

```json
{
  "type": "https://api.exemplo.com/errors/resource-not-found",
  "title": "Recurso não encontrado",
  "status": 404,
  "detail": "Transação com ID 42 não foi encontrada",
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
        detail.setTitle("Recurso não encontrado");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(detail);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> errors = e.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        detail.setTitle("Dados inválidos");
        detail.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(detail);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGeneric(Exception e) {
        log.error("Erro inesperado", e);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno — tente novamente"
        );
        detail.setTitle("Erro interno");
        return ResponseEntity.internalServerError().body(detail);
    }
}
```

---

## Mapeamento de exceções para status HTTP

| Exceção | Status | Quando usar |
|---------|--------|------------|
| `ResourceNotFoundException` | 404 | Entidade não existe |
| `UnauthorizedException` | 401 | Sem autenticação |
| `ForbiddenException` | 403 | Sem permissão |
| `ConflictException` | 409 | Idempotency key duplicada |
| `BusinessRuleException` | 422 | Regra de negócio violada |
| `ValidationException` | 400 | Dados de entrada inválidos |

---

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Stack trace no response | `e.getMessage()` retorna trace | Nunca expor stack trace — logar e retornar mensagem amigável |
| Status 500 para 404 | Exceção não mapeada | Mapear todas as exceções de negócio no handler |
| Response sem `Content-Type` | Handler sem `@ResponseBody` | Usar `ResponseEntity<ProblemDetail>` |

---

*Template universal — `.github/base/skills/be-api-error-handling.md`*
*Adaptar para a hierarquia de exceções específica de cada projeto*
