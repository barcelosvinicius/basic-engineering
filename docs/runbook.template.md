# Runbook: [Nome da Operação]

> **Nível de autorização:** [todos / tech lead / devops]
> **Impacto:** [nenhum / usuários afetados / sistema indisponível]
> **Duração estimada:** [X minutos]

---

## Quando usar este runbook

<!-- Descrever quando este runbook é necessário -->
- [cenário 1]
- [cenário 2]

---

## Pré-requisitos

<!-- Ferramentas e acessos necessários -->
- [ ] Acesso ao servidor / ambiente
- [ ] [ferramenta] instalada
- [ ] Variáveis de ambiente configuradas

---

## Passos

### 1. Verificar estado atual

```bash
# Comandos de diagnóstico
[comando]
```

**Saída esperada:**
```
[output esperado]
```

**Se saída diferente:** [o que fazer]

---

### 2. [Nome do passo]

```bash
[comando]
```

⚠️ **Atenção:** [avisos importantes antes de executar]

---

### 3. Verificar resultado

```bash
# Confirmar que operação foi bem-sucedida
[comando de verificação]
```

**Critério de sucesso:** [o que confirma que funcionou]

---

## Rollback

Se algo der errado:

```bash
# Desfazer a operação
[comando de rollback]
```

---

## Pós-execução

- [ ] Registrar operação em `docs/processo/operacoes.md` (data, quem, motivo)
- [ ] Notificar time se operação teve impacto para usuários
- [ ] Atualizar este runbook se procedimento mudou

---

*Runbook — `docs/processo/runbooks/[nome].md`*
*Última atualização: [data]*
