'use strict';

/**
 * Fact-forcing gate (lite) for the `be` plugin — OPT-IN via BE_GATEGUARD=on.
 *
 * Blocks the FIRST Edit/Write of each file in a session and demands the agent
 * state concrete facts (importers, affected API, data shape, the user's
 * verbatim instruction) before retrying. The act of investigating creates
 * awareness that self-evaluation does not. Off by default — it is deliberate
 * friction, useful when an agent edits blind.
 *
 * State is per-session, in the OS temp dir, expiring after 30 min. Fail-open:
 * if state can't be read/written, the operation is allowed (never loop forever).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const STATE_DIR = path.join(os.tmpdir(), 'be-gateguard');
const TIMEOUT_MS = 30 * 60 * 1000;

function enabled() {
  return /^(1|on|true|yes)$/i.test(String(process.env.BE_GATEGUARD || '').trim());
}

function sessionKey(data) {
  const cand =
    (data && (data.session_id || data.transcript_path)) ||
    process.env.CLAUDE_SESSION_ID ||
    process.env.BE_SESSION_ID ||
    process.cwd();
  return crypto.createHash('sha256').update(String(cand)).digest('hex').slice(0, 24);
}

function stateFile(data) {
  return path.join(STATE_DIR, `state-${sessionKey(data)}.json`);
}

function load(file) {
  try {
    const s = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!s || !Array.isArray(s.checked) || Date.now() - (s.ts || 0) > TIMEOUT_MS) {
      return { checked: [], ts: Date.now() };
    }
    return s;
  } catch {
    return { checked: [], ts: Date.now() };
  }
}

function save(file, s) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    s.ts = Date.now();
    fs.writeFileSync(file, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

function isChecked(data, key) {
  return load(stateFile(data)).checked.includes(key);
}

/** Mark a target checked; returns false if state could not be persisted. */
function markChecked(data, key) {
  const file = stateFile(data);
  const s = load(file);
  if (!s.checked.includes(key)) s.checked.push(key);
  return save(file, s);
}

function gateMessage(fileName, action) {
  return [
    `fact-forcing gate — before the first ${action} of ${fileName}, state these facts:`,
    "  1. Which files import/call it (use Grep)",
    "  2. The public functions/types this change affects",
    "  3. Any data it reads/writes — field names/shape (redacted or synthetic, never raw prod data)",
    "  4. The user's current instruction, quoted verbatim",
    "Then retry the same operation. (BE_GATEGUARD=off to disable this gate.)",
  ].join('\n');
}

module.exports = { enabled, isChecked, markChecked, gateMessage, sessionKey };
