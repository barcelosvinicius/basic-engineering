# Princípios de Engenharia de Software

Este documento define os princípios universais de engenharia aplicáveis a qualquer
projeto de software que busque qualidade duradoura, evolução segura e manutenção
orientada por clareza estrutural — não por improviso ou excesso de abstração.

Este arquivo é **imutável na maior parte do tempo** e serve como referência
autoritativa para todos os demais documentos, agentes e decisões técnicas.

---

## Princípio Cognitivo Fundamental — Pensar Antes de Codar

Antes de escrever qualquer linha de código, a decisão técnica **deve estar clara**.
Este princípio existe para reduzir retrabalho, eliminar decisões implícitas e evitar
implementações baseadas em suposições silenciosas.

### Regras obrigatórias
- **Nunca assumir silenciosamente.**  
  Se algo não estiver explícito no requisito, declarar a suposição ou pedir confirmação.
- **Ambiguidade deve ser nomeada.**  
  Quando houver mais de uma interpretação razoável, apresentar as opções e seus trade-offs.
- **Simplificar antes de abstrair.**  
  Se uma solução simples resolve o problema atual, ela é preferível a qualquer abstração
  criada "para o futuro".
- **Pushback é parte da engenharia.**  
  Se uma solicitação levar a uma solução claramente mais complexa do que o necessário,
  é obrigação apontar o risco antes de implementar.

### Objetivo deste princípio
Reduzir:
- implementações excessivamente complexas
- retrabalho por interpretação equivocada
- consumo desnecessário de tempo, esforço e tokens

Este princípio **informa todas as camadas do sistema**:
agents, skills, code review, testes, decisões arquiteturais e operação em produção.

---

## 1. Experiência do Usuário (UX)

### 1.1 Descoberta Progressiva

Revelar informação em camadas. O estado inicial deve ser significativo por si só,
sem exigir que o usuário configure nada para ver resultados úteis.

- **Defaults inteligentes**: controles de filtragem e busca pré-carregados com
  valores que cobrem o caso mais comum (período recente, status ativo, ordenação
  por relevância).
- **Ação mínima para valor máximo**: a primeira interação do usuário deve refinar
  o que já está visível, não iniciar o carregamento.
- **Filtros como refinadores, não pré-requisitos**: a interface carrega com dados;
  filtros reduzem o universo apresentado.
- **Navegação em profundidade (drill-down)**: elementos resumidos devem permitir
  aprofundamento progressivo. Um indicador leva ao detalhamento, que leva ao dado
  granular. O caminho de volta deve ser claro e acessível em qualquer nível.

### 1.2 Performance Percebida

O usuário julga velocidade pela rapidez com que vê conteúdo significativo, não pela
velocidade real da API.

- **Primeiro conteúdo visível (FCP)**: priorizar a renderização do primeiro bloco
  de dados útil. Adiar carregamentos pesados (listas completas, relatórios
  detalhados, recursos secundários).
- **Indicação de progresso**: exibir representação visual do estado de carregamento
  (skeleton screens, barras de progresso, placeholders) enquanto o dado final não
  está disponível. O formato depende do tipo de conteúdo: pode ser uma silhueta de
  tabela, um gráfico vazio com eixos, ou um indicador numérico zerado.
- **Volume de dados por requisição**: nunca carregar tudo de uma vez. Implementar
  paginação, carregamento incremental ou virtualização conforme o padrão de
  consumo da interface. Tamanhos de página entre 10–50 itens como referência
  inicial, ajustáveis por contexto.
- **Debounce em inputs de texto**: 400–800ms para evitar requisições a cada tecla.
  Ver também §6.1.

### 1.3 Hierarquia de Informação

Toda interface que apresenta dados deve seguir o princípio da **pirâmide invertida**:
contexto geral antes do detalhe específico.

- **Contexto antes de especificidade**: independente do formato (cards, tabelas,
  painéis, formulários), a informação que orienta a leitura vem primeiro;
  detalhes e metadados vêm depois.
- **Escaneabilidade**: os elementos mais importantes devem ser identificáveis sem
  interação adicional (sem scroll, hover ou clique).
- **Consistência estrutural**: o mesmo tipo de dado ocupa a mesma posição relativa
  em todas as instâncias do mesmo componente. Se o status aparece no canto
  superior direito de um item, aparece no mesmo lugar em todos os itens.
- **Densidade apropriada**: interfaces de consulta e monitoramento podem ter maior
  densidade de informação; interfaces de entrada e ação devem priorizar foco e
  clareza. A densidade é decisão de design por tipo de sistema, não regra universal.

### 1.4 Feedback e UX Defensiva

Toda ação do usuário deve produzir resposta visual em menos de 100ms.

- Loading spinners ou skeleton screens para operações > 300ms.
- Mensagens de sucesso/erro próximas ao ponto de ação (não no topo da página).
- Desabilitar botões durante processamento para evitar duplo-clique.
- **Confirmação explícita para ações destrutivas**: exclusões, cancelamentos e
  operações irreversíveis exigem confirmação deliberada (modal, double-click
  confirmado, digitação de confirmação). A severidade da confirmação deve ser
  proporcional ao impacto da ação.
- **Conclusão de fluxo**: após ação bem-sucedida em telas transitórias (modais,
  formulários de edição, wizards), o sistema deve retornar automaticamente ao
  contexto de origem com feedback visível do resultado. O usuário não deve precisar
  fechar manualmente ou navegar de volta.

### 1.5 Acessibilidade (a11y)

Software de qualidade é utilizável por todos, incluindo pessoas com deficiências
visuais, motoras ou cognitivas.

- **Semântica HTML**: usar elementos nativos (`<button>`, `<nav>`, `<main>`,
  `<table>`) em vez de `<div>` com role. Elementos nativos carregam comportamento
  acessível por padrão.
- **Navegação por teclado**: todo elemento interativo deve ser alcançável e operável
  via Tab, Enter e Escape. Ordem de foco lógica e visível.
- **Contraste**: texto deve atender ao mínimo WCAG AA (4.5:1 para texto normal,
  3:1 para texto grande). Não depender apenas de cor para transmitir informação.
- **Atributos ARIA**: usar `aria-label`, `aria-describedby` e `aria-live` quando
  a semântica nativa não for suficiente — nunca como substituto de HTML semântico.
- **Imagens e mídia**: toda imagem informativa tem `alt` descritivo; imagens
  decorativas têm `alt=""`. Vídeos com legendas.
- **Testes de acessibilidade**: incluir ferramentas automatizadas (axe, Lighthouse)
  no pipeline e testes manuais com leitor de tela periodicamente.

---

## 2. Segurança

### 2.1 Princípio do Menor Privilégio

Cada componente do sistema (usuário, serviço, módulo) deve ter acesso apenas ao
mínimo necessário para cumprir sua função.

Exemplos práticos:
- Usuário de banco de dados com permissões restritas ao necessário (`SELECT` apenas
  para serviços de leitura; sem acesso a tabelas de auditoria por serviços de negócio).
- **Isolamento de dados por identidade**: em sistemas com dados sensíveis por
  usuário ou por setor, aplicar restrições no nível de acesso a dados (Row Level
  Security, filtros obrigatórios por tenant/owner), não apenas no nível de
  aplicação. Se a camada de aplicação falhar, o banco deve ser a última barreira.
- Service accounts com escopos OAuth restritos ao mínimo.
- Tokens de API com escopos explícitos e validade finita.
- **Preferir credenciais efêmeras** (IAM roles, workload identity federation) sobre
  segredos estáticos sempre que a infraestrutura permitir.

### 2.2 Autenticação e Autorização

- **Tokens de sessão**: usar padrões estabelecidos (JWT, OAuth 2.0, OpenID Connect).
  Nunca implementar autenticação própria do zero.
- **Expiração de tokens**: access tokens com vida curta (15min–1h); refresh tokens
  com rotação a cada uso.
- **Revogação imediata**: logout deve invalidar o token de forma efetiva
  (blacklist, JIT revocation), não apenas descartá-lo no cliente.
- **Proteção de rotas**: autorização verificada no servidor, nunca apenas no cliente.
  O frontend pode ocultar elementos; o backend deve rejeitar requests não autorizados.
- **Senhas**: nunca armazenar em texto plano. Usar algoritmos de hash com work factor
  adequado (bcrypt, Argon2id, scrypt) com salt individual por senha. MD5, SHA-1 e
  SHA-256 puro **não são adequados** para hash de senhas — são rápidos demais e
  carecem de work factor.
- **Comparação segura de tokens e senhas**: usar funções de comparação em tempo
  constante (timing-safe comparison) para evitar ataques de timing side-channel.
- **Brute force**: limitar tentativas de login por IP/conta. Bloquear ou desafiar
  após número configurável de falhas.

### 2.3 Sanitização de Entrada e Saída

- **Nunca confiar em dados de entrada**: todo input vindo de formulários, URLs,
  headers ou APIs externas deve ser validado e sanitizado antes de uso.
- **HTML dinâmico**: jamais renderizar HTML cru fornecido por terceiros sem
  sanitização. Usar bibliotecas nativas do framework com whitelist explícita de
  tags permitidas.
- **Encoding de saída**: dados inseridos em HTML, JSON, SQL ou logs devem ser
  codificados conforme o contexto de destino.
- **Upload de arquivos**: nunca confiar na extensão informada pelo cliente. Validar
  o tipo real do arquivo por assinatura de bytes (magic bytes) e restringir tipos
  aceitos por whitelist. Definir limites de tamanho explícitos por endpoint.
- **Exportação de dados**: dados inseridos por usuários e exportados para formatos
  interpretáveis (CSV, Excel, XML) devem ser sanitizados contra injeção de fórmulas
  (`=`, `+`, `-`, `@` no início de células). Um campo de texto malicioso não deve
  se tornar uma fórmula executável na máquina do destinatário.

### 2.4 Prevenção de Injeção

- **SQL**: sempre usar consultas parametrizadas (prepared statements, named
  parameters). Nunca concatenar strings para montar queries.
- **XSS**: sanitizar todo conteúdo exibido que tenha origem em dados dinâmicos.
- **Command Injection**: nunca passar input de usuário para execução de comandos
  do sistema operacional sem validação rigorosa.

### 2.5 Headers de Segurança HTTP e CORS

Toda aplicação web deve configurar cabeçalhos de segurança explicitamente:

- `Content-Security-Policy` (CSP): define origens permitidas para scripts, estilos
  e recursos. Reduz drasticamente a superfície de XSS.
- `Strict-Transport-Security` (HSTS): força HTTPS por período configurável.
- `X-Frame-Options: DENY` ou `SAMEORIGIN`: previne clickjacking.
- `X-Content-Type-Options: nosniff`: impede MIME-type sniffing.
- **CORS**: configurar explicitamente origens permitidas. Nunca usar wildcard (`*`)
  em APIs que recebem credenciais.

### 2.6 Rate Limiting e Proteção contra Abuso

- Limitar requisições por IP e por usuário autenticado em todos os endpoints públicos.
- Endpoints de autenticação e recuperação de senha exigem limites mais rígidos.
- Respostas de rate limit retornam `429 Too Many Requests` com header `Retry-After`.
- **Limites de payload**: definir tamanho máximo de corpo de requisição por
  endpoint. Uploads e importações têm limites específicos e explícitos. Payloads
  acima do limite são rejeitados antes de processamento para evitar exaustão de
  memória.
- Considerar CAPTCHA para fluxos de registro e recuperação de senha.

### 2.7 Gestão de Credenciais e Configuração

- Credenciais nunca no código-fonte, em nenhuma circunstância.
- Configurações sensíveis (URLs de serviços, chaves, timeouts) externalizadas em
  variáveis de ambiente ou cofres de segredos (Vault, AWS Secrets Manager, etc.).
- Rotação periódica de credenciais como prática operacional.
- Validar na inicialização que todas as variáveis obrigatórias estão presentes —
  falhar com erro claro em vez de iniciar com configuração incompleta.

### 2.8 Segurança de Supply Chain

Dependências de terceiros são superfície de ataque. Gerenciá-las é responsabilidade
da equipe, não do framework.

- **Auditoria automatizada**: executar verificação de vulnerabilidades conhecidas
  em dependências como parte do pipeline CI (npm audit, Dependabot, Snyk, Trivy).
- **Lock files versionados**: `package-lock.json`, `poetry.lock`, `go.sum` devem
  estar no controle de versão. Builds reproduzíveis dependem disso.
- **Pinagem de versões**: preferir versões exatas ou ranges restritos. Evitar
  ranges abertos (`^`, `*`) em dependências críticas.
- **Revisão de atualizações**: atualizar dependências regularmente, mas com review
  — não automaticamente em produção sem validação.

### 2.9 Logging Seguro

- Framework de logging estruturado (não `println` ou `console.log` em produção).
- Nunca registrar dados pessoais (PII), credenciais ou tokens em logs.
- Stack traces devem aparecer em logs internos, nunca em respostas HTTP ao cliente.
- Níveis de log semânticos: DEBUG para desenvolvimento, INFO para fluxos normais,
  WARN para situações recuperáveis, ERROR para falhas que requerem ação.

### 2.10 Tratamento de Exceções

- Um único handler global para exceções não tratadas, retornando mensagens genéricas
  ao cliente.
- Mensagens de erro internas (com detalhes técnicos) ficam nos logs; o cliente
  recebe apenas código HTTP + mensagem amigável.
- Nunca expor nome de classes, queries SQL, ou estrutura interna em respostas de erro.

### 2.11 Privacidade e Proteção de Dados Pessoais

Sistemas que coletam ou processam dados pessoais devem tratar privacidade como
requisito de engenharia, não como preocupação jurídica isolada.

- **Minimização de dados**: coletar apenas o que é necessário para a funcionalidade.
  Questionar cada campo de formulário, cada coluna de banco.
- **Retenção com prazo definido**: dados pessoais devem ter política de retenção
  explícita. Dados sem necessidade de negócio devem ser excluídos ou anonimizados
  automaticamente.
- **Direito de exclusão**: o sistema deve ser capaz de excluir ou anonimizar dados
  de um usuário específico sob demanda (LGPD art. 18, GDPR art. 17).
- **Consentimento explícito**: coleta de dados não essenciais exige consentimento
  informado e registrado. Consentimento deve ser tão fácil de revogar quanto de
  conceder.
- **Pseudonimização**: quando possível, desassociar dados identificadores dos dados
  de comportamento/uso.
- **Transferência a terceiros**: dados pessoais enviados para serviços externos
  (analytics, CRM, etc.) exigem contrato de processamento e avaliação de risco.

### 2.12 Revisão de Segurança Assistida por IA

Antes de deployar qualquer endpoint que receba dados externos, solicitar ao
assistente de IA que gerou o código uma sessão de **adversarial review**:

> *"Tente quebrar este código. Considere: payloads malformados, campos faltando,
> tamanho excessivo, requisições simultâneas, autenticação fraca, race conditions."*

Este processo é especialmente valioso para:
- **Equipes pequenas ou desenvolvedores solo** que não dispõem de pipeline de SAST
  ou revisão de segurança formal.
- **Contexto completo**: a IA que escreveu o código conhece o contexto — pode
  identificar race conditions e problemas de lógica que ferramentas de análise
  estática não detectam.
- **Imediatez**: acontece antes do deploy, não em pipeline assíncrono.
- **Complementaridade**: não substitui SAST formal ou pentest profissional — reduz
  o custo de encontrar os bugs mais óbvios antes que cheguem à produção.

---

## 3. Acoplamento e Coesão

### 3.1 Responsabilidade Única (SRP)

Cada módulo, classe, componente ou função deve ter **uma única razão para mudar**.

Heurísticas de alerta:
- Método com mais de 30 linhas: provavelmente faz mais de uma coisa.
- Componente com mais de 300 linhas: provavelmente mistura responsabilidades.
- Classe que depende de mais de 5 outros serviços: provavelmente orquestra demais.

### 3.2 Sentido de Dependência (Dependency Inversion)

Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem
depender de abstrações.

- Interfaces e modelos compartilhados vivem em camada neutra (`model/`, `shared/`,
  `core/`), nunca em componentes ou páginas específicas.
- Um componente filho nunca importa diretamente de outro componente irmão.
- Serviços de domínio não conhecem detalhes de apresentação.
- O fluxo de dependência em Clean Architecture é de fora para dentro:
  UI → Casos de Uso → Domínio. Camadas internas nunca referenciam camadas externas.

### 3.3 Injeção de Dependência por Construtor

Injeção de dependência via construtor é superior à injeção por campo:

- **Testabilidade**: permite instanciar com mocks sem container DI.
- **Imutabilidade**: dependências ficam `final`/`readonly`.
- **Explicitação**: o construtor declara todas as dependências, tornando o
  acoplamento visível.
- **Falha rápida**: dependência faltante falha em tempo de construção, não em
  runtime.

### 3.4 Regra de Três para Abstração

Código duplicado em dois lugares é tolerável. No terceiro, abstrair.

- Evitar abstrações prematuras: três linhas copiadas são melhor que uma abstração
  especulativa.
- Quando abstrair, verificar que os casos de uso são realmente equivalentes e não
  apenas superficialmente parecidos.

### 3.5 Módulos com Fronteiras Claras

Cada módulo (feature, pacote, microserviço) deve ter uma API pública bem definida.

- Exportar apenas o que é consumido externamente.
- Comunicação entre módulos por contratos (interfaces, DTOs, eventos), nunca por
  acesso direto a estado interno.

---

## 4. Boas Práticas de Codificação

### 4.1 Nomenclatura

- Nomes devem revelar intenção sem necessidade de comentário.
- Consistência: um mesmo conceito recebe o mesmo nome em todo o sistema (não
  `usuario` em um lugar e `user` em outro).
- Verbos para métodos/funções, substantivos para classes/variáveis.

### 4.2 DTOs e Transferência de Dados

- DTOs são objetos de transporte, não de lógica. Sem métodos de negócio.
- Um DTO por caso de uso: nunca misturar campos de consultas diferentes em um mesmo
  objeto.
- Nomes de campos consistentes com a origem (API, banco, índice) para facilitar
  mapeamento mental.

### 4.3 Queries e Acesso a Dados

- Consultas parametrizadas, sempre.
- Aliases explícitos em toda coluna para mapeamento previsível com DTOs.
- Queries complexas centralizadas em constantes ou arquivos dedicados, não embutidas
  em métodos de serviço.
- Campos de texto grande (CLOB, TEXT) exigem tratamento explícito para evitar
  problemas de memória e serialização.
- **Evitar N+1**: buscar dados relacionados em batch sempre que possível.
  Ver também §6.4.
- **Índices**: garantir índices adequados para as queries mais frequentes; revisar
  plano de execução em queries lentas.

### 4.4 Versionamento de API

APIs consumidas por clientes externos devem ser versionadas desde o início:

- Estratégia por prefixo de URL (`/v1/`, `/v2/`) ou por header (`Accept-Version`).
- Manter versão anterior ativa por período anunciado antes de descontinuá-la.
- Mudanças breaking nunca em versão existente — criar versão nova.
- Documentar o contrato de cada versão (OpenAPI/Swagger recomendado).
- **Deprecation proativa**: usar headers `Deprecation` e `Sunset` (RFC 8594) para
  comunicar a clientes programaticamente quando uma versão será descontinuada.

### 4.5 Configuração Externalizada

Princípio 12-factor: toda configuração que varia entre ambientes (dev, homologação,
produção) deve vir de fonte externa.

- Arquivo de configuração com fallback para variável de ambiente.
- Nenhum valor de fallback hardcoded que mascare a ausência de configuração
  (especialmente datas, URLs e tamanhos limites).
- **Validação na inicialização**: a aplicação deve verificar que todas as variáveis
  obrigatórias estão definidas e com valores válidos antes de aceitar tráfego.

### 4.5a Externalização de Dados de Negócio

A configuração externalizada (§4.5) cobre configuração **técnica**: URLs,
chaves, timeouts. Existe uma segunda categoria que também não deve estar
hardcoded: **dados de negócio**.

| Tipo | Exemplos | Local adequado |
|------|----------|---------------|
| Configuração técnica | URLs de serviços, chaves de API, timeouts | Variáveis de ambiente (12-Factor) |
| Dados de negócio | Produtos, preços, URLs de checkout, catálogos | Arquivo versionado (JSON/YAML) ou tabela de banco |

Tratar dados de negócio como variáveis de ambiente é um erro comum — variáveis
de ambiente são para ops, não para produto. Dados que mudam com frequência de
negócio (nova oferta, mudança de preço, novo catálogo) devem residir em
arquivos de catálogo versionados ou em tabelas do banco de dados, lidos
dinamicamente pelo código sem necessidade de redeploy.

### 4.6 Singleton para Objetos Thread-Safe Pesados

Serializadores (Jackson, Gson, System.Text.Json), clientes HTTP e pools de conexão
são thread-safe por design. Instanciar uma única vez e reutilizar.

- `new Serializer()` dentro de métodos é desperdício de CPU e memória.
- Injetar como bean/singleton do container.

### 4.7 Idempotência e Concorrência

Operações que podem ser repetidas (retries, duplicação de mensagens, duplo-clique)
devem produzir o mesmo resultado independentemente do número de execuções.

- **Chaves de idempotência**: endpoints de criação e operações com efeito colateral
  devem aceitar um identificador único por operação, retornando o resultado
  existente se já processado.
- **Optimistic locking**: usar versão ou ETag para detectar conflitos de
  atualização concorrente, em vez de locks exclusivos que reduzem throughput.
- **Operações atômicas**: quando múltiplas escritas devem ser consistentes, usar
  transações de banco ou padrões de compensação (saga) em sistemas distribuídos.

---

## 5. Arquitetura de Componentes Frontend

### 5.1 Padrão Smart/Dumb (Container/Presentational)

- **Smart (Pages/Containers)**: gerenciam estado, fazem chamadas HTTP, orquestram
  fluxos. Poucos por feature.
- **Dumb (Presentational)**: recebem dados por propriedades de entrada, emitem
  eventos por callbacks. Sem lógica de negócio, sem chamadas HTTP.
- **Benefícios**: testabilidade (dumb é puro Input→Output), reusabilidade,
  rastreabilidade (estado centralizado no smart).

### 5.2 Detecção de Mudanças e Estado Derivado

Estratégias de detecção de mudança otimizada (ex: OnPush no Angular, React.memo,
computed signals):

- **Dados derivados devem ser recalculados em TODOS os fluxos de atualização**.
  Se uma variável derivada `X` depende de `A` e `B`, todo código que altera `A` ou
  `B` deve recalcular `X`. Falha comum: recalcular apenas em um dos fluxos e manter
  valor stale nos outros.
- **Imutabilidade como padrão**: alterar por atribuição, não por mutação. Frameworks
  otimizados comparam referências, não conteúdo profundo.

### 5.3 Ciclo de Vida de Recursos

Todo recurso alocado (subscription, listener, timer, observable) deve ser liberado
quando o componente é destruído.

Padrões aceitos (adaptar ao framework em uso):
- Cancelamento automático ao navegar (ex: switchMap cancela requisição anterior).
- Binding declarativo com auto-gerenciamento (ex: async pipe).
- Destruição explícita no hook de ciclo de vida correspondente.

Sintoma de vazamento: aplicação fica mais lenta com o uso prolongado sem refresh.

### 5.4 Tipagem Estrita

- Eliminar `any` onde uma interface existe ou pode ser criada.
- Nunca suprimir erros de tipo com cast forçado (`as any`). Se o tipo não bate,
  a interface precisa ser ajustada, não contornada.
- Tipos corretos são documentação viva: dizem o que o código espera receber e
  devolver.

### 5.5 Carregamento Sob Demanda

- Módulos/rotas carregados lazy: o bundle inicial contém apenas o necessário para
  a primeira tela.
- Imagens com lazy loading nativo.
- Listas longas com virtualização (renderizar apenas itens visíveis no viewport).

### 5.6 Gestão de Estado Compartilhado

Estado compartilhado entre múltiplos componentes exige estratégia explícita para
evitar inconsistências (estado stale, atualização parcial, race conditions).

- **Services com estado reativo** (ex: `BehaviorSubject`, `signal()`) como store
  local para domínios pequenos. Cada service gerencia um slice de estado e expõe
  dados via observables/signals — componentes se inscrevem, não armazenam cópias.
- **Bibliotecas de state management** (ex: NgRx, NGXS, Pinia, Redux) apenas quando
  o estado é suficientemente complexo para justificar o overhead: múltiplos domínios
  interdependentes, undo/redo, time-travel debugging necessário.
- **Regra prática**: se dois componentes precisam do mesmo dado atualizado em tempo
  real, a fonte de verdade é um service injetado — nunca `@Input()` em cascata ou
  variáveis globais.
- **Imutabilidade**: sempre emitir novo objeto/array em vez de mutar o existente.
  Frameworks reativos dependem de detecção por referência (ver §5.2).

---

## 6. Eficiência e Otimização

### 6.1 Requisições de Rede

- **Cancelamento de requisições obsoletas**: ao disparar nova busca, cancelar a
  anterior automaticamente (ex: switchMap, AbortController).
- **Debounce em inputs**: 400–800ms para campos de texto livre (ver também §1.2).
- **Paginação real**: nunca trazer todos os registros e paginar no frontend. Usar
  cursor/offset no backend.
- **Cache inteligente**: dados que mudam raramente (listas de referência, catálogos)
  podem ser cacheados com TTL e estratégia `stale-while-revalidate` quando
  aplicável. Dados que mudam frequentemente devem ser sempre buscados fresh.
- **Invalidação de cache**: definir estratégia explícita (event-driven, TTL,
  write-through). Cache sem invalidação planejada é fonte garantida de bugs
  intermitentes.

### 6.2 Renderização

- Estratégia de detecção de mudança otimizada em componentes puros.
- Nunca chamar funções diretamente em templates — usar propriedades pré-computadas.
- Identificador de rastreio (`trackBy`, `key`) em toda iteração de lista.

### 6.3 Bundle e Entrega

- Lazy loading de rotas/módulos.
- Imagens otimizadas (formato moderno, dimensões adequadas, carregamento lazy).
- Minificação e tree-shaking ativos no build de produção.
- Análise periódica do bundle para identificar dependências desnecessárias.

### 6.4 Backend

- Connection pooling para bancos de dados.
- Objetos pesados thread-safe como singletons.
- Evitar consultas N+1: buscar dados relacionados em batch sempre que possível.
  Ver também §4.3.
- Índices de banco adequados para as queries mais frequentes.

---

## 7. Resiliência e Tolerância a Falhas

Sistemas em produção falham. A questão não é se, mas quando. Engenharia de
qualidade antecipa falhas e limita seu impacto.

> **Nota de escala:** Os padrões desta seção escalam com a complexidade do sistema.
> Para monolitos com baixo volume e sem chamadas a serviços externos, priorizar:
> timeouts explícitos (§7.1) e retries com backoff (§7.2). Circuit breaker (§7.3),
> bulkhead (§7.4) e dead letter queues (§7.5) tornam-se relevantes quando há
> chamadas a serviços externos ou ao migrar para arquitetura orientada a serviços.

### 7.1 Timeouts Explícitos

Toda chamada a recurso externo (HTTP, banco, fila, cache) deve ter timeout
configurado explicitamente. Timeout padrão do framework frequentemente é infinito
ou inadequado.

- Definir timeouts de conexão e de leitura separadamente.
- Valores baseados em SLA do serviço chamado, não em palpite.

### 7.2 Retries com Backoff Exponencial

Falhas transitórias (timeout, 503, connection reset) justificam retry automático,
mas com disciplina:

- **Backoff exponencial com jitter**: evitar retry storm onde todos os clientes
  retentam simultaneamente.
- **Número máximo de tentativas**: configurável, tipicamente 3–5.
- **Apenas para erros transitórios**: nunca fazer retry de 400 Bad Request ou
  422 Validation Error.

### 7.3 Circuit Breaker

Quando um serviço downstream está falhando consistentemente, parar de chamá-lo
temporariamente para evitar cascata de falhas.

- Estados: fechado (normal) → aberto (bloqueando) → semi-aberto (testando
  recuperação).
- Combinável com fallback: retornar valor default, cache stale ou resposta
  degradada enquanto o circuito está aberto.

### 7.4 Bulkhead (Isolamento de Recursos)

Recursos compartilhados (thread pools, connection pools, filas) devem ser isolados
por domínio ou criticidade para evitar que uma falha em um fluxo consuma todos os
recursos do sistema.

### 7.5 Dead Letter Queues e Compensação

Mensagens que falham repetidamente em processamento assíncrono devem ser desviadas
para fila de dead letter, não descartadas silenciosamente.

- Monitorar tamanho da DLQ com alerta.
- Processos de compensação (saga pattern) para operações distribuídas que não podem
  usar transação única.

---

## 8. Estratégia de Testes

### 8.1 Princípios Fundamentais

- **Testar comportamento, não implementação**: se o código interno muda mas o
  resultado é o mesmo, o teste não deve quebrar.
- **Padrão AAA**: Arrange (preparar cenário), Act (executar ação), Assert (verificar
  resultado). Separação clara das três fases.
- **Um assert principal por teste**: facilita diagnóstico quando falha.
- **Testes rápidos por padrão**: testes unitários rodam em milissegundos. Testes
  lentos (rede, banco, I/O) vivem em suíte separada.
- **Nomenclatura descritiva**: o nome do teste deve descrever o cenário e o
  resultado esperado, eliminando necessidade de ler o código para entender o que
  falhou.

### 8.2 Pirâmide de Testes

```
      /  E2E  \        ~2% — Fluxos críticos ponta a ponta
     /----------\
    / Integração \      ~18% — Fronteiras: API, banco, serviços externos
   /--------------\
  /   Unitários    \    ~80% — Lógica isolada, transformações, validações
 /------------------\
```

- **Unitários**: funções puras, serviços com dependências mockadas, transformações
  de dados.
- **Integração**: controller + service + repositório real (ou testcontainer),
  chamadas HTTP reais a serviços mockados.
- **E2E**: fluxo completo do usuário — poucos, focados nos caminhos mais críticos
  de negócio.

### 8.3 Testabilidade como Requisito Arquitetural

Código difícil de testar é código com problemas de design:

- Injeção de dependência por construtor é pré-requisito para mocks.
- Componentes monolíticos (God Components) são impossíveis de testar de forma
  isolada — decompor antes.
- Estado global compartilhado dificulta isolamento — preferir estado local
  ou injetado.

### 8.4 Prática de Regressão

- **Bug = teste falhando**: antes de corrigir, escrever o teste que reproduz.
  O teste falha, aplica a correção, o teste passa. Garante que o bug nunca retorna.
- **Cobertura progressiva**: não buscar 100% imediatamente. Começar cobrindo as
  áreas com mais bugs ou maior risco de negócio, expandindo sprint a sprint.

### 8.5 O que NÃO testar

- Código de configuração declarativa (rotas, módulos, beans sem lógica).
- Getters/setters triviais.
- Código que será refatorado no próximo sprint — testar a versão nova.
- Framework internals (não testar se o container DI injeta corretamente).

---

## 9. Observabilidade e Operação

### 9.1 Logs, Métricas e Traces

Os três pilares da observabilidade devem estar presentes em sistemas em produção:

- **Logs**: eventos discretos com contexto (request ID, usuário, duração). Ver §2.9.
- **Métricas**: dados numéricos agregados no tempo (latência p95/p99, taxa de erro,
  throughput, uso de recursos). Ferramentas: Prometheus, CloudWatch, Datadog.
- **Traces distribuídos**: rastreamento de uma requisição ao longo de múltiplos
  serviços. Ferramentas: Jaeger, Zipkin, OpenTelemetry.

### 9.2 Health Checks e Alertas

- Todo serviço expõe endpoint de health check (`/health`, `/readiness`, `/liveness`)
  para uso por orquestradores (Kubernetes, load balancers).
- Alertas configurados para anomalias: taxa de erro acima do baseline, latência
  acima do SLA, saturação de recursos.
- A equipe não pode depender do usuário para descobrir falhas em produção.

**Alternativas de baixo custo para alerting:** Para projetos de pequeno porte,
desenvolvedores solo ou startups early-stage, serviços de mensageria como
Telegram Bots, Discord Webhooks ou Slack Webhooks oferecem canal de alerting
com setup mínimo (~10 minutos), custo zero e notificação push nativa mobile.
Não substituem métricas (sem séries temporais, sem correlação de anomalias),
mas são opções válidas para a camada de **notificação** em contextos de baixo
orçamento. A distinção entre *sistema de observabilidade* e *canal de
notificação* deve ser clara: o primeiro mede; o segundo avisa.

### 9.3 Migrações de Banco de Dados

- Alterações de schema devem ser versionadas e executadas de forma reproduzível.
  Ferramentas: Flyway, Liquibase, Alembic.
- Cada migração deve ser testável e, quando possível, reversível.
- Migrações destrutivas (drop de coluna, renomear tabela) exigem janela de
  compatibilidade: primeiro tornar o código compatível com ambos os estados;
  depois aplicar a mudança de schema; depois remover o código legado.
- Nunca executar migração manual em produção sem script versionado correspondente.

### 9.4 Backup e Recuperação de Desastres

- **Backup automatizado**: bancos de dados com backup periódico e testado.
  Backup não testado é suposição, não garantia.
- **RTO (Recovery Time Objective)**: tempo máximo aceitável para restaurar o
  serviço após falha. Define a urgência do processo de recuperação.
- **RPO (Recovery Point Objective)**: perda máxima aceitável de dados (ex: últimos
  5 minutos). Define a frequência de backup e replicação.
- **Testes de recuperação**: executar restauração de backup periodicamente em
  ambiente controlado. A equipe deve praticar o processo antes de precisar dele.
- **Runbooks**: procedimentos documentados de recuperação para cenários conhecidos
  (falha de banco, corrupção de dados, queda de serviço).

### 9.5 Persistência Alternativa para Sistemas de Baixo Volume

Nem todo sistema precisa de banco de dados relacional. Existe um espectro de
opções de persistência adequadas ao perfil de cada sistema:

```
arquivo local → API de storage (GitHub, S3) → KV store (Redis, Cloudflare KV) → banco relacional
```

Para sistemas serverless de baixo volume (dezenas a centenas de operações/dia),
alternativas como GitHub API como storage (versionamento automático via commits,
autenticação reutilizada, custo zero) ou KV stores são opções legítimas quando:

- Volume de escrita < 100 operações/hora
- Não há necessidade de queries relacionais complexas
- Custo de infraestrutura é restrição real
- Auditabilidade (histórico de commits) é mais valiosa que performance

A escolha deve ser documentada como decisão arquitetural (§11.2), não como
atalho implícito.

---

## 10. Pipeline de Entrega (CI/CD)

### 10.1 Integração Contínua

- Todo commit na branch principal dispara pipeline automatizado.
- O pipeline inclui, na ordem: lint → build → testes unitários → testes de
  integração → análise estática → análise de segurança (SAST/SCA) → build de
  imagem/artefato.
- Build quebrado bloqueia merge. Ninguém passa por cima de build vermelho.

### 10.2 Proteção de Branch e Gates de Qualidade

- Branch principal protegida: não aceita push direto.
- Pull requests exigem: aprovação de ao menos um revisor + pipeline verde.
- Gates automáticos podem incluir: cobertura mínima de testes, ausência de
  vulnerabilidades conhecidas, limites de complexidade ciclomática.

### 10.3 Entrega Contínua

- Artefato gerado pelo CI é o mesmo promovido para produção — nunca rebuild manual.
- Ambientes de staging e produção recebem o mesmo artefato, com configurações
  diferentes via variáveis de ambiente.
- Estratégias de deploy seguro: blue/green, canary, feature flags para controle
  de exposição progressiva.

### 10.4 Estratégia de Branches e Conventional Commits

O código organizado exige disciplina de branches e mensagens de commit. Sem
convenção, o histórico vira ruído e a rastreabilidade desaparece.

- **Branch principal protegida**: `main` (ou `master`) não aceita push direto.
  Feature branches com prefixo de tipo: `feat/`, `fix/`, `docs/`, `refactor/`,
  `test/`, `chore/`.
- **Branches de agentes IA**: `copilot/` como prefixo — permite rastrear e filtrar
  contribuições automáticas versus humanas.
- **Conventional Commits**: mensagens no formato `tipo(escopo): descrição curta`.
  Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `chore`.
  Exemplo: `feat(transaction): add CSV duplicate detection by hash`.
- **Benefícios**: changelog automatizado, rastreabilidade commit → issue → sprint,
  revisão facilitada por tipo de mudança.
- **Squash merge em PRs**: cada feature = um commit limpo no histórico principal.
  O PR preserva a história granular, o main preserva a narrativa de entregas.

---

## 11. Qualidade e Manutenibilidade

### 11.1 Dívida Técnica Consciente

Dívida técnica é aceitável quando:
- É **consciente**: a equipe sabe que existe e registrou em backlog.
- É **delimitada**: afeta escopo restrito, não contamina novas features.
- Tem **plano de pagamento**: sprint ou milestone prevista para resolução.

Dívida técnica é inaceitável quando:
- É invisível (ninguém sabe que existe).
- Cresce silenciosamente (cada feature nova adiciona mais dívida no mesmo ponto).
- Bloqueia testes, deploys ou onboarding.

### 11.2 Documentação como Código

- **Decisões arquiteturais**: registrar o "por quê", não apenas o "como".
  O padrão estabelecido é o **ADR (Architecture Decision Record)**: documento curto
  que descreve contexto, decisão tomada, alternativas consideradas e consequências.
  ADRs são **imutáveis** — uma decisão superada gera um novo ADR que referencia o
  anterior, nunca edita o original.
  Decisões sem registro são dívida de conhecimento.
- **Documentação próxima do código**: em arquivos versionados, não em Wikis
  desconectadas. Se o código muda, o doc acompanha no mesmo commit.
- **Evitar duplicação**: uma informação em um único lugar. Se precisa aparecer em
  dois contextos, um deles deve ser referência (link), não cópia.
- **Comentários em funções-chave**: funções públicas de services, controllers,
  utilitários e módulos de regra de negócio devem ter comentário ou docstring que
  descreva: o que a função faz, parâmetros relevantes, valor de retorno e efeitos
  colaterais (se houver). Comentários explicam o "por quê" — o código já explica
  o "como". Evitar comentários óbvios que repetem o que o código já diz; priorizar
  contexto de negócio, restrições não evidentes e decisões de design.

**Espectro de formatos por contexto:**

| Contexto | Formato recomendado |
|----------|---------------------|
| Time > 3 pessoas, sistema de longa vida | ADR clássico (imutável) |
| Solo ou dupla, produto em validação | DECISIONS.md operacional (mutável, foco no estado presente) |
| Projeto com IA como co-piloto | DECISIONS.md + session briefs (§A.3) |

A escolha não é entre "ADR ou nada" — é entre ADR formal e uma alternativa
adequada ao contexto. DECISIONS.md operacional captura "o que foi decidido" e
"o que foi descartado e por quê", com foco no estado presente. O trade-off é
explícito: perde rastreabilidade histórica, ganha clareza do estado atual.

### 11.3 Revisão e Checklist

Antes de cada entrega:

**Bloqueantes (não seguir sem resolver):**
- [ ] Sem credenciais ou dados sensíveis no código
- [ ] Sem outputs de debug em código de produção
- [ ] Queries parametrizadas (sem concatenação SQL)
- [ ] HTML dinâmico sanitizado
- [ ] Tipos corretos (sem `any` onde interface existe)
- [ ] Recursos (subscriptions, timers) liberados no destroy
- [ ] Headers de segurança HTTP configurados
- [ ] Variáveis de ambiente obrigatórias validadas na inicialização
- [ ] Timeouts explícitos em chamadas externas
- [ ] Uploads validados por tipo real (magic bytes), não apenas extensão

**Avisos (resolver quando possível):**
- [ ] Injeção por construtor
- [ ] URLs e configs externalizadas
- [ ] Novo comportamento coberto por teste
- [ ] Nomes descritivos e consistentes
- [ ] Migração de banco versionada (se aplicável)
- [ ] Health check disponível (se aplicável)
- [ ] Endpoints idempotentes onde aplicável
- [ ] Acessibilidade verificada (semântica, contraste, teclado)
- [ ] Exportações sanitizadas contra injeção de fórmulas (se aplicável)

### 11.4 Padrão de Documentação Técnica: PCS

Para documentar mudanças técnicas, seguir o modelo **Problema > Causa > Solução**:

- **Problema**: descrever o comportamento incorreto do ponto de vista do usuário.
  Como reproduzir.
- **Causa Raiz**: por que existe no código. Qual fluxo técnico leva ao problema.
- **Solução**: ação precisa aplicada + por que ela funciona. Com referência ao
  conceito (pattern, princípio) que fundamenta a correção.

---

## 12. Referências Conceituais

| Conceito | Aplicação | Referência |
|----------|-----------|------------|
| SOLID | Cada classe/componente com uma responsabilidade; dependências invertidas | Robert C. Martin, *Clean Architecture* |
| 12-Factor App | Configuração por ambiente, logs como stream, dependências explícitas | [12factor.net](https://12factor.net) |
| OWASP Top 10 | Sanitização, parametrização, autenticação, logging seguro, CSRF, headers | [owasp.org/Top10](https://owasp.org/www-project-top-ten/) |
| Pirâmide de Testes | Muitos unitários, poucos E2E | Martin Fowler, *TestPyramid* |
| Pirâmide Invertida (Jornalismo) | Contexto geral antes de detalhe específico em UIs | — |
| Lei de Fitts | Alvos de clique dimensionados proporcionalmente à frequência de uso | — |
| Clean Architecture | Fluxo de dependência de fora para dentro (UI → Serviço → Domínio) | Robert C. Martin, *Clean Architecture* |
| DRY (Don't Repeat Yourself) | Com cautela — regra de três antes de abstrair | Andy Hunt & Dave Thomas, *The Pragmatic Programmer* |
| YAGNI | Implementar só o que é necessário agora | — |
| KISS | A solução mais simples que funciona é a melhor | — |
| ADR | Registro de decisões arquiteturais com contexto e alternativas | Michael Nygard, [cognitect.com/blog](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) |
| OpenTelemetry | Padrão aberto para instrumentação de logs, métricas e traces | [opentelemetry.io](https://opentelemetry.io) |
| SemVer | Versionamento de APIs e bibliotecas com contrato claro de compatibilidade | [semver.org](https://semver.org) |
| WCAG | Diretrizes de acessibilidade para conteúdo web | [w3.org/WAI/WCAG21](https://www.w3.org/WAI/WCAG21/quickref/) |
| RFC 8594 | Headers Deprecation e Sunset para ciclo de vida de APIs | [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc8594) |
| Resilience Patterns | Circuit breaker, bulkhead, retry, timeout | Michael Nygard, *Release It!* |
| Defense in Depth | Cada camada independentemente segura; se uma falha, a próxima protege | — |

---

## Apêndice A — Protocolo de Documentação Assistida por IA

> Este apêndice orienta assistentes de IA (Copilot, Claude, etc.) sobre como conduzir
> a estruturação documental de um projeto após leitura deste guia de princípios.
> O objetivo é gerar documentação técnica viva, versionada e acionável — não artefatos
> burocráticos que ninguém consulta.

### A.1 Fluxo de Onboarding Documental

Após ler este arquivo (`principios-engenharia.md`) junto com quaisquer instruções
específicas do projeto (ex: `copilot-instructions.md`), a IA deve conduzir o
seguinte fluxo de perguntas com o usuário, **na ordem apresentada**:

---

**Etapa 1 — Diretrizes Técnicas do Projeto**

> *"Com base nos princípios de engenharia e no que conheço do projeto até aqui,
> posso gerar um arquivo de **diretrizes técnicas** (`diretrizes-tecnicas.md`)
> que combina os princípios gerais com as decisões, padrões e convenções já
> aplicadas neste sistema específico — incluindo stack, frameworks, padrões de
> código, checklist pre-commit e referências a campos/componentes do projeto.
> Deseja que eu crie este documento?"*

**O que o documento deve conter:**
- Princípios gerais **aplicados ao contexto** do projeto (não cópia — referência
  ao `principios-engenharia.md` + detalhamento específico).
- Decisões técnicas já tomadas e o "por quê" de cada uma.
- Padrões de código com exemplos concretos do projeto (errado/correto).
- Checklist pre-commit com itens específicos da stack e do projeto.
- Estratégia de testes contextualizada (prioridades, frameworks, metas).
- Referência rápida a campos, índices, endpoints ou estruturas relevantes.

**Princípio:** As diretrizes técnicas **referenciam** os princípios gerais e
adicionam o que é específico. Nunca duplicam conteúdo do documento base.

---

**Etapa 2 — Análise Estrutural**

> *"Posso varrer o código do projeto e gerar um arquivo de **análise estrutural**
> (`analise-estrutural.md`) que mapeia o estado técnico atual: correções já
> aplicadas, pendências classificadas por severidade (crítico, importante, menor),
> decisões registradas e itens fora de escopo. Este documento funciona como
> 'radiografia' viva do projeto. Deseja que eu crie?"*

**O que o documento deve conter:**
- **Correções já aplicadas**: tabela com número, descrição, arquivo e data.
- **Pendências técnicas por severidade**:
  - 🔴 **Crítico** — impacta comportamento em produção.
  - 🟠 **Importante** — qualidade, manutenibilidade e risco de bugs.
  - 🟡 **Menor** — padronização e limpeza.
- Cada pendência com: identificador, arquivo(s), descrição do problema e ação
  sugerida. Formato **PCS** (Problema > Causa > Solução) quando aplicável.
- **Resumo de contagem** por nível e status.
- **Análise de segurança** (resumo de vulnerabilidades se aplicável).
- **Itens fora de escopo**: o que não corrigir sem alinhamento prévio.

**Princípio:** Documento atualizado a cada sessão. Pendências resolvidas são
marcadas como ✅ com data, não deletadas.

---

**Etapa 3 — Mapa Arquitetural**

> *"Posso gerar um arquivo de **arquitetura** (`architecture.md`) que documenta
> o mapa estrutural do projeto: camadas, componentes, fluxos de dados,
> integrações externas e decisões de infraestrutura. Este documento permite
> que qualquer pessoa (ou IA) entenda a estrutura do sistema sem ler código.
> Deseja que eu crie?"*

**O que o documento deve conter:**
- **Visão geral**: diagrama ASCII das camadas e suas conexões.
- **Camadas do backend**: controllers, services, repositories, DTOs, configs
  — com tabelas descrevendo cada elemento e sua responsabilidade.
- **Camadas do frontend**: pages (smart), components (dumb), services, models.
- **Fluxos de dados**: narrativa passo a passo dos fluxos principais
  (ex: "1. Usuário digita → 2. Component monta request → 3. Service envia...").
- **Integrações externas**: protocolos, endpoints consumidos, configurações.
- **Mapeamento de dados**: campos, tipos, analyzers (se aplicável).
- **Build e deploy**: como o projeto é construído e entregue.

**Princípio:** O documento descreve **o que existe**, não o que deveria existir.
Capacidades não implementadas podem ser listadas como backlog ao final.

---

**Etapa 4 — Lições Aprendidas**

> *"Por fim, posso criar um arquivo de **lições aprendidas** (`lessons-learned.md`)
> onde registramos erros, descobertas e decisões importantes de cada sessão de
> desenvolvimento. Cada entrada segue o formato Contexto > Problema > Regra,
> servindo como base para evitar que erros se repitam. Deseja que eu crie?"*

**O que o documento deve conter:**
- Formato por entrada:
  ```
  ### [DATA] Título curto
  **Contexto:** o que estava sendo feito
  **Problema:** o que deu errado ou o que descobrimos
  **Regra:** o que fazer/evitar no futuro
  ```
- Alimentado manualmente ou com assistência da IA após cada sessão.
- À medida que cresce, agrupar por categoria (UX, Segurança, Backend, Frontend,
  Infraestrutura) para facilitar consulta.

**Princípio:** Cada entrada é autocontida e referenciável. O arquivo substitui
a memória de contexto perdida entre sessões.

---

### A.2 Estrutura de Pastas Recomendada

> **Nota:** A estrutura abaixo é um template organizacional genérico. Adapte os nomes
> e a granularidade ao contexto do projeto. O que importa é que os arquivos estejam
> versionados e próximos do código. Se `docs/` já vive na raiz do repositório, mantenha.
> Projetos maiores podem subdividir por tema (ex: `docs/seguranca/`, `docs/processo/`).

```
docs/
├── principios-engenharia.md     ← Este arquivo (princípios gerais — independente de projeto)
│
│   # Documentos estruturais (Etapas 1–4 do §A.1)
├── diretrizes-tecnicas.md       ← Padrões e convenções da stack do projeto
├── analise-estrutural.md        ← Estado técnico vivo (pendências, correções)
├── architecture.md              ← Mapa estrutural (camadas, entidades, fluxos)
├── lessons-learned.md           ← Erros e descobertas por sessão (complemento gerencial)
├── HISTORICO.md                 ← Continuidade entre sessões (estado operacional — §A.3)
│
│   # Documentos de domínio (variam conforme o escopo do projeto)
├── REQUISITOS.md                ← SRS — requisitos funcionais e não funcionais
├── TECNOLOGIAS.md               ← Guia educacional das tecnologias escolhidas
├── PLANO_TESTES.md              ← Estratégia e casos de teste
├── MELHORIAS.md                 ← Backlog estratégico de funcionalidades futuras
├── COMO_USAR.md                 ← Guia prático de setup e uso do sistema
│
│   # Documentos de processo (adaptar à metodologia adotada)
├── SCRUM.md                     ← Processo, cerimônias, labels, story points
├── INDICE.md                    ← Índice mestre com rotas de leitura por perfil
│
│   # Registros de decisão
└── adr/                         ← Architecture Decision Records (§11.2)
    ├── 001-titulo-da-decisao.md
    └── ...
```

**Princípios desta estrutura:**
- **Separação por tema**: evitar arquivos muito grandes e generalistas. Se um
  documento ultrapassa ~500 linhas ou mistura temas distintos (ex: requisitos +
  processo + tecnologia), considerar subdividir.
- **Hierarquia clara**: documentos estruturais (os 5 do §A.1) são a base;
  documentos de domínio e processo se apoiam neles e os referenciam.
- **Índice como hub de navegação**: um documento centraliza links e rotas de
  leitura por perfil, evitando que novos colaboradores precisem adivinhar por
  onde começar.
- **Nenhum documento existe isolado**: cada arquivo deve ter referência clara
  ao princípio ou diretriz que justifica sua existência.

### A.3 Continuidade de Sessão (Session Briefs)

A IA não tem estado persistente entre sessões. Quando uma nova sessão de
assistente de IA é iniciada, o agente começa do zero — lê o código, lê os
docs, reconstrói o contexto. Isso é lento, caro (tokens) e impreciso.

**Padrão de session briefs:**

> Ao final de cada sessão de trabalho significativa, o agente deve escrever
> um arquivo de handoff contendo: o que estava em andamento, o que foi
> concluído, decisões tomadas, próximos passos identificados e bloqueios
> ativos. Este arquivo é lido automaticamente no início da próxima sessão,
> eliminando a necessidade de reconstrução completa de contexto.

**Implementação neste projeto:** [`HISTORICO.md`](HISTORICO.md) — arquivo de
continuidade obrigatória que materializa este padrão. Contém:
- **Estado Atual** — fase do projeto, itens em andamento, bloqueios
- **Próximos Passos** — o que a próxima sessão deve priorizar
- **Histórico de Entregas** — registro cronológico reverso de cada sessão

Formato de cada entrada no histórico:
```
### [AAAA-MM-DD] Título curto da sessão
**Responsável:** Nome ou agente
**Entregas:** O que foi concluído
**Decisões:** Decisões técnicas ou de produto tomadas
**Próximos passos:** O que a próxima sessão deve fazer
**Bloqueios:** Impedimentos identificados (ou "Nenhum")
```

**Relação com `lessons-learned.md`:**
- `HISTORICO.md` = **estado operacional** (o que está acontecendo agora, handoff entre sessões)
- `lessons-learned.md` = **complemento gerencial** (regras duradouras extraídas de erros passados)

Ambos são obrigatórios. O HISTORICO responde "onde estamos?"; o lessons-learned
responde "o que aprendemos?".

É o equivalente ao "handoff" que profissionais de saúde fazem na troca de
turno: estado atual do paciente, o que foi feito, o que precisa de atenção
imediata.

### A.4 Regras de Manutenção

- **`principios-engenharia.md`** é organizacional — muda raramente, por decisão
  da equipe. Não é alterado por sessão de desenvolvimento.
- **`diretrizes-tecnicas.md`** muda quando novas decisões técnicas são tomadas
  no projeto.
- **`analise-estrutural.md`** é atualizado a cada sessão — pendências resolvidas
  ganham ✅, novas pendências são adicionadas.
- **`architecture.md`** muda quando há mudanças estruturais (novos módulos,
  refatorações de pacote, novas integrações).
- **`lessons-learned.md`** é alimentado após cada sessão significativa —
  complemento gerencial com regras duradouras.
- **`HISTORICO.md`** é atualizado ao **início e final** de cada sessão —
  arquivo operacional de continuidade (§A.3). Consulta obrigatória.

### A.5 Comportamento Esperado da IA

Ao ser apresentada a estes documentos em conjunto com o código de um projeto:

1. **Consultar `HISTORICO.md` primeiro** (ação obrigatória) — ler o estado atual,
   bloqueios e próximos passos da última sessão. Isso garante continuidade e
   evita retrabalho. Sem esta consulta, a sessão perde o contexto acumulado.
2. **Ler na ordem de abstração**: princípios gerais → instruções do projeto →
   requisitos → diretrizes técnicas → mapa arquitetural → análise estrutural →
   lições aprendidas → backlog de melhorias → plano de testes.
3. **Verificar pendências** na análise estrutural antes de sugerir mudanças
   — evitar re-introduzir problemas já identificados.
4. **Consultar lições aprendidas** antes de aplicar padrões — evitar repetir
   erros já documentados.
5. **Referenciar seções dos princípios** ao justificar decisões técnicas
   (ex: "Conforme §2.3 — sanitização de entrada...").
6. **Sugerir atualização** dos documentos quando uma sessão produzir correções,
   decisões ou lições relevantes.
7. **Nunca duplicar** conteúdo entre documentos — referenciar via caminho
   relativo ou número de seção.
8. **Consultar agentes especializados** se o repositório possui agentes Copilot
   ou assistentes configurados — delegar tarefas ao agente correto para o domínio.
9. **Manter comentários em funções-chave** conforme §11.2 — documentar regras
   de negócio, restrições e decisões de design diretamente no código-fonte.
10. **Atualizar `HISTORICO.md` ao final** (ação obrigatória) — registrar entregas,
    decisões, próximos passos e bloqueios. A próxima sessão depende deste registro.

---

## Apêndice B — Onboarding de Colaborador Humano

> O Apêndice A orienta a IA. Este apêndice orienta **pessoas** que chegam a um
> projeto e precisam entender o sistema, contribuir e tomar decisões informadas.

### B.1 Roteiro de Leitura por Perfil

A documentação de um projeto deve ser navegável por perfil. Cada perfil tem uma
rota de leitura que prioriza os documentos mais relevantes para sua atuação:

**🟢 Novo no projeto (qualquer perfil):**
1. README do projeto — visão geral, arquitetura e funcionalidades
2. Índice da documentação — navegação e rota específica do seu perfil
3. Requisitos — o que o sistema faz (requisitos funcionais e não funcionais)

**🔧 Desenvolvedor Backend:**
4. Guia de setup — como configurar e rodar o ambiente de desenvolvimento
5. Diretrizes técnicas — convenções de código, checklist pre-commit
6. Mapa arquitetural — entidades, services, endpoints, fluxos de dados
7. Lições aprendidas — erros passados que não devem se repetir
8. Análise estrutural — pendências técnicas e prioridades

**🎨 Desenvolvedor Frontend:**
4. Guia de setup — como configurar e rodar o ambiente
5. Diretrizes técnicas (seção de frontend) — padrões de componentes, estado, UX
6. Mapa arquitetural (seção de frontend) — estrutura de componentes, rotas
7. Tecnologias — frameworks, bibliotecas e decisões de design do frontend

**📋 Product Owner / Gestor:**
4. Backlog de melhorias — sugestões priorizadas e estratégia de produto
5. Processo — metodologia, sprints, cerimônias, Definition of Done
6. Guia de evolução — plano de melhorias por dimensão

**🧪 QA / Tester:**
4. Plano de testes — pirâmide, casos, cobertura alvo, ferramentas
5. Guia de uso — como usar cada funcionalidade (para testar)
6. Análise estrutural — débitos técnicos que impactam qualidade

**🔒 Revisão de Segurança:**
4. Este documento §2 — princípios de segurança (OWASP, autenticação, sanitização)
5. Diretrizes técnicas (seção de segurança) — implementação específica do projeto
6. Análise estrutural (seção de segurança) — checklist de itens implementados / pendentes

> **Nota:** O roteiro acima é um template. Cada projeto deve criar seu próprio
> `INDICE.md` com links diretos para os documentos e seções relevantes de cada perfil.

### B.2 Documentos como Material de Estudo

Quando bem escritos, os documentos de um projeto transcendem o contexto específico
e servem como material educacional. Exemplos de valor educacional por tipo de
documento:

| Tipo de Documento | Conceitos que ensina |
|-------------------|---------------------|
| Princípios de engenharia | SOLID, 12-Factor, OWASP, Clean Architecture, Resiliência |
| Tecnologias | Stack escolhida, ORM, autenticação, design patterns |
| Lições aprendidas | Debugging real, decisões arquiteturais, armadilhas comuns |
| Plano de testes | Pirâmide de testes, caixa branca vs preta, cobertura |
| Processo (SCRUM/Kanban) | Metodologia ágil, cerimônias, métricas de progresso |
| Backlog de melhorias | Estratégia de produto, priorização, roadmap |
| Análise estrutural | Gestão de dívida técnica, classificação por severidade |

### B.3 Princípio do Onboarding

O objetivo não é apenas seguir instruções da IA ou executar tarefas mecanicamente.
Cada documento de um projeto bem documentado explica o **"por quê"** além do
**"como"**. Um colaborador que entende os princípios toma decisões melhores,
questiona sugestões automatizadas e direciona análises com clareza.

> *"Não adianta somente seguir o que a IA traz, mas é preciso também entender para
> direcionar decisões e análises de forma clara e direta."*
