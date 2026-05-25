# Trilha de Estudos — [Nome do Projeto]

> **O que é este documento:** Mapa de aprendizado das práticas técnicas adotadas no projeto.
> Para cada prática: o que é, por que adotamos, onde está no código e como aprender.
>
> **Manter atualizado:** Ao adotar nova prática, criar nova skill ou aprovar ADR,
> adicionar entrada aqui. Ver skill `proc-learning-trail.md` para o processo completo.
>
> **Última revisão:** <!-- DATA -->

---

## Como usar esta trilha

```
🟢 Básico     — leitura da documentação oficial é suficiente
🟡 Intermediário — requer prática guiada ou projeto de exemplo
🔴 Avançado   — requer experiência prévia ou mentoria
```

---

## Processo e Metodologia

### SCRUM com Milestones GitHub

**O que é:** Gestão de sprints com milestones no GitHub, labels SCRUM e automação via GitHub Actions.

**Por que adotamos:** Mantém o backlog visível no mesmo ambiente de código, elimina ferramentas externas para equipes pequenas.

**Onde está no projeto:**
- `.github/workflows/scrum-*.yml` — automações de sprint
- `.github/ISSUE_TEMPLATE/` — templates de user story, bug, epic, spike

**Como aprender:**
- Guia interno: `docs/processo/SCRUM.md`
- Skill: `proc-session-continuity.md` — protocolo de sessão

**Nível:** 🟢 Básico

---

### Architectural Decision Records (ADRs)

**O que é:** Documentos que registram decisões técnicas significativas com contexto, alternativas e consequências.

**Por que adotamos:** Evita que decisões importantes sejam perdidas na memória da equipe. Qualquer pessoa pode entender *por que* algo foi feito assim.

**Onde está no projeto:**
- `docs/adr/` — ADRs do projeto
- Skill: `proc-adr.md`

**Como aprender:**
- [ADR GitHub (Michael Nygard)](https://github.com/joelparkerhenderson/architecture-decision-record)
- Skill interna: `proc-adr.md`

**Nível:** 🟢 Básico

---

### Conventional Commits + CHANGELOG automático

**O que é:** Padrão de mensagens de commit (`feat:`, `fix:`, `chore:`) que permite geração automática de CHANGELOG.

**Por que adotamos:** Rastreabilidade clara, geração automatizada de release notes e histórico legível.

**Onde está no projeto:**
- `CHANGELOG.md` — arquivo gerado
- Skill: `proc-changelog.md`

**Como aprender:**
- [Conventional Commits](https://www.conventionalcommits.org/)
- Skill interna: `proc-changelog.md`

**Nível:** 🟢 Básico

---

## Backend

<!-- CUSTOMIZAR: liste as práticas de backend do seu projeto -->

### [Framework/Linguagem Principal]

**O que é:** <!-- descrever -->

**Por que adotamos:** <!-- justificativa -->

**Onde está no projeto:**
- <!-- caminho do código principal -->
- Skill: <!-- nome-da-skill.md -->

**Como aprender:**
- Documentação oficial: <!-- link -->
- Exemplo no projeto: <!-- arquivo exemplar -->

**Nível:** <!-- 🟢 / 🟡 / 🔴 -->

---

## Frontend

<!-- CUSTOMIZAR: liste as práticas de frontend do seu projeto -->

---

## Qualidade e Testes

<!-- CUSTOMIZAR: liste as práticas de QA do seu projeto -->

---

## Infraestrutura

<!-- CUSTOMIZAR: liste as práticas de infraestrutura do seu projeto -->

---

## Referências cruzadas

| Skill | Prática na trilha |
|-------|------------------|
| `proc-session-continuity` | Protocolo de sessão — Processo |
| `proc-adr` | ADRs — Processo |
| `proc-changelog` | Conventional Commits — Processo |
| `proc-skill-creator` | Como criar skills — Processo |
| [adicionar ao criar novas skills] | |

---

*Template — copiar de `base/docs/TRILHA_ESTUDOS.template.md`*
*Skill de criação: `proc-learning-trail.md`*
