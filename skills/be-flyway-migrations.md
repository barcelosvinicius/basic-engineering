---
name: be-flyway-migrations
description: >
  Universal database migration patterns with Flyway — naming,
  idempotency rules, and best practices for safe schema evolution.
  Use when creating tables, adding columns, or creating indexes with Flyway.
---

# Skill: Flyway Migrations (Universal)

## What this skill is

Universal patterns for creating and evolving the database schema with Flyway.
Use when creating tables, adding columns, creating indexes, changing constraints, or
migrating data with Flyway in any project.

---

## Mandatory rules

1. **Never modify an already applied migration** — create a new one
2. **Naming**: `V{number}__{description_with_underscores}.sql`
3. **Sequential numbering**: V1, V2, V3 — never skip or reuse
4. **Idempotency**: use `IF NOT EXISTS` whenever possible
5. **One concept per migration** — do not mix unrelated tables

---

## Naming and location

```
src/main/resources/db/migration/
├── V1__create_users.sql
├── V2__create_transactions.sql
├── V3__add_category_to_transactions.sql
├── V4__create_indexes.sql
└── V5__insert_default_data.sql
```

---

## Common migration templates

### Create table

```sql
-- V1__create_users.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Authenticated system users';
```

### Add column with default

```sql
-- V5__add_status_to_transactions.sql
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_transactions_status
    ON transactions(status);
```

### Data migration

```sql
-- V7__migrate_category_to_enum.sql
-- ALWAYS back up before data migrations in production

-- 1. Add new column
ALTER TABLE transactions ADD COLUMN category_new VARCHAR(50);

-- 2. Migrate data
UPDATE transactions SET category_new = UPPER(category_old)
    WHERE category_old IS NOT NULL;

-- 3. Add constraint to the new column
ALTER TABLE transactions ALTER COLUMN category_new SET NOT NULL;

-- 4. Remove old column (in a separate migration if rollback is needed)
-- ALTER TABLE transactions DROP COLUMN category_old;
```

---

## Checklist before applying a migration in production

- [ ] Migration tested in development database
- [ ] Migration idempotent (`IF NOT EXISTS` where applicable)
- [ ] Database backup taken beforehand
- [ ] Data migrations reversible (2 steps: add → validate → remove old)
- [ ] No migration changes production data without prior validation

---

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| `FlywayException: checksum mismatch` | Existing migration was edited | Never edit — create a new migration |
| Migration fails in prod but passes in dev | Existing data violates a constraint | Test with data similar to production |
| `OutOfOrder` error | Attempt to insert V5 after V6 was already applied | Never add a migration with a lower number than the current one |

---

*Universal template — `.github/base/skills/be-flyway-migrations.md`*
