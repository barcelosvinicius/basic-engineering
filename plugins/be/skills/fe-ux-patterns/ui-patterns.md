# UI patterns — per component and per screen

Loaded on demand from `fe-ux-patterns`. This is the **catalogue**: open the
section for the thing you are building. The foundations that decide how anything
should look — hierarchy, colour semantics, typography, spacing — and the
pre-delivery checklist stay in `SKILL.md`, which loads on every activation.

---

## 1. Cards and listings

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

## 2. Forms

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

## 3. Loading states

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

## 4. Empty state

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

## 5. Toasts and action feedback

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

## 6. Responsiveness — breakpoints

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

## 7. Information density by screen type

| Screen type | Density | Rationale |
|---|---|---|
| Dashboard / KPI panel | High | Experienced user wants a fast overview |
| List / history | Medium | Scanning + focused action |
| Form | Low | Focus and precision are the priority |
| Confirmation screen | Minimal | Reduce cognitive friction before irreversible action |
| Settings | Medium | Rarely accessed; detail is welcome |

---

