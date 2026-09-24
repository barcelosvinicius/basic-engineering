'use strict';

/**
 * The entry points nothing executed.
 *
 * Measured on 2026-09-22 with coverage over the whole repository: five files
 * were loaded by no test at all — the hook dispatcher, the installer CLI, the
 * validator, the release script and the Stop hook. Their helpers were tested;
 * the wiring between them was not, which is exactly where a guard turns off
 * without a word. The dispatcher was covered with the gate work; these are the
 * rest.
 *
 * Each runs as a process, the way it really runs, in a throwaway copy.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { gitRepo, copyRepo, runScript, tmpDir } = require('./helpers.js');

const run = (script, args = [], opts = {}) => runScript(script, { args, ...opts });
// A script resolves its paths from ITS OWN location, not from the working
// directory — so running the repository's copy of it with `cwd` pointing
// elsewhere measures (and edits) the repository. Measured the hard way: a
// release dry run bumped this repo's version twice from inside a test.
const runIn = (dir, script, args = []) => runScript(script, { args, dir });

const copyOfRepo = () => copyRepo('be-entry-');
const project = (dirty = {}) =>
  gitRepo({ 'app.js': 'const a = 1;\n', 'docs/HISTORY.md': '# History\n' }, dirty, 'be-proj-');

test('the Stop hook reminds only when code changed and the living docs did not', () => {
  const dirty = project({ 'app.js': 'const a = 2;\n' });
  const reminder = run('plugins/be/hooks/scripts/stop.js', [], { cwd: dirty });
  assert.strictEqual(reminder.status, 0, 'a reminder never blocks');
  assert.match(reminder.stderr, /living docs .* were not updated/);

  const documented = project({ 'app.js': 'const a = 2;\n', 'docs/HISTORY.md': '# History\n\nupdated\n' });
  assert.strictEqual(run('plugins/be/hooks/scripts/stop.js', [], { cwd: documented }).stderr, '');

  const clean = project();
  assert.strictEqual(run('plugins/be/hooks/scripts/stop.js', [], { cwd: clean }).stderr, '');

  const off = run('plugins/be/hooks/scripts/stop.js', [], { cwd: dirty, env: { BE_HOOKS: 'off' } });
  assert.strictEqual(off.stderr, '', 'the global switch turns it off');
  const perHook = run('plugins/be/hooks/scripts/stop.js', [], {
    cwd: dirty,
    env: { BE_HOOK_SESSION_END_REMINDER: 'off' },
  });
  assert.strictEqual(perHook.stderr, '', 'and so does its own');
});

test('validate passes on this repository and fails on a planted defect — with the reason', () => {
  const green = run('scripts/validate.js');
  assert.strictEqual(green.status, 0, green.stdout + green.stderr);
  assert.match(green.stdout, /all checks passed/);

  // A skill that exists and is registered nowhere: the check added for exactly this.
  const copy = copyOfRepo();
  const resources = path.join(copy, 'plugins/be/skills/proc-session-continuity/resources.md');
  fs.writeFileSync(resources, fs.readFileSync(resources, 'utf8').replace(/^\| `qa-test-strategy`.*$/m, ''));
  const red = runIn(copy, 'scripts/validate.js');
  assert.strictEqual(red.status, 1);
  assert.match(red.stderr, /qa-test-strategy.*not registered/);

  // A count that stopped being true is a defect too.
  const copy2 = copyOfRepo();
  const readme = path.join(copy2, 'README.md');
  fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace(/\b\d+ skills\b/, '7 skills'));
  const wrongCount = runIn(copy2, 'scripts/validate.js');
  assert.strictEqual(wrongCount.status, 1);
  assert.match(wrongCount.stderr, /claims 7 skills/);
});

test('the installer CLI writes .be/, reports the version, and refuses an unknown command', () => {
  const version = run('bin/be.js', ['version']);
  assert.strictEqual(version.status, 0);
  assert.match(version.stdout, /v\d{8}-\d{6}/, 'it prints BASE_VERSION, the value the installer compares');

  const target = tmpDir('be-install-');
  const dry = run('bin/be.js', ['install', target, '--dry-run']);
  assert.strictEqual(dry.status, 0, dry.stderr);
  assert.ok(!fs.existsSync(path.join(target, '.be')), 'a dry run writes nothing');

  const done = run('bin/be.js', ['install', target]);
  assert.strictEqual(done.status, 0, done.stderr);
  for (const rel of ['skills', 'agents', 'commands', 'config', 'scripts', 'BE-GUIDE.md']) {
    assert.ok(fs.existsSync(path.join(target, '.be', rel)), `.be/${rel} was installed`);
  }

  const unknown = run('bin/be.js', ['frobnicate']);
  assert.notStrictEqual(unknown.status, 0, 'an unknown command is not a silent success');
});

test('the installer never deletes what it did not write', () => {
  const target = tmpDir('be-install2-');
  run('bin/be.js', ['install', target]);
  const mine = path.join(target, '.be', 'my-notes.md');
  fs.writeFileSync(mine, 'notes I wrote\n');
  const projectFile = path.join(target, 'IMPORTANT.md');
  fs.writeFileSync(projectFile, 'do not touch\n');
  run('bin/be.js', ['install', target]);
  assert.strictEqual(
    fs.readFileSync(mine, 'utf8'),
    'notes I wrote\n',
    'a file under .be/ that the base did not write survives'
  );
  assert.strictEqual(fs.readFileSync(projectFile, 'utf8'), 'do not touch\n');
});

// The release's heavy steps — validate, the suite, the audits, the mutation pass
// — each have their own tests, and running them again here would put six minutes
// inside `npm test`. What is tested here is the guard that must stop the release
// BEFORE any of that: Phase 1.4's, a BASE_VERSION that would not increase.
test('the release refuses a version that would not move forward, before writing anything', () => {
  const future = copyOfRepo();
  fs.writeFileSync(path.join(future, 'BASE_VERSION'), 'v29991231-235959\n');
  const before = fs.readFileSync(path.join(future, 'package.json'), 'utf8');
  const refused = runIn(future, 'scripts/release.js', ['patch', '--dry-run']);
  assert.strictEqual(refused.status, 1);
  assert.match(refused.stdout + refused.stderr, /not newer than/);
  assert.match(refused.stdout + refused.stderr, /lexicographically/, 'and it says why it matters');
  assert.strictEqual(fs.readFileSync(path.join(future, 'package.json'), 'utf8'), before, 'nothing was written');
});

// This repo wears its own hooks, and two declarations of the same thing drift.
// Written the day the config-protection fix did not reach this machine: the
// hook that fired came from the published 3.1.1 in the plugin cache, not from
// the file being edited.
test('the repo runs the hooks it ships, and validate refuses the two declarations drifting apart', () => {
  const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.claude', 'settings.json'), 'utf8'));
  const shipped = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'plugins/be/hooks/hooks.json'), 'utf8'));
  assert.deepStrictEqual(Object.keys(settings.hooks).sort(), Object.keys(shipped.hooks).sort(), 'the same events');
  assert.match(JSON.stringify(settings.hooks), /\$CLAUDE_PROJECT_DIR\/plugins\/be/, 'rooted at the working tree');
  assert.doesNotMatch(JSON.stringify(settings.hooks), /CLAUDE_PLUGIN_ROOT/, 'never at an installed copy');

  const copy = copyOfRepo();
  const drifted = JSON.parse(fs.readFileSync(path.join(copy, '.claude', 'settings.json'), 'utf8'));
  delete drifted.hooks.PreCompact;
  fs.writeFileSync(path.join(copy, '.claude', 'settings.json'), JSON.stringify(drifted, null, 2));
  const red = runIn(copy, 'scripts/validate.js');
  assert.strictEqual(red.status, 1);
  assert.match(red.stderr, /would stop running the hooks it ships/);
});

// The links exist because .claude/settings.json made this repo run its own
// hooks, and the same change told developers to disable the published plugin --
// which took the skills, agents and commands away with it.
test('dev:link points .claude at the working tree, unlinks cleanly, and never deletes a real directory', () => {
  const copy = copyOfRepo();
  const link = runIn(copy, 'scripts/dev-link.js');
  assert.strictEqual(link.status, 0, link.stderr);
  for (const name of ['skills', 'agents', 'commands']) {
    const p = path.join(copy, '.claude', name);
    assert.ok(fs.lstatSync(p).isSymbolicLink(), `.claude/${name} is a link`);
    assert.strictEqual(fs.realpathSync(p), fs.realpathSync(path.join(copy, 'plugins', 'be', name)));
  }

  assert.strictEqual(runIn(copy, 'scripts/dev-link.js', ['--remove']).status, 0);
  assert.ok(!fs.existsSync(path.join(copy, '.claude', 'skills')), 'unlinked');

  // The installer's rule, which this script must follow too.
  const mine = path.join(copy, '.claude', 'skills');
  fs.mkdirSync(mine, { recursive: true });
  fs.writeFileSync(path.join(mine, 'my-own.md'), 'files I wrote\n');
  const guarded = runIn(copy, 'scripts/dev-link.js');
  assert.match(guarded.stdout, /real directory, not a link — left untouched/);
  assert.strictEqual(fs.readFileSync(path.join(mine, 'my-own.md'), 'utf8'), 'files I wrote\n');
});

// Found in the pre-flight of the first push of v3.2.0: adopting a linter
// generated package-lock.json on a machine behind a corporate registry mirror,
// and 32 `resolved` lines carried that host's name — in a repository that had
// just scrubbed exactly that class of identifier from the tree and every commit.
test('validate refuses a lockfile that resolves packages from a private mirror', () => {
  const copy = copyOfRepo();
  const lock = path.join(copy, 'package-lock.json');
  const text = fs.readFileSync(lock, 'utf8');
  assert.doesNotMatch(text, /"resolved":\s*"https?:\/\/(?!registry\.npmjs\.org)/, 'this repo publishes only public URLs');

  fs.writeFileSync(lock, text.replace('https://registry.npmjs.org/', 'https://nexus.example.internal/repository/npm-all/'));
  const red = runIn(copy, 'scripts/validate.js');
  assert.strictEqual(red.status, 1);
  assert.match(red.stderr, /nexus\.example\.internal.*private mirror must not be published/);
});
