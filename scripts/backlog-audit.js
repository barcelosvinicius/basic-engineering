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
 * The checks are filesystem predicates (scripts/lib/probes.js), never shell
 * commands. They used to be shell one-liners, which made the verdict depend on
 * the operating system: `execSync` spawns cmd.exe on Windows, where '...' does
 * not quote, so every probe containing a `|` broke and shipped work was
 * reported as not started — while CI stayed green on Linux. A release guard
 * reads this audit, so that discrepancy blocked releases from Windows.
 *
 * Usage:
 *   node scripts/backlog-audit.js          human-readable report
 *   node scripts/backlog-audit.js --md     regenerate the table for BACKLOG.md
 *   node scripts/backlog-audit.js --check  exit 1 if the committed table is stale
 */

const fs = require('node:fs');
const path = require('node:path');
const probes = require('./lib/probes.js');

const ROOT = path.resolve(__dirname, '..');

const MD = /\.md$/;

/** @type {[string, string, object[]][]} */
const ITEMS = [
  [
    '1',
    'Enforcement spine (hooks)',
    [
      { kind: 'file', path: 'plugins/be/hooks/hooks.json' },
      { kind: 'content', path: 'plugins/be/hooks/scripts/pre-tooluse.js', re: /no-verify/i },
      { kind: 'content', path: 'plugins/be/hooks/scripts/_lib.js', re: /detectSecrets/i },
    ],
  ],
  [
    '2',
    '/be:check + verification-loop + semgrep',
    [
      { kind: 'file', path: 'plugins/be/commands/check.md' },
      { kind: 'dir', path: 'plugins/be/skills/qa-verification-loop' },
      { kind: 'anyFile', dir: 'plugins/be/semgrep', name: /\.ya?ml$/ },
    ],
  ],
  [
    '3',
    'Generated capabilities guide + /be:help',
    [
      { kind: 'file', path: 'plugins/be/commands/help.md' },
      { kind: 'file', path: 'scripts/gen-capabilities.js' },
    ],
  ],
  [
    '4',
    'model: + tools: + prompt defense on agents',
    [
      { kind: 'everyFile', dir: 'plugins/be/agents', name: MD, re: /^model:/m },
      { kind: 'everyFile', dir: 'plugins/be/agents', name: MD, re: /prompt.injection|prompt defense|untrusted/i },
    ],
  ],
  ['5', 'Stack-conditional activation', [{ kind: 'file', path: 'plugins/be/config/stack-mappings.json' }]],
  ['6', 'Modular install profiles', [{ kind: 'file', path: 'plugins/be/config/install-profiles.json' }]],
  [
    '7',
    'Path map (.be-paths)',
    [
      { kind: 'file', path: 'plugins/be/.be-paths.example.json' },
      { kind: 'content', path: 'plugins/be/hooks/scripts/session-start.js', re: /be-paths/i },
    ],
  ],
  [
    '8',
    'Technique agents: sanitizer + silent-failure',
    [
      { kind: 'file', path: 'plugins/be/agents/qa-release-sanitizer.md' },
      { kind: 'file', path: 'plugins/be/agents/qa-silent-failure-hunter.md' },
    ],
  ],
  [
    '9',
    '/be:context-budget',
    [
      { kind: 'file', path: 'plugins/be/commands/context-budget.md' },
      { kind: 'dir', path: 'plugins/be/skills/proc-context-budget' },
    ],
  ],
  [
    '10',
    'Enriched mcp.recommended.json',
    [
      { kind: 'content', path: 'plugins/be/mcp.recommended.json', re: /pin|version/i },
      { kind: 'content', path: 'plugins/be/mcp.recommended.json', re: /boundary|privacy/i },
    ],
  ],
  ['11', 'gateguard fact-force (opt-in)', [{ kind: 'file', path: 'plugins/be/hooks/scripts/_gateguard.js' }]],
  ['12', 'sec-agent-security skill', [{ kind: 'dir', path: 'plugins/be/skills/sec-agent-security' }]],
  [
    '13',
    'Supply-chain / IOC guidance in CI skill',
    [{ kind: 'content', path: 'plugins/be/skills/infra-ci-cd/SKILL.md', re: /IOC/i }],
  ],
  ['14', 'JSON schemas in validate.js', [{ kind: 'content', path: 'scripts/validate.js', re: /schema/i }]],
  [
    '15',
    'Provenance + prune-by-evidence',
    [
      { kind: 'content', path: 'plugins/be/skills/proc-skill-creator/SKILL.md', re: /provenance/i },
      { kind: 'content', path: 'plugins/be/skills/proc-skill-creator/SKILL.md', re: /prune|health/i },
    ],
  ],
  [
    '16',
    'Cost governance (/be:cost-report + model-route)',
    [
      { kind: 'file', path: 'plugins/be/commands/model-route.md' },
      { kind: 'file', path: 'plugins/be/commands/cost-report.md' },
    ],
  ],
  ['17', 'Always-on rules/ layer', [{ kind: 'dir', path: 'plugins/be/rules' }]],
  [
    '18',
    'More technique agents (4 named)',
    [
      { kind: 'file', path: 'plugins/be/agents/qa-pr-test-analyzer.md' },
      { kind: 'file', path: 'plugins/be/agents/qa-comment-analyzer.md' },
      { kind: 'file', path: 'plugins/be/agents/qa-type-design-analyzer.md' },
      { kind: 'file', path: 'plugins/be/agents/mgmt-spec-miner.md' },
    ],
  ],
  [
    '19',
    'Memory boundary declared',
    [
      {
        kind: 'content',
        path: 'plugins/be/skills/proc-session-continuity/SKILL.md',
        re: /two memories|harness memory/i,
      },
    ],
  ],
  [
    '20',
    'SDD explicitly optional',
    [{ kind: 'content', path: 'plugins/be/skills/proc-sdd/SKILL.md', re: /without sdd/i }],
  ],
];

const rows = ITEMS.map(([id, name, checks]) => {
  const results = checks.map((c) => probes.run(ROOT, c));
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
  const committed = fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim());
  const missing = renderRows().filter((l) => !committed.includes(l.trim()));
  if (missing.length) {
    console.error('backlog-audit: feedback/BACKLOG.md is out of date. Missing/changed rows:\n');
    for (const l of missing) console.error(`  ${l}`);
    console.error('\nRegenerate with: node scripts/backlog-audit.js --md');
    process.exit(1);
  }
  console.log(
    `backlog-audit: BACKLOG.md matches reality (${tally.done} done · ${tally.partial} partial · ${tally.todo} not started).`
  );
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
      r.checks.forEach((c, i) => {
        if (!r.results[i]) console.log(`      missing: ${probes.describe(c)}`);
      });
    }
  }
  console.log(`\n${tally.done} done · ${tally.partial} partial · ${tally.todo} not started (of ${rows.length})`);
}

if (!fs.existsSync(path.join(ROOT, 'feedback', 'BACKLOG.md'))) process.exitCode = 1;
