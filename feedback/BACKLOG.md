# Backlog consolidado de melhorias do `be`

> **Fonte dupla, fundida e priorizada.** Junta (1) o `project-c-2026-06-14/SUGESTOES.md` (uso real
> num projeto Java/Spring + Angular) e (2) a análise profunda do **affaan-m/ECC** ("Everything
> Claude Code", https://ecc.tools — clone analisado em `d:\_analysis\ECC`, fora do repo).
>
> **Filtro de toda linha abaixo:** *(1) reforça a missão* (prático + qualidade + **segurança por
> padrão** contra vibecoding) *e (2) mantém simples / sem burocracia?* Se não, está na seção
> "Conscientemente fora".
>
> ~~Estado: **fase de análise fechada (2026-06-16). Nada implementado ainda** — backlog para decisão.~~
>
> **⚠️ Correção de 2026-08-19** — a linha acima ficou **dois meses desatualizada**. Medição desta
> data, por comando: **16 dos 20 itens implementados, 2 parciais, 2 não iniciados**. O próprio
> atraso é um caso da proposta 8 de `project-a-2026-08-19/SUGESTOES.md`: fechar um item é um
> ato manual que ninguém lembra de fazer.
>
> **A partir de agora o status é um comando, não uma linha de prosa:** `node scripts/backlog-audit.js`
> (`--md` para regerar a tabela abaixo). Contar à mão produziu **cinco leituras erradas numa única
> sessão**, todas plausíveis — caminho tirado da *descrição* do item em vez do layout real do
> projeto, e `grep` sensível a maiúsculas contra um título capitalizado.

---

## Princípio que organiza tudo

A maior alavanca não é "mais regras"; é **trazer uma fatia fina de enforcement para o momento em
que o código é gerado**, mantendo o resto advisory e leve. E o ECC mostrou uma terceira saída para
a nossa tensão "poucos itens × especialistas": **ativação condicional por stack** — hospedar
especialistas mas só carregar o que casa com o projeto. Especialista sem inchar contexto.

---

## Tier 1 — Fazer primeiro (núcleo da missão, melhor impacto)

| Item | O que entrega | Origem | Esforço |
|---|---|---|---|
| **1. Espinha de enforcement (hooks)** | `hooks.json` do `be` com **dispatcher** + **níveis `minimal/standard/strict`** + **fail-open**, ligando: `detectSecrets` (bloqueia só o crítico: segredo hardcoded), `config-protection` (impede afrouxar config de linter), `block-no-verify` (impede `git commit --no-verify`), lembrete de `/be:session-end`, e **acumulador no Stop** (format+typecheck 1× por resposta). Tudo opt-in. | SUG #1/#2/#4 · ECC `config-protection.js`, `governance-capture.js`, `block-no-verify.js`, run-with-flags | Médio |
| **2. `/be:check` + `qa-verification-loop`** | Comando que a IA roda **antes de declarar "pronto"** (build→type→lint→test→security→diff, relatório PASS/FAIL "READY for PR") + skill que o respalda. Distribui **regras Semgrep como arquivo** no plugin (hoje só descritas), incluindo `no-localstorage-business-data`. | SUG #1/#3 · ECC `skills/verification-loop` | Médio |
| **3. Guia de capacidades gerado + `/be:help`** | Gerador lê frontmatter de commands/agents/skills → guia que **nunca desatualiza** (check de drift no CI). `/be:bootstrap` escreve na raiz, installer npm copia, `/be:help` mostra on-demand. *(decisão já tomada)* | decisão prévia · ECC `command-registry:generate/check` | Baixo |
| **4. `model:` + `tools:` mínimo + Prompt-Defense em todo agent** | Adiciona `model:` (architect/PO=opus, reviewers/dev=sonnet) → custo/velocidade; aperta `tools:` (hoje `dev-backend` roda com **tudo**) → least agency; prepende **Prompt Defense Baseline** (anti-injection) em cada agent. | ECC agents (`model`, `tools`, prompt-defense) | Baixo |

---

## Tier 2 — Alto valor, esforço médio

| Item | O que entrega | Origem | Esforço |
|---|---|---|---|
| **5. Ativação condicional por stack** | `project-stack-mappings.json`: detecta indicadores (`tsconfig.json`, `pom.xml`…) → ativa rules/skills/commands **e** `permissions: allow/deny` por stack. Dissolve a tensão "poucos × especialistas". | ECC `config/project-stack-mappings.json` | Médio |
| **6. Perfis de instalação modular** | `minimal / core / developer / security / full` — usuário instala subconjunto, em vez de despejar 25 skills. Resolve SUG #6 sem deletar nada. | SUG #6 · ECC `manifests/install-profiles.json` | Médio |
| **7. Mapa de caminhos `.be-paths.json` (EN/PT)** | Hook e comandos leem caminhos do projeto (`HISTORICO.md` vs `HISTORY.md`) com fallback retrocompatível. Corrige o `session-start.js` que hardcoda `docs/HISTORY.md`. | SUG #5 | Baixo |
| **8. Agents especialistas-de-técnica (universais)** | Começar com **`opensource-sanitizer`** (varre segredo/PII/refs internas antes de publicar — exposição/governança) e **`silent-failure-hunter`** (`catch {}` vazio, erro→null, log sem contexto). | ECC agents | Baixo-Médio |
| **9. `/be:context-budget`** | Audita tokens de agents/skills/MCP/rules/CLAUDE.md e recomenda cortes. É a **ferramenta de medição** por trás da nossa tese "unused = noise". | ECC `skills/context-budget` | Médio |
| **10. Enriquecer `mcp.recommended.json`** | Aviso "<10 MCPs", **pin de versão** (supply-chain), nota de data-boundary por server (modelo do `codescene`), +servers úteis (`sequential-thinking`, `playwright`, `nexus`/mascara PII), var de opt-out. | ECC `mcp-configs/mcp-servers.json` | Baixo |

---

## Tier 3 — Vale, menor urgência

| Item | O que entrega | Origem | Esforço |
|---|---|---|---|
| **11. `gateguard` fact-force (lite, opt-in)** | Bloqueia a 1ª edição de cada arquivo até a IA declarar importadores/API/schema + instrução verbatim. Anti-alucinação. Opt-in (pode ser fricção). | ECC `gateguard-fact-force.js` | Médio |
| **12. Skill `sec-agent-security`** | Adapta `the-security-guide.md`: superfícies de ataque de agentes, sanitização bidi/zero-width, least-agency, kill switches, minimum-bar checklist. | ECC `the-security-guide.md` | Médio |
| **13. Supply-chain IOC scan no CI** | Varre dependências contra IOCs conhecidos. Encaixa no skill `infra-ci-cd`. | ECC `scripts/ci/scan-supply-chain-iocs.js` | Baixo |
| **14. Schemas JSON no `validate.js`** | Validar `hooks.json`, manifests e (futuro) skills geradas contra schema — hoje só checamos frontmatter. | ECC `schemas/` | Baixo |
| **15. Proveniência + poda orientada a dados** | `provenance` (source/confidence/author) em skill gerada/importada (→ `proc-skill-creator`) + conceito `skill-health` (taxa de sucesso/declínio) para podar por **dado**, não no olho. | ECC `provenance.schema.json`, `skills-health.js` · SUG #6 | Médio |
| **16. Governança de custo** | `/be:cost-report` + tracker leve por sessão; opcional `/be:model-route`. | ECC `/cost-report`, `/model-route`, `cost-tracker` | Médio |
| **17. Camada `rules/` (always-on) vs skills (on-demand)** | Avaliar uma camada fina de regras sempre-ativas (security/testing/git-workflow) separada das skills sob demanda. Conceito estrutural. | ECC `rules/common/` | Médio |
| **18. Mais agents-de-técnica** | `pr-test-analyzer`, `type-design-analyzer`, `comment-analyzer` (casa `proc-code-documentation`), `spec-miner` (casa `proc-sdd`). | ECC agents | Baixo cada |

---

## Tier 4 — Docs / clareza (barato)

| Item | O que entrega | Origem | Esforço |
|---|---|---|---|
| **19. Fronteira de memórias** | Declarar no `proc-session-continuity`: `be` docs = estado/decisões do projeto; memória do Claude = preferência/feedback de trabalho. | SUG #7 | Baixo |
| **20. SDD opcional explícito** | No `proc-sdd`/BOOTSTRAP: sem SDD, o "grafo" é só o modelo de autoridade (princípios → contexto → agent → skill → docs). | SUG #8 | Baixo |

---

## Status de implementação — medido por comando

<!-- generated by scripts/backlog-audit.js on 2026-08-19 -->
| # | Item | Status | Checks passing |
|---|------|--------|----------------|
| 1 | Enforcement spine (hooks) | ✅ done | 3/3 |
| 2 | /be:check + verification-loop + semgrep | ✅ done | 3/3 |
| 3 | Generated capabilities guide + /be:help | ✅ done | 2/2 |
| 4 | model: + tools: + prompt defense on agents | ✅ done | 2/2 |
| 5 | Stack-conditional activation | ✅ done | 1/1 |
| 6 | Modular install profiles | ✅ done | 1/1 |
| 7 | Path map (.be-paths) | ✅ done | 2/2 |
| 8 | Technique agents: sanitizer + silent-failure | ✅ done | 2/2 |
| 9 | /be:context-budget | ✅ done | 2/2 |
| 10 | Enriched mcp.recommended.json | ✅ done | 2/2 |
| 11 | gateguard fact-force (opt-in) | ✅ done | 1/1 |
| 12 | sec-agent-security skill | ✅ done | 1/1 |
| 13 | Supply-chain / IOC guidance in CI skill | ✅ done | 1/1 |
| 14 | JSON schemas in validate.js | ❌ todo | 0/1 |
| 15 | Provenance + prune-by-evidence | ✅ done | 2/2 |
| 16 | Cost governance (/be:cost-report + model-route) | ⚠️ partial | 1/2 |
| 17 | Always-on rules/ layer | ❌ todo | 0/1 |
| 18 | More technique agents (4 named) | ✅ done | 4/4 |
| 19 | Memory boundary declared | ✅ done | 1/1 |
| 20 | SDD explicitly optional | ✅ done | 1/1 |

**17 done · 1 partial · 2 not started** — of 20.

> Regerar com `node scripts/backlog-audit.js --md` (ou `npm run audit:backlog` para o
> detalhe do que falta em cada item parcial). A release recusa rodar contra tabela desatualizada.

---

## Fila vinda do feedback do `project A` (triado em 2026-08-19)

> As 23 propostas de `project-a-2026-08-19/SUGESTOES.md` foram triadas e **colapsam em 10
> unidades** — várias são a mesma mudança vista de ângulos diferentes. Veredito por proposta,
> medições reconferidas e o raciocínio do colapso estão em
> `project-a-2026-08-19/TRIAGEM.md`. Baseline do plugin: `docs/structural-analysis.md`.

| U | Unidade | Propostas | Esforço | Estado |
|---|---|---|---|---|
| **U1** | Ligar o hub: `proc-session-continuity` declara arestas de saída; aresta tipada; detecção de ciclo | 19, 20 | Baixo | ✅ 2026-08-19 |
| **U2** | O campo no template: comando de prova + data, `pronto quando:`, `bloqueado por:`, classe de evidência | 22, 3, 5, 16, 18 | Baixo | ✅ 2026-08-19 |
| **U3** | Canal de promoção: uma pergunta no `session-end` devolve lição de método ao plugin | 8 | Baixo | ✅ 2026-08-19 |
| **U4** | Paralelismo seguro: *agente paralelo lê; quem escreve é um só* + eixo declarado | 14, 11 | Baixo | ✅ 2026-08-19 |
| **U5** | Custo do que se manda ler: compactação do histórico + medir antes de ler | 1, 12 | Médio | ✅ 2026-08-19 |
| **U6** | Fechamento confere, não redige + varredura de contradição no delta | 17, 2, 4 | Médio | ✅ 2026-08-19 |
| **U7** | Fechar todos os repos que a sessão tocou (`companions:`) | 7, 6 | Médio | ✅ 2026-08-19 |
| **U8** | Zero sem denominador: ausência carrega evidência do alvo exercido | 9 | Baixo | ✅ 2026-08-19 |
| **U9** | Gesto de remoção segura (4 eixos + `// NB:`) — e **relocação de conteúdo**, lacuna descoberta em uso | 10 + erros medidos | Médio | ✅ 2026-08-19 |
| **U10** | Régua nasce falhando: regra verificável traz caso positivo conhecido | 23 | Médio | ✅ 2026-08-19 |

**Fila concluída em 2026-08-19** — as dez unidades entregues. Restam apenas os
itens marcados como fora de escopo abaixo.

**Fora desta fila:** proposta 13 (grafo entre documentos) **adiada** — reavaliar depois de U2;
proposta 15 (hook de frase distintiva) **rejeitada no mecanismo** — intenção coberta por U6;
proposta 21 (ligar o `gateguard`) **já é o item 11 acima** — o que ela acrescenta é o caso medido
para ligá-lo, não a ideia.

---

## Conscientemente FORA (e por quê)

| Descartado | Motivo |
|---|---|
| **`.mcp.json` que auto-sobe `chrome-devtools-mcp@latest`** | Supply-chain + auto-exec não-pinado. **Valida** a regra do `be` de não enviar `.mcp.json` — manter. |
| **Volume de 272 skills / ~20 reviewers e rules por linguagem** | Especialistas, mas **presos a stack**. Só entram via **ativação condicional** (item 5), e mesmo assim 2–3 stacks no máximo. |
| **Loop autônomo de "instincts" / captura de observações** | Sobrepõe o claude-mem que já rodamos e vai contra "sem burocracia". (Aproveitamos só os núcleos: item 15.) |
| **`node -e` minificado gigante no `hooks.json`** | Opaco para revisão. `be` mantém hooks finos → script versionado. |
| **Deps de segurança de terceiros (`gateguard-ai`, InsAIts)** | Encaminham I/O de tools a pacote externo. Trazer o **padrão** (item 11), não a dependência. |

---

## Sequência sugerida de implementação

1. **Tier 1 inteiro** = o "enforcement spine" + guia + agents endurecidos. É o maior salto de
   missão com esforço contido.
2. **Itens 5–7** = ativação por stack + perfis + paths → resolve contexto/portabilidade.
3. Demais tiers conforme apetite.

Cada item, antes de entrar em `plugins/be/`, passa de novo no filtro: *torna qualidade/segurança o
caminho mais fácil, sem virar burocracia?*

---

*Consolidado em 2026-06-16. Fontes: `feedback/project-c-2026-06-14/SUGESTOES.md` + análise do repo
affaan-m/ECC. Rascunhos relacionados em `project-c-2026-06-14/drafts/`.*
