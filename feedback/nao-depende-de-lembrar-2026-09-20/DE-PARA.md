# De-para — `basic-engineering` × `nao-depende-de-lembrar`

> **O que é:** comparação item a item entre esta base e o repositório
> `oliveirarenanfelipe/nao-depende-de-lembrar` ("fundação"), com foco em
> **processos, hooks e interligação**. Segue o filtro do `feedback/README.md`:
> *(1) reforça a missão* e *(2) mantém simples, sem burocracia*.
>
> **Regra aplicada a este documento:** número sem comando de prova não entra.
> Onde algo não foi medido, está escrito *não medido*.

**Analisado em:** 2026-09-20 · **Eles:** HEAD `119a822` (2026-09-18), clone raso
em pasta temporária de sessão · **Nós:** `be` 3.1.1, working tree limpo em `91386e4`

---

## §0 — O que é o repositório analisado

Projeto Python 3.9+, **zero dependências**, ~20 peças executáveis divididas em
`maquina/` (mede e conserta) e `portas/` (recusa). Não é um plugin nem um
framework: é a destilação pública de uma "casa" real com ~30 projetos.

A tese está no nome e é a mesma dor que originou a nossa base — o autor cita o
diagnóstico verbatim: *"às vezes faz e às vezes esquece, depende de eu lembrar
de ficar pedindo"*. A régua que ele deriva disso vale ser copiada inteira:

> **"Aviso que não reprova é decoração."**

**Descoberta de contexto que muda a leitura deste documento:** o repositório
**cita esta base como fonte**. Em `maquina/montar_repo.py`:

> *"🔑 A IDEIA VEIO DE FORA, e a fonte importa: o `basic-engineering` tem um
> `scripts/validate.js` que roda no CI e confere a estrutura do repositório
> (…). Nós tínhamos metade do conteúdo e nenhuma da estrutura."*

E em `DECISOES.md §10` ele **recusa, com motivos medidos, o nosso
`_gateguard.js`** — descrito lá com precisão (barra a 1ª edição de cada arquivo
por sessão, exige 4 declarações, opcional, desligado por padrão). Conferido
contra `plugins/be/hooks/scripts/_gateguard.js`: a descrição está correta.

Ou seja: não é um repositório alheio a copiar, é **mão dupla já em curso**. O que
vem de volta é mais valioso por isso — é crítica de quem usou a ideia.

---

## §1 — A régua que eles trouxeram: a escada de força

É o instrumento mais útil da análise inteira. Aparece verbatim em dois gates
(`seguranca_na_porta.py`, `fundacao_na_porta.py`):

| degrau | o que é | quando vale |
|---|---|---|
| 1 | texto no arquivo soberano (`CLAUDE.md`, skill, princípio) | enquanto alguém lembra de ler |
| 2 | recall / catálogo / skill acionada por descrição | quando a palavra encosta |
| 3 | varredura periódica (auditoria, CI) | descobre no dia seguinte |
| **4** | **gate na porta (hook `PreToolUse`)** | **impede de acontecer** |

E a evidência que ele usa contra o degrau 1 é dura, medida em outro framework:
*"um framework inteiro que PROMETE bloquear ('Violações são bloqueadas
automaticamente via gates') e nunca bloqueou nada — das 411 validações
'blocking' dele, 10 citam um comando de verdade, e ele nunca rodou uma vez em
5 meses nos 6 projetos"*.

**Medido nesta base, 2026-09-20:** das **29 skills**, **1** é citada por algum
hook (`proc-session-continuity`, no `stop.js`) — e ainda assim como *lembrete
não bloqueante*. As outras 28 vivem no degrau 1 ou 2.

```bash
for s in $(ls plugins/be/skills); do grep -rqs -- "$s" plugins/be/hooks/scripts/ && echo "$s"; done
# → proc-session-continuity  (1 de 29)
```

Isso **não** é um veredito de que 28 skills estão erradas: skill é conhecimento
sob demanda, e nem toda regra pode virar gate (veja o critério de entrada em
§3.4). É a medida honesta de onde a nossa força está concentrada — e ela está
quase toda no degrau mais fraco.

---

## §2 — O de-para

### §2.1 — O que ambos têm (convergência independente, e ela vale como prova)

| capacidade | nós | eles |
|---|---|---|
| Painel de fatos gerado, não escrito à mão | `graph-audit.js --md` → `structural-analysis.md` §0 | `montar_repo.py --fatos` → linha `Medido:` do README |
| "Peça órfã é defeito, não pendência" | grafo de ativação, órfãs 3 → 0 | `mapa.json` exige `chamador`; `inventario` reprova sem ele |
| Fail-open documentado nos hooks | `BE_HOOKS`/`BE_HOOK_<ID>`, `try/catch` → exit 0 | `try/except` em stdout/stdin, gate que morre não trava |
| Pin de fim de linha (LF) | `.gitattributes` + validate + semeado no instalador | `.gitattributes` + `newline` explícito nas escritas |
| Decisões registradas e imutáveis | `proc-adr` + `docs/lessons-learned.md` | `DECISOES.md` ("nada aqui é editado") |
| CI em push + PR | `ci.yml` | `testes.yml` |
| CHANGELOG disciplinado | Keep a Changelog + `proc-changelog` | `CHANGELOG.md` |
| Bilíngue | `BE-GUIDE.md` + `.pt.md` gerados | `README.md` + `README.en.md` (à mão) |

A convergência importa: **a lição "um painel de fatos que ninguém re-roda vira
um painel que mente" é nossa, está citada no código deles** — e eles a levaram
um degrau além (§4.2).

### §2.2 — O que **eles** têm e nós não

| # | peça / prática | o que ela garante | nosso estado |
|---|---|---|---|
| E1 | **9 gates `PreToolUse`**, um arquivo por gate, cada um nascido de um incidente com número | segurança de código, fronteira de projeto, catálogo, contrato de dia zero, tamanho do arquivo soberano, prosa | 1 dispatcher, 4 regras (segredo, bypass de verificação, config de linter, gateguard opt-in) |
| E2 | **Teste por mutação em toda suíte** ("18 suítes, 65 mutações, 0 sobreviventes") | que o teste *exercitou o caminho*, não só que passou | `node --test`, sem mutação |
| E3 | **Taxonomia de códigos de saída + guardião executável** (0/1/2/3, `inventario.codigos_de_saida()` reprova quem inventar um 4) | script que lê o código de saída decide certo | convenção implícita, sem guardião |
| E4 | **`antes_de_publicar.py`** — mede **3 superfícies**: versionado, *o que espera um `git add .`*, e as **mensagens de commit** | vazamento pega antes do push | `qa-release-sanitizer` é **agente** (LLM, sob demanda), não programa determinístico |
| E5 | **`o_basico.py`** — 7 itens medidos em **todos** os projetos da casa, todo dia | separa *"tem teste"* de *"o CI roda o teste"* | `/be:check` é comando (LLM), mede 1 projeto quando alguém pede |
| E6 | **`montar_repo.py --conferir`** — prova o **arranjo**, não só o conteúdo | "arquivo esquecido não parece erro: parece um repo que roda faltando uma peça" | `validate.js` prova o que está escrito, nunca a completude |
| E7 | **`regua_de_trava.py`** — trava de publicação **derivada** do contrato do projeto | recomendação que muda com o projeto não vira ruído que se pula | `proc-release-checklist` é lista fixa para todos |
| E8 | **Gate no commit** (`.githooks/pre-commit`, sh + Python, zero dep) | resposta antes de gastar rodada de CI | não temos |
| E9 | **CI endurecido**: actions por **SHA**, `permissions:` mínimo, `timeout-minutes`, `concurrency`, matriz de 5 versões, piso de cobertura que *detecta queda* | supply chain e custo | veja F4 em §4.3 |
| E10 | **Governança**: PR template com "o rito" e **número obrigatório**, issue templates, `CODEOWNERS`, `dependabot`, `codeql`, `CODE_OF_CONDUCT` | o processo cobra sozinho | temos `SECURITY.md`, `CONTRIBUTING.md`, `RELEASING.md` e nada dos demais |
| E11 | **Decisões recusadas registradas** com *gatilho para reabrir* | a recusa não volta como ideia nova | ADRs cobrem "superseded"; recusa não tem lugar de primeira classe |

### §2.3 — O que **nós** temos e eles não

| # | capacidade | por que importa |
|---|---|---|
| N1 | **Distribuição em dois canais** (plugin de marketplace + instalador npm), versões em lockstep e validadas | os gates deles moram no `settings.json` **global de uma máquina**; a "casa 2" não existe sem copiar à mão |
| N2 | **18 agentes especializados** com `model:` declarado e defesa contra prompt injection | eles não têm camada de agente |
| N3 | **29 skills** cobrindo domínio (API, JWT, migrations, a11y, UX, observabilidade, SDD) | a "fundação" deles é processo; conhecimento de construção não está lá |
| N4 | **Protocolo de continuidade** (`HISTORY.md` + `structural-analysis.md` + `lessons-learned.md`) com hook `SessionStart` que injeta estado | eles têm `DECISOES.md`, mas não estado de sessão |
| N5 | **Guia de capacidades gerado e bilíngue** + `/be:help` | o README deles é à mão — e paga por isso (§4.4) |
| N6 | **Release automatizado** com OIDC + procedência, publicação disparada por push | eles publicam à mão |
| N7 | **`be doctor`** — estado por máquina (versão instalada, hooks ativos, fim de linha) | eles não têm equivalente; a escada global pressupõe uma máquina só |
| N8 | **Portabilidade**: Node, Windows/Linux, CRLF endurecido após P-08 | eles já sangraram em cp1252/mojibake no Windows (comentado em `catalogo_na_porta.py`) e consertaram só naquele gate |
| N9 | **Orçamento de contexto e roteamento de modelo** (`/be:context-budget`, `/be:model-route`) | não têm |

---

## §3 — Hooks: a comparação que interessa

### §3.1 — Arquitetura

| | nós | eles |
|---|---|---|
| eventos | `SessionStart`, `PreToolUse`, `Stop` | `PreToolUse` (9 gates) |
| organização | 1 dispatcher com todas as regras | 1 arquivo por gate, testado isolado |
| protocolo de recusa | `exit 2` + stderr | JSON `permissionDecision: "deny"` + `permissionDecisionReason` |
| instalação | vem com o plugin / instalador | `settings.json` global, à mão |
| desligar | `BE_HOOKS=off`, `BE_HOOK_<ID>=off` | não há; o gate é a defesa |
| estado por sessão | `_gateguard.js` (temp, expira 30 min) | `tempfile` por `session_id`, por alvo |

**Onde somos melhores:** distribuição (N1), opt-out disciplinado, portabilidade
(N8), e o dispatcher único custa menos processo por chamada de ferramenta.

**Onde eles são melhores:** o gate é *uma peça com teste e chamador declarados*;
o nosso é uma função dentro de um `if`. E cada gate deles carrega, na docstring,
**o incidente que o originou com número** — o que faz o gate ser revisável.

### §3.2 — A diferença que mais vale: **o gatilho é a AÇÃO, não a palavra**

Doutrina deles, repetida em três gates:

> *"O gatilho é a AÇÃO, não a palavra. Não depende de ele escrever 'humaniza
> isso', nem de eu classificar o texto como 'prosa'. Dispara no segundo em que
> eu vou GRAVAR."*

Uma skill nossa dispara quando o **modelo classifica a situação** como coberta
pela descrição ("Use when…"). Isso funciona — e falha exatamente quando o
modelo não classifica, que é o mesmo instante em que a regra seria mais útil.
O gate na ação não tem esse modo de falha.

**Não é para converter skills em gates.** É para reconhecer que temos **uma**
alavanca de degrau 4 e nenhum critério escrito para decidir quando usá-la.

### §3.3 — "Nega uma vez, a segunda passa" — e a correção que a medição trouxe

A primeira leitura sugeria que esse padrão fosse a novidade deles. **Conferido:
o nosso `_gateguard.js` já faz isso** ("Then retry the same operation",
1ª edição por arquivo, estado por sessão). A diferença real é outra, e é mais
interessante:

- **eles:** gatilho **estreito** (criar arquivo de código novo; editar dentro da
  seção da fila; padrão de segurança conhecido) → poucas interrupções, gate
  ligado por padrão;
- **nós:** gatilho **largo** (a 1ª edição de *qualquer* arquivo) → muitas
  interrupções, gate desligado por padrão.

E é exatamente essa a 3ª objeção da recusa deles (`DECISOES.md §10`): *"ele
barra a primeira edição de todo arquivo, o que numa sessão de vinte arquivos
são vinte interrupções. Gate que interrompe demais é gate que alguém desliga."*
A crítica procede. O conserto não é ligar o gateguard — é **estreitar o
gatilho** até ele caber ligado.

### §3.4 — O critério de entrada, que nós não temos escrito

> *"Só entra a regra que uma MÁQUINA decide sozinha. 'Este código devia ter
> teste' é julgamento e fica de fora: gate que julga erra, gate que erra vira
> ruído, e ruído treina a ignorar o vermelho."*

E o corolário — **gate no início, vigia depois**: o gate barra o que é decidível
na hora; o que exige julgamento vira varredura posterior. Isso desenha uma
divisão de trabalho limpa entre `PreToolUse` (gate) e `/be:check` + agentes
(vigia) que hoje a nossa base não declara.

---

## §4 — O gancho do README: a classe de defeito, e a varredura

O pedido foi usar o README desatualizado como **método**, não como caso isolado.
O repositório analisado nomeia a classe melhor do que nós:

> *"Um gate de publicação responde **'o que eu olhei está limpo?'**. Quem dá o
> push precisa de **'o que vai sair está limpo?'**. Parecem a mesma pergunta e
> não são."*
>
> *"Arranjo errado não parece erro. Um arquivo esquecido não aparece como
> falha: aparece como um repositório que monta, roda e passa nos testes,
> faltando uma peça que ninguém procurou."*

### §4.1 — Por que o nosso `validate.js` passou verde no README errado

Ele faz duas perguntas, e as duas são da mesma direção:

1. `wrongCounts()` — *os números escritos batem com o inventário?*
2. `danglingRefs()` — *os nomes citados existem?*

Ambas verificam **que o escrito é verdadeiro**. Nenhuma verifica **que o
existente está descrito**. O README ficou parado em `d7ff6a6` (2026-08-19
21:25) e atravessou **v3.1.0 e v3.1.1** sem citar `be doctor`, o *update check*
do SessionStart, nem o seeding de `.gitattributes` — três capacidades que o
usuário só descobre se abrir o código. As contagens não mudaram, então o guarda
não tinha o que reprovar.

```bash
git log -1 --format=%ci -- README.md     # 2026-08-19 21:25:07
git log -1 --format=%ci v3.1.1           # 2026-08-20 09:25:19
grep -c -iE "doctor|gitattributes|update check" README.md   # 0
```

### §4.2 — O que eles fizeram que fecha isso

Um job de CI dedicado, `o-que-sobe`, que roda em **toda PR** e faz duas
perguntas que os testes não fazem:

- `antes_de_publicar.py .` → as 3 superfícies do que vai subir;
- `montar_repo.py --conferir .` → **"o painel de fatos do README ainda é
  verdade?"**, re-rodando as suítes. *"Contar lendo o código contaria o que foi
  ESCRITO, nunca o que passa."*

Duas sub-lições que nós **não** temos e são baratas:

- **`medida_vale()`** — painel só vale se sair de rodada **inteira verde**.
  Medição de rodada quebrada não é "número pior", é outro assunto. (Eles
  gravaram `129 checagens, 7 sobreviventes` por cima de `314, 0` uma vez.)
- **Número que varia com o ambiente fica fora do painel** — 401 checagens na
  casa, 396 no runner, sem defeito nenhum. *"Comparar isso por igualdade
  transforma um painel de fatos numa fonte de alarme falso, e alarme falso é o
  caminho mais curto para alguém desligar a checagem inteira."*

### §4.3 — A varredura: a mesma classe aplicada ao resto da nossa base

Tudo abaixo foi **medido em 2026-09-20**, não suposto.

| # | achado | evidência | gravidade |
|---|---|---|---|
| **F1** | **`graph-audit.js --check` não roda em lugar nenhum automático.** O painel §0 do `structural-analysis.md` está verde hoje **porque alguém rodou à mão** na última sessão. | `grep -c graph-audit scripts/release.js` → **0**; ausente de `ci.yml` | 🔴 é a tese do repositório analisado aplicada a nós |
| **F2** | `backlog-audit.js --check` só roda no **release** (`release.js:81`), nunca em PR | leitura do script | 🟠 deriva pode viver em `main` entre releases |
| **F3** | **Enviamos 1 regra Semgrep e nenhum CI a executa.** A skill `infra-ci-cd` exige SCA+SAST; o nosso próprio repo não roda nenhum. | `ls plugins/be/semgrep/` → 1 regra; `grep semgrep .github/workflows/` → 0 | 🔴 promessa no degrau 1 contra prática no degrau 0 |
| **F4** | CI sem `permissions:`, sem `timeout-minutes`, sem `concurrency`, actions presas por **tag** (`@v4`) e não por SHA. E a nossa skill `infra-ci-cd` **não menciona** pin por SHA — o gap é da skill também. | `cat .github/workflows/ci.yml` | 🟠 supply chain |
| **F5** | Sem `CODEOWNERS`, `dependabot.yml`, `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/`, CodeQL | teste de existência | 🟡 |
| **F6** | O README **não enumera** skills/agentes (por desenho — aponta para o `BE-GUIDE`), mas lista os 11 comandos à mão. Esse caso **está coberto**: a contagem reprovaria em 11→12. | `node scripts/validate.js` → passou | ✅ não é buraco |
| **F7** | **Falso positivo do nosso próprio gate, reproduzido nesta sessão.** `_lib.js:156` testa `/--no-verify\b/` em **qualquer ponto** da string do Bash, sem exigir que seja um comando `git`. Escrever um arquivo que *cita* a flag (este documento) foi **bloqueado**. A 2ª metade da função (`:158`) é corretamente escopada a `git commit`; a 1ª não é. | o bloqueio aconteceu ao gravar este arquivo via heredoc | 🔴 "gate que erra vira ruído, e ruído treina a ignorar" |

**F6 é tão importante quanto F1:** a varredura também precisa dizer onde o
guarda já funciona, senão ela vira alarme.

**F7 mereceu o susto.** É a mesma classe que mordeu eles (mojibake em
`catalogo_na_porta.py`: *"Falso positivo, não falso negativo: o gate travaria
trabalho legítimo"*), encontrada aqui por acidente, no meio de uma análise sobre
o assunto. E tem um lado bom: **prova que o `PreToolUse` está de pé nesta
máquina** — o "um olhar" que o passo 1 de `HISTORY.md` pedia depois do
re-clone para 3.1.1.

### §4.4 — E a mesma classe, medida neles

Para não adotar nada por deslumbramento: **o README deles tem o mesmo buraco**,
só que na direção que o painel numérico não cobre. Das ~20 peças publicadas,
**11 não são citadas em nenhum dos dois READMEs** — incluindo 6 dos 9 gates,
que são a parte mais valiosa do repositório.

```bash
for f in maquina/*.py portas/*.py; do b=$(basename $f); case $b in testar_*) continue;; esac; \
  grep -q -- "$b" README.md || echo "ausente: $f"; done | wc -l   # 11
```

A lição combinada: **contagem gerada resolve o número; nada resolve a
completude da prosa exceto uma pergunta feita no ritual de release.**

---

## §5 — Adoções propostas, priorizadas

Cada uma com o buraco que fecha, o custo e o critério de pronto.

### 🔴 Primeira onda — fecha o que já está medido como quebrado

**A1. Consertar o falso positivo do gate de bypass.** (F7)
Escopar a 1ª metade de `isNoVerify()` a um comando `git` de verdade, como a 2ª
metade já faz. Sem isso, o gate cobra do agente um cuidado que ele mesmo não
tem — e treina a desligar.
*Pronto quando:* existe teste com a flag citada dentro de heredoc/string
(permitido) e com `git commit` usando a flag (bloqueado), ambos verdes.

**A2. Rodar no CI os checks que já existem.**
Fecha F1 e F2. Custo: ~4 linhas de YAML. Zero código novo.
*Pronto quando:* `ci.yml` executa `graph-audit.js --check` e
`backlog-audit.js --check`, e uma deriva plantada reprova a PR.

**A3. O ritual de release ganha a pergunta que faltava.**
Fecha a causa raiz do README. Duas partes:
(a) um passo em `RELEASING.md` e em `scripts/release.js`: *"esta versão mudou
alguma capacidade que um leitor do README precisa conhecer? cite o commit ou
responda 'nenhuma'"* — resposta obrigatória, registrada no CHANGELOG;
(b) uma **linha de fatos gerada** no README (modelo `montar_repo.py --fatos`),
verificada no CI, adotando junto as duas sub-lições do §4.2 (`medida_vale` e
"número que varia com o ambiente fica fora").
*Pronto quando:* um release de teste com uma capacidade nova e o README intocado
não passa.

**A4. Praticar a skill que enviamos.**
Fecha F3 e F4. Rodar Semgrep com as nossas próprias regras no `ci.yml`; fixar
actions por SHA com o comentário da versão ao lado; declarar
`permissions: contents: read`, `timeout-minutes` e `concurrency`. E **atualizar a
skill `infra-ci-cd`** para exigir pin por SHA, que hoje ela não pede.
*Pronto quando:* `ci.yml` roda o scanner e `grep -c "uses:.*@v[0-9]"` → 0.

### 🟠 Segunda onda — capacidade nova, custo médio

**A5. Taxonomia de códigos de saída, com guardião.** (E3)
0 = nada a acusar · 1 = acusou · 2 = não deu para usar · 3 = **não deu para
medir** (e 3 **não é verde**). Hoje os nossos scripts e hooks misturam "passou"
com "não consegui medir" — e a lição *"fail-open plus silence makes absence
indistinguishable from calm"* já está em `lessons-learned.md`: isto é a forma
executável dela.
*Pronto quando:* um script novo com `exit 4` reprova no `validate`.

**A6. Estreitar o gatilho do gateguard até ele caber ligado.** (§3.3)
Em vez de "a 1ª edição de qualquer arquivo", gatilhos estreitos e decidíveis por
máquina — por exemplo: criar arquivo de código **novo** (o gate de catálogo
deles), ou editar arquivo sob um limite de risco. Registrar a recusa deles como
evidência de entrada.
*Pronto quando:* medido em uma sessão real, o número de interrupções cai a ≤2 e
o gate pode nascer ligado.

**A7. Critério de entrada escrito para "regra vira gate".** (§3.4)
Uma seção curta em `engineering-principles` e em `proc-skill-creator`: a escada
de força, o critério *"só entra o que a máquina decide sozinha"* e a divisão
**gate no início / vigia depois**.
*Pronto quando:* a próxima skill nova declara em qual degrau ela opera.

**A8. PR template com "o rito" e o número obrigatório.** (E10)
O deles cobra 4 coisas no mesmo commit (peça, teste com mutação, linha no mapa,
chamador) e recusa "melhora a performance" sem número. O nosso equivalente:
peça, teste, aresta de ativação declarada, entrada de CHANGELOG.
*Pronto quando:* o template existe e a próxima PR é aberta por ele.

### 🟡 Terceira onda — avaliar com evidência antes

**A9. `o_basico` executável.** (E5) O maior gap de *capacidade*: eles **medem**
7 básicos em todos os projetos todo dia; nós **aconselhamos** um projeto quando
alguém pede. Caminho natural: estender `be doctor` para aceitar uma lista de
projetos. Adotar junto a distinção que eles isolam — *"tem teste"* ≠ *"o CI roda
o teste"* — e a lição de que **detector que não conhece a forma da casa mede a
si mesmo** (o deles reprovou um SaaS real por não conhecer `turbo test`).

**A10. Mutação nos nossos próprios testes.** (E2) Começar pelo `validate.js` e
pelos hooks, que são o que mais quebra calado — F7 é a prova.

**A11. Gate no commit** (E8) e **lugar de primeira classe para decisões
recusadas, com gatilho de reabertura** (E11).

### Conscientemente fora

- **Zero dependência como restrição de desenho** — deles, faz sentido lá; a
  nossa distribuição é npm.
- **`regua_de_complexidade` como peça** — sobrepõe `/be:model-route` +
  `proc-impact-analysis`. Aproveitar só a **forma**: campos → nível →
  consequência, com as notas visíveis ao lado do veredito.
- **`humanizar_na_porta`** — o índice de marcas de IA é medido e interessante,
  mas é gate de estilo de prosa; fora da missão por ora.
- **Converter skills em gates em massa** — a própria escada deles diz que gate
  que erra vira ruído. F7 custou uma tentativa de escrita; 29 gates custariam a
  sessão.

---

## §6 — O que volta para eles (a mão dupla)

Registrado porque a pasta é de mão dupla e porque a fonte importa:

1. **O README deles tem 11 peças não documentadas** (§4.4), incluindo 6 dos 9
   gates — a mesma classe que eles fecharam para números, aberta para prosa.
2. **A escada pressupõe uma máquina.** Os gates moram no `settings.json` global.
   O nosso P-08 (hook parado por CRLF em cache, diagnosticado só quando a
   sessão rodou na máquina do defeito) é o custo dessa suposição, e o
   `be doctor` é a resposta que encontramos.
3. **Portabilidade**: o mojibake cp1252 que eles consertaram em
   `catalogo_na_porta.py` é de classe, não de arquivo — os outros 8 gates leem
   stdin do mesmo jeito.

---

**Medido por:** sessão de 2026-09-20 · **Fontes:** clone raso `119a822`,
working tree local `91386e4` · **Nada aqui altera comportamento do plugin até
ser triado e implementado.**
