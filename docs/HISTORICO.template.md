# 📋 Histórico de Sessões — [PROJETO]

> **Arquivo de continuidade obrigatória.** Toda nova sessão de trabalho (humana ou
> assistida por IA) **deve** consultar este arquivo antes de iniciar qualquer tarefa.
> Ao final de cada sessão significativa, **deve** atualizar a seção correspondente.
>
> **Complemento gerencial:** `docs/lessons-learned.md` registra erros e
> regras duradouras. Este arquivo registra **estado operacional** — o que está em
> andamento, o que foi concluído e o que precisa de atenção imediata.
>
> Referência: `principios-engenharia.md` §A.3 (Continuidade de Sessão / Session Briefs).

---

## Como usar este arquivo

### Início de sessão (obrigatório)

1. Ler a seção **Estado Atual** abaixo
2. Verificar **Bloqueios** e **Próximos Passos**
3. Consultar `lessons-learned.md` para erros a evitar
4. Iniciar o trabalho com contexto completo

### Final de sessão (obrigatório)

1. Atualizar **Estado Atual** com o que foi feito
2. Mover itens concluídos para **Histórico de Entregas**
3. Atualizar **Próximos Passos** e **Bloqueios**
4. Se houve erro ou descoberta relevante → registrar em `lessons-learned.md`

### Formato de cada entrada

```
### [AAAA-MM-DD] Título curto da sessão

**Responsável:** Nome ou agente
**Entregas:** O que foi concluído
**Decisões:** Decisões técnicas ou de produto tomadas
**Próximos passos:** O que a próxima sessão deve fazer
**Bloqueios:** Impedimentos identificados (ou "Nenhum")
```

---

## Estado Atual

> ⚡ Última atualização: [AAAA-MM-DD]

**Fase do projeto:** [ex: Setup inicial / Desenvolvimento ativo / Estabilização]
**Sprint atual:** Consultar `docs/processo/SCRUM.md` para detalhes

### Em andamento

<!-- Liste o que está sendo feito agora -->
- [item em andamento]

### Concluído recentemente

<!-- Liste entregas dos últimos dias/semanas -->
- [item concluído recentemente]

### Bloqueios

<!-- Liste impedimentos ativos ou "Nenhum bloqueio ativo." -->
- Nenhum bloqueio ativo.

### Próximos passos prioritários

<!-- Numere em ordem de prioridade -->
1. [próximo passo mais urgente]
2. [segundo mais urgente]
3. Consultar `docs/analise-estrutural.md` para pendências técnicas

---

## Histórico de Entregas

> Registro cronológico reverso (mais recente primeiro). Cada entrada é imutável.

### [AAAA-MM-DD] Setup inicial do projeto

**Responsável:** [nome]
**Entregas:**
- Estrutura base criada: `.github/base/`, `.github/agents/`, `.github/skills/`
- `copilot-instructions.md` configurado com contexto do projeto
- Agents instanciados dos templates base
- `docs/` inicializado com estrutura de pastas

**Decisões:**
- Stack escolhida: [tecnologias]
- [decisão arquitetural importante]

**Próximos passos:** Implementar RF-01 a RF-[N] conforme `REQUISITOS.md`
**Bloqueios:** Nenhum

---

*Referência: `principios-engenharia.md` §A.3 · Complemento: `lessons-learned.md`*
