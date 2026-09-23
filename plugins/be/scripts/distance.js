#!/usr/bin/env node
'use strict';
/**
 * The distance between what the project says of itself and what it is.
 *
 * `/be:check` runs build, types, lint, tests, security and diff — all of which
 * answer "does the change work?". Two things no suite answers, measured in a
 * real project: **9 endpoints existed with zero mention in the documentation**,
 * and **6 of 8 controllers had no test class at all** — found only because
 * somebody did a manual audit, which nobody repeats.
 *
 * So this reports two numbers, per run:
 *   - units of work (controllers, or the stack's equivalent) with no test file;
 *   - routes declared in code that no document mentions.
 *
 * REPORT, NEVER BLOCK. Blocking on pre-existing debt makes a gate unusable, and
 * an unusable gate is switched off the next week. It always exits 0.
 *
 * A stack with no `distance` block in config/stack-mappings.json is reported as
 * NOT MEASURED, with the reason — never as a zero. A zero without a denominator
 * is not a result.
 *
 * Usage:
 *   node distance.js [--root <dir>] [--json]
 */

const fs = require('node:fs');
const path = require('node:path');
const { loadMappings, detectStacks } = require('./_stacks.js');

/** Files under `dir` (relative to root) whose relative path matches `re`. */
function walk(root, dir, re, out = [], depth = 0) {
  const abs = path.join(root, dir);
  let entries;
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'target' || e.name === 'dist') continue;
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (depth < 20) walk(root, rel, re, out, depth + 1);
    } else if (re.test(rel.split(path.sep).join('/'))) {
      out.push(rel.split(path.sep).join('/'));
    }
  }
  return out;
}

const baseName = (f) => path.basename(f).replace(/\.[^.]+$/, '');

/** Units of work with no test file naming them. */
function unitsWithoutTest(root, d) {
  if (!d || !d.unit) return null;
  const u = d.unit;
  const units = walk(root, u.dir, new RegExp(u.match));
  const tests = walk(root, u.testDir || u.dir, new RegExp(u.testMatch));
  const testNames = tests.map((t) => path.basename(t));
  const missing = units.filter((f) => !testNames.some((t) => t.includes(baseName(f))));
  return { label: u.label || 'units', scanned: units.length, tests: tests.length, missing };
}

/** The argument list of the annotation starting at `open`, by balanced parens. */
function argsAt(text, open) {
  if (text[open] !== '(') return '';
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')' && --depth === 0) return text.slice(open + 1, i);
  }
  return '';
}

/**
 * The path an annotation declares: a `value =`/`path =` argument, else the
 * first string literal, else a constant to resolve, else none (the route is
 * then the class prefix alone). The data says WHICH annotation; reading the
 * argument is code, because the forms are many: `path =`, `produces` first,
 * several lines, no argument at all. Measured on a real project: a
 * first-argument regex saw 32 of its 38 annotations.
 */
function annotationPath(args, constants) {
  if (!args.trim()) return { literal: '' };
  const named = args.match(/\b(?:value|path)\s*=\s*("[^"]+"|\{[^}]*\}|[A-Za-z_][A-Za-z0-9_.]*)/);
  // Only a POSITIONAL first argument is a path. `@GetMapping(produces = "…")`
  // names no path — its route is the class prefix — and taking the first
  // literal there would have published `application/json` as an endpoint.
  if (!named && /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/.test(args)) return { literal: '' };
  const token = named
    ? named[1]
    : (args.match(/"[^"]*"/) || args.match(/^\s*([A-Za-z_][A-Za-z0-9_.]*)\s*(?:,|$)/) || [])[0];
  if (!token) return { literal: '' };
  const first = token.trim().startsWith('{') ? (token.match(/"[^"]*"/) || [''])[0] : token.trim();
  if (!first) return { literal: '' }; // `value = { }` lists no path at all
  if (first.startsWith('"')) return { literal: first.slice(1, -1) };
  const name = first.replace(/^.*\./, '');
  return constants[name] !== undefined ? { literal: constants[name] } : { unresolved: first };
}

/**
 * Routes declared in code, composed from the class-level prefix and the method
 * annotation, with constants resolved — the literal alone is not the route.
 */
function routesInCode(root, d) {
  if (!d || !d.route) return null;
  const annotation = new RegExp(d.route.annotation + '\\s*(?=\\(|\\s|$)', 'g');
  const isClass = new RegExp(d.route.classAnnotation || '$^');
  const files = walk(root, d.route.dir, new RegExp(d.route.match));
  const routes = [];
  for (const rel of files) {
    let text;
    try {
      text = fs.readFileSync(path.join(root, rel), 'utf8');
    } catch {
      continue;
    }
    const constants = {};
    for (const m of text.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"]+)"/g)) constants[m[1]] = m[2];
    const found = [...text.matchAll(annotation)].map((m) => {
      const open = text.indexOf('(', m.index);
      const sameLine = open >= 0 && !text.slice(m.index, open).includes('\n');
      return { name: m[0].trim(), ...annotationPath(sameLine ? argsAt(text, open) : '', constants) };
    });
    if (!found.length) continue;
    const classAt = found.findIndex((f) => isClass.test(f.name));
    // A prefix nobody can resolve makes every route in the file unresolved —
    // saying "/" there would invent an endpoint out of a constant we cannot read.
    const unresolvedPrefix = classAt >= 0 ? found[classAt].unresolved : undefined;
    const prefix = classAt >= 0 && found[classAt].literal !== undefined ? found[classAt].literal : '';
    const methods = found.filter((_, i) => i !== classAt);
    const list = methods.length ? methods : [found[classAt]];
    for (const f of list) {
      if (f.unresolved) {
        routes.push({ file: rel, route: f.unresolved, unresolved: true });
        continue;
      }
      if (unresolvedPrefix) {
        routes.push({ file: rel, route: unresolvedPrefix + (f.literal || ''), unresolved: true });
        continue;
      }
      const full = (prefix + (f.literal || '')).replace(/\/{2,}/g, '/') || '/';
      routes.push({ file: rel, route: full, unresolved: false });
    }
  }
  return routes;
}

/**
 * Routes no document mentions. The route must appear as a token, not as part of
 * a longer path: `/jobs` inside `/jobs/{id}/logs` documents the second, not the
 * first — a plain substring test reported every route as documented.
 */
function routesNotDocumented(root, d, routes) {
  if (!routes || !d.docs) return null;
  const docs = walk(root, d.docs.dir, new RegExp(d.docs.match));
  let text = '';
  for (const rel of docs) {
    try {
      text += fs.readFileSync(path.join(root, rel), 'utf8') + '\n';
    } catch {
      /* unreadable doc */
    }
  }
  // Markdown wraps a route in emphasis, backticks or angle brackets, so those
  // are boundaries too — a class that ignored them called two documented routes
  // missing. And the docs write the EXTERNAL path (`/api/v1/orders/sync/log`)
  // while the code declares the internal one (`/orders/sync/log`): the prefix
  // comes from the deployment, so no reader of the code can compose it. A route
  // documented as the end of a longer path counts as documented — and is
  // counted apart, because `/jobs` also ends `/admin/jobs`, and only a person
  // can say whether that is the same endpoint.
  const AFTER = '[\\s"\'`)\\]|,.;:?!*_<>]|$';
  const mentions = (route) => {
    const esc = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|[\\s"'\`(\\[|=*_<>])${esc}(${AFTER})`, 'm').test(text)) return 'exact';
    return new RegExp(`${esc}(${AFTER})`, 'm').test(text) ? 'within' : false;
  };
  const seen = new Set();
  const missing = [];
  let within = 0;
  for (const r of routes) {
    if (seen.has(r.route)) continue;
    seen.add(r.route);
    const how = mentions(r.route);
    if (!how) missing.push(r);
    else if (how === 'within') within++;
  }
  return { docs: docs.length, distinct: seen.size, missing, within };
}

function measure(root, mappings) {
  const stacks = detectStacks(root, mappings);
  if (!stacks.length) return { skipped: 'no stack detected at the project root' };
  const withDistance = stacks.filter((s) => s.distance);
  if (!withDistance.length)
    return { skipped: `detected ${stacks.map((s) => s.id).join(', ')}, which declare no distance block`, stacks };
  return {
    stacks: withDistance.map((s) => {
      const routes = routesInCode(root, s.distance);
      return {
        id: s.id,
        units: unitsWithoutTest(root, s.distance),
        routes: routes && routesNotDocumented(root, s.distance, routes),
        routeCount: routes ? routes.length : null,
      };
    }),
  };
}

function report(result) {
  const lines = [];
  if (result.skipped) {
    lines.push(`distance: NOT MEASURED — ${result.skipped}`);
    return lines.join('\n');
  }
  for (const s of result.stacks) {
    lines.push(`distance · ${s.id}`);
    if (s.units) {
      lines.push(
        `  ${s.units.label} with no test file ....... ${s.units.missing.length} of ${s.units.scanned}   (${s.units.tests} test files seen)`
      );
      for (const f of s.units.missing.slice(0, 10)) lines.push(`      ${f}`);
      if (s.units.missing.length > 10) lines.push(`      … ${s.units.missing.length - 10} more`);
    } else lines.push('  units with no test file ............. NOT MEASURED (no unit rule for this stack)');
    if (s.routes) {
      lines.push(
        `  routes no document mentions ......... ${s.routes.missing.length} of ${s.routes.distinct}   (${s.routes.docs} documents read${s.routes.within ? `, ${s.routes.within} found only inside a longer path` : ''})`
      );
      for (const r of s.routes.missing.slice(0, 10))
        lines.push(`      ${r.route}${r.unresolved ? '' : ''}   ← ${r.file}`);
      if (s.routes.missing.length > 10) lines.push(`      … ${s.routes.missing.length - 10} more`);
    } else lines.push('  routes no document mentions ......... NOT MEASURED (no route rule for this stack)');
  }
  lines.push('This phase reports; it never blocks. Each line is a distance to decide on, not a failure.');
  return lines.join('\n');
}

function main(argv, cwd = process.cwd()) {
  const at = argv.indexOf('--root');
  const root = path.resolve(at >= 0 ? argv[at + 1] : cwd);
  const result = measure(root, loadMappings());
  console.log(argv.includes('--json') ? JSON.stringify(result, null, 2) : report(result));
  return 0; // report-only, always
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = {
  measure,
  report,
  unitsWithoutTest,
  routesInCode,
  routesNotDocumented,
  detectStacks,
  walk,
  argsAt,
  annotationPath,
  main,
};
