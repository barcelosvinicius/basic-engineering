'use strict';

/**
 * The release's decisions, separated from the commands that gather their inputs.
 *
 * They lived inline in `release.js`, behind the expensive path — validate, the
 * suite, the audits and a mutation pass — so reaching them from a test meant
 * twenty minutes. The result, measured 2026-09-28: `release.js` holds eleven
 * refusal sites and the suite exercised ONE. Among the ten without a case was
 * the README guard, which exists because v3.1.0 and v3.1.1 shipped with a stale
 * README. The guard written to catch a simple oversight had no guard of its own,
 * and breaking it would have restored exactly the failure it was built for.
 *
 * Pure functions here; `release.js` keeps the git calls and the exits.
 */

/**
 * Paths whose change is visible to a README reader. Derived from the incident,
 * not guessed: `be doctor`, the session-start update check and the
 * `.gitattributes` seeding all landed in exactly these, and the README named
 * none of them while `validate.js` stayed green — it checks that what is
 * WRITTEN is true, never that what EXISTS is described.
 */
const USER_FACING = ['plugins/be/commands/', 'plugins/be/hooks/', 'bin/', 'lib/installer.js'];

/**
 * Decide what a release should do about the README.
 *
 * The question a machine can answer is not "does this deserve a README line?"
 * — that is judgment, and a gate that judges becomes noise — but "the surface
 * the README describes changed, and the README did not".
 *
 * @param {object} input
 * @param {string|null} input.lastTag   Previous version tag, '' or null when there is none.
 * @param {string[]|null} input.changed Paths changed since it; null means the diff could not run.
 * @param {string} [input.readmeOk]     The reason given with `--readme-ok=`, if any.
 * @returns {{ verdict: 'skip'|'pass'|'accepted'|'refuse', reason: string, touched?: string[] }}
 */
function readmeVerdict({ lastTag, changed, readmeOk }) {
  if (!lastTag) {
    return { verdict: 'skip', reason: 'no previous version tag — nothing to compare against' };
  }
  // Could not MEASURE. That is not a pass — see the exit-code taxonomy note in
  // docs/lessons-learned.md.
  if (changed === null || changed === undefined) {
    return {
      verdict: 'refuse',
      reason: `could not diff against ${lastTag}; the README guard could not run, and that is not a green`,
    };
  }
  const touched = changed.filter((f) => USER_FACING.some((p) => f.startsWith(p)));
  if (!touched.length) return { verdict: 'pass', reason: 'no user-facing path changed' };
  if (changed.includes('README.md')) return { verdict: 'pass', reason: 'the README changed too' };

  if (readmeOk === undefined) {
    return {
      verdict: 'refuse',
      touched,
      reason:
        `this release changes what users see, and README.md did not change since ${lastTag}:\n` +
        touched.map((f) => `        ${f}`).join('\n') +
        '\n\n  Answer the question before releasing: does a README reader need to know\n' +
        '  something new? Either edit README.md, or record why not with\n' +
        '  `--readme-ok="<reason>"` and put the same line in the CHANGELOG entry.',
    };
  }
  const reason = String(readmeOk).trim();
  if (!reason) {
    return {
      verdict: 'refuse',
      touched,
      reason: '--readme-ok needs a reason: it is the record of why the README stayed as it is',
    };
  }
  return { verdict: 'accepted', touched, reason };
}

/**
 * A release must move the version forward. BASE_VERSION is compared
 * lexicographically, which only works while the format holds.
 *
 * @param {string} current
 * @param {string} next
 * @returns {{ ok: boolean, reason?: string }}
 */
function versionMovesForward(current, next) {
  if (!/^v\d{8}-\d{6}$/.test(next)) {
    return { ok: false, reason: `"${next}" does not match vYYYYMMDD-HHMMSS` };
  }
  if (!(next > current)) {
    return {
      ok: false,
      reason: `"${next}" is not newer than "${current}" — BASE_VERSION is compared lexicographically`,
    };
  }
  return { ok: true };
}

module.exports = { readmeVerdict, versionMovesForward, USER_FACING };
