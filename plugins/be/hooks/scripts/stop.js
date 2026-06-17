#!/usr/bin/env node
/**
 * Stop hook for the `be` plugin — session-continuity reminder.
 *
 * If functional code changed in the working tree but no living-doc
 * (docs/HISTORY.md or structural-analysis, EN or PT names) changed, print a
 * non-blocking reminder to run /be:session-end so docs stay <= 1 commit
 * behind the code (the golden rule). Reminder only — never blocks.
 *
 * Fail-open; opt-out via BE_HOOKS=off or BE_HOOK_SESSION_END_REMINDER=off.
 */
'use strict';

const lib = require('./_lib.js');
const { execSync } = require('child_process');

const FUNCTIONAL =
  /\.(js|jsx|ts|tsx|mjs|cjs|py|java|kt|kts|go|rb|rs|cs|php|c|cc|cpp|h|hpp|swift|scala|sql|vue|svelte)$/i;
const DOC =
  /(HISTORY\.md|HISTORICO\.md|structural-analysis|analise-estrutural|arquitetura)/i;

function changedFiles() {
  try {
    const out = execSync('git status --porcelain', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    });
    return out
      .split(/\r?\n/)
      .map((l) => l.slice(3).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  if (lib.hooksDisabled('session-end-reminder')) return;

  const files = changedFiles();
  if (!files.length) return;

  const codeChanged = files.some((f) => FUNCTIONAL.test(f));
  const docChanged = files.some((f) => DOC.test(f));

  if (codeChanged && !docChanged) {
    process.stderr.write(
      '[be] Reminder: functional code changed but the living docs (HISTORY / structural-analysis) were not updated. ' +
        'Run /be:session-end before committing so docs stay <= 1 commit behind the code.\n'
    );
  }
}

try {
  main();
} catch {
  // never break the session
}
process.exit(0);
