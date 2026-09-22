#!/usr/bin/env node
/**
 * Stop hook for the `be` plugin — session-continuity reminder.
 *
 * If functional code changed in the working tree but no living doc
 * (HISTORY.md or structural-analysis, EN or PT names) changed, print a
 * non-blocking reminder to run /be:session-end so docs stay <= 1 commit behind
 * the code. Reminder only — never blocks.
 *
 * The same fact is read by the SessionEnd and PreCompact hooks, from the shared
 * `_state.js`: one rule, one reader. It used to run `git` through a shell here,
 * which is the class of defect that once reported shipped work as not started.
 *
 * Fail-open; opt-out via BE_HOOKS=off or BE_HOOK_SESSION_END_REMINDER=off.
 */
'use strict';

const lib = require('./_lib.js');
const state = require('./_state.js');

function main() {
  if (lib.hooksDisabled('session-end-reminder')) return;

  const files = state.changedFiles(process.cwd());
  if (!files.length || !state.codeWithoutDocs(files)) return;

  process.stderr.write(
    '[be] Reminder: functional code changed but the living docs (HISTORY / structural-analysis) were not updated. ' +
      'Run /be:session-end before committing so docs stay <= 1 commit behind the code.\n'
  );
}

try {
  main();
} catch {
  // never break the session
}
process.exit(0);
