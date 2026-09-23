#!/usr/bin/env node
'use strict';
/**
 * The stack's permissions, applied — not described.
 *
 * `config/stack-mappings.json` has carried `allow`/`deny` per stack since the
 * day it was written (`mvn test` allowed, `mvn deploy` denied, and so on), and
 * **nothing applied them**: the file was read by markdown and by zero hooks.
 * Least privilege was advice.
 *
 * This writes them into the project's own `.claude/settings.json`, and it is
 * deliberately timid:
 *   - it never removes or rewrites an entry the project already has;
 *   - a rule the project already denies is never added to allow (their deny wins);
 *   - a settings file that does not parse is left untouched, with the reason;
 *   - no stack detected means no change, and it says so.
 *
 * Usage:
 *   node permissions.js [--root <dir>] [--dry-run] [--json]
 */

const fs = require('node:fs');
const path = require('node:path');
const { loadMappings, detectStacks } = require('./_stacks.js');

const SETTINGS = path.join('.claude', 'settings.json');

function readSettings(root) {
  const file = path.join(root, SETTINGS);
  if (!fs.existsSync(file)) return { settings: {}, existed: false };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return { error: `${SETTINGS} is not a JSON object` };
    return { settings: parsed, existed: true };
  } catch (e) {
    return { error: `${SETTINGS} does not parse (${e.message.split('\n')[0]})` };
  }
}

/** What would be added, given the project's settings and the detected stacks. */
function plan(settings, stacks) {
  const current = settings.permissions && typeof settings.permissions === 'object' ? settings.permissions : {};
  const has = (k) => (Array.isArray(current[k]) ? current[k] : []);
  const allow = has('allow');
  const deny = has('deny');
  const wanted = { allow: [], deny: [] };
  for (const s of stacks) {
    const p = s.permissions || {};
    for (const rule of Array.isArray(p.allow) ? p.allow : []) {
      if (allow.includes(rule) || deny.includes(rule) || wanted.allow.includes(rule)) continue;
      wanted.allow.push(rule); // the project's own deny wins, always
    }
    for (const rule of Array.isArray(p.deny) ? p.deny : []) {
      if (deny.includes(rule) || wanted.deny.includes(rule)) continue;
      wanted.deny.push(rule);
    }
  }
  return wanted;
}

function apply(root, stacks, { dryRun = false } = {}) {
  const read = readSettings(root);
  if (read.error) return { skipped: read.error };
  if (!stacks.length) return { skipped: 'no stack detected at the project root' };
  const added = plan(read.settings, stacks);
  if (!added.allow.length && !added.deny.length) return { stacks: stacks.map((s) => s.id), added, unchanged: true };
  if (!dryRun) {
    const next = { ...read.settings };
    const perms = next.permissions && typeof next.permissions === 'object' ? { ...next.permissions } : {};
    perms.allow = [...(Array.isArray(perms.allow) ? perms.allow : []), ...added.allow];
    perms.deny = [...(Array.isArray(perms.deny) ? perms.deny : []), ...added.deny];
    next.permissions = perms;
    fs.mkdirSync(path.join(root, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(root, SETTINGS), JSON.stringify(next, null, 2) + '\n');
  }
  return { stacks: stacks.map((s) => s.id), added, existed: read.existed, written: !dryRun };
}

function report(result) {
  if (result.skipped) return `permissions: NOT APPLIED — ${result.skipped}`;
  const { added } = result;
  if (result.unchanged)
    return `permissions: nothing to add — ${result.stacks.join(', ')} already covered by ${SETTINGS}`;
  const lines = [`permissions${result.written ? '' : ' (dry run)'}: ${result.stacks.join(', ')} → ${SETTINGS}`];
  for (const r of added.allow) lines.push(`  + allow  ${r}`);
  for (const r of added.deny) lines.push(`  + deny   ${r}`);
  lines.push('  nothing already in the file was changed or removed.');
  return lines.join('\n');
}

function main(argv, cwd = process.cwd()) {
  const at = argv.indexOf('--root');
  const root = path.resolve(at >= 0 ? argv[at + 1] : cwd);
  const result = apply(root, detectStacks(root, loadMappings()), { dryRun: argv.includes('--dry-run') });
  console.log(argv.includes('--json') ? JSON.stringify(result, null, 2) : report(result));
  return 0; // advisory: it never fails a build
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { readSettings, plan, apply, report, main, SETTINGS };
