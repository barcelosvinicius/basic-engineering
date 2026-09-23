'use strict';

/**
 * The permissions writer is timid on purpose: it adds what the stack declares
 * and never touches what the project already decided. Each rule below is fed
 * the case that must change something and the neighbour that must not.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { fixture, runScript } = require('./helpers.js');

const perms = require('../plugins/be/scripts/permissions.js');
const { loadMappings, detectStacks } = require('../plugins/be/scripts/_stacks.js');
const mappings = loadMappings(path.join(__dirname, '..', 'plugins', 'be', 'scripts'));

const project = (files) => fixture(files, 'be-perms-');
const settingsOf = (root) => JSON.parse(fs.readFileSync(path.join(root, '.claude', 'settings.json'), 'utf8'));
const apply = (root, opts) => perms.apply(root, detectStacks(root, mappings), opts);

test('a stack with no settings file gets the file, with its allow and deny', () => {
  const root = project({ 'pom.xml': '<project/>' });
  const r = apply(root);
  assert.deepStrictEqual(r.stacks, ['java-maven']);
  const s = settingsOf(root);
  assert.ok(s.permissions.allow.includes('mvn test'));
  assert.ok(s.permissions.deny.includes('mvn deploy'));
  assert.strictEqual(r.existed, false);
});

test('what the project already decided is never changed, and its deny beats our allow', () => {
  const root = project({
    'pom.xml': '<project/>',
    '.claude/settings.json': JSON.stringify(
      {
        model: 'opus',
        permissions: { allow: ['mvn test', 'gh pr list'], deny: ['mvn -q *'] },
      },
      null,
      2
    ),
  });
  apply(root);
  const s = settingsOf(root);
  assert.strictEqual(s.model, 'opus', 'unrelated settings survive');
  assert.deepStrictEqual(
    s.permissions.allow.filter((x) => x === 'mvn test'),
    ['mvn test'],
    'no duplicate'
  );
  assert.ok(s.permissions.allow.includes('gh pr list'), 'their own entry stays');
  assert.ok(!s.permissions.allow.includes('mvn -q *'), 'a rule they deny is never added to allow');
  assert.ok(s.permissions.deny.includes('mvn deploy'));
});

test('a second run adds nothing — and says so', () => {
  const root = project({ 'pom.xml': '<project/>' });
  apply(root);
  const before = fs.readFileSync(path.join(root, '.claude', 'settings.json'), 'utf8');
  const again = apply(root);
  assert.ok(again.unchanged);
  assert.match(perms.report(again), /nothing to add/);
  assert.strictEqual(
    fs.readFileSync(path.join(root, '.claude', 'settings.json'), 'utf8'),
    before,
    'the file is byte-identical'
  );
});

test('a dry run writes nothing, and reports exactly what it would add', () => {
  const root = project({ 'package.json': '{}', 'tsconfig.json': '{}' });
  const r = apply(root, { dryRun: true });
  assert.ok(!fs.existsSync(path.join(root, '.claude', 'settings.json')));
  assert.ok(r.added.allow.length > 0);
  assert.match(perms.report(r), /\(dry run\).*node-typescript/s);
});

test('a settings file that does not parse is left untouched, with the reason', () => {
  const root = project({ 'pom.xml': '<project/>', '.claude/settings.json': '{ not json' });
  const before = fs.readFileSync(path.join(root, '.claude', 'settings.json'), 'utf8');
  const r = apply(root);
  assert.match(r.skipped, /does not parse/);
  assert.strictEqual(fs.readFileSync(path.join(root, '.claude', 'settings.json'), 'utf8'), before);
  assert.match(perms.report(r), /NOT APPLIED/);
  const list = project({ 'pom.xml': '<project/>', '.claude/settings.json': '[]' });
  assert.match(apply(list).skipped, /not a JSON object/);
});

test('no stack detected means no change — never an empty permissions block', () => {
  const root = project({ 'README.md': '# x' });
  const r = apply(root);
  assert.match(r.skipped, /no stack detected/);
  assert.ok(!fs.existsSync(path.join(root, '.claude')));
  assert.match(perms.report(r), /NOT APPLIED/);
});

test('the plan is computed from the settings it is given, not from disk', () => {
  const java = mappings.stacks.filter((s) => s.id === 'java-maven');
  assert.deepStrictEqual(perms.plan({}, java).deny, ['mvn deploy', 'mvn release:*']);
  assert.deepStrictEqual(perms.plan({ permissions: { deny: ['mvn deploy'] } }, java).deny, ['mvn release:*']);
  assert.deepStrictEqual(
    perms.plan({ permissions: 'nonsense' }, java).allow,
    ['mvn test', 'mvn -q *'],
    'a malformed block is read as empty'
  );
  assert.deepStrictEqual(perms.plan({}, []).allow, []);
});

test('as a CLI it runs, exits 0 and touches nothing on --dry-run', () => {
  const root = project({ 'pom.xml': '<project/>' });
  const script = path.join(__dirname, '..', 'plugins', 'be', 'scripts', 'permissions.js');
  const r = runScript('plugins/be/scripts/permissions.js', { args: ['--root', root, '--dry-run'] });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /dry run/);
  assert.ok(!fs.existsSync(path.join(root, '.claude')));
  const required = require('node:child_process').spawnSync(
    process.execPath,
    ['-e', `require(${JSON.stringify(script)})`],
    { encoding: 'utf8' }
  );
  assert.strictEqual(required.stdout, '', 'requiring the module runs nothing');
});

// Added after the mutation pass (43 of 48): the shapes a settings file can take
// that are neither a usable object nor an obvious error.
test('null, and a permissions block that is null or a string, are read without throwing', () => {
  const root = project({ 'pom.xml': '<project/>', '.claude/settings.json': 'null' });
  assert.match(apply(root).skipped, /not a JSON object/);
  const java = mappings.stacks.filter((s) => s.id === 'java-maven');
  assert.deepStrictEqual(perms.plan({ permissions: null }, java).allow, ['mvn test', 'mvn -q *']);
  assert.deepStrictEqual(perms.plan({ permissions: 'nonsense' }, java).deny, ['mvn deploy', 'mvn release:*']);
  assert.deepStrictEqual(perms.plan({ permissions: { allow: 'not an array' } }, java).allow, ['mvn test', 'mvn -q *']);
});

test('an existing settings file is reported as existing, and a null permissions block is replaced, not merged into', () => {
  const root = project({
    'pom.xml': '<project/>',
    '.claude/settings.json': JSON.stringify({ permissions: null, model: 'opus' }),
  });
  const r = apply(root);
  assert.strictEqual(r.existed, true, 'the file was already there');
  const s = settingsOf(root);
  assert.ok(Array.isArray(s.permissions.allow) && s.permissions.allow.includes('mvn test'));
  assert.strictEqual(s.model, 'opus');
});

test('--root is read as a flag with a value; without it the working directory is used', () => {
  const root = project({ 'pom.xml': '<project/>' });
  const { log } = console;
  const out = [];
  console.log = (s) => out.push(String(s));
  try {
    perms.main(['--dry-run'], root);
  } finally {
    console.log = log;
  }
  assert.match(out.join('\n'), /java-maven/, 'no --root: the working directory given to main');
});

test('a permissions block that is a string is replaced by a real one, not spread into keys', () => {
  const root = project({
    'pom.xml': '<project/>',
    '.claude/settings.json': JSON.stringify({ permissions: 'nonsense' }),
  });
  apply(root);
  const s = settingsOf(root);
  assert.deepStrictEqual(Object.keys(s.permissions).sort(), ['allow', 'deny'], 'no stray keys from spreading a string');
  assert.ok(s.permissions.allow.includes('mvn test'));
});
