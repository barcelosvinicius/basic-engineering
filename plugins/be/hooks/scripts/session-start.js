#!/usr/bin/env node
/**
 * SessionStart hook for the `be` plugin.
 *
 * Emits the "Current State" / "Next Steps" of the project's session-history
 * file as additional context, plus a one-line protocol reminder. Stays silent
 * when no history file exists — zero noise in projects that don't use the base.
 *
 * Path resolution is project-aware: an optional `.be-paths.json` at the project
 * root maps logical doc keys to this project's real paths (so PT projects using
 * `docs/HISTORICO.md` work as well as EN `docs/HISTORY.md`). Missing keys fall
 * back to the English defaults, then to common PT names.
 *
 * It also reports declared `companions` — repositories this one is changed
 * together with. The protocol says to close every repo the session touched, and
 * a rule with nothing mechanical behind it is the reason a sibling's
 * lessons-learned once sat 65 commits behind while the active repo's was
 * current. Reporting only; it never blocks and never writes.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const state = require('./_state.js');

const MAX_LINES = 40;

/** Resolve a logical doc key to an existing file: .be-paths.json → fallbacks. */
function resolveDocPath(cwd, key, fallbacks) {
  try {
    const mapFile = path.join(cwd, '.be-paths.json');
    if (fs.existsSync(mapFile)) {
      const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
      const mapped = map && map[key];
      if (mapped) {
        const abs = path.isAbsolute(mapped) ? mapped : path.join(cwd, mapped);
        if (fs.existsSync(abs)) return abs;
      }
    }
  } catch {
    // ignore a malformed map and fall through to defaults
  }
  for (const rel of fallbacks) {
    const abs = path.join(cwd, rel);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function extractSections(content, headings) {
  const lines = content.split(/\r?\n/);
  const out = [];
  let capturing = false;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const title = heading[2].trim().toLowerCase();
      capturing = headings.some((h) => title.includes(h));
    }
    if (capturing) out.push(line);
    if (out.length >= MAX_LINES) break;
  }
  return out.join('\n').trim();
}

/** Read the declared companion repositories, if any. */
function companions(cwd) {
  try {
    const mapFile = path.join(cwd, '.be-paths.json');
    if (!fs.existsSync(mapFile)) return [];
    const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
    return Array.isArray(map && map.companions) ? map.companions : [];
  } catch {
    return [];
  }
}

function git(dir, args) {
  return execSync(`git ${args}`, {
    cwd: dir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 5000,
  }).trim();
}

/**
 * One line per companion: how long since it was last committed to, and whether
 * it has uncommitted work. Best-effort — an unreachable or non-git path is
 * skipped silently rather than turning a session start into an error.
 */
function companionStatus(cwd) {
  const out = [];
  for (const rel of companions(cwd)) {
    const dir = path.isAbsolute(rel) ? rel : path.join(cwd, rel);
    if (!fs.existsSync(path.join(dir, '.git'))) continue;
    try {
      const last = git(dir, 'log -1 --format=%cr');
      const dirty = git(dir, 'status --porcelain').length > 0;
      out.push(
        `[be plugin] Companion repo ${rel}: last commit ${last}` +
          (dirty ? ', has uncommitted changes' : '') +
          '. The session close runs there too.'
      );
    } catch {
      // unreachable or not a repo — say nothing
    }
  }
  return out;
}

/**
 * Is the installed copy the latest published one? Bounded, cached, silent on
 * failure, and opt-out via BE_UPDATE_CHECK=off. Returns a notice or null.
 * Kept behind its own try/catch: a version check must never be the reason a
 * session fails to start.
 */
async function updateNotice(pluginRoot) {
  try {
    const check = require('./_update-check.js').check;
    const manifest = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
    const installedVersion = JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
    return await check({ pluginRoot, installedVersion });
  } catch {
    return null;
  }
}

async function main() {
  const cwd = process.cwd();
  const parts = [];

  // First run in this project: drop the capabilities guide at the project root
  // so the base is discoverable and actually gets used. Create once; never
  // overwrite. The user is told what was created and why.
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (pluginRoot) {
    const srcGuide = path.join(pluginRoot, 'BE-GUIDE.md');
    const destGuide = path.join(cwd, 'BE-GUIDE.md');
    if (fs.existsSync(srcGuide) && !fs.existsSync(destGuide)) {
      try {
        fs.copyFileSync(srcGuide, destGuide);
        parts.push(
          '[be plugin] First run here — created BE-GUIDE.md at the project root so you can see ' +
            'and use everything the base offers (commands, agents, skills, playbooks, guardrails). ' +
            'Why: a one-glance map makes the base get used instead of forgotten. A Portuguese ' +
            'version (BE-GUIDE.pt.md) is available too — run /be:help to view it. ' +
            'Please tell the user this briefly.'
        );
      } catch {
        // best-effort — never block the session
      }
    }
  }

  // Companion repositories: the close is supposed to run in each of them.
  // Surfaced here so it is a fact on screen rather than something to remember.
  for (const line of companionStatus(cwd)) parts.push(line);

  // Session-continuity summary, if the project keeps a history doc.
  const historyPath = resolveDocPath(cwd, 'history', [
    path.join('docs', 'HISTORY.md'),
    path.join('docs', 'HISTORICO.md'),
  ]);
  if (historyPath) {
    const rel = path.relative(cwd, historyPath).replace(/\\/g, '/');
    const content = fs.readFileSync(historyPath, 'utf8');
    const summary = extractSections(content, [
      'current state',
      'estado atual',
      'next steps',
      'próximos passos',
      'proximos passos',
      'blockers',
      'bloqueios',
    ]);
    parts.push(`[be plugin] Session-continuity protocol active (${rel} found).`);
    parts.push(
      summary
        ? `Summary from ${rel} (truncated to ${MAX_LINES} lines):\n\n${summary}`
        : `${rel} exists but has no recognizable state sections — read it directly.`
    );
  }

  // What the previous session ended with, if it ended with code changed and the
  // living docs untouched. Written by the SessionEnd hook, read once, cleared —
  // so the note cannot linger and become noise.
  const carry = state.readCarry(cwd);
  if (carry && carry.note) {
    parts.push(
      `[be] Carried from the last session (${String(carry.at).slice(0, 16).replace('T', ' ')}): ${carry.note}.`
    );
    state.clearCarry(cwd);
  }

  // Is this machine running the latest base? Asked once per session; the answer
  // is cached for a day, so this costs one bounded request per machine per day.
  if (pluginRoot) {
    const notice = await updateNotice(pluginRoot);
    if (notice) parts.push(notice);
  }

  if (!parts.length) return;

  parts.push(
    'Reminder: follow the proc-session-continuity skill — /be:session-start to begin, /be:session-end before committing.'
  );

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: parts.join('\n\n'),
      },
    })
  );
}

main()
  .catch(() => {
    // A hook must never break the session.
  })
  .finally(() => process.exit(0));
