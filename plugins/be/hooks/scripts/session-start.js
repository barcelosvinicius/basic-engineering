#!/usr/bin/env node
/**
 * SessionStart hook for the `be` plugin.
 *
 * If the current project keeps a docs/HISTORY.md (session-continuity
 * protocol), emit its "Current State" and "Next Steps" sections (capped) as
 * additional context, plus a one-line protocol reminder. Stay silent when
 * the file does not exist — zero noise in projects that don't use the base.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const MAX_LINES = 40;

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
  const historyPath = path.join(process.cwd(), 'docs', 'HISTORY.md');
  if (!fs.existsSync(historyPath)) process.exit(0);

  const content = fs.readFileSync(historyPath, 'utf8');
  const summary = extractSections(content, ['current state', 'next steps', 'blockers']);

  const context = [
    '[be plugin] Session-continuity protocol active (docs/HISTORY.md found).',
    summary
      ? `Summary from docs/HISTORY.md (truncated to ${MAX_LINES} lines):\n\n${summary}`
      : 'docs/HISTORY.md exists but has no "Current State" / "Next Steps" sections — read it directly.',
    'Reminder: follow the proc-session-continuity skill — /be:session-start to begin, /be:session-end before committing.',
  ].join('\n\n');

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context,
      },
    })
  );
} catch {
  // A hook must never break the session.
}
process.exit(0);
