'use strict';
/**
 * The session's unsaved state, for the two moments where continuity is lost.
 *
 * The base reads `HISTORY.md` at session start (a skill, rung 2) and reminds at
 * `Stop`. Neither covers the two moments the thread actually breaks: when the
 * context is **compacted**, and when the session **ends** with code changed and
 * the living docs untouched. Measured here on 2026-09-22: a session with 50
 * commits kept its HISTORY true only because a checkpoint was written by hand
 * in the middle of it.
 *
 * Everything below is read with `git` through execFileSync — a list of
 * arguments, never a shell string, so quoting cannot change the meaning on
 * another platform.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const FUNCTIONAL =
  /\.(js|jsx|ts|tsx|mjs|cjs|py|java|kt|kts|go|rb|rs|cs|php|c|cc|cpp|h|hpp|swift|scala|sql|vue|svelte)$/i;
const DOC = /(HISTORY\.md|HISTORICO\.md|structural-analysis|analise-estrutural|arquitetura)/i;

function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim();
  } catch {
    return '';
  }
}

/**
 * Paths with uncommitted changes, or [] outside a repository. The status prefix
 * is two status characters and a space, but the first is often a space itself —
 * and trimming the output eats it, which silently turned `app.js` into `pp.js`.
 * So the prefix is removed by shape, not by position.
 */
function changedFiles(cwd) {
  const out = git(cwd, ['status', '--porcelain']);
  return out ? out.split(/\r?\n/).map((l) => l.trim().replace(/^\S{1,2}\s+/, '')).filter(Boolean) : [];
}

/** Whether code changed while the living docs did not — the one fact both hooks act on. */
function codeWithoutDocs(files) {
  return files.some((f) => FUNCTIONAL.test(f)) && !files.some((f) => DOC.test(f));
}

/** What a session would lose: branch, last commit, what is uncommitted. */
function stateCard(cwd, now = new Date()) {
  const files = changedFiles(cwd);
  const branch = git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']) || '(no repository)';
  const head = git(cwd, ['log', '-1', '--format=%h %s']);
  const ahead = git(cwd, ['rev-list', '--count', '@{upstream}..HEAD']);
  const lines = [
    `# Session state — ${now.toISOString().slice(0, 16).replace('T', ' ')}`,
    '',
    `- branch: ${branch}${ahead ? ` (${ahead} commit(s) not pushed)` : ''}`,
    `- last commit: ${head || '(none)'}`,
    `- uncommitted: ${files.length} file(s)${codeWithoutDocs(files) ? ' — code changed, living docs untouched' : ''}`,
  ];
  for (const f of files.slice(0, 10)) lines.push(`    ${f}`);
  if (files.length > 10) lines.push(`    … ${files.length - 10} more`);
  return lines.join('\n');
}

const dir = () => process.env.BE_HOOK_LOG_DIR || path.join(os.tmpdir(), 'be-hook-log');
const key = (cwd) => String(cwd || '').replace(/[^A-Za-z0-9]+/g, '-').slice(-60) || 'no-cwd';

/** A note the next session start reads, once, and then clears. Fail-open. */
function writeCarry(cwd, note) {
  try {
    fs.mkdirSync(dir(), { recursive: true });
    fs.writeFileSync(path.join(dir(), `carry-${key(cwd)}.json`), JSON.stringify({ at: new Date().toISOString(), note }));
    return true;
  } catch {
    return false;
  }
}

function readCarry(cwd) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir(), `carry-${key(cwd)}.json`), 'utf8'));
  } catch {
    return null;
  }
}

function clearCarry(cwd) {
  try {
    fs.unlinkSync(path.join(dir(), `carry-${key(cwd)}.json`));
    return true;
  } catch {
    return false;
  }
}

/** Where a compaction's state card is kept, per session. */
function writeStateCard(cwd, session, card) {
  try {
    fs.mkdirSync(dir(), { recursive: true });
    const file = path.join(dir(), `state-${String(session || 'no-session').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'no-session'}.md`);
    fs.appendFileSync(file, card + '\n\n');
    return file;
  } catch {
    return null;
  }
}

module.exports = { changedFiles, codeWithoutDocs, stateCard, writeCarry, readCarry, clearCarry, writeStateCard, FUNCTIONAL, DOC };
