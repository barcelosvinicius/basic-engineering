#!/usr/bin/env node
'use strict';
/**
 * Mutation pass over the base's own guards: would any test notice if this line
 * were wrong?
 *
 * Why this exists: the bypass guard's suite asserted only what must block, so a
 * detector that blocked everything would have passed it (A-14, 2026-09-20).
 * Coverage said the lines ran. Nothing said the tests would notice them
 * changing. A mutant that survives is a line whose correctness no test checks.
 *
 * How: copy the repository (without .git) to a throwaway directory, apply one
 * small change at a time to a target module — flip a comparison, swap && and
 * ||, force a condition true or false — and run that module's tests with
 * `node --test`, no shell. Tests fail -> the mutant is killed. Tests pass -> it
 * survived. The working tree is never touched.
 *
 * A survivor is either killed by a new test or recorded in
 * scripts/mutation-equivalents.json with the reason it cannot change behaviour.
 *
 * Usage:
 *   node scripts/mutation-check.js                 report per module
 *   node scripts/mutation-check.js --check         exit 1 on an unrecorded survivor
 *   node scripts/mutation-check.js --only <file>   one target
 *   node scripts/mutation-check.js --root <dir>    run against another checkout
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const TARGETS = [
  { file: 'plugins/be/hooks/scripts/_lib.js', tests: ['test/hooks.test.js'] },
  { file: 'plugins/be/hooks/scripts/_gateguard.js', tests: ['test/hooks.test.js'] },
  { file: 'plugins/be/hooks/scripts/pre-tooluse.js', tests: ['test/hooks.test.js'] },
  { file: 'scripts/proposals-audit.js', tests: ['test/proposals.test.js'] },
  { file: 'plugins/be/scripts/distance.js', tests: ['test/distance.test.js'] },
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

function main(argv) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const root = path.resolve(arg('--root') || path.join(__dirname, '..'));
  const only = arg('--only');
  const eqFile = path.join(root, 'scripts', 'mutation-equivalents.json');
  const equivalents = fs.existsSync(eqFile) ? JSON.parse(fs.readFileSync(eqFile, 'utf8')) : [];
  const isEquivalent = (file, m) => equivalents.find((e) => e.file === file && e.op === m.op && e.from === m.from && e.to === m.to);

  // A test runner marks its children with NODE_TEST_CONTEXT, and a child
  // `node --test` that inherits it reports to the parent and exits 0 even when
  // its tests fail — every mutant would "survive". Found by the mirror test in
  // test/mutation.test.js; the known-failing case had passed for that wrong reason.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'be-mutation-'));
  fs.cpSync(root, tmp, { recursive: true, filter: (src) => !/[\\/](\.git|node_modules)$/.test(src) });

  let unrecorded = 0;
  let failedBaseline = 0;
  try {
    for (const t of TARGETS.filter((x) => !only || x.file === only)) {
      const abs = path.join(tmp, t.file);
      if (!fs.existsSync(abs) || !t.tests.every((f) => fs.existsSync(path.join(tmp, f)))) { console.log(`·  ${t.file}  (not in this checkout — skipped)`); continue; }
      const original = fs.readFileSync(abs, 'utf8');
      // The suite must be green BEFORE any mutant: a failing suite kills every
      // mutant and reports a perfect score. Measured here — a broken test ran
      // alongside the pass and printed 131/131.
      const baseline = spawnSync(process.execPath, ['--test', ...t.tests], { cwd: tmp, env, stdio: 'ignore', timeout: 60000 });
      if (baseline.status !== 0) {
        failedBaseline++;
        console.log(`✗ ${t.file}  NOT MEASURED — ${t.tests.join(', ')} already fails without any mutant`);
        continue;
      }
      const all = mutants(original);
      const survivors = [];
      try {
        for (const m of all) {
          fs.writeFileSync(abs, m.text);
          const r = spawnSync(process.execPath, ['--test', ...t.tests], { cwd: tmp, env, stdio: 'ignore', timeout: 60000 });
          if (r.status === 0) survivors.push(m);
        }
      } finally {
        fs.writeFileSync(abs, original);
      }
      const killed = all.length - survivors.length;
      const pct = all.length ? Math.round((100 * killed) / all.length) : 100;
      const open = survivors.filter((m) => !isEquivalent(t.file, m)).length;
      unrecorded += open;
      const eqNote = survivors.length > open ? `, ${survivors.length - open} equivalent` : '';
      console.log(`${open ? '✗' : '✔'} ${t.file}  killed ${killed}/${all.length} (${pct}%)${eqNote}`);
      for (const m of survivors) {
        const eq = isEquivalent(t.file, m);
        console.log(`    ${eq ? 'equivalent' : 'SURVIVED  '} L${m.line}  ${m.op}\n        ${m.from}\n      → ${m.to}${eq ? `\n        (${eq.reason})` : ''}`);
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (argv.includes('--check') && failedBaseline) {
    console.error(`mutation-check: ${failedBaseline} module(s) could not be measured — their tests fail without any mutant.`);
    return 1;
  }
  if (argv.includes('--check') && unrecorded) {
    console.error(`mutation-check: ${unrecorded} surviving mutant(s) — a test that would notice them is missing, or record why they cannot change behaviour.`);
    return 1;
  }
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { mask, mutants, main, TARGETS };
