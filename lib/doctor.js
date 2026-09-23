'use strict';

/**
 * Environment diagnosis for the `be` base.
 *
 * Why this exists: the base is operated from more than one machine — a Windows
 * workstation, a Linux box with WSL, and CI on ubuntu-latest — and three pieces
 * of state are **per machine**, invisible from the repository:
 *
 *   1. Which version of the Claude Code plugin is installed. One machine ran
 *      v2.0.0 for two months while the repo shipped 3.0.0: 25 skills instead of
 *      29, and one hook script instead of five. Nothing said so.
 *   2. Whether the guardrail hooks are actually present. Hooks are fail-open by
 *      design — correct, and the reason a total outage looks exactly like a
 *      quiet session.
 *   3. Whether the checkout normalises line endings, which decides whether a
 *      byte count measured here reproduces in CI.
 *
 * A base that can be entirely absent without saying so is a base you cannot
 * trust to be present. This module answers "is it actually working here?" by
 * reading the filesystem — no shell, so the answer is the same on every
 * platform.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/** Claude Code's config directory, honouring CLAUDE_CONFIG_DIR. */
function configDir(env = process.env) {
  return env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch {
    return null;
  }
}

/**
 * Every install of this plugin Claude Code knows about on this machine.
 * Matches on the plugin name (`be@<marketplace>`), not the marketplace, so a
 * fork or a renamed marketplace is still reported instead of silently missing.
 */
function installedPlugins(dir, pluginName = 'be') {
  const data = readJson(path.join(dir, 'plugins', 'installed_plugins.json'));
  const all = (data && data.plugins) || {};
  const out = [];
  for (const [key, entries] of Object.entries(all)) {
    if (key.split('@')[0] !== pluginName) continue;
    for (const e of entries || []) {
      out.push({
        key,
        version: e.version || '(unknown)',
        installPath: e.installPath || '',
        installedAt: (e.installedAt || '').slice(0, 10),
        scope: e.scope || '',
      });
    }
  }
  return out;
}

/**
 * Which hook events an installed copy declares, and which of the scripts those
 * commands point at are actually on disk. A declared event whose script is
 * missing is the failure this was written to catch: the plugin loads, its
 * skills and commands work, and the guardrails silently do not exist.
 */
function hookHealth(pluginRoot) {
  const manifest = readJson(path.join(pluginRoot, 'hooks', 'hooks.json'));
  if (!manifest || !manifest.hooks) return { declared: [], scripts: [], missing: [] };

  const declared = Object.keys(manifest.hooks);
  const scripts = new Set();
  for (const groups of Object.values(manifest.hooks)) {
    for (const group of groups || []) {
      for (const hook of (group && group.hooks) || []) {
        const cmd = String((hook && hook.command) || '');
        // ${CLAUDE_PLUGIN_ROOT} is substituted by Claude Code, not by a shell;
        // resolve it against the copy we are inspecting.
        for (const m of cmd.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}([^"'\s]+)/g)) {
          scripts.add(m[1].replace(/^[/\\]+/, ''));
        }
      }
    }
  }
  const list = [...scripts];
  return {
    declared,
    scripts: list,
    missing: list.filter((rel) => !fs.existsSync(path.join(pluginRoot, rel))),
  };
}

/** Numeric semver comparison; a non-numeric version is only "newer" if different. */
function newerSemver(a, b) {
  const p = (v) =>
    String(v || '')
      .split('.')
      .map((n) => parseInt(n, 10));
  const [x, y] = [p(a), p(b)];
  if (x.some(Number.isNaN) || y.some(Number.isNaN)) return a !== b;
  for (let i = 0; i < 3; i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
}

/** How this checkout treats line endings — the difference between here and CI. */
function eolHygiene(repoRoot) {
  const attrs = path.join(repoRoot, '.gitattributes');
  if (!fs.existsSync(attrs)) return { normalised: false, reason: 'no .gitattributes' };
  const text = fs.readFileSync(attrs, 'utf8');
  return /^\s*\*\s+text=auto\s+eol=lf/m.test(text)
    ? { normalised: true, reason: '* text=auto eol=lf' }
    : { normalised: false, reason: '.gitattributes present but does not pin eol=lf' };
}

/**
 * Collect facts and findings. A *finding* is something the reader should act on;
 * facts are context. Never throws — a diagnosis that crashes diagnoses nothing.
 */
function diagnose(opts = {}) {
  const { cwd = process.cwd(), env = process.env, packageVersion = '(unknown)', pluginVersion = null } = opts;

  const dir = opts.configDir || configDir(env);
  const facts = [];
  const findings = [];

  facts.push(['Platform', `${process.platform} · node ${process.version}`]);
  facts.push(['Claude config', dir]);
  facts.push(['Package BASE_VERSION', packageVersion]);

  // What npm currently serves, when the caller looked it up. `doctor` is an
  // explicit request, so it checks live rather than reading the cache the
  // session-start hook keeps.
  if (opts.latestPublished && opts.latestPublished.version) {
    const latest = opts.latestPublished.version;
    facts.push(['Latest published (npm)', latest]);
    if (pluginVersion && newerSemver(latest, pluginVersion)) {
      findings.push(
        `npm publishes ${latest} while this checkout is ${pluginVersion} — ` +
          'this working copy is behind the published base'
      );
    }
  }

  // 1) npm-installed base in the target project
  const installedBase = path.join(cwd, '.be', 'BASE_VERSION');
  if (fs.existsSync(installedBase)) {
    const v = fs.readFileSync(installedBase, 'utf8').trim().replace(/^﻿/, '');
    facts.push(['Project .be/', v]);
    if (v < packageVersion) {
      findings.push(`project .be/ is ${v}, package ships ${packageVersion} — run \`be update\``);
    }
  } else {
    facts.push(['Project .be/', 'not installed (fine for Claude Code plugin users)']);
  }

  // 2) Claude Code plugin installs on THIS machine
  const installs = installedPlugins(dir);
  if (!installs.length) {
    facts.push(['Claude Code plugin', 'not installed on this machine']);
  }
  for (const p of installs) {
    facts.push([`Plugin ${p.key}`, `${p.version} · installed ${p.installedAt} · ${p.scope}`]);

    if (pluginVersion && p.version !== pluginVersion) {
      findings.push(
        `${p.key} is ${p.version} on this machine while this repo ships ${pluginVersion} — ` +
          'run `/plugin update be@basic-engineering`. Plugin state is per machine: another ' +
          'machine being up to date says nothing about this one.'
      );
    }

    if (p.installPath && fs.existsSync(p.installPath)) {
      const h = hookHealth(p.installPath);
      facts.push([
        '  hooks declared',
        h.declared.length ? `${h.declared.join(', ')} (${h.scripts.length} script(s))` : 'none',
      ]);
      if (h.missing.length) {
        findings.push(
          `${p.key} declares hooks whose scripts are absent: ${h.missing.join(', ')} — ` +
            'hooks fail open, so these guardrails are silently not running'
        );
      }
      // Which guardrails this machine does not have. The version number alone
      // does not say *what* is missing, and "missing" here means a hook that
      // never runs — indistinguishable, from the inside, from a quiet session.
      if (opts.repoPluginRoot) {
        const ours = hookHealth(opts.repoPluginRoot);
        const absent = ours.declared.filter((e) => !h.declared.includes(e));
        if (absent.length) {
          findings.push(
            `${p.key} does not run these hook events on this machine: ${absent.join(', ')} ` +
              `(this repo declares ${ours.declared.length}, the installed copy ${h.declared.length})`
          );
        }
      }
    } else if (p.installPath) {
      findings.push(`${p.key} install path does not exist: ${p.installPath}`);
    }
  }

  // 3) Line-ending normalisation of this checkout
  if (fs.existsSync(path.join(cwd, '.git'))) {
    const eol = eolHygiene(cwd);
    facts.push(['Line endings', eol.normalised ? `normalised (${eol.reason})` : eol.reason]);
    if (!eol.normalised) {
      findings.push(
        'this checkout does not pin eol=lf, so byte-level measurements taken here ' +
          'will not reproduce in CI — add `* text=auto eol=lf` to .gitattributes'
      );
    }
  }

  return { facts, findings };
}

module.exports = { configDir, installedPlugins, hookHealth, eolHygiene, diagnose };
