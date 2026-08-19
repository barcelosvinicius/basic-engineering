'use strict';
/**
 * Declared activation edges between skills.
 *
 * A skill may declare where it hands off, under an `## Activation edges`
 * heading, as a table of `| type | target | when |`. Two types exist:
 *
 *   consult — read the target's rules; no execution, cannot re-enter
 *   invoke  — may run the target's flow
 *
 * Only `invoke` edges can form a runtime cycle, so only those are checked.
 * This is the whole point of typing them: in prose a mention and a hand-off
 * look identical, and a graph without edge types cannot be verified at all.
 *
 * Skills with no such section contribute no edges — adoption is incremental.
 *
 * Fenced code blocks are stripped first: a skill that *documents* this
 * convention (proc-skill-creator) necessarily contains an example table, and an
 * example is not a declaration. Caught by the validator on its own example.
 */

const fs = require('fs');
const path = require('path');

const HEADING = /^##\s+Activation edges\s*$/im;
const ROW = /^\|\s*`?(consult|invoke)`?\s*\|\s*`?([a-z0-9-]+)`?\s*\|(.*)\|\s*$/i;

/** Remove fenced code blocks so examples inside them are not read as declarations. */
function stripFences(text) {
  return text.replace(/^```[\s\S]*?^```/gm, '');
}

/** Extract declared edges from one SKILL.md body. */
function parseEdges(raw) {
  const text = stripFences(raw);
  const start = text.search(HEADING);
  if (start === -1) return [];
  const rest = text.slice(start).split('\n').slice(1);
  const edges = [];
  for (const line of rest) {
    if (/^##\s/.test(line)) break; // section ended
    const m = line.match(ROW);
    if (m) edges.push({ type: m[1].toLowerCase(), target: m[2], when: m[3].trim() });
  }
  return edges;
}

/** Read every skill in `skillsDir` and return { skills: [], edges: Map }. */
function collect(skillsDir) {
  const skills = fs
    .readdirSync(skillsDir)
    .filter((d) => fs.existsSync(path.join(skillsDir, d, 'SKILL.md')));
  const edges = new Map();
  for (const s of skills) {
    edges.set(s, parseEdges(fs.readFileSync(path.join(skillsDir, s, 'SKILL.md'), 'utf8')));
  }
  return { skills, edges };
}

/**
 * Find cycles over `invoke` edges only. Returns an array of cycles, each a
 * list of node names where the first repeats at the end: ['a','b','a'].
 */
function findInvokeCycles(edges) {
  const next = (n) => (edges.get(n) || []).filter((e) => e.type === 'invoke').map((e) => e.target);
  const cycles = [];
  const seen = new Set(); // cycles already reported, by normalized key
  const state = new Map(); // node -> 'open' | 'done'

  function walk(node, stack) {
    state.set(node, 'open');
    stack.push(node);
    for (const t of next(node)) {
      if (state.get(t) === 'open') {
        const cycle = stack.slice(stack.indexOf(t)).concat(t);
        const key = [...cycle].slice(0, -1).sort().join('>');
        if (!seen.has(key)) { seen.add(key); cycles.push(cycle); }
      } else if (state.get(t) !== 'done' && edges.has(t)) {
        walk(t, stack);
      }
    }
    stack.pop();
    state.set(node, 'done');
  }

  for (const n of edges.keys()) if (!state.has(n)) walk(n, []);
  return cycles;
}

/** Declared targets that are not real skills. */
function findUnknownTargets(skills, edges) {
  const known = new Set(skills);
  const bad = [];
  for (const [from, list] of edges) {
    for (const e of list) if (!known.has(e.target)) bad.push({ from, target: e.target });
  }
  return bad;
}

module.exports = { parseEdges, collect, findInvokeCycles, findUnknownTargets };
