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

const fs = require('fs');
const path = require('path');
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
    try { raw = fs.readFileSync(hooksFile, 'utf8'); JSON.parse(raw); } catch (e) {
      fail(`plugins/be/hooks/hooks.json: invalid JSON (${e.message})`); raw = '';
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
      else for (const s of d.stacks) {
        if (!s.id || !Array.isArray(s.indicators) || !s.commands) {
          fail(`config/stack-mappings.json: stack "${s.id || '?'}" needs id, indicators[], commands`);
        }
      }
    } catch (e) { fail(`config/stack-mappings.json: invalid JSON (${e.message})`); }
  }

  const ip = path.join(PLUGIN, 'config', 'install-profiles.json');
  if (fs.existsSync(ip)) {
    try {
      const d = JSON.parse(fs.readFileSync(ip, 'utf8'));
      if (!d.profiles || typeof d.profiles !== 'object') fail('config/install-profiles.json: "profiles" object required');
      else if (d.default && !d.profiles[d.default]) fail(`config/install-profiles.json: default "${d.default}" is not a defined profile`);
    } catch (e) { fail(`config/install-profiles.json: invalid JSON (${e.message})`); }
  }

  for (const rel of ['mcp.recommended.json', '.be-paths.example.json']) {
    const f = path.join(PLUGIN, rel);
    if (fs.existsSync(f)) {
      try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fail(`${rel}: invalid JSON (${e.message})`); }
    }
  }
}

checkSkills();
checkMarkdownDir('plugins/be/agents', ['name', 'description']);
checkMarkdownDir('plugins/be/commands', ['description']);
checkVersions();
checkGuide();
checkConfigAndHooks();

if (errors.length) {
  console.error(`validate: ${errors.length} problem(s) found:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('validate: all checks passed');
