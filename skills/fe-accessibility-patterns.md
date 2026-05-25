---
name: fe-accessibility-patterns
description: >
  Padrões concretos de acessibilidade WCAG 2.1 AA para interfaces web — HTML semântico,
  atributos ARIA, navegação por teclado e contraste de cores. Usar ao implementar qualquer
  componente interativo, formulário, modal ou tabela.
---

# Skill: Padrões de Acessibilidade (a11y)

## O que é esta skill

Implementação operacional de §1.5 do `principios-engenharia.md`. Define padrões
concretos de acessibilidade para componentes de interface — o que usar, quando usar
e como testar. Use ao implementar qualquer componente interativo, formulário, modal
ou tabela.

> **Princípio:** Acessibilidade não é feature — é qualidade base. Um componente
> inacessível tem bug, independente de ele "funcionar" visualmente.

---

## 1. HTML semântico — a base de tudo

```html
<!-- ❌ Errado: div com role — requer trabalho manual desnecessário -->
<div role="button" onclick="..." tabindex="0">Salvar</div>

<!-- ✅ Correto: elemento nativo carrega comportamento acessível por padrão -->
<button type="button" onclick="...">Salvar</button>

<!-- Elementos nativos e seus benefícios automáticos -->
<button>    → focusável, Enter/Space ativa, role=button para screen readers
<a href>    → focusável, Enter ativa, role=link
<input>     → label associável, aria-required, aria-invalid
<select>    → keyboard navigation nativo
<table>     → thead/tbody/th comunicam estrutura para screen readers
<nav>       → landmark de navegação
<main>      → landmark de conteúdo principal
<aside>     → landmark de conteúdo secundário
<header>    → landmark de cabeçalho
<footer>    → landmark de rodapé
```

---

## 2. Labels e associações

```html
<!-- Sempre associar label ao input -->

<!-- ✅ Opção 1: for + id -->
<label for="amount">Valor</label>
<input id="amount" type="number" />

<!-- ✅ Opção 2: label envolvendo input -->
<label>
  Valor
  <input type="number" />
</label>

<!-- ✅ Opção 3: aria-label (quando label visível não é possível) -->
<input type="search" aria-label="Buscar transações" />

<!-- ❌ Nunca: placeholder como substituto de label -->
<input type="text" placeholder="Descrição" />
<!-- Problema: desaparece ao digitar, baixo contraste, não lido por alguns SRs -->

<!-- Campos obrigatórios -->
<input required aria-required="true" />
<label>Valor <span aria-hidden="true">*</span></label>
<!-- aria-hidden no asterisco evita leitura literal pelo screen reader -->

<!-- Campos com erro -->
<input aria-invalid="true" aria-describedby="amount-error" />
<span id="amount-error" role="alert">Valor deve ser maior que zero</span>
<!-- role="alert" faz o SR ler automaticamente ao aparecer -->
```

---

## 3. Modais e diálogos

```html
<!-- Estrutura de modal acessível -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
>
  <h2 id="modal-title">Confirmar exclusão</h2>
  <p id="modal-desc">Esta ação não pode ser desfeita.</p>

  <button>Cancelar</button>
  <button>Confirmar exclusão</button>
</div>

<!-- Comportamento obrigatório de modal: -->
<!-- 1. Foco move para o modal ao abrir (preferencialmente para o título ou primeiro elemento) -->
<!-- 2. Tab cicla APENAS dentro do modal (focus trap) -->
<!-- 3. Escape fecha o modal -->
<!-- 4. Foco retorna ao elemento que abriu o modal ao fechar -->
<!-- 5. Fundo da página fica inerte (aria-hidden="true" no container pai, inert attribute) -->
```

---

## 4. Navegação por teclado

```
Teclas padrão e seus comportamentos esperados:
Tab         → próximo elemento focusável
Shift+Tab   → elemento focusável anterior
Enter       → ativa botão, segue link, submete formulário
Space       → ativa botão, seleciona checkbox
Escape      → fecha modal, cancela dropdown, descarta tooltip
Setas ↑↓   → navega em listas de opções, menus, tabelas
Home/End    → primeiro/último item de uma lista

Garantias de implementação:
✅ Todos os elementos interativos são alcançáveis via Tab
✅ Ordem de foco segue a ordem visual (lógica de cima para baixo, esquerda para direita)
✅ Foco visível (outline ou ring visível — nunca outline: none sem alternativa)
✅ Skip links para pular navegação repetitiva em páginas longas
```

```css
/* Estilo de foco: nunca remover — substituir por algo melhor */

/* ❌ */
*:focus { outline: none; }

/* ✅ */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## 5. Tabelas

```html
<!-- Tabela simples com headers -->
<table>
  <caption>Transações de março de 2026</caption>
  <thead>
    <tr>
      <th scope="col">Data</th>
      <th scope="col">Descrição</th>
      <th scope="col">Valor</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>15/03</td>
      <td>Mercado</td>
      <td>R$ 350,00</td>
    </tr>
  </tbody>
</table>

<!-- scope="col" e scope="row" são obrigatórios em tabelas complexas -->
<!-- caption descreve o propósito da tabela para SRs -->
```

---

## 6. Ícones e imagens

```html
<!-- Ícone decorativo (não acrescenta informação) -->
<svg aria-hidden="true" focusable="false">...</svg>

<!-- Ícone informativo (comunica algo) -->
<svg aria-label="Alerta" role="img">...</svg>

<!-- Botão com ícone apenas: SEMPRE aria-label -->
<button aria-label="Excluir transação">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Imagem informativa -->
<img src="grafico.png" alt="Gráfico de gastos: Alimentação 35%, Moradia 28%, Outros 37%" />

<!-- Imagem decorativa -->
<img src="background.png" alt="" />
```

---

## 7. Regiões dinâmicas (live regions)

```html
<!-- Para conteúdo que muda sem recarregar a página -->

<!-- Toast / notificação — SR lê imediatamente ao aparecer -->
<div role="alert" aria-live="assertive">
  Transação salva com sucesso.
</div>

<!-- Status / progresso — SR lê na próxima pausa -->
<div role="status" aria-live="polite">
  3 de 50 itens carregados...
</div>

<!-- Quando NÃO usar assertive: -->
<!-- assertive interrompe tudo que o SR está lendo. Usar APENAS para erros críticos. -->
<!-- Para tudo mais: polite (espera a pausa natural) -->
```

---

## 8. Contraste de cor — referência rápida

| Texto | Fundo claro | Fundo escuro | Atingível? |
|-------|-------------|--------------|------------|
| Cinza #6b7280 em branco | 4.6:1 | — | ✅ AA |
| Cinza #9ca3af em branco | 2.5:1 | — | ❌ Falha |
| Branco em azul #3b82f6 | — | 3.0:1 | ✅ AA (texto grande) |
| Branco em verde #22c55e | — | 2.2:1 | ❌ Falha |
| Preto em amarelo #f59e0b | 9.0:1 | — | ✅ AAA |

**Ferramenta de verificação:** [contrast.tools](https://contrast.tools) ou DevTools > Accessibility

---

## 9. Testes de acessibilidade

### Automatizados (no pipeline CI)

```bash
# axe-core via Playwright/Cypress
npx @axe-core/cli http://localhost:4200
# ou via Lighthouse
npx lighthouse http://localhost:4200 --only-categories=accessibility
```

### Manuais obrigatórios (antes de go-live por feature)

```
1. Navegação só com teclado:
   - Tab por todos os elementos interativos
   - Enter/Space ativam ações
   - Escape fecha modais e dropdowns
   - Sem elementos interativos inacessíveis

2. Screen reader (NVDA no Windows / VoiceOver no macOS):
   - Abrir a tela com SR ativo
   - Navegar pelos landmarks (H, principais regiões)
   - Ler um formulário completo
   - Verificar que erros são anunciados

3. Zoom 200% no browser:
   - Conteúdo não sobrepõe nem some
   - Scroll horizontal só em tabelas (não na página inteira)
```

---

## 10. Checklist de acessibilidade (pré-entrega)

**Semântica:**
- [ ] Elementos interativos usam tags nativas (`<button>`, `<a>`, `<input>`)
- [ ] Landmarks presentes (`<main>`, `<nav>`, `<header>`, `<footer>`)
- [ ] Títulos em hierarquia correta (h1 → h2 → h3, sem pular)

**Formulários:**
- [ ] Todo input tem label associado (for+id ou aria-label)
- [ ] Campos obrigatórios marcados com `required` e `aria-required`
- [ ] Mensagens de erro com `role="alert"` e `aria-describedby`

**Interação:**
- [ ] Todos os elementos interativos focusáveis via Tab
- [ ] Focus outline visível em todos os estados
- [ ] Modais têm focus trap e fecham com Escape
- [ ] Botões de ícone têm `aria-label`

**Conteúdo:**
- [ ] Contraste de texto ≥ 4.5:1 (normal) ou ≥ 3:1 (grande)
- [ ] Imagens informativas com `alt` descritivo; decorativas com `alt=""`
- [ ] Notificações dinâmicas com `role="alert"` ou `aria-live`

**Teste:**
- [ ] axe ou Lighthouse sem erros críticos
- [ ] Navegação só teclado funcional no fluxo principal

---

*Skill — `.github/skills/fe-accessibility-patterns.md`*
*Referência: `principios-engenharia.md` §1.5 · WCAG 2.1 AA*
