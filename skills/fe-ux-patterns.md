---
name: fe-ux-patterns
description: >
  Guia operacional de UX para traduzir os princípios de principios-engenharia.md em decisões
  concretas de implementação. Usar ao criar ou revisar qualquer componente de interface —
  hierarquia visual, cores, estados de carregamento, formulários e feedback ao usuário.
---

# Skill: Padrões de UX e Design de Interface

## O que é esta skill

Guia operacional de UX para traduzir os princípios de §1 do `principios-engenharia.md`
em decisões concretas de implementação. Use ao criar ou revisar qualquer componente
de interface — não apenas para "fazer bonito", mas para garantir comunicação eficiente
e leve para o usuário.

> **Princípio central:** Interface boa não é a que tem mais elementos — é a que
> exige o menor esforço cognitivo para o usuário atingir seu objetivo.

---

## 1. Hierarquia visual — o que o olho deve ver primeiro

Toda tela tem uma hierarquia de importância. O layout deve refletir ela.

```
Nível 1 — O que o usuário precisa saber imediatamente (KPIs, status, alertas)
Nível 2 — O que o usuário provavelmente vai querer fazer (ação principal)
Nível 3 — Detalhes e contexto secundário (tabelas, filtros, metadados)
Nível 4 — Controles avançados e configurações (raramente usados)
```

**Regras práticas:**
- Nunca mais de 2 elementos de destaque (`font-weight: bold`, cor de ênfase) por bloco
- Ação primária: um botão por tela/seção. Ação secundária: visualmente menor
- Informação crítica (alerta, saldo negativo, erro) nunca competindo com decoração
- Títulos de seção: curtos (1-3 palavras), descritivos, não genéricos ("Dados" é ruim; "Gastos de março" é bom)

---

## 2. Cores — semântica, não decoração

Cores comunicam estado. Usadas aleatoriamente, destroem a comunicação.

| Cor | Uso semântico | Quando NÃO usar |
|-----|--------------|-----------------|
| Verde (`#22c55e`) | Sucesso, saldo positivo, meta atingida | Destaque decorativo |
| Amarelo/Laranja (`#f59e0b`) | Atenção, limiar se aproximando | Informações neutras |
| Vermelho (`#ef4444`) | Erro, déficit, crítico | Qualquer coisa que não seja urgente |
| Azul (`#3b82f6`) | Informação neutra, links, ações primárias | Status financeiro/negócio |
| Roxo/Indigo (`#8b5cf6`) | Destaque de KPI, métricas de BI | Ações ou alertas |
| Cinza | Textos secundários, bordas, desabilitado | Informação importante |

**Regras:**
- Nunca usar cor como único diferenciador — sempre acompanhar com ícone, rótulo ou padrão
- Fundos coloridos exigem texto da mesma família de cor (tom escuro para fundo claro)
- Máximo de 3 cores semânticas por tela. Mais que isso = ruído

---

## 3. Tipografia — legibilidade antes de estilo

```css
/* Hierarquia tipográfica mínima */
--text-xs:   12px;  /* metadados, labels de formulário, datas secundárias */
--text-sm:   14px;  /* corpo de tabela, subtítulos de card */
--text-base: 16px;  /* corpo de texto padrão */
--text-lg:   18px;  /* títulos de seção */
--text-xl:   22px;  /* títulos de página, KPIs de destaque */
--text-2xl:  28px;  /* valor principal (ex: total do mês) */

/* Pesos: apenas dois */
font-weight: 400;   /* corpo, labels, descrições */
font-weight: 500;   /* títulos, valores de destaque, rótulos ativos */
/* 600+ → excesso de ênfase, torna tudo pesado */
```

**Contraste mínimo WCAG AA:**
- Texto normal (< 18px): ratio 4.5:1
- Texto grande (≥ 18px ou bold ≥ 14px): ratio 3:1
- Ícones e componentes UI: ratio 3:1

---

## 4. Espaçamento — respiração entre elementos

```css
/* Sistema de espaçamento em múltiplos de 4 */
--space-1:  4px;   /* espaço mínimo entre elementos relacionados */
--space-2:  8px;   /* padding interno pequeno, gap de ícone+texto */
--space-3: 12px;   /* padding de badge, espaço entre label e input */
--space-4: 16px;   /* padding padrão de card, gap entre colunas */
--space-6: 24px;   /* separação entre seções dentro de um card */
--space-8: 32px;   /* separação entre cards/blocos */
--space-12: 48px;  /* separação entre seções da página */
```

**Regra de Gestalt (proximidade):** elementos relacionados ficam próximos. Grupos
distintos têm espaço maior entre si. Se dois itens são conceitualmente diferentes,
o espaço entre eles deve ser visivelmente maior do que o espaço entre itens do mesmo grupo.

---

## 5. Cards e listagens

```
Card mínimo:
┌─────────────────────────────────┐
│ [Ícone] Título           Status │  ← linha de identificação
│ Valor principal                 │  ← informação mais importante
│ Metadado 1  •  Metadado 2      │  ← contexto secundário
└─────────────────────────────────┘

Regras:
- Primeiro elemento = identifica O QUÊ (nome, categoria, título)
- Segundo = O VALOR mais relevante para a decisão
- Terceiro+ = contexto (data, origem, subcategoria)
- Ações (editar, excluir) = aparecem em hover ou menu, nunca ocupando espaço fixo
```

**Anti-patterns de card:**
- ❌ Colocar ID técnico como primeiro elemento
- ❌ Mostrar todos os campos de um objeto — filtrar o que importa para o contexto
- ❌ Ações destrutivas sem separação visual das ações primárias

---

## 6. Formulários

```
Ordem de campos: do mais geral para o mais específico
Exemplo: Categoria → Subcategoria → Descrição → Valor → Data

Validação:
- NÃO validar no onBlur de cada campo (interrompe o fluxo)
- Validar no submit (mostra todos os erros de uma vez)
- Exceção: campos com regras imediatas (CPF, e-mail — validar no blur)

Mensagens de erro:
- Próximas ao campo, não no topo do formulário
- Descritivas: "Valor deve ser maior que zero" (não "Campo inválido")
- Cor + ícone + texto: nunca só cor

Labels:
- Sempre visíveis (não usar placeholder como substituto de label)
- Placeholder = exemplo do formato esperado, não o nome do campo
```

---

## 7. Estados de carregamento

| Duração | Padrão recomendado |
|---------|-------------------|
| < 100ms | Nenhum indicador necessário |
| 100–300ms | Desabilitar o botão que disparou a ação |
| 300ms–2s | Skeleton screen (para listas/cards) ou spinner (para ações) |
| > 2s | Skeleton + mensagem de contexto ("Carregando transações...") |
| Indeterminado | Barra de progresso indeterminada + opção de cancelar |

**Skeleton screens > spinners para conteúdo:**
- Skeleton reduz o "choque" de layout ao carregar os dados reais
- Spinner não dá pista do que vai aparecer — aumenta ansiedade percebida

---

## 8. Estado vazio

Todo componente que lista dados deve ter um estado vazio **informativo e acionável**:

```
❌ Ruim:  "Nenhum resultado encontrado."

✅ Bom:
   [ícone temático]
   Nenhuma transação em março
   Importe seu extrato ou adicione um lançamento manualmente.
   [Importar CSV]  [Adicionar manualmente]
```

**Regras do estado vazio:**
- Explica POR QUÊ está vazio (sem dados, filtro ativo, período sem movimento)
- Oferece a ação que resolve o vazio (quando existir)
- Tom: neutro ou leve — não alarmista

---

## 9. Toasts e feedback de ação

```
Posição: canto inferior direito (padrão desktop) ou topo centralizado (mobile)
Duração: 3–5 segundos para sucesso; persistente para erro até o usuário fechar

Tipos:
✅ Sucesso  — verde, fechamento automático, mensagem confirmando o que foi feito
⚠️ Aviso    — amarelo, fechamento automático ou manual
❌ Erro     — vermelho, persistente, com link para detalhes se aplicável
ℹ️ Info     — neutro, fechamento automático

Conteúdo do toast:
- Passado: "Transação salva." / "3 itens importados."  (não "Sucesso!")
- Específico: "Fatura de março excluída." (não "Item excluído.")
- Acionável quando possível: "Transação salva. [Desfazer]"
```

---

## 10. Responsividade — breakpoints

```css
/* Mobile first — escrever base para mobile, sobrescrever para telas maiores */
/* sm */ @media (min-width: 640px)  { /* tablet pequeno */ }
/* md */ @media (min-width: 768px)  { /* tablet */ }
/* lg */ @media (min-width: 1024px) { /* desktop */ }
/* xl */ @media (min-width: 1280px) { /* desktop largo */ }

Comportamentos por breakpoint:
- Mobile (< 768px):
  → Navegação: menu hambúrguer ou barra inferior
  → Tabelas: scroll horizontal ou cards empilhados
  → Gráficos: altura reduzida, sem legenda lateral
  → Formulários: campos em coluna única

- Tablet (768px–1024px):
  → Sidebar colapsável
  → Grid de 2 colunas

- Desktop (≥ 1024px):
  → Sidebar fixa
  → Grid de 3-4 colunas
  → Tabelas completas
```

---

## 11. Densidade de informação por tipo de tela

| Tipo de tela | Densidade | Justificativa |
|---|---|---|
| Dashboard / painel de KPIs | Alta | Usuário experiente quer visão geral rápida |
| Lista / histórico | Média | Varredura + ação pontual |
| Formulário | Baixa | Foco e precisão são prioritários |
| Tela de confirmação | Mínima | Reduzir fricção cognitiva antes de ação irreversível |
| Configurações | Média | Raramente acessada; detalhamento é bem-vindo |

---

## 12. Checklist de revisão UX (pré-entrega)

**Comunicação:**
- [ ] A informação mais importante está visualmente em destaque?
- [ ] Cores têm significado semântico (não apenas decorativo)?
- [ ] Mensagens de erro são descritivas e próximas ao ponto de falha?
- [ ] Toasts confirmam o que foi feito (não apenas "sucesso")?

**Eficiência:**
- [ ] Ação principal executável em ≤ 2 cliques?
- [ ] Campos do formulário em ordem lógica (geral → específico)?
- [ ] Existe estado vazio informativo para listas?
- [ ] Loading states presentes para operações > 300ms?

**Consistência:**
- [ ] Componentes equivalentes têm mesmo comportamento em todas as telas?
- [ ] Ações destrutivas têm confirmação explícita?
- [ ] Hierarquia tipográfica consistente com o restante do sistema?

**Leveza:**
- [ ] Tela tem ≤ 3 pontos de foco visual?
- [ ] Ausência de informação que o usuário não precisa neste contexto?
- [ ] Nenhuma redundância de rótulo + ícone quando um dos dois é suficiente?

---

*Skill — `.github/skills/fe-ux-patterns.md`*
*Referência: `principios-engenharia.md` §1 (UX), §1.5 (Acessibilidade)*
