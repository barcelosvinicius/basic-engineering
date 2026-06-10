---
name: fe-accessibility-patterns
description: >
  Use when implementing any interactive component, form, modal, or table.
  Concrete WCAG 2.1 AA accessibility patterns — semantic HTML, ARIA
  attributes, keyboard navigation, color contrast, and automated testing.
---

# Skill: Accessibility Patterns (a11y)

## What this skill is

Operational implementation of §1.5 of `engineering-principles.md`. It defines
concrete accessibility patterns for UI components — what to use, when to use it,
and how to test it. Use when implementing any interactive component, form, modal,
or table.

> **Principle:** Accessibility is not a feature — it is baseline quality. An
> inaccessible component has a bug, even if it "works" visually.

---

## 1. Semantic HTML — the foundation of everything

```html
<!-- ❌ Wrong: div with role — requires unnecessary manual work -->
<div role="button" onclick="..." tabindex="0">Save</div>

<!-- ✅ Correct: native element provides accessible behavior by default -->
<button type="button" onclick="...">Save</button>

<!-- Native elements and their automatic benefits -->
<button>    → focusable, Enter/Space activates, role=button for screen readers
<a href>    → focusable, Enter activates, role=link
<input>     → label can be associated, aria-required, aria-invalid
<select>    → native keyboard navigation
<table>     → thead/tbody/th communicate structure to screen readers
<nav>       → navigation landmark
<main>      → main content landmark
<aside>     → secondary content landmark
<header>    → header landmark
<footer>    → footer landmark
```

---

## 2. Labels and associations

```html
<!-- Always associate a label with the input -->

<!-- ✅ Option 1: for + id -->
<label for="amount">Amount</label>
<input id="amount" type="number" />

<!-- ✅ Option 2: label wrapping the input -->
<label>
  Amount
  <input type="number" />
</label>

<!-- ✅ Option 3: aria-label (when a visible label is not possible) -->
<input type="search" aria-label="Search transactions" />

<!-- ❌ Never: placeholder as a label substitute -->
<input type="text" placeholder="Description" />
<!-- Problem: disappears while typing, low contrast, not read by some SRs -->

<!-- Required fields -->
<input required aria-required="true" />
<label>Amount <span aria-hidden="true">*</span></label>
<!-- aria-hidden on the asterisk avoids literal reading by the screen reader -->

<!-- Fields with error -->
<input aria-invalid="true" aria-describedby="amount-error" />
<span id="amount-error" role="alert">Amount must be greater than zero</span>
<!-- role="alert" makes the SR read it automatically when it appears -->
```

---

## 3. Modals and dialogs

```html
<!-- Accessible modal structure -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
>
  <h2 id="modal-title">Confirm deletion</h2>
  <p id="modal-desc">This action cannot be undone.</p>

  <button>Cancel</button>
  <button>Confirm deletion</button>
</div>

<!-- Mandatory modal behavior: -->
<!-- 1. Focus moves to the modal when opened (preferably to the title or first element) -->
<!-- 2. Tab cycles ONLY within the modal (focus trap) -->
<!-- 3. Escape closes the modal -->
<!-- 4. Focus returns to the element that opened the modal when closed -->
<!-- 5. Page background becomes inert (aria-hidden="true" on parent container, inert attribute) -->
```

---

## 4. Keyboard navigation

```
Standard keys and expected behavior:
Tab         → next focusable element
Shift+Tab   → previous focusable element
Enter       → activates button, follows link, submits form
Space       → activates button, selects checkbox
Escape      → closes modal, cancels dropdown, dismisses tooltip
Arrows ↑↓   → navigates option lists, menus, tables
Home/End    → first/last item in a list

Implementation guarantees:
✅ All interactive elements reachable via Tab
✅ Focus order follows visual order (top to bottom, left to right)
✅ Visible focus (outline or visible ring — never outline: none without replacement)
✅ Skip links to jump over repetitive navigation on long pages
```

```css
/* Focus style: never remove it — replace it with something better */

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

## 5. Tables

```html
<!-- Simple table with headers -->
<table>
  <caption>Transactions for March 2026</caption>
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Description</th>
      <th scope="col">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>03/15</td>
      <td>Groceries</td>
      <td>$350.00</td>
    </tr>
  </tbody>
</table>

<!-- scope="col" and scope="row" are mandatory in complex tables -->
<!-- caption describes the table purpose for SRs -->
```

---

## 6. Icons and images

```html
<!-- Decorative icon (adds no information) -->
<svg aria-hidden="true" focusable="false">...</svg>

<!-- Informative icon (communicates something) -->
<svg aria-label="Alert" role="img">...</svg>

<!-- Icon-only button: ALWAYS use aria-label -->
<button aria-label="Delete transaction">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Informative image -->
<img src="grafico.png" alt="Spending chart: Food 35%, Housing 28%, Others 37%" />

<!-- Decorative image -->
<img src="background.png" alt="" />
```

---

## 7. Dynamic regions (live regions)

```html
<!-- For content that changes without reloading the page -->

<!-- Toast / notification — SR reads immediately when it appears -->
<div role="alert" aria-live="assertive">
  Transaction saved successfully.
</div>

<!-- Status / progress — SR reads at the next pause -->
<div role="status" aria-live="polite">
  3 of 50 items loaded...
</div>

<!-- When NOT to use assertive: -->
<!-- assertive interrupts everything the SR is reading. Use ONLY for critical errors. -->
<!-- For everything else: polite (waits for the natural pause) -->
```

---

## 8. Color contrast — quick reference

| Text | Light background | Dark background | Passes? |
|------|------------------|-----------------|---------|
| Gray #6b7280 on white | 4.6:1 | — | ✅ AA |
| Gray #9ca3af on white | 2.5:1 | — | ❌ Fail |
| White on blue #3b82f6 | — | 3.0:1 | ✅ AA (large text) |
| White on green #22c55e | — | 2.2:1 | ❌ Fail |
| Black on yellow #f59e0b | 9.0:1 | — | ✅ AAA |

**Verification tool:** [contrast.tools](https://contrast.tools) or DevTools > Accessibility

---

## 9. Accessibility testing

### Automated (in the CI pipeline)

```bash
# axe-core via Playwright/Cypress
npx @axe-core/cli http://localhost:4200
# or via Lighthouse
npx lighthouse http://localhost:4200 --only-categories=accessibility
```

### Required manual checks (before go-live per feature)

```
1. Keyboard-only navigation:
   - Tab through all interactive elements
   - Enter/Space activate actions
   - Escape closes modals and dropdowns
   - No inaccessible interactive elements

2. Screen reader (NVDA on Windows / VoiceOver on macOS):
   - Open the screen with SR enabled
   - Navigate through landmarks (H, main regions)
   - Read a full form
   - Verify that errors are announced

3. 200% browser zoom:
   - Content does not overlap or disappear
   - Horizontal scroll only on tables (not the whole page)
```

---

## 10. Accessibility checklist (pre-delivery)

**Semantics:**
- [ ] Interactive elements use native tags (`<button>`, `<a>`, `<input>`)
- [ ] Landmarks present (`<main>`, `<nav>`, `<header>`, `<footer>`)
- [ ] Headings in the correct hierarchy (h1 → h2 → h3, without skipping)

**Forms:**
- [ ] Every input has an associated label (for+id or aria-label)
- [ ] Required fields marked with `required` and `aria-required`
- [ ] Error messages with `role="alert"` and `aria-describedby`

**Interaction:**
- [ ] All interactive elements focusable via Tab
- [ ] Visible focus outline in all states
- [ ] Modals have focus trap and close with Escape
- [ ] Icon buttons have `aria-label`

**Content:**
- [ ] Text contrast ≥ 4.5:1 (normal) or ≥ 3:1 (large)
- [ ] Informative images with descriptive `alt`; decorative ones with `alt=""`
- [ ] Dynamic notifications with `role="alert"` or `aria-live`

**Testing:**
- [ ] axe or Lighthouse without critical errors
- [ ] Keyboard-only navigation works in the main flow

---

*Reference: `engineering-principles.md` §1.5 · WCAG 2.1 AA · see also the `fe-ux-patterns` skill*
