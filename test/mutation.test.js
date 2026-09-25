'use strict';

/**
 * The mutation pass is itself a measurement, so it gets what every ruler here
 * gets: a known case that must make it fail, and its mirror that must pass.
 * The known case is the shape of A-14 — a suite that runs every line and still
 * notices nothing — shrunk to one function.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const mc = require('../scripts/mutation-check.js');
const { quiet } = require('./helpers.js');

test('mutants are made only in code — never inside a comment, a string or a regex literal', () => {
  const src = [
    '// if (a === b) a comment',
    'const s = "a && b"; const re = /x || y/;',
    'if (a === b && !c) return true;',
  ].join('\n');
  const found = mc.mutants(src);
  assert.ok(
    found.every((m) => m.line === 3),
    'lines 1 and 2 hold no code operator'
  );
  assert.deepStrictEqual(
    found.map((m) => m.op),
    ['=== → !==', '&& → ||', 'true → false', '! → (removed)', 'condition → true', 'condition → false']
  );
});

/** A throwaway checkout holding one target module and the test that guards it. */
function checkout(testBody) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'be-mutation-fixture-'));
  fs.mkdirSync(path.join(root, 'scripts', 'lib'), { recursive: true });
  fs.mkdirSync(path.join(root, 'test'));
  fs.writeFileSync(
    path.join(root, 'scripts', 'lib', 'probes.js'),
    "module.exports = (a, b) => { if (a > b) return 'big'; return 'small'; };\n"
  );
  fs.writeFileSync(
    path.join(root, 'test', 'probes.test.js'),
    "const { test } = require('node:test'); const assert = require('node:assert');\n" +
      "const f = require('../scripts/lib/probes.js');\n" +
      testBody +
      '\n'
  );
  return root;
}

test('known case: a suite that runs the line but checks nothing fails --check', async () => {
  const root = checkout("test('returns a string', () => assert.strictEqual(typeof f(1, 2), 'string'));");
  assert.strictEqual(await quiet(() => mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'])), 1);
});

// The known case alone passed while the tool was broken: run inside a test
// runner, every mutant survived, so "1" came out for the wrong reason. The
// mirror below is what caught it — a ruler is only proven by both directions.

test('mirror: a suite that pins both branches kills every mutant and passes --check', async () => {
  const root = checkout(
    "test('both branches', () => { assert.strictEqual(f(2, 1), 'big'); assert.strictEqual(f(1, 2), 'small'); });"
  );
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
    console.log = log;
    console.error = error;
  }
  assert.strictEqual(code, 1);
  assert.match(out.join('\n'), /NOT MEASURED — test\/probes\.test\.js already fails without any mutant/);
});

test('--estimate prints the cost and runs no mutant; -j splits the work', async () => {
  const root = checkout(
    "test('both branches', () => { assert.strictEqual(f(2, 1), 'big'); assert.strictEqual(f(1, 2), 'small'); });"
  );
  const out = [];
  const code = await mc.main(['--estimate', '--root', root, '--only', 'scripts/lib/probes.js'], (s) =>
    out.push(String(s))
  );
  assert.strictEqual(code, 0);
  assert.match(
    out.join('\n'),
    /3 mutants × \d+s ÷ \d+ ≈ \d+s/,
    'the estimate names the count, the measured cost and the split'
  );
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
    {
      file: 'scripts/lib/probes.js',
      op: '> → <=',
      from: "module.exports = (a, b) => { if (a > b) return 'big'; return 'small'; };",
      to: "module.exports = (a, b) => { if (a <= b) return 'big'; return 'small'; };",
      reason: 'it cannot',
      fileHash: 'deadbeefcafe',
    },
  ];
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'scripts', 'mutation-equivalents.json'), JSON.stringify(survivors, null, 2));
  const out = [];
  const code = await mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'], (s) =>
    out.push(String(s))
  );
  assert.match(out.join('\n'), /RE-CHECK/);
  assert.match(out.join('\n'), /accepted against an older version/);
  assert.strictEqual(code, 1, 'a stale equivalent fails --check');
});

test('--stamp writes the current hash into every equivalent', async () => {
  const root = checkout("test('x', () => assert.ok(f));");
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  const file = path.join(root, 'scripts', 'mutation-equivalents.json');
  fs.writeFileSync(
    file,
    JSON.stringify([{ file: 'scripts/lib/probes.js', op: 'x', from: 'y', to: 'z', reason: 'r' }], null, 2)
  );
  await mc.main(['--stamp', '--root', root], () => {});
  const stamped = JSON.parse(fs.readFileSync(file, 'utf8'))[0];
  assert.strictEqual(
    stamped.fileHash,
    mc.hashOf(fs.readFileSync(path.join(root, 'scripts', 'lib', 'probes.js'), 'utf8'))
  );
});

// 138 whole-repository copies were found on this machine, left by runs that were
// interrupted before their cleanup. The next run sweeps them, by age, so a copy
// another run is using is never touched.
test('copies left by an interrupted run are swept by age, and fresh ones are left alone', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-sweep-'));
  const old = path.join(dir, 'be-mutation-old');
  const fresh = path.join(dir, 'be-mutation-fresh');
  const foreign = path.join(dir, 'someone-elses-dir');
  for (const d of [old, fresh, foreign]) fs.mkdirSync(d);
  const twoHours = 2 * 60 * 60 * 1000;
  fs.utimesSync(old, new Date(Date.now() - twoHours * 2), new Date(Date.now() - twoHours * 2));
  assert.strictEqual(mc.sweepLeftovers(dir, twoHours), 1);
  assert.ok(!fs.existsSync(old), 'the old copy is gone');
  assert.ok(fs.existsSync(fresh), 'a fresh one may be in use');
  assert.ok(fs.existsSync(foreign), 'nothing else is touched');
  assert.strictEqual(mc.sweepLeftovers(path.join(dir, 'does-not-exist')), 0, 'a missing directory is not an error');
});

// ── Safe selection: the closure, the ledger, and the roster (Phase 10) ───────

// Selecting by "did this file change" under-measures, and this repository shows
// the shape: pre-tooluse.js requires _gateguard.js and _lib.js, so a change to
// _lib.js can turn a killed mutant of pre-tooluse.js into a survivor while
// pre-tooluse.js itself is untouched.
test('the closure follows what a target transitively requires, and reports what it cannot resolve', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'be-closure-'));
  fs.mkdirSync(path.join(root, 'a', 'b'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'a', 'top.js'),
    "require('./mid.js');\nrequire('./b/data.json');\nrequire('./gone.js');\n"
  );
  fs.writeFileSync(path.join(root, 'a', 'mid.js'), "require('./leaf');\n");
  fs.writeFileSync(path.join(root, 'a', 'leaf.js'), 'module.exports = 1;\n');
  fs.writeFileSync(path.join(root, 'a', 'b', 'data.json'), '{}');

  const { files, unresolved } = mc.closureOf(root, 'a/top.js');
  assert.deepStrictEqual(
    [...files].sort(),
    ['a/b/data.json', 'a/leaf.js', 'a/mid.js', 'a/top.js'],
    'transitive, and data files count'
  );
  assert.deepStrictEqual(unresolved, ['a/top.js → ./gone.js'], 'what it cannot resolve is named, not assumed away');
  assert.deepStrictEqual([...mc.closureOf(root, 'a/leaf.js').files], ['a/leaf.js'], 'a leaf is its own closure');
  assert.deepStrictEqual(
    [...mc.closureOf(root, 'does/not/exist.js').files],
    ['does/not/exist.js'],
    'a missing file does not throw'
  );
});

test('a cycle in the requires terminates instead of recursing forever', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'be-cycle-'));
  fs.writeFileSync(path.join(root, 'x.js'), "require('./y.js');\n");
  fs.writeFileSync(path.join(root, 'y.js'), "require('./x.js');\n");
  assert.deepStrictEqual([...mc.closureOf(root, 'x.js').files].sort(), ['x.js', 'y.js']);
});

// A recorded result may be inherited only while the code it describes has not
// moved -- the same rule the equivalents already follow, one level up.
test('a ledger entry expires when the target, its tests, or anything in its closure changes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'be-ledger-'));
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'test'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'a.js'), "require('./dep.js');\n");
  fs.writeFileSync(path.join(root, 'src', 'dep.js'), 'module.exports = 1;\n');
  fs.writeFileSync(path.join(root, 'test', 'a.test.js'), 'test\n');
  const target = { file: 'src/a.js', tests: ['test/a.test.js'] };

  const entry = { killed: 5, total: 5, fingerprint: mc.fingerprint(root, target) };
  assert.ok(mc.ledgerHolds(entry, mc.fingerprint(root, target)), 'nothing moved: the record still describes the code');

  fs.writeFileSync(path.join(root, 'src', 'dep.js'), 'module.exports = 2;\n');
  assert.ok(
    !mc.ledgerHolds(entry, mc.fingerprint(root, target)),
    'a DEPENDENCY moved, and src/a.js did not — this is the case a file-only check misses'
  );

  fs.writeFileSync(path.join(root, 'src', 'dep.js'), 'module.exports = 1;\n');
  fs.writeFileSync(path.join(root, 'test', 'a.test.js'), 'test changed\n');
  assert.ok(!mc.ledgerHolds(entry, mc.fingerprint(root, target)), 'the tests moved');

  fs.writeFileSync(path.join(root, 'test', 'a.test.js'), 'test\n');
  fs.writeFileSync(path.join(root, 'src', 'a.js'), "require('./dep.js');\n// edit\n");
  assert.ok(!mc.ledgerHolds(entry, mc.fingerprint(root, target)), 'the target itself moved');

  assert.ok(!mc.ledgerHolds(undefined, mc.fingerprint(root, target)), 'no record at all is not a pass');
  assert.ok(!mc.ledgerHolds({ killed: 5 }, mc.fingerprint(root, target)), 'a record with no fingerprint is not a pass');
});

// Measured three times on 2026-09-23/24: a run killed mid-pass left nine tick
// lines and two targets carrying only their start marker, and counting the
// ticks read as green. A pass that cannot finish must be unable to look finished.
test('a run that leaves a target without a verdict says so and fails --check', async () => {
  const root = checkout(
    "test('both branches', () => { assert.strictEqual(f(2, 1), 'big'); assert.strictEqual(f(1, 2), 'small'); });"
  );
  const out = [];
  const code = await mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'], (s) =>
    out.push(String(s))
  );
  assert.strictEqual(code, 0);
  assert.match(
    out.join('\n'),
    /1 of 1 target\(s\) in scope accounted for — 1 measured now, 0 inherited, 0 without a verdict/
  );

  // Now delete the suite: the target is in scope, and nothing can measure it.
  fs.rmSync(path.join(root, 'test', 'probes.test.js'));
  const out2 = [];
  const code2 = await mc.main(['--check', '--root', root, '--only', 'scripts/lib/probes.js'], (s) =>
    out2.push(String(s))
  );
  assert.match(out2.join('\n'), /0 of 1 target\(s\) in scope accounted for/);
  assert.match(out2.join('\n'), /NO VERDICT/);
  assert.strictEqual(code2, 1, 'a target with no verdict cannot be reported as green');
});
