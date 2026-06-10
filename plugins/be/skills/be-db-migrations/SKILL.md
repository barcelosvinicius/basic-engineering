---
name: be-db-migrations
description: >
  Use when creating tables, adding columns, creating indexes, changing
  constraints, or migrating data with any versioned migration tool (Flyway,
  Liquibase, Alembic, Prisma Migrate, Rails migrations). Naming, idempotency,
  and safe schema evolution rules.
---

# Skill: Versioned Database Migrations

Universal patterns for creating and evolving a database schema with versioned
migrations, regardless of the migration tool.

## Mandatory rules

1. **Never modify an already applied migration** — create a new one. Applied
   migrations are immutable history; editing one breaks checksum validation
   and desynchronizes environments.
2. **Deterministic ordering** — follow the tool's naming convention strictly
   (sequential `V1, V2, …` or timestamp prefixes). Never skip, reuse, or
   insert a version lower than the latest applied one.
3. **Descriptive names**: `V3__add_category_to_transactions.sql` — the file
   name should explain the change without opening it.
4. **Idempotency**: use `IF NOT EXISTS` / `IF EXISTS` guards whenever the
   dialect supports them.
5. **One concept per migration** — do not mix unrelated tables or concerns.

## Safe data migrations — expand/contract

Schema changes that touch existing data must be reversible. Use the
two-phase pattern:

1. **Expand:** add the new column/table; backfill data; validate.
2. **Contract:** remove the old column **in a separate, later migration**,
   only after the application no longer reads it.

Never combine "add new" and "drop old" in the same migration — it removes
your rollback path.

## Checklist before applying in production

- [ ] Migration tested against a development database
- [ ] Idempotent where the dialect allows
- [ ] Database backup taken beforehand
- [ ] Data migrations follow expand/contract (reversible)
- [ ] Tested with data volumes/shapes similar to production
- [ ] Locking impact considered (long `ALTER TABLE` on hot tables → use the
      tool/database's online DDL options)

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Checksum mismatch on deploy | An applied migration was edited | Never edit — create a new migration |
| Passes in dev, fails in prod | Existing data violates a new constraint | Test with production-like data; backfill before adding the constraint |
| Out-of-order version error | Migration inserted with a lower number after newer ones applied | Always append after the latest applied version |
| Lost rollback path | Add + drop in the same migration | Expand/contract in separate migrations |

## Resources

- [examples-flyway.md](examples-flyway.md) — Flyway naming/layout and SQL
  templates (create table, add column with default, two-phase data
  migration).
