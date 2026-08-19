# Structural analysis — output schemas and reference tables

Loaded on demand from `proc-structural-analysis`. These are the shapes the
pipeline produces and the tables it consults, not the decisions it makes — you
open them while writing the output, so they do not belong in a file that loads
on every activation.

---

## The document skeleton

### Output — structural-analysis.md

Use the base template `templates/docs/structural-analysis.template.md`.
Mandatory sections:

```
## §0 Verifiable fact panel  ← FIRST section, before any prose
  - Table: fact | proof command | value | class | measured on
  - class: measured · inferred · reported · hypothesis
  - Hard rules: a value with no date is not a fact; a fact with no command is
    an impression — if you cannot write the command, label it and say so.

## Executive summary
  - 3-5 sentences: what the system does, main layers, dominant patterns
  - Risk level: 🟢 low / 🟡 medium / 🔴 high

## Architectural layers
  - Table: layer | module/package | file count | main responsibility

## Module map
  - Mermaid graph or indented text showing dependencies

## Domain map
  - Per domain: name, flows, entities, external dependencies

## Pending items
  - Numbered list (I-01, I-02...) with: description, severity, affected file(s),
    "done when" (verifiable BY COMMAND) and "blocked by"
  - Severity: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low

## Analysis metadata
  - Date, analyser (human / AI agent), total files, version fingerprint
```

---


---

### Layer assignment heuristics

| Layer | Indicators |
|-------|-----------|
| `api` | Controller, Resource, Router, Handler, REST/GraphQL endpoint |
| `service` | Service, UseCase, Interactor, BusinessLogic |
| `domain` | Entity, Model, Aggregate, ValueObject, DomainEvent |
| `data` | Repository, DAO, Mapper, Migration, ORM config |
| `ui` | Component, View, Page, Screen, Template |
| `util` | Helper, Utils, Formatter, Converter |
| `config` | Configuration, Properties, Module setup |
| `infra` | Client, Gateway, Adapter, Queue, Cache, Storage |


---

## Phase 1 — scan output schema


```
scan-report:
  languages: [...]
  frameworks: [...]
  entry_points: [...]
  config_files: [...]
  total_source_files: N
```

---

