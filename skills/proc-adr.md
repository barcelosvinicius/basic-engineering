---
name: proc-adr
description: >
  Processo para registrar Architectural Decision Records (ADRs) — quando criar, qual formato
  usar e onde armazenar. Usar ao tomar qualquer decisão técnica significativa que afete
  estrutura, segurança, performance ou que seja difícil de reverter.
---

# Skill: Architectural Decision Records (ADR)

## O que é esta skill

Define o processo de criação e manutenção de ADRs — registros de decisões arquiteturais.
Usar ao tomar decisões técnicas com impacto estrutural: escolha de biblioteca, mudança de padrão,
estratégia de autenticação, modelo de dados ou qualquer decisão difícil de reverter.

---

## Quando criar um ADR

Criar um ADR sempre que a decisão:
- Afeta mais de uma camada da aplicação (ex: mudar de H2 para PostgreSQL em testes)
- É difícil ou cara de reverter (ex: escolha de algoritmo de hash de senha)
- Tem alternativas viáveis que foram descartadas
- Será perguntada por futuros membros da equipe ("por que não usamos X?")

**Não criar ADR para:**
- Decisões triviais de implementação (ex: nomear variável)
- Convenções já documentadas em `diretrizes-tecnicas.md`
- Correções de bugs sem mudança de design

---

## Formato obrigatório

```markdown
# ADR-[NNN]: [Título curto em infinitivo — ex: "Usar Argon2id para hash de senhas"]

**Data:** AAAA-MM-DD
**Status:** [Proposto | Aceito | Depreciado | Supersedido por ADR-NNN]
**Autor(es):** [nome ou agente]

---

## Contexto

[Qual problema ou necessidade motivou esta decisão? 2-4 frases. Fatos, não opiniões.]

## Decisão

[O que foi decidido, em uma frase clara. "Decidimos usar X para Y."]

## Alternativas consideradas

| Alternativa | Por que descartada |
|-------------|-------------------|
| [opção A]   | [motivo concreto]  |
| [opção B]   | [motivo concreto]  |

## Consequências

**Positivas:**
- [benefício 1]
- [benefício 2]

**Negativas / Trade-offs:**
- [custo ou limitação 1]
- [custo ou limitação 2]

## Referências

- [link para issue, PR, doc externo, RFC, etc.]
```

---

## Localização no repositório

```
docs/
└── adr/
    ├── ADR-001-usar-argon2id-para-hash-de-senhas.md
    ├── ADR-002-jwt-com-blocklist-em-banco.md
    ├── ADR-003-sessionstorage-vs-localstorage.md
    └── ...
```

**Regras de nomenclatura:**
- Numeração sequencial com 3 dígitos: `ADR-001`, `ADR-002`
- Nome do arquivo: `ADR-NNN-titulo-em-kebab-case.md`
- Nunca renumerar ADRs existentes — apenas adicionar novos

---

## Ciclo de vida dos status

```
Proposto → Aceito → (em uso)
              ↓
         Depreciado     (ainda válido, mas substituído gradualmente)
              ↓
         Supersedido    (substituído por ADR-NNN mais recente)
```

- **Proposto**: em discussão, ainda não implementado
- **Aceito**: aprovado e implementado — o padrão atual
- **Depreciado**: válido historicamente, mas não usar em código novo
- **Supersedido por ADR-NNN**: outro ADR tomou este lugar

---

## Integração com o fluxo de desenvolvimento

1. **Antes da implementação**: se a decisão for significativa, criar ADR como "Proposto" e abrir PR para revisão
2. **Durante o code review**: revisar o ADR junto com o código que o implementa
3. **Ao fazer merge**: atualizar status para "Aceito"
4. **Quando mudar de decisão**: criar novo ADR referenciando o anterior, marcar o antigo como "Supersedido"

---

## ADRs existentes neste projeto

| Número | Decisão | Status |
|--------|---------|--------|
| Consultar `docs/adr/` | — | — |

> Manter esta tabela no `docs/INDICE.md` e não nesta skill — ela muda frequentemente.

---

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| ADR muito genérico | "Usar boas práticas de segurança" | Focar em uma decisão específica e verificável |
| Falta de alternativas | Parece que não havia escolha | Sempre listar pelo menos uma alternativa descartada |
| Status desatualizado | Implementação mudou, ADR não | Ao mudar padrão, criar novo ADR e superseder o anterior |
| ADR sem data | Impossível rastrear cronologia | Data é obrigatória — usar data do merge do PR |

---

*Skill — `.github/skills/proc-adr.md`*
*Referência: `principios-engenharia.md` §A.4 (Documentação como produto)*
*Template: `docs/adr/adr-template.md`*
