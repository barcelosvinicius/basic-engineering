---
name: be-api-versioning
description: >
  Estratégia de versionamento /api/v1/ para endpoints REST — criação de versão, ciclo de
  vida, migração sem breaking change e deprecação gradual. Usar ao criar a estrutura inicial
  de uma API ou ao migrar endpoints para um modelo versionado.
---

# Skill: Versionamento de API REST

## O que é esta skill

Define a estratégia de versionamento para endpoints REST. Use ao criar a estrutura
inicial de uma API ou ao migrar endpoints existentes para um modelo versionado.

> **Por que é importante:** sem versão, qualquer mudança breaking força todos os
> clientes a atualizar simultaneamente. Com versão, é possível evoluir a API
> mantendo compatibilidade com clientes que ainda não migraram.

---

## Estratégia recomendada — prefixo de URL

```
/api/v1/transactions       ← versão atual
/api/v2/transactions       ← nova versão (quando houver breaking change)
/api/transactions          ← alias temporário para /api/v1 durante migração
```

**Por que URL em vez de header:**
- Mais fácil de testar (curl, browser, logs)
- Mais explícito em documentações e bookmarks
- Headers (`Accept-Version: v2`) são mais limpos mas menos visíveis

---

## Spring Boot — implementação

### Configuração base

```java
// Todas as rotas sob /api/v1/
@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController { ... }
```

```java
// Ou via prefixo global (application.properties)
server.servlet.context-path=/api/v1
// Atenção: afeta TODOS os endpoints incluindo health check
```

### Approach recomendado — prefixo por controller

```java
// Constante centralizada evita typos
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

### Migrando endpoints existentes (sem quebrar clientes)

```java
// Fase 1: manter rota antiga + criar nova
@RestController
public class TransactionController {

    // Rota nova (v1 explícita)
    @GetMapping("/api/v1/transactions")
    public Page<TransactionResponse> findAll(Pageable pageable) {
        return service.findAll(pageable);
    }

    // Rota legada — manter por período de transição
    @GetMapping("/api/transactions")
    @Deprecated
    public Page<TransactionResponse> findAllLegacy(Pageable pageable) {
        // Redirecionar para v1 ou manter funcionando
        return service.findAll(pageable);
    }
}
```

```java
// Fase 2: adicionar header Deprecation nos endpoints legados
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

## Quando criar v2

Criar nova versão apenas para **breaking changes**:

| Mudança | Breaking? | Ação |
|---------|-----------|------|
| Adicionar campo opcional no response | ❌ | Não precisa de nova versão |
| Adicionar endpoint novo | ❌ | Não precisa de nova versão |
| Remover campo do response | ✅ | Nova versão obrigatória |
| Renomear campo | ✅ | Nova versão obrigatória |
| Mudar tipo de campo | ✅ | Nova versão obrigatória |
| Mudar comportamento de endpoint existente | ✅ | Nova versão obrigatória |

---

## Ciclo de vida de uma versão

```
v1: Ativa        → usada em produção por todos
v1: Depreciada   → anúncio com data de sunset (mínimo 3 meses)
v1: Sunset       → retorna 410 Gone com link para migração
v1: Removida     → endpoint deletado do código
```

```java
// Endpoint com sunset
@GetMapping("/api/v1/old-endpoint")
public ResponseEntity<?> sunsetEndpoint() {
    return ResponseEntity.status(HttpStatus.GONE)
        .header("Link", "</api/v2/new-endpoint>; rel=\"successor-version\"")
        .body(Map.of(
            "error", "Este endpoint foi desativado em 2026-12-31.",
            "migration", "/api/v2/new-endpoint"
        ));
}
```

---

## Documentação OpenAPI por versão

```java
// SpringDoc — configuração separada por versão
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

Acesso: `GET /swagger-ui.html` → selecionar versão no dropdown.

---

## Checklist de migração (para projetos sem versão)

```
Fase 1 — Adicionar versão (sem breaking change):
□ Criar constante ApiVersion.V1
□ Adicionar /api/v1/* em todos os controllers
□ Manter /api/* como alias (sem deprecation ainda)
□ Atualizar frontend para usar /api/v1/*
□ Commitar e deployar

Fase 2 — Deprecar rota sem versão:
□ Adicionar headers Deprecation + Sunset nos endpoints /api/*
□ Anunciar data de sunset
□ Monitorar logs para ver se ainda há chamadas às rotas legadas

Fase 3 — Remover rota legada:
□ Confirmar que nenhum cliente usa /api/* nos logs
□ Trocar endpoints /api/* por 410 Gone
□ Após período de estabilização: remover código legado
```

---

*Skill — `.github/skills/be-api-versioning.md`*
*Referência: `principios-engenharia.md` §4.4 (Versionamento de API)*
*Pendência: I-07 em `analise-estrutural.md`*
