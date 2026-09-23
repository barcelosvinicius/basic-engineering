'use strict';
/**
 * Structural rules about the plugin's inventory that were written in prose and
 * checked by nobody.
 *
 * Both rules below existed as instructions — `proc-skill-creator` Step 7 orders
 * every new skill/agent to be registered in the session index, and CLAUDE.md
 * declares the naming prefixes. Measured on 2026-08-19: the index was missing
 * 6 of 43 entries (14%), and one skill sat outside the declared prefixes with
 * no exception recorded — an omission that later made a prefix-based sweep miss
 * the second most-referenced skill and misreport the activation graph.
 *
 * A rule with no check is a suggestion. These are the checks.
 */

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PREFIXES = ['proc-', 'be-', 'fe-', 'qa-', 'sec-', 'ops-', 'infra-'];
const AGENT_PREFIXES = ['dev-', 'mgmt-', 'qa-', 'infra-', 'ops-'];

/**
 * Skills that carry no prefix, by decision. `engineering-principles` is the
 * digest every other skill points at, not a member of a family; renaming it
 * would break every installed base for a cosmetic gain. Declared here so
 * tooling stops rediscovering it as an anomaly.
 */
const PREFIX_EXCEPTIONS = ['engineering-principles'];

function listSkills(pluginDir) {
  const d = path.join(pluginDir, 'skills');
  return fs.existsSync(d) ? fs.readdirSync(d).filter((n) => fs.existsSync(path.join(d, n, 'SKILL.md'))) : [];
}

function listAgents(pluginDir) {
  const d = path.join(pluginDir, 'agents');
  return fs.existsSync(d)
    ? fs
        .readdirSync(d)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.slice(0, -3))
    : [];
}

/** Names not mentioned as a whole word anywhere in the index text. */
function missingFromIndex(indexText, names) {
  return names.filter((n) => !new RegExp(`(?<![\\w-])${n}(?![\\w-])`).test(indexText));
}

/** Names whose prefix is outside `prefixes` and that are not declared exceptions. */
function badPrefixes(names, prefixes, exceptions = PREFIX_EXCEPTIONS) {
  return names.filter((n) => !exceptions.includes(n) && !prefixes.some((p) => n.startsWith(p)));
}

/** Strip fenced code blocks — an example name is not a reference. */
function stripFences(text) {
  return text.replace(/^```[\s\S]*?^```/gm, '');
}

/**
 * Backticked `prefix-name` mentions in a document that do not resolve to a real
 * skill or agent. Renaming either one otherwise leaves every prose reference to
 * it pointing at nothing, silently — the reader follows a name that no longer
 * exists and nothing in the build notices.
 */
const NAME_RE = /`((?:proc|be|fe|qa|sec|ops|infra|dev|mgmt)-[a-z0-9-]+)`/g;

/**
 * Names that look like references but are deliberately hypothetical — the
 * naming examples in proc-skill-creator's good/bad pair. Declared here for the
 * same reason PREFIX_EXCEPTIONS is: an exception to a convention is part of the
 * convention, and an undeclared one becomes the next tool's false positive.
 * This check caught them on its first run, before it was trusted.
 */
const REFERENCE_EXCEPTIONS = ['be-caching-patterns', 'proc-incident-response'];

function danglingRefs(text, knownNames) {
  const body = stripFences(text);
  const bad = new Set();
  let m;
  while ((m = NAME_RE.exec(body))) {
    if (!knownNames.has(m[1]) && !REFERENCE_EXCEPTIONS.includes(m[1])) bad.add(m[1]);
  }
  NAME_RE.lastIndex = 0;
  return [...bad];
}

/** Counts asserted in prose as "N skills" / "N agents" / "N commands". */
// Two shapes, because the repository writes counts in two places: prose says
// "31 skills", and the README table puts the number in its own column. The
// second was invisible to this guard until 2026-09-23, when the table had said
// 28 skills and 15 agents for weeks while prose and manifests were correct.
const COUNT_RE = /\b(\d{1,3})\s+(skills|agents|commands)\b/g;
const TABLE_COUNT_RE = /\|\s*\*\*(Skills|Agents|Commands)\*\*\s*\|\s*(\d{1,3})\s*\|/gi;

function wrongCounts(text, actual) {
  const bad = [];
  let m;
  while ((m = COUNT_RE.exec(text))) {
    const claimed = Number(m[1]);
    const real = actual[m[2]];
    if (real !== undefined && claimed !== real) bad.push({ claimed, kind: m[2], real });
  }
  COUNT_RE.lastIndex = 0;
  while ((m = TABLE_COUNT_RE.exec(text))) {
    const claimed = Number(m[2]);
    const kind = m[1].toLowerCase();
    const real = actual[kind];
    if (real !== undefined && claimed !== real) bad.push({ claimed, kind, real });
  }
  TABLE_COUNT_RE.lastIndex = 0;
  return bad;
}

/**
 * The description strings a manifest publishes, whatever its shape:
 * `plugin.json` carries one at the top level, `marketplace.json` one per entry
 * in `plugins[]`. Returned as text so `wrongCounts` can read them the same way
 * it reads a document — a count claimed here is not internal, it reaches the
 * marketplace listing and the npm page.
 */
function manifestDescriptions(json) {
  if (!json || typeof json !== 'object') return [];
  const out = [];
  if (typeof json.description === 'string') out.push(json.description);
  if (Array.isArray(json.plugins)) {
    for (const p of json.plugins) {
      if (p && typeof p.description === 'string') out.push(p.description);
    }
  }
  return out;
}

module.exports = {
  REFERENCE_EXCEPTIONS,
  danglingRefs,
  wrongCounts,
  manifestDescriptions,
  SKILL_PREFIXES,
  AGENT_PREFIXES,
  PREFIX_EXCEPTIONS,
  listSkills,
  listAgents,
  missingFromIndex,
  badPrefixes,
};
