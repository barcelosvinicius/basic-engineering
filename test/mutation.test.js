'use strict';

/**
 * The mutation pass is itself a measurement, so it gets what every ruler here
 * gets: a known case that must make it fail, and its mirror that must pass.
 * The known case is the shape of A-14 — a suite that runs every line and still
 * notices nothing — shrunk to one function.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const mc = require('../scripts/mutation-check.js');

test('mutants are made only in code — never inside a comment, a string or a regex literal', () => {
  const src = [
    '// if (a === b) a comment',
    'const s = "a && b"; const re = /x || y/;',
    'if (a === b && !c) return true;',
  ].join('\n');
  const found = mc.mutants(src);
  assert.ok(found.every((m) => m.line === 3), 'lines 1 and 2 hold no code operator');
  assert.deepStrictEqual(found.map((m) => m.op), [
    '=== → !==', '&& → ||', 'true → false', '! → (removed)', 'condition → true', 'condition → false',
  ]);
});

/** A throwaway checkout holding one target module and the test that guards it. */
function checkout(testBody) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'be-mutation-fixture-'));
  fs.mkdirSync(path.join(root, 'scripts', 'lib'), { recursive: true });
  fs.mkdirSync(path.join(root, 'test'));
  fs.writeFileSync(path.join(root, 'scripts', 'lib', 'probes.js'),
    "module.exports = (a, b) => { if (a > b) return 'big'; return 'small'; };\n");
  fs.writeFileSync(path.join(root, 'test', 'probes.test.js'),
    "const { test } = require('node:test'); const assert = require('node:assert');\n" +
    "const f = require('../scripts/lib/probes.js');\n" + testBody + '\n');
  return root;
}

async function quiet(fn) {
  const { log, error } = console;
  console.log = console.error = () => {};
  try { return await fn(); } finally { console.log = log; console.error = error; }
}

test('known case: a suite that runs the line but checks nothing fails --check', async () => {
  const root = checkout("test('returns a string', () => assert.strictEqual(typeof f(1, 2), 'string'));");
  assert.strictEqual(await quiet(() => mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'])), 1);
});

// The known case alone passed while the tool was broken: run inside a test
// runner, every mutant survived, so "1" came out for the wrong reason. The
// mirror below is what caught it — a ruler is only proven by both directions.

test('mirror: a suite that pins both branches kills every mutant and passes --check', async () => {
  const root = checkout("test('both branches', () => { assert.strictEqual(f(2, 1), 'big'); assert.strictEqual(f(1, 2), 'small'); });");
  assert.strictEqual(await quiet(() => mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'])), 0);
});

test('the working tree is never mutated — only the throwaway copy is', async () => {
  const root = checkout("test('returns a string', () => assert.strictEqual(typeof f(1, 2), 'string'));");
  const target = path.join(root, 'scripts', 'lib', 'probes.js');
  const before = fs.readFileSync(target, 'utf8');
  await quiet(() => mc.main(['--root', root, '--only', 'scripts/lib/probes.js']));
  assert.strictEqual(fs.readFileSync(target, 'utf8'), before);
});

// Measured here, on 2026-09-22: a broken test sat in the suite while the pass
// ran, and every mutant came out "killed" — 131 of 131, a perfect score over a
// red suite. A ruler must first see green on the unmutated code.
test('a suite that already fails is NOT MEASURED, and --check refuses it', async () => {
  const root = checkout("test('broken', () => assert.strictEqual(f(1, 2), 'nope'));");
  const out = [];
  const { log, error } = console;
  console.log = (s) => out.push(String(s));
  console.error = () => {};
  let code;
  try {
    code = await mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js']);
  } finally {
    console.log = log; console.error = error;
  }
  assert.strictEqual(code, 1);
  assert.match(out.join('\n'), /NOT MEASURED — test\/probes\.test\.js already fails without any mutant/);
});

test('--estimate prints the cost and runs no mutant; -j splits the work', async () => {
  const root = checkout("test('both branches', () => { assert.strictEqual(f(2, 1), 'big'); assert.strictEqual(f(1, 2), 'small'); });");
  const out = [];
  const code = await mc.main(['--estimate', '--root', root, '--only', 'scripts/lib/probes.js'], (s) => out.push(String(s)));
  assert.strictEqual(code, 0);
  assert.match(out.join('\n'), /3 mutants × \d+s ÷ \d+ ≈ \d+s/, 'the estimate names the count, the measured cost and the split');
  assert.doesNotMatch(out.join('\n'), /killed/, 'nothing was measured');
});

test('--since measures only what changed, and an unknown ref measures everything', () => {
  const targets = [
    { file: 'a.js', tests: ['test/a.test.js'] },
    { file: 'b.js', tests: ['test/b.test.js'] },
  ];
  assert.strictEqual(mc.changedSince(os.tmpdir(), 'HEAD', targets), null, 'not a repository: no opinion');
  const root = path.join(__dirname, '..');
  const changed = mc.changedSince(root, 'HEAD', mc.TARGETS);
  assert.ok(Array.isArray(changed), 'inside a repository it answers');
  assert.ok(changed.every((t) => mc.TARGETS.includes(t)));
});

test('an equivalent recorded against an older file is reported as needing a re-check', async () => {
  const root = checkout("test('returns a string', () => assert.strictEqual(typeof f(1, 2), 'string'));");
  const survivors = [
    { file: 'scripts/lib/probes.js', op: '> → <=', from: "module.exports = (a, b) => { if (a > b) return 'big'; return 'small'; };", to: "module.exports = (a, b) => { if (a <= b) return 'big'; return 'small'; };", reason: 'it cannot', fileHash: 'deadbeefcafe' },
  ];
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'scripts', 'mutation-equivalents.json'), JSON.stringify(survivors, null, 2));
  const out = [];
  const code = await mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'], (s) => out.push(String(s)));
  assert.match(out.join('\n'), /RE-CHECK/);
  assert.match(out.join('\n'), /accepted against an older version/);
  assert.strictEqual(code, 1, 'a stale equivalent fails --check');
});

test('--stamp writes the current hash into every equivalent', async () => {
  const root = checkout("test('x', () => assert.ok(f));");
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  const file = path.join(root, 'scripts', 'mutation-equivalents.json');
  fs.writeFileSync(file, JSON.stringify([{ file: 'scripts/lib/probes.js', op: 'x', from: 'y', to: 'z', reason: 'r' }], null, 2));
  await mc.main(['--stamp', '--root', root], () => {});
  const stamped = JSON.parse(fs.readFileSync(file, 'utf8'))[0];
  assert.strictEqual(stamped.fileHash, mc.hashOf(fs.readFileSync(path.join(root, 'scripts', 'lib', 'probes.js'), 'utf8')));
});
