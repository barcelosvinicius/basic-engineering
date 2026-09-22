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

function quiet(fn) {
  const { log, error } = console;
  console.log = console.error = () => {};
  try { return fn(); } finally { console.log = log; console.error = error; }
}

test('known case: a suite that runs the line but checks nothing fails --check', () => {
  const root = checkout("test('returns a string', () => assert.strictEqual(typeof f(1, 2), 'string'));");
  assert.strictEqual(quiet(() => mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'])), 1);
});

// The known case alone passed while the tool was broken: run inside a test
// runner, every mutant survived, so "1" came out for the wrong reason. The
// mirror below is what caught it — a ruler is only proven by both directions.

test('mirror: a suite that pins both branches kills every mutant and passes --check', () => {
  const root = checkout("test('both branches', () => { assert.strictEqual(f(2, 1), 'big'); assert.strictEqual(f(1, 2), 'small'); });");
  assert.strictEqual(quiet(() => mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'])), 0);
});

test('the working tree is never mutated — only the throwaway copy is', () => {
  const root = checkout("test('returns a string', () => assert.strictEqual(typeof f(1, 2), 'string'));");
  const target = path.join(root, 'scripts', 'lib', 'probes.js');
  const before = fs.readFileSync(target, 'utf8');
  quiet(() => mc.main(['--root', root, '--only', 'scripts/lib/probes.js']));
  assert.strictEqual(fs.readFileSync(target, 'utf8'), before);
});
