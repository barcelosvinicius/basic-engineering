'use strict';

/**
 * Shared helpers for the `be` enforcement hooks.
 *
 * Design rules (see CLAUDE.md + feedback/BACKLOG.md):
 *  - Fail-open: any error must let the tool call proceed. A guardrail must
 *    never break the user's session.
 *  - Opt-out: `BE_HOOKS=off` disables every be hook; `BE_HOOK_<ID>=off`
 *    disables a single check (ID upper-cased, non-alnum -> `_`).
 *  - Block only the truly critical (hardcoded secret, weakening a linter
 *    config, bypassing verification). Everything else is advisory.
 *
 * Pure detection functions are exported so test/ can exercise them without
 * spawning a process.
 */

const fs = require('fs');

// ── opt-out ──────────────────────────────────────────────────────────────────

function isOff(value) {
  return /^(0|off|false|no)$/i.test(String(value || '').trim());
}

/**
 * @param {string} [id] check id (e.g. "secret-scan"). Omit to test only the
 *                       global switch.
 */
function hooksDisabled(id) {
  if (isOff(process.env.BE_HOOKS)) return true;
  if (id) {
    const key = 'BE_HOOK_' + id.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    if (isOff(process.env[key])) return true;
  }
  return false;
}

// ── stdin / output ───────────────────────────────────────────────────────────

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseInput(raw) {
  try {
    return raw && raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Block a PreToolUse call: surface the reason to the model and stop the tool. */
function block(reason) {
  process.stderr.write('[be] BLOCKED: ' + reason + '\n');
  process.exit(2);
}

/** Inject an advisory note the model can act on, without blocking. */
function warn(eventName, context) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: eventName, additionalContext: '[be] ' + context },
    })
  );
  process.exit(0);
}

function allow() {
  process.exit(0);
}

// ── secret detection ─────────────────────────────────────────────────────────

// Obvious non-secrets: placeholders, env-var references, interpolation.
const PLACEHOLDER =
  /(YOUR[_-]|<[^>]{0,40}>|xxx+|changeme|change-me|example|placeholder|dummy|redacted|\*{3,}|\.\.\.|\$\{|%[A-Z_]+%|process\.env|os\.getenv|import\.meta\.env|getenv\()/i;

// Paths where a "secret-looking" string is expected and must not block.
const SAFE_PATH =
  /(\.env\.example|\.env\.sample|\.example\.|\.sample\.|[\\/](tests?|__tests__|__mocks__|fixtures?|mocks?|examples?|samples?)[\\/]|\.(md|mdx|lock)$)/i;

const SECRET_PATTERNS = [
  { name: 'private key', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS access key id', re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_\-]{35}\b/ },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9-]{20,}\b/ },
  { name: 'Stripe secret key', re: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/ },
  {
    name: 'hardcoded credential',
    re: /(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  },
];

/**
 * Return the distinct names of high-confidence secret patterns found in
 * `text`, skipping obvious placeholders. Conservative on purpose — this
 * blocks a tool call, so false positives must stay rare.
 */
function detectSecrets(text) {
  if (!text || typeof text !== 'string') return [];
  const hits = [];
  for (const { name, re } of SECRET_PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    if (PLACEHOLDER.test(m[0])) continue;
    hits.push(name);
  }
  return [...new Set(hits)];
}

// ── linter/formatter config protection ───────────────────────────────────────

const PROTECTED_CONFIGS = new Set([
  '.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml',
  'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts',
  '.prettierrc', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.json', '.prettierrc.yml', '.prettierrc.yaml',
  'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs',
  'biome.json', 'biome.jsonc',
  '.ruff.toml', 'ruff.toml',
  '.flake8', '.pylintrc',
  '.stylelintrc', '.stylelintrc.json', '.stylelintrc.yml', '.stylelintrc.yaml',
  '.editorconfig',
  'sonar-project.properties',
  'checkstyle.xml', '.checkstyle',
]);

function basename(filePath) {
  return String(filePath || '').replace(/^.*[\\/]/, '');
}

function isProtectedConfig(filePath) {
  return PROTECTED_CONFIGS.has(basename(filePath));
}

/** True when the path already exists on disk (treat any non-ENOENT error as "exists"). */
function pathExists(filePath) {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch (e) {
    return !(e && e.code === 'ENOENT');
  }
}

// ── git --no-verify bypass ────────────────────────────────────────────────────

function isNoVerify(command) {
  if (!command) return false;
  if (/--no-verify\b/.test(command)) return true;
  // short form: `git commit -n` (also catches combined clusters like -an)
  const m = String(command).match(/\bgit\s+commit\b([^\n;|&]*)/);
  return !!(m && /(?:^|\s)-[a-zA-Z]*n[a-zA-Z]*\b/.test(m[1]));
}

module.exports = {
  hooksDisabled,
  readStdin,
  parseInput,
  block,
  warn,
  allow,
  detectSecrets,
  isProtectedConfig,
  pathExists,
  isNoVerify,
  basename,
  PLACEHOLDER,
  SAFE_PATH,
  SECRET_PATTERNS,
  PROTECTED_CONFIGS,
};
