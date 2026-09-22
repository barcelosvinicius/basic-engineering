'use strict';

/**
 * The distance report is a measurement, so it gets both directions: a project
 * whose numbers must come out non-zero, and its mirror where the same rules
 * must find nothing. Every rule here was written after the first version lied
 * about a real project: it saw 32 of 38 annotations, and it called two
 * documented routes missing because the docs write the external path.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const d = require('../plugins/be/scripts/distance.js');
const mappings = require('../plugins/be/config/stack-mappings.json');
const JAVA = mappings.stacks.find((s) => s.id === 'java-maven').distance;

function project(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'be-distance-'));
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  }
  return root;
}

const controller = (name, body) => `package app;\n@RestController\n@RequestMapping("/${name.toLowerCase()}")\npublic class ${name}Controller {\n${body}\n}\n`;

test('units of work with no test file, and the mirror: one that has it', () => {
  const root = project({
    'pom.xml': '<project/>',
    'src/main/java/app/EventController.java': controller('Evento', '  @GetMapping("/x") void x() {}'),
    'src/main/java/app/UserController.java': controller('User', '  @GetMapping("/y") void y() {}'),
    'src/test/java/app/UserControllerTest.java': 'class UserControllerTest {}',
  });
  const r = d.unitsWithoutTest(root, JAVA);
  assert.deepStrictEqual(r.missing, ['src/main/java/app/EventController.java']);
  assert.strictEqual(r.scanned, 2, 'the denominator is reported');
  assert.strictEqual(r.tests, 1);
});

test('routes: the class prefix composes, constants resolve, and every annotation form is read', () => {
  const root = project({
    'pom.xml': '<project/>',
    'src/main/java/app/JobController.java': `package app;
@RequestMapping("/admin")
public class JobController {
  private static final String PATH_LOGS = "/jobs/{id}/logs";
  @GetMapping("/jobs") void list() {}
  @PostMapping(path = "/jobs", produces = "application/json") void create() {}
  @GetMapping(value = PATH_LOGS) void logs() {}
  @DeleteMapping(
      "/jobs/{id}") void remove() {}
  @GetMapping void root() {}
}
`,
  });
  const routes = d.routesInCode(root, JAVA).map((r) => r.route).sort();
  assert.deepStrictEqual(routes, ['/admin', '/admin/jobs', '/admin/jobs', '/admin/jobs/{id}', '/admin/jobs/{id}/logs']);
});

test('a route no document mentions is reported; the external path and markdown emphasis are not misses', () => {
  const files = {
    'pom.xml': '<project/>',
    'src/main/java/app/AController.java': `package app;
@RequestMapping("/orders")
public class AController {
  @DeleteMapping("/sync/log") void a() {}
  @GetMapping("/alias") void b() {}
  @GetMapping("/hidden") void c() {}
}
`,
    'docs/architecture.md': '| `DELETE /api/v1/orders/sync/log` | AController |\n**GET /orders/alias** — the alias\n',
  };
  const root = project(files);
  const report = d.routesNotDocumented(root, JAVA, d.routesInCode(root, JAVA));
  assert.deepStrictEqual(report.missing.map((r) => r.route), ['/orders/hidden'], 'only the undocumented one');
  assert.strictEqual(report.within, 1, 'the external path counts as documented, and is counted apart');
  assert.strictEqual(report.distinct, 3);
  assert.strictEqual(report.docs, 1, 'the denominator: documents read');
});

test('a project with no stack, and a stack with no distance rules, are NOT MEASURED — never zero', () => {
  const empty = project({ 'README.md': '# x' });
  assert.match(d.measure(empty, mappings).skipped, /no stack detected/);
  const go = project({ 'go.mod': 'module x' });
  assert.match(d.measure(go, mappings).skipped, /declare no distance block/);
  assert.match(d.report(d.measure(empty, mappings)), /NOT MEASURED/);
});

test('the report names the numbers and says it never blocks; main always exits 0', () => {
  const root = project({
    'pom.xml': '<project/>',
    'src/main/java/app/AController.java': controller('A', '  @GetMapping("/x") void x() {}'),
    'docs/a.md': 'nothing here',
  });
  const text = d.report(d.measure(root, mappings));
  assert.match(text, /controllers with no test file \.+ 1 of 1/);
  assert.match(text, /routes no document mentions \.+ 1 of 1/);
  assert.match(text, /never blocks/);
  const { log } = console;
  console.log = () => {};
  try {
    assert.strictEqual(d.main(['--root', root]), 0);
    assert.strictEqual(d.main(['--root', root, '--json']), 0);
  } finally {
    console.log = log;
  }
});

test('this repository: the scanner never walks into node_modules, .git, target or dist', () => {
  const root = project({ 'src/a.java': 'x', 'node_modules/p/b.java': 'x', 'target/c.java': 'x', 'dist/d.java': 'x', '.git/e.java': 'x' });
  assert.deepStrictEqual(d.walk(root, '.', /\.java$/), ['src/a.java']);
});

// ── Guards and edges (added after the first mutation pass: 83 of 124) ────────
// Thinking through one surviving mutant found a real defect: an annotation that
// names only `produces` has no path, and the first-literal rule would have
// published `application/json` as an endpoint.

test('an annotation argument is read only when it is a path', () => {
  assert.deepStrictEqual(d.annotationPath('', {}), { literal: '' });
  assert.deepStrictEqual(d.annotationPath('produces = "application/json"', {}), { literal: '' });
  assert.deepStrictEqual(d.annotationPath('"/x", produces = "application/json"', {}), { literal: '/x' });
  assert.deepStrictEqual(d.annotationPath('path = "/y"', {}), { literal: '/y' });
  assert.deepStrictEqual(d.annotationPath('{ "/a", "/b" }', {}), { literal: '/a' }, 'an array: the first path');
  assert.deepStrictEqual(d.annotationPath('PATH_X', { PATH_X: '/c' }), { literal: '/c' });
  assert.deepStrictEqual(d.annotationPath('Rotas.PATH_X', { PATH_X: '/c' }), { literal: '/c' }, 'qualified constant');
  assert.deepStrictEqual(d.annotationPath('UNKNOWN_PATH', {}), { unresolved: 'UNKNOWN_PATH' });
  assert.strictEqual(d.argsAt('@GetMapping("/x") void m()', 11), '"/x"');
  assert.strictEqual(d.argsAt('@GetMapping("/x"', 11), '', 'an unbalanced argument list reads as none');
  assert.strictEqual(d.argsAt('void m()', 0), '', 'not an argument list at all');
});

test('every reader returns null or empty when its rules are absent — never a made-up number', () => {
  const root = project({ 'pom.xml': '<project/>' });
  assert.deepStrictEqual(d.detectStacks(root, null), []);
  assert.deepStrictEqual(d.detectStacks(root, {}), []);
  assert.deepStrictEqual(d.detectStacks(root, { stacks: [{ id: 'x' }] }), [], 'a stack with no indicators matches nothing');
  for (const rules of [null, {}]) {
    assert.strictEqual(d.unitsWithoutTest(root, rules), null);
    assert.strictEqual(d.routesInCode(root, rules), null);
  }
  assert.strictEqual(d.routesNotDocumented(root, JAVA, null), null);
  assert.strictEqual(d.routesNotDocumented(root, {}, []), null);
});

test('indicators match by exact name or by glob, and the scan stops at 20 levels', () => {
  assert.deepStrictEqual(d.detectStacks(project({ 'App.csproj': '' }), mappings).map((s) => s.id), ['dotnet']);
  assert.deepStrictEqual(d.detectStacks(project({ 'my-pom.xml': '' }), mappings), [], 'an exact indicator is not a suffix');
  const deep = 'a/'.repeat(25) + 'Deep.java';
  const root = project({ 'src/ok.java': 'x', 'src/note.md': 'x', [`src/${deep}`]: 'x' });
  const found = d.walk(root, 'src', /\.java$/);
  assert.ok(found.includes('src/ok.java'));
  assert.ok(!found.some((f) => f.endsWith('note.md')), 'a file that does not match is not collected');
  assert.ok(!found.some((f) => f.endsWith('Deep.java')), 'below 20 levels the walk stops');
});

test('routes: an unresolved constant is reported as such, duplicates count once, and a stack without route rules says NOT MEASURED', () => {
  const root = project({
    'pom.xml': '<project/>',
    'src/main/java/app/BController.java': `package app;
@RequestMapping(produces = "application/json")
public class BController {
  @GetMapping(OUTRO_PATH) void a() {}
  @GetMapping("/dup") void b() {}
  @GetMapping("/dup") void c() {}
  @GetMapping("/exact1") void d() {}
  @GetMapping("/exact2") void e() {}
}
`,
    'docs/a.md': 'cites `/dup`, `/exact1` and `/exact2`, plus /api/v1/deep/only-inside\n',
  });
  const routes = d.routesInCode(root, JAVA);
  assert.deepStrictEqual(routes.filter((r) => r.unresolved).map((r) => r.route), ['OUTRO_PATH']);
  assert.ok(!routes.some((r) => r.route.includes('application/json')), 'produces is not a route');
  const rep = d.routesNotDocumented(root, JAVA, routes);
  assert.strictEqual(rep.distinct, 4, 'five annotations, four distinct routes: the duplicate counts once');
  assert.deepStrictEqual(rep.missing.map((r) => r.route), ['OUTRO_PATH']);
  assert.strictEqual(rep.within, 0, 'two exact mentions are exact, not "within"');

  const node = project({ 'package.json': '{}', 'tsconfig.json': '{}', 'src/a.service.ts': 'x' });
  const text = d.report(d.measure(node, mappings));
  assert.match(text, /NOT MEASURED \(no route rule/);
  assert.match(text, /components and services with no test file/);
});

test('a long list is truncated with a count, and --root defaults to the working directory', () => {
  const files = { 'pom.xml': '<project/>' };
  for (let i = 0; i < 12; i++) files[`src/main/java/app/C${i}Controller.java`] = `package app;\npublic class C${i}Controller {}\n`;
  const root = project(files);
  const text = d.report(d.measure(root, mappings));
  assert.match(text, /controllers with no test file \.+ 12 of 12/);
  assert.match(text, /… 2 more/, 'ten are listed, the rest counted');
  const { log } = console;
  const out = [];
  console.log = (s) => out.push(s);
  try {
    d.main([], root);
  } finally {
    console.log = log;
  }
  assert.match(out.join('\n'), /12 of 12/, 'no --root: the working directory given to main');
});

test('as a CLI it runs and exits 0; requiring the module runs nothing', () => {
  const { spawnSync } = require('child_process');
  const script = path.join(__dirname, '..', 'plugins', 'be', 'scripts', 'distance.js');
  const root = project({ 'pom.xml': '<project/>', 'src/main/java/app/AController.java': 'package app;\npublic class AController {}\n' });
  const run = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
  assert.strictEqual(run.status, 0, run.stderr);
  assert.match(run.stdout, /distance · java-maven/);
  const required = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(script)})`], { encoding: 'utf8' });
  assert.strictEqual(required.stdout, '');
});

test('the class prefix, a bracketed list with no path, and a repeated undocumented route', () => {
  assert.deepStrictEqual(d.annotationPath('{ }', {}), { literal: '' }, 'a list with no path is no path');
  const root = project({
    'pom.xml': '<project/>',
    'src/main/java/app/CController.java': `package app;
@RequestMapping(BASE_UNKNOWN)
public class CController {
  @GetMapping("/same") void a() {}
  @GetMapping("/same") void b() {}
  @GetMapping
      ("/next-line") void c() {}
}
`,
    'docs/a.md': 'nothing\n',
  });
  const routes = d.routesInCode(root, JAVA);
  assert.ok(!routes.some((r) => String(r.route).startsWith('undefined')), 'an unresolved class prefix never becomes "undefined/…"');
  assert.ok(routes.every((r) => r.unresolved), 'a prefix nobody can resolve leaves every route in the file unresolved');
  assert.deepStrictEqual(routes.map((r) => r.route).sort(), ['BASE_UNKNOWN', 'BASE_UNKNOWN/same', 'BASE_UNKNOWN/same'],
    'and an argument that starts on the next line is read as no path, not as "/"');
  const rep = d.routesNotDocumented(root, JAVA, routes);
  assert.strictEqual(rep.missing.filter((r) => r.route === 'BASE_UNKNOWN/same').length, 1, 'a repeated route is reported once');
});

test('the report says NOT MEASURED per missing rule, and truncates each list at ten', () => {
  const many = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const text = d.report({ stacks: [{ id: 'x', units: null, routes: null }] });
  assert.match(text, /units with no test file \.+ NOT MEASURED \(no unit rule/);
  assert.match(text, /routes no document mentions \.+ NOT MEASURED \(no route rule/);
  const full = d.report({ stacks: [{ id: 'x',
    units: { label: 'controllers', scanned: 12, tests: 0, missing: many(12, (i) => `C${i}.java`) },
    routes: { docs: 1, distinct: 12, missing: many(12, (i) => ({ route: `/r${i}`, file: 'f.java' })), within: 0 } }] });
  assert.strictEqual((full.match(/… 2 more/g) || []).length, 2, 'both lists truncate at ten and count the rest');
});

test('a controller with no class annotation, an empty bracketed value, and a list short enough not to truncate', () => {
  assert.deepStrictEqual(d.annotationPath('value = { }', {}), { literal: '' }, 'a bracketed value with no path');
  const root = project({
    'pom.xml': '<project/>',
    'src/main/java/app/FlatController.java': 'package app;\npublic class FlatController {\n  @GetMapping("/flat") void a() {}\n}\n',
  });
  assert.deepStrictEqual(d.routesInCode(root, JAVA).map((r) => r.route), ['/flat'], 'no class annotation: the method path is the route');
  const short = d.report({ stacks: [{ id: 'x',
    units: { label: 'controllers', scanned: 2, tests: 0, missing: ['A.java', 'B.java'] },
    routes: { docs: 1, distinct: 2, missing: [{ route: '/a', file: 'f' }, { route: '/b', file: 'f' }], within: 0 } }] });
  assert.doesNotMatch(short, /more/, 'two items are listed, not truncated');
});
