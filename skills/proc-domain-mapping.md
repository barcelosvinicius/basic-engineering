---
name: proc-domain-mapping
description: >
  Pipeline for mapping source code to business domains using Domain-Driven Design
  (DDD) concepts — identifies bounded contexts, aggregates, domain events, and
  process flows from code structure and naming conventions. Output feeds
  docs/structural-analysis.md (domain map section) and informs agent specialisation.
  Use at project kickoff, before introducing a new bounded context, or when the
  team suspects domain boundaries have drifted.
---

# Skill: Domain Mapping Pipeline

## What this skill is

Defines the repeatable process for deriving a DDD-aligned domain model from an
existing or new codebase. The pipeline works whether the project already uses DDD
terminology or not — it extracts business intent from naming conventions, data
flows, and module boundaries.

The output is a domain map that answers: **"What business problems does this code
solve, in what order, and where exactly do those responsibilities live?"**

---

## When to run

| Trigger | Recommended action |
|---------|--------------------|
| Project kickoff | Full pipeline — establish the baseline domain map |
| New bounded context | Phases 1–3 for the new context only |
| Suspected boundary drift | Phase 2 + Phase 4 on affected modules |
| Pre-release architecture review | Phase 4 (validation only) |
| Onboarding new AI agent | Provide the domain map as context |

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

## Pipeline phases

```
Phase 1 — Context discovery
  ↓ identify bounded contexts from module structure
Phase 2 — Model extraction
  ↓ find aggregates, entities, value objects, events per context
Phase 3 — Flow mapping
  ↓ trace process flows end-to-end across contexts
Phase 4 — Boundary validation
  ↓ verify context isolation; flag leakage and missing anti-corruption layers
Phase 5 — Output assembly
  ↓ produce domain-map section for structural-analysis.md
```

---

## Phase 1 — Context discovery

**Goal:** name the bounded contexts and assign every module to one.

### Discovery heuristics

Look for naming signals in package/module names, directory names, and class names:

| Signal | Likely bounded context |
|--------|------------------------|
| `billing`, `payment`, `invoice`, `subscription` | **Billing** |
| `auth`, `identity`, `user`, `account`, `session` | **Identity** |
| `catalog`, `product`, `inventory`, `sku` | **Catalogue** |
| `order`, `checkout`, `cart`, `fulfillment` | **Order** |
| `notification`, `email`, `sms`, `push` | **Notification** |
| `report`, `analytics`, `metric`, `dashboard` | **Analytics** |

### Output per context

```
context:
  name: [PascalCase name]
  description: [one sentence — what business problem it owns]
  root_package: [e.g., com.company.billing or src/billing]
  team_owner: [optional — which squad or agent owns this context]
```

---

## Phase 2 — Model extraction

**Goal:** identify the building blocks inside each bounded context.

For each context, extract:

### Aggregates and entities

| What to look for | How to recognise it |
|-----------------|---------------------|
| Aggregate root | Class with identity field (`id`, `uuid`), annotated `@Entity` or equivalent |
| Value object | Immutable class, no `id`, equality by value |
| Repository | Interface/class named `*Repository`, `*DAO`, `*Store` |
| Domain service | Class named `*Service` in the domain layer (not in `application` or `api`) |
| Application service | Class in `application` or `usecase` package, orchestrates domain objects |

### Domain events

Look for:
- Classes named `*Event`, `*Created`, `*Updated`, `*Cancelled`
- Publisher/dispatcher calls (Spring `ApplicationEvent`, Kafka producer, etc.)
- Listener/consumer registrations

Record:

```
event:
  name: [e.g., OrderPlaced]
  publisher: [module that emits it]
  consumers: [modules that react to it]
  payload: [key fields]
```

---

## Phase 3 — Flow mapping

**Goal:** trace process flows end-to-end through the system.

For each significant user journey or business process:

```
flow:
  name: [e.g., "Place order", "Reset password", "Generate monthly invoice"]
  trigger: [HTTP request, cron job, domain event, user action]
  steps:
    1. [Layer: api] [file/class] — [what it does]
    2. [Layer: service] [file/class] — [what it does]
    3. [Layer: domain] [file/class] — [what it does]
    4. [Layer: data] [file/class] — [what it does]
  output: [what the flow produces — response, event, record]
  external_calls: [third-party services invoked]
  failure_paths: [what happens if each step fails]
```

### Flow completeness checklist

- [ ] Every RF (functional requirement) maps to at least one flow
- [ ] Every flow has an explicit trigger
- [ ] Every flow has identified failure paths
- [ ] External calls are documented (SLA, retry policy)

---

## Phase 4 — Boundary validation

**Goal:** verify that bounded contexts are properly isolated.

### Context coupling anti-patterns

| Anti-pattern | Description | Severity |
|-------------|-------------|----------|
| Shared entity | Same JPA entity used in two contexts | 🔴 Critical |
| Direct service call | Context A calls Context B's service directly | 🟠 High |
| Shared database table | Two contexts read/write the same table | 🔴 Critical |
| Missing anti-corruption layer | External system's model leaks into domain | 🟡 Medium |
| Implicit context | Logic spread across unowned modules | 🟡 Medium |

### Anti-corruption layer (ACL) checklist

An ACL is required whenever:
- [ ] A bounded context integrates with a third-party API
- [ ] Two bounded contexts need to share data (translate, do not reference directly)
- [ ] A legacy module is being strangled by a new context

Record each missing ACL as a pending item in `structural-analysis.md`.

---

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

## Integration with other skills

| Skill | How domain mapping feeds it |
|-------|---------------------------|
| `proc-structural-analysis` | Phase 4 (domain extraction) of that pipeline uses this skill's output |
| `proc-impact-analysis` | Domain map enables precise impact scoping — change in Context A does not automatically affect Context B |
| `proc-sdd` | Specs reference bounded contexts; each context is a candidate for its own spec |
| Agent definitions | Each agent should declare which bounded context(s) it owns |

---

*Universal skill — copy from `.github/base/skills/` without modification.*
