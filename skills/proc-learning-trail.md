---
name: proc-learning-trail
description: >
  Meta-processo para criar e manter a Trilha de Estudos do projeto — documento que registra
  todas as práticas técnicas adotadas, o porquê de cada uma e recursos de aprofundamento
  para a equipe. Usar ao adotar uma nova prática, tecnologia ou padrão no projeto.
---

# Skill: Trilha de Estudos (Learning Trail)

## O que é esta skill

Define como criar e manter o documento `docs/processo/TRILHA_ESTUDOS.md` — o registro
vivo das práticas técnicas adotadas no projeto, com contexto de decisão e recursos de
estudo para a equipe.

> **Princípio:** Um projeto bem documentado ensina sua própria equipe. A trilha de
> estudos transforma decisões técnicas em conhecimento transferível — não apenas
> para o projeto, mas para a carreira de cada membro da equipe.

---

## Por que criar uma trilha de estudos

A trilha serve a dois propósitos simultâneos:

1. **Onboarding:** Novos membros entendem *por que* o projeto usa X, não apenas *que* usa X
2. **Evolução da equipe:** O time acompanha a curva de adoção de cada prática e sabe onde se aprofundar

---

## Quando atualizar a trilha

| Evento | Ação |
|--------|------|
| Nova tecnologia adicionada ao stack | Adicionar entrada na trilha com contexto de decisão |
| Novo padrão de código decidido | Documentar na trilha com link para skill correspondente |
| ADR aprovado | Extrair a prática resultante e adicionar na trilha |
| Postmortem concluído | Adicionar prática de prevenção na trilha |
| Nova skill criada | Vincular à trilha na seção correspondente |

---

## Estrutura de cada entrada

Cada prática na trilha deve ter:

```markdown
### [Nome da Prática]

**O que é:** 1-2 frases descrevendo a prática.

**Por que adotamos:** Contexto de decisão — problema que resolve, alternativas consideradas.

**Onde está no código:**
- Arquivo/pacote principal: `[caminho]`
- Skill de referência: `[nome-da-skill.md]`

**Como aprender:**
- Documentação oficial: [link]
- Guia interno: [skill ou doc do projeto]
- Exemplo no projeto: [arquivo com bom exemplo de uso]

**Nível recomendado para nova entrada:** 🟢 Básico / 🟡 Intermediário / 🔴 Avançado
```

---

## Passo a passo: criar a trilha do zero

### Passo 1: Inventariar as práticas existentes

Liste todas as tecnologias e padrões em uso:

```bash
# Tecnologias — ver copilot-instructions.md (seção Arquitetura)
# Padrões — ver .github/skills/*.md (uma skill = uma prática)
ls .github/skills/
```

### Passo 2: Agrupar por camada

Organize as práticas nas seções do template:
- **Processo** — como a equipe trabalha (SCRUM, ADRs, sessions)
- **Backend** — stack, padrões de código, segurança
- **Frontend** — stack, componentes, estado
- **Qualidade** — testes, CI/CD, cobertura
- **Infraestrutura** — deploy, observabilidade, containers

### Passo 3: Preencher o template

Use `base/docs/TRILHA_ESTUDOS.template.md` como ponto de partida.
Adapte ao projeto seguindo a estrutura de cada entrada descrita acima.

### Passo 4: Vincular skill → trilha

Ao criar uma nova skill, adicione na trilha:

```markdown
### [Nome da Skill]
**Skill de referência:** `[nome-da-skill.md]`
```

E na skill criada, adicione no rodapé:
```markdown
*Trilha de estudos: `docs/processo/TRILHA_ESTUDOS.md` → seção [Nome da Seção]*
```

---

## Manutenção contínua

A trilha é atualizada por qualquer agente ao final de uma sessão que:
- Adota uma nova prática ou padrão
- Cria uma nova skill
- Aprova um ADR com impacto de código
- Resolve um incidente com lição aprendida

**Frequência mínima:** Uma revisão por sprint (verificar se novas práticas foram adotadas
e não documentadas).

---

## Checklist ao adicionar nova prática na trilha

- [ ] Entrada criada com todos os campos obrigatórios (o que é, por que, onde, como aprender)
- [ ] Skill correspondente criada/atualizada com link de volta à trilha
- [ ] Nível de dificuldade definido (🟢 / 🟡 / 🔴)
- [ ] Exemplo de uso no projeto referenciado
- [ ] `proc-session-continuity` atualizado se nova skill foi criada

---

*Universal — `.github/base/skills/proc-learning-trail.md`*
*Copiar para `.github/skills/` de cada projeto sem modificação.*
*Template da trilha: `.github/base/docs/TRILHA_ESTUDOS.template.md`*
