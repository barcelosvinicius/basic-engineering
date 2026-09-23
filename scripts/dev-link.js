#!/usr/bin/env node
/**
 * Point this repo's .claude/ at its own working tree.
 *
 * .claude/settings.json already runs the hooks from plugins/be/, so a hook being
 * edited is the hook that runs. Skills, agents and commands did not follow — and
 * telling developers to disable the published plugin (or every hook fires twice)
 * took those away with it. This closes the hole the same change opened.
 *
 * The links are LOCAL and gitignored, never committed: a symlink in git is a
 * cross-platform trap, and this repo has already been bitten by one
 * (CRLF, P-08). Windows gets a junction, which Node creates without admin.
 *
 *   node scripts/dev-link.js            link
 *   node scripts/dev-link.js --remove   unlink
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LINKS = ['skills', 'agents', 'commands'];

function statusOf(link) {
  try {
    return fs.lstatSync(link).isSymbolicLink() ? 'link' : 'real';
  } catch {
    return 'absent';
  }
}

function main(argv = process.argv.slice(2), log = console.log) {
  const remove = argv.includes('--remove');
  const dir = path.join(ROOT, '.claude');
  fs.mkdirSync(dir, { recursive: true });

  for (const name of LINKS) {
    const link = path.join(dir, name);
    const target = path.join(ROOT, 'plugins', 'be', name);
    const state = statusOf(link);

    // A real directory is someone's own files. Never delete it — the same rule
    // the installer follows in target projects.
    if (state === 'real') {
      log(`  ·  .claude/${name} is a real directory, not a link — left untouched`);
      continue;
    }
    if (state === 'link') fs.unlinkSync(link);
    if (remove) {
      log(`  ✔ .claude/${name} unlinked`);
      continue;
    }
    if (!fs.existsSync(target)) {
      log(`  ·  plugins/be/${name} does not exist — nothing to link`);
      continue;
    }
    try {
      fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
      log(`  ✔ .claude/${name} → plugins/be/${name}`);
    } catch (e) {
      log(`  ✗ .claude/${name}: ${e.message}`);
    }
  }
  if (!remove) log('\n  Disable the published `be` plugin while working here, or every hook fires twice.');
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { main, statusOf, LINKS };
