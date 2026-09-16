# Melhorias para o plugin `be` — direção baseada em prática real

**Data:** 2026-08-03 · **Origem:** sessão de alinhamento do contrato do `/busca` + auditoria
cross-repo · **Status:** direção inicial, a ser trabalhada em sessão própria

> **Por que este arquivo fica em `docs/_local/`.** O `be` é recurso pessoal fornecido pelo plugin,
> deliberadamente **fora do versionamento dos repositórios do projeto** (decisão de 2026-06-17).
> Documentar melhorias dele dentro de `docs/` versionado reintroduziria a maquinaria que foi
> removida de propósito.
>
> **Regra de método aplicada a este documento:** cada proposta abaixo nasce de um **fato medido**
> neste projeto, com o número junto. Nenhuma vem de opinião sobre como deveria ser.

---

## Direção — como ler este arquivo *(escrita em 2026-08-19)*

**O que é:** 23 propostas para o `be`, levantadas ao longo de ~6 semanas de uso diário em um par de
repositórios reais (`project A` + `project B`, Spring Boot + Angular + Elasticsearch, a public institution). Não é revisão de código do plugin — é **relatório de quem usou**.

**Não leia as 23.** Elas estão em cinco rodadas cronológicas porque foi assim que apareceram, mas o
peso é muito desigual.

### Comece por quatro

| # | Por que esta | Custo |
|---|---|---|
| **19** | `proc-session-continuity` roda em **toda** sessão e **não cita nenhuma outra skill**. Cinco falhas de processo medidas aqui = cinco arestas ausentes desse único nó | declarar arestas |
| **1** | `HISTORICO.md` cresceu **+51% em 15 dias** e é o arquivo que o protocolo manda ler primeiro. **244 KB** derruba o terminal em WSL | regra de compactação |
| **8** | Lição sobre **método** não tem canal de volta. As diretrizes §15–§18 deste projeto são stack-agnostic e ficaram presas em `docs/` | uma pergunta no `session-end` |
| **14** | Três arquivos absorvem **179 de 200 escritas**. Sem a regra *"lê em paralelo, escreve em série"*, abrir agentes acelera drift | uma regra escrita |

**A 19 é a de maior razão efeito/custo do arquivo**, e várias das outras deixam de ser necessárias
quando o hub passa a encaminhar. Se só uma for feita, que seja ela.

### Passando pelo filtro da missão

O `feedback/README.md` filtra por *"(1) reforça a missão · (2) simples, sem burocracia"*. Aplicando
com honestidade às minhas próprias propostas:

- **Passam limpo:** 1, 7, 8, 9, 14, 16, 19, 20, 21, 22, 23 — todas são *uma regra* ou *uma aresta*.
- **Precisam ser podadas para passar:** a **13** (front-matter `deriva-de:`/`alimenta:` em todo
  documento) é a mais pesada do arquivo — só vale se ficar em 2 campos opcionais, e só nos
  documentos que de fato derivam de outro. A **18** (classe de evidência) idem: vale para
  *afirmação relevante*, não para todo parágrafo.
- **Já estão no `BACKLOG.md`, não são novidade:** a **21** é o item 11 (`gateguard`) — o que
  acrescento é o **caso medido para ligá-lo**, não a ideia. A **12** encosta no item 9
  (`/be:context-budget`), e o que falta lá é a **aresta** a partir do `session-start`, não a
  ferramenta.

### O que **não** mudar

- **`/be:model-route`** raciocina por *tier* (haiku/sonnet/opus), não por versão. Atravessou a troca
  de modelo sem uma linha alterada — é o exemplo de como o resto deveria ser escrito.
- **`Stop` hook como lembrete, nunca bloqueio**, e o `gateguard` **fail-open com expiração**. É o
  padrão certo contra loop, e qualquer aresta nova deve segui-lo.
- **O ritual de início e fim de sessão**, e os ADRs. São o que funciona; o problema nunca foi o
  ritual existir.

### Regra de método deste arquivo

Toda proposta cita o número que a originou, e os números vêm de `grep`/`git`/`wc` reexecutáveis
sobre os repositórios reais. **Onde a medição contrariou a minha suposição inicial, quem ficou foi a
medição** — inclusive nos casos em que ela me deixou mal (ver proposta **23**: o primeiro teste que
escrevi para validar uma regra errou por duas ordens de grandeza **e passou verde**).

---

## Diagnóstico: o `be` está sendo usado, e é por isso que o efeito aparece

Evidência objetiva de uso: `/be:session-start` e `/be:session-end` são o ritual de toda sessão (os
commits `docs(session-end)` provam); existem **8 ADRs** no project A e **8** no project B;
`analise-estrutural.md`, `lessons-learned.md`, `LEARNING-TRAIL.md` e `diretrizes-tecnicas.md`
existem e estão correntes nos **dois** repos. Nada disso existiria sem o protocolo.

**E é justamente por funcionar que o efeito colateral se acumulou:** o `be` é **aditivo por
construção**. `session-end` acrescenta ao histórico; `lessons-learned` acumula; `analise-estrutural`
recebe itens. Nada no protocolo manda **apagar** ou **substituir**.

### O número que sustenta o diagnóstico

| Data | `project A/docs/HISTORICO.md` |
|---|--:|
| 2026-06-16 | 435 linhas |
| 2026-07-03 | 830 |
| 2026-07-17 | 952 |
| **2026-08-03** | **1.092** |

**+151% em sete semanas — cerca de +94 linhas/semana, sem uma única redução.** Projeção linear:
**+4.900 linhas/ano**. Hoje o arquivo tem **189.318 bytes** (185 KB), **24 entradas de sessão**, e
a maior linha tem **5.968 caracteres**.

**A ironia operacional:** é o arquivo que o protocolo manda ler **primeiro em toda sessão**.

E o custo já é concreto: ler o arquivo inteiro derruba o terminal neste ambiente (WSL), o que
obriga a leitura fatiada — ou seja, **o artefato de continuidade já não é lido por inteiro por
ninguém**, humano ou IA.

---

## As seis propostas

### 1. Compactação por idade no `session-end` 🔴

**Fato:** 24 entradas de sessão respondem pela maior parte das 1.092 linhas.

**Proposta:** entrada de sessão com mais de **4 semanas** colapsa para **uma linha** — data, título,
resultado, hash do commit. O detalhe integral **já está preservado** no commit de `session-end`; o
git é o arquivo histórico, o `HISTORICO.md` é o **handoff**.

**Efeito estimado:** sobra o "Estado Atual" + 24 linhas de índice. Nenhum fato é perdido — todos
seguem recuperáveis por `git log`/`git show`.

**Princípio:** handoff longo não é lido. Um handoff que ninguém lê inteiro não é handoff.

### 2. Regra "atualizar é substituir, não acrescentar" 🔴

**Fato medido:** o enunciado *"a API do project B é pública"* estava registrado de **três formas
contraditórias dentro do mesmo arquivo** (`project B/docs/analise-estrutural.md`) — cabeçalho da
§3 (12/06), painel de Rastreio (02/07), itens SEC-C1/SEC-M3 (15/06 e 08/07). **Duas das três eram
falsas.** Cada correção foi registrada como linha nova; ninguém voltou às anteriores.

**Proposta:** o `session-end` passa a exigir, para cada fato que a sessão mudou, a pergunta *"onde
mais este fato está escrito?"* — e a atualização **substitui** o registro anterior (com banner de
correção quando o histórico importar), em vez de conviver com ele.

**Onde dói mais:** em fato de **segurança**. Quem abre um arquivo para responder *"isto está
protegido?"* e encontra três respostas escolhe a errada com 2 chances em 3.

### 3. Painel de fatos verificáveis como saída do `structural-analysis` 🟠

**Fato:** o `analise-estrutural.md` produz **prosa** e **percentuais de estimativa de engenharia** —
nenhum deles reexecutável. Foi o formato que permitiu o item 2 acontecer.

**Proposta:** o `be:structural-analysis` passa a emitir, no topo, uma tabela de **fato · comando de
prova · valor medido · data da medição**. Regra dura: **valor sem data é proibido**, e fato sem
comando não entra — se não dá para escrever o comando, é impressão, não fato.

*Implantado manualmente nos dois repos em 2026-08-03 (§0 de cada `analise-estrutural.md`). A
proposta é que o `be` passe a gerar isso, em vez de depender de alguém lembrar.*

### 4. Gesto de varredura de contradição no fechamento 🟠

**Fato:** a varredura de drift de 31/07 achou **4 drifts pré-existentes + 1 criado na própria
sessão** — e só aconteceu porque foi pedida sob demanda.

**Proposta:** o `session-end` inclui uma varredura **restrita ao que a sessão tocou** (não o repo
inteiro), com uma pergunta única: *"este fato aparece em outro lugar? Está dizendo a mesma coisa?"*

**Por que restrita:** varredura completa é cara e vira ritual vazio; varredura do delta é barata e
pega exatamente a classe de erro que a sessão acabou de poder criar.

### 5. Item de pendência exige critério de pronto 🟠

**Fato medido:** dos 9 itens do mapa S1–S9, **8 fecharam e 1 não** — o **S1** (God Class). Ele não
fecha porque nunca teve critério: *"reduzir God Class"* não tem linha de chegada. O **S7** (*"0
`@Autowired` no repo"*) fechou em uma sessão porque a linha de chegada era verificável.

**Proposta:** ao criar item de pendência, o `be` exige o campo **"como saberemos que acabou"**, e
ele precisa ser verificável por comando. Item sem critério de pronto **não é pendência — é um
sentimento**, e reaparece em toda análise futura sem nunca fechar.

### 6. O `be` assume um repositório; a realidade aqui é um par 🟠

**Fato medido:** seis invariantes atravessam os dois sistemas (retry, timeout, teto de página,
campo de ordenação, sanitização, `track_total_hits`) e **nenhum deles pertencia a um repositório
só**. O mais grave — retry **3 × 3 = 9** idas ao cluster por requisição de usuário — só ficou
visível ao olhar os dois lados juntos, e existe desde que os dois lados passaram a retentar.

**Proposta:** o `be` reconhece o conceito de **par de repositórios** — uma seção espelhada,
declarada como duplicação deliberada, com a regra *"ao alterar aqui, alterar lá"*. Hoje o protocolo
não tem onde colocar um fato que não é de nenhum dos dois.

---

## O que **não** mudar

Vale registrar, porque a tentação em toda revisão é jogar fora o que funciona:

- **O ritual de início e fim de sessão.** É o que dá continuidade e reduz o custo de contexto da
  sessão seguinte. O problema nunca foi o ritual — foi o ritual não ter mecanismo de compactação.
- **Os ADRs.** 16 registros nos dois repos, e cada um respondeu *"por que foi feito assim?"* pelo
  menos uma vez nesta sessão. O ADR-008 sozinho sustentou toda a conversa com a COTI.
- **O `lessons-learned`.** Ele **deve** crescer — é registro histórico, natureza oposta à do painel
  de fatos. Confundir os dois foi parte do problema; separá-los é a solução, não podar o primeiro.

---

## Ordem sugerida

**1 e 2 primeiro** — são os que atacam a causa (crescimento sem compactação e atualização aditiva)
e os únicos com efeito imediato no custo de toda sessão futura. **3 e 5** consolidam o que já foi
implantado à mão. **4 e 6** são refinamentos que ficam melhores depois que 1–3 estiverem de pé.

---
---

# Segunda rodada — 2026-08-18

**Origem:** varredura das lições aprendidas dos dois repos, das diretrizes §14–§18, dos ADRs e do
próprio plugin (`be` 3.0.0 em `~/.claude/plugins/cache/`). **Mesma regra de método:** cada proposta
nasce de um fato medido, com o número junto.

## Reprecificação do diagnóstico: a taxa **triplicou**

A proposta 1 (compactação) não foi implantada. O efeito não ficou parado:

| | 2026-08-03 | 2026-08-18 | Δ |
|---|--:|--:|--:|
| Linhas | 1.092 | **1.650** | +558 |
| Bytes | 189.318 | **244.755** | +55.437 |
| Entradas de sessão | 24 | **36** | +12 |

**15 dias, +51%.** A taxa passou de **~94 linhas/semana** para **~260** — **2,8×**. A projeção linear
de 03/08 (+4.900 linhas/ano) já está defasada: no ritmo atual é **+13.500/ano**.

O dado muda a prioridade da proposta 1 de *"vale a pena"* para *"é o item que se paga primeiro"*.

---

## 7. O repositório em que você não está parado passa fome 🔴

**Fato medido** — `project B`, os três artefatos do protocolo:

| Artefato | Último commit | Atraso | Regra no `session-end` |
|---|---|---|---|
| `analise-estrutural.md` | 2026-08-18 | — | passo 1, **incondicional** |
| `HISTORICO.md` | 2026-08-06 | 12 dias | passo 2, **incondicional** |
| `lessons-learned.md` | **2026-07-08** | **65 commits** | passo 3, ***"if applicable"*** |

No `project A` — o diretório em que as sessões rodam — o mesmo `lessons-learned` está corrente
até **2026-08-18**, com 169 entradas contra 26. **A regra funciona; ela só não alcança o repo ao
lado.**

E o atraso ordena-se pela força do enunciado: o passo condicional é o mais atrasado, e o único
artefato corrente do `project B` só está corrente porque uma auditoria sob demanda o tocou.

**Proposta:** o `session-end` responde por comando *"em quais repositórios esta sessão commitou?"* —
`git log --since` em cada diretório declarado — e roda o fechamento em **cada um**. Hoje o protocolo
fecha o diretório onde o agente está parado, e o irmão acumula silenciosamente.

**Distinção da proposta 6:** a 6 trata do fato que **não pertence a nenhum** dos dois repos. A 7
trata do fato que pertence claramente a um — e não chega lá.

## 8. Lição sobre o **método** não tem canal de volta para o plugin 🔴

**Esta é a proposta que responde "como o `be` evolui".**

**Fato medido:** das entradas de 17–18/08 do `lessons-learned`, a maioria não fala do sistema, fala
do **método** — *"o erro não é deixar de medir, é medir o artefato errado"*, *"registrar o fato novo
sem varrer o antigo cria o drift que se foi caçar"*, *"ferramenta que resume saída não serve como
prova"*. E as diretrizes **§15 a §18**, escritas em 18/08, são **stack-agnostic por inteiro**:
citar por âncora, afirmação nasce do sistema, fato que muda exige varredura, tempo relativo exige
âncora. Nenhuma delas menciona Java, Angular, Oracle ou Elasticsearch.

**Elas estão presas em `docs/` de um projeto.** O `be` fornece `engineering-principles` — que é
exatamente o lugar delas — e não tem como recebê-las.

**A consequência é auto-evidente:** este arquivo é a prova. O plugin só melhora quando alguém
lembra de fazer isto **à mão**, e a última vez foi há **15 dias**.

**Proposta:** o `session-end` faz **uma** pergunta a mais por lição — *"isto depende deste
projeto?"*. Se não depende, ela entra numa fila de promoção do plugin. Duas linhas no protocolo;
o efeito é o plugin aprender com o uso em vez de aprender por lembrança.

**Princípio:** ferramenta que não colhe o que aprendeu com quem a usa envelhece na velocidade de
quem a mantém, não na de quem a exercita.

## 9. Resultado negativo exige prova de que a medição aconteceu 🟠

**Fato medido, duas vezes no mesmo mês:** *"`ng test` reusa cache e pode reportar VERDE sobre
código que não compila"* (05/08) e *"medição negativa só vale depois de provar que a medição
aconteceu"* (06/08).

O `qa-verification-loop` já marca fase sem comando como `SKIPPED` **com motivo** — isso está certo e
resolve *"não rodou"*. **Não resolve o caso pior: rodou, passou, e passou sobre o artefato errado.**
Verde sobre cache velho é indistinguível de verde legítimo no relatório.

**Proposta:** toda fase que reporta ausência — suíte verde, zero achados de segurança, nenhum lint —
carrega junto **a evidência de que exerceu o alvo certo**: contagem de testes executados, hash ou
timestamp do artefato testado, arquivos varridos. Zero sem denominador não é resultado.

## 10. Remoção de código não tem protocolo, e é a operação mais irreversível 🟠

**Fato medido:** o ADR-005 deste projeto existe porque *"0 callers"* quase apagou código vivo
(`createIndex`/`index` no project B, 02/07) — o framework reagia à **classe**, não ao import. A
regra que nasceu dali exige **quatro eixos** antes de apagar: proveniência, supersessão, dano e
inalcançabilidade.

O `be` tem `qa-silent-failure-hunter` para erro engolido e `qa-pr-test-analyzer` para cobertura.
**Não tem nada para a pergunta *"isto pode ser removido?"*** — sendo que remover é a única operação
cujo erro não aparece em teste nenhum: o teste do código apagado some junto.

**Proposta:** um gesto de remoção com os quatro eixos como perguntas obrigatórias, e a exigência de
comentário `// NB:` no que **sobrevive** explicando por que sobreviveu. Sem isso, a próxima análise
reabre a mesma discussão sem o motivo original.

## 11. O `be` assume um agente, sequencial 🟠

**Fato medido no plugin 3.0.0:** `TodoWrite` aparece em **0** arquivos, *plan mode* em **0**,
*Task tool* em **0**. `background` em 2 e `subagent` em 2. Há **15 agentes** declarados, e nenhum
comando diz **quando abrir mais de um**.

O `model-route` **envelheceu bem** e não deve mudar: raciocina por *tier* (haiku/sonnet/opus), não
por número de versão — foi escrito para não envelhecer, e não envelheceu.

**Onde a lacuna custa:** a auditoria de drift de 18/08 atravessou **dois repositórios** procurando a
mesma classe de defeito em cada um. São duas travessias independentes, feitas em sequência. O mesmo
vale para `/be:structural-analysis` num par de repos.

**Proposta:** os comandos de varredura declaram seu **eixo de paralelismo** — "por repositório",
"por camada", "por serviço" — para que quem executa saiba onde abrir agentes em paralelo e onde a
ordem importa. Não é usar recurso novo por ser novo: é que varredura independente é o caso em que
serializar não compra nada.

## 12. `/be:check` não conhece o custo de contexto do que ele manda ler 🟠

**Fato medido:** o `session-start` manda ler o `HISTORICO.md` — **244 KB, com uma linha de 5.967
caracteres**. Neste ambiente (WSL), ler o arquivo inteiro **derruba o terminal**; a leitura é
fatiada por necessidade. O `/be:context-budget` existe, mas é um comando que alguém precisa
**invocar** — e nada no `session-start` o consulta.

**Proposta:** o `session-start` mede antes de ler (`wc -c`, maior linha) e escolhe a estratégia de
leitura pelo tamanho, em vez de mandar ler e descobrir o custo depois. É a proposta 1 vista pelo
outro lado: enquanto a compactação não existir, ao menos o protocolo não deveria **prescrever uma
leitura que não cabe**.

---

## O que **não** mudar — adendo desta rodada

- **`model-route` por tier, não por versão.** Sobreviveu à troca de modelo sem uma linha alterada.
  É o exemplo de como o resto do plugin deveria ser escrito.
- **`SKIPPED` com motivo** no `qa-verification-loop`. Distinguir *"não rodou"* de *"passou"* já
  está certo; a proposta 9 amplia, não corrige.

## Ordem sugerida — revisada

**1 primeiro, e agora com urgência maior** — a taxa triplicou e ele é o único item que reduz o custo
de **toda** sessão futura.

**8 em seguida, e antes de 2–7.** Sem canal de promoção, cada melhoria destas depende de alguém
lembrar de escrevê-la à mão — que é exatamente o modo de falha que este arquivo documenta ao existir.

---
---

# Terceira rodada — 2026-08-18 · processo, sincronismo e paralelismo

**Pergunta de origem:** *"tivemos erros infantis de drift que detalhes de processo teriam evitado;
documentos relacionados passavam por problemas de sincronismo e geraram desinformação que tomou
muito tempo — e como usar IA em paralelo sem quebrar o fluxo?"*

**As duas medições que organizam tudo abaixo:**

| Medição | Valor |
|---|---|
| Documentos versionados nos dois repos | **47 arquivos · 1,35 MB** |
| Documentos que **citam outro documento** | **10** |
| Arquivos alcançados por **um** fato | `ADR-007` **16** · `IMP-15` **13** · `SEC-A2` **10** · `INC-06` **8** |
| Contenção de escrita (últimos 200 commits) | `HISTORICO` **68** · `analise-estrutural` **65** · `lessons-learned` **46** |

**Lidas juntas, elas explicam o sintoma inteiro:** um fato alcança em média **~8 arquivos**, quase
nenhum arquivo declara relação com outro, e **três arquivos concentram 90% da escrita**. Sincronismo
por memória não tem como funcionar nessa geometria — e paralelismo ingênuo colide exatamente nos
três arquivos mais quentes.

---

## 13. Documento não declara do que depende — o grafo não existe 🔴

**Fato medido:** 47 documentos, **10** com link para outro. E um único identificador alcança até
**16 arquivos**. Quando o `IMP-15` muda, **13 arquivos** podem precisar mudar, e nada no repositório
sabe quais.

**Proposta:** front-matter mínimo declarando `deriva-de:` e `alimenta:`. Com isso, *"o que mais
precisa mudar?"* deixa de ser exercício de memória e vira **consulta**.

**Relação com a §17 deste projeto:** a §17 manda varrer por frase — é a versão manual, e depende de
alguém lembrar. O grafo declarado é a versão mecânica da mesma regra.

**Princípio:** varredura por frase é **recall**; relação declarada é **lookup**. Sob pressão, recall
falha primeiro.

## 14. Paralelismo seguro: leitura abre em leque, escrita converge 🔴

**Esta é a resposta direta sobre multi-thread.**

**Fato medido:** `HISTORICO` (68), `analise-estrutural` (65) e `lessons-learned` (46) somam **179
escritas em 200 commits**. São os três arquivos que **todo** fechamento de sessão toca. Abrir N
agentes que fecham sessão em paralelo produz N escritas concorrentes **nos mesmos três arquivos** —
conflito garantido, e pior: conflito resolvido a mão é a origem exata do drift que este arquivo
documenta.

**Proposta — a regra em uma linha:** *agente paralelo lê; quem escreve é um só.*

1. Agentes abertos em paralelo são **somente leitura** e devolvem **achados em esquema fixo**
   (arquivo · linha · fato · evidência), nunca edições.
2. Um **escritor único** integra os achados nos artefatos.
3. Quando escrita paralela for mesmo necessária, o **escopo de escrita de cada agente é declarado e
   precisa ser disjunto** — e disjunção se verifica por comando, não por confiança.

**O plugin já tem o ingrediente:** `mgmt-architect`, `mgmt-domain-expert`, `qa-security-reviewer`,
`qa-pr-test-analyzer`, `qa-silent-failure-hunter` **já são read-only por definição**. O que falta não
é capacidade — é o `be` **enunciar a regra** e dizer qual eixo de cada varredura é paralelizável
(por repositório, por camada, por serviço).

**Princípio:** paralelismo é seguro na leitura e caro na escrita. Errar esse lado troca tempo de
espera por trabalho de reconciliação — que é mais lento e ainda introduz defeito.

## 15. Editar metade da frase é a classe de drift mais barata de evitar 🟠

**Fato medido nesta sessão:** o `HISTORICO` afirmava, **no mesmo arquivo**, que o deploy *"leva o
`char_filter`"* — na descrição do passo 1 do topo da fila — e, poucas dezenas de linhas acima, no
adendo de apuração de 2026-08-18, que o `char_filter` **já estava em produção**. As duas passagens
foram escritas por mim na mesma sessão: **corrigi metade da frase** e deixei a outra metade viva.

O padrão é sempre o mesmo: corrige-se o fato **onde ele está mais visível**, e as cópias
sobrevivem. Não é falta de cuidado — é que a cópia não avisa que existe.

**Proposta:** um hook de pré-commit que, para cada linha de documentação alterada, extrai a **frase
distintiva** (não o ID) e a procura no par de repositórios. Se aparecer fora do diff, avisa.
Custo: um comando. O `be` **já tem infraestrutura de hooks** — falta o gesto.

**Por que a frase e não o ID:** o ID é fácil de varrer e é exatamente o que já se varre. A
contradição vive na **prosa**, que é onde ninguém procura.

## 16. Critério de pronto precisa ser **alcançável**, não só verificável 🟠

**Fato medido:** o gatilho de remoção da guarda de transição foi escrito como *"quando o pipeline do
project B fechar verde"*. Verificável por comando — e **impossível**: o pipeline falha por causa do
**INC-07**, que é outro item aberto. O critério dependia da resolução de um bloqueio que o item não
controlava.

**A proposta 5 pede critério de pronto. Este é o complemento:** critério verificável mas
inalcançável é **pior** que critério vago, porque parece resolvido e nunca fecha.

**Proposta:** ao registrar o critério, responder também *"o que precisa ser verdade para este
critério poder ser satisfeito?"*. Se a resposta for outro item aberto, a dependência é **declarada**
— e o item nasce bloqueado em vez de nascer órfão.

**Princípio:** item sem critério é sentimento (proposta 5); item com critério inalcançável é
**armadilha** — consome atenção a cada revisão e nunca sai.

## 17. Sessão longa perde o próprio rastro — o registro tem que ser incremental 🟠

**Fato medido:** a sessão de 18/08 rodou de **11h30 a 17h45**, com **28 commits em 2 repositórios**,
e o fechamento tenta reconstruir tudo **no fim**. O drift que eu mesmo criei (registrar o `INC-06` e
deixar o fato refutado vivo em 6 lugares) aconteceu **no meio** — e sobreviveu justamente porque o
registro só seria revisado horas depois.

**O ângulo de IA, que é o que torna isto específico:** sessão longa é **compactada**. O que não foi
escrito no momento em que o fato mudou existe apenas no contexto — e **contexto compactado não é
recuperável**. Escrever no instante da mudança é a única forma de o registro sobreviver à própria
sessão.

**Proposta:** o `session-end` deixa de ser **composição** e passa a ser **verificação**. O fato é
registrado quando muda; o fechamento confere se o que foi registrado bate com o que os commits
mostram. Fechamento que **redige** compete com a fadiga do fim da sessão e com a perda de contexto;
fechamento que **confere** não.

## 18. Afirmação precisa carregar sua classe de evidência 🟠

**Fato medido:** a ficha versionada do `INC-07` dizia **"medido, não inferido"** enquanto a análise
local do mesmo incidente dizia que **a causa não estava confirmada** — o log do pod que travou
**nunca existiu**. Dois documentos, o mesmo fato, **status epistêmico oposto**.

Isso não é drift de conteúdo: os dois textos descreviam o mesmo evento. É drift de **confiança** — e
é o mais caro, porque quem lê *"medido"* para de investigar.

**Proposta:** toda afirmação relevante carrega sua classe — **medido · inferido · relatado ·
hipótese** — e a classe é parte do fato, não do estilo. A §14 deste projeto já exige prova para item
aberto; isto estende ao que já parece fechado.

**Princípio:** hipótese instrumentada e medição são igualmente úteis e **não são intercambiáveis**.
Quando o texto não distingue, a hipótese herda a autoridade da medição — que foi exatamente o que
aconteceu.

---

## Como as três rodadas se encaixam

| Rodada | Ataca |
|---|---|
| **1ª (03/08)** — propostas 1–6 | o artefato **cresce** sem compactar |
| **2ª (18/08)** — propostas 7–12 | o protocolo **não alcança** (repo irmão, plugin, custo de leitura) |
| **3ª (18/08)** — propostas 13–18 | o fato **não se propaga** e o trabalho **não paraleliza** |

**A ordem final sugerida muda com esta rodada:**

**1 → 8 → 14 → 13.** A **1** reduz o custo de toda sessão. A **8** faz o plugin aprender sozinho. A
**14** é pré-requisito de qualquer paralelismo — sem ela, abrir agentes **acelera a produção de
drift** em vez de acelerar o trabalho. A **13** é a que torna a **15** e a §17 desnecessárias, porque
substitui varredura por consulta.

---
---

# Quarta rodada — 2026-08-18 · o grafo existe; falta uma aresta

**Pergunta de origem:** *"o `be` funciona como grafo inteligente, acionando recurso conforme a
necessidade sem o usuário pedir? Dá para melhorar sem criar loop infinito?"*

**Resposta medida: sim, e melhor construído do que a suposição inicial.** O que segue mede o grafo
do plugin 3.0.0 antes de propor qualquer coisa.

## O que já funciona — e não deve ser mexido

| Mecanismo | Medição | Veredito |
|---|---|---|
| Ativação por modelo | **28 de 28** skills com gatilho explícito (*"Use when/for/before…"*) | ✅ correto |
| Grafo entre skills | **19 de 28** citam outra skill | ✅ existe |
| Delegação entre agentes | **14 de 15** agentes delegam a outro | ✅ densa |
| Gatilho determinístico | hooks em `SessionStart`, `PreToolUse`, `Stop` | ✅ existe |
| Proteção contra loop | `Stop` é *"reminder only — never blocks"*; `gateguard` é **fail-open**, expira em 30 min, bloqueia só a **primeira** edição de cada arquivo | ✅ **já resolvido** |

**A preocupação com loop infinito já foi endereçada pelo autor do plugin**, e com o padrão certo:
falha para o lado permissivo, expira por tempo, e o hook que poderia recursar apenas **lembra**, não
bloqueia. Qualquer aresta nova deve seguir esse mesmo padrão.

## 19. O hub do protocolo é uma **folha** do grafo 🔴

**Fato medido:** das 28 skills, **9 não citam nenhuma outra**. Uma delas é
**`proc-session-continuity`** — a skill que roda no início **e** no fim de **toda** sessão. Ela cita
`engineering-principles` (referência, não delegação) e mais nada.

**O nó mais executado do plugin não tem aresta de saída.**

E cada falha de processo medida nas rodadas anteriores corresponde a **uma aresta que não existe**:

| Falha vivida (medida) | Aresta faltante |
|---|---|
| `lessons-learned` do project B **65 commits** atrasado | `session-continuity` → `proc-learning-trail` |
| `session-start` manda ler **244 KB** e derruba o terminal | `session-continuity` → `proc-context-budget` |
| Fechamento sem conferir o que foi afirmado | `session-continuity` → `qa-verification-loop` |
| `analise-estrutural` do repo irmão parado | `session-continuity` → `proc-structural-analysis` |
| Decisão tomada em sessão que não virou registro | `session-continuity` → `proc-adr` |

**Cinco falhas independentes, um único nó, cinco arestas ausentes.** Isso reordena o diagnóstico das
rodadas 1–3: o problema nunca foi o `be` não ter os recursos — **ele tem todos os cinco**. O problema
é que o nó que sempre roda não chama nenhum deles, e a ativação fica dependendo de o usuário
lembrar o nome do recurso.

**Proposta:** `proc-session-continuity` declara suas arestas de saída, com a condição de cada uma.
Não é lógica nova — é tornar explícito o que o protocolo já descreve em prosa (*"update
structural-analysis"*, *"record in lessons-learned if applicable"*) mas não **liga** ao recurso que
faz exatamente aquilo.

**Princípio:** num grafo de ativação, o nó de maior grau de execução deve ter o maior grau de saída.
Ter o menor é o pior arranjo possível — é o único ponto por onde **toda** sessão passa, e ele não
encaminha nada.

## 20. Aresta tipada + ciclo verificável por comando 🔴

Aresta nova cria risco de ciclo (`A → B → A`). O plugin já tem o padrão seguro; falta enunciá-lo
como regra de quem escreve skill.

**Proposta — três regras, todas verificáveis:**

1. **Aresta é tipada.** `consulta` (lê a skill, não reentra) ou `invoca` (pode executar). Só a
   segunda entra no cálculo de ciclo — hoje as duas se parecem no texto.
2. **O conjunto das arestas `invoca` é um DAG**, e a verificação é um comando, não uma revisão. Grafo
   pequeno (28 nós): detecção de ciclo é trivial e pode rodar no `/be:check`.
3. **Reentrância no mesmo escopo é proibida.** O `gateguard` já faz isso por arquivo
   (*"primeira edição de cada arquivo"*); generalizar para *"uma execução por skill por sessão"*.

**E o padrão de escape que o plugin já usa:** quando a aresta puder recursar, ela **lembra** em vez
de **bloquear** — foi a escolha do hook `Stop`, e é a que não trava trabalho.

**Princípio:** grafo sem tipo de aresta não tem como ser verificado; grafo com tipo de aresta tem
detecção de ciclo em linha de comando. O custo de tipar é uma palavra por aresta.

## 21. O `gateguard` está desligado — e é exatamente a guarda que faltou 🟠

**Fato medido:** `hooks/scripts/_gateguard.js` bloqueia a **primeira** escrita em cada arquivo da
sessão e exige que o agente declare fatos concretos antes de repetir — *importers, API afetada,
formato do dado, e a instrução literal do usuário*. Está **desligado por padrão**
(`BE_GATEGUARD=on`), com o comentário: *"o ato de investigar cria consciência que a auto-avaliação
não cria"*.

**Os três defeitos mais caros desta sessão são precisamente o alvo dele:**

| Defeito | O que o gate teria exigido |
|---|---|
| Propus mudar o SQL de sync contra um `// NB` no próprio código que dizia o oposto | ler o arquivo antes da primeira edição |
| Corrigi metade da frase do `char_filter` e deixei a outra metade | declarar o que mais é afetado |
| Ficha do MIN-12 prescrevia tipar componente **já tipado** | confirmar o formato do dado |

**Proposta:** avaliar ligá-lo neste par de repositórios e medir. O custo é conhecido e limitado —
**uma vez por arquivo por sessão**, não por edição. Se o preço se pagar aqui, vira recomendação de
perfil de instalação; se não, fica o dado negativo, que também vale.

**Ressalva honesta:** é fricção deliberada, e fricção tem custo real em sessão longa. A decisão
precisa de medição, não de entusiasmo — inclusive porque a sessão de 18/08 teve **28 commits**, e o
gate encareceria cada arquivo novo tocado.

---

## O que esta rodada muda no diagnóstico geral

As rodadas 1–3 trataram os sintomas como falhas de **protocolo**. A medição do grafo mostra que a
maioria é falha de **ligação**: o recurso existe, o gatilho existe, e o nó que roda sempre não
aponta para ele.

**Isso barateia a correção.** Escrever `proc-learning-trail` seria trabalho; **ligar**
`session-continuity` a ele é uma linha — e resolve sozinho o item que estava **65 commits** atrasado.

**Ordem final, revisada pela quarta vez:** **19 → 1 → 8 → 14**. A **19** vem primeiro porque é a de
maior razão efeito/custo do arquivo inteiro, e porque várias das outras propostas **deixam de ser
necessárias** quando o hub passa a encaminhar.

---
---

# Quinta rodada — 2026-08-18 · o que a validação das diretrizes revelou

**Pergunta de origem:** *"criamos diretrizes que melhoravam o processo de documentação — consegue
validar isso?"*

Cada diretriz foi transformada em **comando** e executada. O resultado inverteu a resposta
confortável, e as duas propostas abaixo saem do modo como a validação falhou.

## 22. A regra mora no **esquema**, não na prosa 🔴

**Fato medido, e é o mais limpo do arquivo inteiro:**

| Tabela | Tem coluna de data? | Linhas datadas |
|---|---|--:|
| `§0.1 — Fatos deste repositório` | **sim** (`Medido em`) | **100%** |
| `§0.2 — Invariantes cross-sistema` | **não** | **0 de 6** |

**Mesma equipe, mesmo arquivo, mesma sessão, mesma regra (§14: valor sem data é proibido).** A
diferença de conformidade é **100 pontos**, e a única variável é se a **tabela tem a coluna**.

E não é linha decorativa: entre os seis invariantes sem data está o `track_total_hits`, marcado como
**problema aberto** — exatamente onde a data mais importa.

**Proposta:** onde o `be` prescreve uma regra sobre conteúdo, ele entrega o **template com o campo**.
Regra em prosa depende de quem escreve lembrar; campo vazio na tabela **cobra sozinho**.

**Princípio:** conformidade segue o esquema, não o enunciado. Escrever a regra e não mudar o
formulário é deixar o cumprimento por conta da memória — e a §0.2 mostra o resultado disso.

## 23. Regra sem teste conferido é regra sem prova 🔴

**Fato medido:** o primeiro comando que escrevi para medir a §15 devolveu **1 violação**. O número
real é **145 ocorrências**, das quais **≥ 18 comprovadamente erradas** — apontam para linha em
branco, chave de fechamento ou comentário. **Errou por duas ordens de grandeza e passou verde.**

Dois defeitos independentes, os dois genéricos:

1. **`grep -v _local` encadeado depois de `grep -o` não filtra nada** — o `-o` imprime só o texto
   casado, sem caminho. Exclusão de escopo tem de ser argumento do `grep`, não etapa de pipe.
2. **O regex procurava a redação da regra** (a palavra *"linha"*, âncoras Markdown) e não o **hábito
   real do projeto** (`Classe:NNN`). Teste desenhado a partir do enunciado confirma o enunciado.

**Proposta:** toda regra verificável do `be` nasce com **um caso positivo conhecido**, e o comando
precisa **falhar nele** antes de valer. É o `qa-verification-loop` aplicado à própria régua — e
fecha a lacuna que a proposta 9 abre uma camada abaixo.

**Princípio:** teste não exercitado é o §16 uma camada acima — mede o artefato errado, e o verde
convence mais do que o silêncio.

---

## O que a validação diz sobre as diretrizes, sem enfeite

**Onde o teste é honesto, elas estão sendo seguidas:** §15 e §18 nos **documentos** estão em
conformidade total — os únicos casos restantes são os exemplos citados dentro das próprias regras.
Duas violações reais foram achadas e corrigidas na mesma passagem.

**Onde não estão:** a §15 nunca foi enunciada para **código**, e é lá que estão as 145 citações, com
26% de erro comprovado. A regra existia; o **alcance** dela é que estava subdimensionado.

**E o mais importante:** quatro das cinco diretrizes nasceram em 2026-08-18. **Validar efeito ainda
não é possível** — o que se validou foi **conformidade**, que é outra coisa. O efeito só se mede
comparando a taxa de drift antes e depois, daqui a algumas sessões, com o mesmo comando. Essa
medição fica registrada como pendente, e **o comando dela já existe** — é o desta rodada.

---
---

# Quarta rodada — 2026-09-16 · o `/be:check` não olha pra documentação nem pra cobertura por arquivo

**Pergunta de origem:** ao entrar numa lista de itens de dívida técnica (IMP-10, IMP-14, MIN-17,
MIN-14/15), o dono perguntou se falhas do tipo "endpoint sem doc" e "controller sem teste" — achadas
só porque alguém fez auditoria manual — não são, na verdade, falha do próprio `be`, e se cabe
melhoria.

**Fato medido:** neste projeto, uma auditoria manual de 2026-08-24 (MIN-14) achou **9 endpoints
existentes no código e citados em lugar nenhum da documentação**, e um décimo apareceu de carona
nesta sessão (`GET /admin/diagnostics`, criado em 09-14, depois da auditoria — caiu no mesmo buraco
na mesma semana em que nasceu). A mesma auditoria achou **5 de 8 controllers (62,5%) sem nenhuma
classe de teste** — e o padrão não é aleatório: só ganhou teste o que foi tocado nas frentes
recentes; o que nunca foi mexido nunca ganhou cobertura. **`/be:check` (`commands/check.md`) não
cobre nenhuma das duas coisas** — as 6 fases são build→type→lint→test→security→diff; coerência
doc↔código e cobertura por arquivo não são fase nenhuma.

**A mesma auditoria (MIN-15, ficha própria do projeto) já projetou a automação e documentou duas
armadilhas medidas, as duas custando retrabalho no mesmo dia:**

1. `mvn test` **sem** `clean` conta lixo do `target/surefire-reports` — uma suíte que hoje é 146/146
   apareceu como 147/147 por um XML de classe de teste que já não existe;
2. um script que reescreve arquivo inteiro pode **trocar fim de linha sem intenção** — uma limpeza
   de 64 linhas virou um diff de 978 deleções porque 7 arquivos eram CRLF puro. Já custou revert uma
   vez, em outro repositório do mesmo par.

**Proposta:** acrescentar ao `/be:check` (ou a uma skill que ele chama, no molde de
`qa-verification-loop`) duas checagens novas, condicionadas a existir controller REST no stack
detectado:

- **Coerência doc↔código:** `@*Mapping` de todos os controllers × o que a documentação do projeto
  cita — sinal de parada é diferença zero. Precisa resolver constantes de path (`PATH_*`), não só
  ler o literal do `@Mapping`.
- **Cobertura por arquivo (não por linha):** controllers (ou equivalente do stack) sem nenhuma
  classe de teste — sinal de parada é lista vazia, ou não crescer.

As duas rodam depois de `clean` (armadilha 1) e **nunca reescrevem arquivo** — só leem e comparam
(armadilha 2 não se aplica a uma checagem read-only, mas vale como regra geral para qualquer futura
auto-correção que o `be` vier a oferecer nessas categorias).

**Por que entra no `/be:check` e não fica como auditoria avulsa:** o próprio MIN-15 mede o motivo —
o custo da varredura manual foi alto e o resultado tem prazo de validade; em dois meses o mesmo
levantamento acha coisas novas, e ninguém refaz por conta própria. Rodar a cada sessão, barato, é o
que impede a auditoria de virar evento raro.

**O que NÃO propor:** correção automática de nenhuma das duas — endpoint sem doc e controller sem
teste são sinais pra decisão humana (documentar? testar agora ou depois?), não defeito que o `be`
deva corrigir sozinho.
