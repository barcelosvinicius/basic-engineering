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
const IMPL = 'implantada em 2026-08-19 (U1) — `plugins/be/x` · `56e0d9c`';
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
  const errors = audit.check(ledger(ok(1, 'implantada — `56e0d9c`'), ok(2, 'descartada em 2026-08-19')));
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
  assert.match(once, /\| 1 \| Proposta 1 \| implantada em 2026-08-19 \(U1\) \| `plugins\/be\/x` · `56e0d9c` \|/);
  assert.match(once, /\*\*2 propostas · 1 implantadas · 0 descartada\(s\) · 1 abertas\*\*/);
  // The rascunho's own proposals survive, and are still parsed as the draft's.
  assert.deepStrictEqual(audit.parse(once.replace(/<!-- be:estado:inicio[\s\S]*?be:estado:fim -->/, '')).map((p) => p.n), [1, 2]);
});

// ── Added after the first mutation pass (2026-09-22): 25 of 81 mutants of
// proposals-audit.js survived the suite above. The CLI — the exit code that
// `--check` promises — had no test at all.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fixture } = require('./helpers.js');

/** The sync form: audit.main returns a number, not a promise. */
function quietSync(fn) {
  const { log, error } = console;
  console.log = console.error = () => {};
  try { return fn(); } finally { console.log = log; console.error = error; }
}

const fixtureRoot = (files) => fixture(files, 'be-proposals-');



test('main --check exits 1 on a defective ledger, 0 on an honest one, and 0 without --check', () => {
  const bad = fixtureRoot({ 'feedback/x/SUGESTOES.md': ledger('## 1. Sem estado\n\ntexto.\n') });
  const good = fixtureRoot({ 'feedback/x/SUGESTOES.md': ledger(ok(1, IMPL)) });
  assert.strictEqual(quietSync(() => audit.main(['--check'], bad)), 1);
  assert.strictEqual(quietSync(() => audit.main([], bad)), 0);
  assert.strictEqual(quietSync(() => audit.main(['--check'], good)), 0);
});

test('main --draft refuses without --from, and refuses a draft with half a generated block', () => {
  const root = fixtureRoot({ 'feedback/x/SUGESTOES.md': ledger(ok(1, IMPL)) });
  const draft = path.join(root, 'draft.md');
  fs.writeFileSync(draft, `# R\n\n---\n\n${audit.BEGIN}\nlixo sem fim\n\n## 1. Proposta 1\n`);
  const before = fs.readFileSync(draft, 'utf8');
  assert.strictEqual(quietSync(() => audit.main(['--draft', draft], root)), 2);
  assert.strictEqual(quietSync(() => audit.main(['--draft', draft, '--from', 'feedback/x/SUGESTOES.md'], root)), 2);
  assert.strictEqual(fs.readFileSync(draft, 'utf8'), before, 'a refused draft is left untouched');
  assert.throws(() => audit.applyDraft(`${audit.END}\n${audit.BEGIN}`, 'x'), /one generated-block marker/);
});

test('main --draft writes the index into the draft, after its title block', () => {
  const root = fixtureRoot({ 'feedback/x/SUGESTOES.md': ledger(ok(1, IMPL), ok(2, 'aberta')) });
  const draft = path.join(root, 'draft.md');
  fs.writeFileSync(draft, '# R\n\ncabeçalho\n\n---\n\n## 1. Proposta 1\n');
  assert.strictEqual(quietSync(() => audit.main(['--draft', draft, '--from', 'feedback/x/SUGESTOES.md'], root)), 0);
  const text = fs.readFileSync(draft, 'utf8');
  assert.ok(text.indexOf(audit.BEGIN) > text.indexOf('---'), 'inserted after the first ---, not at the top');
  assert.match(text, /\*\*2 propostas · 1 implantadas/);
});

test('a draft with no --- gets the index at the very top', () => {
  assert.ok(audit.applyDraft('# R\n\n## 1. P\n', 'BLOCO').startsWith('BLOCO\n\n# R'));
});

test('the index names a proposal with no state, and shows drift lines only when there is drift', () => {
  const props = [{ n: 1, title: 'Sem estado', estado: null }];
  const clean = audit.renderIndex(props, [{ n: 1, title: 'Sem estado' }], 'f.md', '2026-09-22');
  assert.match(clean, /\| 1 \| Sem estado \| sem estado \|/);
  assert.doesNotMatch(clean, /Só neste rascunho|Mesmo número/);
  const drifted = audit.renderIndex(props, [{ n: 1, title: 'Outra' }, { n: 2, title: 'Nova' }], 'f.md', '2026-09-22');
  assert.match(drifted, /Só neste rascunho — ainda sem estado no `be`:\*\* 2 \(Nova\)/);
  assert.match(drifted, /Mesmo número, proposta diferente:\*\* 1 — aqui "Outra", no `be` "Sem estado"/);
});

test('a checkout with no feedback/ directory has no ledgers — and says so rather than failing', () => {
  assert.deepStrictEqual(audit.ledgers(fixtureRoot({ 'README.md': 'x' })), []);
});

test('as a CLI, --check runs against this repository and exits 0', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'proposals-audit.js'), '--check'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /✔ feedback\/project-a-2026-08-19\/SUGESTOES\.md/);
});

test('requiring the module runs nothing — the CLI runs only as a script', () => {
  const r = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(path.join(__dirname, '..', 'scripts', 'proposals-audit.js'))})`], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(r.stdout, '');
});

test('this repository: every ledger in feedback/ is honest', () => {
  const root = path.join(__dirname, '..');
  const found = audit.ledgers(root);
  assert.ok(found.length > 0, 'no ledger found — the audit would pass by measuring nothing');
  for (const rel of found) {
    assert.deepStrictEqual(audit.check(fs.readFileSync(path.join(root, rel), 'utf8')), [], rel);
  }
});
