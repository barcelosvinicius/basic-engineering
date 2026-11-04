#!/usr/bin/env node
'use strict';
/**
 * Findings from a parallel agent are checked, not trusted.
 *
 * The commands that fan out (`/be:check`, `/be:impact`, ...) open read-only
 * agents that return findings in a fixed shape — file · line · fact · evidence —
 * and a single writer integrates them. Nothing checked that the evidence is
 * where the finding says. A cheaper or hurried reviewer can quote a line that
 * does not exist, and the writer would integrate it as fact.
 *
 * So, per finding, the quoted `evidence` is looked up in `file`:
 *   - verified   it is at `line` (a multi-line quote: starting there);
 *   - moved      it is in the file, but not at `line` — reported at its real line;
 *   - not-found  it is nowhere in the file, or the file does not exist;
 *   - invalid    the finding lacks file/line/evidence, or its path leaves the root.
 *
 * Whitespace is compared collapsed (runs of spaces, tabs and line endings count
 * as one space), because agents re-indent what they quote; everything else must
 * match exactly. A finding's path is agent output — untrusted — so it must
 * resolve inside the root.
 *
 * Exit: 0 when every finding is verified or moved; 1 when any is not-found or
 * invalid (integrating it would record a fabrication); 2 when the findings file
 * itself cannot be read. The summary always states N of M — a zero without its
 * denominator is not a result.
 *
 * Input: a JSON array of findings, or one JSON object per line (JSONL).
 *
 * Usage:
 *   node findings.js <findings.json> [--root <dir>] [--json]
 */

const fs = require('node:fs');
const path = require('node:path');

/** Collapse every whitespace run to one space and trim. */
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/** Parse a JSON array, or JSONL (one object per non-empty line). */
function parseFindings(text) {
  const trimmed = text.trim();
  if (trimmed === '') return [];
  if (trimmed.startsWith('[')) return JSON.parse(trimmed);
  return trimmed
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l));
}

/** The 1-based lines of `lines` where the normalized `quote` starts. */
function matchLines(lines, quote) {
  const q = norm(quote);
  const span = Math.max(1, String(quote).trim().split(/\r?\n/).length);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const window = norm(lines.slice(i, i + span).join('\n'));
    if (window.includes(q)) hits.push(i + 1);
  }
  return hits;
}

/** Check one finding against the tree under `root`. */
function checkFinding(finding, root, readFile = (f) => fs.readFileSync(f, 'utf8')) {
  const f = finding && typeof finding === 'object' ? finding : {};
  const { file, line, evidence } = f;
  if (typeof file !== 'string' || file === '') return { status: 'invalid', reason: 'no file' };
  if (!Number.isInteger(line) || line < 1) return { status: 'invalid', reason: 'line is not a positive integer' };
  if (typeof evidence !== 'string' || norm(evidence) === '') return { status: 'invalid', reason: 'no evidence quoted' };

  const base = path.resolve(root);
  const abs = path.resolve(base, file);
  if (abs !== base && !abs.startsWith(base + path.sep)) {
    return { status: 'invalid', reason: 'path leaves the root' };
  }

  let text;
  try {
    text = readFile(abs);
  } catch {
    return { status: 'not-found', reason: 'file does not exist' };
  }
  const hits = matchLines(text.split(/\r?\n/), evidence);
  if (hits.includes(line)) return { status: 'verified' };
  if (hits.length > 0) return { status: 'moved', actualLine: hits[0], reason: `found at line ${hits[0]}, not ${line}` };
  return { status: 'not-found', reason: 'evidence is not in the file' };
}

/** Check every finding; returns the per-finding results and the counts. */
function checkAll(findings, root, readFile) {
  const results = findings.map((finding, index) => ({ index, finding, ...checkFinding(finding, root, readFile) }));
  const counts = { verified: 0, moved: 0, 'not-found': 0, invalid: 0 };
  for (const r of results) counts[r.status]++;
  return { total: results.length, counts, results };
}

function render({ total, counts, results }) {
  const out = [];
  for (const r of results) {
    if (r.status === 'verified') continue;
    const where = r.finding && r.finding.file ? `${r.finding.file}:${r.finding.line}` : `#${r.index + 1}`;
    out.push(`  ${r.status.padEnd(9)} ${where} — ${r.reason}`);
  }
  const ok = counts.verified + counts.moved;
  out.push(
    `findings: ${ok} of ${total} grounded (${counts.verified} verified, ${counts.moved} moved) · ` +
      `${counts['not-found']} not found · ${counts.invalid} invalid`
  );
  return out.join('\n');
}

function main(argv) {
  const json = argv.includes('--json');
  const rootAt = argv.indexOf('--root');
  const root = rootAt >= 0 && argv[rootAt + 1] ? argv[rootAt + 1] : process.cwd();
  const input = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--root');
  if (!input) {
    console.error('usage: node findings.js <findings.json> [--root <dir>] [--json]');
    return 2;
  }
  let findings;
  try {
    findings = parseFindings(fs.readFileSync(input, 'utf8'));
    if (!Array.isArray(findings)) throw new Error('not a list of findings');
  } catch (e) {
    console.error(`findings: cannot read ${input}: ${e.message}`);
    return 2;
  }
  const report = checkAll(findings, root);
  console.log(json ? JSON.stringify(report, null, 2) : render(report));
  return report.counts['not-found'] + report.counts.invalid > 0 ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { norm, parseFindings, matchLines, checkFinding, checkAll, render, main };
