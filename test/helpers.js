'use strict';

/**
 * The scaffolding every test rebuilt.
 *
 * Measured on 2026-09-22: nine test files carried ten ad-hoc helpers between
 * them — `fixture`, `fixtureRoot`, `tmpProject`, `project`, `checkout`,
 * `copyOfRepo` — and `quiet()` was duplicated verbatim in two. Each new test
 * re-derived the same setup, and a change in how a hook is run had to be
 * repeated in several places.
 *
 * Nothing here hides what a test asserts: these only create files, run a
 * process, and silence output.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

/** An empty throwaway directory. */
const tmpDir = (prefix = 'be-test-') => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

/** A throwaway directory holding the given files, parents created as needed. */
function fixture(files = {}, prefix = 'be-fixture-') {
  const dir = tmpDir(prefix);
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}

/**
 * A fixture that is also a git repository with one commit. `dirty` is written
 * after the commit, so it is exactly what `git status` will report.
 */
function gitRepo(committed = {}, dirty = {}, prefix = 'be-repo-') {
  const dir = fixture(committed, prefix);
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  git('init', '-q', '.');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'test');
  git('add', '-A');
  git('commit', '-qm', 'base');
  for (const [rel, content] of Object.entries(dirty)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}

/** A copy of this repository, without .git or node_modules. */
function copyRepo(prefix = 'be-copy-') {
  const dir = tmpDir(prefix);
  fs.cpSync(ROOT, dir, { recursive: true, filter: (src) => !/[\\/](\.git|node_modules)$/.test(src) });
  return dir;
}

/** The environment without the base's own switches, plus whatever is asked for. */
function cleanEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  for (const k of Object.keys(env)) if (/^BE_HOOKS?(_|$)/.test(k) && !(k in extra)) delete env[k];
  return env;
}

/**
 * Run a script as a process, the way it really runs. `script` is relative to
 * the repository unless `dir` is given — a script resolves its paths from its
 * own location, so measuring a copy means running THAT copy's script.
 */
function runScript(script, { args = [], dir = null, cwd = null, input = undefined, env = {}, timeout = 120000 } = {}) {
  const file = dir ? path.join(dir, script) : path.join(ROOT, script);
  return spawnSync(process.execPath, [file, ...args], {
    cwd: cwd || dir || undefined,
    input: input === undefined ? undefined : typeof input === 'string' ? input : JSON.stringify(input),
    env: cleanEnv(env),
    encoding: 'utf8',
    timeout,
  });
}

/** The additionalContext a hook handed back, or '' when it handed back nothing. */
function hookContext(result) {
  try {
    return JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  } catch {
    return '';
  }
}

/** Run `fn` with console output swallowed; works for sync and async. */
async function quiet(fn) {
  const { log, error } = console;
  console.log = console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
}

module.exports = { ROOT, tmpDir, fixture, gitRepo, copyRepo, cleanEnv, runScript, hookContext, quiet };
