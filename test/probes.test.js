'use strict';

/**
 * Same discipline as test/graph.test.js and test/inventory.test.js: each rule is
 * fed a KNOWN VIOLATION first.
 *
 * The violation these tests pin is not hypothetical. The backlog probes were
 * shell one-liners, and on Windows `execSync` spawns cmd.exe, where '...' does
 * not quote: every probe containing a `|` was split into a real pipe. Five of
 * 26 probes failed for that alone, the audit reported shipped work as *not
 * started*, and the release guard that reads it refused to run — while CI, on
 * Linux, stayed green. The failure was silent, inverted, and platform-shaped.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const probes = require('../scripts/lib/probes.js');
const ROOT = path.join(__dirname, '..');

/** A throwaway directory with the given files, for the negative cases. */
function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-probes-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

test('REGRESSION: a regex alternation is a pattern, never a pipe', () => {
  // The exact probe that broke: `grep -qiE 'pin|version' …` under cmd.exe.
  const ok = probes.run(ROOT, {
    kind: 'content',
    path: 'plugins/be/mcp.recommended.json',
    re: /pin|version/i,
  });
  assert.strictEqual(ok, true,
    'an alternation must match content, not be parsed as a shell pipe');
});

test('REGRESSION: the audit runs no shell at all', () => {
  // A shell-free verdict is the whole point; importing a process spawner here
  // would restore a status that changes with the operating system.
  //
  // Written against the structural form (an actual import, an actual call), not
  // against the words: the first version of this assertion matched the header
  // comment that explains why the shell is gone, and failed on a correct fix.
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'backlog-audit.js'), 'utf8');
  assert.ok(!/require\(\s*['"]child_process['"]\s*\)/.test(src),
    'backlog-audit.js must not import child_process — use scripts/lib/probes.js predicates');
  assert.ok(!/\b(execSync|spawnSync|execFileSync)\s*\(/.test(src),
    'backlog-audit.js must not spawn a process to decide an item status');
});

test('KNOWN POSITIVE: a missing file fails, an existing one passes', () => {
  const dir = fixture({ 'there.md': 'x' });
  assert.strictEqual(probes.run(dir, { kind: 'file', path: 'there.md' }), true);
  assert.strictEqual(probes.run(dir, { kind: 'file', path: 'absent.md' }), false);
});

test('KNOWN POSITIVE: a directory is not a file, and a file is not a directory', () => {
  const dir = fixture({ 'plain.md': 'x' });
  fs.mkdirSync(path.join(dir, 'sub'));
  assert.strictEqual(probes.run(dir, { kind: 'file', path: 'sub' }), false);
  assert.strictEqual(probes.run(dir, { kind: 'dir', path: 'plain.md' }), false);
  assert.strictEqual(probes.run(dir, { kind: 'dir', path: 'sub' }), true);
});

test('KNOWN POSITIVE: everyFile fails when a single file lacks the pattern', () => {
  const dir = fixture({
    'a.md': 'model: sonnet\n',
    'b.md': 'model: opus\n',
    'c.md': 'no declaration here\n',
  });
  assert.strictEqual(
    probes.run(dir, { kind: 'everyFile', dir: '.', name: /\.md$/, re: /^model:/m }), false,
    'one undeclared file must sink the check — that is what "every" means');

  fs.writeFileSync(path.join(dir, 'c.md'), 'model: haiku\n');
  assert.strictEqual(
    probes.run(dir, { kind: 'everyFile', dir: '.', name: /\.md$/, re: /^model:/m }), true);
});

test('KNOWN POSITIVE: an empty directory does not pass vacuously', () => {
  const dir = fixture({});
  assert.strictEqual(
    probes.run(dir, { kind: 'everyFile', dir: '.', name: /\.md$/, re: /^model:/m }), false,
    'zero files satisfying a rule is an absence of evidence, not evidence');
  assert.strictEqual(probes.run(dir, { kind: 'anyFile', dir: '.', name: /\.yml$/ }), false);
});

test('a failed check still says what it looked for', () => {
  // The shell string used to double as its own documentation. Keep that.
  assert.match(probes.describe({ kind: 'file', path: 'a/b.md' }), /a\/b\.md/);
  assert.match(probes.describe({ kind: 'content', path: 'x.md', re: /pin|version/i }),
    /pin\|version/);
  assert.match(probes.describe({ kind: 'everyFile', dir: 'agents', name: /\.md$/, re: /^model:/m }),
    /agents/);
});

test('feedback/BACKLOG.md still matches what the probes measure', () => {
  // The same guard release.js runs before writing anything. Wired as a test so
  // CI catches a stale table on every push, not only at release time.
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath,
    [path.join(ROOT, 'scripts', 'backlog-audit.js'), '--check'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, `${r.stdout}${r.stderr}`);
});
