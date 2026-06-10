# Migration examples — Flyway + PostgreSQL

Supporting material for the `be-db-migrations` skill. The SQL is standard
PostgreSQL; the naming convention is Flyway's.

## Naming and location

```
src/main/resources/db/migration/
├── V1__create_users.sql
├── V2__create_transactions.sql
├── V3__add_category_to_transactions.sql
├── V4__create_indexes.sql
└── V5__insert_default_data.sql
```

Format: `V{number}__{description_with_underscores}.sql` — sequential, never
reused. (Timestamp-based prefixes, e.g. `V20260610153000__`, also work and
avoid collisions in parallel branches.)

## Create table

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

## Add column with default + index

```sql
-- V5__add_status_to_transactions.sql
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_transactions_status
    ON transactions(status);
```

## Two-phase data migration (expand/contract)

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

-- 4. Remove old column — in a SEPARATE later migration, after the
--    application stops reading it:
-- ALTER TABLE transactions DROP COLUMN category_old;
```

## Flyway-specific errors

| Error | Meaning |
|-------|---------|
| `FlywayException: checksum mismatch` | An applied migration file was edited |
| `OutOfOrder` | A migration with a lower version was added after newer ones were applied (enable `outOfOrder` only as a last resort) |
