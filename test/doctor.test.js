'use strict';

/**
 * Same discipline as the other suites: every rule is fed a KNOWN VIOLATION.
 *
 * What is pinned here is a failure that stayed invisible for two months. One
 * machine ran plugin v2.0.0 — 25 skills against 29, and one hook script against
 * five — while the repository shipped 3.0.0. Hooks fail open by design, so the
 * guardrails were simply not there and every session looked normal. Plugin
 * state is per machine; the repository cannot see it, so something has to ask.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const doctor = require('../lib/doctor.js');

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'be-doctor-'));
}

/** A plugin tree declaring `events`, with only `present` scripts on disk. */
function pluginFixture(events, present) {
  const root = tmp();
  fs.mkdirSync(path.join(root, 'hooks', 'scripts'), { recursive: true });
  const hooks = {};
  for (const [event, script] of Object.entries(events)) {
    hooks[event] = [{ hooks: [{ type: 'command', command: `node "\${CLAUDE_PLUGIN_ROOT}/hooks/scripts/${script}"` }] }];
  }
  fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify({ hooks }));
  for (const s of present) fs.writeFileSync(path.join(root, 'hooks', 'scripts', s), '// x');
  return root;
}

test('hook scripts are resolved through ${CLAUDE_PLUGIN_ROOT}, which no shell expands', () => {
  const root = pluginFixture({ SessionStart: 'a.js', Stop: 'b.js' }, ['a.js', 'b.js']);
  const h = doctor.hookHealth(root);
  assert.deepStrictEqual(h.declared.sort(), ['SessionStart', 'Stop']);
  assert.deepStrictEqual(h.missing, []);
});

test('KNOWN POSITIVE: a declared hook whose script is absent is reported', () => {
  // The shape of a silent outage: the manifest promises a guardrail, the file
  // is not there, the hook fails open, and the session looks exactly the same.
  const root = pluginFixture({ SessionStart: 'a.js', PreToolUse: 'gone.js' }, ['a.js']);
  const h = doctor.hookHealth(root);
  assert.deepStrictEqual(h.missing, ['hooks/scripts/gone.js']);
});

test('KNOWN POSITIVE: an older plugin on this machine is a finding, not a fact', () => {
  const installed = pluginFixture({ SessionStart: 'a.js' }, ['a.js']);
  const repo = pluginFixture({ SessionStart: 'a.js', PreToolUse: 'b.js', Stop: 'c.js' },
    ['a.js', 'b.js', 'c.js']);
  const cfg = tmp();
  fs.mkdirSync(path.join(cfg, 'plugins'), { recursive: true });
  fs.writeFileSync(path.join(cfg, 'plugins', 'installed_plugins.json'), JSON.stringify({
    version: 2,
    plugins: {
      'be@basic-engineering': [{ scope: 'user', installPath: installed, version: '2.0.0', installedAt: '2026-06-10T00:00:00Z' }],
      'other@somewhere': [{ scope: 'user', installPath: '/nope', version: '9.9.9' }],
    },
  }));

  const { findings } = doctor.diagnose({
    cwd: tmp(), configDir: cfg, packageVersion: 'v20260101-000000',
    pluginVersion: '3.0.0', repoPluginRoot: repo,
  });

  assert.ok(findings.some((f) => /is 2\.0\.0 on this machine/.test(f)),
    'a stale plugin version must be reported');
  assert.ok(findings.some((f) => /PreToolUse, Stop/.test(f)),
    'the reader needs to know WHICH guardrails are not running, not only that a number differs');
  assert.ok(!findings.some((f) => /other@somewhere/.test(f)),
    'other plugins are none of our business');
});

test('KNOWN POSITIVE: a checkout that does not pin eol=lf is reported', () => {
  const repo = tmp();
  fs.mkdirSync(path.join(repo, '.git'));
  let r = doctor.diagnose({ cwd: repo, configDir: tmp() });
  assert.ok(r.findings.some((f) => /eol=lf/.test(f)),
    'without normalisation a byte count here does not reproduce in CI');

  fs.writeFileSync(path.join(repo, '.gitattributes'), '* text=auto eol=lf\n');
  r = doctor.diagnose({ cwd: repo, configDir: tmp() });
  assert.ok(!r.findings.some((f) => /eol=lf/.test(f)));
});

test('a diagnosis of an empty machine reports nothing to act on, and does not throw', () => {
  // A doctor that crashes diagnoses nothing. Absent config, absent project.
  const { facts, findings } = doctor.diagnose({ cwd: tmp(), configDir: path.join(tmp(), 'absent') });
  assert.ok(facts.length > 0);
  assert.deepStrictEqual(findings, []);
});

test('this repo pins eol=lf, so measurements here reproduce in CI', () => {
  const root = path.join(__dirname, '..');
  assert.strictEqual(doctor.eolHygiene(root).normalised, true);
});
