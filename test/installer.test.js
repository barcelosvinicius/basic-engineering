'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { install, PACKAGE_VERSION } = require('../lib/installer');

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'be-installer-'));
}

function read(target, ...segments) {
  return fs.readFileSync(path.join(target, ...segments), 'utf8');
}

test('fresh install copies all mapped destinations', () => {
  const target = tmpProject();
  const result = install(target, { silent: true });

  assert.strictEqual(result.action, 'installed');
  assert.strictEqual(result.to, PACKAGE_VERSION);

  const base = path.join(target, '.github', 'base');
  for (const expected of [
    'BOOTSTRAP.md',
    'engineering-principles.md',
    'ai-context.template.md',
    'mcp.recommended.json',
    'BASE_VERSION',
    'base-manifest.json',
    'skills',
    'agents',
    'commands',
    'docs',
  ]) {
    assert.ok(fs.existsSync(path.join(base, expected)), `missing ${expected}`);
  }

  // skills arrive in directory format
  assert.ok(
    fs.existsSync(path.join(base, 'skills', 'proc-session-continuity', 'SKILL.md')),
    'skills must keep the <name>/SKILL.md directory format'
  );
  // legacy entries must NOT be installed
  assert.ok(!fs.existsSync(path.join(base, 'roles')), 'roles/ must not be installed');

  assert.strictEqual(read(target, '.github', 'base', 'BASE_VERSION').trim(), PACKAGE_VERSION);
});

test('matching version is skipped without --force', () => {
  const target = tmpProject();
  install(target, { silent: true });

  const result = install(target, { silent: true });
  assert.strictEqual(result.action, 'skipped');
});

test('--force reinstalls even when versions match', () => {
  const target = tmpProject();
  install(target, { silent: true });

  const result = install(target, { silent: true, force: true });
  assert.strictEqual(result.action, 'installed');
});

test('update preserves project-specific files outside the universal set', () => {
  const target = tmpProject();
  install(target, { silent: true });

  const base = path.join(target, '.github', 'base');
  // simulate older installed version + a user customisation
  fs.writeFileSync(path.join(base, 'BASE_VERSION'), 'v20200101-000000\n');
  const customSkill = path.join(base, 'skills', 'be-custom-project-skill');
  fs.mkdirSync(customSkill, { recursive: true });
  fs.writeFileSync(path.join(customSkill, 'SKILL.md'), '# custom\n');

  const result = install(target, { silent: true });
  assert.strictEqual(result.action, 'updated');
  assert.strictEqual(result.from, 'v20200101-000000');
  assert.ok(fs.existsSync(path.join(customSkill, 'SKILL.md')), 'custom skill must survive update');
  assert.strictEqual(read(target, '.github', 'base', 'BASE_VERSION').trim(), PACKAGE_VERSION);
});

test('--dry-run writes nothing', () => {
  const target = tmpProject();
  const result = install(target, { silent: true, dryRun: true });

  assert.strictEqual(result.action, 'dry-run');
  assert.ok(!fs.existsSync(path.join(target, '.github')), 'dry-run must not create files');
});

test('newer installed version warns and skips', () => {
  const target = tmpProject();
  const base = path.join(target, '.github', 'base');
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'BASE_VERSION'), 'v99991231-235959\n');

  const result = install(target, { silent: true });
  assert.strictEqual(result.action, 'skipped');
  // newer version file untouched
  assert.strictEqual(read(target, '.github', 'base', 'BASE_VERSION').trim(), 'v99991231-235959');
});

test('legacy flat layout is detected but never deleted on update', () => {
  const target = tmpProject();
  const base = path.join(target, '.github', 'base');
  fs.mkdirSync(path.join(base, 'roles'), { recursive: true });
  fs.mkdirSync(path.join(base, 'skills'), { recursive: true });
  fs.writeFileSync(path.join(base, 'roles', 'dev-backend.template.md'), '# legacy\n');
  fs.writeFileSync(path.join(base, 'skills', 'proc-adr.md'), '# legacy flat skill\n');
  fs.writeFileSync(path.join(base, 'BASE_VERSION'), 'v20200101-000000\n');

  const result = install(target, { silent: true });
  assert.strictEqual(result.action, 'updated');
  assert.ok(fs.existsSync(path.join(base, 'roles', 'dev-backend.template.md')), 'legacy roles must be preserved');
  assert.ok(fs.existsSync(path.join(base, 'skills', 'proc-adr.md')), 'legacy flat skills must be preserved');
  // and the new format is installed alongside
  assert.ok(fs.existsSync(path.join(base, 'skills', 'proc-adr', 'SKILL.md')));
});
