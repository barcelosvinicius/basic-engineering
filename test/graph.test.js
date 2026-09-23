'use strict';

/**
 * The cycle detector is a ruler, and a ruler that was never shown to fail is
 * not evidence. Each test below feeds it a KNOWN POSITIVE case first — if the
 * detector stays silent on those, it would also stay silent on a real cycle,
 * and `npm run validate` would pass while the graph was broken.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const edges = require('../scripts/lib/edges.js');

const made = [];
process.on('exit', () => {
  for (const d of made)
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {}
});

function fixture(skills) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-graph-'));
  made.push(dir);
  for (const [name, rows] of Object.entries(skills)) {
    fs.mkdirSync(path.join(dir, name));
    const table = rows.length
      ? [
          '## Activation edges',
          '',
          '| Type | Target | When |',
          '|---|---|---|',
          ...rows.map(([t, g]) => `| \`${t}\` | \`${g}\` | test |`),
        ].join('\n')
      : '# no edges declared';
    fs.writeFileSync(path.join(dir, name, 'SKILL.md'), `---\nname: ${name}\n---\n\n${table}\n`);
  }
  return dir;
}

test('KNOWN POSITIVE: a two-node invoke cycle is detected', () => {
  const dir = fixture({ a: [['invoke', 'b']], b: [['invoke', 'a']] });
  const { edges: g } = edges.collect(dir);
  const cycles = edges.findInvokeCycles(g);
  assert.strictEqual(cycles.length, 1, 'detector must report the planted cycle');
  assert.deepStrictEqual([...cycles[0]].slice(0, -1).sort(), ['a', 'b']);
});

test('KNOWN POSITIVE: a three-node invoke cycle is detected', () => {
  const dir = fixture({ a: [['invoke', 'b']], b: [['invoke', 'c']], c: [['invoke', 'a']] });
  const cycles = edges.findInvokeCycles(edges.collect(dir).edges);
  assert.strictEqual(cycles.length, 1);
});

test('KNOWN POSITIVE: an edge to a skill that does not exist is reported', () => {
  const dir = fixture({ a: [['invoke', 'ghost']] });
  const { skills, edges: g } = edges.collect(dir);
  assert.deepStrictEqual(edges.findUnknownTargets(skills, g), [{ from: 'a', target: 'ghost' }]);
});

test('typing matters: a consult loop is NOT a cycle', () => {
  const dir = fixture({ a: [['consult', 'b']], b: [['consult', 'a']] });
  assert.deepStrictEqual(edges.findInvokeCycles(edges.collect(dir).edges), []);
});

test('a skill with no Activation edges section contributes no edges', () => {
  const dir = fixture({ a: [], b: [['invoke', 'a']] });
  const { edges: g } = edges.collect(dir);
  assert.deepStrictEqual(g.get('a'), []);
  assert.deepStrictEqual(edges.findInvokeCycles(g), []);
});

test('KNOWN POSITIVE: an example table inside a code fence is not a declaration', () => {
  const doc = [
    '## Activation edges',
    '',
    '| Type | Target | When |',
    '|---|---|---|',
    '| `invoke` | `real-target` | a real hand-off |',
    '',
    'Authors declare it like this:',
    '',
    '```markdown',
    '## Activation edges',
    '',
    '| Type | Target | When |',
    '|---|---|---|',
    '| `invoke` | `your-new-skill` | [the condition] |',
    '```',
    '',
  ].join('\n');
  const parsed = edges.parseEdges(doc);
  assert.deepStrictEqual(
    parsed.map((e) => e.target),
    ['real-target'],
    'the fenced example must not be parsed as an edge'
  );
});

test('the shipped plugin graph is acyclic and points only at real skills', () => {
  const dir = path.join(__dirname, '..', 'plugins', 'be', 'skills');
  const { skills, edges: g } = edges.collect(dir);
  assert.deepStrictEqual(edges.findInvokeCycles(g), []);
  assert.deepStrictEqual(edges.findUnknownTargets(skills, g), []);
});

test('docs/structural-analysis.md §0.2 still matches the measured graph', () => {
  // The fact panel is only worth something if something re-runs it. Advancing on
  // several fronts at once is exactly when a hand-kept count goes quietly stale.
  const { spawnSync } = require('node:child_process');
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'graph-audit.js'), '--check'], {
    encoding: 'utf8',
  });
  assert.strictEqual(r.status, 0, `${r.stdout}${r.stderr}`);
});

// KNOWN POSITIVE first: a panel deliberately broken must be repaired by --write,
// otherwise the test would pass on a --write that does nothing at all. The file
// is restored either way, including when an assertion throws.
test('--write repairs a stale fact panel, and refuses a file it cannot place it in', () => {
  const { spawnSync } = require('node:child_process');
  const script = path.join(__dirname, '..', 'scripts', 'graph-audit.js');
  const doc = path.join(__dirname, '..', 'docs', 'structural-analysis.md');
  const run = (...a) => spawnSync(process.execPath, [script, ...a], { encoding: 'utf8' });
  const original = fs.readFileSync(doc, 'utf8');
  try {
    fs.writeFileSync(
      doc,
      original.replace(
        /\| Skills · agents · commands \| \*\*[^|]+\*\* \|/,
        '| Skills · agents · commands | **1 · 1 · 1** |'
      )
    );
    assert.notStrictEqual(run('--check').status, 0, '--check stayed green on a panel that was edited to lie');
    assert.strictEqual(run('--write').status, 0);
    assert.strictEqual(run('--check').status, 0, '--write ran but left the panel stale');

    // No marker, no guessing where the block belongs.
    fs.writeFileSync(doc, original.replace(/^<!-- generated by scripts\/graph-audit\.js[^\n]*$/m, ''));
    assert.notStrictEqual(run('--write').status, 0, '--write invented a location for the block');
  } finally {
    fs.writeFileSync(doc, original);
  }
});

test('proc-session-continuity is no longer a leaf of the graph', () => {
  const dir = path.join(__dirname, '..', 'plugins', 'be', 'skills');
  const declared = edges.collect(dir).edges.get('proc-session-continuity');
  assert.ok(declared.length >= 5, `hub declares ${declared.length} edges, expected >= 5`);
});

// Added after the first mutation pass (2026-09-22).
test('the edges section ends at the next ## heading — a table row after it is not an edge', () => {
  const md =
    '## Activation edges\n\n| Type | Target | When |\n|---|---|---|\n| `invoke` | `a` | x |\n\n## Other\n\n| `invoke` | `b` | y |\n';
  assert.deepStrictEqual(
    edges.parseEdges(md).map((e) => e.target),
    ['a']
  );
});

test('a cycle is reported once, even when an edge is declared twice, and in walk order', () => {
  const row = (t) => ({ type: 'invoke', target: t, when: '' });
  const g = new Map([
    ['a', [row('b')]],
    ['b', [row('c')]],
    ['c', [row('a'), row('a')]],
  ]);
  assert.deepStrictEqual(edges.findInvokeCycles(g), [['a', 'b', 'c', 'a']]);
});
