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

const fs = require('node:fs');

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

// ── per-session event log ────────────────────────────────────────────────────
// Every gate or reminder that fires leaves one line, so "≤2 interruptions per
// session" is counted rather than remembered (action plan 8.3/8.2). It records
// the kind, a project-relative path and a short label — never a command or file
// content. Fail-open: a log that cannot be written never affects the tool call.
function logEvent(data, event) {
  try {
    const os = require('node:os');
    const path = require('node:path');
    const dir = process.env.BE_HOOK_LOG_DIR || path.join(os.tmpdir(), 'be-hook-log');
    fs.mkdirSync(dir, { recursive: true });
    const session =
      String((data && data.session_id) || 'no-session')
        .replace(/[^A-Za-z0-9_-]/g, '')
        .slice(0, 64) || 'no-session';
    const line = {
      ts: new Date().toISOString(),
      session,
      cwd: (data && data.cwd) || process.cwd(),
      ...(requestRef(data) || {}),
      ...event,
    };
    fs.appendFileSync(path.join(dir, `${session}.jsonl`), JSON.stringify(line) + '\n');
    return true;
  } catch {
    return false;
  }
}

/**
 * Which request this tool call came from — the "who asked" half of the trail.
 *
 * The log answered *what was blocked* and not *what asked for it*, so a log line
 * read weeks later could not be traced back to the instruction that produced it
 * (action plan 10.4). The transcript's user entries carry `promptId` and `uuid`,
 * which is exactly that, and they are identifiers: this reads no message text,
 * keeping the existing rule that the log never holds a command or file content.
 *
 * Bounded on purpose — only the tail is read, because a session transcript grows
 * without limit and this runs on every tool call. Any failure returns null; an
 * enrichment must never be the reason a guardrail misbehaves.
 */
function requestRef(data) {
  const file = data && data.transcript_path;
  if (!file || typeof file !== 'string') return null;
  try {
    const size = fs.statSync(file).size;
    const window = Math.min(size, 128 * 1024);
    const buf = Buffer.alloc(window);
    const fd = fs.openSync(file, 'r');
    try {
      fs.readSync(fd, buf, 0, window, size - window);
    } finally {
      fs.closeSync(fd);
    }
    const lines = buf.toString('utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('"type":"user"')) continue;
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type !== 'user') continue;
        return { promptId: entry.promptId || null, turn: entry.uuid || null, askedAt: entry.timestamp || null };
      } catch {
        /* a line the window cut in half */
      }
    }
  } catch {
    /* no transcript, or unreadable */
  }
  return null;
}

/** A path relative to the project when it lies inside it; otherwise unchanged. */
function projectRelative(filePath, cwd) {
  const path = require('node:path');
  const p = String(filePath || '');
  if (!p || !cwd) return p;
  const rel = path.relative(cwd, p);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : p;
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
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
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
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
  'biome.json',
  'biome.jsonc',
  '.ruff.toml',
  'ruff.toml',
  '.flake8',
  '.pylintrc',
  '.stylelintrc',
  '.stylelintrc.json',
  '.stylelintrc.yml',
  '.stylelintrc.yaml',
  '.editorconfig',
  'sonar-project.properties',
  'checkstyle.xml',
  '.checkstyle',
]);

function basename(filePath) {
  return String(filePath || '').replace(/^.*[\\/]/, '');
}

function isProtectedConfig(filePath) {
  return PROTECTED_CONFIGS.has(basename(filePath));
}

/**
 * True when git already tracks this path — i.e. the file is the project's
 * settled policy rather than something being authored right now.
 *
 * Found by wearing the guardrail, 2026-09-23: adopting a linter means creating
 * its config and then tuning it several times in the same hour, and the rule
 * blocked every step after the first. "Do not weaken the rules" is a statement
 * about a config the project already agreed on; an untracked file is a draft,
 * and no one has agreed to anything yet. Any failure answers "not tracked" —
 * outside a repository the rule has nothing to protect.
 */
function isTrackedByGit(filePath) {
  try {
    const { execFileSync } = require('node:child_process');
    const dir = String(filePath || '').replace(/[\\/][^\\/]*$/, '') || '.';
    execFileSync('git', ['ls-files', '--error-unmatch', '--', filePath], {
      cwd: dir,
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
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

// A command that merely MENTIONS the flag bypasses nothing. The first form of
// this check tested the whole command string, so writing a file that documents
// the flag was blocked as if it were running it — measured 2026-09-20, when it
// refused this repo's own analysis of the rule. A gate that stops legitimate
// work is the failure mode that teaches people to switch gates off, so the
// check is now scoped to a segment git actually runs.
//
// Residual and accepted: a heredoc line that is itself a git command, and only
// then, still reads as one. Narrowing further would need to parse the shell.
const GIT_SEGMENT = /^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+|sudo\s+|command\s+|time\s+)*git\b/;

/**
 * The commands a shell line actually runs: split on `;`, `|`, `&`, `&&`, `||`
 * and newlines **outside quotes**, with quoted text blanked — quoted text is
 * data, not flags or commands. Quotes pair as the shell pairs them (no escapes
 * inside '…'; backslash escapes inside "…"); a quote with no partner is taken
 * literally, so an apostrophe cannot hide the command after it. Shared by every
 * rule that reads a Bash command, so none of them fires on a mere mention.
 *
 * The first version split first and blanked after, so `echo "a; sed -i x"`
 * read `sed -i x` as a command — found by the 8.2 mirror test.
 */
function commandSegments(command) {
  const s = String(command || '');
  const out = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < s.length && s[j] !== c) j += c === '"' && s[j] === '\\' ? 2 : 1;
      if (j < s.length) {
        cur += c + c;
        i = j;
        continue;
      } // paired: blank the content
    }
    const two = s.slice(i, i + 2);
    if (two === '&&' || two === '||') {
      out.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (c === ';' || c === '|' || c === '&' || c === '\n') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

function isNoVerify(command) {
  if (!command) return false;
  // `git commit -m "use --no-verify"` asks for nothing to be skipped.
  for (const seg of commandSegments(command)) {
    if (!GIT_SEGMENT.test(seg)) continue;
    if (/--no-verify\b/.test(seg)) return true;
    // short form: `git commit -n` (also catches combined clusters like -an)
    const m = seg.match(/\bgit\s+commit\b(.*)$/);
    if (m && /(?:^|\s)-[a-zA-Z]*n[a-zA-Z]*\b/.test(m[1])) return true;
  }
  return false;
}

// ── gestures that carry a rule (action plan 8.2, project A proposal 26) ──
// A rule read at session start does not reach the moment of risk hours later.
// These recognise the gesture itself, so the rule arrives when it decides
// something — as one advisory line, never a block.

const LEAD = '^(?:[A-Za-z_][A-Za-z0-9_]*=\\S*\\s+|sudo\\s+|command\\s+|time\\s+)*';
/** @type {[string, RegExp][]} */
const IN_PLACE = [
  ['sed in place', new RegExp(`${LEAD}sed\\s(?:.*\\s)?-(?:[a-zA-Z]*i[a-zA-Z]*|-in-place)(?:[=.]\\S*)?(?:\\s|$)`)],
  ['perl in place', new RegExp(`${LEAD}perl\\s(?:.*\\s)?-[a-zA-Z]*i`)],
];
/** @type {[string, RegExp][]} */
const ALWAYS_BULK = [
  ['git mv', new RegExp(`${LEAD}git\\s+mv\\b`)],
  ['find -exec rewrite', new RegExp(`${LEAD}find\\b.*-exec\\s+(?:sed|perl)\\b`)],
  ['rename', new RegExp(`${LEAD}rename\\s`)],
];
const TMP = /^(\/tmp\/|\/var\/tmp\/|\$TMPDIR|\$\{?TMPDIR|\$SP\b|\$\{?SP\}?\/)/;

/**
 * The files an in-place sed/perl segment rewrites: operands after the flags,
 * minus the script (blanked when quoted, or the first operand with no -e).
 */
function inPlaceTargets(seg) {
  const tokens = seg.split(/\s+/).slice(1);
  const out = [];
  let scriptGiven = false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '-e' || t === '--expression' || t === '-f') {
      scriptGiven = true;
      i++;
      continue;
    }
    if (t.startsWith('-')) continue;
    if (t === "''" || t === '""') {
      scriptGiven = true;
      continue;
    }
    if (!scriptGiven) {
      scriptGiven = true;
      continue;
    } // an unquoted script
    out.push(t);
  }
  return out;
}

/**
 * The bulk-rewrite gesture a command runs, or null. Narrowed by replaying 19
 * recorded sessions: a one-file `sed -i` is an edit, and a rewrite of scratch
 * files touches no project text — both fired and neither carried the rule.
 * Bulk means many targets: several files, a glob, find -exec, git mv, rename.
 */
function bulkGesture(command) {
  for (const seg of commandSegments(command)) {
    for (const [name, re] of ALWAYS_BULK) if (re.test(seg)) return name;
    for (const [name, re] of IN_PLACE) {
      if (!re.test(seg)) continue;
      const targets = inPlaceTargets(seg).filter((t) => !TMP.test(t));
      if (targets.length >= 2 || targets.some((t) => /[*?]/.test(t))) return name;
    }
  }
  return null;
}

/** The removal gesture a command runs, or null (`git rm`; `git remote` is not one). */
function removalGesture(command) {
  const re = new RegExp(`${LEAD}git\\s+rm\\b`);
  return commandSegments(command).some((seg) => re.test(seg)) ? 'git rm' : null;
}

/** Net lines an Edit/MultiEdit removes: old minus new, summed over edits. */
function removedLines(input) {
  const count = (s) => (typeof s === 'string' && s !== '' ? s.split('\n').length : 0);
  const edits = Array.isArray(input && input.edits) ? input.edits : [input || {}];
  return edits.reduce((n, e) => n + (e ? count(e.old_string) - count(e.new_string) : 0), 0);
}

const CODE =
  /\.(java|kt|kts|scala|groovy|js|jsx|mjs|cjs|ts|tsx|vue|svelte|py|go|rs|rb|php|cs|fs|swift|c|cc|cpp|h|hpp|sql)$/i;

/** Whether a path is source code (the stack reminder is for code, not docs or config). */
function isCodeFile(filePath) {
  return CODE.test(String(filePath || ''));
}

const TEST_PATH =
  /((^|[\\/])(tests?|__tests__|__mocks__|spec|e2e)[\\/]|\.(test|spec)\.[a-z]+$|Tests?\.(java|kt|cs)$|_test\.(go|py)$|(^|[\\/])test_[^\\/]+\.py$)/i;

/** Whether a path is a test (its stack's skills are about the code under test, not the test). */
function isTestFile(filePath) {
  return TEST_PATH.test(String(filePath || ''));
}

/**
 * Stacks for one file: the nearest directory, from the file up to the project
 * root, that holds a stack's indicators. Found by replay: detecting only at the
 * root offered the Java backend skills for an Angular component whose own
 * package.json sat two levels up. A file outside the project gets none.
 */
function detectStacksFor(fileAbs, projectRoot, mappings) {
  const path = require('node:path');
  if (!fileAbs || !projectRoot) return [];
  const rel = path.relative(projectRoot, fileAbs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return [];
  let dir = path.dirname(fileAbs);
  for (;;) {
    const found = detectStacks(dir, mappings);
    if (found.length) return found;
    if (dir === projectRoot || path.dirname(dir) === dir) return [];
    dir = path.dirname(dir);
  }
}

/** Stacks whose indicator files exist in `cwd`, per config/stack-mappings.json. */
function detectStacks(cwd, mappings) {
  const path = require('node:path');
  if (!cwd || !mappings || !Array.isArray(mappings.stacks)) return [];
  let names = null;
  const has = (ind) => {
    if (!ind.includes('*')) return fs.existsSync(path.join(cwd, ind));
    if (names === null) {
      try {
        names = fs.readdirSync(cwd);
      } catch {
        names = [];
      }
    }
    const suffix = ind.replace(/^\*/, '');
    return names.some((n) => n.endsWith(suffix));
  };
  return mappings.stacks.filter((s) => Array.isArray(s.indicators) && s.indicators.some(has));
}

module.exports = {
  hooksDisabled,
  readStdin,
  parseInput,
  block,
  warn,
  allow,
  logEvent,
  projectRelative,
  detectSecrets,
  isProtectedConfig,
  isTrackedByGit,
  requestRef,
  pathExists,
  isNoVerify,
  commandSegments,
  bulkGesture,
  removalGesture,
  removedLines,
  isCodeFile,
  isTestFile,
  detectStacks,
  detectStacksFor,
  basename,
  PLACEHOLDER,
  SAFE_PATH,
  SECRET_PATTERNS,
  PROTECTED_CONFIGS,
};
