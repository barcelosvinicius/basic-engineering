'use strict';

/**
 * Same discipline as test/graph.test.js: each check is fed a KNOWN VIOLATION
 * first. A check that was never seen to fail proves nothing — and both rules
 * here already went unenforced long enough to drift (index 14% stale, one
 * undeclared naming exception).
 */

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const inv = require('../scripts/lib/inventory.js');
const PLUGIN = path.join(__dirname, '..', 'plugins', 'be');

test('KNOWN POSITIVE: an unregistered name is reported', () => {
  const index = 'Registered: `alpha` and `beta`.';
  assert.deepStrictEqual(inv.missingFromIndex(index, ['alpha', 'beta', 'gamma']), ['gamma']);
});

test('KNOWN POSITIVE: a partial-word match does not count as registered', () => {
  // "proc-adr" must not be satisfied by the presence of "proc-adr-extended"
  const index = 'See `proc-adr-extended` for details.';
  assert.deepStrictEqual(inv.missingFromIndex(index, ['proc-adr']), ['proc-adr']);
});

test('KNOWN POSITIVE: a skill outside the declared prefixes is reported', () => {
  assert.deepStrictEqual(inv.badPrefixes(['zzz-test', 'proc-ok'], inv.SKILL_PREFIXES), ['zzz-test']);
});

test('a declared exception passes the prefix rule', () => {
  assert.deepStrictEqual(inv.badPrefixes(['engineering-principles'], inv.SKILL_PREFIXES), []);
  assert.ok(
    inv.PREFIX_EXCEPTIONS.includes('engineering-principles'),
    'the exception must be declared in one place, not tolerated silently'
  );
});

test('KNOWN POSITIVE: a stale count in a manifest description is reported', () => {
  // This one drifted in public: both manifests still said "28 skills" three
  // commits after the 29th landed, because the count check read only the three
  // root documents. A manifest description is the marketplace listing.
  const pluginJson = { description: 'Engineering base: 28 skills, 15 specialized agents.' };
  const marketplace = { plugins: [{ description: 'Engineering base: 28 skills, 15 agents.' }] };
  const actual = { skills: 29, agents: 15, commands: 11 };

  for (const json of [pluginJson, marketplace]) {
    const claims = inv.manifestDescriptions(json).flatMap((t) => inv.wrongCounts(t, actual));
    assert.deepStrictEqual(claims, [{ claimed: 28, kind: 'skills', real: 29 }]);
  }
});

test('the shipped manifests claim the inventory they actually ship', () => {
  const actual = {
    skills: inv.listSkills(PLUGIN).length,
    agents: inv.listAgents(PLUGIN).length,
    commands: require('node:fs')
      .readdirSync(path.join(PLUGIN, 'commands'))
      .filter((f) => f.endsWith('.md')).length,
  };
  for (const rel of [
    path.join(PLUGIN, '.claude-plugin', 'plugin.json'),
    path.join(__dirname, '..', '.claude-plugin', 'marketplace.json'),
  ]) {
    const json = JSON.parse(require('node:fs').readFileSync(rel, 'utf8'));
    for (const text of inv.manifestDescriptions(json)) {
      assert.deepStrictEqual(inv.wrongCounts(text, actual), [], `${rel}: ${text}`);
    }
  }
});

test('KNOWN POSITIVE: a backticked name that resolves to nothing is reported', () => {
  const known = new Set(['qa-security-reviewer']);
  const doc = 'Delegate to `qa-security-reviewer`, never to `qa-security-auditor`.';
  assert.deepStrictEqual(inv.danglingRefs(doc, known), ['qa-security-auditor']);
});

test('a name inside a code fence is an example, not a reference', () => {
  const doc = [
    'Real: `qa-security-reviewer`.',
    '',
    '```markdown',
    '| `invoke` | `your-new-skill` | condition |',
    '```',
  ].join('\n');
  assert.deepStrictEqual(inv.danglingRefs(doc, new Set(['qa-security-reviewer'])), []);
});

test('declared reference exceptions are hypothetical names, not ghosts', () => {
  const doc = 'Good names: `be-caching-patterns`, `proc-incident-response`.';
  assert.deepStrictEqual(inv.danglingRefs(doc, new Set()), []);
  assert.ok(inv.REFERENCE_EXCEPTIONS.length > 0);
});

test('KNOWN POSITIVE: a stale count asserted in prose is reported', () => {
  const bad = inv.wrongCounts('The base ships 28 skills and 15 agents.', { skills: 29, agents: 15, commands: 11 });
  assert.deepStrictEqual(bad, [{ claimed: 28, kind: 'skills', real: 29 }]);
});

test('the shipped inventory is fully registered and correctly named', () => {
  const fs = require('node:fs');
  const skills = inv.listSkills(PLUGIN);
  const agents = inv.listAgents(PLUGIN);
  assert.ok(skills.length > 0 && agents.length > 0, 'inventory must not be empty');

  const index = fs.readFileSync(path.join(PLUGIN, 'skills', 'proc-session-continuity', 'resources.md'), 'utf8');
  assert.deepStrictEqual(inv.missingFromIndex(index, skills.concat(agents)), []);
  assert.deepStrictEqual(inv.badPrefixes(skills, inv.SKILL_PREFIXES), []);
  assert.deepStrictEqual(inv.badPrefixes(agents, inv.AGENT_PREFIXES), []);

  // No document in the plugin points at a name that does not exist.
  const known = new Set(skills.concat(agents));
  for (const s of skills) {
    const body = fs.readFileSync(path.join(PLUGIN, 'skills', s, 'SKILL.md'), 'utf8');
    assert.deepStrictEqual(inv.danglingRefs(body, known), [], `skills/${s}`);
  }
  for (const dir of ['agents', 'commands']) {
    for (const f of fs.readdirSync(path.join(PLUGIN, dir)).filter((x) => x.endsWith('.md'))) {
      const body = fs.readFileSync(path.join(PLUGIN, dir, f), 'utf8');
      assert.deepStrictEqual(inv.danglingRefs(body, known), [], `${dir}/${f}`);
    }
  }
});

// Added after the first mutation pass (2026-09-22): a manifest is external
// input, and none of its odd shapes had a test.
test('manifestDescriptions reads only string descriptions, whatever the manifest shape', () => {
  assert.deepStrictEqual(inv.manifestDescriptions(null), []);
  assert.deepStrictEqual(inv.manifestDescriptions({ description: 42 }), []);
  assert.deepStrictEqual(inv.manifestDescriptions({ plugins: [null, {}, { description: 7 }, { description: 'x' }] }), [
    'x',
  ]);
});

// The README table said 28 skills and 15 agents for weeks while the prose and
// the manifests were right: the guard only ever looked for "N skills", and the
// table writes the number in its own column.
test('a count is caught in both shapes: the prose and the table column', () => {
  const actual = { skills: 31, agents: 18, commands: 11 };
  assert.deepStrictEqual(inv.wrongCounts('the base ships 31 skills today', actual), []);
  assert.deepStrictEqual(inv.wrongCounts('| **Skills** | 31 | what it is |', actual), []);
  assert.deepStrictEqual(inv.wrongCounts('| **Skills** | 28 | what it is |', actual), [
    { claimed: 28, kind: 'skills', real: 31 },
  ]);
  assert.deepStrictEqual(
    inv.wrongCounts('| **Agents** | 15 |', actual).map((b) => `${b.kind}:${b.claimed}!=${b.real}`),
    ['agents:15!=18']
  );
  assert.deepStrictEqual(
    inv.wrongCounts('| **Doc templates** | 11 |', actual),
    [],
    'a row this guard knows nothing about'
  );
});
