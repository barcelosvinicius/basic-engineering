# 🚀 BOOTSTRAP — Guia de Início de Projeto

> **Este é o primeiro arquivo a ler em qualquer projeto novo.**
>
> Define a estrutura completa do sistema de documentação + agents + skills e a
> sequência exata de criação. Tudo que está em `.github/base/` pode ser copiado
> para qualquer projeto de software. O restante é específico de cada projeto.

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

- **Git** ≥ 2.x instalado
- **curl** ou **wget** (para verificação de versão)
- Acesso ao [repositório da base](https://github.com/barcelosvinicius/basic-engineering)
- Uma conta GitHub com permissão para criar repositórios

---

## Passo 0 — Verificação de versão

> **Sempre execute esta verificação antes de usar ou atualizar a base.**

Ao copiar a base para um projeto novo — ou após retornar a um projeto antigo — confirme
que sua cópia está na versão mais recente:

```bash
bash check-version.sh
```

| Resultado | Ação |
|-----------|------|
| ✅ `Sua base está atualizada` | Prossiga para o Passo 1 |
| 🔄 `Atualização disponível` | Baixe o `base-atualizacao.zip` mais recente e siga o procedimento de atualização abaixo |
| ⚠️ Sem conexão / erro | Prossiga com cautela; verifique a versão manualmente em `BASE_VERSION` |

### Como atualizar

1. Acesse o [repositório da base](https://github.com/barcelosvinicius/basic-engineering) e baixe `base-atualizacao.zip`
2. Extraia sobre a pasta `.github/base/` do seu projeto (sobrescreve apenas arquivos universais)
3. Execute `bash check-version.sh` novamente para confirmar
4. Revise o `CHANGELOG` da base e adapte seus agents/skills se necessário

> **Nota:** Arquivos customizados (`copilot-instructions.md`, `agents/`, `docs/`) nunca são
> sobrescritos pela atualização — são específicos do seu projeto.

---

## O que é `.github/base/`

A pasta `base/` contém os **arquivos fundacionais universais** — aqueles que funcionam
em qualquer projeto de software, independente de stack, domínio ou tamanho.

| Arquivo / Pasta | Tipo | O que faz |
|-----------------|------|-----------|
| `BOOTSTRAP.md` (este) | Universal | Explica a estrutura e a sequência de criação |
| `principios-engenharia.md` | Universal | Princípios de engenharia independentes de tecnologia |
| `roles/` | Templates | Esqueletos reutilizáveis para cada papel de agente (9 templates) |
| `skills/` | Universal | Skills universais copiáveis para qualquer projeto |

**Regra de ouro:** Se um arquivo contém nomes, tecnologias ou decisões de um projeto
específico → vai em `docs/` ou `.github/agents/` (projeto). Se funciona em qualquer
projeto → vai em `.github/base/`.

---

## As 5 camadas do sistema de documentação

```
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 0 — FUNDAÇÃO FILOSÓFICA          (.github/base/)        │
│  principios-engenharia.md                                        │
│  "Como pensar sobre software" — universal, imutável por projeto  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ informa
┌──────────────────────────▼──────────────────────────────────────┐
│  CAMADA 1 — CONTEXTO DO PROJETO         (.github/)              │
│  copilot-instructions.md                                         │
│  "O que é este projeto e suas regras" — específico              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ consulta
┌──────────────────────────▼──────────────────────────────────────┐
│  CAMADA 2 — PAPÉIS ESPECIALIZADOS       (.github/agents/)       │
│  dev-backend.agent.md, qa-engineer.agent.md, ...                │
│  "Quem faz o quê" — templates em base/roles/, customizados      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ usa
┌──────────────────────────▼──────────────────────────────────────┐
│  CAMADA 3 — CONHECIMENTO TÉCNICO        (.github/skills/)       │
│  be-pagination.md, fe-ux-patterns.md, proc-session-continuity, ...  │
│  "Como fazer" — domínio e stack específicos                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ atualiza
┌──────────────────────────▼──────────────────────────────────────┐
│  CAMADA 4 — DOCUMENTAÇÃO VIVA           (docs/)                 │
│  HISTORICO.md, analise-estrutural.md, lessons-learned.md, ...  │
│  "O que foi feito e o que falta" — muda a cada sessão           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hierarquia de autoridade (em caso de conflito, prevalece o mais específico)

```
principios-engenharia.md   (mais genérico — regras universais)
    ↓ especializa
copilot-instructions.md    (contexto do projeto)
    ↓ especializa
*.agent.md                 (papel e responsabilidades)
    ↓ especializa
*.skill.md                 (como fazer — mais específico)
```

---

## Sequência de criação — novo projeto do zero

### Passo 1 — Copiar a base universal

```bash
cp -r .github/base/ novo-projeto/.github/base/
cp .github/base/skills/proc-session-continuity.md \
   novo-projeto/.github/skills/proc-session-continuity.md
```

Arquivos copiados **sem editar**:
- ✅ `BOOTSTRAP.md` — este arquivo
- ✅ `principios-engenharia.md` — princípios universais (inclui Apêndice A e B)
- ✅ `skills/proc-session-continuity.md` — protocolo de sessão universal

Templates a customizar (copie de `base/roles/` para `agents/`):
- ⚙️ `roles/*.template.md` → customize e salve como `agents/[prefixo]-[nome].agent.md`

---

### Passo 2 — Criar `copilot-instructions.md`

Copie `base/copilot-instructions.template.md` para `.github/copilot-instructions.md`
e preencha todas as seções marcadas com `<!-- CUSTOMIZAR -->`.

Este arquivo é lido pelo GitHub Copilot em **toda** sessão de qualquer agente.
É o ponto de maior impacto — se desatualizar, todos os agentes perdem contexto.

Seções obrigatórias:
```
# Copilot Instructions — [Nome do Projeto]
## Sobre o projeto         ← 2-3 frases: o que faz, para quem, tecnologias
## Arquitetura             ← tabela: Camada | Tecnologia | Porta
## Estrutura do repositório ← árvore de pastas principais
## Convenções — Backend    ← padrões da linguagem/framework
## Convenções — Frontend   ← padrões do framework de UI
## Segurança               ← autenticação, autorização, segredos
## Regras de negócio       ← 3-5 regras críticas do domínio
## O que NÃO fazer         ← anti-patterns proibidos
```

---

### Passo 3 — Criar os agents

Para cada papel necessário, copie o template correto e customize:

| Template base | Renomear para |
|---|---|
| `roles/dev-backend.template.md` | `agents/dev-backend-developer.agent.md` |
| `roles/dev-frontend.template.md` | `agents/dev-frontend-developer.agent.md` |
| `roles/dev-data-analyst.template.md` | `agents/dev-data-analyst.agent.md` |
| `roles/mgmt-product-owner.template.md` | `agents/mgmt-product-owner.agent.md` |
| `roles/mgmt-project-manager.template.md` | `agents/mgmt-project-manager.agent.md` |
| `roles/mgmt-domain-expert.template.md` | `agents/mgmt-[dominio]-advisor.agent.md` |
| `roles/mgmt-architect.template.md` | `agents/mgmt-architect.agent.md` |
| `roles/qa-engineer.template.md` | `agents/qa-engineer.agent.md` |
| `roles/qa-security-reviewer.template.md` | `agents/qa-security-reviewer.agent.md` |
| `roles/qa-pentest-engineer.template.md` | `agents/qa-pentest-engineer.agent.md` |
| `roles/infra-devops.template.md` | `agents/infra-devops-engineer.agent.md` |
| `roles/ops-sre.template.md` | `agents/ops-sre.agent.md` |

Cada agent **obrigatoriamente** deve ter:
- [ ] Frontmatter YAML com `name` e `description`
- [ ] Seção de tecnologias específicas do projeto
- [ ] Seção de padrões de código obrigatórios
- [ ] Protocolo de sessão: referência a `proc-session-continuity`
- [ ] Seção `## Delegação automática` com tabela de triggers
- [ ] Checklist de entrega (Definition of Done do papel)

> **Nota:** Use apenas os agents relevantes para o projeto. Um projeto simples pode
> não precisar de data-analyst ou pentest-engineer. Instanciar agents sem uso real
> gera ruído de contexto.

---

### Passo 4 — Criar as skills e regras SAST

Skills são conhecimento técnico reutilizável que os agents consultam sob demanda.
Use `base/roles/skill.template.md` como ponto de partida para cada nova skill.

**Criar regras Semgrep customizadas (`.semgrep/rules/`):**

Além das skills, todo projeto deve ter regras SAST customizadas que refletem
as convenções e riscos específicos do domínio. Organizadas por linguagem:

```
.semgrep/
  rules/
    [linguagem-backend]/    # ex: java/, python/, go/
      no-secret-hardcoded.yml    — segredos no código
      no-sensitive-logging.yml   — log de dados sensíveis
      no-weak-hash.yml           — hash fraco para senhas
      no-insecure-random.yml     — PRNG não criptográfico
      no-sql-string-concat.yml   — SQL injection por concatenação
    [linguagem-frontend]/   # ex: typescript/
      no-localstorage-auth.yml   — token em localStorage
      no-console-log-sensitive.yml — log no console
      no-innerhtml-xss.yml       — XSS por innerHTML
      no-eval.yml                — eval() / new Function()
```

Consulte a skill `infra-ci-cd.md` para o template de regra e workflow completo.

**Skills universais (copiar de `base/skills/`):**
- `proc-session-continuity.md` — protocolo obrigatório de sessão (já copiado no Passo 1)
- `proc-code-review.md` — protocolo de revisão de código entre agentes
- `proc-release-checklist.md` — checklist pré-go-live universal
- `proc-adr.md` — processo de Architectural Decision Records
- `proc-changelog.md` — geração de CHANGELOG com Keep a Changelog + SemVer
- `proc-skill-creator.md` — meta-skill para criação de novas skills
- `proc-learning-trail.md` — trilha de estudos para documentar práticas adotadas
- `fe-ux-patterns.md` — hierarquia visual, cores, estados de carregamento, formulários
- `fe-accessibility-patterns.md` — HTML semântico, ARIA, teclado, contraste WCAG
- `be-pagination-patterns.md` — paginação offset e cursor, Spring Boot + Angular
- `be-api-versioning.md` — estratégia `/v1/`, ciclo de vida, migração sem breaking change
- `be-api-error-handling.md` — hierarquia de exceções, status HTTP, ProblemDetail
- `be-jwt-auth-patterns.md` — JWT, blocklist de tokens, sessionStorage
- `be-flyway-migrations.md` — migrations com Flyway, nomenclatura, idempotência
- `qa-test-data-builders.md` — TestFixtures, builder pattern, padrão AAA
- `infra-ci-cd.md` — pipeline CI/CD com Semgrep SAST, OWASP Dependency Check, Dependabot, Conventional Commits

**Skills a criar do zero (específicas do projeto):**

| Prefixo | Camada | Exemplos comuns |
|---------|--------|-----------------|
| `be-` | Backend | jwt-auth, csv-import, migrations, error-handling, calculations |
| `fe-` | Frontend | chart-patterns, state-management, form-patterns |
| `da-` | Dados | analytics, reporting, insight-detection |
| `qa-` | Qualidade | test-builders, e2e-patterns, security-checklist |
| `infra-` | Infraestrutura | ci-cd, deploy, observability |
| `proc-` | Processo | session-continuity, code-review, release-checklist |

Cada skill deve responder à pergunta: **"Como fazer X neste projeto?"**
Não deve conter decisões de alto nível (isso é do agent) — apenas o "como" concreto.

---

### Passo 5 — Inicializar a documentação viva

Crie os arquivos em `docs/` usando os templates abaixo como ponto de partida:

```
docs/
├── INDICE.md              ← adaptar template de base/docs/INDICE.template.md
├── HISTORICO.md           ← adaptar template de base/docs/HISTORICO.template.md
├── GLOSSARIO.md           ← iniciar vazio, preencher conforme o projeto cresce
├── CHANGELOG.md           ← adaptar base/docs/CHANGELOG.template.md
├── analise-estrutural.md  ← adaptar base/docs/analise-estrutural.template.md
├── architecture.md        ← mapa de camadas, entidades, fluxos, endpoints
├── diretrizes-tecnicas.md ← convenções de código deste projeto
├── lessons-learned.md     ← adaptar base/docs/lessons-learned.template.md
├── fundamentos/
│   └── TECNOLOGIAS.md     ← justificar as escolhas de stack
├── especificacao/
│   └── REQUISITOS.md      ← RF e RNF do projeto (enumerar RF-01, RF-02...)
├── adr/
│   ├── adr-template.md    ← usar skill proc-adr.md para criar cada ADR
│   └── ADR-001-[titulo].md ← primeira decisão arquitetural do projeto
└── processo/
    ├── SCRUM.md (ou equivalente)
    ├── TRILHA_ESTUDOS.md   ← adaptar base/docs/TRILHA_ESTUDOS.template.md
    └── runbooks/           ← adaptar base/docs/runbook.template.md para cada operação
        └── [operacao].md
```

**Frequência de atualização de cada documento:**

| Documento | Quando atualizar |
|-----------|-----------------|
| `HISTORICO.md` | Início e final de **cada** sessão (obrigatório) |
| `analise-estrutural.md` | Quando pendências mudam de status |
| `lessons-learned.md` | Após sessão com erro ou descoberta relevante |
| `architecture.md` | Quando há mudanças estruturais (novos módulos, endpoints) |
| `diretrizes-tecnicas.md` | Quando novas convenções são decididas |
| `principios-engenharia.md` | Raramente — decisão da equipe, não por sessão |

---

### Passo 6 — Configurar automação GitHub

```
.github/
├── PULL_REQUEST_TEMPLATE.md          ← checklist de PR padrão
├── ISSUE_TEMPLATE/
│   ├── user-story.yml               ← template de user story com seletor de agent
│   ├── bug-report.yml               ← template de bug com severidade e seletor
│   ├── task.yml                     ← template de tarefa técnica
│   ├── epic.yml                     ← agrupamento de user stories com objetivo de negócio
│   ├── technical-debt.yml           ← registro de dívida técnica com severidade
│   └── spike.yml                    ← investigação técnica com timebox
└── workflows/
    ├── scrum-issue-tracker.yml      ← atualiza labels automaticamente
    ├── scrum-pr-tracker.yml         ← sincroniza status PR ↔ issue
    ├── scrum-labels-setup.yml       ← cria todas as labels SCRUM (executar uma vez)
    ├── scrum-milestone-sprint.yml   ← gerencia sprints via milestones
    ├── scrum-sprint-report.yml      ← relatório diário automático às 9h
    └── ci-quality-gate.yml          ← quality gate: build, test, cobertura, segurança
```

Labels SCRUM criadas automaticamente pelo `scrum-labels-setup.yml`:
- Status: `backlog`, `sprint-backlog`, `in-progress`, `review`, `done`, `blocked`
- Tipo: `user-story`, `bug`, `task`, `epic`, `spike`, `chore`
- Prioridade: `critical`, `high`, `medium`, `low`
- Pontos: `1`, `2`, `3`, `5`, `8`, `13`

---

### Passo 7 — Primeiro commit

```bash
git add .github/ docs/
git commit -m "chore(setup): inicializar estrutura de documentacao e agents

- .github/base/: principios, BOOTSTRAP, templates de agents e skills
- .github/agents/: N agents customizados para [projeto]
- .github/skills/: proc-session-continuity + M skills do domínio
- copilot-instructions.md: contexto global do projeto
- .github/PULL_REQUEST_TEMPLATE.md + ISSUE_TEMPLATE/
- .github/workflows/: automação SCRUM
- docs/: estrutura inicial com INDICE, HISTORICO, REQUISITOS"
```

---

## Diagrama completo — o que copiar vs o que criar

```
┌─────────────────────────────────────────────────────────┐
│  UNIVERSAIS — copie como estão para qualquer projeto    │
├─────────────────────────────────────────────────────────┤
│  .github/base/BOOTSTRAP.md               (este arquivo) │
│  .github/base/principios-engenharia.md   (incl §A e §B) │
│  .github/base/roles/*.template.md        (12 templates) │
│  .github/base/docs/*.template.md         (10 templates) │
│  .github/base/skills/proc-*.md           (5 proc skills)│
│  .github/base/skills/be-*.md             (4 be skills)  │
│  .github/base/skills/fe-*.md             (2 fe skills)  │
│  .github/base/skills/qa-*.md             (1 qa skill)   │
│  .github/base/skills/infra-ci-cd.md      (1 infra skill)│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ADAPTAR — copie e customize com dados do projeto       │
├─────────────────────────────────────────────────────────┤
│  .github/copilot-instructions.md    (de template base)  │
│  .github/agents/*.agent.md          (de templates)      │
│  .github/PULL_REQUEST_TEMPLATE.md                       │
│  .github/ISSUE_TEMPLATE/*.yml                           │
│  docs/INDICE.md                                         │
│  docs/HISTORICO.md                  (iniciar com setup) │
│  docs/analise-estrutural.md                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CRIAR DO ZERO — específicos do projeto                 │
├─────────────────────────────────────────────────────────┤
│  .semgrep/rules/                                        │
│    [lang-backend]/*.yml   (regras SAST customizadas)    │
│    [lang-frontend]/*.yml  (regras SAST customizadas)    │
│  .github/skills/be-*.md, fe-*.md, da-*.md, qa-*.md     │
│  .github/workflows/*.yml                                │
│  docs/especificacao/REQUISITOS.md                       │
│  docs/architecture.md                                   │
│  docs/diretrizes-tecnicas.md                            │
│  docs/lessons-learned.md               (iniciar vazio)  │
│  docs/fundamentos/TECNOLOGIAS.md                        │
│  docs/processo/SCRUM.md                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Prefixos e convenções de nomenclatura

### Agents (`.github/agents/`)

| Prefixo | Domínio | Papéis |
|---------|---------|--------|
| `dev-` | Desenvolvimento | backend, frontend, mobile, data-analyst |
| `qa-` | Qualidade | engineer, security-reviewer, pentest-engineer |
| `mgmt-` | Gestão | product-owner, project-manager, domain-expert/advisor |
| `infra-` | Infraestrutura | devops, platform, sre |

### Skills (`.github/skills/`)

| Prefixo | Camada | Domínio |
|---------|--------|---------|
| `be-` | Backend | qualquer skill de servidor |
| `fe-` | Frontend | qualquer skill de UI |
| `da-` | Dados | analytics, BI, ML |
| `qa-` | Qualidade | testes, automação, segurança |
| `proc-` | Processo | workflows, protocolos — universais começam com `proc-` |
| `infra-` | Infraestrutura | CI/CD, deploy, observability |

---

## O protocolo de continuidade de sessão

> Esta é a peça mais crítica do sistema. Sem ela, cada sessão de IA começa do zero.

Toda sessão (humana ou de IA) deve seguir o protocolo definido em
`.github/skills/proc-session-continuity.md`. O fluxo essencial:

**Início:** `HISTORICO.md` → `analise-estrutural.md` → `git status` → `lessons-learned.md`

**Final:** `analise-estrutural.md` (marcar ✅) → `HISTORICO.md` (novo estado) →
`lessons-learned.md` (se houve lição) → commit com docs + código juntos

> **Regra de ouro:** Toda sessão que altera código funcional DEVE atualizar
> `analise-estrutural.md` e/ou `HISTORICO.md` no mesmo commit. Documentação
> nunca fica mais de 1 commit atrás do código.

---

*`.github/base/` · Universal · Copie para qualquer projeto*
