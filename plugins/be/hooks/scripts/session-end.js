#!/usr/bin/env node
/**
 * SessionEnd hook — the last moment, and the one nobody was watching.
 *
 * The Stop hook reminds during the session. This one records what the session
 * ENDED with: if functional code changed and the living docs did not, it leaves
 * a note that the next session start reads, once. The rule stops depending on
 * whoever closed the terminal.
 *
 * Fail-open; opt-out via BE_HOOKS=off or BE_HOOK_SESSION_END_REMINDER=off.
 */
'use strict';

const lib = require('./_lib.js');
const state = require('./_state.js');

function main() {
  if (lib.hooksDisabled('session-end-reminder')) return;
  const data = lib.parseInput(lib.readStdin());
  const cwd = data.cwd || process.cwd();
  const files = state.changedFiles(cwd);
  if (!files.length || !state.codeWithoutDocs(files)) return;
  state.writeCarry(cwd, `the previous session ended with ${files.length} uncommitted file(s) and the living docs untouched (${(data.reason || 'ended')})`);
  lib.logEvent(data, { kind: 'session-end', files: files.length, reason: data.reason || 'ended' });
}

try {
  main();
} catch {
  // never break the close
}
process.exit(0);
