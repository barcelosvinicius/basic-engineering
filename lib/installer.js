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
 * Source → destination mapping of universal content. Sources live inside the
 * canonical Claude Code plugin at plugins/be/; destinations are relative to
 * the target project's .be/. Always safe to overwrite on update
 * because they are universal (not project-specific).
 */
const UNIVERSAL_FILES = [
  { src: 'plugins/be/engineering-principles.md', dest: 'engineering-principles.md' },
  { src: 'plugins/be/BOOTSTRAP.md',              dest: 'BOOTSTRAP.md' },
  { src: 'BASE_VERSION',                         dest: 'BASE_VERSION' },
  { src: 'base-manifest.json',                   dest: 'base-manifest.json' },
  { src: 'plugins/be/ai-context.template.md',    dest: 'ai-context.template.md' },
  { src: 'plugins/be/mcp.recommended.json',      dest: 'mcp.recommended.json' },
  { src: 'plugins/be/BE-GUIDE.md',               dest: 'BE-GUIDE.md' },
  { src: 'plugins/be/BE-GUIDE.pt.md',            dest: 'BE-GUIDE.pt.md' },
  { src: 'plugins/be/skills',                    dest: 'skills' },
  { src: 'plugins/be/agents',                    dest: 'agents' },
  { src: 'plugins/be/commands',                  dest: 'commands' },
  { src: 'plugins/be/semgrep',                   dest: 'semgrep' },
  { src: 'plugins/be/config',                    dest: 'config' },
  { src: 'plugins/be/.be-paths.example.json',    dest: '.be-paths.example.json' },
  { src: 'plugins/be/templates/docs',            dest: 'docs' },
];

/**
 * Files that are created only on a fresh install and never overwritten on
 * update — they are project-specific and may have been customised.
 */
const FRESH_ONLY_FILES = [
  // none currently — all files in this package are universal templates
];

/**
 * Legacy layout markers (pre-2.0). When found on update, the installer prints
 * a migration notice but NEVER deletes user files.
 */
const LEGACY_ENTRIES = ['roles'];

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
  const { dryRun = false, force = false, silent = false, profile } = options;

  const log   = (...args) => { if (!silent) console.log(...args); };
  const warn  = (...args) => { if (!silent) console.warn(...args); };

  const destBase   = path.join(targetDir, '.be');
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
      log('🚀  Fresh install — copying all files to .be/');
      break;

    case 'update':
      log(`🔄  Update available: ${installedVersion} → ${PACKAGE_VERSION}`);
      log('    Updating universal files (your customisations are preserved).');
      break;
  }

  // ── Resolve install profile (which skills to copy) ────────────────────────
  const skillFilter = resolveSkillFilter(profile, warn);
  if (skillFilter.prefixes) log(`  Skills profile   : ${skillFilter.name}`);

  // ── Dry-run guard ─────────────────────────────────────────────────────────
  if (dryRun) {
    log('');
    log('  [dry-run] No files were written.');
    return { action: 'dry-run', from: installedVersion, to: PACKAGE_VERSION };
  }

  // ── Execute copy ──────────────────────────────────────────────────────────
  const packageRoot = path.join(__dirname, '..');
  fs.mkdirSync(destBase, { recursive: true });

  const filesToCopy = action === 'fresh-install'
    ? [...UNIVERSAL_FILES, ...FRESH_ONLY_FILES]
    : UNIVERSAL_FILES;

  for (const entry of filesToCopy) {
    const src  = path.join(packageRoot, entry.src);
    const dest = path.join(destBase, entry.dest);

    if (!fs.existsSync(src)) {
      warn(`  ⚠️  Source not found, skipping: ${entry.src}`);
      continue;
    }

    if (entry.dest === 'skills' && skillFilter.prefixes) {
      const n = copySkillsFiltered(src, dest, skillFilter.prefixes);
      log(`  ✔  ${entry.dest} (${n} skills, profile ${skillFilter.name})`);
    } else {
      copyEntry(src, dest);
      log(`  ✔  ${entry.dest}`);
    }
  }

  // ── Discoverable guide at the project root (fresh install only) ───────────
  // Drop a copy of BE-GUIDE.md at the project root so the team sees what the
  // base offers without digging into .be/. Never overwrite an
  // existing one — it may be the user's.
  if (action === 'fresh-install') {
    const rootGuide = path.join(targetDir, 'BE-GUIDE.md');
    const srcGuide = path.join(packageRoot, 'plugins', 'be', 'BE-GUIDE.md');
    if (!fs.existsSync(rootGuide) && fs.existsSync(srcGuide)) {
      fs.copyFileSync(srcGuide, rootGuide);
      log('  ✔  BE-GUIDE.md (project root)');
    }
  }

  // ── Migration notice: previous install lived under .github/base/ ──────────
  const oldBase = path.join(targetDir, '.github', 'base');
  if (fs.existsSync(oldBase)) {
    warn('');
    warn('  ⚠️  Found a previous install at .github/base/ (left untouched).');
    warn('      The base now installs to .be/. Migrate any customizations from');
    warn('      .github/base/ and remove it when ready — it is never deleted for you.');
  }

  // ── Legacy layout notice (pre-2.0 installs) ───────────────────────────────
  const legacyFound = detectLegacyLayout(destBase);
  if (legacyFound.length > 0) {
    warn('');
    warn('  ⚠️  Legacy pre-2.0 layout detected (not modified):');
    for (const item of legacyFound) warn(`      - .be/${item}`);
    warn('      Since 2.0 roles became agents/ and skills use the');
    warn('      skills/<name>/SKILL.md directory format. Review and remove the');
    warn('      legacy entries manually after migrating your customisations.');
  }

  log('');
  if (action === 'fresh-install') {
    log('✅  Installation complete.');
    log(`    Files written to: ${destBase}`);
    log('');
    log('    Next step: read .be/BOOTSTRAP.md and follow the setup guide.');
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

/**
 * Detect leftovers from the pre-2.0 layout: a roles/ directory or flat
 * skills/*.md files (2.0 skills are directories containing SKILL.md).
 */
function detectLegacyLayout(destBase) {
  const found = [];
  for (const entry of LEGACY_ENTRIES) {
    if (fs.existsSync(path.join(destBase, entry))) found.push(entry);
  }
  const skillsDir = path.join(destBase, 'skills');
  if (fs.existsSync(skillsDir)) {
    const flatSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith('.md'));
    if (flatSkills.length > 0) found.push(`skills/*.md (${flatSkills.length} flat skill file(s))`);
  }
  return found;
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

/** Load the install-profiles manifest, or null if unavailable. */
function loadProfiles() {
  const file = path.join(__dirname, '..', 'plugins', 'be', 'config', 'install-profiles.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Resolve a profile name to a skill filter.
 * @returns {{ name: string, prefixes: string[]|null }} prefixes=null means "all skills".
 */
function resolveSkillFilter(profileName, warn = () => {}) {
  const manifest = loadProfiles();
  if (!manifest || !manifest.profiles) return { name: 'full', prefixes: null };
  const name = profileName || manifest.default || 'full';
  const profile = manifest.profiles[name];
  if (!profile) {
    warn(`  ⚠️  Unknown profile "${profileName}" — using the full set. Known: ${Object.keys(manifest.profiles).join(', ')}`);
    return { name: 'full', prefixes: null };
  }
  if (profile.skills === '*' || !Array.isArray(profile.skills)) {
    return { name, prefixes: null };
  }
  return { name, prefixes: profile.skills };
}

/** Copy only the skill directories whose name starts with one of `prefixes`. */
function copySkillsFiltered(src, dest, prefixes) {
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const child of fs.readdirSync(src, { withFileTypes: true })) {
    const childSrc = path.join(src, child.name);
    if (!child.isDirectory()) {
      copyEntry(childSrc, path.join(dest, child.name));
      continue;
    }
    if (prefixes.some((p) => child.name.startsWith(p))) {
      copyEntry(childSrc, path.join(dest, child.name));
      count++;
    }
  }
  return count;
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = { install, PACKAGE_VERSION };
