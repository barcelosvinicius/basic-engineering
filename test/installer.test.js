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

  const base = path.join(target, '.be');
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

  assert.strictEqual(read(target, '.be', 'BASE_VERSION').trim(), PACKAGE_VERSION);
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

  const base = path.join(target, '.be');
  // simulate older installed version + a user customisation
  fs.writeFileSync(path.join(base, 'BASE_VERSION'), 'v20200101-000000\n');
  const customSkill = path.join(base, 'skills', 'be-custom-project-skill');
  fs.mkdirSync(customSkill, { recursive: true });
  fs.writeFileSync(path.join(customSkill, 'SKILL.md'), '# custom\n');

  const result = install(target, { silent: true });
  assert.strictEqual(result.action, 'updated');
  assert.strictEqual(result.from, 'v20200101-000000');
  assert.ok(fs.existsSync(path.join(customSkill, 'SKILL.md')), 'custom skill must survive update');
  assert.strictEqual(read(target, '.be', 'BASE_VERSION').trim(), PACKAGE_VERSION);
});

test('--dry-run writes nothing', () => {
  const target = tmpProject();
  const result = install(target, { silent: true, dryRun: true });

  assert.strictEqual(result.action, 'dry-run');
  assert.ok(!fs.existsSync(path.join(target, '.be')), 'dry-run must not create files');
});

test('newer installed version warns and skips', () => {
  const target = tmpProject();
  const base = path.join(target, '.be');
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'BASE_VERSION'), 'v99991231-235959\n');

  const result = install(target, { silent: true });
  assert.strictEqual(result.action, 'skipped');
  // newer version file untouched
  assert.strictEqual(read(target, '.be', 'BASE_VERSION').trim(), 'v99991231-235959');
});

test('legacy flat layout is detected but never deleted on update', () => {
  const target = tmpProject();
  const base = path.join(target, '.be');
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

test('profile=minimal copies only process skills + principles', () => {
  const target = tmpProject();
  install(target, { silent: true, profile: 'minimal' });
  const skills = path.join(target, '.be', 'skills');
  assert.ok(fs.existsSync(path.join(skills, 'proc-adr', 'SKILL.md')), 'proc- skill present');
  assert.ok(fs.existsSync(path.join(skills, 'engineering-principles', 'SKILL.md')), 'principles present');
  assert.ok(!fs.existsSync(path.join(skills, 'be-api-versioning')), 'be- skill excluded');
  assert.ok(!fs.existsSync(path.join(skills, 'fe-ux-patterns')), 'fe- skill excluded');
});

test('default profile copies all skills', () => {
  const target = tmpProject();
  install(target, { silent: true });
  const skills = path.join(target, '.be', 'skills');
  for (const s of ['proc-adr', 'be-api-versioning', 'fe-ux-patterns', 'qa-verification-loop']) {
    assert.ok(fs.existsSync(path.join(skills, s, 'SKILL.md')), `${s} present in full install`);
  }
});

test('unknown profile falls back to the full set', () => {
  const target = tmpProject();
  install(target, { silent: true, profile: 'does-not-exist' });
  const skills = path.join(target, '.be', 'skills');
  assert.ok(fs.existsSync(path.join(skills, 'fe-ux-patterns', 'SKILL.md')), 'falls back to full');
});

test('a previous .github/base install is detected and never deleted', () => {
  const target = tmpProject();
  const oldBase = path.join(target, '.github', 'base');
  fs.mkdirSync(oldBase, { recursive: true });
  fs.writeFileSync(path.join(oldBase, 'BASE_VERSION'), 'v20200101-000000\n');
  fs.writeFileSync(path.join(oldBase, 'custom.md'), '# mine\n');

  const result = install(target, { silent: true });
  assert.strictEqual(result.action, 'installed', 'installs fresh to the new .be location');
  assert.ok(fs.existsSync(path.join(target, '.be', 'BASE_VERSION')), 'new .be location created');
  assert.ok(fs.existsSync(path.join(oldBase, 'custom.md')), 'old .github/base left untouched');
});
