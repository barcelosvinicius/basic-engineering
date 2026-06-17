#!/usr/bin/env node
/**
 * PreToolUse dispatcher for the `be` plugin.
 *
 * Matched on Bash|Write|Edit|MultiEdit. Runs a thin set of HIGH-confidence,
 * on-mission guardrails — blocks only the truly critical, advisory otherwise:
 *   - Bash: block `git --no-verify` (bypasses verification); block a hardcoded
 *     secret in the command.
 *   - Write/Edit/MultiEdit: block weakening an EXISTING linter/formatter config
 *     (fix the code, not the config); block writing a hardcoded secret into a
 *     non-test source file.
 *
 * Fail-open and opt-out via BE_HOOKS / BE_HOOK_<ID> (see _lib.js).
 */
'use strict';

const lib = require('./_lib.js');
const gate = require('./_gateguard.js');

function main() {
  if (lib.hooksDisabled()) return lib.allow();

  const data = lib.parseInput(lib.readStdin());
  const tool = data.tool_name || '';
  const input = data.tool_input || {};

  if (tool === 'Bash') {
    const cmd = input.command || '';
    if (!lib.hooksDisabled('no-verify') && lib.isNoVerify(cmd)) {
      lib.block(
        '`git --no-verify` bypasses commit/push hooks. Fix the underlying failure instead of skipping verification. (BE_HOOK_NO_VERIFY=off to allow)'
      );
    }
    if (!lib.hooksDisabled('secret-scan')) {
      const hits = lib.detectSecrets(cmd);
      if (hits.length) {
        lib.block(
          'possible hardcoded secret in the command (' +
            hits.join(', ') +
            '). Use an environment variable or secret manager. (BE_HOOK_SECRET_SCAN=off to allow)'
        );
      }
    }
    return lib.allow();
  }

  if (tool === 'Write' || tool === 'Edit' || tool === 'MultiEdit') {
    const filePath = input.file_path || input.path || '';

    if (!lib.hooksDisabled('config-protection') && lib.isProtectedConfig(filePath) && lib.pathExists(filePath)) {
      lib.block(
        'editing ' +
          lib.basename(filePath) +
          ' (linter/formatter config) is blocked — fix the code to satisfy the rules instead of weakening the config. Creating a new config is allowed. (BE_HOOK_CONFIG_PROTECTION=off to allow)'
      );
    }

    if (!lib.hooksDisabled('secret-scan') && !lib.SAFE_PATH.test(filePath)) {
      const texts = [];
      if (typeof input.content === 'string') texts.push(input.content);
      if (typeof input.new_string === 'string') texts.push(input.new_string);
      if (Array.isArray(input.edits)) {
        for (const e of input.edits) {
          if (e && typeof e.new_string === 'string') texts.push(e.new_string);
        }
      }
      const hits = lib.detectSecrets(texts.join('\n'));
      if (hits.length) {
        lib.block(
          'possible hardcoded secret in ' +
            (lib.basename(filePath) || 'content') +
            ' (' +
            hits.join(', ') +
            '). Move it to an environment variable or secret manager. (BE_HOOK_SECRET_SCAN=off to allow)'
        );
      }
    }

    // Fact-forcing gate (opt-in BE_GATEGUARD=on): block the first touch per file
    // until the agent investigates. Fail-open if session state can't persist.
    if (gate.enabled() && !lib.hooksDisabled('gateguard')) {
      const gp =
        filePath ||
        (Array.isArray(input.edits) && input.edits[0] && input.edits[0].file_path) ||
        '';
      if (gp && !gate.isChecked(data, gp) && gate.markChecked(data, gp)) {
        lib.block(gate.gateMessage(lib.basename(gp), tool === 'Write' ? 'create' : 'edit'));
      }
    }

    return lib.allow();
  }

  return lib.allow();
}

try {
  main();
} catch {
  // A guardrail must never break the session.
  process.exit(0);
}
