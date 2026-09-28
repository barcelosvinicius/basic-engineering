'use strict';

/**
 * The watcher, and the two defects its first version had — both already written
 * down in this repo and repeated anyway.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const w = require('../scripts/mutation-watch.js');

// A script resolves its paths from ITS OWN location, not from the working
// directory — test/entrypoints.test.js records that, measured, and the first
// watcher ran `cat scripts/.mutation-progress` anyway, so it worked only from
// inside the repository.
test('the progress path is resolved from the script, not from the working directory', () => {
  assert.ok(path.isAbsolute(w.PROGRESS), 'absolute, so the caller can stand anywhere');
  assert.strictEqual(path.basename(w.PROGRESS), '.mutation-progress');
  assert.strictEqual(path.basename(path.dirname(w.PROGRESS)), 'scripts');
});

test('no file, and an empty file, both read as "nothing has run" — never as a result', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-watch-'));
  assert.strictEqual(w.reading(path.join(dir, 'missing')).state, 'none');
  const empty = path.join(dir, 'empty');
  fs.writeFileSync(empty, '   \n');
  assert.strictEqual(w.reading(empty).state, 'none');
});

// The same defect as a pass that dies mid-run reporting green (10.1b), one level
// up: a dead pass leaves its last line frozen, and a frozen line is
// indistinguishable from a slow one unless the watcher says how long it has
// been still.
test('a line that stopped moving is STALLED, not "running"', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-watch2-'));
  const file = path.join(dir, 'progress');
  fs.writeFileSync(file, '10:00:00  some/target.js  40/181 (22%)  ·  0 survived so far\n');
  const now = fs.statSync(file).mtimeMs;

  const fresh = w.reading(file, now + 5000);
  assert.strictEqual(fresh.state, 'running');
  assert.match(fresh.text, /last update 5s ago/);

  const dead = w.reading(file, now + w.STALL_AFTER_MS + 1000);
  assert.strictEqual(dead.state, 'stalled', 'past the threshold it must not read as running');
  assert.match(dead.text, /STALLED/);
  assert.match(dead.text, /most likely stopped/, 'and it says what that means');
});

test('a finished pass says Finished, and is never called stalled however old it is', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-watch3-'));
  const file = path.join(dir, 'progress');
  fs.writeFileSync(file, '10:00:00  some/target.js  181/181 (100%)  ·  11 survived so far\n');
  const now = fs.statSync(file).mtimeMs;
  assert.strictEqual(w.reading(file, now + 1000).state, 'done');
  const old = w.reading(file, now + w.STALL_AFTER_MS * 100);
  assert.strictEqual(old.state, 'done', 'done is done — age does not turn it into a stall');
  assert.match(old.text, /Finished\./);
});
