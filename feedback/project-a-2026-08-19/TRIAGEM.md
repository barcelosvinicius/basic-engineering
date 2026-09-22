# Triagem das propostas — `project-a-2026-08-19`

> **O que é:** veredito por proposta do `SUGESTOES.md` desta pasta, apoiado no baseline
> medido em `docs/structural-analysis.md` §0 e no filtro do `feedback/README.md`:
> *(1) reforça a missão* (qualidade + segurança por padrão contra o vibecoding) e
> *(2) mantém simples, sem burocracia*.
>
> **Regra aplicada a este documento** (§3 e §22 do próprio SUGESTOES): número sem
> comando de prova e sem data não entra. Onde a medição não é possível aqui, está
> escrito *não verificável neste repo*.

**Triado em:** 2026-08-19 · **Contra:** `be` 3.0.0 · `BASE_VERSION v20260617-000002`

---

## §0 — Conferência das medições do autor

Antes de julgar, reexecutei o que dava para reexecutar. **As medições do arquivo se sustentam**;
duas ganham correção de método e uma vira mais grave do que foi relatada.

| Afirmação do SUGESTOES | Medido aqui (`node scripts/graph-audit.js`, 2026-08-19) | Veredito |
|---|---|---|
| 28 skills, 15 agents | 28 · 15 | ✅ confere |
| "19 de 28 citam outra skill" | **21 de 28** | ⚠️ direção certa, número diferente |
| "9 não citam nenhuma outra" | **7** | ⚠️ idem |
| "`proc-session-continuity` … cita `engineering-principles` e mais nada" | in=18, **out=1** (`engineering-principles`) | ✅ confere |
| "14 de 15 agentes delegam a outro" | **15 de 15** | ⚠️ melhor que o relatado |
| "28 de 28 skills com gatilho explícito" | 28/28 (ver nota abaixo) | ✅ confere |
| `TodoWrite`/plan mode/Task tool em 0 arquivos | 0 · 0 · 0 (`grep -rl TodoWrite plugins/be/`) | ✅ confere |
| `gateguard` fail-open, expira 30 min, 1ª edição por arquivo | `_gateguard.js` cabeçalho | ✅ confere |

**A diferença de 2 nas duas primeiras linhas tem causa identificada, e ela própria é um caso da
§23.** Um regex por prefixo (`\b(proc|be|qa|sec|ops|infra)-…`) **não casa `engineering-principles`**,
que não tem prefixo — e é a skill com 2º maior grau de entrada (12). O contador precisa casar
**nome exato**, não padrão de família. Foi o mesmo defeito de classe do `grep -o` da §23: a régua
media o artefato errado e passava verde.

**E aconteceu uma terceira vez, na linha do gatilho.** Meu primeiro comando procurou
`Use (when|for|before)` e devolveu **25 de 28** — teria "refutado" o autor. As três faltantes
(`proc-domain-mapping`, `proc-session-continuity`, `proc-structural-analysis`) escrevem
*"Use **at** project kickoff…"*, *"Use **at** the start and end…"*. Incluindo `at|after|during`,
o resultado é **28/28**: o autor estava certo e a régua estava errada.

> **Três defeitos de régua nesta triagem, todos da mesma classe da §23:** regex por prefixo
> perdendo `engineering-principles`; nome próprio contado como aresta de si mesmo; e enumeração
> de gatilho escrita a partir do **enunciado da regra** em vez do **hábito real do texto**.
> **Nenhum dos três apareceria como erro** — os três devolvem número plausível e passam verde.
> Isto não é anedota de bastidor: é a proposta 23 se provando três vezes em uma sessão, e é a
> razão de ela subir de "boa ideia" para **U10**.

**O que ficou pior do que o relatado — e é achado novo:** três skills não são citadas por
**nada** (nenhuma skill, agente ou comando) — `proc-learning-trail`, `proc-skill-creator`,
`sec-agent-security`. São **órfãs do grafo**: só ativam se o usuário lembrar o nome.
`proc-learning-trail` órfã é a causa mecânica exata do `lessons-learned` do `project B` estar
**65 commits atrasado** — o recurso existe, nada aponta para ele.

**O que ficou melhor:** o hub tem out-degree **1**, não 0, e todos os 15 agentes delegam.
A rede de agentes está sadia; o problema é **só** na camada de skills, e concentrado num nó.

---

## §1 — Veredito por proposta

Legenda: **ACEITA** · **PODAR** (entra reduzida) · **ADIAR** · **REJEITA (mecanismo)** ·
**JÁ EXISTE**

| # | Título curto | Veredito | Por quê |
|---|---|---|---|
| 1 | Compactação do `HISTORICO.md` | **ACEITA** | Custo de toda sessão futura. É uma regra, não um sistema. |
| 2 | Atualização substitui, não acumula | **ACEITA** → funde na 4 | Mesmo gesto da 4 em escopo diferente. |
| 3 | Painel de fatos como saída do `structural-analysis` | **ACEITA** → vira caso da 22 | Já exercitado hoje em `docs/structural-analysis.md` §0. |
| 4 | Varredura de contradição no delta da sessão | **ACEITA** (absorve a 2) | Restrita ao que a sessão tocou = barata. Completa é ritual vazio. |
| 5 | Pendência exige critério de pronto | **ACEITA** → vira caso da 22 | S1 aberto x S7 fechado é a prova. Um campo. |
| 6 | Conceito de par de repositórios | **PODAR** → funde na 7 | A versão genérica é pesada. A barata é `companions:` no mapa de caminhos. |
| 7 | O repo em que você não está passa fome | **ACEITA** (absorve a 6) | `lessons-learned` 65 commits atrás. Mecanismo já existe (`.be-paths.json`). |
| 8 | Canal de volta da lição de método | **ACEITA — prioridade** | É como o `be` aprende. Sem isso, toda melhoria depende de lembrança. |
| 9 | Resultado negativo exige prova de medição | **ACEITA** | Estende o `SKIPPED` com motivo, que já está certo. Zero sem denominador. |
| 10 | Protocolo de remoção (4 eixos + `// NB:`) | **ACEITA** (como skill, não agente) | Única operação cujo erro nenhum teste pega — o teste some junto. |
| 11 | Declarar eixo de paralelismo | **PODAR** → funde na 14 | Uma linha por comando de varredura. Sozinha não se sustenta. |
| 12 | `session-start` não mede antes de mandar ler | **PODAR** | Parcialmente mitigado: o hook já trunca (`MAX_LINES = 40`). A lacuna é na **skill**. |
| 13 | Front-matter `deriva-de:` / `alimenta:` | **ADIAR** | Mais pesada do arquivo. A 22 + 3 já dão o lookup dos fatos que importam. Reavaliar depois. |
| 14 | Lê em paralelo, escreve em série | **ACEITA** (absorve a 11) | 179 de 200 escritas em 3 arquivos. 9/15 agentes já são read-only. |
| 15 | Hook de frase distintiva no pré-commit | **REJEITA (mecanismo)** | Intenção aceita via 2/4 a custo zero. "Frase distintiva" é heurística ruidosa. |
| 16 | Critério precisa ser **alcançável** | **ACEITA** → vira caso da 22 | Complemento de uma linha da 5. Já exercitado hoje (`Blocked by:`). |
| 17 | `session-end` confere, não redige | **ACEITA** | O ângulo de IA é o que a torna específica: contexto compactado não volta. |
| 18 | Afirmação carrega classe de evidência | **PODAR** | Só onde o autor pediu: painel de fatos e item aberto. Vira coluna, não regra de prosa. |
| 19 | **O hub do protocolo é uma folha** | **ACEITA — primeiro** | Confirmada e agravada (3 órfãs). Maior razão efeito/custo do arquivo. |
| 20 | Aresta tipada + ciclo verificável | **ACEITA — junto com a 19** | Medido: `cycle\|graph\|DAG` = **0** em `validate.js` e em `check.md`. Deve nascer com a 19. |
| 21 | Ligar o `gateguard` e medir | **JÁ EXISTE** (BACKLOG 11) | Enviado e desligado por escolha. Não é mudança de plugin — é experimento no projeto. |
| 22 | **A regra mora no esquema, não na prosa** | **ACEITA — meta-regra** | 100 x 0 pontos de conformidade, única variável = a tabela ter a coluna. |
| 23 | Regra nasce com caso positivo que a faz falhar | **ACEITA** | O §0 acima é a prova viva: minha própria primeira régua errou por 2. |

**Contagem:** 15 aceitas · 4 podadas · 1 adiada · 1 rejeitada no mecanismo · 1 já existente · 1 fundida.

---

## §2 — O que a triagem descobriu: 23 propostas são **10 unidades**

Esta é a parte que muda o plano. Várias propostas não são itens independentes — são a **mesma
mudança vista de ângulos diferentes**, levantadas em rodadas diferentes porque foi assim que
doeram. Implementá-las separadamente seria fazer o mesmo trabalho quatro vezes.

**O caso mais forte é a 22.** *"A regra mora no esquema"* é a **causa geral** de que a 3, a 5,
a 16 e a 18 são casos particulares:

| Proposta | O que pede | Como fica sob a 22 |
|---|---|---|
| 3 | fato com comando de prova e data | colunas `comando` e `medido em` no template |
| 5 | pendência com critério de pronto | campo `pronto quando:` no template |
| 16 | critério alcançável | campo `bloqueado por:` no template |
| 18 | classe de evidência | coluna `classe` no painel de fatos |

Quatro propostas, **uma implementação**: mexer nos templates de `plugins/be/templates/docs/`.
Campo vazio na tabela cobra sozinho; regra em prosa depende de quem escreve lembrar.

### As 10 unidades, na ordem sugerida

| U | Unidade | Propostas | Onde mexe | Esforço |
|---|---|---|---|---|
| **U1** | **Ligar o hub** — `proc-session-continuity` declara arestas de saída (condicionadas), zerando as 3 órfãs; aresta **tipada** (`consulta` x `invoca`); detecção de ciclo em `validate.js` | 19, 20 | 1 skill + `scripts/` | **Baixo** |
| **U2** | **O campo no template** — comando de prova + data, `pronto quando:`, `bloqueado por:`, classe de evidência | 22, 3, 5, 16, 18 | `templates/docs/` + 2 skills | **Baixo** |
| **U3** | **Canal de promoção** — uma pergunta no `session-end`: *"isto depende deste projeto?"* Se não, vai para `feedback/` | 8 | 1 skill | **Baixo** |
| **U4** | **Paralelismo seguro** — *agente paralelo lê; quem escreve é um só*; comandos de varredura declaram o eixo | 14, 11 | 1 skill + 4 comandos | **Baixo** |
| **U5** | **Custo do que se manda ler** — regra de compactação do histórico + medir antes de ler | 1, 12 | 1 skill + template | **Médio** |
| **U6** | **Fechamento confere, não redige** — registro no instante da mudança; varredura de contradição no delta | 17, 2, 4 | 1 skill | **Médio** |
| **U7** | **Fechar todos os repos que a sessão tocou** — `companions:` no mapa de caminhos | 7, 6 | hook + skill | **Médio** |
| **U8** | **Zero sem denominador** — fase que reporta ausência carrega evidência do alvo exercido | 9 | 1 skill | **Baixo** |
| **U9** | **Gesto de remoção segura** — 4 eixos + `// NB:` no que sobrevive | 10 | 1 skill nova | **Médio** |
| **U10** | **Régua nasce falhando** — toda regra verificável do `be` traz um caso positivo conhecido | 23 | `validate.js` + `proc-skill-creator` | **Médio** |

**U1 → U2 → U3** primeiro, e as três são de esforço baixo. Juntas atacam causa, não sintoma:
o recurso passa a ser alcançado (U1), a regra passa a ser cobrada pelo formulário (U2), e o
plugin passa a aprender com o uso em vez de aprender por lembrança (U3).

---

## §3 — Cruzamento com o `BACKLOG.md` (2026-06-16)

O `BACKLOG.md` declara *"nada implementado ainda"*. **Isso está desatualizado por dois meses** —
e o próprio fato é um caso da proposta 8. Medido em 2026-08-19:

**Status medido por comando** (`node scripts/backlog-audit.js`, 2026-08-19):
**16 implementados · 2 parciais · 2 não iniciados.** A tabela item a item vive em
`feedback/BACKLOG.md`, regerável com `--md`.

- **Parciais:** 16 (`/be:model-route` existe, `/be:cost-report` não) e 18 (dos quatro agents-de-técnica
  previstos só `qa-pr-test-analyzer` existe).
- **Não iniciados:** 14 (schemas JSON no `validate.js`) e 17 (camada `rules/` sempre-ativa).

> **Correção de 2026-08-19, mesma sessão — e é o caso mais forte da §23 neste arquivo.** As três
> primeiras versões desta seção disseram **10**, depois **12**, e o número real é **16**. Os erros:
> (a) testei existência em `plugins/be/project-stack-mappings.json` e `plugins/be/manifests/` — os
> caminhos que a coluna *"Origem"* do BACKLOG herdou do repo ECC — em vez do caminho real deste
> projeto, `plugins/be/config/`; (b) `grep` sensível a maiúsculas para `provenance` contra o título
> `## Provenance…`. **Nenhum dos dois deu sinal de erro** — os dois devolveram número plausível.
> Foi a revisão do diff que pegou, não o teste. Por isso o status virou script
> (`scripts/backlog-audit.js`): **a régua da §23 aplicada à própria triagem.**
>
> **E o quadro que emerge é outro:** o BACKLOG de junho não está "parado", está **essencialmente
> executado**. A notícia real das 23 propostas não é que faltou fazer o de junho — é que elas são
> a **geração seguinte** de trabalho, nascida do uso do que já foi entregue.

**Sobreposições reais com as 23:**

- **Proposta 21 = BACKLOG 11.** O `gateguard` está pronto e desligado por decisão. O que a
  proposta acrescenta não é a ideia — é **o caso medido para ligá-lo** (três defeitos da sessão
  de 18/08 são exatamente o alvo dele). Ação: nenhuma mudança de código; registrar o caso na
  documentação do gateguard como *"quando ligar"*, e o `project A` roda o experimento.
- **Proposta 12 encosta no BACKLOG 9** (`/be:context-budget`, implementado). O que falta lá,
  como o autor diz, **é a aresta a partir do `session-start`** — ou seja, é **U1**, não uma
  ferramenta nova.
- **Nenhuma das 23 pede o que está em BACKLOG 14 ou 17** (schemas JSON no `validate.js`, camada
  `rules/` sempre-ativa) — os dois únicos itens não iniciados. Seis semanas de uso diário não
  reclamaram de nenhum dos dois. É dado negativo e vale: ficam fora de escopo em
  `docs/structural-analysis.md` §5.
- **A proposta 20 encosta no BACKLOG 14 por outro lado.** O que a 20 pede — verificação de ciclo
  do grafo por comando — é validação estrutural, mesma família do item 14. A U1 já entregou a
  parte que importa; o resto do 14 (schema para `hooks.json` e manifests) segue aberto e sem
  demanda medida.

---

## §4 — O que **não** mudar (consolidado das cinco rodadas)

Reafirmado com medição no baseline (`docs/structural-analysis.md` §3): `Stop` como lembrete e
nunca bloqueio · `gateguard` fail-open com expiração · `/be:model-route` por *tier* e não por
versão · `SKIPPED` com motivo · não enviar `.mcp.json` · o ritual de início/fim de sessão e os
ADRs. **Qualquer aresta criada em U1 deve seguir o padrão do `Stop`: quando puder recursar,
lembra — não bloqueia.**

---

## §5 — O que esta triagem deixa em aberto

- **A proposta 13 (grafo declarado entre documentos) fica adiada, não descartada.** Reavaliar
  depois de U2 rodar algumas sessões: se o painel de fatos com `comando`+`data` já responder
  *"o que mais precisa mudar?"*, a 13 perde razão de ser; se não responder, ela volta com o
  caso medido.
- **O efeito das diretrizes §15–§18 do `project A` ainda não é mensurável** — quatro delas
  nasceram em 2026-08-18. O que foi validado lá foi **conformidade**, não efeito. A comparação
  de taxa de drift antes/depois fica pendente, e o comando dela já existe.
- **Nada aqui altera `plugins/be/` ainda.** Conforme o `feedback/README.md`: rascunho revisado
  primeiro, implementação em sessão própria. As unidades U1–U10 são a fila dessa sessão.

---

## §6 — Segunda triagem — 2026-09-22 · propostas 24–29

**Por que existe:** a proposta 28 mediu que a triagem acima é um retrato. As 24 e 25 (fato de
2026-09-10) e a sexta rodada (26–28, 2026-09-21) nasceram na cópia do projeto
(`docs/_local/melhorias-plugin-be.md`) e só chegaram à versionada em 2026-09-22. No caminho, o
número 24 foi usado para duas propostas diferentes — a entrada de 2026-09-16 virou a 29. Nas 23
primeiras, o estado agora mora numa linha **Estado:** sob cada título do `SUGESTOES.md`,
conferida contra o plugin por caminho e commit: **20 implantadas · 1 descartada · 2 abertas**.

**Filtro aplicado:** o mesmo, com ênfase na segunda metade — *juntar antes de acrescentar*. Seis
propostas viram **uma** unidade nova (a 8.6); o resto cabe no que o plano já tinha.

| # | Título curto | Veredito | Por quê |
|---|---|---|---|
| 24 | Item de checklist respondível só pelo diff | **ACEITA — como frase** → Phase 8.7 | 55 `console.log` sob um item bloqueante durante cinco meses. É redação, não sistema: o problema da 22 um nível acima. |
| 25 | O gate mede os quantificáveis do checklist | **ACEITA** → funde com a 29 na Phase 8.6 | 6 de 6 itens bloqueantes de segurança são medíveis por comando; o `/be:check` roda 0. Reportar, nunca bloquear. |
| 26 | Regra normativa sem gatilho no gesto não vincula | **JÁ EXISTE** (no plano) → Phases 8.2–8.4 | A escada é a do DE-PARA §1, chegada por outra origem. Acrescenta o degrau 5 e o mapa gesto→regra como forma concreta do gatilho da 8.2. |
| 27 | O plugin não tem noção de tamanho de lote | **ACEITA** → destrava a Phase 8.1 | O par medido — um lote de 34 edições: 2 escaparam; 11 lotes: 0 escaparam, 5 pegos — é o caso que a 8.1 esperava. |
| 28 | A triagem é um retrato | **ACEITA — primeiro** → Phase 8.0 | Esta própria seção é a medição: seis propostas sem veredito e um número duplicado, sem nada que acusasse. |
| 29 | Coerência doc↔código e cobertura por arquivo | **ACEITA** → funde com a 25 na Phase 8.6 | 9 endpoints sem doc e 5 de 8 controllers sem teste (2026-08-24). A mesma forma da 25: fase que reporta a distância. |

**Contagem:** 4 aceitas (duas fundidas numa unidade) · 1 aceita como frase · 1 já no plano.

---

*Triado em 2026-08-19 (§0–§5) e 2026-09-22 (§6) · Fonte: `SUGESTOES.md` desta pasta · Baseline: `docs/structural-analysis.md`*
