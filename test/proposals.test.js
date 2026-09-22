'use strict';

/**
 * Same discipline as test/probes.test.js: each rule is fed a KNOWN VIOLATION
 * first, and each gets its mirror — the nearest case that must be ALLOWED. A
 * suite that only asserts what must fail never measures what must pass (the
 * bypass-guard false positive of 2026-09-20).
 *
 * The violations are the ones that happened: proposals 24–28 lived only in the
 * project's draft, and the number 24 named two different proposals. The last
 * test runs the audit against this repository, so CI and the release execute it.
 */

const { test } = require('node:test');
const assert = require('node:assert');

const audit = require('../scripts/proposals-audit.js');

const ok = (n, estado) => `## ${n}. Proposta ${n} 🔴\n\n**Estado:** ${estado}\n\ntexto.\n`;
const IMPL = 'implantada em 2026-08-19 (U1) — `plugins/be/x` · `a5d563d`';
const ledger = (...parts) => `# Sugestões\n\n${parts.join('\n')}`;

test('an honest ledger passes', () => {
  assert.deepStrictEqual(audit.check(ledger(ok(1, IMPL), ok(2, 'aberta — sem triagem'), ok(3, 'descartada em 2026-08-19, porque ruído'))), []);
});

test('a proposal without a state is reported', () => {
  const errors = audit.check(ledger(ok(1, IMPL), '## 2. Sem estado\n\ntexto.\n'));
  assert.strictEqual(errors.length, 1);
  assert.match(errors[0], /proposal 2 .*no \*\*Estado:\*\*/);
});

test('a number used twice is reported — once, not as a cascade over every later proposal', () => {
  const errors = audit.check(ledger(ok(1, IMPL), ok(2, 'aberta'), ok(2, 'aberta'), ok(3, 'aberta'), ok(4, 'aberta')));
  assert.deepStrictEqual(errors.map((e) => e.replace(/ \(line \d+\)/, '')), ['proposal 2: number used twice']);
});

test('a gap in the numbering is reported', () => {
  const errors = audit.check(ledger(ok(1, IMPL), ok(3, 'aberta')));
  assert.deepStrictEqual(errors, ['proposal 2: missing — the numbers run 1..3 with a gap']);
});

test('"implantada" without the commit that proves it is reported', () => {
  const errors = audit.check(ledger(ok(1, 'implantada em 2026-08-19 — está no plugin')));
  assert.match(errors.join('\n'), /needs the commit/);
});

test('"implantada" and "descartada" need a date; "descartada" needs its reason', () => {
  const errors = audit.check(ledger(ok(1, 'implantada — `a5d563d`'), ok(2, 'descartada em 2026-08-19')));
  assert.match(errors.join('\n'), /proposal 1 .*needs a date/);
  assert.match(errors.join('\n'), /proposal 2 .*needs its reason/);
});

test('a state outside the vocabulary is reported', () => {
  assert.match(audit.check(ledger(ok(1, 'feita'))).join('\n'), /must start with aberta \| implantada \| descartada/);
});

test('mirror: a heading that only mentions a number, and a numbered line in a code fence, are not proposals', () => {
  const text = ledger(ok(1, IMPL), '## O que a 22 diz sobre as diretrizes\n\ntexto.\n', '```\n## 7. dentro de um bloco de código\n```\n', ok(2, 'aberta'));
  assert.deepStrictEqual(audit.parse(text).map((p) => p.n), [1, 2]);
  assert.deepStrictEqual(audit.check(text), []);
});

test('mirror: "aberta" needs neither date nor commit', () => {
  assert.deepStrictEqual(audit.check(ledger(ok(1, 'aberta — nunca conferida'))), []);
});

test('draft: a proposal only in the draft, and a number naming a different proposal, are both listed', () => {
  const props = audit.parse(ledger(ok(1, IMPL), ok(2, 'aberta')));
  const draftProps = audit.parse('## 1. Proposta 1\n\n## 2. Outra coisa\n\n## 3. Nova\n');
  const { onlyInDraft, collisions } = audit.drift(props, draftProps);
  assert.deepStrictEqual(onlyInDraft.map((d) => d.n), [3]);
  assert.deepStrictEqual(collisions.map((d) => d.n), [2]);
});

test('draft: the index is inserted once and regenerated in place, never duplicated', () => {
  const props = audit.parse(ledger(ok(1, IMPL), ok(2, 'aberta — triada')));
  const draft = '# Rascunho\n\ncabeçalho\n\n---\n\n## 1. Proposta 1\n\n## 2. Proposta 2\n';
  const block = audit.renderIndex(props, audit.parse(draft), 'feedback/x/SUGESTOES.md', '2026-09-22');
  const once = audit.applyDraft(draft, block);
  const twice = audit.applyDraft(once, block);
  assert.strictEqual(twice, once);
  assert.strictEqual(once.split(audit.BEGIN).length, 2);
  assert.match(once, /\| 1 \| Proposta 1 \| implantada em 2026-08-19 \(U1\) \| `plugins\/be\/x` · `a5d563d` \|/);
  assert.match(once, /\*\*2 propostas · 1 implantadas · 0 descartada\(s\) · 1 abertas\*\*/);
  // The rascunho's own proposals survive, and are still parsed as the draft's.
  assert.deepStrictEqual(audit.parse(once.replace(/<!-- be:estado:inicio[\s\S]*?be:estado:fim -->/, '')).map((p) => p.n), [1, 2]);
});

test('this repository: every ledger in feedback/ is honest', () => {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  const found = audit.ledgers(root);
  assert.ok(found.length > 0, 'no ledger found — the audit would pass by measuring nothing');
  for (const rel of found) {
    assert.deepStrictEqual(audit.check(fs.readFileSync(path.join(root, rel), 'utf8')), [], rel);
  }
});
