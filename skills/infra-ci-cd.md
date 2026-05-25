---
name: infra-ci-cd
description: >
  Estrutura do pipeline de integração e entrega contínua com GitHub Actions — build,
  testes, auditoria OWASP, Dependabot e Conventional Commits. Usar ao configurar ou
  evoluir os workflows de CI/CD de qualquer projeto.
---

# Skill: Pipeline CI/CD e Auditoria de Dependências

## O que é esta skill

Define a estrutura do pipeline de integração e entrega contínua, com foco especial
na auditoria automática de dependências. Use ao configurar ou evoluir os workflows
do projeto.

---

## Estrutura mínima do pipeline

```
lint → build → test-unit → test-integration → security-scan → build-image → deploy
```

Cada estágio só executa se o anterior passou. Build quebrado bloqueia tudo.

---

## Auditoria de dependências (I-06)

Esta é a implementação direta do item I-06 da `analise-estrutural.md`.

### Backend — Maven (OWASP Dependency Check)

```yaml
# .github/workflows/ci.yml
- name: Auditoria de dependências (backend)
  working-directory: backend
  run: |
    mvn org.owasp:dependency-check-maven:check \
      -DfailBuildOnCVSS=7 \
      -DsuppressionFile=owasp-suppressions.xml \
      --no-transfer-progress
  # failBuildOnCVSS=7 → bloqueia em CVEs com score ≥ 7 (High/Critical)
  # Ajustar para 9 no início se houver muitos falsos positivos
```

```xml
<!-- pom.xml — adicionar plugin -->
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
<!-- owasp-suppressions.xml — para falsos positivos documentados -->
<?xml version="1.0" encoding="UTF-8"?>
<suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
  <!--
  <suppress>
    <notes>Falso positivo: CVE-XXXX-YYYY não afeta este uso</notes>
    <cve>CVE-XXXX-YYYY</cve>
  </suppress>
  -->
</suppressions>
```

### Frontend — npm audit

```yaml
- name: Auditoria de dependências (frontend)
  working-directory: frontend
  run: |
    npm audit --audit-level=high
    # --audit-level=high → falha apenas em High e Critical
    # Usar 'moderate' se quiser ser mais restritivo
```

**Estratégia de adoção gradual:**

| Fase | Configuração | Objetivo |
|------|-------------|---------|
| Semana 1 | `--audit-level=critical` / `failBuildOnCVSS=9` | Sem bloqueio, só visibilidade |
| Semana 2–4 | `--audit-level=high` / `failBuildOnCVSS=7` | Bloqueia apenas críticos |
| Estável | `--audit-level=moderate` / `failBuildOnCVSS=5` | Padrão recomendado |

---

## Análise estática de segurança (SAST)

Complementa o OWASP Dependency Check (que verifica dependências) com análise do próprio código-fonte.
SAST detecta vulnerabilidades introduzidas pelo desenvolvedor que o SCA não encontra.

| O que SAST detecta | SpotBugs/find-sec-bugs | Semgrep |
|-------------------|----------------------|---------|
| SQL injection por concatenação de strings | ✅ | ✅ |
| Path traversal (`new File(input)`) | ✅ | ✅ |
| Log de dados sensíveis (`log.debug(password)`) | ✅ | ✅ |
| Deserialização insegura (`ObjectInputStream`) | ✅ | ✅ |
| Uso de `Random` em vez de `SecureRandom` | ✅ | ✅ |
| Credencial hardcodada no código | ✅ | ✅ |
| XSS em template de view | ❌ | ✅ |
| Token em localStorage (frontend) | ❌ | ✅ |
| eval() / new Function() | ❌ | ✅ |

### Backend Java — SpotBugs + find-sec-bugs

```xml
<!-- pom.xml — adicionar plugin -->
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
# .github/workflows/ci.yml — adicionar ao job de backend
- name: SAST — SpotBugs + find-sec-bugs
  working-directory: [BACKEND_DIR]
  run: |
    mvn com.github.spotbugs:spotbugs-maven-plugin:spotbugs \
      -Dspotbugs.failOnError=true \
      --no-transfer-progress
```

### Semgrep OSS — SAST sem GitHub Advanced Security

Semgrep é open source (LGPL-2.1), gratuito para repositórios públicos e privados,
sem necessidade de GitHub Advanced Security (GHAS). Funciona por pattern matching
semântico sobre o código-fonte — sem compilação necessária.

**Vantagens sobre CodeQL:**
- Funciona em repos privados sem GHAS pago
- Sem build — analisa código-fonte diretamente (execução em segundos)
- Rulesets da comunidade + regras customizadas em YAML simples
- `p/owasp-top-ten` cobre A01–A10 nativamente

**Estrutura de regras customizadas recomendada:**

```
.semgrep/
  rules/
    [linguagem-backend]/    # ex: java/, python/, go/
      no-secret-hardcoded.yml
      no-sensitive-logging.yml
      no-weak-hash.yml
      no-insecure-random.yml
      no-sql-string-concat.yml
    [linguagem-frontend]/   # ex: typescript/, javascript/
      no-localstorage-auth.yml
      no-console-log-sensitive.yml
      no-innerhtml-xss.yml
      no-eval.yml
```

**Workflow GitHub Actions:**

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

    - name: Semgrep — Backend (OWASP Top 10 + regras customizadas)
      run: |
        semgrep scan \
          --config p/[linguagem] \
          --config p/owasp-top-ten \
          --config p/secrets \
          --config .semgrep/rules/[linguagem-backend] \
          --error \
          --json-output semgrep-backend.json \
          [backend-dir]/

    - name: Semgrep — Frontend (+ regras customizadas)
      run: |
        semgrep scan \
          --config p/typescript \
          --config p/secrets \
          --config .semgrep/rules/[linguagem-frontend] \
          --error \
          --json-output semgrep-frontend.json \
          [frontend-src-dir]/

    - name: Upload resultados Semgrep (JSON)
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: semgrep-results
        path: |
          semgrep-backend.json
          semgrep-frontend.json
        retention-days: 7
```

**Criar regra customizada:**

```yaml
# .semgrep/rules/[lang]/minha-regra.yml
rules:
  - id: minha-regra
    pattern-either:
      - pattern: padrão-inseguro-1(...)
      - pattern: padrão-inseguro-2(...)
    message: >
      Explicação do problema e como corrigir.
    languages: [java]    # ou typescript, python, go...
    severity: ERROR      # ou WARNING, INFO
    metadata:
      category: security
      owasp: "A0X:2021 - ..."
      cwe: "CWE-XXX: ..."
```

**Rulesets da comunidade disponíveis:**

| Ruleset | Cobertura |
|---------|-----------|
| `p/java` | Boas práticas Java — NPE, resource leaks, inicialização |
| `p/javascript` | Boas práticas JS — prototype pollution, XSS DOM |
| `p/typescript` | Type safety — any abuse, casting inseguro |
| `p/python` | Boas práticas Python |
| `p/owasp-top-ten` | OWASP A01–A10 completo (multi-linguagem) |
| `p/secrets` | API keys, tokens, senhas hardcoded |
| `p/sql-injection` | SQL injection em múltiplas linguagens |

**Executar localmente:**

```bash
# Instalar
pip install semgrep

# Testar regras customizadas
semgrep scan --config .semgrep/rules/java backend/

# Testar ruleset da comunidade
semgrep scan --config p/owasp-top-ten backend/
```

---

### Dependabot (GitHub) — atualizações automáticas

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

---

## Pipeline completo (GitHub Actions)

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

      - name: Build e testes
        working-directory: backend
        run: mvn verify --no-transfer-progress

      - name: Auditoria de dependências
        working-directory: backend
        run: |
          mvn org.owasp:dependency-check-maven:check \
            -DfailBuildOnCVSS=7 --no-transfer-progress
        continue-on-error: false  # muda para true na fase de adoção

      - name: Relatório de cobertura
        uses: codecov/codecov-action@v4  # opcional
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

      - name: Instalar dependências
        working-directory: frontend
        run: npm ci  # ci é mais rápido e determinístico que install

      - name: Lint
        working-directory: frontend
        run: npm run lint

      - name: Testes
        working-directory: frontend
        run: npm test -- --watch=false --browsers=ChromeHeadless

      - name: Auditoria de dependências
        working-directory: frontend
        run: npm audit --audit-level=high

      - name: Build de produção
        working-directory: frontend
        run: npm run build -- --configuration production
```

---

## Gates obrigatórios antes de merge

```yaml
# .github/branch-protection.yml (configurar via GitHub Settings)
# Branch: main
# Rules:
#   ✅ Require status checks to pass:
#      - backend (CI Pipeline)
#      - frontend (CI Pipeline)
#   ✅ Require pull request reviews: 1 aprovação mínima
#   ✅ Dismiss stale reviews on new commits
#   ✅ Require branches to be up to date
#   ❌ Allow force pushes: NUNCA em main
```

---

## Conventional Commits no CI (M-05)

```yaml
# Validar mensagens de commit automaticamente
- name: Validar Conventional Commits
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

---

## Testes de acessibilidade no CI (M-07)

```yaml
# Adicionar ao job de frontend após build
- name: Testes de acessibilidade (Lighthouse CI)
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

---

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Pipeline lento (> 10min) | Cache não configurado | Adicionar `cache: 'maven'` e `cache: 'npm'` |
| Falsos positivos bloqueando | CVSS muito restritivo no início | Usar `continue-on-error: true` na fase de adoção |
| `npm install` em vez de `npm ci` | Não determinístico | Sempre `npm ci` no CI |
| Dependabot abre PRs demais | Muitas dependências | Limitar com `open-pull-requests-limit` |

---

*Skill — `.github/skills/infra-ci-cd.md`*
*Referência: `principios-engenharia.md` §2.8 (Supply Chain), §10 (CI/CD)*
*Pendências: I-06 (auditoria), M-05 (conventional commits), M-07 (a11y CI)*
