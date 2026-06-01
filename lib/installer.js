'use strict';

/**
 * installer.js — core install/update logic for basic-engineering
 *
 * Responsibilities:
 *  - Detect whether basic-engineering is already present in the target project
 *  - Compare the installed version against the package version
 *  - Decide the action: fresh install, update (universal files only), or skip
 *  - Copy files to the correct destination structure
 */

const fs   = require('fs');
const path = require('path');

// ── Constants ────────────────────────────────────────────────────────────────

/** Version string embedded in this package's BASE_VERSION file. */
const PACKAGE_VERSION = readPackageVersion();

/**
 * Files and directories that are always safe to overwrite on update because
 * they are universal (not project-specific).
 */
const UNIVERSAL_FILES = [
  'engineering-principles.md',
  'BOOTSTRAP.md',
  'BASE_VERSION',
  'base-manifest.json',
  'ai-context.template.md',
  'skills',
  'roles',
  'docs',
];

/**
 * Files that are created only on a fresh install and never overwritten on
 * update — they are project-specific and may have been customised.
 */
const FRESH_ONLY_FILES = [
  // none currently — all files in this package are universal templates
];

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the installer against `targetDir`.
 *
 * @param {string} targetDir   - Absolute path to the target project root.
 * @param {object} [options]
 * @param {boolean} [options.dryRun=false]  - Print what would happen, but do nothing.
 * @param {boolean} [options.force=false]   - Force reinstall even if versions match.
 * @param {boolean} [options.silent=false]  - Suppress informational output.
 * @returns {{ action: 'installed'|'updated'|'skipped'|'dry-run', from?: string, to?: string }}
 */
function install(targetDir, options = {}) {
  const { dryRun = false, force = false, silent = false } = options;

  const log   = (...args) => { if (!silent) console.log(...args); };
  const warn  = (...args) => { if (!silent) console.warn(...args); };

  const destBase   = path.join(targetDir, '.github', 'base');
  const installedVersionFile = path.join(destBase, 'BASE_VERSION');

  log('');
  log('┌─────────────────────────────────────────────────────┐');
  log('│          basic-engineering — Installer              │');
  log('└─────────────────────────────────────────────────────┘');
  log(`  Package version  : ${PACKAGE_VERSION}`);

  // ── Detect existing installation ──────────────────────────────────────────
  const alreadyInstalled = fs.existsSync(installedVersionFile);
  let installedVersion   = null;

  if (alreadyInstalled) {
    installedVersion = readVersionFile(installedVersionFile);
    log(`  Installed version: ${installedVersion}`);
  } else {
    log(`  Installed version: (not found)`);
  }
  log('');

  // ── Decide action ─────────────────────────────────────────────────────────
  const action = decideAction({
    alreadyInstalled,
    installedVersion,
    packageVersion: PACKAGE_VERSION,
    force,
  });

  switch (action) {
    case 'skip':
      log('✅  Already up to date. Nothing to do.');
      log('    Use --force to reinstall anyway.');
      return { action: 'skipped' };

    case 'warn-newer': {
      warn(`⚠️  The installed version (${installedVersion}) is newer than this package (${PACKAGE_VERSION}).`);
      warn('   This can happen if you installed a pre-release. No changes were made.');
      warn('   Use --force to overwrite with the package version.');
      return { action: 'skipped' };
    }

    case 'fresh-install':
      log('🚀  Fresh install — copying all files to .github/base/');
      break;

    case 'update':
      log(`🔄  Update available: ${installedVersion} → ${PACKAGE_VERSION}`);
      log('    Updating universal files (your customisations are preserved).');
      break;
  }

  // ── Dry-run guard ─────────────────────────────────────────────────────────
  if (dryRun) {
    log('');
    log('  [dry-run] No files were written.');
    return { action: 'dry-run', from: PACKAGE_VERSION, to: installedVersion };
  }

  // ── Execute copy ──────────────────────────────────────────────────────────
  const packageRoot = path.join(__dirname, '..');
  fs.mkdirSync(destBase, { recursive: true });

  const filesToCopy = action === 'fresh-install'
    ? [...UNIVERSAL_FILES, ...FRESH_ONLY_FILES]
    : UNIVERSAL_FILES;

  for (const entry of filesToCopy) {
    const src  = path.join(packageRoot, entry);
    const dest = path.join(destBase, entry);

    if (!fs.existsSync(src)) {
      warn(`  ⚠️  Source not found, skipping: ${entry}`);
      continue;
    }

    copyEntry(src, dest);
    log(`  ✔  ${entry}`);
  }

  log('');
  if (action === 'fresh-install') {
    log('✅  Installation complete.');
    log(`    Files written to: ${destBase}`);
    log('');
    log('    Next step: read .github/base/BOOTSTRAP.md and follow the setup guide.');
  } else {
    log('✅  Update complete.');
    log(`    Universal files updated in: ${destBase}`);
    log('');
    log('    Review BOOTSTRAP.md and CHANGELOG for any breaking changes.');
  }
  log('');

  return {
    action : action === 'fresh-install' ? 'installed' : 'updated',
    from   : installedVersion,
    to     : PACKAGE_VERSION,
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Decide what the installer should do.
 *
 * Version format is vYYYYMMDD-HHMMSS — lexicographic comparison is correct.
 */
function decideAction({ alreadyInstalled, installedVersion, packageVersion, force }) {
  if (!alreadyInstalled) return 'fresh-install';
  if (force)             return 'fresh-install';

  if (installedVersion === packageVersion) return 'skip';
  if (installedVersion  <  packageVersion) return 'update';
  return 'warn-newer'; // installedVersion > packageVersion
}

/** Read the version string from a BASE_VERSION file, trimmed. */
function readVersionFile(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().replace(/^\uFEFF/, ''); // strip BOM
}

/** Read this package's own BASE_VERSION. */
function readPackageVersion() {
  const versionFile = path.join(__dirname, '..', 'BASE_VERSION');
  if (!fs.existsSync(versionFile)) return 'unknown';
  return readVersionFile(versionFile);
}

/**
 * Copy a file or directory recursively.
 * Directories are merged (existing files not in source are kept).
 */
function copyEntry(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyEntry(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = { install, PACKAGE_VERSION };
