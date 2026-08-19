# Accessible component patterns — per component

Loaded on demand from `fe-accessibility-patterns`. This is the **catalogue**:
you consult the section for the component you are building. The decision
procedure — semantic HTML first, contrast, testing, the pre-delivery checklist —
stays in `SKILL.md`, which loads on every activation.

Every pattern below is framework-agnostic: plain HTML and ARIA.

---

## 1. Labels and associations

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

## 2. Modals and dialogs

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

## 3. Keyboard navigation

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

## 4. Tables

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

## 5. Icons and images

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

## 6. Dynamic regions (live regions)

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

