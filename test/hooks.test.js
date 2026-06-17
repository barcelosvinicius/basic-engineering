'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const lib = require('../plugins/be/hooks/scripts/_lib.js');
const { generate, TARGETS } = require('../scripts/gen-capabilities.js');
const fs = require('fs');

test('detectSecrets flags high-confidence secrets', () => {
  assert.ok(
    lib.detectSecrets('token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij12"').includes('GitHub token')
  );
  assert.ok(lib.detectSecrets('export K=AKIA1234567890ABCDEF').includes('AWS access key id'));
  assert.ok(lib.detectSecrets('-----BEGIN RSA PRIVATE KEY-----').includes('private key'));
  assert.ok(lib.detectSecrets('password = "hunter2secret"').includes('hardcoded credential'));
});

test('detectSecrets skips placeholders and clean text', () => {
  assert.deepStrictEqual(lib.detectSecrets('apiKey = "YOUR_API_KEY_HERE"'), []);
  assert.deepStrictEqual(lib.detectSecrets('const key = process.env.API_KEY'), []);
  assert.deepStrictEqual(lib.detectSecrets('AKIAIOSFODNN7EXAMPLE'), []); // canonical AWS example
  assert.deepStrictEqual(lib.detectSecrets('const total = price * 1.08'), []);
});

test('isProtectedConfig matches linter/formatter configs only', () => {
  assert.ok(lib.isProtectedConfig('eslint.config.js'));
  assert.ok(lib.isProtectedConfig('/repo/biome.json'));
  assert.ok(lib.isProtectedConfig('C:\\repo\\.prettierrc'));
  assert.ok(!lib.isProtectedConfig('src/app.ts'));
  assert.ok(!lib.isProtectedConfig('package.json'));
});

test('isNoVerify catches hook-bypass forms', () => {
  assert.ok(lib.isNoVerify('git commit --no-verify -m x'));
  assert.ok(lib.isNoVerify('git commit -n -m x'));
  assert.ok(lib.isNoVerify('git push --no-verify'));
  assert.ok(!lib.isNoVerify('npm test'));
  assert.ok(!lib.isNoVerify('git commit -m "fix: bug"'));
});

test('hooksDisabled honors global and per-hook opt-out', () => {
  delete process.env.BE_HOOKS;
  delete process.env.BE_HOOK_SECRET_SCAN;
  assert.ok(!lib.hooksDisabled('secret-scan'));

  process.env.BE_HOOKS = 'off';
  assert.ok(lib.hooksDisabled('secret-scan'));
  delete process.env.BE_HOOKS;

  process.env.BE_HOOK_SECRET_SCAN = 'off';
  assert.ok(lib.hooksDisabled('secret-scan'));
  assert.ok(!lib.hooksDisabled('no-verify'));
  delete process.env.BE_HOOK_SECRET_SCAN;
});

test('generated guides (EN + PT) are in sync with the plugin frontmatter', () => {
  for (const { lang, file } of TARGETS) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    assert.strictEqual(
      current.replace(/\r\n/g, '\n'),
      generate(lang).replace(/\r\n/g, '\n'),
      `${require('path').basename(file)} is stale — run \`npm run gen:guide\``
    );
  }
});

test('gateguard is opt-in and remembers checked files per session', () => {
  const gate = require('../plugins/be/hooks/scripts/_gateguard.js');
  const data = { session_id: 'test-' + Math.random().toString(36).slice(2) };

  delete process.env.BE_GATEGUARD;
  assert.ok(!gate.enabled(), 'off by default');
  process.env.BE_GATEGUARD = 'on';
  assert.ok(gate.enabled(), 'enabled with BE_GATEGUARD=on');
  delete process.env.BE_GATEGUARD;

  assert.ok(!gate.isChecked(data, '/x/app.ts'), 'unseen file not checked');
  assert.ok(gate.markChecked(data, '/x/app.ts'), 'marks checked');
  assert.ok(gate.isChecked(data, '/x/app.ts'), 'remembers checked file');
  assert.ok(!gate.isChecked(data, '/x/other.ts'), 'other file still unchecked');
});
