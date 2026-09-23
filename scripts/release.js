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

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

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

// ── guard: the tests of the guards would notice a wrong line ─────────────────
// Coverage says a line ran; this says a test would notice it changing. Too slow
// for every push (about two minutes), so it runs where it cannot be skipped by
// forgetting: here. The first pass found 53 survivors in five modules.
try {
  execSync('node scripts/mutation-check.js --check', { cwd: ROOT, stdio: 'inherit' });
} catch {
  fail(
    'a mutant of a guard survived its tests — add the test that would notice it, ' +
      'or record in scripts/mutation-equivalents.json why it cannot change behaviour'
  );
}

// ── guard: a release that changes what users see must not leave README behind ─
// v3.1.0 and v3.1.1 shipped `be doctor`, the session-start update check and the
// `.gitattributes` seeding. README.md had last changed before both and named
// none of them, and `validate.js` passed the whole time — it checks that what is
// WRITTEN is true (counts, names that resolve), never that what EXISTS is
// described. No count had changed, so it had nothing to fail on.
//
// The question a machine can decide is not "does this deserve a README line?"
// (judgment, and a gate that judges becomes noise) but "the surface the README
// describes changed, and the README did not". The three capabilities that got
// missed landed in exactly these paths — the rule is derived from the incident,
// not guessed.
const USER_FACING = ['plugins/be/commands/', 'plugins/be/hooks/', 'bin/', 'lib/installer.js'];
{
  const flag = args.find((a) => a.startsWith('--readme-ok='));
  let lastTag = '';
  try {
    lastTag = shOut('git describe --tags --abbrev=0 --match "v*"');
  } catch {
    lastTag = '';
  }
  if (!lastTag) {
    console.log('release: no previous version tag — README guard skipped (nothing to compare against).');
  } else {
    let changed;
    try {
      changed = shOut(`git diff --name-only ${lastTag}..HEAD`).split(/\r?\n/).filter(Boolean);
      // A real release runs on a clean tree, so HEAD is the whole story. A dry
      // run is the opposite case — it exists to be run with work still
      // uncommitted, and a guard that answered "nothing changed" there would
      // preview a release different from the one being rehearsed.
      // NB: shOut trims, so the first line has already lost its leading status
      // space — match the status field rather than counting columns (same
      // reason as the `dirtyBefore` note below).
      for (const line of shOut('git status --porcelain').split(/\r?\n/)) {
        const file = line
          .replace(/^[ MADRCU?!]{1,2}\s+/, '')
          .split(' -> ')
          .pop()
          .trim();
        if (file && !changed.includes(file)) changed.push(file);
      }
    } catch {
      // Could not MEASURE. That is not a pass — see the exit-code taxonomy note
      // in docs/lessons-learned.md.
      changed = null;
      fail(`could not diff against ${lastTag}; the README guard could not run, and that is not a green`);
    }
    const touched = changed.filter((f) => USER_FACING.some((p) => f.startsWith(p)));
    if (touched.length && !changed.includes('README.md')) {
      if (flag) {
        const reason = flag.slice('--readme-ok='.length).trim();
        if (!reason) fail('--readme-ok needs a reason: it is the record of why the README stayed as it is');
        console.log(`release: README unchanged by decision — "${reason}"`);
      } else {
        fail(
          `this release changes what users see, and README.md did not change since ${lastTag}:\n` +
            touched.map((f) => `        ${f}`).join('\n') +
            '\n\n  Answer the question before releasing: does a README reader need to know\n' +
            '  something new? Either edit README.md, or record why not with\n' +
            '  `--readme-ok="<reason>"` and put the same line in the CHANGELOG entry.'
        );
      }
    }
  }
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
for (const f of ['package.json', 'plugins/be/.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
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
  console.log(
    `\n  Pushed to main. CI publishes v${next} to npm (OIDC) and tags it; the marketplace updates from the same push.\n`
  );
} else {
  console.log(
    `\n  Committed v${next}. Push to publish — CI does npm + tag + release; the marketplace updates from main:`
  );
  console.log('  git push origin HEAD\n');
}
