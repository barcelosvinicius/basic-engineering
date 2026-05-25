# Software Engineering Principles

This document defines the universal engineering principles applicable to any
software project that seeks lasting quality, safe evolution, and maintenance
guided by structural clarity — not by improvisation or excessive abstraction.

This file is **immutable most of the time** and serves as the authoritative
reference for all other documents, agents, and technical decisions.

---

## Fundamental Cognitive Principle — Think Before Coding

Before writing any line of code, the technical decision **must be clear**.
This principle exists to reduce rework, eliminate implicit decisions, and avoid
implementations based on silent assumptions.

### Mandatory rules
- **Never assume silently.**  
  If something is not explicit in the requirement, state the assumption or ask for confirmation.
- **Ambiguity must be named.**  
  When there is more than one reasonable interpretation, present the options and their trade-offs.
- **Simplify before abstracting.**  
  If a simple solution solves the current problem, it is preferable to any abstraction
  created "for the future".
- **Pushback is part of engineering.**  
  If a request leads to a solution clearly more complex than necessary,
  it is mandatory to point out the risk before implementing.

### Goal of this principle
Reduce:
- overly complex implementations
- rework caused by incorrect interpretation
- unnecessary consumption of time, effort, and tokens

This principle **informs every layer of the system**:
agents, skills, code review, tests, architectural decisions, and production operations.

---

## 1. User Experience (UX)

### 1.1 Progressive Disclosure

Reveal information in layers. The initial state must be meaningful on its own,
without requiring the user to configure anything to see useful results.

- **Smart defaults**: filtering and search controls preloaded with
  values that cover the most common case (recent period, active status, relevance
  sorting).
- **Minimal action for maximum value**: the user's first interaction should refine
  what is already visible, not start loading.
- **Filters as refiners, not prerequisites**: the interface loads with data;
  filters reduce the presented universe.
- **Depth navigation (drill-down)**: summary elements must allow
  progressive deepening. An indicator leads to detail, which leads to granular
  data. The path back must be clear and accessible at any level.

### 1.2 Perceived Performance

Users judge speed by how quickly they see meaningful content, not by the
actual API speed.

- **First contentful paint (FCP)**: prioritize rendering the first useful block
  of data. Delay heavy loads (complete lists, detailed reports,
  secondary resources).
- **Progress indication**: display a visual representation of the loading state
  (skeleton screens, progress bars, placeholders) while the final data is not yet
  available. The format depends on the content type: it may be a table
  silhouette, an empty chart with axes, or a zeroed numeric indicator.
- **Data volume per request**: never load everything at once. Implement
  pagination, incremental loading, or virtualization according to the
  interface consumption pattern. Page sizes between 10–50 items are an initial
  reference, adjustable by context.
- **Debounce on text inputs**: 400–800ms to avoid requests on every keystroke.
  See also §6.1.

### 1.3 Information Hierarchy

Every interface that presents data must follow the **inverted pyramid** principle:
general context before specific detail.

- **Context before specificity**: regardless of format (cards, tables,
  dashboards, forms), the information that guides reading comes first;
  details and metadata come after.
- **Scannability**: the most important elements must be identifiable without
  additional interaction (no scroll, hover, or click).
- **Structural consistency**: the same type of data occupies the same relative position
  in every instance of the same component. If the status appears in the upper-right
  corner of one item, it appears in the same place in all items.
- **Appropriate density**: query and monitoring interfaces may have higher
  information density; input and action interfaces should prioritize focus and
  clarity. Density is a design decision by system type, not a universal rule.

### 1.4 Feedback and Defensive UX

Every user action must produce visual feedback in less than 100ms.

- Loading spinners or skeleton screens for operations > 300ms.
- Success/error messages close to the point of action (not at the top of the page).
- Disable buttons during processing to prevent double-clicking.
- **Explicit confirmation for destructive actions**: deletions, cancellations, and
  irreversible operations require deliberate confirmation (modal, confirmed
  double-click, typed confirmation). Confirmation severity must be
  proportional to the impact of the action.
- **Flow completion**: after a successful action on transient screens (modals,
  edit forms, wizards), the system must automatically return to the
  origin context with visible result feedback. The user should not need to
  close manually or navigate back.

### 1.5 Accessibility (a11y)

Quality software is usable by everyone, including people with visual,
motor, or cognitive disabilities.

- **HTML semantics**: use native elements (`<button>`, `<nav>`, `<main>`,
  `<table>`) instead of `<div>` with role. Native elements carry accessible
  behavior by default.
- **Keyboard navigation**: every interactive element must be reachable and operable
  via Tab, Enter, and Escape. Focus order must be logical and visible.
- **Contrast**: text must meet the WCAG AA minimum (4.5:1 for normal text,
  3:1 for large text). Do not rely only on color to convey information.
- **ARIA attributes**: use `aria-label`, `aria-describedby`, and `aria-live` when
  native semantics are not enough — never as a substitute for semantic HTML.
- **Images and media**: every informative image has descriptive `alt`; decorative
  images have `alt=""`. Videos must include captions.
- **Accessibility tests**: include automated tools (axe, Lighthouse)
  in the pipeline and perform periodic manual screen-reader tests.

---

## 2. Security

### 2.1 Principle of Least Privilege

Each component of the system (user, service, module) must have access only to the
minimum necessary to fulfill its function.

Practical examples:
- Database user with permissions restricted to what is required (`SELECT` only
  for read services; no access to audit tables for business services).
- **Identity-based data isolation**: in systems with sensitive data per
  user or department, apply restrictions at the data access level (Row Level
  Security, mandatory tenant/owner filters), not only at the
  application level. If the application layer fails, the database must be the last barrier.
- Service accounts with OAuth scopes restricted to the minimum.
- API tokens with explicit scopes and finite validity.
- **Prefer ephemeral credentials** (IAM roles, workload identity federation) over
  static secrets whenever the infrastructure allows it.

### 2.2 Authentication and Authorization

- **Session tokens**: use established standards (JWT, OAuth 2.0, OpenID Connect).
  Never implement custom authentication from scratch.
- **Token expiration**: access tokens with short lifetime (15min–1h); refresh tokens
  rotated on every use.
- **Immediate revocation**: logout must invalidate the token effectively
  (blacklist, JIT revocation), not merely discard it on the client.
- **Route protection**: authorization must be verified on the server, never only on the client.
  The frontend may hide elements; the backend must reject unauthorized requests.
- **Passwords**: never store in plain text. Use hashing algorithms with an appropriate
  work factor (bcrypt, Argon2id, scrypt) with an individual salt per password. MD5, SHA-1, and
  plain SHA-256 **are not adequate** for password hashing — they are too fast and
  lack a work factor.
- **Safe token and password comparison**: use constant-time comparison
  functions (timing-safe comparison) to avoid timing side-channel attacks.
- **Brute force**: limit login attempts per IP/account. Block or challenge
  after a configurable number of failures.

### 2.3 Input and Output Sanitization

- **Never trust input data**: every input coming from forms, URLs,
  headers, or external APIs must be validated and sanitized before use.
- **Dynamic HTML**: never render raw HTML provided by third parties without
  sanitization. Use the framework's native libraries with an explicit whitelist of
  allowed tags.
- **Output encoding**: data inserted into HTML, JSON, SQL, or logs must be
  encoded according to the destination context.
- **File uploads**: never trust the extension informed by the client. Validate
  the file's real type by byte signature (magic bytes) and restrict accepted types
  through a whitelist. Define explicit size limits per endpoint.
- **Data export**: user-provided data exported to interpretable formats
  (CSV, Excel, XML) must be sanitized against formula injection
  (`=`, `+`, `-`, `@` at the beginning of cells). A malicious text field must not
  become an executable formula on the recipient's machine.

### 2.4 Injection Prevention

- **SQL**: always use parameterized queries (prepared statements, named
  parameters). Never concatenate strings to assemble queries.
- **XSS**: sanitize all displayed content that originates from dynamic data.
- **Command Injection**: never pass user input to operating system command
  execution without rigorous validation.

### 2.5 HTTP Security Headers and CORS

Every web application must explicitly configure security headers:

- `Content-Security-Policy` (CSP): defines allowed origins for scripts, styles,
  and resources. It drastically reduces the XSS attack surface.
- `Strict-Transport-Security` (HSTS): forces HTTPS for a configurable period.
- `X-Frame-Options: DENY` or `SAMEORIGIN`: prevents clickjacking.
- `X-Content-Type-Options: nosniff`: prevents MIME-type sniffing.
- **CORS**: explicitly configure allowed origins. Never use a wildcard (`*`)
  on APIs that receive credentials.

### 2.6 Rate Limiting and Abuse Protection

- Limit requests per IP and per authenticated user on all public endpoints.
- Authentication and password recovery endpoints require stricter limits.
- Rate limit responses return `429 Too Many Requests` with a `Retry-After` header.
- **Payload limits**: define the maximum request body size per
  endpoint. Uploads and imports must have specific and explicit limits. Payloads
  above the limit are rejected before processing to avoid memory
  exhaustion.
- Consider CAPTCHA for registration and password recovery flows.

### 2.7 Credential and Configuration Management

- Credentials must never be in source code, under any circumstance.
- Sensitive settings (service URLs, keys, timeouts) must be externalized in
  environment variables or secrets vaults (Vault, AWS Secrets Manager, etc.).
- Periodic credential rotation as an operational practice.
- Validate at startup that all mandatory variables are present —
  fail with a clear error instead of starting with incomplete configuration.

### 2.8 Supply Chain Security

Third-party dependencies are an attack surface. Managing them is the team's
responsibility, not the framework's.

- **Automated auditing**: run known-vulnerability checks
  on dependencies as part of the CI pipeline (npm audit, Dependabot, Snyk, Trivy).
- **Versioned lock files**: `package-lock.json`, `poetry.lock`, `go.sum` must
  be under version control. Reproducible builds depend on them.
- **Version pinning**: prefer exact versions or restricted ranges. Avoid
  open ranges (`^`, `*`) in critical dependencies.
- **Update review**: update dependencies regularly, but with review
  — not automatically to production without validation.

### 2.9 Secure Logging

- Structured logging framework (not `println` or `console.log` in production).
- Never log personal data (PII), credentials, or tokens.
- Stack traces must appear in internal logs, never in HTTP responses to clients.
- Semantic log levels: DEBUG for development, INFO for normal flows,
  WARN for recoverable situations, ERROR for failures that require action.

### 2.10 Exception Handling

- A single global handler for unhandled exceptions, returning generic messages
  to the client.
- Internal error messages (with technical details) stay in the logs; the client
  receives only an HTTP code + a friendly message.
- Never expose class names, SQL queries, or internal structure in error responses.

### 2.11 Privacy and Personal Data Protection

Systems that collect or process personal data must treat privacy as an
engineering requirement, not as an isolated legal concern.

- **Data minimization**: collect only what is necessary for the functionality.
  Question every form field and every database column.
- **Retention with a defined deadline**: personal data must have an explicit
  retention policy. Data without business need must be deleted or anonymized
  automatically.
- **Right to deletion**: the system must be able to delete or anonymize data
  from a specific user on demand (LGPD art. 18, GDPR art. 17).
- **Explicit consent**: collection of non-essential data requires informed,
  recorded consent. Consent must be as easy to revoke as to grant.
- **Pseudonymization**: whenever possible, dissociate identifying data from behavior/
  usage data.
- **Transfer to third parties**: personal data sent to external services
  (analytics, CRM, etc.) requires a processing agreement and risk assessment.

### 2.12 AI-Assisted Security Review

Before deploying any endpoint that receives external data, ask the
AI assistant that generated the code for an **adversarial review** session:

> *"Try to break this code. Consider malformed payloads, missing fields,
> excessive size, simultaneous requests, weak authentication, and race conditions."*

This process is especially valuable for:
- **Small teams or solo developers** that do not have a SAST pipeline
  or formal security review.
- **Full context**: the AI that wrote the code knows the context — it can
  identify race conditions and logic issues that static analysis
  tools do not detect.
- **Immediacy**: it happens before deployment, not in an asynchronous pipeline.
- **Complementarity**: it does not replace formal SAST or professional pentesting — it reduces
  the cost of finding the most obvious bugs before they reach production.

---

## 3. Coupling and Cohesion

### 3.1 Single Responsibility (SRP)

Each module, class, component, or function must have **a single reason to change**.

Warning heuristics:
- Method longer than 30 lines: it probably does more than one thing.
- Component longer than 300 lines: it probably mixes responsibilities.
- Class that depends on more than 5 other services: it probably orchestrates too much.

### 3.2 Dependency Direction (Dependency Inversion)

High-level modules must not depend on low-level modules. Both must
depend on abstractions.

- Shared interfaces and models live in a neutral layer (`model/`, `shared/`,
  `core/`), never in specific components or pages.
- A child component must never import directly from another sibling component.
- Domain services must not know presentation details.
- The dependency flow in Clean Architecture goes from outside to inside:
  UI → Use Cases → Domain. Inner layers never reference outer layers.

### 3.3 Constructor Dependency Injection

Constructor-based dependency injection is superior to field injection:

- **Testability**: it allows instantiation with mocks without a DI container.
- **Immutability**: dependencies remain `final`/`readonly`.
- **Explicitness**: the constructor declares all dependencies, making
  coupling visible.
- **Fail fast**: a missing dependency fails at construction time, not at
  runtime.

### 3.4 Rule of Three for Abstraction

Duplicated code in two places is tolerable. On the third, abstract it.

- Avoid premature abstractions: three copied lines are better than a speculative
  abstraction.
- When abstracting, verify that the use cases are truly equivalent and not
  only superficially similar.

### 3.5 Modules with Clear Boundaries

Each module (feature, package, microservice) must have a well-defined public API.

- Export only what is consumed externally.
- Communication between modules must happen through contracts (interfaces, DTOs, events), never through
  direct access to internal state.

---

## 4. Coding Best Practices

### 4.1 Naming

- Names must reveal intent without requiring comments.
- Consistency: the same concept gets the same name throughout the system (not
  `customer` in one place and `user` in another).
- Verbs for methods/functions, nouns for classes/variables.

### 4.2 DTOs and Data Transfer

- DTOs are transport objects, not logic containers. No business methods.
- One DTO per use case: never mix fields from different queries in the same
  object.
- Field names consistent with the source (API, database, index) to make
  mental mapping easier.

### 4.3 Queries and Data Access

- Parameterized queries, always.
- Explicit aliases on every column for predictable DTO mapping.
- Complex queries centralized in constants or dedicated files, not embedded
  in service methods.
- Large text fields (CLOB, TEXT) require explicit handling to avoid
  memory and serialization issues.
- **Avoid N+1**: fetch related data in batches whenever possible.
  See also §6.4.
- **Indexes**: ensure proper indexes for the most frequent queries; review the
  execution plan for slow queries.

### 4.4 API Versioning

APIs consumed by external clients must be versioned from the start:

- Strategy by URL prefix (`/v1/`, `/v2/`) or by header (`Accept-Version`).
- Keep the previous version active for an announced period before discontinuing it.
- Never introduce breaking changes in an existing version — create a new one.
- Document the contract of each version (OpenAPI/Swagger recommended).
- **Proactive deprecation**: use `Deprecation` and `Sunset` headers (RFC 8594) to
  communicate programmatically to clients when a version will be discontinued.

### 4.5 Externalized Configuration

12-factor principle: all configuration that varies between environments (dev, staging,
production) must come from an external source.

- Configuration file with environment variable fallback.
- No hardcoded fallback value that masks missing configuration
  (especially dates, URLs, and size limits).
- **Startup validation**: the application must verify that all mandatory variables
  are defined and have valid values before accepting traffic.

### 4.5a Externalization of Business Data

Externalized configuration (§4.5) covers **technical** configuration: URLs,
keys, timeouts. There is a second category that also must not be
hardcoded: **business data**.

| Type | Examples | Appropriate place |
|------|----------|-------------------|
| Technical configuration | Service URLs, API keys, timeouts | Environment variables (12-Factor) |
| Business data | Products, prices, checkout URLs, catalogs | Versioned file (JSON/YAML) or database table |

Treating business data as environment variables is a common mistake — environment
variables are for ops, not for product. Business data that changes frequently
(new offer, price change, new catalog) must reside in
versioned catalog files or database tables, read
dynamically by the code without requiring redeploy.

### 4.6 Singleton for Heavy Thread-Safe Objects

Serializers (Jackson, Gson, System.Text.Json), HTTP clients, and connection pools
are thread-safe by design. Instantiate once and reuse.

- `new Serializer()` inside methods is a waste of CPU and memory.
- Inject as a container bean/singleton.

### 4.7 Idempotency and Concurrency

Operations that may be repeated (retries, duplicated messages, double-clicks)
must produce the same result regardless of the number of executions.

- **Idempotency keys**: creation endpoints and side-effecting operations
  must accept a unique identifier per operation, returning the existing
  result if it was already processed.
- **Optimistic locking**: use a version or ETag to detect concurrent update
  conflicts instead of exclusive locks that reduce throughput.
- **Atomic operations**: when multiple writes must remain consistent, use
  database transactions or compensation patterns (saga) in distributed systems.

---

## 5. Frontend Component Architecture

### 5.1 Smart/Dumb Pattern (Container/Presentational)

- **Smart (Pages/Containers)**: manage state, make HTTP calls, orchestrate
  flows. Few per feature.
- **Dumb (Presentational)**: receive data through input properties and emit
  events through callbacks. No business logic, no HTTP calls.
- **Benefits**: testability (dumb is pure Input→Output), reusability,
  traceability (state centralized in the smart component).

### 5.2 Change Detection and Derived State

Optimized change detection strategies (e.g., OnPush in Angular, React.memo,
computed signals):

- **Derived data must be recalculated in ALL update flows**.
  If a derived variable `X` depends on `A` and `B`, every piece of code that changes `A` or
  `B` must recalculate `X`. A common failure is recalculating only in one flow and keeping a
  stale value in the others.
- **Immutability as a standard**: change by assignment, not mutation. Optimized
  frameworks compare references, not deep content.

### 5.3 Resource Lifecycle

Every allocated resource (subscription, listener, timer, observable) must be released
when the component is destroyed.

Accepted patterns (adapt to the framework in use):
- Automatic cancellation on navigation (e.g., switchMap cancels the previous request).
- Declarative binding with self-management (e.g., async pipe).
- Explicit destruction in the corresponding lifecycle hook.

Leak symptom: the application gets slower with prolonged use without refresh.

### 5.4 Strict Typing

- Eliminate `any` wherever an interface exists or can be created.
- Never suppress type errors with forced casting (`as any`). If the type does not match,
  the interface needs adjustment, not a workaround.
- Correct types are living documentation: they say what the code expects to receive and
  return.

### 5.5 On-Demand Loading

- Lazy-loaded modules/routes: the initial bundle contains only what is necessary for
  the first screen.
- Images with native lazy loading.
- Long lists with virtualization (render only the items visible in the viewport).

### 5.6 Shared State Management

Shared state between multiple components requires an explicit strategy to
avoid inconsistencies (stale state, partial updates, race conditions).

- **Services with reactive state** (e.g., `BehaviorSubject`, `signal()`) as a local
  store for small domains. Each service manages one slice of state and exposes
  data via observables/signals — components subscribe instead of storing copies.
- **State management libraries** (e.g., NgRx, NGXS, Pinia, Redux) only when
  the state is complex enough to justify the overhead: multiple interdependent
  domains, undo/redo, required time-travel debugging.
- **Practical rule**: if two components need the same data updated in real
  time, the source of truth is an injected service — never cascading `@Input()` or
  global variables.
- **Immutability**: always emit a new object/array instead of mutating the existing one.
  Reactive frameworks depend on reference-based detection (see §5.2).

---

## 6. Efficiency and Optimization

### 6.1 Network Requests

- **Cancel obsolete requests**: when triggering a new search, cancel the
  previous one automatically (e.g., switchMap, AbortController).
- **Debounce on inputs**: 400–800ms for free-text fields (see also §1.2).
- **Real pagination**: never bring all records and paginate on the frontend. Use
  cursor/offset in the backend.
- **Smart cache**: data that changes rarely (reference lists, catalogs)
  can be cached with TTL and a `stale-while-revalidate` strategy when
  applicable. Data that changes frequently should always be fetched fresh.
- **Cache invalidation**: define an explicit strategy (event-driven, TTL,
  write-through). Cache without planned invalidation is a guaranteed source of intermittent
  bugs.

### 6.2 Rendering

- Optimized change detection strategy on pure components.
- Never call functions directly in templates — use precomputed properties.
- Tracking identifier (`trackBy`, `key`) on every list iteration.

### 6.3 Bundle and Delivery

- Lazy loading for routes/modules.
- Optimized images (modern format, proper dimensions, lazy loading).
- Minification and tree-shaking enabled in the production build.
- Periodic bundle analysis to identify unnecessary dependencies.

### 6.4 Backend

- Connection pooling for databases.
- Heavy thread-safe objects as singletons.
- Avoid N+1 queries: fetch related data in batches whenever possible.
  See also §4.3.
- Proper database indexes for the most frequent queries.

---

## 7. Resilience and Fault Tolerance

Production systems fail. The question is not if, but when. Quality
engineering anticipates failures and limits their impact.

> **Scale note:** The patterns in this section scale with system complexity.
> For monoliths with low volume and no calls to external services, prioritize:
> explicit timeouts (§7.1) and retries with backoff (§7.2). Circuit breaker (§7.3),
> bulkhead (§7.4), and dead letter queues (§7.5) become relevant when there are
> calls to external services or when migrating to a service-oriented architecture.

### 7.1 Explicit Timeouts

Every call to an external resource (HTTP, database, queue, cache) must have an explicitly
configured timeout. The framework default timeout is often infinite
or inadequate.

- Define connection and read timeouts separately.
- Values must be based on the called service's SLA, not guesswork.

### 7.2 Retries with Exponential Backoff

Transient failures (timeout, 503, connection reset) justify automatic retry,
but with discipline:

- **Exponential backoff with jitter**: avoid a retry storm where all clients
  retry simultaneously.
- **Maximum number of attempts**: configurable, typically 3–5.
- **Only for transient errors**: never retry 400 Bad Request or
  422 Validation Error.

### 7.3 Circuit Breaker

When a downstream service is consistently failing, stop calling it
temporarily to avoid a failure cascade.

- States: closed (normal) → open (blocking) → half-open (testing
  recovery).
- Can be combined with fallback: return a default value, stale cache, or degraded
  response while the circuit is open.

### 7.4 Bulkhead (Resource Isolation)

Shared resources (thread pools, connection pools, queues) must be isolated
by domain or criticality to prevent one failing flow from consuming all
system resources.

### 7.5 Dead Letter Queues and Compensation

Messages that repeatedly fail in asynchronous processing must be diverted
to a dead letter queue, not silently discarded.

- Monitor DLQ size with alerts.
- Compensation processes (saga pattern) for distributed operations that cannot
  use a single transaction.

---

## 8. Testing Strategy

### 8.1 Fundamental Principles

- **Test behavior, not implementation**: if the internal code changes but the
  result is the same, the test must not break.
- **AAA pattern**: Arrange (prepare the scenario), Act (execute the action), Assert (verify the
  result). Clear separation of the three phases.
- **One main assert per test**: makes diagnosis easier when it fails.
- **Fast tests by default**: unit tests run in milliseconds. Slow tests
  (network, database, I/O) live in a separate suite.
- **Descriptive naming**: the test name must describe the scenario and the
  expected result, eliminating the need to read the code to understand what
  failed.

### 8.2 Test Pyramid

```
      /  E2E  \        ~2% — Critical end-to-end flows
     /----------\
    / Integration \   ~18% — Boundaries: API, database, external services
   /--------------\
  /    Unit       \   ~80% — Isolated logic, transformations, validations
 /------------------\
```

- **Unit**: pure functions, services with mocked dependencies, data
  transformations.
- **Integration**: controller + service + real repository (or testcontainer),
  real HTTP calls to mocked services.
- **E2E**: complete user flow — few tests, focused on the most critical
  business paths.

### 8.3 Testability as an Architectural Requirement

Code that is hard to test is code with design problems:

- Constructor dependency injection is a prerequisite for mocks.
- Monolithic components (God Components) are impossible to test in an
  isolated way — decompose first.
- Shared global state makes isolation difficult — prefer local
  or injected state.

### 8.4 Regression Practice

- **Bug = failing test**: before fixing it, write the test that reproduces it.
  The test fails, apply the fix, the test passes. This guarantees the bug never returns.
- **Progressive coverage**: do not seek 100% immediately. Start by covering the
  areas with more bugs or higher business risk, expanding sprint by sprint.

### 8.5 What NOT to test

- Declarative configuration code (routes, modules, beans without logic).
- Trivial getters/setters.
- Code that will be refactored in the next sprint — test the new version.
- Framework internals (do not test whether the DI container injects correctly).

---

## 9. Observability and Operations

### 9.1 Logs, Metrics, and Traces

The three pillars of observability must be present in production systems:

- **Logs**: discrete events with context (request ID, user, duration). See §2.9.
- **Metrics**: numeric data aggregated over time (p95/p99 latency, error rate,
  throughput, resource usage). Tools: Prometheus, CloudWatch, Datadog.
- **Distributed traces**: tracking of a request across multiple
  services. Tools: Jaeger, Zipkin, OpenTelemetry.

### 9.2 Health Checks and Alerts

- Every service exposes a health check endpoint (`/health`, `/readiness`, `/liveness`)
  for use by orchestrators (Kubernetes, load balancers).
- Alerts configured for anomalies: error rate above baseline, latency
  above SLA, resource saturation.
- The team cannot depend on the user to discover failures in production.

**Low-cost alerting alternatives:** For small projects,
solo developers, or early-stage startups, messaging services such as
Telegram Bots, Discord Webhooks, or Slack Webhooks provide an alerting channel
with minimal setup (~10 minutes), zero cost, and native mobile push notifications.
They do not replace metrics (no time series, no anomaly correlation),
but they are valid options for the **notification** layer in low-budget
contexts. The distinction between an *observability system* and a *notification
channel* must be clear: the former measures; the latter alerts.

### 9.3 Database Migrations

- Schema changes must be versioned and executed reproducibly.
  Tools: Flyway, Liquibase, Alembic.
- Every migration must be testable and, when possible, reversible.
- Destructive migrations (drop column, rename table) require a compatibility
  window: first make the code compatible with both states;
  then apply the schema change; then remove the legacy code.
- Never run a manual migration in production without a corresponding versioned script.

### 9.4 Backup and Disaster Recovery

- **Automated backup**: databases with periodic, tested backups.
  An untested backup is an assumption, not a guarantee.
- **RTO (Recovery Time Objective)**: maximum acceptable time to restore the
  service after failure. It defines the urgency of the recovery process.
- **RPO (Recovery Point Objective)**: maximum acceptable data loss (e.g., the last
  5 minutes). It defines backup and replication frequency.
- **Recovery tests**: periodically execute backup restoration in a
  controlled environment. The team must practice the process before needing it.
- **Runbooks**: documented recovery procedures for known scenarios
  (database failure, data corruption, service outage).

### 9.5 Alternative Persistence for Low-Volume Systems

Not every system needs a relational database. There is a spectrum of
persistence options suitable for each system profile:

```
local file → storage API (GitHub, S3) → KV store (Redis, Cloudflare KV) → relational database
```

For low-volume serverless systems (dozens to hundreds of operations/day),
alternatives such as GitHub API as storage (automatic versioning through commits,
reused authentication, zero cost) or KV stores are legitimate options when:

- Write volume < 100 operations/hour
- There is no need for complex relational queries
- Infrastructure cost is a real constraint
- Auditability (commit history) is more valuable than performance

The choice must be documented as an architectural decision (§11.2), not as an
implicit shortcut.

---

## 10. Delivery Pipeline (CI/CD)

### 10.1 Continuous Integration

- Every commit to the main branch triggers an automated pipeline.
- The pipeline includes, in order: lint → build → unit tests → integration
  tests → static analysis → security analysis (SAST/SCA) → image/artifact
  build.
- A broken build blocks merge. Nobody overrides a red build.

### 10.2 Branch Protection and Quality Gates

- Protected main branch: does not accept direct push.
- Pull requests require: approval from at least one reviewer + green pipeline.
- Automatic gates may include: minimum test coverage, absence of
  known vulnerabilities, cyclomatic complexity limits.

### 10.3 Continuous Delivery

- The artifact generated by CI is the same one promoted to production — never a manual rebuild.
- Staging and production environments receive the same artifact, with different
  configuration through environment variables.
- Safe deployment strategies: blue/green, canary, feature flags for
  progressive exposure control.

### 10.4 Branch Strategy and Conventional Commits

Organized code requires discipline in branch names and commit messages. Without a
convention, history becomes noise and traceability disappears.

- **Protected main branch**: `main` (or `master`) does not accept direct push.
  Feature branches with type prefix: `feat/`, `fix/`, `docs/`, `refactor/`,
  `test/`, `chore/`.
- **AI agent branches**: `ai/` as a generic prefix for automated contributions (e.g., `ai/feat-login`); tool-specific prefixes are also valid (`copilot/` for GitHub Copilot). Using a consistent AI prefix allows tracking and filtering automated versus human contributions.
- **Conventional Commits**: messages in the format `type(scope): short description`.
  Types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`.
  Example: `feat(transaction): add CSV duplicate detection by hash`.
- **Benefits**: automated changelog, traceability commit → issue → sprint,
  easier review by change type.
- **Squash merge in PRs**: each feature = one clean commit in main history.
  The PR preserves granular history, while main preserves the delivery narrative.

---

## 11. Quality and Maintainability

### 11.1 Conscious Technical Debt

Technical debt is acceptable when:
- It is **conscious**: the team knows it exists and recorded it in the backlog.
- It is **bounded**: it affects a restricted scope and does not contaminate new features.
- It has a **repayment plan**: a sprint or milestone is scheduled for resolution.

Technical debt is unacceptable when:
- It is invisible (nobody knows it exists).
- It grows silently (every new feature adds more debt in the same place).
- It blocks tests, deployments, or onboarding.

### 11.2 Documentation as Code

- **Architectural decisions**: record the "why," not just the "how."
  The established standard is the **ADR (Architecture Decision Record)**: a short
  document that describes context, the decision made, alternatives considered, and consequences.
  ADRs are **immutable** — an overridden decision generates a new ADR that references the
  previous one; it never edits the original.
  Decisions without records are knowledge debt.
- **Documentation close to the code**: in versioned files, not in disconnected
  Wikis. If the code changes, the documentation follows in the same commit.
- **Avoid duplication**: one piece of information in a single place. If it needs to appear in
  two contexts, one of them must be a reference (link), not a copy.
- **Comments on key functions**: public functions in services, controllers,
  utilities, and business-rule modules must have a comment or docstring that
  describes: what the function does, relevant parameters, return value, and side
  effects (if any). Comments explain the "why" — the code already explains
  the "how." Avoid obvious comments that repeat what the code already says; prioritize
  business context, non-obvious constraints, and design decisions.

**Spectrum of formats by context:**

| Context | Recommended format |
|---------|--------------------|
| Team > 3 people, long-lived system | Classic ADR (immutable) |
| Solo or pair, product under validation | Operational DECISIONS.md (mutable, focused on present state) |
| Project with AI as co-pilot | DECISIONS.md + session briefs (§A.3) |

The choice is not between "ADR or nothing" — it is between a formal ADR and an
alternative appropriate to the context. Operational DECISIONS.md captures "what was decided" and
"what was discarded and why," focused on the present state. The trade-off is
explicit: it loses historical traceability and gains clarity of the current state.

### 11.3 Review and Checklist

Before every delivery:

**Blockers (do not proceed without resolving):**
- [ ] No credentials or sensitive data in code
- [ ] No debug outputs in production code
- [ ] Parameterized queries (no SQL concatenation)
- [ ] Dynamic HTML sanitized
- [ ] Correct types (no `any` where an interface exists)
- [ ] Resources (subscriptions, timers) released on destroy
- [ ] HTTP security headers configured
- [ ] Mandatory environment variables validated at startup
- [ ] Explicit timeouts on external calls
- [ ] Uploads validated by real type (magic bytes), not just extension

**Warnings (resolve when possible):**
- [ ] Constructor injection
- [ ] URLs and configs externalized
- [ ] New behavior covered by tests
- [ ] Descriptive and consistent names
- [ ] Versioned database migration (if applicable)
- [ ] Health check available (if applicable)
- [ ] Idempotent endpoints where applicable
- [ ] Accessibility verified (semantics, contrast, keyboard)
- [ ] Exports sanitized against formula injection (if applicable)

### 11.4 Technical Documentation Pattern: PCS

To document technical changes, follow the **Problem > Cause > Solution** model:

- **Problem**: describe the incorrect behavior from the user's point of view.
  How to reproduce it.
- **Root Cause**: why it exists in the code. Which technical flow leads to the problem.
- **Solution**: the precise action applied + why it works. Refer to the
  concept (pattern, principle) that grounds the fix.

---

## 12. Conceptual References

| Concept | Application | Reference |
|---------|-------------|-----------|
| SOLID | Each class/component with one responsibility; inverted dependencies | Robert C. Martin, *Clean Architecture* |
| 12-Factor App | Environment-based configuration, logs as stream, explicit dependencies | [12factor.net](https://12factor.net) |
| OWASP Top 10 | Sanitization, parameterization, authentication, secure logging, CSRF, headers | [owasp.org/Top10](https://owasp.org/www-project-top-ten/) |
| Test Pyramid | Many unit tests, few E2E tests | Martin Fowler, *TestPyramid* |
| Inverted Pyramid (Journalism) | General context before specific detail in UIs | — |
| Fitts's Law | Click targets sized proportionally to frequency of use | — |
| Clean Architecture | Dependency flow from outside to inside (UI → Service → Domain) | Robert C. Martin, *Clean Architecture* |
| DRY (Don't Repeat Yourself) | With caution — rule of three before abstracting | Andy Hunt & Dave Thomas, *The Pragmatic Programmer* |
| YAGNI | Implement only what is necessary now | — |
| KISS | The simplest solution that works is the best | — |
| ADR | Record of architectural decisions with context and alternatives | Michael Nygard, [cognitect.com/blog](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) |
| OpenTelemetry | Open standard for instrumenting logs, metrics, and traces | [opentelemetry.io](https://opentelemetry.io) |
| SemVer | API and library versioning with a clear compatibility contract | [semver.org](https://semver.org) |
| WCAG | Accessibility guidelines for web content | [w3.org/WAI/WCAG21](https://www.w3.org/WAI/WCAG21/quickref/) |
| RFC 8594 | Deprecation and Sunset headers for API lifecycle | [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc8594) |
| Resilience Patterns | Circuit breaker, bulkhead, retry, timeout | Michael Nygard, *Release It!* |
| Defense in Depth | Each layer independently secure; if one fails, the next protects | — |

---

## Appendix A — AI-Assisted Documentation Protocol

> This appendix guides AI assistants (Copilot, Claude, Cursor, Gemini, etc.) on how to conduct
> the documentary structuring of a project after reading this principles guide.
> The goal is to generate living, versioned, actionable technical documentation — not
> bureaucratic artifacts that nobody consults.

### A.1 Documentation Onboarding Flow

After reading this file (`engineering-principles.md`) together with any
project-specific instructions (see BOOTSTRAP.md for the tool-specific filename — e.g.,
`copilot-instructions.md`, `CLAUDE.md`, `.cursorrules`), the AI must conduct the
following flow of questions with the user, **in the order presented**:

---

**Step 1 — Project Technical Guidelines**

> *"Based on the engineering principles and what I know about the project so far,
> I can generate a **technical guidelines** file (`diretrizes-tecnicas.md`)
> that combines the general principles with the decisions, patterns, and conventions already
> applied in this specific system — including stack, frameworks, code
> patterns, pre-commit checklist, and references to project fields/components.
> Would you like me to create this document?"*

**What the document should contain:**
- General principles **applied to the project's context** (not a copy — reference
  to `engineering-principles.md` + specific detailing).
- Technical decisions already made and the "why" of each.
- Code patterns with concrete examples from the project (wrong/right).
- Pre-commit checklist with stack- and project-specific items.
- Contextualized testing strategy (priorities, frameworks, goals).
- Quick reference to relevant fields, indexes, endpoints, or structures.

**Principle:** Technical guidelines **reference** the general principles and
add what is specific. They never duplicate content from the base document.

---

**Step 2 — Structural Analysis**

> *"I can scan the project code and generate a **structural analysis** file
> (`structural-analysis.md`) that maps the current technical state: fixes already
> applied, pending items classified by severity (critical, important, minor),
> recorded decisions, and out-of-scope items. This document works as a living
> 'X-ray' of the project. Would you like me to create it?"*

**What the document should contain:**
- **Already applied fixes**: table with number, description, file, and date.
- **Technical pending items by severity**:
  - 🔴 **Critical** — impacts behavior in production.
  - 🟠 **Important** — quality, maintainability, and bug risk.
  - 🟡 **Minor** — standardization and cleanup.
- Each pending item with: identifier, file(s), problem description, and suggested
  action. **PCS** format (Problem > Cause > Solution) when applicable.
- **Count summary** by level and status.
- **Security analysis** (summary of vulnerabilities when applicable).
- **Out-of-scope items**: what should not be fixed without prior alignment.

**Principle:** Document updated every session. Resolved pending items are
marked with ✅ and a date, not deleted.

---

**Step 3 — Architectural Map**

> *"I can generate an **architecture** file (`architecture.md`) that documents
> the structural map of the project: layers, components, data flows,
> external integrations, and infrastructure decisions. This document allows
> anyone (or any AI) to understand the system structure without reading code.
> Would you like me to create it?"*

**What the document should contain:**
- **Overview**: ASCII diagram of layers and their connections.
- **Backend layers**: controllers, services, repositories, DTOs, configs
  — with tables describing each element and its responsibility.
- **Frontend layers**: pages (smart), components (dumb), services, models.
- **Data flows**: step-by-step narrative of the main flows
  (e.g., "1. User types → 2. Component builds request → 3. Service sends...").
- **External integrations**: protocols, consumed endpoints, configurations.
- **Data mapping**: fields, types, analyzers (if applicable).
- **Build and deploy**: how the project is built and delivered.

**Principle:** The document describes **what exists**, not what should exist.
Non-implemented capabilities may be listed as backlog at the end.

---

**Step 4 — Lessons Learned**

> *"Finally, I can create a **lessons learned** file (`lessons-learned.md`)
> where we record important errors, discoveries, and decisions from each development
> session. Each entry follows the format Context > Problem > Rule,
> serving as a basis to prevent errors from repeating. Would you like me to create it?"*

**What the document should contain:**
- Entry format:
  ```
  ### [DATE] Short title
  **Context:** what was being done
  **Problem:** what went wrong or what we discovered
  **Rule:** what to do/avoid in the future
  ```
- Filled manually or with AI assistance after each session.
- As it grows, group by category (UX, Security, Backend, Frontend,
  Infrastructure) to make consultation easier.

**Principle:** Each entry is self-contained and referenceable. The file replaces
context memory lost between sessions.

---

### A.2 Recommended Folder Structure

> **Note:** The structure below is a generic organizational template. Adapt names
> and granularity to the project context. What matters is that the files are
> versioned and close to the code. If `docs/` already lives at the repository root, keep it.
> Larger projects may subdivide by theme (e.g., `docs/seguranca/`, `docs/processo/`).

```
docs/
├── engineering-principles.md    ← This file (general principles — project-independent)
│
│   # Structural documents (Steps 1–4 of §A.1)
├── diretrizes-tecnicas.md       ← Project stack patterns and conventions
├── structural-analysis.md       ← Living technical state (pending items, fixes)
├── architecture.md              ← Structural map (layers, entities, flows)
├── lessons-learned.md           ← Errors and discoveries per session (managerial complement)
├── HISTORY.md                   ← Continuity between sessions (operational state — §A.3)
│
│   # Domain documents (vary according to project scope)
├── REQUISITOS.md                ← SRS — functional and non-functional requirements
├── TECNOLOGIAS.md               ← Educational guide to the chosen technologies
├── PLANO_TESTES.md              ← Testing strategy and test cases
├── MELHORIAS.md                 ← Strategic backlog of future features
├── COMO_USAR.md                 ← Practical setup and system usage guide
│
│   # Process documents (adapt to the adopted methodology)
├── SCRUM.md                     ← Process, ceremonies, labels, story points
├── INDEX.md                     ← Master index with reading routes by profile
│
│   # Decision records
└── adr/                         ← Architecture Decision Records (§11.2)
    ├── 001-titulo-da-decisao.md
    └── ...
```

**Principles of this structure:**
- **Separation by theme**: avoid very large and overly generic files. If a
  document exceeds ~500 lines or mixes distinct themes (e.g., requirements +
  process + technology), consider subdividing.
- **Clear hierarchy**: structural documents (the 5 from §A.1) are the foundation;
  domain and process documents rely on and reference them.
- **Index as navigation hub**: one document centralizes links and reading routes by
  profile, preventing new collaborators from having to guess where
  to start.
- **No document exists in isolation**: each file must have a clear reference
  to the principle or guideline that justifies its existence.

### A.3 Session Continuity (Session Briefs)

AI does not have persistent state between sessions. When a new AI assistant
session starts, the agent begins from zero — it reads the code, reads the
docs, reconstructs the context. This is slow, expensive (tokens), and imprecise.

**Session briefs pattern:**

> At the end of each significant work session, the agent must write
> a handoff file containing: what was in progress, what was
> completed, decisions made, identified next steps, and active
> blockers. This file is automatically read at the start of the next session,
> eliminating the need for complete context reconstruction.

**Implementation in this project:** [`HISTORY.md`](HISTORY.md) — mandatory
continuity file that materializes this pattern. It contains:
- **Current State** — project phase, items in progress, blockers
- **Next Steps** — what the next session should prioritize
- **Delivery History** — reverse chronological record of each session

Format of each history entry:
```
### [YYYY-MM-DD] Short session title
**Responsible:** Name or agent
**Deliveries:** What was completed
**Decisions:** Technical or product decisions made
**Next steps:** What the next session should do
**Blockers:** Identified impediments (or "None")
```

**Relationship with `lessons-learned.md`:**
- `HISTORY.md` = **operational state** (what is happening now, handoff between sessions)
- `lessons-learned.md` = **managerial complement** (durable rules extracted from past errors)

Both are mandatory. HISTORY answers "where are we?"; lessons-learned
answers "what did we learn?".

It is the equivalent of the "handoff" that healthcare professionals perform during shift
change: the current state of the patient, what was done, and what needs
immediate attention.

### A.4 Maintenance Rules

- **`engineering-principles.md`** is organizational — it changes rarely, by team
  decision. It is not changed per development session.
- **`diretrizes-tecnicas.md`** changes when new technical decisions are made
  in the project.
- **`structural-analysis.md`** is updated every session — resolved pending items
  get ✅, new pending items are added.
- **`architecture.md`** changes when there are structural changes (new modules,
  package refactors, new integrations).
- **`lessons-learned.md`** is updated after each significant session —
  a managerial complement with durable rules.
- **`HISTORY.md`** is updated at the **beginning and end** of every session —
  the operational continuity file (§A.3). Mandatory consultation.

### A.5 Expected AI Behavior

When presented with these documents together with a project's code:

1. **Consult `HISTORY.md` first** (mandatory action) — read the current state,
   blockers, and next steps from the last session. This guarantees continuity and
   avoids rework. Without this consultation, the session loses the accumulated context.
2. **Read in abstraction order**: general principles → project instructions →
   requirements → technical guidelines → architectural map → structural analysis →
   lessons learned → improvement backlog → test plan.
3. **Check pending items** in the structural analysis before suggesting changes
   — avoid re-introducing problems already identified.
4. **Consult lessons learned** before applying patterns — avoid repeating
   already documented mistakes.
5. **Reference sections of the principles** when justifying technical decisions
   (e.g., "According to §2.3 — input sanitization...").
6. **Suggest document updates** when a session produces relevant fixes,
   decisions, or lessons.
7. **Never duplicate** content between documents — reference via relative
   path or section number.
8. **Consult specialized agents** if the repository has configured AI agents —
   delegate tasks to the correct domain agent.
9. **Keep comments on key functions** according to §11.2 — document business
   rules, constraints, and design decisions directly in the source code.
10. **Update `HISTORY.md` at the end** (mandatory action) — record deliveries,
    decisions, next steps, and blockers. The next session depends on this record.

---

## Appendix B — Human Contributor Onboarding

> Appendix A guides the AI. This appendix guides **people** arriving at a
> project who need to understand the system, contribute, and make informed decisions.

### B.1 Reading Path by Profile

A project's documentation must be navigable by profile. Each profile has a
reading route that prioritizes the most relevant documents for their role:

**🟢 New to the project (any profile):**
1. Project README — overview, architecture, and features
2. Documentation index — navigation and route specific to your profile
3. Requirements — what the system does (functional and non-functional requirements)

**🔧 Backend Developer:**
4. Setup guide — how to configure and run the development environment
5. Technical guidelines — code conventions, pre-commit checklist
6. Architectural map — entities, services, endpoints, data flows
7. Lessons learned — past mistakes that must not be repeated
8. Structural analysis — technical pending items and priorities

**🎨 Frontend Developer:**
4. Setup guide — how to configure and run the environment
5. Technical guidelines (frontend section) — component, state, and UX patterns
6. Architectural map (frontend section) — component structure, routes
7. Technologies — frontend frameworks, libraries, and design decisions

**📋 Product Owner / Manager:**
4. Improvement backlog — prioritized suggestions and product strategy
5. Process — methodology, sprints, ceremonies, Definition of Done
6. Evolution guide — improvement plan by dimension

**🧪 QA / Tester:**
4. Test plan — pyramid, cases, target coverage, tools
5. Usage guide — how to use each feature (for testing)
6. Structural analysis — technical debt that impacts quality

**🔒 Security Review:**
4. This document §2 — security principles (OWASP, authentication, sanitization)
5. Technical guidelines (security section) — project-specific implementation
6. Structural analysis (security section) — checklist of implemented / pending items

> **Note:** The route above is a template. Each project must create its own
> `INDEX.md` with direct links to the documents and sections relevant to each profile.

### B.2 Documents as Study Material

When well written, a project's documents transcend the specific context
and serve as educational material. Examples of educational value by document
type:

| Document Type | Concepts it teaches |
|---------------|---------------------|
| Engineering principles | SOLID, 12-Factor, OWASP, Clean Architecture, Resilience |
| Technologies | Chosen stack, ORM, authentication, design patterns |
| Lessons learned | Real debugging, architectural decisions, common pitfalls |
| Test plan | Test pyramid, white-box vs black-box, coverage |
| Process (SCRUM/Kanban) | Agile methodology, ceremonies, progress metrics |
| Improvement backlog | Product strategy, prioritization, roadmap |
| Structural analysis | Technical debt management, classification by severity |

### B.3 Onboarding Principle

The goal is not just to follow AI instructions or execute tasks mechanically.
Each document in a well-documented project explains the **"why"** in addition to the
**"how"**. A collaborator who understands the principles makes better decisions,
questions automated suggestions, and directs analyses with clarity.

> *"It is not enough to simply follow what the AI brings; it is also necessary to understand it
> in order to direct decisions and analyses clearly and directly."*

---

## Appendix C — Context as Graph: Depth and Breadth

> This appendix defines how AI assistants (and human contributors) should load
> project context efficiently. The goal is to maximize output quality while
> minimizing token consumption — treating context management as an engineering
> discipline, not an afterthought.

### C.1 The Context Graph Model

A project's documentation forms a directed graph. Each node is a document
or artifact; each edge is a "this requires that" dependency. Loading context
is a traversal problem.

```
engineering-principles.md       ← root: universal rules
    ↓
AI context file (LAYER 1)        ← project: what this system is and its rules
    ↓
*.agent.md (LAYER 2)             ← role: who is doing this session
    ↓
*.skill.md (LAYER 3)             ← method: how to do this specific thing
    ↓
.specify/specs/[feature].md      ← scope: what this feature must do
    ↓
.specify/tasks/[task].md         ← unit: what this session implements
```

Each layer is narrower and more specific. Moving up the graph costs tokens
but reduces ambiguity. Moving down costs fewer tokens but may miss context.

### C.2 Depth-First Traversal (default)

**Purpose:** implement a known, scoped task.

**Load sequence:**
1. AI context file — project context (always)
2. `.specify/tasks/[current-task].md` — task scope and verification
3. `.specify/specs/[feature].md` — feature requirements (if needed)
4. `git status` — uncommitted state

**Token cost:** minimal (~200–500 lines of critical context).
**Rule:** This is the default for all implementation sessions. Do not load
documents outside this scope unless a dependency error requires it.

### C.3 Breadth-First Traversal (situational)

**Purpose:** navigate across features, plan, or diagnose a cross-cutting issue.

**Load sequence:**
1. AI context file — project context (always)
2. `docs/INDEX.md` — project map and navigation routes
3. `docs/structural-analysis.md` — technical state and pending items
4. `docs/HISTORY.md` — operational state and blockers (if relevant)

**Token cost:** higher (~400–800 lines).
**Rule:** Use only when starting a new feature, writing a spec or plan,
or diagnosing a bug that crosses multiple modules.

### C.4 Token Efficiency Rules

| Rule | Rationale |
|------|-----------|
| Default to depth-first | Most sessions have a defined task; broad context is noise |
| Load `engineering-principles.md` rarely | It is immutable; load once per onboarding, not per session |
| Load role agents only when switching roles | An implementation session does not need the PO agent |
| Never load the entire project for a single task | Context window is a resource — treat it as one |
| Prefer reading task spec over reconstructing context | The spec exists so you do not have to re-explain |

### C.5 Relationship with SDD

Spec-Driven Development (see `skills/proc-sdd.md`) is the structural
practice that makes depth-first traversal possible. Without a task spec
file, the AI has no well-defined leaf node to target and must instead
load broad context to infer scope — which is expensive and imprecise.

The graph model and SDD are complementary:
- **SDD** creates the leaf nodes (task files) that depth-first traversal targets.
- **The graph model** defines *how* to load those nodes efficiently.

Projects that adopt both practices consistently reduce per-session token
consumption by 50–70% compared to sessions without structured context,
while improving output consistency across sessions.

### C.6 Saving Tokens as Responsible Engineering

Token efficiency is not a cost-optimization trick. It is a principle of
responsible AI use:

- **Quality:** a focused context produces more consistent outputs than a
  noisy one. The AI's reasoning degrades as the context window fills with
  irrelevant information.
- **Cost:** reduced token consumption directly reduces operational costs
  at any scale.
- **Sustainability:** in systems used at high volume, unnecessary context
  loading has a real energy cost.

> *Saving tokens is not about being cheap — it is about being precise.*
> *Precision in context is precision in output.*

