'use strict';

/**
 * Shell-free predicates for the backlog audit.
 *
 * Why this module exists: the probes used to be shell one-liners executed with
 * `execSync`, which on Windows spawns `cmd.exe` (ComSpec). cmd.exe does not
 * treat '...' as quoting, so a regex alternation like 'pin|version' was parsed
 * as a real pipe operator, and `$(...)` was never substituted. Five of the 26
 * probes failed for that reason alone — and the audit then reported shipped
 * work as *not started*, on the maintainer's own machine, while CI (Linux)
 * stayed green. The release guard that reads this audit refused to run.
 *
 * A status that changes with the operating system is not a status. These
 * predicates touch the filesystem directly: same answer on every platform,
 * no quoting rules to get wrong, and each one is testable in isolation.
 *
 * A check is a plain object — one of:
 *   { kind: 'file',      path }                     file exists
 *   { kind: 'dir',       path }                     directory exists
 *   { kind: 'anyFile',   dir, name }                >= 1 entry matching `name`
 *   { kind: 'content',   path, re }                 file content matches `re`
 *   { kind: 'everyFile', dir, name, re }            every matching file matches `re`
 */

const fs = require('node:fs');
const path = require('node:path');

/** Read a file as text, or null when it does not exist / cannot be read. */
function readOrNull(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

/** Entries of a directory, or [] when it does not exist. */
function listOrEmpty(abs) {
  try {
    return fs.readdirSync(abs);
  } catch {
    return [];
  }
}

/**
 * Evaluate one check against `root`. Never throws: a malformed check is a
 * failed check, because an audit that crashes teaches less than one that
 * reports a red row.
 */
function run(root, check) {
  if (!check || typeof check !== 'object') return false;
  const abs = (rel) => path.join(root, rel);

  switch (check.kind) {
    case 'file':
      return fs.existsSync(abs(check.path)) && fs.statSync(abs(check.path)).isFile();

    case 'dir':
      return fs.existsSync(abs(check.dir || check.path)) && fs.statSync(abs(check.dir || check.path)).isDirectory();

    case 'anyFile':
      return listOrEmpty(abs(check.dir)).some((f) => check.name.test(f));

    case 'content': {
      const text = readOrNull(abs(check.path));
      return text !== null && check.re.test(text);
    }

    case 'everyFile': {
      const files = listOrEmpty(abs(check.dir)).filter((f) => check.name.test(f));
      if (!files.length) return false; // zero files pass vacuously — that is not evidence
      return files.every((f) => {
        const text = readOrNull(path.join(abs(check.dir), f));
        return text !== null && check.re.test(text);
      });
    }

    default:
      return false;
  }
}

/**
 * One line describing what a check looked for, printed when it fails. The old
 * shell string doubled as its own documentation; keep that property.
 */
function describe(check) {
  if (!check || typeof check !== 'object') return 'malformed check';
  switch (check.kind) {
    case 'file':
      return `file ${check.path}`;
    case 'dir':
      return `directory ${check.dir || check.path}`;
    case 'anyFile':
      return `at least one ${check.name} in ${check.dir}`;
    case 'content':
      return `${check.path} matching ${check.re}`;
    case 'everyFile':
      return `every ${check.name} in ${check.dir} matching ${check.re}`;
    default:
      return `unknown check kind: ${check.kind}`;
  }
}

module.exports = { run, describe };
