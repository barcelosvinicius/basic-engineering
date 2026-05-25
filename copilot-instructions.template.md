# Copilot Instructions — [Nome do Projeto]

<!-- CUSTOMIZAR: Este arquivo é lido pelo GitHub Copilot em TODA sessão de qualquer
agente. É o ponto de maior impacto do sistema — se desatualizar, todos os agentes
perdem contexto. Mantenha-o preciso e conciso (máx ~150 linhas).
Delete este bloco de instruções quando o arquivo estiver preenchido. -->

---

## Sobre o projeto

<!-- CUSTOMIZAR: 2-3 frases: o que faz, para quem, contexto de uso -->
[Descrição do projeto em 2-3 frases.]

## Arquitetura

| Camada | Tecnologia | Porta |
|--------|-----------|-------|
| Frontend | [ex: Angular 19 + TypeScript] | [ex: 4200] |
| Backend | [ex: Java 17 + Spring Boot 3.2] | [ex: 8080] |
| Banco | [ex: PostgreSQL 14+] | [ex: 5432] |

<!-- CUSTOMIZAR: adicione ou remova camadas conforme a stack do projeto -->

## Estrutura do repositório

```
[raiz do repositório]/
  [pasta-backend]/      — [descrição]
  [pasta-frontend]/     — [descrição]
  docs/
    fundamentos/        — principios-engenharia.md, TECNOLOGIAS.md
    especificacao/      — REQUISITOS.md, MELHORIAS.md
    (raiz docs)         — architecture.md, diretrizes-tecnicas.md,
                          analise-estrutural.md, lessons-learned.md
    processo/           — SCRUM.md, PLANO_TESTES.md
    guias/              — COMO_USAR.md, COMO_USAR_AGENTS.md
    (raiz)              — INDICE.md, HISTORICO.md, GLOSSARIO.md
  .github/
    agents/             — dev-*, qa-*, mgmt-* agents
    skills/             — be-*, fe-*, da-*, qa-*, proc-* skills
    base/               — principios e templates universais
```

## Convenções de código — Backend

<!-- CUSTOMIZAR: adapte à linguagem e framework do projeto -->
- **[Entidades/Modelos]**: [convenção]
- **[Services/Controllers]**: [convenção de injeção de dependência]
- **[Objetos de transferência (DTOs)]**: [regra: nunca expor entidade diretamente]
- **[Transações/Operações]**: [convenção]
- **[Testes]**: [framework] + [ferramenta de mock]; pacote espelho em [caminho]

## Convenções de código — Frontend

<!-- CUSTOMIZAR -->
- [Framework]: [convenção de componentes]
- [Autenticação no cliente]: [como armazena token, interceptor, guard]
- [Comunicação HTTP]: [como tipar, como tratar erros]
- [Formulários]: [reactive vs template-driven]
- [Testes]: [framework]

## Segurança

<!-- CUSTOMIZAR -->
- **Senhas**: [algoritmo de hash] — [parâmetros]
- **Autenticação**: [padrão — ex: JWT HS256 com expiração]
- **Logout**: [como revogar tokens]
- **Upload**: [validação de tipo de arquivo]
- **Isolamento de dados**: [como garantir que usuário X não vê dados de Y]
- **CORS**: [origens permitidas]

## Regras de negócio principais

<!-- CUSTOMIZAR: 3-5 regras críticas do domínio que todo agente deve conhecer -->
1. **[Regra 1]**: [definição + quando se aplica]
2. **[Regra 2]**: [definição + quando se aplica]
3. **[Regra 3]**: [definição + quando se aplica]
<!-- adicione mais conforme necessário -->

## Processo SCRUM

- Sprints de [N] semanas; milestones = sprints
- Labels: `type:`, `priority:`, `status:`, `points:`
- Story Points: Fibonacci (1, 2, 3, 5, 8, 13)
- Definition of Done: código + code review + testes ≥ [N]% cobertura + docs
- Requisitos funcionais: RF-01 a RF-[N] em `docs/especificacao/REQUISITOS.md`

## O que NÃO fazer

<!-- CUSTOMIZAR: anti-patterns proibidos neste projeto -->
- [Anti-pattern 1] — [motivo]
- [Anti-pattern 2] — [motivo]
- [Anti-pattern 3] — [motivo]
- Nunca commitar segredos (senhas, chaves, tokens) no código
- Nunca criar lógica de negócio em [camada errada]

## Continuidade de sessão

**Ação obrigatória:** Ler e seguir `.github/skills/proc-session-continuity.md` em TODA sessão — início E fim.
O fluxo de fim de sessão (atualizar `docs/HISTORICO.md`, `docs/analise-estrutural.md` e `docs/lessons-learned.md`)
é obrigatório para manter rastreabilidade e reduzir consumo de tokens na próxima sessão.

> **Consultar `docs/HISTORICO.md` no início de cada sessão** — contém estado atual, bloqueios e próximos passos.
