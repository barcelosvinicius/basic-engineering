# CI/CD examples — GitHub Actions, Maven, npm

Copy-paste material for the `infra-ci-cd` skill. Load on demand and adapt
directory names / language packs to the project.

## Dependency audit — Maven (OWASP Dependency Check)

```yaml
# .github/workflows/ci.yml
- name: Dependency audit (backend)
  working-directory: backend
  run: |
    mvn org.owasp:dependency-check-maven:check \
      -DfailBuildOnCVSS=7 \
      -DsuppressionFile=owasp-suppressions.xml \
      --no-transfer-progress
  # failBuildOnCVSS=7 → blocks CVEs with score ≥ 7 (High/Critical)
  # Set to 9 initially if there are too many false positives
```

```xml
<!-- pom.xml — add plugin -->
<plugin>
  <groupId>org.owasp</groupId>
  <artifactId>dependency-check-maven</artifactId>
  <version>9.0.9</version>
  <configuration>
    <failBuildOnCVSS>7</failBuildOnCVSS>
    <suppressionFile>owasp-suppressions.xml</suppressionFile>
    <formats>HTML,JSON</formats>
  </configuration>
</plugin>
```

```xml
<!-- owasp-suppressions.xml — for documented false positives -->
<?xml version="1.0" encoding="UTF-8"?>
<suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
  <!--
  <suppress>
    <notes>False positive: CVE-XXXX-YYYY does not affect this usage</notes>
    <cve>CVE-XXXX-YYYY</cve>
  </suppress>
  -->
</suppressions>
```

## Dependency audit — npm

```yaml
- name: Dependency audit (frontend)
  working-directory: frontend
  run: |
    npm audit --audit-level=high
    # --audit-level=high → fails only on High and Critical
    # Use 'moderate' if you want to be stricter
```

## SAST — SpotBugs + find-sec-bugs (Java)

```xml
<!-- pom.xml — add plugin -->
<plugin>
  <groupId>com.github.spotbugs</groupId>
  <artifactId>spotbugs-maven-plugin</artifactId>
  <version>4.8.3.0</version>
  <dependencies>
    <dependency>
      <groupId>com.h3xstream.findsecbugs</groupId>
      <artifactId>findsecbugs-plugin</artifactId>
      <version>1.13.0</version>
    </dependency>
  </dependencies>
  <configuration>
    <effort>Max</effort>
    <threshold>High</threshold>
    <plugins>
      <plugin>
        <groupId>com.h3xstream.findsecbugs</groupId>
        <artifactId>findsecbugs-plugin</artifactId>
        <version>1.13.0</version>
      </plugin>
    </plugins>
  </configuration>
</plugin>
```

```yaml
# .github/workflows/ci.yml — add to the backend job
- name: SAST — SpotBugs + find-sec-bugs
  working-directory: [BACKEND_DIR]
  run: |
    mvn com.github.spotbugs:spotbugs-maven-plugin:spotbugs \
      -Dspotbugs.failOnError=true \
      --no-transfer-progress
```

## SAST — Semgrep OSS

Semgrep is open source (LGPL-2.1), free for public and private repositories,
and does not require GitHub Advanced Security. It analyzes source directly —
no compilation required.

Recommended custom rules structure:

```
.semgrep/
  rules/
    [backend-language]/    # e.g.: java/, python/, go/
      no-secret-hardcoded.yml
      no-sensitive-logging.yml
      no-weak-hash.yml
      no-insecure-random.yml
      no-sql-string-concat.yml
    [frontend-language]/   # e.g.: typescript/, javascript/
      no-localstorage-auth.yml
      no-console-log-sensitive.yml
      no-innerhtml-xss.yml
      no-eval.yml
```

Workflow:

```yaml
semgrep-sast:
  name: SAST — Semgrep Security Analysis
  runs-on: ubuntu-latest
  permissions:
    contents: read
  container:
    image: semgrep/semgrep
  steps:
    - uses: actions/checkout@v4

    - name: Semgrep — Backend (OWASP Top 10 + custom rules)
      run: |
        semgrep scan \
          --config p/[language] \
          --config p/owasp-top-ten \
          --config p/secrets \
          --config .semgrep/rules/[backend-language] \
          --error \
          --json-output semgrep-backend.json \
          [backend-dir]/

    - name: Semgrep — Frontend (+ custom rules)
      run: |
        semgrep scan \
          --config p/typescript \
          --config p/secrets \
          --config .semgrep/rules/[frontend-language] \
          --error \
          --json-output semgrep-frontend.json \
          [frontend-src-dir]/

    - name: Upload Semgrep results (JSON)
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: semgrep-results
        path: |
          semgrep-backend.json
          semgrep-frontend.json
        retention-days: 7
```

Custom rule template:

```yaml
# .semgrep/rules/[lang]/my-rule.yml
rules:
  - id: my-rule
    pattern-either:
      - pattern: insecure-pattern-1(...)
      - pattern: insecure-pattern-2(...)
    message: >
      Explanation of the problem and how to fix it.
    languages: [java]    # or typescript, python, go...
    severity: ERROR      # or WARNING, INFO
    metadata:
      category: security
      owasp: "A0X:2021 - ..."
      cwe: "CWE-XXX: ..."
```

Community rulesets:

| Ruleset | Coverage |
|---------|----------|
| `p/java` | Java best practices — NPE, resource leaks, initialization |
| `p/javascript` | JS best practices — prototype pollution, DOM XSS |
| `p/typescript` | Type safety — any abuse, unsafe casting |
| `p/python` | Python best practices |
| `p/owasp-top-ten` | Full OWASP A01–A10 (multi-language) |
| `p/secrets` | API keys, tokens, hardcoded passwords |
| `p/sql-injection` | SQL injection in multiple languages |

Run locally:

```bash
pip install semgrep
semgrep scan --config .semgrep/rules/java backend/
semgrep scan --config p/owasp-top-ten backend/
```

## Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/backend"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "type: chore"
      - "priority: medium"

  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "type: chore"
      - "priority: medium"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
```

## Full pipeline (backend + frontend)

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'maven'

      - name: Build and tests
        working-directory: backend
        run: mvn verify --no-transfer-progress

      - name: Dependency audit
        working-directory: backend
        run: |
          mvn org.owasp:dependency-check-maven:check \
            -DfailBuildOnCVSS=7 --no-transfer-progress
        continue-on-error: false  # change to true during adoption phase

      - name: Coverage report
        uses: codecov/codecov-action@v4  # optional
        with:
          directory: backend/target/site/jacoco

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci  # ci is faster and more deterministic than install

      - name: Lint
        working-directory: frontend
        run: npm run lint

      - name: Tests
        working-directory: frontend
        run: npm test -- --watch=false --browsers=ChromeHeadless

      - name: Dependency audit
        working-directory: frontend
        run: npm audit --audit-level=high

      - name: Production build
        working-directory: frontend
        run: npm run build -- --configuration production
```

## Branch protection (configure via GitHub Settings)

```
Branch: main
  ✅ Require status checks to pass: backend, frontend
  ✅ Require pull request reviews: minimum 1 approval
  ✅ Dismiss stale reviews on new commits
  ✅ Require branches to be up to date
  ❌ Allow force pushes: NEVER on main
```

## Conventional Commits validation

```yaml
- name: Validate Conventional Commits
  uses: wagoid/commitlint-github-action@v5
  with:
    configFile: commitlint.config.js
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'refactor', 'test',
      'chore', 'ci', 'style', 'perf', 'revert'
    ]],
    'subject-max-length': [2, 'always', 100],
  }
};
```

## Accessibility tests in CI (Lighthouse CI)

```yaml
# Add to the frontend job after build
- name: Accessibility tests (Lighthouse CI)
  run: |
    npm install -g @lhci/cli
    lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4200/login", "http://localhost:4200/dashboard"],
      "startServerCommand": "npm start"
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["warn", {"minScore": 0.85}]
      }
    }
  }
}
```
