# 🗺️ Índice da Documentação — [PROJETO]

> Navegação centralizada para todos os documentos do projeto.
> Este arquivo é a **fonte autoritativa** do catálogo de documentação.
> Atualizar sempre que um documento novo for criado ou removido.

**Total: [N] documentos · Última atualização: [AAAA-MM-DD]**

---

## Rotas de Leitura por Perfil

### 🟢 Qualquer perfil — Começar aqui (15 min)

| # | Documento | O que aprende |
|---|-----------|---------------|
| 1 | `README.md` | Visão geral, arquitetura, funcionalidades |
| 2 | Este arquivo (`INDICE.md`) | Como navegar a documentação |
| 3 | `HISTORICO.md` | ⚡ **Obrigatório** — Estado atual e próximos passos |
| 4 | `especificacao/REQUISITOS.md` | O que o sistema faz (RF e RNF) |
| 5 | `GLOSSARIO.md` | Termos técnicos usados em toda a documentação |

---

### 🔧 Desenvolvedor Backend

| # | Documento | Foco |
|---|-----------|------|
| 4 | `guias/COMO_USAR.md` | Setup completo do ambiente |
| 5 | `arquitetura/diretrizes-tecnicas.md` | Convenções de código, checklist pre-commit |
| 6 | `arquitetura/architecture.md` | Entidades, services, endpoints, fluxos |
| 7 | `arquitetura/lessons-learned.md` | Erros passados a não repetir |
| 8 | `arquitetura/analise-estrutural.md` | Pendências técnicas e prioridades |

### 🎨 Desenvolvedor Frontend

| # | Documento | Foco |
|---|-----------|------|
| 4 | `guias/COMO_USAR.md` | Setup do ambiente |
| 5 | `arquitetura/diretrizes-tecnicas.md` §frontend | Padrões de componentes e estado |
| 6 | `arquitetura/architecture.md` §frontend | Estrutura de componentes e rotas |
| 📚 | `fundamentos/TECNOLOGIAS.md` | Por que cada tecnologia foi escolhida |

### 📋 Product Owner / Gestor

| # | Documento | Foco |
|---|-----------|------|
| 4 | `especificacao/MELHORIAS.md` | Backlog estratégico priorizado |
| 5 | `processo/SCRUM.md` | Processo, sprints, Definition of Done |
| 6 | `processo/GUIA_MELHORIA_SCORE.md` | Plano de evolução por dimensão |

### 🧪 QA / Tester

| # | Documento | Foco |
|---|-----------|------|
| 4 | `processo/PLANO_TESTES.md` | Pirâmide de testes, casos, cobertura alvo |
| 5 | `guias/COMO_USAR.md` | Como usar cada funcionalidade (base de testes) |
| 6 | `arquitetura/analise-estrutural.md` | Débitos técnicos que impactam qualidade |

### 🔒 Revisão de Segurança

| # | Documento | Foco |
|---|-----------|------|
| 4 | `.github/base/principios-engenharia.md` §2 | Princípios de segurança |
| 5 | `arquitetura/diretrizes-tecnicas.md` §segurança | Implementação específica do projeto |
| 6 | `arquitetura/analise-estrutural.md` §segurança | Checklist implementado / pendente |

### 🤖 Agentes IA

| # | Documento | Foco |
|---|-----------|------|
| 4 | `guias/COMO_USAR_AGENTS.md` | Agentes disponíveis e como usar |
| 5 | `.github/base/principios-engenharia.md` §A | Protocolo de documentação assistida |

### 🎓 Estudo

| # | Documento | Foco |
|---|-----------|------|
| 4 | `fundamentos/TRILHA_ESTUDO.md` | Roteiro guiado com exercícios |
| 5 | `GLOSSARIO.md` | Termos com definição simples |
| 6 | `arquitetura/lessons-learned.md` | Bugs reais + lições extraídas |

---

## Todos os Documentos por Categoria

### 📌 Raiz

| Documento | Conteúdo |
|-----------|----------|
| `INDICE.md` | Este arquivo |
| `HISTORICO.md` | Estado operacional, sessões, próximos passos |
| `GLOSSARIO.md` | Termos técnicos com definição simples |

### 📋 Especificação (`especificacao/`)

| Documento | Conteúdo |
|-----------|----------|
| `REQUISITOS.md` | RF e RNF do sistema (SRS) |
| `MELHORIAS.md` | Backlog estratégico priorizado |

### 🏗️ Arquitetura (`arquitetura/`)

| Documento | Conteúdo |
|-----------|----------|
| `architecture.md` | Camadas, entidades, fluxos, endpoints |
| `diretrizes-tecnicas.md` | Convenções de código e checklist |
| `analise-estrutural.md` | Radiografia técnica — pendências e correções |
| `lessons-learned.md` | Lições em formato Contexto→Problema→Regra |

### 🎓 Fundamentos (`fundamentos/`)

| Documento | Conteúdo |
|-----------|----------|
| `.github/base/principios-engenharia.md` | Guia universal de engenharia |
| `TECNOLOGIAS.md` | Guia das tecnologias escolhidas |
| `TRILHA_ESTUDO.md` | Trilhas de estudo guiadas |

### 🏃 Processo (`processo/`)

| Documento | Conteúdo |
|-----------|----------|
| `SCRUM.md` | Cerimônias, labels, story points, DoD |
| `PLANO_TESTES.md` | Pirâmide de testes e casos |
| `GUIA_MELHORIA_SCORE.md` | Evolução por dimensão |

### 🛠️ Guias (`guias/`)

| Documento | Conteúdo |
|-----------|----------|
| `COMO_USAR.md` | Setup e troubleshooting |
| `COMO_USAR_AGENTS.md` | Agentes Copilot e skills |

---

## Hierarquia de Autoridade

> Em caso de conflito entre documentos, prevalece o mais específico na hierarquia abaixo.

| Tema | Fonte Autoritativa |
|------|--------------------|
| Princípios gerais | `.github/base/principios-engenharia.md` |
| Requisitos (RF/RNF) | `especificacao/REQUISITOS.md` |
| Segurança (padrões) | `arquitetura/diretrizes-tecnicas.md` §segurança |
| Convenções de código | `arquitetura/diretrizes-tecnicas.md` |
| Estado técnico | `arquitetura/analise-estrutural.md` |
| Continuidade entre sessões | `HISTORICO.md` |
| Catálogo de documentos | `INDICE.md` (este arquivo) |
| Termos técnicos | `GLOSSARIO.md` |

---

*[PROJETO] · Índice da Documentação · [AAAA-MM-DD]*
