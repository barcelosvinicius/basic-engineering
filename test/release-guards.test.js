'use strict';

/**
 * The release's guards, with the case that makes each one fail.
 *
 * Measured 2026-09-28: release.js held eleven refusal sites and the suite
 * exercised one, because the rest sit behind validate, the suite, two audits and
 * a mutation pass — twenty minutes away from a test. Among the ten without a
 * case was the README guard itself, which exists BECAUSE v3.1.0 and v3.1.1
 * shipped with a stale README. Breaking it would have restored the exact failure
 * it was written to prevent, and nothing would have said so.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const g = require('../scripts/lib/release-guards.js');

test('the README guard refuses a user-facing change that left the README behind', () => {
  const r = g.readmeVerdict({
    lastTag: 'v3.2.0',
    changed: ['plugins/be/hooks/scripts/_lib.js', 'docs/action-plan.md'],
  });
  assert.strictEqual(r.verdict, 'refuse');
  assert.deepStrictEqual(r.touched, ['plugins/be/hooks/scripts/_lib.js'], 'it names the file, not just the fact');
  assert.match(r.reason, /README\.md did not change since v3\.2\.0/);
  assert.match(r.reason, /--readme-ok=/, 'and it says how to proceed deliberately');
});

test('and passes when the README moved too, or when nothing user-facing did', () => {
  assert.strictEqual(
    g.readmeVerdict({ lastTag: 'v3.2.0', changed: ['plugins/be/hooks/scripts/_lib.js', 'README.md'] }).verdict,
    'pass'
  );
  assert.strictEqual(
    g.readmeVerdict({ lastTag: 'v3.2.0', changed: ['docs/action-plan.md', 'CHANGELOG.md'] }).verdict,
    'pass',
    'documentation is not the surface the README describes'
  );
  assert.strictEqual(
    g.readmeVerdict({ lastTag: 'v3.2.0', changed: ['plugins/be/skills/qa-test-strategy/SKILL.md'] }).verdict,
    'pass',
    'a skill body is reached through the skill, not through the README'
  );
});

test('every path in USER_FACING really triggers the guard — the list is not decoration', () => {
  for (const prefix of g.USER_FACING) {
    const file = prefix.endsWith('/') ? `${prefix}something.js` : prefix;
    const r = g.readmeVerdict({ lastTag: 'v1.0.0', changed: [file] });
    assert.strictEqual(r.verdict, 'refuse', `${prefix} is declared user-facing and must refuse`);
  }
});

test('--readme-ok is a record, not a switch: it needs a reason', () => {
  const accepted = g.readmeVerdict({
    lastTag: 'v3.2.0',
    changed: ['bin/be.js'],
    readmeOk: 'the change is internal to the CLI parser',
  });
  assert.strictEqual(accepted.verdict, 'accepted');
  assert.match(
    accepted.reason,
    /internal to the CLI parser/,
    'the reason is carried, so it can be repeated in the CHANGELOG'
  );

  for (const empty of ['', '   ']) {
    const r = g.readmeVerdict({ lastTag: 'v3.2.0', changed: ['bin/be.js'], readmeOk: empty });
    assert.strictEqual(r.verdict, 'refuse', 'an empty reason records nothing');
    assert.match(r.reason, /needs a reason/);
  }
});

// "Could not measure" is not a pass -- the rule this base repeats everywhere,
// and the one place a release could quietly skip its own guard.
test('a diff that could not run is refused, not waved through', () => {
  const r = g.readmeVerdict({ lastTag: 'v3.2.0', changed: null });
  assert.strictEqual(r.verdict, 'refuse');
  assert.match(r.reason, /could not run, and that is not a green/);
});

test('with no previous tag the guard skips, and says it is a skip', () => {
  const r = g.readmeVerdict({ lastTag: '', changed: ['bin/be.js'] });
  assert.strictEqual(r.verdict, 'skip');
  assert.match(r.reason, /nothing to compare against/);
});

// BASE_VERSION is compared lexicographically, which only works while the format
// holds -- a gotcha recorded in CLAUDE.md and until now trusted rather than tested.
test('BASE_VERSION must move forward, and keep the shape that makes the comparison valid', () => {
  assert.ok(g.versionMovesForward('v20260101-000000', 'v20260928-120000').ok);
  const back = g.versionMovesForward('v20260928-120000', 'v20260101-000000');
  assert.strictEqual(back.ok, false);
  assert.match(back.reason, /lexicographically/, 'and it says why the order matters');
  assert.strictEqual(g.versionMovesForward('v20260101-000000', 'v20260101-000000').ok, false, 'equal is not forward');
  for (const bad of ['3.3.0', 'v2026-09-28', 'v20260928', 'vYYYYMMDD-HHMMSS', '']) {
    assert.strictEqual(g.versionMovesForward('v20260101-000000', bad).ok, false, `${bad} breaks the comparison`);
  }
});

// Measured 2026-09-28 by a reader looking at the repository page: the README
// badge said 3.0.0 while the package said 3.3.0, stale across four releases.
// Two guards looked straight at it and neither could see it -- the release guard
// asks whether README.md changed, and it had; the inventory guard reads counts,
// not versions. The question was right at the wrong granularity.
test('the release bumps every version badge it finds, and leaves other versions alone', () => {
  const bump = (text, next) => text.replace(/badge\/version-\d+\.\d+\.\d+-/g, `badge/version-${next}-`);

  assert.strictEqual(
    bump('![Version](https://img.shields.io/badge/version-3.0.0-blue)', '3.3.0'),
    '![Version](https://img.shields.io/badge/version-3.3.0-blue)'
  );
  assert.match(
    bump('badge/version-1.0.0-x badge/version-2.0.0-y', '9.9.9'),
    /9\.9\.9-x.*9\.9\.9-y/,
    'every badge, not just the first'
  );
  const prose = 'v3.1.1 is what users have, and CHANGELOG lists 3.2.0.';
  assert.strictEqual(
    bump(prose, '3.3.0'),
    prose,
    'a version in prose or history is not a badge and must not be rewritten'
  );
});
