---
name: fe-ux-patterns
description: >
  Use when creating or reviewing any UI component, screen, or form.
  Operational UX guide — visual hierarchy, colors, loading states, forms,
  perceived performance, and user feedback patterns.
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

## 5. Component and screen patterns — see the catalogue

Cards and listings, forms, loading states, empty states, toasts, responsive
breakpoints and information density per screen type each have a worked pattern
in [ui-patterns.md](ui-patterns.md). Open the one you are building — it is
reference, not something to read end to end.

## 6. UX review checklist (pre-delivery)

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

## Resources

- [ui-patterns.md](ui-patterns.md) — worked patterns per component and screen:
  cards and listings, forms, loading and empty states, toasts, responsive
  breakpoints, information density.

---

*Reference: `engineering-principles.md` §1 (UX), §1.5 (Accessibility) · see also the `fe-accessibility-patterns` skill*
