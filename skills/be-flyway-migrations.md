---
name: be-flyway-migrations
description: >
  Padrões universais de migrations de banco de dados com Flyway — nomenclatura,
  regras de idempotência e melhores práticas para evolução segura do schema.
  Usar ao criar tabelas, adicionar colunas ou criar índices com Flyway.
---

# Skill: Migrations com Flyway (Universal)

## O que é esta skill

Padrões universais para criar e evoluir o schema do banco de dados usando Flyway.
Usar ao criar tabelas, adicionar colunas, criar índices, alterar constraints ou
migrar dados com Flyway em qualquer projeto.

---

## Regras obrigatórias

1. **Nunca alterar uma migration já aplicada** — criar uma nova
2. **Nomenclatura**: `V{número}__{descrição_com_underscores}.sql`
3. **Numeração sequencial**: V1, V2, V3 — nunca pular ou reutilizar
4. **Idempotência**: usar `IF NOT EXISTS` onde possível
5. **Um conceito por migration** — não misturar tabelas não relacionadas

---

## Nomenclatura e localização

```
src/main/resources/db/migration/
├── V1__create_users.sql
├── V2__create_transactions.sql
├── V3__add_category_to_transactions.sql
├── V4__create_indexes.sql
└── V5__insert_default_data.sql
```

---

## Templates de migrations comuns

### Criar tabela

```sql
-- V1__create_users.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Usuários autenticados do sistema';
```

### Adicionar coluna com default

```sql
-- V5__add_status_to_transactions.sql
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- Índice para queries por status
CREATE INDEX IF NOT EXISTS idx_transactions_status
    ON transactions(status);
```

### Migração de dados

```sql
-- V7__migrate_category_to_enum.sql
-- SEMPRE fazer backup antes de migrations de dados em produção

-- 1. Adicionar nova coluna
ALTER TABLE transactions ADD COLUMN category_new VARCHAR(50);

-- 2. Migrar dados
UPDATE transactions SET category_new = UPPER(category_old)
    WHERE category_old IS NOT NULL;

-- 3. Adicionar constraint na nova coluna
ALTER TABLE transactions ALTER COLUMN category_new SET NOT NULL;

-- 4. Remover coluna antiga (em migration separada se há rollback)
-- ALTER TABLE transactions DROP COLUMN category_old;
```

---

## Checklist antes de aplicar migration em produção

- [ ] Migration testada em banco de desenvolvimento
- [ ] Migration idempotente (IF NOT EXISTS onde aplicável)
- [ ] Backup do banco realizado antes
- [ ] Migrations de data devem ser reversíveis (2 steps: add → validate → remove antigo)
- [ ] Nenhuma migration altera dados de produção sem validação prévia

---

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `FlywayException: checksum mismatch` | Migration existente foi editada | Nunca editar — criar nova migration |
| Migration falha em prod mas passa em dev | Dados existentes violam constraint | Testar com dados similares à produção |
| `OutOfOrder` error | Tentativa de inserir V5 depois de V6 já aplicado | Nunca inserir migration com número anterior ao atual |

---

*Template universal — `.github/base/skills/be-flyway-migrations.md`*
