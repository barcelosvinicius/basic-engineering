#!/usr/bin/env node
/**
 * PreCompact hook — the moment the thread is most likely to break.
 *
 * Compaction rewrites the context; what was not written down is gone. This
 * writes the session's state card (branch, last commit, what is uncommitted,
 * whether the living docs are behind) to the session log, and hands the same
 * card back as context so it survives the compaction.
 *
 * Never blocks: a hook that refuses to compact would hang the session.
 * Fail-open; opt-out via BE_HOOKS=off or BE_HOOK_PRECOMPACT=off.
 */
'use strict';

const lib = require('./_lib.js');
const state = require('./_state.js');

function main() {
  if (lib.hooksDisabled('precompact')) return lib.allow();
  const data = lib.parseInput(lib.readStdin());
  const cwd = data.cwd || process.cwd();
  const card = state.stateCard(cwd);
  const file = state.writeStateCard(cwd, data.session_id, card);
  lib.logEvent(data, { kind: 'precompact', trigger: data.trigger || 'unknown', saved: Boolean(file) });
  lib.warn(
    'PreCompact',
    `context is being compacted — the session state, so it survives:\n${card}\n` +
      (file ? `(also written to ${file})\n` : '') +
      'If the living docs are behind the code, run /be:session-end before continuing.'
  );
}

try {
  main();
} catch {
  // a guardrail must never break the session
}
process.exit(0);
