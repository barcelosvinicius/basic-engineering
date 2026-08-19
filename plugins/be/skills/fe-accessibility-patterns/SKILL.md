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

## 2. Component patterns — see the catalogue

Labels and associations, modals and dialogs, keyboard navigation, tables, icons
and images, and live regions each have a worked pattern in
[component-patterns.md](component-patterns.md). Open the section for the
component you are building — it is reference, not something to read end to end.

## 3. Color contrast — quick reference

| Text | Light background | Dark background | Passes? |
|------|------------------|-----------------|---------|
| Gray #6b7280 on white | 4.6:1 | — | ✅ AA |
| Gray #9ca3af on white | 2.5:1 | — | ❌ Fail |
| White on blue #3b82f6 | — | 3.0:1 | ✅ AA (large text) |
| White on green #22c55e | — | 2.2:1 | ❌ Fail |
| Black on yellow #f59e0b | 9.0:1 | — | ✅ AAA |

**Verification tool:** [contrast.tools](https://contrast.tools) or DevTools > Accessibility

---

## 4. Accessibility testing

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

## 5. Accessibility checklist (pre-delivery)

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

## Resources

- [component-patterns.md](component-patterns.md) — worked ARIA/keyboard patterns
  per component: labels, modals, keyboard navigation, tables, icons, live
  regions. Open the one you are building.

---

*Reference: `engineering-principles.md` §1.5 · WCAG 2.1 AA · see also the `fe-ux-patterns` skill*
