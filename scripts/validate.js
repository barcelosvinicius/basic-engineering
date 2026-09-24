#!/usr/bin/env node
/**
 * Structural validation for the basic-engineering repository.
 *
 * Checks:
 *  - every plugins/be/skills/<dir> contains SKILL.md
 *  - skill frontmatter: name === directory name, description non-empty and
 *    trigger-oriented (starts with "Use ")
 *  - agents and commands have non-empty name/description frontmatter
 *  - manifests (plugin.json, marketplace.json, base-manifest.json, hooks.json) parse
 *  - semver versions match across package.json, plugin.json, marketplace.json
 *
 * Exits 1 with a list of problems, 0 when clean. No dependencies.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { generate, TARGETS } = require('./gen-capabilities.js');

const ROOT = path.join(__dirname, '..');
const PLUGIN = path.join(ROOT, 'plugins', 'be');
const errors = [];

function fail(msg) {
  errors.push(msg);
}

function readJson(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    fail(`missing file: ${rel}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    fail(`invalid JSON in ${rel}: ${e.message}`);
    return null;
  }
}

/** Minimal YAML frontmatter parser — top-level "key: value" and folded "key: >" blocks. */
function parseFrontmatter(content, rel) {
  if (!content.startsWith('---')) {
    fail(`${rel}: missing YAML frontmatter`);
    return {};
  }
  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    fail(`${rel}: unterminated YAML frontmatter`);
    return {};
  }
  const block = content.slice(3, end).replace(/\r/g, '');
  const result = {};
  let currentKey = null;
  for (const rawLine of block.split('\n')) {
    if (!rawLine.trim()) continue;
    if (/^\s/.test(rawLine)) {
      if (currentKey) result[currentKey] = (result[currentKey] + ' ' + rawLine.trim()).trim();
      continue;
    }
    const m = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    currentKey = m[1];
    let value = m[2].trim();
    if (value === '>' || value === '|' || value === '>-' || value === '|-') value = '';
    result[currentKey] = value.replace(/^["']|["']$/g, '');
  }
  return result;
}

function checkSkills() {
  const skillsDir = path.join(PLUGIN, 'skills');
  if (!fs.existsSync(skillsDir)) {
    fail('missing directory: plugins/be/skills');
    return;
  }
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      fail(`plugins/be/skills/${entry.name}: skills must be directories containing SKILL.md`);
      continue;
    }
    const rel = `plugins/be/skills/${entry.name}/SKILL.md`;
    const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      fail(`${rel}: missing SKILL.md`);
      continue;
    }
    const fm = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'), rel);
    if (fm.name !== entry.name) {
      fail(`${rel}: frontmatter name "${fm.name}" does not match directory name "${entry.name}"`);
    }
    if (!fm.description) {
      fail(`${rel}: frontmatter description is empty`);
    } else if (!/^Use /.test(fm.description)) {
      fail(`${rel}: description must lead with the trigger condition (start with "Use ")`);
    }
  }
}

function checkMarkdownDir(relDir, requiredKeys) {
  const dir = path.join(ROOT, relDir);
  if (!fs.existsSync(dir)) {
    fail(`missing directory: ${relDir}`);
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const rel = `${relDir}/${name}`;
    const fm = parseFrontmatter(fs.readFileSync(path.join(dir, name), 'utf8'), rel);
    for (const key of requiredKeys) {
      if (!fm[key]) fail(`${rel}: frontmatter "${key}" is missing or empty`);
    }
  }
}

function checkVersions() {
  const pkg = readJson('package.json');
  const plugin = readJson('plugins/be/.claude-plugin/plugin.json');
  const marketplace = readJson('.claude-plugin/marketplace.json');
  readJson('base-manifest.json');

  const hooksFile = path.join(PLUGIN, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksFile)) {
    try {
      JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
    } catch (e) {
      fail(`invalid JSON in plugins/be/hooks/hooks.json: ${e.message}`);
    }
  }

  if (pkg && plugin && pkg.version !== plugin.version) {
    fail(`version mismatch: package.json (${pkg.version}) != plugin.json (${plugin.version})`);
  }
  if (pkg && marketplace) {
    const entry = (marketplace.plugins || []).find((p) => p.name === 'be');
    if (!entry) fail('marketplace.json: missing plugin entry "be"');
    else if (entry.version && entry.version !== pkg.version) {
      fail(`version mismatch: package.json (${pkg.version}) != marketplace.json be entry (${entry.version})`);
    }
  }

  const baseVersionFile = path.join(ROOT, 'BASE_VERSION');
  if (!fs.existsSync(baseVersionFile)) {
    fail('missing file: BASE_VERSION');
  } else {
    const v = fs.readFileSync(baseVersionFile, 'utf8').trim();
    if (!/^v\d{8}-\d{6}$/.test(v)) fail(`BASE_VERSION "${v}" does not match vYYYYMMDD-HHMMSS`);
  }
}

/**
 * The LF pin must never leave this repo. Without it, a Windows checkout
 * (core.autocrlf=true) holds CRLF where git, CI, and every other machine hold
 * LF — hook scripts, hashes, and byte-level facts silently diverge (P-08).
 * The installer and /be:bootstrap seed the same line into target projects;
 * this check keeps the repo honest about its own rule.
 */
function checkGitattributes() {
  const file = path.join(ROOT, '.gitattributes');
  if (!fs.existsSync(file)) {
    fail('missing file: .gitattributes — the repo must pin `* text=auto eol=lf`');
    return;
  }
  if (!/^\s*\*\s+text=auto\s+eol=lf/m.test(fs.readFileSync(file, 'utf8'))) {
    fail('.gitattributes does not pin `* text=auto eol=lf`');
  }
}

/** BE-GUIDE.md must stay in sync with the plugin's frontmatter. */
function checkGuide() {
  for (const { lang, file } of TARGETS) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (current.replace(/\r\n/g, '\n') !== generate(lang).replace(/\r\n/g, '\n')) {
      fail(`${path.relative(ROOT, file).replace(/\\/g, '/')} is stale — run \`npm run gen:guide\``);
    }
  }
}

/** Hook scripts referenced in hooks.json must exist; config JSON must be well-formed. */
function checkConfigAndHooks() {
  const hooksFile = path.join(PLUGIN, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksFile)) {
    let raw = '';
    try {
      raw = fs.readFileSync(hooksFile, 'utf8');
      JSON.parse(raw);
    } catch (e) {
      fail(`plugins/be/hooks/hooks.json: invalid JSON (${e.message})`);
      raw = '';
    }
    const re = /\$\{CLAUDE_PLUGIN_ROOT\}\/([A-Za-z0-9_./-]+\.js)/g;
    const seen = new Set();
    let m;
    while ((m = re.exec(raw))) {
      const rel = m[1];
      if (seen.has(rel)) continue;
      seen.add(rel);
      if (!fs.existsSync(path.join(PLUGIN, rel))) {
        fail(`hooks.json references a missing script: ${rel}`);
      }
    }
  }

  const sm = path.join(PLUGIN, 'config', 'stack-mappings.json');
  if (fs.existsSync(sm)) {
    try {
      const d = JSON.parse(fs.readFileSync(sm, 'utf8'));
      if (!Array.isArray(d.stacks)) fail('config/stack-mappings.json: "stacks" must be an array');
      else
        for (const s of d.stacks) {
          if (!s.id || !Array.isArray(s.indicators) || !s.commands) {
            fail(`config/stack-mappings.json: stack "${s.id || '?'}" needs id, indicators[], commands`);
          }
        }
    } catch (e) {
      fail(`config/stack-mappings.json: invalid JSON (${e.message})`);
    }
  }

  const ip = path.join(PLUGIN, 'config', 'install-profiles.json');
  if (fs.existsSync(ip)) {
    try {
      const d = JSON.parse(fs.readFileSync(ip, 'utf8'));
      if (!d.profiles || typeof d.profiles !== 'object')
        fail('config/install-profiles.json: "profiles" object required');
      else if (d.default && !d.profiles[d.default])
        fail(`config/install-profiles.json: default "${d.default}" is not a defined profile`);
    } catch (e) {
      fail(`config/install-profiles.json: invalid JSON (${e.message})`);
    }
  }

  for (const rel of ['mcp.recommended.json', '.be-paths.example.json']) {
    const f = path.join(PLUGIN, rel);
    if (fs.existsSync(f)) {
      try {
        JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch (e) {
        fail(`${rel}: invalid JSON (${e.message})`);
      }
    }
  }
}

/**
 * Every skill and agent must be registered in the session index, and must carry
 * a declared prefix. Both rules already existed in prose (`proc-skill-creator`
 * Step 7; `CLAUDE.md` conventions) and nothing enforced them — the index had
 * drifted 14% and the one unprefixed skill was an undeclared exception.
 * Exercised against planted violations in test/inventory.test.js.
 */
function checkInventory() {
  const inv = require('./lib/inventory.js');
  const skills = inv.listSkills(PLUGIN);
  const agents = inv.listAgents(PLUGIN);

  const indexFile = path.join(PLUGIN, 'skills', 'proc-session-continuity', 'resources.md');
  if (fs.existsSync(indexFile)) {
    const index = fs.readFileSync(indexFile, 'utf8');
    for (const name of inv.missingFromIndex(index, skills.concat(agents))) {
      fail(`"${name}" is not registered in skills/proc-session-continuity/resources.md`);
    }
  } else {
    fail('missing file: plugins/be/skills/proc-session-continuity/resources.md');
  }

  for (const n of inv.badPrefixes(skills, inv.SKILL_PREFIXES)) {
    fail(`skill "${n}": prefix outside ${inv.SKILL_PREFIXES.join(', ')} and not a declared exception`);
  }
  for (const n of inv.badPrefixes(agents, inv.AGENT_PREFIXES)) {
    fail(`agent "${n}": prefix outside ${inv.AGENT_PREFIXES.join(', ')} and not a declared exception`);
  }

  // A backticked name that resolves to nothing: renaming a skill or agent
  // otherwise leaves every prose reference to it pointing at a ghost, silently.
  const known = new Set(skills.concat(agents));
  const docs = [];
  for (const s of skills) docs.push([`skills/${s}/SKILL.md`, path.join(PLUGIN, 'skills', s, 'SKILL.md')]);
  for (const dir of ['agents', 'commands']) {
    const abs = path.join(PLUGIN, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter((x) => x.endsWith('.md'))) {
      docs.push([`${dir}/${f}`, path.join(abs, f)]);
    }
  }
  for (const [rel, abs] of docs) {
    for (const name of inv.danglingRefs(fs.readFileSync(abs, 'utf8'), known)) {
      fail(`${rel}: references "${name}", which is not a skill or agent`);
    }
  }

  // Counts asserted in prose go stale the moment the inventory changes.
  const actual = {
    skills: skills.length,
    agents: agents.length,
    commands: fs.existsSync(path.join(PLUGIN, 'commands'))
      ? fs.readdirSync(path.join(PLUGIN, 'commands')).filter((f) => f.endsWith('.md')).length
      : 0,
  };
  for (const rel of ['README.md', 'CLAUDE.md', 'plugins/be/BOOTSTRAP.md']) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    for (const c of inv.wrongCounts(fs.readFileSync(abs, 'utf8'), actual)) {
      fail(`${rel}: claims ${c.claimed} ${c.kind}, but there are ${c.real}`);
    }
  }

  // The same claim inside a manifest ships to the marketplace and to npm, where
  // it is the first line a user reads — and it drifted there first: both
  // descriptions still said "28 skills" three commits after the 29th landed,
  // because this check only ever read the three documents above.
  // Feed it the description strings, not the raw JSON: a version like "3.0.0"
  // next to the word "skills" must not be read as a count.
  // `package.json`'s description is not decoration: the npm registry serves it,
  // and the session-start update check parses its counts to tell a user what a
  // newer version would give them. A stale count there becomes a wrong promise.
  for (const rel of ['plugins/be/.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'package.json']) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    let json;
    try {
      json = JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch {
      continue; // malformed JSON is already reported by the manifest checks
    }
    for (const text of inv.manifestDescriptions(json)) {
      for (const c of inv.wrongCounts(text, actual)) {
        fail(`${rel}: description claims ${c.claimed} ${c.kind}, but there are ${c.real}`);
      }
    }
  }
}

/**
 * Declared activation edges must point at real skills and must not form a
 * runtime cycle. Only `invoke` edges can recurse; `consult` edges cannot.
 * The detector itself is exercised against planted cycles in test/graph.test.js
 * — a ruler that was never shown to fail is not evidence.
 */
function checkActivationEdges() {
  const edges = require('./lib/edges.js');
  const dir = path.join(PLUGIN, 'skills');
  if (!fs.existsSync(dir)) return;
  const { skills, edges: graph } = edges.collect(dir);

  for (const { from, target } of edges.findUnknownTargets(skills, graph)) {
    fail(`skills/${from}: activation edge points at "${target}", which is not a skill`);
  }
  for (const cycle of edges.findInvokeCycles(graph)) {
    fail(`activation graph: invoke cycle ${cycle.join(' -> ')}`);
  }
}

/**
 * A lockfile must not publish where it was built.
 *
 * Measured 2026-09-24, in the pre-flight of the first push of v3.2.0: adopting a
 * linter generated package-lock.json on a machine behind a corporate registry
 * mirror, and every `resolved` line carried that host's name — 32 of them, in a
 * repository that had just spent a whole phase removing exactly that class of
 * identifier from the tree and from every commit. The scrub was a one-off; this
 * is the guard, so the next `npm install` on any mirrored network cannot put it
 * back without the build saying so. `integrity` is a hash of the tarball, so
 * rewriting the host is safe: same bytes, public address.
 */
function checkLockfileRegistry() {
  const file = path.join(ROOT, 'package-lock.json');
  if (!fs.existsSync(file)) return;
  const bad = new Set();
  const re = /"resolved":\s*"https?:\/\/([^/"]+)\//g;
  let m;
  const text = fs.readFileSync(file, 'utf8');
  while ((m = re.exec(text))) {
    if (!/^(registry\.npmjs\.org|registry\.yarnpkg\.com)$/.test(m[1])) bad.add(m[1]);
  }
  for (const host of bad) {
    fail(`package-lock.json resolves packages from "${host}" — a private mirror must not be published; rewrite the resolved URLs to registry.npmjs.org`);
  }
}

/**
 * This repo wears its own hooks: .claude/settings.json declares the same events
 * as the shipped plugins/be/hooks/hooks.json, rooted at the working tree instead
 * of an installed copy. So a hook being edited is the hook that runs.
 *
 * Two declarations of the same thing is the drift this base exists to remove, so
 * it is a check and not a promise. Written 2026-09-23, after the config-protection
 * rule was fixed here and the fix did not reach this machine: the hook that fired
 * came from the published 3.1.1 in the plugin cache.
 */
function checkSelfHooks() {
  const local = path.join(ROOT, '.claude', 'settings.json');
  const shipped = path.join(PLUGIN, 'hooks', 'hooks.json');
  if (!fs.existsSync(local) || !fs.existsSync(shipped)) return;
  let a;
  let b;
  try {
    a = JSON.parse(fs.readFileSync(local, 'utf8'));
    b = JSON.parse(fs.readFileSync(shipped, 'utf8'));
  } catch (e) {
    return fail(`.claude/settings.json or hooks.json: invalid JSON (${e.message})`);
  }
  const rooted = JSON.parse(JSON.stringify(b).replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, '$CLAUDE_PROJECT_DIR/plugins/be'));
  if (JSON.stringify(a.hooks) !== JSON.stringify(rooted.hooks)) {
    fail(
      '.claude/settings.json no longer matches plugins/be/hooks/hooks.json — this repo would stop running the hooks it ships'
    );
  }
}

checkSkills();
checkMarkdownDir('plugins/be/agents', ['name', 'description']);
checkMarkdownDir('plugins/be/commands', ['description']);
checkVersions();
checkGitattributes();
checkGuide();
checkConfigAndHooks();
checkActivationEdges();
checkInventory();
checkSelfHooks();
checkLockfileRegistry();

if (errors.length) {
  console.error(`validate: ${errors.length} problem(s) found:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('validate: all checks passed');
