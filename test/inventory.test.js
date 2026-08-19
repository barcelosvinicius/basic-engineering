'use strict';

/**
 * Same discipline as test/graph.test.js: each check is fed a KNOWN VIOLATION
 * first. A check that was never seen to fail proves nothing — and both rules
 * here already went unenforced long enough to drift (index 14% stale, one
 * undeclared naming exception).
 */

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

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
  assert.ok(inv.PREFIX_EXCEPTIONS.includes('engineering-principles'),
    'the exception must be declared in one place, not tolerated silently');
});

test('the shipped inventory is fully registered and correctly named', () => {
  const fs = require('fs');
  const skills = inv.listSkills(PLUGIN);
  const agents = inv.listAgents(PLUGIN);
  assert.ok(skills.length > 0 && agents.length > 0, 'inventory must not be empty');

  const index = fs.readFileSync(
    path.join(PLUGIN, 'skills', 'proc-session-continuity', 'resources.md'), 'utf8');
  assert.deepStrictEqual(inv.missingFromIndex(index, skills.concat(agents)), []);
  assert.deepStrictEqual(inv.badPrefixes(skills, inv.SKILL_PREFIXES), []);
  assert.deepStrictEqual(inv.badPrefixes(agents, inv.AGENT_PREFIXES), []);
});
