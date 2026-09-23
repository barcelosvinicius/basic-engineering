'use strict';

/**
 * "Am I the latest `be`?" — asked once per session, answered from the npm
 * registry, and silent about everything else.
 *
 * Why it exists: plugin state is **per machine** and invisible from the
 * repository. One workstation ran v2.0.0 for two months — 25 skills against 29,
 * one hook script against five — so four guardrails simply did not exist, and
 * every session looked normal. Nothing was broken; nothing was running either.
 *
 * Design rules, in order of importance:
 *   1. **Never block, never break.** Any failure — offline, timeout, malformed
 *      JSON, unwritable cache — returns null and says nothing.
 *   2. **Bounded.** One request, 2s timeout, at most one live call per TTL.
 *   3. **Nothing is sent.** A plain GET of a public URL: no identifier, no
 *      project name, no telemetry. Opt out with BE_UPDATE_CHECK=off.
 *   4. **The gain is derived, not written.** The counts come from the published
 *      description compared against what is on disk here, so the notice cannot
 *      drift from reality the way a hand-written "what's new" would.
 *
 * The hook asks nothing itself — hooks have no terminal. It states the facts and
 * asks the assistant to put the question to the user. Declining persists
 * nothing: SessionStart fires once per session, so the next session asks again,
 * and the day the versions match the notice disappears on its own.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REGISTRY_URL = 'https://registry.npmjs.org/@barcelosvinicius/basic-engineering/latest';
const TTL_MS = 24 * 60 * 60 * 1000; // one live call per day, per machine
const TIMEOUT_MS = 2000;

function enabled(env = process.env) {
  const off = (v) => String(v || '').toLowerCase() === 'off';
  return !off(env.BE_HOOKS) && !off(env.BE_UPDATE_CHECK);
}

function cacheFile(env = process.env) {
  const dir = env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return path.join(dir, 'be-update-check.json');
}

/** Cached answer while it is younger than `ttl`, else null. */
function readCache(file, now = Date.now(), ttl = TTL_MS) {
  try {
    const c = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!c || typeof c.checkedAt !== 'number') return null;
    return now - c.checkedAt < ttl ? c : null;
  } catch {
    return null;
  }
}

function writeCache(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data));
  } catch {
    // an unwritable cache costs one request per session, not a broken session
  }
}

/** GET the registry's `latest` metadata. Resolves null on any failure. */
function fetchLatest(url = REGISTRY_URL, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    try {
      const https = require('node:https');
      const req = https.get(
        url,
        { headers: { accept: 'application/vnd.npm.install-v1+json, application/json' } },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            return finish(null);
          }
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (d) => {
            body += d;
            if (body.length > 512 * 1024) req.destroy(); // never read unbounded
          });
          res.on('end', () => {
            try {
              const j = JSON.parse(body);
              finish(j && j.version ? { version: j.version, description: j.description || '' } : null);
            } catch {
              finish(null);
            }
          });
        }
      );
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        finish(null);
      });
      req.on('error', () => finish(null));
    } catch {
      finish(null);
    }
  });
}

/** Counts a published description asserts, e.g. "29 skills, 18 agents". */
function parseCounts(text) {
  const out = {};
  for (const m of String(text || '').matchAll(/\b(\d{1,3})\s+(skills|agents|commands)\b/g)) {
    out[m[2]] = Number(m[1]);
  }
  return out;
}

/** What is actually on disk in an installed plugin copy. */
function localCounts(pluginRoot) {
  const count = (dir, filter) => {
    try {
      return fs.readdirSync(path.join(pluginRoot, dir)).filter(filter).length;
    } catch {
      return null;
    }
  };
  const skills = count('skills', (d) => fs.existsSync(path.join(pluginRoot, 'skills', d, 'SKILL.md')));
  const agents = count('agents', (f) => f.endsWith('.md'));
  const commands = count('commands', (f) => f.endsWith('.md'));
  let hookEvents = [];
  try {
    const m = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'hooks', 'hooks.json'), 'utf8'));
    hookEvents = Object.keys(m.hooks || {});
  } catch {
    hookEvents = [];
  }
  return { skills, agents, commands, hookEvents };
}

/** Semver compare limited to what versions here look like. Non-numeric -> unequal. */
function isNewer(latest, installed) {
  const p = (v) =>
    String(v || '')
      .split('.')
      .map((n) => parseInt(n, 10));
  const [a, b] = [p(latest), p(installed)];
  if (a.some(Number.isNaN) || b.some(Number.isNaN)) return latest !== installed;
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

/**
 * The notice, or null when there is nothing to say. Every number in it is
 * either read from disk or from the published description — never written here.
 */
function buildNotice({ installedVersion, latest, local }) {
  if (!latest || !installedVersion || !isNewer(latest.version, installedVersion)) return null;

  const published = parseCounts(latest.description);
  const gains = [];
  for (const kind of ['skills', 'agents', 'commands']) {
    const have = local && local[kind];
    const there = published[kind];
    if (typeof have === 'number' && typeof there === 'number' && there > have) {
      gains.push(`+${there - have} ${kind}`);
    }
  }

  const lines = [
    `[be plugin] A newer version of the base is published: **${installedVersion} → ${latest.version}** ` +
      'on this machine. Plugin state is per machine — another machine being current says nothing about this one.',
  ];
  if (gains.length) lines.push(`What you gain here: ${gains.join(', ')}.`);
  if (local && Array.isArray(local.hookEvents)) {
    lines.push(
      local.hookEvents.length
        ? `Your installed copy runs ${local.hookEvents.length} hook event(s): ${local.hookEvents.join(', ')}.`
        : 'Your installed copy declares no hooks, so none of the guardrails are running.'
    );
  }
  lines.push(
    'Ask the user whether to update now or stay on this version. To update: ' +
      '`/plugin update be@basic-engineering` (Claude Code plugin — only the user can run a slash command), ' +
      'or `npx @barcelosvinicius/basic-engineering update` for a project installed under `.be/`. ' +
      'If they decline, drop it for this session — this will be asked again next session, ' +
      'and stops once the versions match. Run `be doctor` for the full per-machine picture.'
  );
  return lines.join('\n');
}

/**
 * The whole check. `fetchImpl` is injectable so tests never touch the network.
 * Returns the notice text, or null when there is nothing to say.
 */
async function check(opts = {}) {
  const {
    env = process.env,
    pluginRoot = env.CLAUDE_PLUGIN_ROOT,
    installedVersion = null,
    now = Date.now(),
    fetchImpl = fetchLatest,
    ttl = TTL_MS,
  } = opts;

  try {
    if (!enabled(env) || !pluginRoot || !installedVersion) return null;

    const file = opts.cacheFile || cacheFile(env);
    let latest = readCache(file, now, ttl);
    if (!latest) {
      const fetched = await fetchImpl();
      if (!fetched) return null;
      latest = { checkedAt: now, version: fetched.version, description: fetched.description };
      writeCache(file, latest);
    }

    return buildNotice({ installedVersion, latest, local: localCounts(pluginRoot) });
  } catch {
    return null; // a version check must never be the reason a session fails
  }
}

module.exports = {
  REGISTRY_URL,
  TTL_MS,
  enabled,
  cacheFile,
  readCache,
  writeCache,
  fetchLatest,
  parseCounts,
  localCounts,
  isNewer,
  buildNotice,
  check,
};
