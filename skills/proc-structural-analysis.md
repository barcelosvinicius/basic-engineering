---
name: proc-structural-analysis
description: >
  Guided pipeline for producing a structural analysis of any codebase — scans the
  project, maps modules to architectural layers, extracts dependencies and domain
  boundaries, detects risks and pending items, and outputs a versioned
  structural-analysis.md. Use at project kickoff, after a major refactoring, or
  whenever the architecture diverges from its documentation.
---

# Skill: Structural Analysis Pipeline

## What this skill is

Defines a repeatable multi-phase pipeline for analysing the structure of any
software project. The output is a living `docs/structural-analysis.md` that maps
every module to an architectural layer, records dependencies, highlights risks,
and tracks improvement items — giving AI agents and humans a shared structural
map of the codebase.

Inspired by the multi-agent approach of the *Understand-Anything* project
(static analysis + LLM semantic enrichment in specialised passes), adapted for
the basic-engineering doc system.

---

## When to run this pipeline

| Trigger | Description |
|---------|-------------|
| Project kickoff | Before the first sprint begins — baseline the architecture |
| Post-major refactoring | After merging a structural change to reset the map |
| Onboarding preparation | Before adding a new team member or AI agent |
| Architecture review session | When drift between code and docs is suspected |
| Incremental update | Re-run only phases 2–4 for files changed since last run |

---

## Pipeline overview

```
Phase 1 — Project scan
  ↓ discover files, languages, frameworks, entry points
Phase 2 — File-level analysis
  ↓ extract functions, classes, imports, exports per file
Phase 3 — Architecture analysis
  ↓ assign each module to a layer, detect coupling, identify boundaries
Phase 4 — Domain extraction
  ↓ map modules to business concepts and flows
Phase 5 — Review and assembly
  ↓ validate completeness, cross-check references, output structural-analysis.md
```

---

## Phase 1 — Project scan

**Goal:** produce a complete inventory of what exists in the project.

### Checklist

- [ ] List all source directories and their purpose
- [ ] Identify languages, frameworks, and main libraries (from manifests:
      `pom.xml`, `package.json`, `requirements.txt`, `go.mod`, etc.)
- [ ] Identify entry points: `main()`, API routers, `@SpringBootApplication`, etc.
- [ ] List configuration files and what they control (`.env.example`,
      `application.yml`, `Dockerfile`, CI workflows)
- [ ] Note the build toolchain and how to run the project locally

### Output

```
scan-report:
  languages: [...]
  frameworks: [...]
  entry_points: [...]
  config_files: [...]
  total_source_files: N
```

---

## Phase 2 — File-level analysis

**Goal:** extract structural facts from each source file.

For each file, record:

| Field | What to extract |
|-------|----------------|
| `path` | Relative path from project root |
| `layer` | `api` · `service` · `domain` · `data` · `ui` · `util` · `config` · `infra` |
| `exports` | Public functions, classes, interfaces |
| `imports` | External dependencies and internal module references |
| `description` | One-sentence plain-English summary of the file's purpose |
| `patterns` | Notable patterns: Repository, Factory, Strategy, Observer, etc. |
| `risks` | Code smells or security flags visible from structure alone |

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

### Incremental update rule

Store a fingerprint (SHA-256 of file content) for each analysed file.
On re-run, skip files whose fingerprint has not changed — only process
files added, modified, or deleted since the last run.

---

## Phase 3 — Architecture analysis

**Goal:** map the module graph, identify coupling violations, and surface risks.

### Coupling analysis

For each module pair (A → B), record:

- **Direction:** A depends on B (not the reverse)
- **Type:** compile-time, runtime, or configuration
- **Violation flag:** does A depend on a layer it should not? (e.g., `ui` → `data`)

**Allowed dependency directions (strict):**
```
api → service → domain ← data
config → any
util ← any
infra ← service
```

Any arrow that crosses layers in the wrong direction is a **coupling violation**
and must be recorded as a pending item.

### Architecture risks checklist

- [ ] Circular dependencies between modules
- [ ] God classes / God services (single file with > 400 LOC or > 10 public methods)
- [ ] Direct database access from api or ui layers
- [ ] Business logic in controllers or repositories
- [ ] Missing abstraction boundaries (e.g., external API client used directly in service)
- [ ] Hardcoded configuration (URLs, credentials, size limits)
- [ ] Missing error boundaries on entry points
- [ ] Missing health check endpoint

---

## Phase 4 — Domain extraction

**Goal:** map code to business concepts, flows, and process steps.

For each identified business domain:

```
domain:
  name: [domain name — e.g., "Billing", "Identity", "Catalogue"]
  description: [what business problem it solves]
  entry_module: [primary module or package]
  flows:
    - name: [flow name — e.g., "Checkout", "Password Reset"]
      steps: [ordered list of modules/functions involved]
      triggers: [HTTP endpoint, event, cron, etc.]
  entities: [core domain objects]
  external_dependencies: [third-party systems or APIs]
```

---

## Phase 5 — Review and assembly

**Goal:** validate the analysis and produce the final document.

### Validation checklist

- [ ] Every source file is assigned to exactly one layer
- [ ] All internal imports resolve to known files (no dangling references)
- [ ] Every coupling violation has been recorded as a pending item
- [ ] Domain flows are complete: each step maps to a real file
- [ ] All risks from Phase 3 are either explained or flagged as items

### Output — structural-analysis.md

Use the template at `docs/structural-analysis.template.md`.
Mandatory sections:

```
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
  - Numbered list (I-01, I-02...) with: description, severity, affected file(s)
  - Severity: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low

## Analysis metadata
  - Date, analyser (human / AI agent), total files, version fingerprint
```

---

## Incremental update (post-release)

When re-running after a change rather than a full new analysis:

1. Load existing `structural-analysis.md`
2. Run Phase 2 only on files whose fingerprint changed
3. Re-run Phase 3 coupling analysis only for modules that gained/lost imports
4. Update Phase 4 domain map only for affected domains
5. Update the pending items list: close resolved items, add new ones
6. Update `## Analysis metadata` with the new date and changed file count

---

## Output quality checklist

Before committing `docs/structural-analysis.md`:

- [ ] Executive summary is accurate and readable by a non-engineer
- [ ] All layers are populated (no empty sections)
- [ ] Pending items are numbered and have severity ratings
- [ ] Module map can be rendered (valid Mermaid or clear indentation)
- [ ] Metadata section is updated with today's date
- [ ] File was committed alongside any code changes that triggered it

---

*Universal skill — copy from `.github/base/skills/` without modification.*
