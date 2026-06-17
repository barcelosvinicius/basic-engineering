#!/usr/bin/env node
'use strict';

/**
 * One-command release for `be`.
 *
 *   npm run release -- patch|minor|major     bump (default: patch)
 *   npm run release -- 3.2.0                  explicit version
 *   npm run release -- minor --push           also push main (fires CI publish)
 *   npm run release -- minor --dry-run        do everything except git commit/push
 *
 * Steps: bump the 4 version files in lockstep (package.json, plugin.json,
 * marketplace.json, BASE_VERSION); roll CHANGELOG [Unreleased] into a dated
 * version section; regenerate the guides; run validate + tests; then commit
 * `chore(release): vX.Y.Z`. With --push it pushes main, which triggers the
 * release workflow (npm publish via OIDC, then tag + GitHub release); the
 * marketplace updates from the same main push on its own.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const push = args.includes('--push');
const bump = args.filter((a) => !a.startsWith('--'))[0] || 'patch';

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, c) => fs.writeFileSync(path.join(ROOT, p), c);
const sh = (cmd, opts = {}) => execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
const shOut = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();

function fail(msg) {
  console.error(`release: ${msg}`);
  process.exit(1);
}

// ── resolve next version ─────────────────────────────────────────────────────
const cur = JSON.parse(read('package.json')).version;
const m = cur.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!m) fail(`current version "${cur}" is not X.Y.Z`);
const [maj, min, pat] = m.slice(1).map(Number);

let next;
if (/^\d+\.\d+\.\d+$/.test(bump)) next = bump;
else if (bump === 'major') next = `${maj + 1}.0.0`;
else if (bump === 'minor') next = `${maj}.${min + 1}.0`;
else if (bump === 'patch') next = `${maj}.${min}.${pat + 1}`;
else fail(`unknown bump "${bump}" — use patch | minor | major | X.Y.Z`);
if (next === cur) fail(`next version equals current (${cur})`);

console.log(`\n  Release ${cur} -> ${next}${dryRun ? '  (dry-run)' : ''}\n`);

// ── guard: clean tree (so the release commit is pure) ────────────────────────
if (!dryRun && shOut('git status --porcelain')) {
  fail('working tree is dirty — commit your changes first (or pass --dry-run)');
}

// ── 1) bump semver in the three manifests ────────────────────────────────────
for (const f of [
  'package.json',
  'plugins/be/.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
]) {
  const before = read(f);
  const after = before.split(`"version": "${cur}"`).join(`"version": "${next}"`);
  if (after === before) console.warn(`  warn: no '"version": "${cur}"' in ${f}`);
  write(f, after);
}

// ── 2) BASE_VERSION timestamp ────────────────────────────────────────────────
const d = new Date();
const z = (n) => String(n).padStart(2, '0');
const baseVersion = `v${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
write('BASE_VERSION', baseVersion + '\n');

// ── 3) CHANGELOG: roll [Unreleased] into a dated version section ──────────────
const date = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
const cl = read('CHANGELOG.md');
if (cl.includes('## [Unreleased]')) {
  write('CHANGELOG.md', cl.replace('## [Unreleased]', `## [Unreleased]\n\n## [${next}] — ${date}`));
} else {
  console.warn('  warn: no "## [Unreleased]" header in CHANGELOG.md — add the section by hand');
}

// ── 4) regenerate guides, then validate + test ───────────────────────────────
sh('node scripts/gen-capabilities.js');
sh('node scripts/validate.js');
sh('node --test');

const RELEASE_FILES = [
  'package.json',
  'plugins/be/.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  'BASE_VERSION',
  'CHANGELOG.md',
  'plugins/be/BE-GUIDE.md',
  'plugins/be/BE-GUIDE.pt.md',
];

if (dryRun) {
  console.log('\n  [dry-run] files updated; no commit/tag/push. Revert with:');
  console.log(`  git checkout -- ${RELEASE_FILES.join(' ')}\n`);
  process.exit(0);
}

// ── 5) commit (the CI tags + releases after it publishes) ────────────────────
sh(`git add ${RELEASE_FILES.join(' ')}`);
sh(`git commit -m "chore(release): v${next}"`);

if (push) {
  sh('git push origin HEAD');
  console.log(`\n  Pushed to main. CI publishes v${next} to npm (OIDC) and tags it; the marketplace updates from the same push.\n`);
} else {
  console.log(`\n  Committed v${next}. Push to publish — CI does npm + tag + release; the marketplace updates from main:`);
  console.log('  git push origin HEAD\n');
}
