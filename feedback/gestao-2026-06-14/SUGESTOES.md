# Sugestões de melhoria do `be` — origem: Gestão Financeira Pessoal (2026-06-14)

> Geradas a partir do **uso real** do `be` num projeto (Java/Spring + Angular). Mão dupla:
> o projeto usou o plugin e devolve observações. Filtro: reforça a missão (prático + qualidade
> + **segurança por padrão** contra vibecoding) **sem** virar burocracia?

**Como avaliei:** comparei o desenho do plugin (`plugins/be/`: agents, commands, skills, hooks;
e a base `.github/` no projeto) com o **comportamento real no Claude Code** durante uma sessão
longa (campanha anti-hardcoded, feature de baldes, correções).

---

## Tese central

> Os guardrails do `be` são bons, mas vivem em **documentação + CI (GitHub)** — **não no loop
> de geração da IA**. E é no loop de geração que o vibecoding erra. A maior alavanca não é
> adicionar regras; é **trazer uma fatia fina de enforcement para o momento em que o código é
> gerado** — mantendo o resto advisory e leve.

**Evidência real:** o anti-padrão *"não armazenar dado de negócio em localStorage"* estava
**violado em 4 lugares** (pensão, metas, baldes) e só foi pego em varredura manual — porque a
regra SAST existente (`no-localstorage-auth.yml`) só mira **token/auth**, não dado de negócio.
A regra existia; o enforcement no momento certo, não.

---

## Achados e sugestões

### 🔒 Segurança (núcleo da missão)

1. **Anti-padrão documentado é mais amplo que a regra SAST.**
   `no-localstorage-auth` cobre auth, mas o anti-padrão escrito é "qualquer dado de negócio".
   → **Rascunho:** `drafts/no-localstorage-business-data.yml`.

2. **Gates "obrigatórios" viram opcionais no Claude Code.**
   `proc-generation-review` / `proc-code-review` são ditos obrigatórios, mas nada os dispara —
   nesta sessão não rodaram. → Eleger 2–3 gates realmente mandatórios e torná-los **hooks**
   (`plugins/be/hooks/hooks.json`), o resto advisory. → **Rascunho:** `drafts/hooks-stop-gate.example.json`.

3. **Enforcement mora no GitHub (CI), ausente no loop da IA.**
   `ci-quality-gate.yml` só roda em PR/push; quem faz vibecoding muitas vezes nem abre PR.
   → Comando `/be:check` (lint + semgrep local + grep de anti-padrões) que a IA roda **antes**
   de declarar "pronto".

### ✅ Qualidade que não derrapa

4. **A "regra de ouro" (docs ≤ 1 commit atrás do código) não é enforced.**
   Nesta sessão, docs só foram atualizados quando pedido. → Hook `Stop` que **lembra** de rodar
   `/be:session-end` se houve mudança em código funcional sem update de doc. Lembrete, não bloqueio.

### ⚙️ Praticidade / portabilidade (sem burocracia)

5. **Portabilidade Copilot ↔ Claude é frágil (nomes EN × PT).**
   As skills citam `HISTORY.md`/`structural-analysis.md`; o projeto usa `HISTORICO.md`/
   `arquitetura/analise-estrutural.md`. O `/be:session-start` tropeçou nisso.
   → **Rascunho:** `drafts/paths.example.json` — mapa de caminhos por projeto que os comandos leem.

6. **Redundância de skills gera ruído.** `arch-*` × `be-*` × `proc-*` se sobrepõem (~45 skills).
   → Consolidar/declarar hierarquia (conceito → prática) e podar duplicatas.

7. **Duas memórias coexistem sem fronteira.** `be` docs (`docs/`) × memória do Claude
   (`CLAUDE.md` + memórias). → Declarar fronteira: `be` docs = estado/decisões do projeto;
   memória do Claude = preferências/feedback de trabalho. `session-start` lê ambos.

8. **O "grafo" é conceitual, não operacional.** A navegação em grafo vive no `proc-sdd`
   (`.specify/`), mas o projeto não tem `.specify/`. → `/be:sdd-init` opcional, ou o guia deixa
   explícito que sem SDD o grafo é só o modelo de autoridade (princípios → contexto → agent → skill → docs).

---

## Prioridade (impacto na missão × esforço)

| # | Sugestão | Impacto | Esforço |
|---|---|---|---|
| 2 | Gates mandatórios viram **hooks** no Claude | ⭐⭐⭐⭐⭐ | Médio |
| 1 | Regra SAST de **dado de negócio em localStorage** | ⭐⭐⭐⭐ | Baixo |
| 3 | Comando `/be:check` (quality-gate local) | ⭐⭐⭐⭐ | Médio |
| 5 | **Mapa de caminhos** por projeto (agnóstico EN/PT) | ⭐⭐⭐ | Baixo |
| 4 | Hook lembrete de `session-end` | ⭐⭐⭐ | Baixo |
| 6 | Podar/consolidar skills | ⭐⭐ | Médio |
| 7 | Fronteira de memórias | ⭐⭐ | Baixo |
| 8 | SDD opcional explícito | ⭐ | Baixo |

---

## Princípio-guia

**Poucos gates ENFORCED (segurança/qualidade crítica), o resto advisory.** A força do `be`
contra o vibecoding não é ter muitas regras — é fazer o **caminho seguro ser o de menor
resistência**. Cada adição passa no teste: *"torna a qualidade/segurança o caminho mais fácil,
sem virar burocracia?"* Se não, não entra.

---

*Snapshot de feedback · projeto Gestão Financeira Pessoal · 2026-06-14*
