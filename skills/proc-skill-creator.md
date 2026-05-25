---
name: proc-skill-creator
description: >
  Meta-skill que guia a criação de novas skills — processo de descoberta, estrutura
  obrigatória, critérios de qualidade e checklist de entrega. Usar quando precisar
  criar uma nova skill de domínio, processo ou infraestrutura para este projeto ou para o base.
---

# Skill: Criação de Novas Skills (Meta-Skill)

## O que é esta skill

Define o processo de criação e iteração de skills — os documentos de conhecimento técnico
em `.github/skills/`. Usar quando identificar que falta uma skill de domínio, quando uma
skill existente precisar de refatoração significativa, ou ao expandir o kit base para novos projetos.

---

## Anatomia de uma skill bem feita

```
.github/skills/
└── [prefixo]-[nome].md
    ├── Frontmatter YAML (name + description) ← obrigatório
    ├── ## O que é esta skill              ← 1-2 frases: problema resolvido + quando usar
    ├── ## Quando consultar esta skill     ← gatilhos concretos
    ├── ## [Seções principais]             ← código, exemplos, padrões — o "como" concreto
    ├── ## Erros comuns                    ← tabela: Erro | Causa | Solução
    └── Rodapé com referências            ← outras skills, princípios, docs externos
```

---

## Processo de criação — passo a passo

### Passo 1: Identificar a necessidade

Perguntas para diagnosticar se uma nova skill é necessária:

- "Este conhecimento é repetidamente necessário ou foi reescrito mais de uma vez?"
- "Existe um padrão específico deste projeto que não está documentado?"
- "Outro agente perguntaria 'como fazer X?' sem ter onde consultar?"
- "Este 'como fazer' é suficientemente específico para não caber no `copilot-instructions.md`?"

Se responder **sim** a qualquer uma → criar skill.

### Passo 2: Definir o escopo

A skill deve responder **exatamente uma** das perguntas:
- "Como implementar [padrão] neste projeto?"
- "Como seguir o [processo] neste projeto?"
- "Como configurar [ferramenta] para este contexto?"

❌ Se a skill responde "O que é [conceito]?" → vai em `docs/fundamentos/`
❌ Se a skill responde "Por que usar [abordagem]?" → vai no ADR ou no agent

### Passo 3: Escolher o prefixo e nome correto

| Prefixo | Camada | Quando usar |
|---------|--------|------------|
| `be-` | Backend | Java/Spring Boot — qualquer skill de servidor |
| `fe-` | Frontend | Angular/TypeScript — qualquer skill de UI |
| `da-` | Dados | Analytics, BI, queries de insight |
| `qa-` | Qualidade | Testes, automação, segurança |
| `proc-` | Processo | Workflows, protocolos — **skills proc- são universais** |
| `infra-` | Infraestrutura | CI/CD, Docker, observabilidade |

**Nomeação:** `[prefixo]-[substantivo-hiphenado].md`
- ✅ `be-caching-patterns.md`, `proc-incident-response.md`, `fe-state-management.md`
- ❌ `backend-cache.md`, `como-fazer-cache.md`, `cache.md`

### Passo 4: Decidir onde vai (projeto vs base)

| Critério | Vai em `.github/skills/` (projeto) | Vai em `.github/base/skills/` (base) |
|----------|-----------------------------------|------------------------------------|
| Menciona tecnologias específicas | ✅ | ❌ |
| Menciona entidades do domínio | ✅ | ❌ |
| Funciona em qualquer projeto similar | ❌ | ✅ |
| É universal de processo | ❌ | ✅ |

**Regra:** Se a skill cita `TransactionService`, `gestao_db`, ou `Vinicius & Renata` → projeto.
Se funciona igualmente bem num projeto de e-commerce → base.

### Passo 5: Escrever a skill

Usar o template em `.github/base/roles/skill.template.md` como ponto de partida.

**Princípios de escrita:**
- Linguagem imperativa/infinitiva, não segunda pessoa: "Usar X ao fazer Y" (não "Você deve usar X")
- Concreto antes de abstrato: código primeiro, explicação depois
- Exemplos obrigatórios: pelo menos um ✅ correto e um ❌ errado
- Erros comuns: tabela com pelo menos 2-3 armadilhas reais
- Autocontida: outra instância do agente deve conseguir seguir sem contexto adicional

### Passo 6: Adicionar frontmatter YAML

```yaml
---
name: [prefixo]-[nome]        ← igual ao nome do arquivo sem .md
description: >
  [Uma frase: o que resolve]. [Quando usar — gatilho concreto].
  [Complemento se necessário — máx 3 frases].
---
```

O `description` é lido **antes** de abrir a skill — é o que determina se o agente vai consultá-la.
Deve ser específico o suficiente para não disparar em contextos errados.

### Passo 7: Referenciar na proc-session-continuity

Toda skill nova deve ser adicionada à tabela de referência em `proc-session-continuity.md`:

```markdown
| `[prefixo]-` | [nome] | [Quando consultar — 1 frase] |
```

---

## Checklist de qualidade

Antes de considerar a skill pronta:

- [ ] Frontmatter YAML com `name` e `description` descritivos
- [ ] Seção "O que é esta skill" com problema + gatilho de uso
- [ ] Pelo menos um exemplo de código completo e executável
- [ ] Exemplos com ✅ correto e ❌ errado
- [ ] Seção "Erros comuns" com tabela Erro | Causa | Solução
- [ ] Referências a outras skills relacionadas no rodapé
- [ ] Linguagem imperativa, não segunda pessoa
- [ ] Adicionada à tabela em `proc-session-continuity.md`
- [ ] Se universal: adicionada também em `.github/base/skills/`

---

## Quando atualizar vs criar nova skill

| Situação | Ação |
|----------|------|
| Padrão evoluiu mas é o mesmo domínio | Atualizar skill existente |
| Nova tecnologia ou biblioteca | Criar nova skill |
| Skill ficou muito grande (> 300 linhas) | Dividir em 2 skills especializadas |
| Skill cobre 2 domínios diferentes | Dividir por prefixo |
| Padrão foi depreciado | Adicionar nota de depreciação + referência à nova skill |

---

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Skill sem frontmatter | Criado antes do padrão YAML | Adicionar bloco `---` com name e description |
| Description genérico demais | Cópia do título | Descrever o gatilho de uso específico |
| Skill sem exemplos | Documentação teórica | Adicionar snippet de código executável |
| Skill em base com nomes de domínio | Confusão base vs projeto | Extrair referências específicas para a versão do projeto |
| Esqueceu de referenciar em proc-session-continuity | Skill não descoberta | Verificar tabela antes de finalizar |

---

*Skill — `.github/skills/proc-skill-creator.md`*
*Referência: `.github/base/roles/skill.template.md` · `.github/base/BOOTSTRAP.md` §Passo 4*
