#!/usr/bin/env node
'use strict';

/**
 * be — basic-engineering CLI
 *
 * Commands:
 *   be install [target-dir]   Install the base into a project (default: current dir)
 *   be update  [target-dir]   Alias for install (detects version automatically)
 *   be check   [target-dir]   Report installed version vs package version
 *   be version                Print this package's version
 *
 * Options:
 *   --dry-run   Show what would happen without writing files
 *   --force     Reinstall even if versions match
 *   --silent    Suppress output (useful for scripts)
 */

const path = require('path');
const fs   = require('fs');
const { install, PACKAGE_VERSION } = require('../lib/installer');

// ── Parse args ───────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const command = args.find(a => !a.startsWith('--')) || 'install';
const dryRun  = args.includes('--dry-run');
const force   = args.includes('--force');
const silent  = args.includes('--silent');

// Target dir: first non-flag, non-command argument, or cwd
const positional = args.filter(a => !a.startsWith('--') && a !== command);
const rawTarget  = positional[0] || '.';
const targetDir  = path.resolve(rawTarget);

// ── Command dispatch ──────────────────────────────────────────────────────────

switch (command) {
  case 'version':
  case '--version':
  case '-v':
    console.log(PACKAGE_VERSION);
    process.exit(0);
    break;

  case 'check': {
    const installedFile = path.join(targetDir, '.github', 'base', 'BASE_VERSION');

    console.log('');
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│          basic-engineering — Version Check          │');
    console.log('└─────────────────────────────────────────────────────┘');
    console.log(`  Package version  : ${PACKAGE_VERSION}`);

    if (!fs.existsSync(installedFile)) {
      console.log('  Installed version: (not found)');
      console.log('');
      console.log('  basic-engineering is not installed in this project.');
      console.log(`  Run: npx @barcelosvinicius/basic-engineering install ${rawTarget}`);
      console.log('');
      process.exit(1);
    }

    const installed = fs.readFileSync(installedFile, 'utf8')
      .trim()
      .replace(/^\uFEFF/, '');

    console.log(`  Installed version: ${installed}`);
    console.log('');

    if (installed === PACKAGE_VERSION) {
      console.log('✅  Up to date.');
      process.exit(0);
    } else if (installed < PACKAGE_VERSION) {
      console.log(`🔄  Update available: ${installed} → ${PACKAGE_VERSION}`);
      console.log(`    Run: npx @barcelosvinicius/basic-engineering update ${rawTarget}`);
      process.exit(1);
    } else {
      console.log(`ℹ️  Installed (${installed}) is newer than package (${PACKAGE_VERSION}).`);
      process.exit(0);
    }
    break;
  }

  case 'install':
  case 'update': {
    if (!fs.existsSync(targetDir)) {
      console.error(`❌  Target directory does not exist: ${targetDir}`);
      process.exit(2);
    }

    const result = install(targetDir, { dryRun, force, silent });

    if (result.action === 'skipped') process.exit(0);
    if (result.action === 'dry-run') process.exit(0);
    process.exit(0);
    break;
  }

  default:
    console.error(`❌  Unknown command: ${command}`);
    console.error('');
    console.error('Usage: be <command> [target-dir] [options]');
    console.error('');
    console.error('Commands:');
    console.error('  install [dir]   Install or update the base (default: current dir)');
    console.error('  update  [dir]   Alias for install');
    console.error('  check   [dir]   Check installed vs package version');
    console.error('  version         Print this package version');
    console.error('');
    console.error('Options:');
    console.error('  --dry-run       Show what would happen without writing files');
    console.error('  --force         Reinstall even if versions already match');
    console.error('  --silent        Suppress output');
    process.exit(2);
}
