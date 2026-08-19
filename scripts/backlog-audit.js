#!/usr/bin/env node
'use strict';
/**
 * Reproduces the implementation status of feedback/BACKLOG.md.
 *
 * Why this exists: the backlog claimed "nothing implemented yet" for two months
 * while 16 of its 20 items were in fact shipped. Hand-counting produced five
 * wrong readings in a single session, every one of them plausible — a path
 * taken from the item's *description* instead of this project's real layout,
 * and a case-sensitive grep against a capitalised heading. A status nobody can
 * re-run is a status that drifts silently.
 *
 * Each item declares the checks that prove it. All checks pass -> done;
 * some -> partial; none -> todo.
 *
 * Usage:
 *   node scripts/backlog-audit.js          human-readable report
 *   node scripts/backlog-audit.js --md     regenerate the table for BACKLOG.md
 *   node scripts/backlog-audit.js --check  exit 1 if the committed table is stale
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const ITEMS = [
  ['1',  'Enforcement spine (hooks)', [
    'test -f plugins/be/hooks/hooks.json',
    "grep -qi 'no-verify' plugins/be/hooks/scripts/pre-tooluse.js",
    "grep -qi 'detectSecrets' plugins/be/hooks/scripts/_lib.js"]],
  ['2',  '/be:check + verification-loop + semgrep', [
    'test -f plugins/be/commands/check.md',
    'test -d plugins/be/skills/qa-verification-loop',
    'ls plugins/be/semgrep/*.yml']],
  ['3',  'Generated capabilities guide + /be:help', [
    'test -f plugins/be/commands/help.md',
    'test -f scripts/gen-capabilities.js']],
  ['4',  'model: + tools: + prompt defense on agents', [
    "test $(grep -l '^model:' plugins/be/agents/*.md | wc -l) -eq $(ls plugins/be/agents/*.md | wc -l)",
    "test $(grep -lie 'prompt.injection|prompt defense|untrusted' -E plugins/be/agents/*.md | wc -l) -eq $(ls plugins/be/agents/*.md | wc -l)"]],
  ['5',  'Stack-conditional activation', ['test -f plugins/be/config/stack-mappings.json']],
  ['6',  'Modular install profiles', ['test -f plugins/be/config/install-profiles.json']],
  ['7',  'Path map (.be-paths)', [
    'test -f plugins/be/.be-paths.example.json',
    "grep -qi 'be-paths' plugins/be/hooks/scripts/session-start.js"]],
  ['8',  'Technique agents: sanitizer + silent-failure', [
    'test -f plugins/be/agents/qa-release-sanitizer.md',
    'test -f plugins/be/agents/qa-silent-failure-hunter.md']],
  ['9',  '/be:context-budget', [
    'test -f plugins/be/commands/context-budget.md',
    'test -d plugins/be/skills/proc-context-budget']],
  ['10', 'Enriched mcp.recommended.json', [
    "grep -qiE 'pin|version' plugins/be/mcp.recommended.json",
    "grep -qiE 'boundary|privacy' plugins/be/mcp.recommended.json"]],
  ['11', 'gateguard fact-force (opt-in)', ['test -f plugins/be/hooks/scripts/_gateguard.js']],
  ['12', 'sec-agent-security skill', ['test -d plugins/be/skills/sec-agent-security']],
  ['13', 'Supply-chain / IOC guidance in CI skill', [
    "grep -qi 'IOC' plugins/be/skills/infra-ci-cd/SKILL.md"]],
  ['14', 'JSON schemas in validate.js', ["grep -qi 'schema' scripts/validate.js"]],
  ['15', 'Provenance + prune-by-evidence', [
    "grep -qi 'provenance' plugins/be/skills/proc-skill-creator/SKILL.md",
    "grep -qiE 'prune|health' plugins/be/skills/proc-skill-creator/SKILL.md"]],
  ['16', 'Cost governance (/be:cost-report + model-route)', [
    'test -f plugins/be/commands/model-route.md',
    'test -f plugins/be/commands/cost-report.md']],
  ['17', 'Always-on rules/ layer', ['test -d plugins/be/rules']],
  ['18', 'More technique agents (4 named)', [
    'test -f plugins/be/agents/qa-pr-test-analyzer.md',
    'test -f plugins/be/agents/qa-comment-analyzer.md',
    'test -f plugins/be/agents/qa-type-design-analyzer.md',
    'test -f plugins/be/agents/mgmt-spec-miner.md']],
  ['19', 'Memory boundary declared', [
    "grep -qiE 'two memories|harness memory' plugins/be/skills/proc-session-continuity/SKILL.md"]],
  ['20', 'SDD explicitly optional', [
    "grep -qi 'without sdd' plugins/be/skills/proc-sdd/SKILL.md"]],
];

function run(cmd) {
  try { execSync(cmd, { cwd: ROOT, stdio: 'ignore', timeout: 10000 }); return true; }
  catch { return false; }
}

const rows = ITEMS.map(([id, name, checks]) => {
  const results = checks.map(run);
  const passed = results.filter(Boolean).length;
  const status = passed === checks.length ? 'done' : passed === 0 ? 'todo' : 'partial';
  return { id, name, status, passed, total: checks.length, checks, results };
});

const tally = { done: 0, partial: 0, todo: 0 };
for (const r of rows) tally[r.status]++;

/** The table body as it should appear in BACKLOG.md, date line excluded. */
function renderRows() {
  const icon = { done: '✅', partial: '⚠️', todo: '❌' };
  const lines = ['| # | Item | Status | Checks passing |', '|---|------|--------|----------------|'];
  for (const r of rows) lines.push(`| ${r.id} | ${r.name} | ${icon[r.status]} ${r.status} | ${r.passed}/${r.total} |`);
  lines.push(`**${tally.done} done · ${tally.partial} partial · ${tally.todo} not started** — of ${rows.length}.`);
  return lines;
}

if (process.argv.includes('--check')) {
  // Compare against what BACKLOG.md actually says. The generated-on date line is
  // excluded on purpose: a re-run on another day must not read as a change.
  const file = path.join(ROOT, 'feedback', 'BACKLOG.md');
  const committed = fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim());
  const missing = renderRows().filter((l) => !committed.includes(l.trim()));
  if (missing.length) {
    console.error('backlog-audit: feedback/BACKLOG.md is out of date. Missing/changed rows:\n');
    for (const l of missing) console.error(`  ${l}`);
    console.error('\nRegenerate with: node scripts/backlog-audit.js --md');
    process.exit(1);
  }
  console.log(`backlog-audit: BACKLOG.md matches reality (${tally.done} done · ${tally.partial} partial · ${tally.todo} not started).`);
  process.exit(0);
}

if (process.argv.includes('--md')) {
  console.log(`<!-- generated by scripts/backlog-audit.js on ${new Date().toISOString().slice(0, 10)} -->`);
  const out = renderRows();
  console.log(out.slice(0, -1).join('\n'));
  console.log(`\n${out[out.length - 1]}`);
} else {
  for (const r of rows) {
    const mark = r.status === 'done' ? '✔' : r.status === 'partial' ? '~' : '✗';
    console.log(`${mark} ${r.id.padStart(2)} ${r.name}  (${r.passed}/${r.total})`);
    if (r.status !== 'done') {
      r.checks.forEach((c, i) => { if (!r.results[i]) console.log(`      missing: ${c}`); });
    }
  }
  console.log(`\n${tally.done} done · ${tally.partial} partial · ${tally.todo} not started (of ${rows.length})`);
}

if (!fs.existsSync(path.join(ROOT, 'feedback', 'BACKLOG.md'))) process.exitCode = 1;
