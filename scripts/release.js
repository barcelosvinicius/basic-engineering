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

// ── resolve + guard BASE_VERSION, before anything is written ─────────────────
// UTC, as CONTRIBUTING.md documents. It used to be local time, which is wrong
// for a value compared lexicographically across machines: two releases cut on
// the same day from different timezones can invert, and the installer would
// then read the newer base as older. The guard makes that unrepresentable.
// Both this and the CHANGELOG date derive from the same UTC instant, so they
// can never disagree about which day the release happened.
const d = new Date();
const z = (n) => String(n).padStart(2, '0');
const baseVersion =
  `v${d.getUTCFullYear()}${z(d.getUTCMonth() + 1)}${z(d.getUTCDate())}` +
  `-${z(d.getUTCHours())}${z(d.getUTCMinutes())}${z(d.getUTCSeconds())}`;
const prevBaseVersion = read('BASE_VERSION').trim();
if (prevBaseVersion && baseVersion <= prevBaseVersion) {
  fail(
    `BASE_VERSION ${baseVersion} is not newer than ${prevBaseVersion}. ` +
    'The installer compares these lexicographically, so a value that does not ' +
    'increase would make this release look older than the last.'
  );
}

// ── guard: the backlog's claimed status still matches reality ────────────────
// It once claimed "nothing implemented yet" for two months while 16 of 20 items
// had shipped. A release that ships a wrong status ships it to everyone.
try {
  execSync('node scripts/backlog-audit.js --check', { cwd: ROOT, stdio: 'inherit' });
} catch {
  fail('feedback/BACKLOG.md is out of date — run `node scripts/backlog-audit.js --md` and commit it');
}

// ── guard: the fact panel still matches the repo it describes ────────────────
// It has a `--check` mode since the day it was written, and until 2026-09-20
// nothing ran it: not CI, not this script. It was green whenever somebody
// remembered to run it by hand, which is the state this base exists to remove.
try {
  execSync('node scripts/graph-audit.js --check', { cwd: ROOT, stdio: 'inherit' });
} catch {
  fail(
    'the fact panel in docs/structural-analysis.md no longer matches the repo — ' +
    'run `node scripts/graph-audit.js --md` and commit it'
  );
}

// ── guard: clean tree (so the release commit is pure) ────────────────────────
if (!dryRun && shOut('git status --porcelain')) {
  fail('working tree is dirty — commit your changes first (or pass --dry-run)');
}

// A dry run deliberately writes the files so the diff can be inspected, and it
// skips the clean-tree guard above — which makes it the one mode where a file
// may already carry unrelated uncommitted work. Remember which, so the revert
// advice printed at the end never tells you to discard it.
// NB: shOut trims the whole output, so the first line loses its leading status
// space — slicing a fixed 3 chars would eat one character of that filename.
// Match the status field instead of counting columns.
const dirtyBefore = dryRun
  ? shOut('git status --porcelain')
      .split(/\r?\n/)
      .map((l) => l.replace(/^[ MADRCU?!]{1,2}\s+/, '').trim())
      .filter(Boolean)
  : [];

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

// ── 2) BASE_VERSION ──────────────────────────────────────────────────────────
write('BASE_VERSION', baseVersion + '\n');

// ── 3) CHANGELOG: roll [Unreleased] into a dated version section ──────────────
const date = `${d.getUTCFullYear()}-${z(d.getUTCMonth() + 1)}-${z(d.getUTCDate())}`;
const cl = read('CHANGELOG.md');
if (cl.includes('## [Unreleased]')) {
  write('CHANGELOG.md', cl.replace('## [Unreleased]', `## [Unreleased]\n\n## [${next}] — ${date}`));
} else {
  console.warn('  warn: no "## [Unreleased]" header in CHANGELOG.md — add the section by hand');
}

// ── 4) regenerate the generated docs, then validate + test ───────────────────
// The fact panel names the version it was measured against, and the bump above
// just changed it. Without this line the release fails its own test suite every
// time — which is what happened at v3.1.1, patched by hand, recorded nowhere.
sh('node scripts/graph-audit.js --write');
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
  // Regenerated in step 4 because the bump changes the version it reports. Left
  // out of this list it would stay behind as an uncommitted change and the next
  // release would refuse to start on a dirty tree.
  'docs/structural-analysis.md',
];

if (dryRun) {
  const clash = RELEASE_FILES.filter((f) => dirtyBefore.includes(f));
  console.log('\n  [dry-run] files updated; no commit/tag/push.');
  if (clash.length) {
    console.log('\n  ⚠  These already had uncommitted changes before this run:');
    for (const f of clash) console.log(`       ${f}`);
    console.log('     `git checkout --` on them would DISCARD that work. Revert the');
    console.log('     release edits by hand (`git diff` shows both), then run:');
    console.log(`  git checkout -- ${RELEASE_FILES.filter((f) => !clash.includes(f)).join(' ')}\n`);
  } else {
    console.log('  Revert with:');
    console.log(`  git checkout -- ${RELEASE_FILES.join(' ')}\n`);
  }
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
