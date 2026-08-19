# Domain mapping — output schemas and vocabulary

Loaded on demand from `proc-domain-mapping`. The DDD vocabulary is a glossary
you look up, and the section below is the shape of the deliverable — neither is
used to decide anything, so neither belongs in a file that loads on every
activation.

This skill **owns** the `## Domain map` section of `structural-analysis.md`
(`proc-structural-analysis` delegates Phase 4 here). Only this file defines its
schema; a second definition anywhere else is a contradiction with a delivery date.

---

## The `## Domain map` section

## Phase 5 — Output assembly

### Domain map section for structural-analysis.md

```markdown
## Domain map

### Bounded contexts

| Context | Root package | Core aggregate(s) | Owns |
|---------|-------------|-------------------|------|
| [Name] | [package] | [Aggregate] | [responsibilities] |

### Context relationships

[Diagram or table: which contexts communicate, via what mechanism]

### Domain event catalogue

| Event | Published by | Consumed by | Trigger |
|-------|-------------|-------------|---------|

### Flow index

| Flow | Trigger | Contexts involved | Risk |
|------|---------|-------------------|------|
```

---


---

## Core DDD vocabulary used in this skill

| Term | Meaning in this pipeline |
|------|--------------------------|
| **Bounded context** | A named boundary inside which a model is consistent |
| **Aggregate** | A cluster of objects treated as one transactional unit |
| **Entity** | An object with identity that persists over time |
| **Value object** | An immutable descriptor with no identity |
| **Domain event** | Something that happened in the domain and is worth recording |
| **Domain service** | Logic that does not belong to any single entity |
| **Application service** | Orchestrates use cases; no domain logic |
| **Repository** | Abstraction for persisting and retrieving aggregates |

---


---

## Per-context output schema (Phase 1)


```
context:
  name: [PascalCase name]
  description: [one sentence — what business problem it owns]
  root_package: [e.g., com.company.billing or src/billing]
  team_owner: [optional — which squad or agent owns this context]
```

---

