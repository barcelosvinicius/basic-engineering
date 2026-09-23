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
 *   --claude    Print the native Claude Code plugin instructions instead of copying
 *   --profile=<name>  Install a skill subset (full|minimal|backend|frontend; default full)
 */

const path = require('node:path');
const fs = require('node:fs');
const { install, PACKAGE_VERSION } = require('../lib/installer');

// ── Parse args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith('--')) || 'install';
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const silent = args.includes('--silent');
const claude = args.includes('--claude');
const offline = args.includes('--offline'); // doctor: skip the npm lookup
const profileArg = args.find((a) => a.startsWith('--profile='));
const profile = profileArg ? profileArg.slice('--profile='.length) : undefined;

// Target dir: first non-flag, non-command argument, or cwd
const positional = args.filter((a) => !a.startsWith('--') && a !== command);
const rawTarget = positional[0] || '.';
const targetDir = path.resolve(rawTarget);

// ── Command dispatch ──────────────────────────────────────────────────────────

switch (command) {
  case 'version':
  case '--version':
  case '-v':
    console.log(PACKAGE_VERSION);
    process.exit(0);
    break;

  case 'check': {
    const installedFile = path.join(targetDir, '.be', 'BASE_VERSION');

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

    const installed = fs
      .readFileSync(installedFile, 'utf8')
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

  case 'doctor': {
    // Three pieces of state are per machine and invisible from the repository:
    // which plugin version is installed here, whether its hooks are actually on
    // disk, and whether this checkout normalises line endings. This base is
    // operated from several machines; one of them ran a two-month-old plugin
    // with four of five hook scripts missing, and nothing ever said so.
    const { diagnose } = require('../lib/doctor.js');
    const pluginManifest = path.join(__dirname, '..', 'plugins', 'be', '.claude-plugin', 'plugin.json');
    let pluginVersion = null;
    try {
      pluginVersion = JSON.parse(fs.readFileSync(pluginManifest, 'utf8')).version;
    } catch {
      /* running from an npm install without the plugin tree */
    }

    // `doctor` is an explicit request, so it asks npm live instead of reading
    // the once-a-day cache the session-start hook keeps. Offline: silent.
    const lookupLatest = async () => {
      if (offline) return null;
      try {
        return await require('../plugins/be/hooks/scripts/_update-check.js').fetchLatest();
      } catch {
        return null;
      }
    };

    lookupLatest().then((latestPublished) => {
      const { facts, findings } = diagnose({
        cwd: targetDir,
        packageVersion: PACKAGE_VERSION,
        pluginVersion,
        repoPluginRoot: path.join(__dirname, '..', 'plugins', 'be'),
        latestPublished,
      });

      console.log('');
      console.log('┌─────────────────────────────────────────────────────┐');
      console.log('│          basic-engineering — Doctor                 │');
      console.log('└─────────────────────────────────────────────────────┘');
      for (const [k, v] of facts) console.log(`  ${String(k).padEnd(24)}: ${v}`);
      console.log('');

      if (!findings.length) {
        console.log('✅  Nothing to act on here.');
        console.log('');
        process.exit(0);
      }

      console.log(`⚠️   ${findings.length} finding(s):`);
      console.log('');
      for (const f of findings) console.log(`  - ${f}`);
      console.log('');
      process.exit(1);
    });
    break;
  }

  case 'install':
  case 'update': {
    if (claude) {
      console.log('');
      console.log('Claude Code users get the base natively as a plugin — no file copies:');
      console.log('');
      console.log('  /plugin marketplace add barcelosvinicius/basic-engineering');
      console.log('  /plugin install be@basic-engineering');
      console.log('');
      console.log('Then run /be:bootstrap inside your project.');
      console.log('Update later with: /plugin update be@basic-engineering');
      console.log('');
      process.exit(0);
    }

    if (!fs.existsSync(targetDir)) {
      console.error(`❌  Target directory does not exist: ${targetDir}`);
      process.exit(2);
    }

    const result = install(targetDir, { dryRun, force, silent, profile });

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
    console.error('  doctor  [dir]   Diagnose this machine: plugin version, hooks, line endings');
    console.error('  version         Print this package version');
    console.error('');
    console.error('Options:');
    console.error('  --dry-run       Show what would happen without writing files');
    console.error('  --force         Reinstall even if versions already match');
    console.error('  --silent        Suppress output');
    console.error('  --claude        Print Claude Code plugin install instructions');
    console.error('  --offline       doctor: skip the npm version lookup');
    console.error('  --profile=<n>   Skill subset: full|minimal|backend|frontend (default full)');
    process.exit(2);
}
