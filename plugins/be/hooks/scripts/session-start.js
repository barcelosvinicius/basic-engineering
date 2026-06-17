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
 */
'use strict';

const fs = require('fs');
const path = require('path');

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

try {
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

  if (!parts.length) process.exit(0);

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
} catch {
  // A hook must never break the session.
}
process.exit(0);
