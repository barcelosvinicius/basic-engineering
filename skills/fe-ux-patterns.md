---
name: fe-ux-patterns
description: >
 Operational UX guide to translate the principles from engineering-principles.md into concrete
 implementation decisions. Use when creating or reviewing any UI component —
 visual hierarchy, colors, loading states, forms, and user feedback.
---

# Skill: UX and Interface Design Patterns

## What this skill is

Operational UX guide to translate the principles from §1 of `engineering-principles.md`
into concrete implementation decisions. Use when creating or reviewing any UI
component — not just to "make it look nice", but to ensure efficient and lightweight
communication for the user.

> **Core principle:** A good interface is not the one with the most elements — it is the one
> that requires the least cognitive effort for the user to achieve their goal.

---

## 1. Visual hierarchy — what the eye should see first

Every screen has a hierarchy of importance. The layout must reflect it.

```
Level 1 — What the user needs to know immediately (KPIs, statuses, alerts)
Level 2 — What the user will likely want to do (primary action)
Level 3 — Secondary details and context (tables, filters, metadata)
Level 4 — Advanced controls and settings (rarely used)
```

**Practical rules:**
- Never more than 2 highlighted elements (`font-weight: bold`, emphasis color) per block
- Primary action: one button per screen/section. Secondary action: visually smaller
- Critical information (alert, negative balance, error) must never compete with decoration
- Section titles: short (1-3 words), descriptive, not generic ("Data" is bad; "March spending" is good)

---

## 2. Colors — semantics, not decoration

Colors communicate state. Used randomly, they destroy communication.

| Color | Semantic use | When NOT to use |
|------|--------------|-----------------|
| Green (`#22c55e`) | Success, positive balance, goal reached | Decorative highlight |
| Yellow/Orange (`#f59e0b`) | Attention, threshold approaching | Neutral information |
| Red (`#ef4444`) | Error, deficit, critical | Anything that is not urgent |
| Blue (`#3b82f6`) | Neutral information, links, primary actions | Financial/business status |
| Purple/Indigo (`#8b5cf6`) | KPI highlight, BI metrics | Actions or alerts |
| Gray | Secondary text, borders, disabled state | Important information |

**Rules:**
- Never use color as the only differentiator — always pair it with an icon, label, or pattern
- Colored backgrounds require text from the same color family (dark shade on light background)
- Maximum of 3 semantic colors per screen. More than that = noise

---

## 3. Typography — readability before style

```css
/* Minimum typographic hierarchy */
--text-xs:   12px;  /* metadata, form labels, secondary dates */
--text-sm:   14px;  /* table body, card subtitles */
--text-base: 16px;  /* standard body text */
--text-lg:   18px;  /* section titles */
--text-xl:   22px;  /* page titles, highlighted KPIs */
--text-2xl:  28px;  /* main value (e.g.: monthly total) */

/* Weights: only two */
font-weight: 400;   /* body, labels, descriptions */
font-weight: 500;   /* titles, highlighted values, active labels */
/* 600+ → too much emphasis, makes everything heavy */
```

**Minimum WCAG AA contrast:**
- Regular text (< 18px): ratio 4.5:1
- Large text (≥ 18px or bold ≥ 14px): ratio 3:1
- Icons and UI components: ratio 3:1

---

## 4. Spacing — breathing room between elements

```css
/* Spacing system in multiples of 4 */
--space-1:  4px;   /* minimum gap between related elements */
--space-2:  8px;   /* small internal padding, icon+text gap */
--space-3: 12px;   /* badge padding, gap between label and input */
--space-4: 16px;   /* standard card padding, gap between columns */
--space-6: 24px;   /* separation between sections inside a card */
--space-8: 32px;   /* separation between cards/blocks */
--space-12: 48px;  /* separation between page sections */
```

**Gestalt rule (proximity):** related elements stay close. Distinct groups
have more space between them. If two items are conceptually different,
the space between them should be visibly larger than the space between items in the same group.

---

## 5. Cards and listings

```
Minimum card:
┌─────────────────────────────────┐
│ [Icon] Title             Status │  ← identification line
│ Main value                      │  ← most important information
│ Metadata 1  •  Metadata 2      │  ← secondary context
└─────────────────────────────────┘

Rules:
- First element = identifies WHAT it is (name, category, title)
- Second = the VALUE most relevant to the decision
- Third+ = context (date, source, subcategory)
- Actions (edit, delete) = appear on hover or in a menu, never occupy fixed space
```

**Card anti-patterns:**
- ❌ Putting a technical ID as the first element
- ❌ Showing all fields of an object — filter what matters for the context
- ❌ Destructive actions without visual separation from primary actions

---

## 6. Forms

```
Field order: from most general to most specific
Example: Category → Subcategory → Description → Amount → Date

Validation:
- DO NOT validate on each field's onBlur (interrupts the flow)
- Validate on submit (shows all errors at once)
- Exception: fields with immediate rules (CPF, email — validate on blur)

Error messages:
- Close to the field, not at the top of the form
- Descriptive: "Amount must be greater than zero" (not "Invalid field")
- Color + icon + text: never color alone

Labels:
- Always visible (do not use placeholder as a label substitute)
- Placeholder = example of expected format, not the field name
```

---

## 7. Loading states

| Duration | Recommended pattern |
|----------|---------------------|
| < 100ms | No indicator needed |
| 100–300ms | Disable the button that triggered the action |
| 300ms–2s | Skeleton screen (for lists/cards) or spinner (for actions) |
| > 2s | Skeleton + context message ("Loading transactions...") |
| Indeterminate | Indeterminate progress bar + cancel option |

**Skeleton screens > spinners for content:**
- Skeleton reduces layout "shock" when the real data loads
- Spinner gives no clue about what will appear — increases perceived anxiety

---

## 8. Empty state

Every component that lists data must have an **informative and actionable** empty state:

```
❌ Bad:  "No results found."

✅ Good:
  [themed icon]
  No transactions in March
  Import your statement or add an entry manually.
  [Import CSV]  [Add manually]
```

**Empty-state rules:**
- Explains WHY it is empty (no data, active filter, period without activity)
- Offers the action that resolves the emptiness (when one exists)
- Tone: neutral or light — not alarmist

---

## 9. Toasts and action feedback

```
Position: bottom-right corner (desktop default) or centered top (mobile)
Duration: 3–5 seconds for success; persistent for error until the user closes it

Types:
✅ Success  — green, auto-close, message confirming what was done
⚠️ Warning  — yellow, auto-close or manual
❌ Error    — red, persistent, with details link if applicable
ℹ️ Info     — neutral, auto-close

Toast content:
- Past tense: "Transaction saved." / "3 items imported."  (not "Success!")
- Specific: "March invoice deleted." (not "Item deleted.")
- Actionable when possible: "Transaction saved. [Undo]"
```

---

## 10. Responsiveness — breakpoints

```css
/* Mobile first — write the base for mobile, override for larger screens */
/* sm */ @media (min-width: 640px)  { /* small tablet */ }
/* md */ @media (min-width: 768px)  { /* tablet */ }
/* lg */ @media (min-width: 1024px) { /* desktop */ }
/* xl */ @media (min-width: 1280px) { /* wide desktop */ }

Behaviors by breakpoint:
- Mobile (< 768px):
 → Navigation: hamburger menu or bottom bar
 → Tables: horizontal scroll or stacked cards
 → Charts: reduced height, no side legend
 → Forms: single-column fields

- Tablet (768px–1024px):
 → Collapsible sidebar
 → 2-column grid

- Desktop (≥ 1024px):
 → Fixed sidebar
 → 3-4 column grid
 → Full tables
```

---

## 11. Information density by screen type

| Screen type | Density | Rationale |
|---|---|---|
| Dashboard / KPI panel | High | Experienced user wants a fast overview |
| List / history | Medium | Scanning + focused action |
| Form | Low | Focus and precision are the priority |
| Confirmation screen | Minimal | Reduce cognitive friction before irreversible action |
| Settings | Medium | Rarely accessed; detail is welcome |

---

## 12. UX review checklist (pre-delivery)

**Communication:**
- [ ] Is the most important information visually highlighted?
- [ ] Do colors have semantic meaning (not just decorative)?
- [ ] Are error messages descriptive and close to the failure point?
- [ ] Do toasts confirm what was done (not just "success")?

**Efficiency:**
- [ ] Can the primary action be executed in ≤ 2 clicks?
- [ ] Are form fields in a logical order (general → specific)?
- [ ] Is there an informative empty state for lists?
- [ ] Are loading states present for operations > 300ms?

**Consistency:**
- [ ] Do equivalent components behave the same across all screens?
- [ ] Do destructive actions require explicit confirmation?
- [ ] Is the typographic hierarchy consistent with the rest of the system?

**Lightness:**
- [ ] Does the screen have ≤ 3 visual focal points?
- [ ] Is information the user does not need in this context absent?
- [ ] Is there no redundant label + icon when one of them is enough?

---

*Skill — `.github/skills/fe-ux-patterns.md`*
*Reference: `engineering-principles.md` §1 (UX), §1.5 (Accessibility)*
