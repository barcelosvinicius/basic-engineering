# Backlog consolidado de melhorias do `be`

> **Fonte dupla, fundida e priorizada.** Junta (1) o `gestao-2026-06-14/SUGESTOES.md` (uso real
> num projeto Java/Spring + Angular) e (2) a análise profunda do **affaan-m/ECC** ("Everything
> Claude Code", https://ecc.tools — clone analisado em `d:\_analysis\ECC`, fora do repo).
>
> **Filtro de toda linha abaixo:** *(1) reforça a missão* (prático + qualidade + **segurança por
> padrão** contra vibecoding) *e (2) mantém simples / sem burocracia?* Se não, está na seção
> "Conscientemente fora".
>
> Estado: **fase de análise fechada (2026-06-16). Nada implementado ainda** — backlog para decisão.

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

*Consolidado em 2026-06-16. Fontes: `feedback/gestao-2026-06-14/SUGESTOES.md` + análise do repo
affaan-m/ECC. Rascunhos relacionados em `gestao-2026-06-14/drafts/`.*
