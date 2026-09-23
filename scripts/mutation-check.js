#!/usr/bin/env node
'use strict';
/**
 * Mutation pass over the base's own guards: would any test notice if this line
 * were wrong?
 *
 * Why this exists: the bypass guard's suite asserted only what must block, so a
 * detector that blocked everything *containing the string* passed it (A-14,
 * 2026-09-20). Coverage said the lines ran. Nothing said the tests would notice
 * them changing. A mutant that survives is a line whose correctness no test
 * checks.
 *
 * How: copy the repository (without .git) to throwaway directories, apply one
 * small change at a time to a target module — flip a comparison, swap && and
 * ||, force a condition true or false — and run that module's tests with
 * `node --test`, no shell. Tests fail -> the mutant is killed. Tests pass -> it
 * survived. The working tree is never touched.
 *
 * Three properties this tool earned the hard way:
 *   - it **times itself first**, so the estimate is printed before the wait;
 *   - it **refuses a red suite**: a failing suite kills every mutant and reports
 *     a perfect score (measured here: 131 of 131 over a broken test);
 *   - an **equivalent carries the hash** of the file it was accepted against, so
 *     a recorded "this cannot change behaviour" cannot outlive the code it was
 *     about without saying so.
 *
 * Usage:
 *   node scripts/mutation-check.js                  report per module
 *   node scripts/mutation-check.js --check          exit 1 on an unrecorded survivor
 *   node scripts/mutation-check.js --only <file>    one target
 *   node scripts/mutation-check.js --since <ref>    only modules changed since a git ref
 *   node scripts/mutation-check.js --estimate       print the cost and stop
 *   node scripts/mutation-check.js -j <n>           mutants in parallel (default 4)
 *   node scripts/mutation-check.js --stamp          record the equivalents' file hashes
 *   node scripts/mutation-check.js --root <dir>     run against another checkout
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const TARGETS = [
  { file: 'plugins/be/hooks/scripts/_lib.js', tests: ['test/hooks.test.js'] },
  { file: 'plugins/be/hooks/scripts/_gateguard.js', tests: ['test/hooks.test.js'] },
  { file: 'plugins/be/hooks/scripts/pre-tooluse.js', tests: ['test/hooks.test.js'] },
  { file: 'plugins/be/hooks/scripts/_state.js', tests: ['test/continuity.test.js'] },
  { file: 'scripts/proposals-audit.js', tests: ['test/proposals.test.js'] },
  { file: 'plugins/be/scripts/distance.js', tests: ['test/distance.test.js'] },
  { file: 'plugins/be/scripts/permissions.js', tests: ['test/permissions.test.js'] },
  { file: 'plugins/be/scripts/_stacks.js', tests: ['test/permissions.test.js', 'test/distance.test.js'] },
  { file: 'scripts/lib/probes.js', tests: ['test/probes.test.js'] },
  { file: 'scripts/lib/edges.js', tests: ['test/graph.test.js'] },
  { file: 'scripts/lib/inventory.js', tests: ['test/inventory.test.js'] },
];

/**
 * The line with strings, regex literals and comments blanked out (same length),
 * so operators are only ever found in code. `state` carries a block comment
 * across lines.
 */
function mask(line, state) {
  let out = '';
  let i = 0;
  let lastCode = '';
  while (i < line.length) {
    const c = line[i];
    if (state.block) {
      const end = line.indexOf('*/', i);
      const stop = end < 0 ? line.length : end + 2;
      out += ' '.repeat(stop - i); i = stop;
      if (end >= 0) state.block = false;
      continue;
    }
    if (c === '/' && line[i + 1] === '/') { out += ' '.repeat(line.length - i); break; }
    if (c === '/' && line[i + 1] === '*') { state.block = true; continue; }
    const regexStart = c === '/' && (lastCode === '' || /[(,=:[!&|?{};]/.test(lastCode) || /\breturn\s*$/.test(out));
    if (c === '"' || c === "'" || c === '`' || regexStart) {
      const close = regexStart ? '/' : c;
      let j = i + 1;
      let inClass = false;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (regexStart && line[j] === '[') inClass = true;
        else if (regexStart && line[j] === ']') inClass = false;
        else if (line[j] === close && !inClass) break;
        j++;
      }
      const stop = Math.min(j + 1, line.length);
      out += c + ' '.repeat(Math.max(0, stop - i - 2)) + (stop - i > 1 ? line[stop - 1] : '');
      i = stop; lastCode = close;
      continue;
    }
    out += c;
    if (!/\s/.test(c)) lastCode = c;
    i++;
  }
  return out;
}

/** Matching `)` for the `(` at `open`, on the same masked line, or -1. */
function closeParen(masked, open) {
  let depth = 0;
  for (let k = open; k < masked.length; k++) {
    if (masked[k] === '(') depth++;
    else if (masked[k] === ')' && --depth === 0) return k;
  }
  return -1;
}

const SWAPS = [
  [/===/g, '!=='], [/!==/g, '==='], [/&&/g, '||'], [/\|\|/g, '&&'],
  [/ >= /g, ' < '], [/ <= /g, ' > '], [/ > /g, ' <= '], [/ < /g, ' >= '],
  [/\btrue\b/g, 'false'], [/\bfalse\b/g, 'true'], [/(?<![?!=])!(?=[\w(])/g, ''],
];

/** Every single-point mutant of a source text: { line, op, from, to, text }. */
function mutants(source) {
  const lines = source.split('\n');
  const state = { block: false };
  const out = [];
  lines.forEach((line, n) => {
    const masked = mask(line, state);
    const at = (start, end, to, op) => {
      const mutated = line.slice(0, start) + to + line.slice(end);
      out.push({ line: n + 1, op, from: line.trim(), to: mutated.trim(), text: [...lines.slice(0, n), mutated, ...lines.slice(n + 1)].join('\n') });
    };
    for (const [re, to] of SWAPS) {
      for (const m of masked.matchAll(re)) at(m.index, m.index + m[0].length, to, `${m[0].trim() || '!'} → ${to.trim() || '(removed)'}`);
    }
    for (const m of masked.matchAll(/\bif \(/g)) {
      const open = m.index + 3;
      const close = closeParen(masked, open);
      if (close < 0) continue;
      at(open + 1, close, 'true', 'condition → true');
      at(open + 1, close, 'false', 'condition → false');
    }
  });
  return out;
}

/**
 * Throwaway copies this tool left behind. A run that is interrupted never
 * reaches its cleanup, and each copy is the whole repository: 138 of them were
 * found on this machine before this existed. Swept on the next run, by age, so
 * a copy in use is never touched.
 */
function sweepLeftovers(dir = os.tmpdir(), maxAgeMs = 2 * 60 * 60 * 1000, now = Date.now()) {
  let removed = 0;
  let entries = [];
  try { entries = fs.readdirSync(dir).filter((n) => n.startsWith('be-mutation-')); } catch { return 0; }
  for (const name of entries) {
    const full = path.join(dir, name);
    try {
      if (now - fs.statSync(full).mtimeMs < maxAgeMs) continue;
      fs.rmSync(full, { recursive: true, force: true });
      removed++;
    } catch { /* someone else's, or already gone */ }
  }
  return removed;
}

const hashOf = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
const fmt = (ms) => (ms < 60000 ? `${Math.round(ms / 1000)}s` : `${Math.floor(ms / 60000)}m${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}s`);

/** Modules whose file or tests changed since a git ref — the lot worth measuring. */
function changedSince(root, ref, targets = TARGETS) {
  let out = '';
  try {
    out = execFileSync('git', ['diff', '--name-only', ref], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    out += execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/).map((l) => l.trim().replace(/^\S{1,2}\s+/, '')).join('\n');
  } catch {
    return null; // not a repository, or an unknown ref: measure everything
  }
  const touched = new Set(out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
  return targets.filter((t) => touched.has(t.file) || t.tests.some((f) => touched.has(f)));
}

/** Run one suite in `cwd`; resolves true when it passes. Never hangs. */
function runTests(cwd, tests, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', ...tests], { cwd, env, stdio: 'ignore' });
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(false); }, 120000);
    child.on('exit', (code) => { clearTimeout(timer); resolve(code === 0); });
    child.on('error', () => { clearTimeout(timer); resolve(false); });
  });
}

async function main(argv, log = console.log) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const root = path.resolve(arg('--root') || path.join(__dirname, '..'));
  const only = arg('--only');
  const jobs = Math.max(1, Number(arg('-j') || arg('--jobs') || 4));
  const eqFile = path.join(root, 'scripts', 'mutation-equivalents.json');
  const equivalents = fs.existsSync(eqFile) ? JSON.parse(fs.readFileSync(eqFile, 'utf8')) : [];
  const isEquivalent = (file, m) => equivalents.find((e) => e.file === file && e.op === m.op && e.from === m.from && e.to === m.to);

  // Stamp mode: record what each equivalent was accepted against, and stop.
  if (argv.includes('--stamp')) {
    for (const e of equivalents) {
      try { e.fileHash = hashOf(fs.readFileSync(path.join(root, e.file), 'utf8')); } catch { /* a file that moved */ }
    }
    fs.writeFileSync(eqFile, JSON.stringify(equivalents, null, 2) + '\n');
    log(`mutation-check: ${equivalents.length} equivalent(s) stamped with the current file hash.`);
    return 0;
  }

  let targets = TARGETS.filter((x) => !only || x.file === only);
  const since = arg('--since');
  if (since) {
    const changed = changedSince(root, since, targets);
    if (changed) {
      targets = changed;
      log(`mutation-check: ${targets.length} module(s) changed since ${since}`);
    }
  }

  // A test runner marks its children with NODE_TEST_CONTEXT, and a child
  // `node --test` that inherits it reports to the parent and exits 0 even when
  // its tests fail — every mutant would "survive". Found by the mirror test in
  // test/mutation.test.js; the known-failing case had passed for that wrong reason.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;

  const swept = sweepLeftovers();
  if (swept) log(`mutation-check: swept ${swept} copy(ies) left by an interrupted run.`);

  const copies = [];
  let unrecorded = 0;
  let failedBaseline = 0;
  let stale = 0;
  try {
    for (const t of targets) {
      const source = path.join(root, t.file);
      if (!fs.existsSync(source) || !t.tests.every((f) => fs.existsSync(path.join(root, f)))) { log(`·  ${t.file}  (not in this checkout — skipped)`); continue; }
      const original = fs.readFileSync(source, 'utf8');
      const all = mutants(original);
      const slots = Math.max(1, Math.min(jobs, all.length || 1));

      // One throwaway copy per worker: mutants run in parallel and each needs
      // its own file to write.
      while (copies.length < slots) {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'be-mutation-'));
        fs.cpSync(root, tmp, { recursive: true, filter: (src) => !/[\\/](\.git|node_modules)$/.test(src) });
        copies.push(tmp);
      }

      // The suite must be green BEFORE any mutant, and timing it here is what
      // makes the estimate honest: this machine, this suite, today.
      const started = Date.now();
      const green = await runTests(copies[0], t.tests, env);
      const per = Date.now() - started;
      if (!green) {
        failedBaseline++;
        log(`✗ ${t.file}  NOT MEASURED — ${t.tests.join(', ')} already fails without any mutant`);
        continue;
      }
      log(`·  ${t.file}  ${all.length} mutants × ${fmt(per)} ÷ ${slots} ≈ ${fmt((all.length * per) / slots)}`);
      if (argv.includes('--estimate')) continue;

      const survivors = [];
      let next = 0;
      const worker = async (slot) => {
        const dir = copies[slot];
        const target = path.join(dir, t.file);
        try {
          for (;;) {
            const i = next++;
            if (i >= all.length) break;
            fs.writeFileSync(target, all[i].text);
            if (await runTests(dir, t.tests, env)) survivors.push(all[i]);
          }
        } finally {
          fs.writeFileSync(target, original);
        }
      };
      await Promise.all(Array.from({ length: slots }, (_, slot) => worker(slot)));

      const killed = all.length - survivors.length;
      const pct = all.length ? Math.round((100 * killed) / all.length) : 100;
      const open = survivors.filter((m) => !isEquivalent(t.file, m)).length;
      unrecorded += open;
      const eqNote = survivors.length > open ? `, ${survivors.length - open} equivalent` : '';
      log(`${open ? '✗' : '✔'} ${t.file}  killed ${killed}/${all.length} (${pct}%)${eqNote}`);
      const current = hashOf(original);
      for (const m of survivors.sort((a, b) => a.line - b.line)) {
        const eq = isEquivalent(t.file, m);
        const outdated = Boolean(eq && eq.fileHash && eq.fileHash !== current);
        if (outdated) stale++;
        log(`    ${eq ? (outdated ? 'RE-CHECK  ' : 'equivalent') : 'SURVIVED  '} L${m.line}  ${m.op}\n        ${m.from}\n      → ${m.to}` +
          (eq ? `\n        (${eq.reason})` : '') +
          (outdated ? '\n        (accepted against an older version of this file — confirm it still holds, then --stamp)' : ''));
      }
    }
  } finally {
    for (const tmp of copies) fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (argv.includes('--check') && failedBaseline) {
    console.error(`mutation-check: ${failedBaseline} module(s) could not be measured — their tests fail without any mutant.`);
    return 1;
  }
  if (argv.includes('--check') && stale) {
    console.error(`mutation-check: ${stale} equivalent(s) were accepted against an older version of their file — re-confirm them, then run --stamp.`);
    return 1;
  }
  if (argv.includes('--check') && unrecorded) {
    console.error(`mutation-check: ${unrecorded} surviving mutant(s) — a test that would notice them is missing, or record why they cannot change behaviour.`);
    return 1;
  }
  return 0;
}

if (require.main === module) main(process.argv.slice(2)).then((code) => { process.exitCode = code; });

module.exports = { mask, mutants, main, changedSince, hashOf, sweepLeftovers, TARGETS };
