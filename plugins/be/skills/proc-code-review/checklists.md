# Code review checklists — by layer

Look-up material for `proc-code-review`: open the layer the change touches.
Every item is answerable from **the diff alone** (the rule and its reason are in
[SKILL.md](SKILL.md)).

## Backend

**Correctness:**
- [ ] Does the implemented logic match the requirement (RF-XX)?
- [ ] Are edge cases handled (null, empty, zero value, overflow)?
- [ ] Are database transactions correct (readOnly on reads, rollback on failures)?
- [ ] Is N+1 avoided (batch queries, no select loops)?

**Security:**
- [ ] Is the new endpoint mapped in SecurityConfig (public or protected)?
- [ ] Is authorization checked on the server, not only on the client?
- [ ] Is input validated before use (Bean Validation, sanitization)?
- [ ] Is the JPA entity not returned directly (use DTO)?
- [ ] Does every secret the change needs come from config or a vault, none added to the code?

**Quality:**
- [ ] Constructor injection used (not field `@Autowired`)?
- [ ] Are custom exceptions thrown (not generic exceptions)?
- [ ] Do unit tests cover the new behavior?
- [ ] Was a versioned migration created if the schema changed? (see `be-db-migrations`)

## Frontend

**Correctness:**
- [ ] Does the component consume the API correctly (typing, error handling)?
- [ ] Is a loading state present for async operations?
- [ ] Is the empty state handled for lists?

**UX (see the `fe-ux-patterns` skill):**
- [ ] Visual feedback after actions (toast, button disable)?
- [ ] Confirmation before destructive actions?
- [ ] Clear visual hierarchy (is the most important thing highlighted)?

**Accessibility (see the `fe-accessibility-patterns` skill):**
- [ ] Interactive elements with semantic tags?
- [ ] Inputs with associated labels?
- [ ] Visible focus on all interactive elements?

**Performance:**
- [ ] Chart instances destroyed in OnDestroy?
- [ ] Subscriptions canceled in OnDestroy?
- [ ] Debounce on search fields?

## General

- [ ] No `console.log` / `println` of sensitive data added?
- [ ] Comments explain *why*, not *what*; no commented-out code added, no comment this change made stale? (see `proc-code-documentation`)
- [ ] Naming consistent with the rest of the system?
- [ ] Does the PR reference an issue with `Closes #N`?
- [ ] Were docs updated if there was an architectural decision?
