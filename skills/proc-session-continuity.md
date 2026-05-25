---
name: proc-session-continuity
description: >
  Protocolo obrigatório de continuidade entre sessões de trabalho humanas ou assistidas
  por IA — leitura do HISTORICO.md no início e atualização de docs no final. Todo agente
  deve seguir este fluxo para evitar retrabalho e manter documentação sincronizada.
---

# Skill: Continuidade de Sessão

## O que é esta skill

Define o protocolo obrigatório de continuidade entre sessões de trabalho (humanas ou
assistidas por IA). Todo agente que inicia uma sessão de desenvolvimento deve seguir
este fluxo para evitar retrabalho, preservar contexto e manter a documentação
sincronizada com o código.

Esta skill é **universal** — copiada de `.github/base/skills/` para todos os projetos
sem modificação. Referencia os documentos pelo caminho relativo padrão do projeto.

Referência: `principios-engenharia.md` §A.3 (Session Briefs) e §A.5 (Comportamento
Esperado da IA).

---

## Fluxo obrigatório — Início de sessão

```
1. Ler docs/HISTORICO.md
   ├── Estado Atual → o que está em andamento
   ├── Bloqueios → impedimentos ativos
   └── Próximos Passos → prioridades da sessão

2. Ler docs/analise-estrutural.md
   ├── Pendências Técnicas → o que NÃO fazer de novo
   └── Correções Aplicadas → o que JÁ foi resolvido

3. Verificar git status
   └── Arquivos modificados não commitados → continuar ou descartar

4. Consultar docs/lessons-learned.md (se relevante)
   └── Erros passados → padrões a evitar
```

> **Custo estimado:** ~400 linhas de contexto crítico (vs ~8.000+ linhas lendo tudo).
> Economia de ~60% em tokens por sessão sem perda de contexto operacional.

---

## Objetivo da Sessão (obrigatório)

Antes de iniciar qualquer implementação, a sessão **deve declarar explicitamente**
um objetivo verificável.

> **"Ao final desta sessão, saberei que terminei quando:"**

- [critério verificável 1]
- [critério verificável 2] (se necessário)

### Exemplos válidos
- "O endpoint `POST /api/v1/[recurso]` retorna 200 e passa nos testes de integração."
- "O bug #N é reproduzido por um teste e o teste passa após a correção."
- "A migration `V3__...sql` aplica sem erros no ambiente de test."

### Regras
- Objetivo deve ser **verificável**, não abstrato.
- Termos como "melhorar", "ajustar" ou "refatorar" **não são válidos**
  sem critério mensurável.
- O objetivo **não substitui nenhum passo do fluxo** — ele apenas orienta a execução.

---

## Fluxo obrigatório — Final de sessão

```
1. Atualizar docs/analise-estrutural.md
   ├── Marcar pendências resolvidas como ✅ com data
   ├── Adicionar novas correções à tabela de Correções Aplicadas
   └── Registrar novas pendências descobertas

2. Atualizar docs/HISTORICO.md
   ├── Seção "Estado Atual" → refletir novo estado
   ├── Seção "Histórico de Entregas" → nova entrada com formato:
   │   ### [AAAA-MM-DD] Título curto
   │   **Responsável:** Nome ou agente
   │   **Entregas:** O que foi concluído
   │   **Decisões:** Decisões técnicas ou de produto
   │   **Próximos passos:** O que a próxima sessão deve fazer
   │   **Bloqueios:** Impedimentos (ou "Nenhum")
   └── Seção "Próximos Passos" → atualizar prioridades

3. Registrar em docs/lessons-learned.md (se aplicável)
   ├── Formato: ### [Mês/Ano] Título da lição
   │   **Contexto:** [situação]
   │   **Problema:** [o que deu errado / foi descoberto]
   │   **Regra:** [o que fazer diferente — incluir código se relevante]
   │   **Referência:** §X.X de principios-engenharia.md
   └── Apenas para descobertas que evitam retrabalho futuro

4. Commitar com Conventional Commits
   └── Incluir docs atualizados no mesmo commit do código
```

---

## Validação do Objetivo da Sessão

Antes de encerrar a sessão, responder explicitamente:

- O objetivo definido no início da sessão foi atingido? ✅ / ❌

Se ❌:
- O que impediu?
- O que deve ficar explícito para a próxima sessão?

Essa validação **deve se refletir** em:
- `docs/HISTORICO.md` (Estado Atual / Próximos Passos)
- `docs/analise-estrutural.md` (se houver novas pendências)

---

## Recursos disponíveis neste repositório

### Agentes (`.github/agents/`)

<!-- MANTER ATUALIZADO: liste os agents configurados no projeto -->
| Prefixo | Agente | Quando usar |
|---------|--------|-------------|
| `dev-` | dev-backend-developer | Implementação de backend |
| `dev-` | dev-frontend-developer | Implementação de frontend |
| `dev-` | dev-data-analyst | BI, insights, analytics |
| `qa-` | qa-engineer | Testes e cobertura |
| `qa-` | qa-security-reviewer | Revisão defensiva OWASP |
| `qa-` | qa-pentest-engineer | Segurança ofensiva, IDOR |
| `mgmt-` | mgmt-product-owner | Requisitos, backlog |
| `mgmt-` | mgmt-domain-expert | Regras de negócio do domínio |
| `mgmt-` | mgmt-project-manager | Coordenação, contratos de API |
| `mgmt-` | mgmt-architect | ADRs, dívida técnica, governança técnica |
| `infra-` | infra-devops-engineer | CI/CD, Docker, GitHub Actions |
| `ops-` | ops-sre | Observabilidade, SLOs, runbooks, incidentes |

### Skills (`.github/skills/`)

<!-- MANTER ATUALIZADO: adicione skills específicas do projeto abaixo das universais -->

#### Universais (copiadas de `base/skills/` — não customizar)
| Skill | Quando consultar |
|-------|-----------------|
| `proc-session-continuity` | **Este arquivo** — obrigatório no início de toda sessão |
| `proc-code-review` | Ao revisar PR — quem revisa o quê e como dar feedback |
| `proc-release-checklist` | Antes de qualquer deploy em produção |
| `proc-adr` | Ao tomar decisão arquitetural significativa |
| `proc-changelog` | Ao preparar release ou gerar notas de versão |
| `proc-skill-creator` | Ao criar nova skill — processo, estrutura e critérios |
| `proc-learning-trail` | Ao documentar novas práticas adotadas pela equipe |
| `be-pagination-patterns` | Ao implementar endpoints de lista |
| `be-api-versioning` | Ao criar ou versionar endpoints REST |
| `be-api-error-handling` | GlobalExceptionHandler, status HTTP, ProblemDetail |
| `be-jwt-auth-patterns` | Autenticação JWT, blocklist de tokens |
| `be-flyway-migrations` | Migrations de banco com Flyway |
| `qa-test-data-builders` | Builder pattern, TestFixtures, padrão AAA |
| `fe-ux-patterns` | Hierarquia visual, cores, estados, formulários |
| `fe-accessibility-patterns` | ARIA, teclado, contraste WCAG |
| `infra-ci-cd` | Pipeline CI/CD, auditoria de dependências |

#### Específicas do projeto (criar ao customizar)
| Skill | Quando consultar |
|-------|-----------------|
| [prefixo-nome] | [quando usar — adicionar ao criar] |

### Documentos-chave

| Documento | Propósito |
|-----------|-----------|
| `docs/HISTORICO.md` | Estado operacional + handoff entre sessões |
| `docs/analise-estrutural.md` | Radiografia técnica (pendências + correções) |
| `docs/lessons-learned.md` | Erros e regras duradouras |
| `.github/base/principios-engenharia.md` | Princípios gerais independentes de projeto |
| `docs/architecture.md` | Mapa de camadas, entidades, fluxos |
| `docs/diretrizes-tecnicas.md` | Convenções de código + checklist pre-commit |

---

## Regra de ouro

> **Toda sessão que altera código funcional DEVE atualizar `analise-estrutural.md`
> e/ou `HISTORICO.md` no mesmo commit.** Documentação nunca fica mais de 1 commit
> atrás do código.

---

*Universal — `.github/base/skills/proc-session-continuity.md`*
*Copiar para `.github/skills/` de cada projeto sem modificação.*
*Referência: `principios-engenharia.md` §A.3, §A.4, §A.5*
