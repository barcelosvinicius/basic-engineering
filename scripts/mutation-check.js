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

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');

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
      out += ' '.repeat(stop - i);
      i = stop;
      if (end >= 0) state.block = false;
      continue;
    }
    if (c === '/' && line[i + 1] === '/') {
      out += ' '.repeat(line.length - i);
      break;
    }
    if (c === '/' && line[i + 1] === '*') {
      state.block = true;
      continue;
    }
    const regexStart = c === '/' && (lastCode === '' || /[(,=:[!&|?{};]/.test(lastCode) || /\breturn\s*$/.test(out));
    if (c === '"' || c === "'" || c === '`' || regexStart) {
      const close = regexStart ? '/' : c;
      let j = i + 1;
      let inClass = false;
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (regexStart && line[j] === '[') inClass = true;
        else if (regexStart && line[j] === ']') inClass = false;
        else if (line[j] === close && !inClass) break;
        j++;
      }
      const stop = Math.min(j + 1, line.length);
      out += c + ' '.repeat(Math.max(0, stop - i - 2)) + (stop - i > 1 ? line[stop - 1] : '');
      i = stop;
      lastCode = close;
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

/** @type {[RegExp, string][]} */
const SWAPS = [
  [/===/g, '!=='],
  [/!==/g, '==='],
  [/&&/g, '||'],
  [/\|\|/g, '&&'],
  [/ >= /g, ' < '],
  [/ <= /g, ' > '],
  [/ > /g, ' <= '],
  [/ < /g, ' >= '],
  [/\btrue\b/g, 'false'],
  [/\bfalse\b/g, 'true'],
  [/(?<![?!=])!(?=[\w(])/g, ''],
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
      out.push({
        line: n + 1,
        op,
        from: line.trim(),
        to: mutated.trim(),
        text: [...lines.slice(0, n), mutated, ...lines.slice(n + 1)].join('\n'),
      });
    };
    for (const [re, to] of SWAPS) {
      for (const m of masked.matchAll(re))
        at(m.index, m.index + m[0].length, to, `${m[0].trim() || '!'} → ${to.trim() || '(removed)'}`);
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
  try {
    entries = fs.readdirSync(dir).filter((n) => n.startsWith('be-mutation-'));
  } catch {
    return 0;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    try {
      if (now - fs.statSync(full).mtimeMs < maxAgeMs) continue;
      fs.rmSync(full, { recursive: true, force: true });
      removed++;
    } catch {
      /* someone else's, or already gone */
    }
  }
  return removed;
}

const hashOf = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
const fmt = (ms) =>
  ms < 60000
    ? `${Math.round(ms / 1000)}s`
    : `${Math.floor(ms / 60000)}m${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}s`;

/**
 * Every repo file a target transitively requires, itself included, sorted.
 *
 * Selecting by "did this file change" under-measures, and the shape is visible
 * in this repository: pre-tooluse.js requires _gateguard.js and _lib.js, so a
 * change to _lib.js can turn a killed mutant of pre-tooluse.js into a survivor
 * while pre-tooluse.js itself is untouched. The retest set is the closure, not
 * the file — Leung & White's class firewall (1990), and what Ekstazi (ISSTA
 * 2015) tracks dynamically at file granularity.
 *
 * Static `require('./x')` resolution is the cheap approximation: it sees what
 * this repository actually writes and stays inside it. A dynamic require would
 * be missed, so anything it cannot resolve is reported rather than assumed.
 */
function closureOf(root, file, seen = new Set(), unresolved = []) {
  const rel = file.replace(/\\/g, '/');
  if (seen.has(rel)) return { files: seen, unresolved };
  seen.add(rel);
  let src = '';
  try {
    src = fs.readFileSync(path.join(root, rel), 'utf8');
  } catch {
    return { files: seen, unresolved };
  }
  // Read over the raw source, comments and strings included. A require written
  // inside a comment adds an edge that does not exist, which costs time and
  // never costs correctness — the safe side to err on for a retest set.
  const re = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(src))) {
    const base = path.posix.join(path.posix.dirname(rel), m[1]);
    const candidate = [base, `${base}.js`, `${base}.json`, `${base}/index.js`].find((c) =>
      fs.existsSync(path.join(root, c))
    );
    if (candidate) closureOf(root, candidate, seen, unresolved);
    else unresolved.push(`${rel} → ${m[1]}`);
  }
  return { files: seen, unresolved };
}

/** What a measurement was taken against: the target, its tests, and its closure. */
function fingerprint(root, t) {
  const read = (rel) => {
    try {
      return fs.readFileSync(path.join(root, rel), 'utf8');
    } catch {
      return '';
    }
  };
  const { files, unresolved } = closureOf(root, t.file);
  const closure = [...files].sort();
  return {
    file: hashOf(read(t.file)),
    tests: t.tests.map((f) => hashOf(read(f))),
    closure: hashOf(closure.map((f) => `${f}:${hashOf(read(f))}`).join('\n')),
    closureSize: closure.length,
    unresolved,
  };
}

/** One line from the terminal, or '' when there is no terminal to read from. */
function ask(question) {
  return new Promise((resolve) => {
    try {
      process.stdout.write(question);
      process.stdin.setEncoding('utf8');
      const onData = (d) => {
        process.stdin.removeListener('data', onData);
        process.stdin.pause();
        resolve(String(d).trim());
      };
      process.stdin.resume();
      process.stdin.on('data', onData);
    } catch {
      resolve('');
    }
  });
}

/** The commit a measurement was taken at, or '' outside a repository. */
function headCommit(root) {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

const ledgerPath = (root) => path.join(root, 'scripts', 'mutation-ledger.json');

function readLedger(root) {
  try {
    return JSON.parse(fs.readFileSync(ledgerPath(root), 'utf8'));
  } catch {
    return {};
  }
}

function writeLedger(root, ledger) {
  try {
    fs.writeFileSync(ledgerPath(root), JSON.stringify(ledger, null, 2) + '\n');
    return true;
  } catch {
    return false;
  }
}

/** True when a ledger entry still describes the code as it stands now. */
function ledgerHolds(entry, fp) {
  return Boolean(
    entry &&
      entry.fingerprint &&
      entry.fingerprint.file === fp.file &&
      entry.fingerprint.closure === fp.closure &&
      JSON.stringify(entry.fingerprint.tests) === JSON.stringify(fp.tests)
  );
}

/** Modules whose file or tests changed since a git ref — the lot worth measuring. */
function changedSince(root, ref, targets = TARGETS) {
  let out = '';
  try {
    out = execFileSync('git', ['diff', '--name-only', ref], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    out += execFileSync('git', ['status', '--porcelain'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/^\S{1,2}\s+/, ''))
      .join('\n');
  } catch {
    return null; // not a repository, or an unknown ref: measure everything
  }
  const touched = new Set(
    out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
  );
  // The closure, not the file: a target is selected when anything it
  // transitively requires changed, or its tests did.
  return targets.filter((t) => {
    if (t.tests.some((f) => touched.has(f))) return true;
    for (const f of closureOf(root, t.file).files) if (touched.has(f)) return true;
    return false;
  });
}

/** Run one suite in `cwd`; resolves true when it passes. Never hangs. */
function runTests(cwd, tests, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', ...tests], { cwd, env, stdio: 'ignore' });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve(false);
    }, 120000);
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
    child.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function main(argv, log = console.log) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const root = path.resolve(arg('--root') || path.join(__dirname, '..'));
  const only = arg('--only');
  const jobs = Math.max(1, Number(arg('-j') || arg('--jobs') || 4));
  const eqFile = path.join(root, 'scripts', 'mutation-equivalents.json');
  const equivalents = fs.existsSync(eqFile) ? JSON.parse(fs.readFileSync(eqFile, 'utf8')) : [];
  const isEquivalent = (file, m) =>
    equivalents.find((e) => e.file === file && e.op === m.op && e.from === m.from && e.to === m.to);

  // Stamp mode: record what each equivalent was accepted against, and stop.
  if (argv.includes('--stamp')) {
    for (const e of equivalents) {
      try {
        e.fileHash = hashOf(fs.readFileSync(path.join(root, e.file), 'utf8'));
      } catch {
        /* a file that moved */
      }
    }
    fs.writeFileSync(eqFile, JSON.stringify(equivalents, null, 2) + '\n');
    log(`mutation-check: ${equivalents.length} equivalent(s) stamped with the current file hash.`);
    return 0;
  }

  const inScope = TARGETS.filter((x) => !only || x.file === only);
  let targets = inScope;
  const ledger = readLedger(root);
  // Every target starts with no verdict. A run that ends with any of these
  // still 'unmeasured' cannot report itself as finished (10.1b).
  /**
   * @type {Map<string, {
   *   state: 'unmeasured'|'measured'|'inherited'|'absent'|'no-suite'|'red-suite'|'estimated',
   *   entry?: {killed?: number, total?: number, at?: string, commit?: string},
   *   detail?: string, killed?: number, total?: number, open?: number
   * }>}
   */
  const verdict = new Map(inScope.map((t) => [t.file, { state: 'unmeasured' }]));

  const since = arg('--since');
  if (since) {
    const changed = changedSince(root, since, targets);
    if (changed) {
      targets = changed;
      log(`mutation-check: ${targets.length} module(s) changed since ${since} (closure-aware)`);
    }
  }

  // Incremental: measure what the ledger can no longer vouch for, inherit the
  // rest WITH the hash and date it was measured at. Never inherit in silence.
  if (argv.includes('--incremental')) {
    const fresh = [];
    for (const t of targets) {
      const fp = fingerprint(root, t);
      const entry = ledger[t.file];
      if (ledgerHolds(entry, fp)) {
        verdict.set(t.file, { state: 'inherited', entry });
      } else {
        fresh.push(t);
      }
    }
    targets = fresh;
  }

  // ── 10.5: the cost is stated before the wait begins ────────────────────────
  // A full pass is 13 to 30 minutes on this repository, and it used to start
  // unannounced from inside `npm run release`. The estimate is instant here
  // because the ledger records what each module cost last time; a module the
  // ledger has never seen is reported as unknown rather than guessed.
  // Non-interactive runs (CI, a pipe, --yes) proceed and say so: a prompt that
  // nobody can answer is a hang, not a safeguard.
  if (!argv.includes('--estimate') && !argv.includes('--stamp') && targets.length) {
    let known = 0;
    let unknownCount = 0;
    for (const t of targets) {
      const e = ledger[t.file];
      if (e && e.perMs && e.mutants) known += (e.mutants * e.perMs) / Math.max(1, Math.min(jobs, e.mutants));
      else unknownCount++;
    }
    const totalNote =
      (known ? `≈ ${fmt(known)}` : 'unknown') +
      (unknownCount ? ` + ${unknownCount} module(s) never measured before` : '');
    log(`mutation-check: ${targets.length} module(s) to measure, ${totalNote}.`);

    const interactive = process.stdin.isTTY && process.stdout.isTTY;
    if (argv.includes('--yes') || !interactive) {
      log(`mutation-check: proceeding without asking (${argv.includes('--yes') ? '--yes' : 'not a terminal'}).`);
    } else {
      const answer = await ask('  Run it now? [Y]es / [n]o / [i]ncremental (measure only what changed): ');
      if (/^n/i.test(answer)) {
        log('mutation-check: skipped by request — nothing was measured, and nothing is claimed.');
        return 0;
      }
      if (/^i/i.test(answer)) {
        const fresh = targets.filter((t) => {
          const holds = ledgerHolds(ledger[t.file], fingerprint(root, t));
          if (holds) verdict.set(t.file, { state: 'inherited', entry: ledger[t.file] });
          return !holds;
        });
        log(`mutation-check: ${fresh.length} of ${targets.length} module(s) still need measuring.`);
        targets = fresh;
      }
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
      // Two different absences. A module that is not in this checkout is
      // legitimately out of scope. A module that IS here with no suite to run
      // against it is a module nothing can measure — and that is a missing
      // verdict, not a skip.
      if (!fs.existsSync(source)) {
        log(`·  ${t.file}  (not in this checkout — out of scope)`);
        verdict.set(t.file, { state: 'absent' });
        continue;
      }
      const missingTests = t.tests.filter((f) => !fs.existsSync(path.join(root, f)));
      if (missingTests.length) {
        log(`✗ ${t.file}  NOT MEASURED — no suite here: ${missingTests.join(', ')}`);
        verdict.set(t.file, { state: 'no-suite', detail: missingTests.join(', ') });
        continue;
      }
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
        verdict.set(t.file, { state: 'red-suite' });
        continue;
      }
      log(`·  ${t.file}  ${all.length} mutants × ${fmt(per)} ÷ ${slots} ≈ ${fmt((all.length * per) / slots)}`);
      if (argv.includes('--estimate')) {
        verdict.set(t.file, { state: 'estimated' });
        continue;
      }

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

      // The ledger records what this result was taken against, so a later run
      // can inherit it only while the code it describes has not moved (10.2).
      verdict.set(t.file, { state: 'measured', killed, total: all.length, open });
      ledger[t.file] = {
        killed,
        total: all.length,
        equivalents: survivors.length - open,
        open,
        perMs: per,
        mutants: all.length,
        at: new Date().toISOString().slice(0, 10),
        commit: headCommit(root),
        fingerprint: fingerprint(root, t),
      };
      for (const m of survivors.sort((a, b) => a.line - b.line)) {
        const eq = isEquivalent(t.file, m);
        const outdated = Boolean(eq && eq.fileHash && eq.fileHash !== current);
        if (outdated) stale++;
        log(
          `    ${eq ? (outdated ? 'RE-CHECK  ' : 'equivalent') : 'SURVIVED  '} L${m.line}  ${m.op}\n        ${m.from}\n      → ${m.to}` +
            (eq ? `\n        (${eq.reason})` : '') +
            (outdated
              ? '\n        (accepted against an older version of this file — confirm it still holds, then --stamp)'
              : '')
        );
      }
    }
  } finally {
    for (const tmp of copies) fs.rmSync(tmp, { recursive: true, force: true });
  }

  writeLedger(root, ledger);

  // ── 10.1b: the roster, always ──────────────────────────────────────────────
  // Measured three times on 2026-09-23/24: a run killed mid-pass leaves nine ✔
  // lines and two targets carrying only their start marker, and nothing says how
  // many were supposed to run. Counting the ✔s reads as green. A pass that
  // cannot finish must be unable to look finished, so the denominator is printed
  // whatever happened, and an unmeasured target fails --check.
  if (argv.includes('--estimate')) return 0; // an estimate measured nothing and claims nothing
  const rows = inScope.map((t) => ({ file: t.file, v: verdict.get(t.file) }));
  const measured = rows.filter(({ v }) => v.state === 'measured');
  const inherited = rows.filter(({ v }) => v.state === 'inherited');
  const absent = rows.filter(({ v }) => v.state === 'absent');
  const missing = rows.filter(({ v }) => ['unmeasured', 'red-suite', 'no-suite'].includes(v.state));
  // The four states are exhaustive, so the line always adds up to the whole
  // scope — that is what makes it a denominator rather than a tally.
  log(
    `\nmutation-check: ${measured.length + inherited.length} of ${inScope.length - absent.length} target(s) in scope accounted for` +
      ` — ${measured.length} measured now, ${inherited.length} inherited, ${missing.length} without a verdict` +
      (absent.length ? `, ${absent.length} not in this checkout` : '') +
      '.'
  );
  for (const { file, v } of inherited) {
    const e = v.entry || {};
    log(`    inherited  ${file}  ${e.killed}/${e.total}, measured ${e.at}${e.commit ? ` at ${e.commit}` : ''}`);
  }
  const why = {
    'red-suite': 'its suite fails without any mutant',
    'no-suite': 'no suite here',
    unmeasured: 'never reached',
  };
  for (const { file, v } of missing) {
    log(`    NO VERDICT ${file}  (${why[v.state]}${v.detail ? `: ${v.detail}` : ''})`);
  }

  if (argv.includes('--check') && missing.length && !argv.includes('--estimate')) {
    console.error(
      `mutation-check: ${missing.length} target(s) finished with no verdict — a pass that did not measure them cannot report them as green.`
    );
    return 1;
  }
  if (argv.includes('--check') && failedBaseline) {
    console.error(
      `mutation-check: ${failedBaseline} module(s) could not be measured — their tests fail without any mutant.`
    );
    return 1;
  }
  if (argv.includes('--check') && stale) {
    console.error(
      `mutation-check: ${stale} equivalent(s) were accepted against an older version of their file — re-confirm them, then run --stamp.`
    );
    return 1;
  }
  if (argv.includes('--check') && unrecorded) {
    console.error(
      `mutation-check: ${unrecorded} surviving mutant(s) — a test that would notice them is missing, or record why they cannot change behaviour.`
    );
    return 1;
  }
  return 0;
}

if (require.main === module)
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });

module.exports = {
  mask,
  mutants,
  main,
  changedSince,
  closureOf,
  fingerprint,
  ledgerHolds,
  readLedger,
  hashOf,
  sweepLeftovers,
  TARGETS,
};
