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
 *     non-test source file; block the first edit of an existing high-impact
 *     file until the agent states the facts (the narrow fact-forcing gate).
 *
 * Fail-open and opt-out via BE_HOOKS / BE_HOOK_<ID> (see _lib.js).
 */
'use strict';

const lib = require('./_lib.js');
const gate = require('./_gateguard.js');

// ── reminders: one advisory line when a gesture meets its rule (action plan 8.2) ─
// Never a block; once per kind per session; opt-out BE_HOOK_REMINDERS=off.
const ONCE = '(once per session; BE_HOOK_REMINDERS=off)';
const REMIND = {
  lot: (g) => `bulk rewrite (${g}): run it on text already at rest — never in the same step as new writing — and read the generated output before trusting the check that follows. A bulk renumber in the same pass as new text is how a correct pointer turns into a wrong one. ${ONCE}`,
  removal: (g) => `removing code (${g}): clear proc-safe-removal's four axes first — who calls it, what depends on it, what it documented, and where the reason goes (// NB:). ${ONCE}`,
  stack: (s) => `stack detected: ${s.map((x) => x.id).join(', ')} — skills for this code, consult when the change touches their topic: ${[...new Set(s.flatMap((x) => x.skills || []))].join(', ')}. ${ONCE}`,
};

function remindOnce(data, kind, detail, text) {
  if (lib.hooksDisabled('reminders')) return;
  const key = 'reminder:' + kind;
  if (gate.isChecked(data, key) || !gate.markChecked(data, key)) return;
  lib.logEvent(data, { kind: 'reminder', rule: kind, detail });
  lib.warn('PreToolUse', text);
}

function stackMappings() {
  try {
    return require('../../config/stack-mappings.json');
  } catch {
    return null;
  }
}

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
    const bulk = lib.bulkGesture(cmd);
    if (bulk) remindOnce(data, 'lot', bulk, REMIND.lot(bulk));
    const removal = lib.removalGesture(cmd);
    if (removal) remindOnce(data, 'removal', removal, REMIND.removal(removal));
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

    // Fact-forcing gate: block the first touch of a high-impact file per session
    // until the agent investigates (narrow by default; BE_GATEGUARD=all|off).
    // Fail-open if session state can't persist.
    if (gate.enabled() && !lib.hooksDisabled('gateguard')) {
      const gp =
        filePath ||
        (Array.isArray(input.edits) && input.edits[0] && input.edits[0].file_path) ||
        '';
      const rel = lib.projectRelative(gp, data.cwd || process.cwd());
      const exists = Boolean(gp) && lib.pathExists(gp);
      if (gate.shouldGate(rel, exists) && !gate.isChecked(data, gp) && gate.markChecked(data, gp)) {
        const why = gate.mode() === 'narrow' ? gate.riskClass(rel) : '';
        const action = tool !== 'Write' ? 'edit' : exists ? 'overwrite' : 'creation';
        lib.logEvent(data, { kind: 'gate', tool, file: rel, class: why || 'all files' });
        lib.block(gate.gateMessage(lib.basename(gp), action, why));
      }
    }

    const removed = lib.removedLines(input);
    if (removed >= 15) remindOnce(data, 'removal', `${removed} lines removed`, REMIND.removal(`${removed} lines in one edit`));
    const target = filePath || (Array.isArray(input.edits) && input.edits[0] && input.edits[0].file_path) || '';
    if (lib.isCodeFile(target)) {
      const stacks = lib.detectStacks(data.cwd || process.cwd(), stackMappings());
      if (stacks.length) remindOnce(data, 'stack', stacks.map((s) => s.id).join(','), REMIND.stack(stacks));
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
