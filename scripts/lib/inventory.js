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

const fs = require('fs');
const path = require('path');

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
  return fs.existsSync(d)
    ? fs.readdirSync(d).filter((n) => fs.existsSync(path.join(d, n, 'SKILL.md')))
    : [];
}

function listAgents(pluginDir) {
  const d = path.join(pluginDir, 'agents');
  return fs.existsSync(d)
    ? fs.readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3))
    : [];
}

/** Names not mentioned as a whole word anywhere in the index text. */
function missingFromIndex(indexText, names) {
  return names.filter((n) => !new RegExp(`(?<![\\w-])${n}(?![\\w-])`).test(indexText));
}

/** Names whose prefix is outside `prefixes` and that are not declared exceptions. */
function badPrefixes(names, prefixes, exceptions = PREFIX_EXCEPTIONS) {
  return names.filter(
    (n) => !exceptions.includes(n) && !prefixes.some((p) => n.startsWith(p))
  );
}

module.exports = {
  SKILL_PREFIXES,
  AGENT_PREFIXES,
  PREFIX_EXCEPTIONS,
  listSkills,
  listAgents,
  missingFromIndex,
  badPrefixes,
};
