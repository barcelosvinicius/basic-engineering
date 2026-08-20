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
 *   node scripts/graph-audit.js --md      the generated fact panel for
 *                                         docs/structural-analysis.md
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

/**
 * Bytes of shipped content, counted with CR stripped.
 *
 * Why normalise instead of `cat … | wc -c`: on a CRLF checkout that command
 * returns one extra byte per line — 142,752 against 139,253 for the very same
 * commit. A "verifiable fact" whose value depends on the reader's git config
 * sends whoever re-runs §0 chasing a drift that is not there, or hides one that
 * is. Git stores LF; count what git stores.
 */
function payloadBytes(files) {
  return files.reduce(
    (n, f) => n + Buffer.byteLength(fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'), 'utf8'),
    0
  );
}

const skillsPayload = payloadBytes(skills.map((n) => P('skills', n, 'SKILL.md')));
const agentFiles = fs.readdirSync(P('agents')).filter((f) => f.endsWith('.md'));
const agentsPayload = payloadBytes(agentFiles.map((f) => P('agents', f)));
const B = (n) => `${n.toLocaleString('en-US')} B`;

// The version the panel was measured against. It used to be prose in the
// document's header and went stale the moment 3.1.0 shipped — the same class as
// every other count that was written by hand instead of produced.
const readOr = (file, fallback) => {
  try {
    return fs.readFileSync(path.join(ROOT, file), 'utf8').trim();
  } catch {
    return fallback;
  }
};
const semver = (() => {
  try {
    return `be ${JSON.parse(readOr('package.json', '{}')).version}`;
  } catch {
    return 'be (unknown)';
  }
})();
const baseVersion = readOr('BASE_VERSION', '(unknown)');

/** How many entries a shipped directory holds, 0 when it does not exist. */
const countIn = (dir, filter = () => true) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter(filter).length : 0;

const hookScripts = countIn(P('hooks', 'scripts'), (f) => f.endsWith('.js'));
const hookEvents = fs.existsSync(P('hooks', 'hooks.json'))
  ? Object.keys(JSON.parse(fs.readFileSync(P('hooks', 'hooks.json'), 'utf8')).hooks || {})
  : [];
const docTemplates = countIn(P('templates', 'docs'));
const configFiles = countIn(P('config'));

// Agent hygiene. These three lived in the hand-kept half of the panel and went
// stale the moment three agents were added — in the same session, in the same
// file, while the generated rows beside them failed the build until corrected.
// Everything derivable belongs on this side of the line.
const agentText = agentFiles.map((f) => fs.readFileSync(P('agents', f), 'utf8'));
const readOnlyAgents = agentText.filter((t) => /^tools: Read, Grep, Glob, Bash$/m.test(t)).length;
const modelAgents = agentText.filter((t) => /^model:/m.test(t)).length;
const defendedAgents = agentText.filter(
  (t) => /prompt.injection|prompt defense|untrusted/i.test(t)
).length;

/** The rows as they must appear in the fact panel of docs/structural-analysis.md. */
function renderRows() {
  return [
    '| Fact | Value |',
    '|------|-------|',
    `| Measured against | **${semver}** · \`BASE_VERSION ${baseVersion}\` |`,
    `| Skills · agents · commands | **${T.skills} · ${T.agents} · ${T.commands}** |`,
    `| Hook scripts · events wired | **${hookScripts} · ${hookEvents.length}** (${hookEvents.join(', ')}) |`,
    `| Doc templates · config data files | **${docTemplates} · ${configFiles}** |`,
    `| Read-only agents (\`tools:\` restricted) | **${readOnlyAgents} / ${T.agents}** |`,
    `| Agents declaring \`model:\` | **${modelAgents} / ${T.agents}** |`,
    `| Agents carrying prompt-injection defense | **${defendedAgents} / ${T.agents}** |`,
    `| Skills citing >= 1 other skill | **${report.skillsWithOutgoing} / ${T.skills}** |`,
    `| Skill leaves (no outgoing edge) | **${leaves.length} / ${T.skills}** |`,
    `| Skills cited by nothing (orphans) | **${orphans.length}** |`,
    `| Agents delegating to another agent | **${report.agentsWithOutgoing} / ${T.agents}** |`,
    `| \`proc-session-continuity\` in-degree / declared out-degree | **${report.hub.inDegree} / ${dOut.length}** |`,
    `| Declared \`invoke\` cycles | **${report.invokeCycles.length}** |`,
    `| Skills over the ~150-line budget | **${overBudget.length}** |`,
    `| Skills carrying a resource file | **${withResources.length} / ${T.skills}** |`,
    `| Skills payload (\`SKILL.md\`, LF bytes) | **${B(skillsPayload)}** |`,
    `| Agents payload (LF bytes) | **${B(agentsPayload)}** |`,
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
    console.error('graph-audit: the fact panel in docs/structural-analysis.md is out of date. Missing rows:\n');
    for (const l of missing) console.error(`  ${l}`);
    console.error('\nRegenerate with: node scripts/graph-audit.js --md');
    process.exit(1);
  }
  console.log('graph-audit: the fact panel in docs/structural-analysis.md matches the measured repo.');
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
