'use strict';

/**
 * The findings check is a ruler, so it gets both directions: a quote that must
 * be caught — fabricated, misplaced, or pointing outside the project — and the
 * mirror, a faithful quote that must pass even when an agent re-indented it or
 * the file came from Windows.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { fixture, runScript } = require('./helpers.js');

const f = require('../plugins/be/scripts/findings.js');

const SOURCE = [
  'function total(items) {',
  '  let sum = 0;',
  '  for (const i of items) sum += i.price;',
  '  return sum * 2;',
  '}',
  '',
].join('\n');

const project = () => fixture({ 'src/cart.js': SOURCE, 'src/win.js': SOURCE.replace(/\n/g, '\r\n') }, 'be-findings-');

test('a faithful quote at its line is verified', () => {
  const r = f.checkFinding({ file: 'src/cart.js', line: 4, evidence: 'return sum * 2;' }, project());
  assert.strictEqual(r.status, 'verified');
});

test('a fabricated quote is rejected — the case the check exists for', () => {
  const r = f.checkFinding({ file: 'src/cart.js', line: 4, evidence: 'return sum * 3;' }, project());
  assert.strictEqual(r.status, 'not-found');
});

test('a real quote at the wrong line is reported at its actual line', () => {
  const r = f.checkFinding({ file: 'src/cart.js', line: 1, evidence: 'return sum * 2;' }, project());
  assert.strictEqual(r.status, 'moved');
  assert.strictEqual(r.actualLine, 4);
});

test('re-indentation and CRLF do not fail a faithful quote; other characters still do', () => {
  const root = project();
  const reindented = f.checkFinding(
    { file: 'src/win.js', line: 3, evidence: 'for (const i of items)   sum += i.price;' },
    root
  );
  assert.strictEqual(reindented.status, 'verified');
  const altered = f.checkFinding(
    { file: 'src/win.js', line: 3, evidence: 'for (const i of items) sum -= i.price;' },
    root
  );
  assert.strictEqual(altered.status, 'not-found');
});

test('a multi-line quote is verified from its first line', () => {
  const r = f.checkFinding(
    { file: 'src/cart.js', line: 2, evidence: 'let sum = 0;\n  for (const i of items)' },
    project()
  );
  assert.strictEqual(r.status, 'verified');
});

test('a path that leaves the root is invalid, never read', () => {
  const root = project();
  let read = false;
  const r = f.checkFinding({ file: '../outside.js', line: 1, evidence: 'x' }, root, () => {
    read = true;
    return 'x';
  });
  assert.strictEqual(r.status, 'invalid');
  assert.strictEqual(read, false);
});

test('a missing file is not-found; a finding without line or evidence is invalid', () => {
  const root = project();
  assert.strictEqual(f.checkFinding({ file: 'src/nope.js', line: 1, evidence: 'x' }, root).status, 'not-found');
  assert.strictEqual(f.checkFinding({ file: 'src/cart.js', evidence: 'x' }, root).status, 'invalid');
  assert.strictEqual(f.checkFinding({ file: 'src/cart.js', line: 1, evidence: '   ' }, root).status, 'invalid');
  assert.strictEqual(f.checkFinding(null, root).status, 'invalid');
});

test('JSON arrays and JSONL both parse', () => {
  const one = { file: 'a', line: 1, evidence: 'x' };
  assert.deepStrictEqual(f.parseFindings(JSON.stringify([one, one])), [one, one]);
  assert.deepStrictEqual(f.parseFindings(`${JSON.stringify(one)}\n\n${JSON.stringify(one)}\n`), [one, one]);
  assert.deepStrictEqual(f.parseFindings('  '), []);
});

test('the CLI exits 1 on a fabrication, 0 when every finding is grounded, 2 on unreadable input — and states N of M', () => {
  const root = project();
  const write = (name, list) => {
    const p = path.join(root, name);
    fs.writeFileSync(p, JSON.stringify(list));
    return p;
  };
  const good = write('good.json', [
    { file: 'src/cart.js', line: 4, evidence: 'return sum * 2;' },
    { file: 'src/cart.js', line: 1, evidence: 'return sum * 2;' },
  ]);
  const bad = write('bad.json', [
    { file: 'src/cart.js', line: 4, evidence: 'return sum * 2;' },
    { file: 'src/cart.js', line: 4, evidence: 'return sum * 3;' },
  ]);

  const ok = runScript('plugins/be/scripts/findings.js', { args: [good, '--root', root] });
  assert.strictEqual(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /2 of 2 grounded \(1 verified, 1 moved\)/);
  assert.match(ok.stdout, /moved\s+src\/cart\.js:1 — found at line 4/);

  const fail = runScript('plugins/be/scripts/findings.js', { args: [bad, '--root', root] });
  assert.strictEqual(fail.status, 1);
  assert.match(fail.stdout, /1 of 2 grounded .* 1 not found/);

  const broken = path.join(root, 'broken.json');
  fs.writeFileSync(broken, '{ not json');
  assert.strictEqual(runScript('plugins/be/scripts/findings.js', { args: [broken, '--root', root] }).status, 2);
  assert.strictEqual(runScript('plugins/be/scripts/findings.js', { args: [] }).status, 2);
});
