---
name: be-pagination-patterns
description: >
  Padrão de paginação server-side com Pageable e Page<T> para endpoints REST que retornam
  coleções. Usar ao implementar qualquer endpoint de lista — nunca retornar List<> sem
  paginação, pois isso causa timeout e degradação de performance com crescimento dos dados.
---

# Skill: Paginação de Endpoints REST

## O que é esta skill

Define o padrão de paginação server-side para endpoints de lista. Use ao implementar
ou corrigir qualquer endpoint que retorne coleções de dados.

> **Por que é crítico:** endpoints sem paginação retornam todos os registros de uma vez.
> Com crescimento dos dados, isso causa timeout, estouro de memória e degradação
> de performance para todos os usuários simultaneamente.

---

## Padrão Spring Boot — implementação completa

### 1. Repository

```java
// Antes (problemático)
List<Transaction> findByUserId(Long userId);

// Depois (correto)
Page<Transaction> findByUserId(Long userId, Pageable pageable);

// Com filtros
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
        .map(this::toResponse);  // map preserva metadados de paginação
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

**`@PageableDefault` — parâmetros recomendados:**

| Parâmetro | Valor sugerido | Justificativa |
|-----------|---------------|---------------|
| `size` | 20–50 | Equilíbrio entre UX e performance |
| `sort` | Campo de data ou relevância | Ordenação mais comum primeiro |
| `direction` | `DESC` para datas | Mais recente primeiro |
| `max size` | 100 | Nunca permitir size ilimitado |

```java
// Limitar tamanho máximo de página (evitar abuso)
// Em application.properties:
spring.data.web.pageable.max-page-size=100
spring.data.web.pageable.default-page-size=30
```

### 4. DTO de resposta paginada

A interface `Page<T>` do Spring já serializa os metadados corretos, mas é recomendado
criar um DTO explícito para controlar o que é exposto:

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
// Resposta esperada
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

## Parâmetros de query aceitos automaticamente

O Spring converte automaticamente os query params para `Pageable`:

```
GET /api/transactions?page=0&size=30&sort=transactionDate,desc
GET /api/transactions?page=1&size=20&sort=amount,asc&sort=transactionDate,desc
```

| Param | Tipo | Exemplo |
|-------|------|---------|
| `page` | int (0-based) | `?page=0` |
| `size` | int | `?size=30` |
| `sort` | `campo,direção` | `?sort=date,desc` |

---

## Estratégia de cursor vs offset

**Offset** (`page=N`) — padrão do Spring, adequado para a maioria dos casos:
- ✅ Simples de implementar e navegar
- ✅ Permite pular para qualquer página
- ⚠️ Performance degrada com páginas muito altas (`OFFSET 10000` é lento)

**Cursor** (baseado no último ID ou data) — para feeds e listas longas de alta frequência:
- ✅ Performance constante independente da posição
- ✅ Consistente mesmo com dados inseridos/removidos durante navegação
- ⚠️ Não permite pular para página arbitrária

```java
// Cursor simples por ID
Page<Transaction> findByUserIdAndIdLessThan(
    Long userId, Long cursorId, Pageable pageable);

// Frontend envia: ?cursorId=1234&size=30
// Backend retorna: { content: [...], nextCursor: 1205, hasMore: true }
```

Use cursor quando: feed de atividade em tempo real, lista de notificações, chat.
Use offset quando: tabelas com filtros, relatórios, paginação com "ir para página N".

---

## Paginação no frontend (Angular)

```typescript
// Model da resposta paginada
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
// Componente — carregar mais (infinite scroll)
loadMore(): void {
  if (this.currentPage >= this.totalPages - 1) return;
  this.currentPage++;
  this.service.getTransactions(this.currentPage).subscribe(result => {
    this.items = [...this.items, ...result.content];
    this.totalPages = result.totalPages;
  });
}

// Componente — paginação tradicional
goToPage(page: number): void {
  this.service.getTransactions(page).subscribe(result => {
    this.items = result.content;
    this.currentPage = result.page;
    this.totalPages = result.totalPages;
  });
}
```

---

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `findAll()` retorna `List<>` | Repository não usa `Pageable` | Trocar para `Page<>` + `Pageable` |
| Ordenação ignorada | `sort` no `@PageableDefault` sem confirmar no repository | Verificar que o campo existe na entidade |
| `size=0` aceito | Sem validação de tamanho mínimo | Adicionar `@Min(1)` no parâmetro ou usar `max-page-size` |
| Página muito grande lenta | OFFSET alto no SQL | Considerar cursor para casos extremos |
| Frontend soma duplicatas | Dados inseridos entre páginas em offset | Usar cursor ou aceitar como comportamento esperado |

---

*Skill — `.github/skills/be-pagination-patterns.md`*
*Referência: `principios-engenharia.md` §1.2 (Performance Percebida), §6.4 (Backend)*
*Pendência: C-01 em `analise-estrutural.md`*
