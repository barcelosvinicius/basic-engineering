#!/usr/bin/env node
/**
 * Watch a mutation pass from any directory, on any terminal.
 *
 * Two defects in the first version, both already written down elsewhere in this
 * repo and both repeated here anyway:
 *
 *  1. `npm run mutation:watch` ran `cat scripts/.mutation-progress`, a path
 *     relative to the working directory, so it worked only from inside the
 *     repository. A script resolves its paths from ITS OWN location —
 *     test/entrypoints.test.js says exactly that, measured, and this ignored it.
 *
 *  2. A pass that dies leaves its last line frozen, and a frozen line looks
 *     identical to a slow one. That is the same defect as a pass that dies
 *     mid-run reporting green (action plan 10.1b), one level up: the watcher
 *     must be unable to show a dead pass as a running one. So it reports how
 *     long the line has been still, and says STALLED past a threshold.
 *
 *   node scripts/mutation-watch.js          # refresh until Ctrl-C
 *   node scripts/mutation-watch.js --once   # print one reading and exit
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PROGRESS = path.join(__dirname, '.mutation-progress');
const STALL_AFTER_MS = 90000; // three times the 20s the pass writes at
const REFRESH_MS = 2000;

/** What the progress file says right now, and whether it can still be believed. */
function reading(file = PROGRESS, now = Date.now()) {
  let stat;
  let line;
  try {
    stat = fs.statSync(file);
    line = fs.readFileSync(file, 'utf8').trim();
  } catch {
    return { state: 'none', text: 'No pass has run on this machine yet.' };
  }
  if (!line) return { state: 'none', text: 'No pass has run on this machine yet.' };

  const stillFor = now - stat.mtimeMs;
  const complete = /\b(\d+)\/\1 \(100%\)/.test(line);
  if (complete) return { state: 'done', line, stillFor, text: `${line}\n\nFinished.` };
  if (stillFor > STALL_AFTER_MS) {
    return {
      state: 'stalled',
      line,
      stillFor,
      text: `${line}\n\nSTALLED — unchanged for ${Math.round(stillFor / 1000)}s. The pass writes every 20s, so it has most likely stopped.`,
    };
  }
  return {
    state: 'running',
    line,
    stillFor,
    text: `${line}\n\nRunning — last update ${Math.round(stillFor / 1000)}s ago.`,
  };
}

function main(argv = process.argv.slice(2)) {
  const once = argv.includes('--once');
  const render = () => {
    const r = reading();
    if (!once) process.stdout.write('\x1B[2J\x1B[H');
    process.stdout.write(`${r.text}\n`);
    return r;
  };
  if (once) {
    render();
    return 0;
  }
  render();
  const timer = setInterval(render, REFRESH_MS);
  timer.unref?.();
  process.on('SIGINT', () => {
    clearInterval(timer);
    process.stdout.write('\n');
    process.exit(0);
  });
  return 0;
}

if (require.main === module) {
  main();
  // keep alive for the interval; SIGINT is the way out
  if (!process.argv.includes('--once')) setInterval(() => {}, 1 << 30);
}

module.exports = { reading, PROGRESS, STALL_AFTER_MS };
