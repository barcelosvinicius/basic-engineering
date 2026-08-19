'use strict';

/**
 * The cycle detector is a ruler, and a ruler that was never shown to fail is
 * not evidence. Each test below feeds it a KNOWN POSITIVE case first — if the
 * detector stays silent on those, it would also stay silent on a real cycle,
 * and `npm run validate` would pass while the graph was broken.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const edges = require('../scripts/lib/edges.js');

const made = [];
process.on('exit', () => {
  for (const d of made) try { fs.rmSync(d, { recursive: true, force: true }); } catch {}
});

function fixture(skills) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-graph-'));
  made.push(dir);
  for (const [name, rows] of Object.entries(skills)) {
    fs.mkdirSync(path.join(dir, name));
    const table = rows.length
      ? ['## Activation edges', '', '| Type | Target | When |', '|---|---|---|',
         ...rows.map(([t, g]) => `| \`${t}\` | \`${g}\` | test |`)].join('\n')
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
    '## Activation edges', '',
    '| Type | Target | When |', '|---|---|---|',
    '| `invoke` | `real-target` | a real hand-off |', '',
    'Authors declare it like this:', '',
    '```markdown', '## Activation edges', '',
    '| Type | Target | When |', '|---|---|---|',
    '| `invoke` | `your-new-skill` | [the condition] |', '```', '',
  ].join('\n');
  const parsed = edges.parseEdges(doc);
  assert.deepStrictEqual(parsed.map((e) => e.target), ['real-target'],
    'the fenced example must not be parsed as an edge');
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
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'graph-audit.js'), '--check'],
    { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, `${r.stdout}${r.stderr}`);
});

test('proc-session-continuity is no longer a leaf of the graph', () => {
  const dir = path.join(__dirname, '..', 'plugins', 'be', 'skills');
  const declared = edges.collect(dir).edges.get('proc-session-continuity');
  assert.ok(declared.length >= 5, `hub declares ${declared.length} edges, expected >= 5`);
});
