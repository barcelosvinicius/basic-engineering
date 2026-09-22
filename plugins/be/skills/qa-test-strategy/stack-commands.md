# Test strategy — tools and commands per stack

Lookup material for `qa-test-strategy`. Prefer the project's own scripts; these
are starting points when it has none.

## Mutation

| Stack | Tool | Run |
|---|---|---|
| Java / Kotlin (Maven) | PIT | `mvn test-compile org.pitest:pitest-maven:mutationCoverage` — narrow with `-DtargetClasses=com.acme.billing.*` |
| Java / Kotlin (Gradle) | PIT (`info.solidsoft.pitest` plugin) | `./gradlew pitest` |
| JavaScript / TypeScript | Stryker | `npx stryker init` once, then `npx stryker run` — narrow with `mutate` in the config |
| Python | mutmut | `mutmut run --paths-to-mutate src/billing/`, then `mutmut results` |
| .NET | Stryker.NET | `dotnet stryker` |

Read the report as a list of lines, not a score. Scope it to the critical
modules; a whole-codebase run is slow and produces a list nobody reads.

## Integration against the real dependency

| Stack | Tool | Note |
|---|---|---|
| Java / Spring | Testcontainers + `@SpringBootTest` or `@DataJpaTest` | `@Container static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16")` with `@DynamicPropertySource` |
| Node | Testcontainers for Node | `new PostgreSqlContainer().start()` in `before`, stop in `after` |
| Python | testcontainers-python | `with PostgresContainer("postgres:16") as db:` |
| Any | a temp directory / an in-memory broker | when the boundary is the filesystem or a queue you own |

Each test cleans up after itself or runs in a rolled-back transaction; no test
depends on the order of another (`qa-engineer`).

## End-to-end

| Tool | Run | Note |
|---|---|---|
| Playwright | `npx playwright test` | one spec per critical journey; retries hide flakiness — fix the wait, do not add retries |
| Cypress | `npx cypress run` | same rule |

## Load and performance

| Tool | Run | Where the SLO goes |
|---|---|---|
| k6 | `k6 run load.js` | `thresholds` — the run fails when the SLO is missed |
| Gatling | `mvn gatling:test` | `assertions` in the simulation |
| JMeter | `jmeter -n -t plan.jmx -l results.jtl` | assertions + a post-run check on the percentiles |
| Locust | `locust -f locustfile.py --headless -u 200 -r 20 -t 10m` | check the percentiles in the CSV report |

A k6 profile with the SLO as the pass condition:

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },  // ramp to the expected peak
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },  // growth horizon: twice the peak
    { duration: '5m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'], // the SLO, in milliseconds
    http_req_failed: ['rate<0.01'],
  },
};
```
