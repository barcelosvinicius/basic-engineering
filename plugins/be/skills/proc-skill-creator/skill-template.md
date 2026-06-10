# Template for new skills

Create a directory `skills/[prefix]-[name]/` and copy the block below into
its `SKILL.md`. Delete the instruction comments when the skill is ready.

A skill answers *"How do I do X?"* — not *"Why do X"* (that belongs to the
agent or an ADR) or *"What to build"* (that belongs to the spec/requirements).
Focus on the concrete, reusable *how*. Keep `SKILL.md` under ~150 lines;
move long examples and stack-specific code to sibling resource files.

Prefixes: `be-` backend · `fe-` frontend · `da-` data · `qa-` quality ·
`sec-` security · `ops-` operations · `proc-` process (universal) ·
`infra-` infrastructure.

---

````markdown
---
name: [prefix]-[name]
description: >
  Use when [concrete trigger — this line decides whether the skill fires].
  [What it covers — max 3 sentences total.]
---

# Skill: [Skill Name]

<!-- One sentence: what problem it solves and when to use it -->
Defines [what] for [which context]. Use it when [usage situation].

## [Main section — e.g.: Implementation pattern]

<!-- Code, concrete examples, rules -->

```[language]
// ✅ Correct
[code]

// ❌ Wrong — and why
[code]
```

## [Special cases — e.g.: Edge cases]

| Situation | What to do |
|-----------|------------|
| [special case 1] | [solution] |
| [special case 2] | [solution] |

## Common mistakes

| Mistake | Cause | Solution |
|---------|-------|----------|
| [mistake 1] | [cause] | [solution] |
| [mistake 2] | [cause] | [solution] |

## Resources

<!-- Optional: sibling files with long examples, loaded on demand -->
- [examples-[stack].md](examples-[stack].md) — [what it contains]

<!-- References: other skills by name, principles -->
*See also: the `[other-skill]` skill · §[N.N] of `engineering-principles.md`*
````
