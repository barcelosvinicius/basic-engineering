'use strict';
/**
 * Which stacks a project root declares, by the indicator files it carries.
 *
 * One reader, used by everything that needs it: the distance report, the
 * permissions writer, and whatever comes next. It lived in two copies before —
 * and a rule with two readers drifts at the first change to either.
 */

const fs = require('fs');
const path = require('path');

/** The shipped map, from either layout: the plugin's, or Channel B's `.be/`. */
function loadMappings(here = __dirname) {
  for (const p of [path.join(here, '..', 'config', 'stack-mappings.json'), path.join(here, '..', '..', 'config', 'stack-mappings.json')]) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { /* try the next layout */ }
  }
  return null;
}

/** Stacks whose indicators exist in `dir`. An indicator may be a `*.ext` glob. */
function detectStacks(dir, mappings) {
  if (!dir || !mappings || !Array.isArray(mappings.stacks)) return [];
  let names = null;
  const has = (ind) => {
    if (typeof ind !== 'string') return false;
    if (!ind.includes('*')) return fs.existsSync(path.join(dir, ind));
    if (names === null) { try { names = fs.readdirSync(dir); } catch { names = []; } }
    return names.some((n) => n.endsWith(ind.replace(/^\*/, '')));
  };
  return mappings.stacks.filter((s) => Array.isArray(s.indicators) && s.indicators.some(has));
}

module.exports = { loadMappings, detectStacks };
