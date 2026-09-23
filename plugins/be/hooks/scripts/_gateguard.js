'use strict';

/**
 * Fact-forcing gate for the `be` plugin.
 *
 * Blocks the FIRST edit of a file in a session and demands the agent state
 * concrete facts (importers, affected API, data shape, the user's verbatim
 * instruction) before retrying. The act of investigating creates awareness that
 * self-evaluation does not.
 *
 * Modes (BE_GATEGUARD):
 *   narrow (default) — only an EXISTING file in a high-impact class: schema and
 *                      migrations, security/auth, API contracts, build and
 *                      dependency manifests, CI/deploy pipelines. Decided by the
 *                      path alone, so a machine decides it (engineering-principles §D).
 *   all | on         — every file, the original behaviour (kept for opt-ins).
 *   off              — disabled.
 * Why narrow: gating every file stops a 20-file session 20 times, which is why
 * it shipped off and why the reference repo refused it. The default is
 * **pending the 8.3 measurement** — a real session must show ≤2 interruptions,
 * or the classes are narrowed again (or the default goes back to off).
 *
 * State is per-session, in the OS temp dir, expiring after 30 min. Fail-open:
 * if state can't be read/written, the operation is allowed (never loop forever).
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const STATE_DIR = path.join(os.tmpdir(), 'be-gateguard');
const TIMEOUT_MS = 30 * 60 * 1000;

function mode() {
  const v = String(process.env.BE_GATEGUARD || '')
    .trim()
    .toLowerCase();
  if (/^(0|off|false|no)$/.test(v)) return 'off';
  if (/^(1|on|true|yes|all)$/.test(v)) return 'all';
  return 'narrow';
}

function enabled() {
  return mode() !== 'off';
}

// High-impact classes, by path alone — judged on the path RELATIVE to the
// project, or a repository named `auth-service` would gate every file it holds.
// Tests, docs and generated files never gate.
const S = '(^|[\\\\/])'; // start of the path or of a segment
const NEVER = new RegExp(
  `(\\.(md|mdx|txt|rst|adoc|lock)$|${S}(tests?|__tests__|__mocks__|fixtures?|spec)[\\\\/]|\\.(test|spec)\\.[a-z]+$|Tests?\\.(java|kt|cs)$|_test\\.(go|py)$|${S}test_[^\\\\/]+\\.py$|${S}(package-lock\\.json|yarn\\.lock|pnpm-lock\\.yaml)$)`,
  'i'
);
const CLASSES = [
  [
    'schema or migration',
    new RegExp(
      `(${S}db[\\\\/]|${S}migrations?[\\\\/]|flyway|liquibase|${S}changelog[^\\\\/]*\\.(xml|ya?ml|sql)$|\\.sql$)`,
      'i'
    ),
  ],
  ['security or auth', new RegExp(`(security|jwt|oauth|permission|${S}auth|[\\\\/_.-]auth)`, 'i')],
  ['API contract', /(openapi|swagger)[^\\/]*\.(ya?ml|json)$|\.(proto|graphql|gql)$/i],
  [
    'build or dependency manifest',
    new RegExp(
      `${S}(pom\\.xml|build\\.gradle(\\.kts)?|settings\\.gradle(\\.kts)?|package\\.json|requirements[^\\\\/]*\\.txt|pyproject\\.toml|go\\.mod|Cargo\\.toml|[^\\\\/]+\\.csproj)$`,
      'i'
    ),
  ],
  [
    'CI or deploy pipeline',
    new RegExp(
      `(${S}\\.github[\\\\/]workflows[\\\\/]|${S}(Jenkinsfile|Dockerfile|docker-compose[^\\\\/]*\\.ya?ml|\\.gitlab-ci\\.yml)$|${S}(helm|k8s|kubernetes|deploy)[\\\\/])`,
      'i'
    ),
  ],
];
// `author` is not `auth` — but `authorize`, `authorization`, `authority` are.
const NOT_AUTH = /author(?!i[sz]|it)/i;

/** The high-impact class of a project-relative path, or null. */
function riskClass(filePath) {
  const p = String(filePath || '');
  if (!p || NEVER.test(p)) return null;
  for (const [name, re] of CLASSES) {
    if (name === 'security or auth' && NOT_AUTH.test(p.replace(/.*[\\/]/, ''))) continue;
    if (re.test(p)) return name;
  }
  return null;
}

/** Whether this touch is gated, given whether the file already exists. */
function shouldGate(filePath, exists) {
  const m = mode();
  if (m === 'off' || !filePath) return false;
  if (m === 'all') return true;
  return exists && riskClass(filePath) !== null;
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
    if (!s || !Array.isArray(s.checked)) return { checked: [], ts: Date.now() };
    // After 30 idle minutes the gate forgets the files it checked, so their facts
    // are asked for again. Reminders are once per session and survive it —
    // replaying 19 recorded sessions showed 31 of 54 reminders were repeats
    // caused by this very expiry.
    if (Date.now() - (s.ts || 0) > TIMEOUT_MS) {
      return { checked: s.checked.filter((k) => typeof k === 'string' && k.startsWith('reminder:')), ts: Date.now() };
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

function gateMessage(fileName, action, why) {
  return [
    `fact-forcing gate — before the first ${action} of ${fileName}${why ? ` (${why})` : ''}, state these facts:`,
    '  1. Which files import/call it (use Grep)',
    '  2. The public functions/types this change affects',
    '  3. Any data it reads/writes — field names/shape (redacted or synthetic, never raw prod data)',
    "  4. The user's current instruction, quoted verbatim",
    'Then retry the same operation. (BE_GATEGUARD=off to disable this gate.)',
  ].join('\n');
}

module.exports = { mode, enabled, riskClass, shouldGate, isChecked, markChecked, gateMessage, sessionKey };
