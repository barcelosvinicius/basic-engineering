# Guia de Onboarding — [PROJETO]

> **Para novos membros da equipe** — humanos ou agentes IA.

## Boas-vindas

<!-- CUSTOMIZAR -->
Bem-vindo ao [PROJETO]! Este guia vai te ajudar a entender o sistema,
configurar o ambiente e contribuir com qualidade desde o primeiro dia.

---

## Em 5 minutos: o que é este projeto

<!-- CUSTOMIZAR — responder as 3 perguntas -->
**O que faz:** [funcionalidade principal em 1-2 frases]
**Para quem:** [usuários finais]
**Por que existe:** [problema que resolve]

---

## Mapa de onde encontrar cada coisa

| Quero saber... | Onde está |
|----------------|-----------|
| O que é o projeto | `.github/copilot-instructions.md` |
| Princípios de engenharia | `.github/base/principios-engenharia.md` |
| O que está acontecendo agora | `docs/HISTORICO.md` |
| O que está pendente | `docs/arquitetura/analise-estrutural.md` |
| Os requisitos | `docs/especificacao/REQUISITOS.md` |
| A arquitetura técnica | `docs/arquitetura/architecture.md` |
| Como fazer X no backend | `.github/skills/be-*.md` |
| Como fazer X no frontend | `.github/skills/fe-*.md` |
| Decisões arquiteturais | `docs/adr/` |
| Lições aprendidas | `docs/arquitetura/lessons-learned.md` |

---

## Setup do ambiente

<!-- CUSTOMIZAR -->

### Pré-requisitos

```bash
# Verificar versões
[listar comandos de verificação]
```

### Passos

```bash
# 1. Clone
git clone [url]
cd [projeto]

# 2. Variáveis de ambiente
cp .env.example .env
# Editar .env com valores de dev

# 3. Subir stack
[comando]

# 4. Verificar saúde
[comando de health check]
```

---

## Primeiro fluxo para entender o sistema

<!-- CUSTOMIZAR — listar fluxo manual que dá visão geral do sistema -->
```
1. [passo 1]
2. [passo 2]
3. [passo 3]
```

---

## Fluxo de desenvolvimento

```
1. Escolher uma issue do backlog
2. Criar branch: git checkout -b feature/ISSUE-NNN-descricao
3. Implementar (seguindo skills relevantes)
4. Escrever testes (cobertura ≥ meta)
5. git commit -m "feat(escopo): descrição"
6. Abrir PR usando template
7. Aguardar CI e review
```

---

## Convenções resumidas

<!-- CUSTOMIZAR com as convenções principais do projeto -->

| Aspecto | Convenção |
|---------|-----------|
| Commits | Conventional Commits |
| Branches | `feature/`, `fix/`, `chore/` |
| Testes | AAA pattern, cobertura ≥ [N]% |
| [outro] | [convenção] |

---

## Perguntas frequentes

<!-- CUSTOMIZAR com as dúvidas mais comuns de quem está começando -->

**"Onde fica a lógica de negócio?"**
→ [resposta]

**"Por que [decisão técnica]?"**
→ Ver ADR em `docs/adr/`

---

*Template — `.github/base/docs/onboarding.template.md` · Customize para cada projeto*
