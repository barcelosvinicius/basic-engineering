'use strict';

/**
 * The session-start update check. No test here touches the network: the fetch
 * is injected, which is also the point — a check that cannot be exercised
 * offline would be a check nobody ever sees fail.
 *
 * What is pinned: the notice appears only when there is genuinely a newer
 * version, every number in it is derived (from the published description and
 * from what is on disk) rather than written, and every failure mode — offline,
 * malformed payload, missing plugin, opt-out — is silent rather than loud.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const uc = require('../plugins/be/hooks/scripts/_update-check.js');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'be-update-'));
}

/** A plugin copy on disk with the given inventory. */
function pluginFixture({ skills = 0, agents = 0, commands = 0, events = [] }) {
  const root = tmp();
  fs.mkdirSync(path.join(root, 'skills'), { recursive: true });
  fs.mkdirSync(path.join(root, 'agents'), { recursive: true });
  fs.mkdirSync(path.join(root, 'commands'), { recursive: true });
  fs.mkdirSync(path.join(root, 'hooks'), { recursive: true });
  for (let i = 0; i < skills; i++) {
    fs.mkdirSync(path.join(root, 'skills', `s${i}`));
    fs.writeFileSync(path.join(root, 'skills', `s${i}`, 'SKILL.md'), '#');
  }
  for (let i = 0; i < agents; i++) fs.writeFileSync(path.join(root, 'agents', `a${i}.md`), '#');
  for (let i = 0; i < commands; i++) fs.writeFileSync(path.join(root, 'commands', `c${i}.md`), '#');
  const hooks = {};
  for (const e of events) hooks[e] = [{ hooks: [{ type: 'command', command: 'node x.js' }] }];
  fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify({ hooks }));
  return root;
}

const CFG = () => path.join(tmp(), 'be-update-check.json');

test('counts are read from the published description, never assumed', () => {
  assert.deepStrictEqual(
    uc.parseCounts('Engineering base: 29 skills, 18 agents, 11 commands and hooks.'),
    { skills: 29, agents: 18, commands: 11 }
  );
  assert.deepStrictEqual(uc.parseCounts('no numbers here'), {});
  assert.deepStrictEqual(uc.parseCounts(undefined), {});
});

test('what is on disk is counted, not trusted from a manifest', () => {
  const root = pluginFixture({ skills: 25, agents: 12, commands: 7, events: ['SessionStart'] });
  assert.deepStrictEqual(uc.localCounts(root), {
    skills: 25, agents: 12, commands: 7, hookEvents: ['SessionStart'],
  });
});

test('KNOWN POSITIVE: a newer version produces a notice carrying the real delta', () => {
  // The exact case this was built for: v2.0.0 installed, 3.0.0 published.
  const root = pluginFixture({ skills: 25, agents: 12, commands: 7, events: ['SessionStart'] });
  const notice = uc.buildNotice({
    installedVersion: '2.0.0',
    latest: { version: '3.0.0', description: 'Engineering base: 29 skills, 18 agents, 11 commands.' },
    local: uc.localCounts(root),
  });
  assert.match(notice, /2\.0\.0 → 3\.0\.0/);
  assert.match(notice, /\+4 skills/);
  assert.match(notice, /\+6 agents/);
  assert.match(notice, /\+4 commands/);
  assert.match(notice, /runs 1 hook event\(s\): SessionStart/,
    'the guardrail state on this machine is local knowledge and must be stated');
  assert.match(notice, /plugin update be@basic-engineering/);
});

test('no notice when the versions match, and none when the installed one is newer', () => {
  const local = uc.localCounts(pluginFixture({ skills: 29 }));
  const latest = { version: '3.0.0', description: '29 skills' };
  assert.strictEqual(uc.buildNotice({ installedVersion: '3.0.0', latest, local }), null);
  assert.strictEqual(uc.buildNotice({ installedVersion: '3.1.0', latest, local }), null);
  assert.strictEqual(uc.buildNotice({ installedVersion: '3.0.0', latest: null, local }), null);
});

test('version comparison is numeric, not lexicographic', () => {
  assert.strictEqual(uc.isNewer('3.10.0', '3.9.0'), true, '10 > 9, though "3.10" < "3.9" as text');
  assert.strictEqual(uc.isNewer('3.0.0', '3.0.0'), false);
  assert.strictEqual(uc.isNewer('2.9.9', '3.0.0'), false);
});

test('KNOWN POSITIVE: every failure mode is silent', async () => {
  const root = pluginFixture({ skills: 1, events: ['SessionStart'] });
  const base = { pluginRoot: root, installedVersion: '2.0.0', cacheFile: CFG(), env: {} };

  assert.strictEqual(await uc.check({ ...base, fetchImpl: async () => null }), null,
    'offline or a failed request says nothing');
  assert.strictEqual(await uc.check({ ...base, fetchImpl: async () => { throw new Error('boom'); } }), null,
    'a throwing fetch must not surface');
  assert.strictEqual(await uc.check({ ...base, pluginRoot: null, fetchImpl: async () => ({ version: '9.9.9', description: '' }) }), null,
    'no plugin root, nothing to compare');
  assert.strictEqual(await uc.check({ ...base, installedVersion: null, fetchImpl: async () => ({ version: '9.9.9', description: '' }) }), null);
});

test('KNOWN POSITIVE: BE_UPDATE_CHECK=off and BE_HOOKS=off both silence it', async () => {
  const root = pluginFixture({ skills: 1 });
  const fetchImpl = async () => ({ version: '9.9.9', description: '99 skills' });
  for (const env of [{ BE_UPDATE_CHECK: 'off' }, { BE_HOOKS: 'off' }, { BE_UPDATE_CHECK: 'OFF' }]) {
    assert.strictEqual(uc.enabled(env), false);
    assert.strictEqual(
      await uc.check({ env, pluginRoot: root, installedVersion: '1.0.0', cacheFile: CFG(), fetchImpl }),
      null
    );
  }
  assert.strictEqual(uc.enabled({}), true, 'on by default');
});

test('the cache spends one request per TTL, and a stale cache is ignored', async () => {
  const root = pluginFixture({ skills: 1, events: ['SessionStart'] });
  const file = CFG();
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return { version: '3.0.0', description: '29 skills' };
  };
  const now = 1_000_000;
  const base = { env: {}, pluginRoot: root, installedVersion: '2.0.0', cacheFile: file, fetchImpl };

  assert.ok(await uc.check({ ...base, now }));
  assert.strictEqual(calls, 1);
  assert.ok(await uc.check({ ...base, now: now + 1000 }), 'still notified from cache');
  assert.strictEqual(calls, 1, 'a second session inside the TTL must not spend a request');

  await uc.check({ ...base, now: now + uc.TTL_MS + 1 });
  assert.strictEqual(calls, 2, 'past the TTL it asks again');
});

test('a corrupt cache file is treated as no cache, not as a crash', () => {
  const file = CFG();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '{not json');
  assert.strictEqual(uc.readCache(file), null);
});

test('the shipped package description carries the counts the notice reads', () => {
  // If this description stops asserting counts, the notice silently loses its
  // "what you gain" line. validate.js also fails when the counts go stale.
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const counts = uc.parseCounts(pkg.description);
  assert.ok(counts.skills && counts.agents && counts.commands,
    `package.json description must assert skills/agents/commands counts: ${pkg.description}`);
});
