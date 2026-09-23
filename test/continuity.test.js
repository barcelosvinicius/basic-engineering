'use strict';

/**
 * The two moments the thread breaks: compaction and the end of the session.
 * Each rule here is fed the case that must fire and the neighbour that must not.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { gitRepo, tmpDir, runScript, hookContext } = require('./helpers.js');

const state = require('../plugins/be/hooks/scripts/_state.js');

/** A repository with the two files every continuity rule is about. */
const repo = (dirty = {}) =>
  gitRepo(
    { 'app.js': 'const a = 1;\n', 'docs/HISTORY.md': '# History\n\n## Current State\n\nnothing yet\n' },
    dirty,
    'be-continuity-'
  );

// Claude Code runs a hook INSIDE the project, and session-start takes the
// project from its working directory rather than from the payload — so the test
// spawns it the same way, or it would measure this repository instead.
const runHook = (script, input, logDir) =>
  runScript(`plugins/be/hooks/scripts/${script}`, { input, cwd: input.cwd, env: { BE_HOOK_LOG_DIR: logDir } });

const context = hookContext;

test('code changed with the living docs untouched is the fact both hooks act on', () => {
  assert.ok(state.codeWithoutDocs(['app.js']));
  assert.ok(state.codeWithoutDocs(['src/main/java/App.java', 'README.md']));
  assert.ok(!state.codeWithoutDocs(['app.js', 'docs/HISTORY.md']), 'the docs were updated');
  assert.ok(!state.codeWithoutDocs(['app.js', 'docs/HISTORICO.md']), 'the Portuguese name counts too');
  assert.ok(!state.codeWithoutDocs(['app.js', 'docs/analise-estrutural.md']));
  assert.ok(!state.codeWithoutDocs(['README.md']), 'documentation alone is not functional code');
  assert.ok(!state.codeWithoutDocs([]));
});

test('the state card carries what a compaction would lose, and says when the docs are behind', () => {
  const root = repo({ 'app.js': 'const a = 2;\n' });
  const card = state.stateCard(root, new Date('2026-09-22T19:00:00Z'));
  assert.match(card, /# Session state — 2026-09-22 19:00/);
  assert.match(card, /- branch: \S+/);
  assert.match(card, /- last commit: [0-9a-f]{7} base/);
  assert.match(card, /- uncommitted: 1 file\(s\) — code changed, living docs untouched/);
  assert.match(card, /^ {4}app\.js$/m);
  // the mirror: the docs were updated, so the card does not accuse
  fs.writeFileSync(path.join(root, 'docs', 'HISTORY.md'), '# History\n\nupdated\n');
  assert.doesNotMatch(state.stateCard(root), /living docs untouched/);
  // and outside a repository it still answers, without throwing
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), 'be-plain-'));
  assert.match(state.stateCard(plain), /- branch: \(no repository\)/);
  assert.deepStrictEqual(state.changedFiles(plain), []);
});

test('the carry note is written once, read once, and cleared', () => {
  const logDir = tmpDir('be-carry-');
  const saved = process.env.BE_HOOK_LOG_DIR;
  process.env.BE_HOOK_LOG_DIR = logDir;
  try {
    const cwd = '/some/project';
    assert.strictEqual(state.readCarry(cwd), null, 'nothing carried yet');
    assert.strictEqual(state.clearCarry(cwd), false, 'clearing nothing is not an error');
    assert.ok(state.writeCarry(cwd, 'a note'));
    assert.strictEqual(state.readCarry(cwd).note, 'a note');
    assert.ok(state.clearCarry(cwd));
    assert.strictEqual(state.readCarry(cwd), null, 'read once');
    assert.strictEqual(state.readCarry('/other/project'), null, 'a note belongs to its project');
  } finally {
    if (saved === undefined) delete process.env.BE_HOOK_LOG_DIR;
    else process.env.BE_HOOK_LOG_DIR = saved;
  }
});

test('SessionEnd leaves a note only when the session ended with code changed and docs untouched', () => {
  const logDir = tmpDir('be-end-');
  const dirty = repo({ 'app.js': 'const a = 2;\n' });
  assert.strictEqual(runHook('session-end.js', { session_id: 'e1', cwd: dirty, reason: 'exit' }, logDir).status, 0);
  assert.match(
    fs.readFileSync(path.join(logDir, `carry-${dirty.replace(/[^A-Za-z0-9]+/g, '-').slice(-60)}.json`), 'utf8'),
    /1 uncommitted file\(s\).*exit/
  );

  const documented = repo({ 'app.js': 'const a = 2;\n', 'docs/HISTORY.md': '# History\n\nupdated\n' });
  runHook('session-end.js', { session_id: 'e2', cwd: documented, reason: 'exit' }, logDir);
  assert.ok(
    !fs.existsSync(path.join(logDir, `carry-${documented.replace(/[^A-Za-z0-9]+/g, '-').slice(-60)}.json`)),
    'docs updated: nothing to carry'
  );

  const clean = repo();
  runHook('session-end.js', { session_id: 'e3', cwd: clean, reason: 'exit' }, logDir);
  assert.ok(
    !fs.existsSync(path.join(logDir, `carry-${clean.replace(/[^A-Za-z0-9]+/g, '-').slice(-60)}.json`)),
    'nothing changed: nothing to carry'
  );

  const off = runHook('session-end.js', { session_id: 'e4', cwd: dirty, reason: 'exit' }, logDir);
  assert.strictEqual(off.status, 0);
});

test('PreCompact hands the state back as context and writes it down, without blocking', () => {
  const logDir = tmpDir('be-pc-');
  const root = repo({ 'app.js': 'const a = 2;\n' });
  const r = runHook('pre-compact.js', { session_id: 'pc1', cwd: root, trigger: 'auto' }, logDir);
  assert.strictEqual(r.status, 0, 'a compaction is never blocked');
  const ctx = context(r);
  assert.match(ctx, /context is being compacted/);
  assert.match(ctx, /living docs untouched/);
  assert.match(fs.readFileSync(path.join(logDir, 'state-pc1.md'), 'utf8'), /# Session state/);
  const log = fs
    .readFileSync(path.join(logDir, 'pc1.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));
  assert.deepStrictEqual(
    { kind: log[0].kind, trigger: log[0].trigger, saved: log[0].saved },
    { kind: 'precompact', trigger: 'auto', saved: true }
  );
});

test('SessionStart surfaces the carried note once and clears it', () => {
  const logDir = tmpDir('be-start-');
  const root = repo({ 'app.js': 'const a = 2;\n' });
  runHook('session-end.js', { session_id: 'x1', cwd: root, reason: 'exit' }, logDir);
  const first = context(runHook('session-start.js', { session_id: 'x2', cwd: root }, logDir));
  assert.match(first, /Carried from the last session .*uncommitted file\(s\) and the living docs untouched/);
  const second = context(runHook('session-start.js', { session_id: 'x3', cwd: root }, logDir));
  assert.doesNotMatch(second, /Carried from the last session/, 'read once, then gone');
});

test('the card truncates a long list with a count, and a note that cannot be written says so', () => {
  const dirty = {};
  for (let i = 0; i < 12; i++) dirty[`file${i}.js`] = 'x';
  const card = state.stateCard(repo(dirty));
  assert.match(card, /- uncommitted: 12 file\(s\)/);
  assert.strictEqual((card.match(/^ {4}\S+$/gm) || []).length, 10, 'ten listed');
  assert.match(card, /… 2 more/);
  assert.doesNotMatch(state.stateCard(repo({ 'file0.js': 'x' })), /more/, 'one file is not truncated');

  const blocker = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'be-block-')), 'a-file');
  fs.writeFileSync(blocker, 'x');
  const saved = process.env.BE_HOOK_LOG_DIR;
  process.env.BE_HOOK_LOG_DIR = path.join(blocker, 'sub');
  try {
    assert.strictEqual(state.writeCarry('/p', 'nota'), false, 'an unwritable directory is a false, not a throw');
    assert.strictEqual(state.writeStateCard('s', 'card'), null);
  } finally {
    if (saved === undefined) delete process.env.BE_HOOK_LOG_DIR;
    else process.env.BE_HOOK_LOG_DIR = saved;
  }
});
