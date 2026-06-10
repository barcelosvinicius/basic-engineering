---
name: ops-observability
description: >
  Use when adding logging, metrics, or tracing; defining SLOs and alerts;
  writing runbooks; or preparing a service for production operation.
  Structured logs, the four golden signals, alert hygiene, and runbook
  discipline.
---

# Skill: Observability and Runbooks

Defines the minimum observability a service needs before production and how
to keep it operable afterwards. Reference: `engineering-principles.md` §7
(Resilience) and §9 (Observability).

## Structured logging

- **Structured format** (JSON or key=value) — logs are queried, not read.
- **Correlation ID per request** — generated at the edge, propagated to
  every downstream call and log line.
- **Levels with meaning:** `ERROR` = requires action; `WARN` = degraded but
  self-healing; `INFO` = business-relevant events; `DEBUG` = off in prod.
- **Never log secrets or PII** — scrub `Authorization` headers, passwords,
  tokens, documents/IDs at the middleware level (see `sec-secrets-management`).
- Log the **outcome of failures**, not just the exception: what request,
  which user (pseudonymized), what state.

## Metrics — the four golden signals

Every service exposes at minimum:

| Signal | Metric | Typical alert |
|--------|--------|---------------|
| Latency | p50/p95/p99 per endpoint | p99 above SLO for 5 min |
| Traffic | Requests/s | Drop to ~0 (outage indicator) |
| Errors | Error rate (5xx, business failures) | Rate above baseline |
| Saturation | CPU, memory, pool/queue usage | Sustained > 80% |

Plus a **health check endpoint** (`/health`) that verifies real dependencies
(database ping, queue connectivity), monitored externally.

## SLOs and alert hygiene

- Define 2–3 SLOs per service (e.g., "99.5% of requests under 500 ms",
  "99.9% availability monthly") — alert on SLO burn, not raw spikes.
- **Every alert must be actionable** — if the response to an alert is
  "ignore it", delete or tune the alert. Alert fatigue is an outage risk.
- Every alert links to its runbook.

## Runbooks

One runbook per recurring operation or failure mode, created from the base
template `templates/docs/runbook.template.md` into `docs/processo/runbooks/`.

Minimum content per runbook:

1. **Symptom** — what the operator sees (alert name, error pattern).
2. **Impact** — who/what is affected.
3. **Diagnosis** — exact commands/queries to confirm the cause.
4. **Mitigation** — step-by-step, copy-pasteable, no decisions left implicit.
5. **Escalation** — who to call when the steps don't work.

Update the runbook in the same PR as any change that alters the procedure.
After an incident, fold what was learned into the runbook and
`docs/lessons-learned.md`.

## Tracing (when there is more than one service)

- Propagate trace context (W3C `traceparent`) across HTTP/queue boundaries.
- Use OpenTelemetry-compatible instrumentation so the backend is swappable.
- Trace external calls and database queries — that is where latency hides.

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| Logs unsearchable in incident | Free-text logging | Structured format + correlation ID |
| Alert storm during deploys | Alerting on raw spikes | Alert on SLO burn rates with windows |
| Health check always green | Endpoint returns 200 unconditionally | Verify real dependencies |
| Runbook outdated at 3 a.m. | Procedure changed, doc didn't | Runbook update in the same PR |
| PII in logs | Logging whole request objects | Allowlist fields; scrub at middleware |
