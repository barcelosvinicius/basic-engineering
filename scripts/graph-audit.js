#!/usr/bin/env node
'use strict';
/**
 * Activation-graph audit for the `be` plugin.
 *
 * Measures the graph the plugin actually forms: which skills reference which
 * other skills/agents, which nodes are leaves (no outgoing edge), and which are
 * orphans (nothing points at them, so they activate only if the user recalls
 * the name).
 *
 * Why exact-name matching and not a prefix regex: a prefix pattern like
 * /\b(proc|be|qa)-[a-z-]+/ silently misses `engineering-principles` (no prefix)
 * and counts a skill's own name as an edge. Both errors move the leaf count.
 *
 * Usage:
 *   node scripts/graph-audit.js           human-readable report
 *   node scripts/graph-audit.js --json    machine-readable
 *   node scripts/graph-audit.js --md      the generated block for
 *                                         docs/structural-analysis.md §0.2
 *   node scripts/graph-audit.js --check   exit 1 if that block is stale
 *
 * The --md/--check pair exists because a fact panel nobody re-runs becomes a
 * fact panel that lies. Hand-written counts in that section already drifted
 * once within a single day of work.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const P = (...p) => path.join(ROOT, 'plugins', 'be', ...p);

const skills = fs.readdirSync(P('skills')).filter((d) => fs.existsSync(P('skills', d, 'SKILL.md')));
const agents = fs.readdirSync(P('agents')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
const commands = fs.readdirSync(P('commands')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));

const read = (f) => fs.readFileSync(f, 'utf8');
const body = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, ''); // drop own frontmatter

// A node references another when its exact name appears as a whole word.
function edges(text, self, universe) {
  return universe.filter((n) => n !== self && new RegExp(`(?<![\\w-])${n}(?![\\w-])`).test(text));
}

const node = {};
for (const s of skills) {
  const t = body(read(P('skills', s, 'SKILL.md')));
  node[s] = { kind: 'skill', skills: edges(t, s, skills), agents: edges(t, s, agents) };
}
const agentNode = {};
for (const a of agents) {
  const t = body(read(P('agents', `${a}.md`)));
  agentNode[a] = { agents: edges(t, a, agents), skills: edges(t, a, skills) };
}
const cmdNode = {};
for (const c of commands) {
  const t = body(read(P('commands', `${c}.md`)));
  cmdNode[c] = { skills: edges(t, c, skills), agents: edges(t, c, agents) };
}

// In-degree over every referrer kind: a skill named by a command is reachable.
const inDeg = Object.fromEntries(skills.map((s) => [s, 0]));
for (const s of skills) for (const t of node[s].skills) inDeg[t]++;
for (const a of agents) for (const t of agentNode[a].skills) inDeg[t]++;
for (const c of commands) for (const t of cmdNode[c].skills) inDeg[t]++;

const leaves = skills.filter((s) => node[s].skills.length === 0);
const orphans = skills.filter((s) => inDeg[s] === 0);
const agentLeaves = agents.filter((a) => agentNode[a].agents.length === 0);
const hub = 'proc-session-continuity';

const declared = require('./lib/edges.js');
const dGraph = declared.collect(P('skills')).edges;
const dOut = dGraph.get(hub) || [];

const report = {
  measuredOn: new Date().toISOString().slice(0, 10),
  totals: { skills: skills.length, agents: agents.length, commands: commands.length },
  skillsWithOutgoing: skills.length - leaves.length,
  leaves,
  orphans,
  agentsWithOutgoing: agents.length - agentLeaves.length,
  agentLeaves,
  hub: { name: hub, inDegree: inDeg[hub], outDegree: (node[hub] || { skills: [] }).skills.length,
         outEdges: (node[hub] || { skills: [] }).skills },
  topInbound: Object.entries(inDeg).sort((a, b) => b[1] - a[1]).slice(0, 5),
  declaredEdges: Object.fromEntries([...dGraph].filter(([, v]) => v.length)
    .map(([k, v]) => [k, v.map((e) => `${e.type}:${e.target}`)])),
  invokeCycles: declared.findInvokeCycles(dGraph),
};

const T = report.totals;

// These drifted in the hand-kept part of the same fact panel while the generated
// part stayed correct, which is the whole argument for generating them.
const overBudget = skills.filter(
  (n) => fs.readFileSync(P('skills', n, 'SKILL.md'), 'utf8').split('\n').length - 1 > 150
);
const withResources = skills.filter(
  (n) => fs.readdirSync(P('skills', n)).some((f) => f !== 'SKILL.md')
);
const docsDir = path.join(ROOT, 'docs');
const livingDocs = fs.existsSync(docsDir)
  ? fs.readdirSync(docsDir).filter((f) => f.endsWith('.md')).length
  : 0;

/** The rows as they must appear in docs/structural-analysis.md §0.2. */
function renderRows() {
  return [
    '| Fact | Value |',
    '|------|-------|',
    `| Skills · agents · commands | **${T.skills} · ${T.agents} · ${T.commands}** |`,
    `| Skills citing >= 1 other skill | **${report.skillsWithOutgoing} / ${T.skills}** |`,
    `| Skill leaves (no outgoing edge) | **${leaves.length} / ${T.skills}** |`,
    `| Skills cited by nothing (orphans) | **${orphans.length}** |`,
    `| Agents delegating to another agent | **${report.agentsWithOutgoing} / ${T.agents}** |`,
    `| \`proc-session-continuity\` in-degree / declared out-degree | **${report.hub.inDegree} / ${dOut.length}** |`,
    `| Declared \`invoke\` cycles | **${report.invokeCycles.length}** |`,
    `| Skills over the ~150-line budget | **${overBudget.length}** |`,
    `| Skills carrying a resource file | **${withResources.length} / ${T.skills}** |`,
    `| Living docs in this repo | **${livingDocs}** |`,
  ];
}

if (process.argv.includes('--md')) {
  console.log(`<!-- generated by scripts/graph-audit.js on ${report.measuredOn} -->`);
  console.log(renderRows().join('\n'));
  process.exit(0);
}

if (process.argv.includes('--check')) {
  const doc = path.join(ROOT, 'docs', 'structural-analysis.md');
  if (!fs.existsSync(doc)) {
    console.log('graph-audit: docs/structural-analysis.md absent — nothing to check.');
    process.exit(0);
  }
  const committed = fs.readFileSync(doc, 'utf8').split(/\r?\n/).map((l) => l.trim());
  const missing = renderRows().filter((l) => !committed.includes(l.trim()));
  if (missing.length) {
    console.error('graph-audit: docs/structural-analysis.md §0.2 is out of date. Missing rows:\n');
    for (const l of missing) console.error(`  ${l}`);
    console.error('\nRegenerate with: node scripts/graph-audit.js --md');
    process.exit(1);
  }
  console.log('graph-audit: docs/structural-analysis.md §0.2 matches the measured graph.');
  process.exit(0);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`be activation graph — measured ${report.measuredOn}`);
  console.log(`  nodes: ${T.skills} skills · ${T.agents} agents · ${T.commands} commands`);
  console.log(`  skills citing >=1 other skill : ${report.skillsWithOutgoing}/${T.skills}`);
  console.log(`  skill leaves (no outgoing)    : ${leaves.length}/${T.skills}  ${leaves.join(', ') || '—'}`);
  console.log(`  orphan skills (no inbound)    : ${orphans.length}  ${orphans.join(', ') || '—'}`);
  console.log(`  agents delegating to an agent : ${report.agentsWithOutgoing}/${T.agents}`);
  console.log(`  hub ${hub}: in=${report.hub.inDegree} out=${report.hub.outDegree} -> ${report.hub.outEdges.join(', ') || '—'}`);
  console.log(`  top inbound: ${report.topInbound.map(([k, v]) => `${k}(${v})`).join(' · ')}`);
  console.log(`  hub declared edges           : ${dOut.length}  ${dOut.map((e) => `${e.type}:${e.target}`).join(', ') || '—'}`);
  console.log(`  invoke cycles                : ${report.invokeCycles.length === 0 ? 'none' : report.invokeCycles.map((c) => c.join('->')).join(' | ')}`);
}
