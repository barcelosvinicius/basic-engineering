'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const lib = require('../plugins/be/hooks/scripts/_lib.js');
const { generate, TARGETS } = require('../scripts/gen-capabilities.js');
const fs = require('fs');

test('detectSecrets flags high-confidence secrets', () => {
  assert.ok(
    lib.detectSecrets('token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij12"').includes('GitHub token')
  );
  assert.ok(lib.detectSecrets('export K=AKIA1234567890ABCDEF').includes('AWS access key id'));
  assert.ok(lib.detectSecrets('-----BEGIN RSA PRIVATE KEY-----').includes('private key'));
  assert.ok(lib.detectSecrets('password = "hunter2secret"').includes('hardcoded credential'));
});

test('detectSecrets skips placeholders and clean text', () => {
  assert.deepStrictEqual(lib.detectSecrets('apiKey = "YOUR_API_KEY_HERE"'), []);
  assert.deepStrictEqual(lib.detectSecrets('const key = process.env.API_KEY'), []);
  assert.deepStrictEqual(lib.detectSecrets('AKIAIOSFODNN7EXAMPLE'), []); // canonical AWS example
  assert.deepStrictEqual(lib.detectSecrets('const total = price * 1.08'), []);
});

test('isProtectedConfig matches linter/formatter configs only', () => {
  assert.ok(lib.isProtectedConfig('eslint.config.js'));
  assert.ok(lib.isProtectedConfig('/repo/biome.json'));
  assert.ok(lib.isProtectedConfig('C:\\repo\\.prettierrc'));
  assert.ok(!lib.isProtectedConfig('src/app.ts'));
  assert.ok(!lib.isProtectedConfig('package.json'));
});

test('isNoVerify catches hook-bypass forms', () => {
  assert.ok(lib.isNoVerify('git commit --no-verify -m x'));
  assert.ok(lib.isNoVerify('git commit -n -m x'));
  assert.ok(lib.isNoVerify('git push --no-verify'));
  assert.ok(lib.isNoVerify('cd /repo && git commit --no-verify'));
  assert.ok(lib.isNoVerify('HUSKY=0 git commit --no-verify'));
  assert.ok(!lib.isNoVerify('npm test'));
  assert.ok(!lib.isNoVerify('git commit -m "fix: bug"'));
});

// The first version of this rule tested the whole command string, so a command
// that only MENTIONED the flag was blocked. It surfaced by refusing to write
// this repo's own analysis of the rule (2026-09-20). The cases below are that
// defect, pinned: a gate that stops legitimate work is what teaches people to
// turn gates off.
test('isNoVerify ignores commands that only mention the flag', () => {
  const flag = '--no' + '-verify';
  assert.ok(!lib.isNoVerify(`echo "the ${flag} flag exists"`));
  assert.ok(!lib.isNoVerify(`cat > doc.md <<EOF\nuse ${flag} to skip\nEOF`));
  assert.ok(!lib.isNoVerify(`grep -r "${flag}" docs/`));
  assert.ok(!lib.isNoVerify(`git commit -m "document the ${flag} rule"`));
  // and the true positive still fires when it is an actual git invocation
  assert.ok(lib.isNoVerify(`git commit ${flag} -m x`));
});

// Added after the first mutation pass (2026-09-22): 8 surviving mutants of
// _lib.js were inputs no test sent — no id, a non-string, an empty command, a
// path that is missing or not a directory. A guard that throws on odd input
// fails open without a word, which is the silent outage this base warns about.
test('guard helpers hold on odd input: no id, non-string text, empty command, missing path', () => {
  const saved = process.env.BE_HOOKS;
  delete process.env.BE_HOOKS;
  try {
    assert.strictEqual(lib.hooksDisabled(), false, 'no id reads only the global switch, without throwing');
  } finally {
    if (saved !== undefined) process.env.BE_HOOKS = saved;
  }
  assert.deepStrictEqual(lib.detectSecrets(null), []);
  assert.deepStrictEqual(lib.detectSecrets(12345), []);
  assert.strictEqual(lib.isNoVerify(''), false);
  assert.strictEqual(lib.isNoVerify(undefined), false);
  assert.strictEqual(lib.pathExists(__filename), true);
  assert.strictEqual(lib.pathExists(__filename + '.missing'), false, 'ENOENT means absent');
  assert.strictEqual(lib.pathExists(require('path').join(__filename, 'child')), true, 'any other error (ENOTDIR) is treated as present');
});

test('hooksDisabled honors global and per-hook opt-out', () => {
  delete process.env.BE_HOOKS;
  delete process.env.BE_HOOK_SECRET_SCAN;
  assert.ok(!lib.hooksDisabled('secret-scan'));

  process.env.BE_HOOKS = 'off';
  assert.ok(lib.hooksDisabled('secret-scan'));
  delete process.env.BE_HOOKS;

  process.env.BE_HOOK_SECRET_SCAN = 'off';
  assert.ok(lib.hooksDisabled('secret-scan'));
  assert.ok(!lib.hooksDisabled('no-verify'));
  delete process.env.BE_HOOK_SECRET_SCAN;
});

test('generated guides (EN + PT) are in sync with the plugin frontmatter', () => {
  for (const { lang, file } of TARGETS) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    assert.strictEqual(
      current.replace(/\r\n/g, '\n'),
      generate(lang).replace(/\r\n/g, '\n'),
      `${require('path').basename(file)} is stale — run \`npm run gen:guide\``
    );
  }
});

test('gateguard modes: narrow by default, all when opted in, off when disabled', () => {
  const gate = require('../plugins/be/hooks/scripts/_gateguard.js');
  const saved = process.env.BE_GATEGUARD;
  try {
    delete process.env.BE_GATEGUARD;
    assert.strictEqual(gate.mode(), 'narrow');
    for (const v of ['on', 'all', '1', 'true']) { process.env.BE_GATEGUARD = v; assert.strictEqual(gate.mode(), 'all', v); }
    for (const v of ['off', '0', 'false', 'no']) { process.env.BE_GATEGUARD = v; assert.strictEqual(gate.mode(), 'off', v); assert.ok(!gate.enabled()); }
  } finally {
    if (saved === undefined) delete process.env.BE_GATEGUARD; else process.env.BE_GATEGUARD = saved;
  }
});

test('gateguard narrow: high-impact classes gate, their nearest neighbours do not', () => {
  const gate = require('../plugins/be/hooks/scripts/_gateguard.js');
  const gated = {
    'src/main/resources/db/migration/V3__add_col.sql': 'schema or migration',
    'db/changelog/changelog-master.xml': 'schema or migration',
    'src/main/java/br/app/config/SecurityConfig.java': 'security or auth',
    'src/app/auth/jwt.interceptor.ts': 'security or auth',
    'src/main/java/br/app/AuthorizationFilter.java': 'security or auth',
    'api/openapi.yaml': 'API contract',
    'proto/user.proto': 'API contract',
    'pom.xml': 'build or dependency manifest',
    'frontend/package.json': 'build or dependency manifest',
    '.github/workflows/ci.yml': 'CI or deploy pipeline',
    'Jenkinsfile': 'CI or deploy pipeline',
  };
  for (const [p, cls] of Object.entries(gated)) assert.strictEqual(gate.riskClass(p), cls, p);
  const free = [
    'src/app/user/user.component.ts',                 // ordinary code
    'src/main/java/br/app/AuthorService.java',        // author is not auth
    'src/test/java/br/app/SecurityConfigTest.java',   // a test of a gated file
    'docs/security.md',                               // documentation
    'package-lock.json',                              // generated
    'README.md',
  ];
  for (const p of free) assert.strictEqual(gate.riskClass(p), null, p);
});

test('gateguard narrow gates only an existing file; all gates every file; off gates none', () => {
  const gate = require('../plugins/be/hooks/scripts/_gateguard.js');
  const saved = process.env.BE_GATEGUARD;
  try {
    delete process.env.BE_GATEGUARD;
    assert.strictEqual(gate.shouldGate('pom.xml', true), true);
    assert.strictEqual(gate.shouldGate('pom.xml', false), false, 'creating a file is never gated in narrow mode');
    assert.strictEqual(gate.shouldGate('src/app/user.ts', true), false);
    process.env.BE_GATEGUARD = 'all';
    assert.strictEqual(gate.shouldGate('src/app/user.ts', false), true);
    process.env.BE_GATEGUARD = 'off';
    assert.strictEqual(gate.shouldGate('pom.xml', true), false);
    assert.strictEqual(gate.shouldGate('', true), false);
  } finally {
    if (saved === undefined) delete process.env.BE_GATEGUARD; else process.env.BE_GATEGUARD = saved;
  }
});

test('the PreToolUse hook, run as Claude Code runs it: gates once, logs it, and judges the path relative to the project', () => {
  const os = require('os');
  const path = require('path');
  const { spawnSync } = require('child_process');
  const hook = path.join(__dirname, '..', 'plugins', 'be', 'hooks', 'scripts', 'pre-tooluse.js');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'be-pretool-'));
  const project = path.join(base, 'auth-service'); // a repo NAME that looks high-impact
  const logDir = path.join(base, 'log');
  const put = (rel) => { const f = path.join(project, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, 'x\n'); return f; };
  const security = put('src/main/java/app/SecurityConfig.java');
  const ordinary = put('src/app/user.ts');
  const pom = put('pom.xml');
  const session = 'hooktest-' + Math.random().toString(36).slice(2);
  const run = (tool, file, extraEnv = {}) => {
    const env = { ...process.env, BE_HOOK_LOG_DIR: logDir, ...extraEnv };
    delete env.BE_HOOKS; if (!('BE_GATEGUARD' in extraEnv)) delete env.BE_GATEGUARD;
    const input = JSON.stringify({ session_id: session, cwd: project, tool_name: tool, tool_input: { file_path: file } });
    return spawnSync(process.execPath, [hook], { input, env, encoding: 'utf8' });
  };

  const first = run('Edit', security);
  assert.strictEqual(first.status, 2, 'the first edit of an existing security file is gated');
  assert.match(first.stderr, /fact-forcing gate — before the first edit of SecurityConfig\.java \(security or auth\)/);
  assert.strictEqual(run('Edit', security).status, 0, 'once per file per session');
  assert.strictEqual(run('Edit', ordinary).status, 0, 'ordinary code is not gated — even inside a repo named auth-service');
  assert.strictEqual(run('Write', path.join(project, 'src/main/java/app/NewSecurityConfig.java')).status, 0, 'creating a file is not gated — even in a gated class');
  assert.strictEqual(run('Edit', pom, { BE_GATEGUARD: 'off' }).status, 0, 'off disables it');

  const lines = fs.readFileSync(path.join(logDir, `${session}.jsonl`), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((l) => l.kind === 'gate');
  assert.strictEqual(lines.length, 1, 'exactly one interruption recorded');
  assert.deepStrictEqual({ kind: lines[0].kind, file: lines[0].file, class: lines[0].class }, { kind: 'gate', file: path.join('src', 'main', 'java', 'app', 'SecurityConfig.java'), class: 'security or auth' });
});

// ── The dispatcher end to end (added after the mutation pass of 2026-09-22) ──
// pre-tooluse.js killed 27 of 69 mutants: only the gate path had a test. Every
// block below had never been executed by a test — a wrong condition in any of
// them would have switched a guard off without a word.

const SECRET = 'ghp_' + 'A'.repeat(36); // assembled so this file holds no literal token

function runPreTool(tool, toolInput, extraEnv = {}) {
  const os = require('os');
  const path = require('path');
  const { spawnSync } = require('child_process');
  const hook = path.join(__dirname, '..', 'plugins', 'be', 'hooks', 'scripts', 'pre-tooluse.js');
  const env = { ...process.env, BE_HOOK_LOG_DIR: path.join(os.tmpdir(), 'be-hooktest-log'), BE_GATEGUARD: 'off', ...extraEnv };
  for (const k of Object.keys(env)) if (/^BE_HOOKS?(_|$)/.test(k) && !(k in extraEnv)) delete env[k];
  const input = JSON.stringify({ session_id: 'disp-' + Math.random().toString(36).slice(2), cwd: os.tmpdir(), tool_name: tool, tool_input: toolInput });
  return spawnSync(process.execPath, [hook], { input, env, encoding: 'utf8' });
}

test('dispatcher, Bash: the bypass flag and a secret block; each opt-out and an ordinary command pass', () => {
  const bypass = ['git commit', '--no-' + 'verify', '-m x'].join(' ');
  assert.strictEqual(runPreTool('Bash', { command: bypass }).status, 2);
  assert.match(runPreTool('Bash', { command: bypass }).stderr, /bypasses commit\/push hooks/);
  assert.strictEqual(runPreTool('Bash', { command: `curl -H "Authorization: token ${SECRET}"` }).status, 2);
  assert.strictEqual(runPreTool('Bash', { command: 'npm test' }).status, 0);
  assert.strictEqual(runPreTool('Bash', {}).status, 0, 'a Bash call with no command passes');
  assert.strictEqual(runPreTool('Bash', { command: bypass }, { BE_HOOK_NO_VERIFY: 'off' }).status, 0);
  assert.strictEqual(runPreTool('Bash', { command: `echo ${SECRET}` }, { BE_HOOK_SECRET_SCAN: 'off' }).status, 0);
  assert.strictEqual(runPreTool('Bash', { command: bypass }, { BE_HOOKS: 'off' }).status, 0, 'the global switch turns every guard off');
});

test('dispatcher, Write/Edit/MultiEdit: config protection and secrets block; safe paths, new configs and other tools pass', () => {
  const os = require('os');
  const path = require('path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-disp-'));
  const eslint = path.join(dir, '.eslintrc.json');
  fs.writeFileSync(eslint, '{}');
  const src = path.join(dir, 'app.js');

  assert.strictEqual(runPreTool('Edit', { file_path: eslint }).status, 2, 'weakening an existing linter config');
  assert.match(runPreTool('Edit', { file_path: eslint }).stderr, /linter\/formatter config/);
  assert.strictEqual(runPreTool('Write', { file_path: path.join(dir, 'new', '.eslintrc.json') }).status, 0, 'creating a config is allowed');
  assert.strictEqual(runPreTool('Edit', { file_path: eslint }, { BE_HOOK_CONFIG_PROTECTION: 'off' }).status, 0);

  assert.strictEqual(runPreTool('Write', { file_path: src, content: `const t = "${SECRET}";` }).status, 2, 'secret in Write content');
  assert.strictEqual(runPreTool('Edit', { file_path: src, new_string: `const t = "${SECRET}";` }).status, 2, 'secret in Edit new_string');
  assert.strictEqual(runPreTool('MultiEdit', { file_path: src, edits: [{ new_string: 'ok' }, { new_string: `k = "${SECRET}"` }] }).status, 2, 'secret in any MultiEdit edit');
  assert.match(runPreTool('Edit', { file_path: src, new_string: SECRET }).stderr, /possible hardcoded secret in app\.js/);
  assert.match(runPreTool('Write', { content: SECRET }).stderr, /possible hardcoded secret in content/, 'no path: named as content');
  assert.strictEqual(runPreTool('Write', { file_path: path.join(dir, 'tests', 'fixture.js'), content: SECRET }).status, 0, 'a test fixture may hold one');
  assert.strictEqual(runPreTool('Edit', { file_path: src, new_string: 'const ok = 1;' }).status, 0);
  assert.strictEqual(runPreTool('MultiEdit', { file_path: src, edits: [null, { new_string: 'ok' }] }).status, 0, 'a malformed edit entry is skipped');
  assert.strictEqual(runPreTool('MultiEdit', { file_path: src, edits: [null, { new_string: SECRET }] }).status, 2, '…and does not hide a secret after it');
  assert.strictEqual(runPreTool('Edit', { path: eslint }).status, 2, 'a tool input that names the file as path');
  assert.strictEqual(runPreTool('Read', { file_path: eslint }).status, 0, 'other tools are not inspected');
});

test('dispatcher, MultiEdit: the gate finds the file in edits[0] when file_path is absent', () => {
  const os = require('os');
  const path = require('path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-disp-me-'));
  const pom = path.join(dir, 'pom.xml');
  fs.writeFileSync(pom, '<project/>');
  const r = runPreTool('MultiEdit', { edits: [{ file_path: pom, new_string: 'x' }] }, { BE_GATEGUARD: 'narrow' });
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /before the first edit of pom\.xml \(build or dependency manifest\)/);
  assert.strictEqual(runPreTool('Edit', { file_path: pom }, { BE_GATEGUARD: 'narrow', BE_HOOK_GATEGUARD: 'off' }).status, 0, 'per-hook opt-out');
});

test('logEvent writes one JSON line and reports failure instead of throwing; projectRelative keeps outside paths', () => {
  const os = require('os');
  const path = require('path');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'be-log-'));
  const saved = process.env.BE_HOOK_LOG_DIR;
  try {
    process.env.BE_HOOK_LOG_DIR = path.join(base, 'nested', 'deeper');
    assert.strictEqual(lib.logEvent({ session_id: 's1' }, { kind: 'gate' }), true, 'creates a nested log dir');
    const line = JSON.parse(fs.readFileSync(path.join(base, 'nested', 'deeper', 's1.jsonl'), 'utf8'));
    assert.strictEqual(line.kind, 'gate');
    assert.strictEqual(line.cwd, process.cwd(), 'no cwd in the input: the process cwd');
    const blocker = path.join(base, 'a-file');
    fs.writeFileSync(blocker, 'x');
    process.env.BE_HOOK_LOG_DIR = path.join(blocker, 'sub');
    assert.strictEqual(lib.logEvent({ session_id: 's1' }, { kind: 'gate' }), false, 'an unwritable log dir is a false, not a throw');
  } finally {
    if (saved === undefined) delete process.env.BE_HOOK_LOG_DIR; else process.env.BE_HOOK_LOG_DIR = saved;
  }
  assert.strictEqual(lib.projectRelative('/proj/src/a.ts', '/proj'), path.join('src', 'a.ts'));
  assert.strictEqual(lib.projectRelative('/other/a.ts', '/proj'), '/other/a.ts', 'outside the project: unchanged');
  assert.strictEqual(lib.projectRelative('/proj', '/proj'), '/proj', 'the project root itself: unchanged');
  assert.strictEqual(lib.projectRelative('', '/proj'), '');
  assert.strictEqual(lib.projectRelative('/proj/a.ts', ''), '/proj/a.ts', 'no cwd: unchanged');
  const here = path.join(process.cwd(), 'a.ts');
  assert.strictEqual(lib.projectRelative(here, ''), here, 'no cwd: unchanged even inside the process cwd');
});

test('gateguard session key follows session_id, then transcript_path, then the environment', () => {
  const gate = require('../plugins/be/hooks/scripts/_gateguard.js');
  const a = gate.sessionKey({ session_id: 'A' });
  assert.notStrictEqual(a, gate.sessionKey({ session_id: 'B' }));
  assert.strictEqual(gate.sessionKey({ transcript_path: '/t/1' }), gate.sessionKey({ transcript_path: '/t/1' }));
  assert.notStrictEqual(gate.sessionKey({ transcript_path: '/t/1' }), gate.sessionKey({ transcript_path: '/t/2' }));
  const saved = { c: process.env.CLAUDE_SESSION_ID, b: process.env.BE_SESSION_ID };
  try {
    process.env.CLAUDE_SESSION_ID = 'env-1'; delete process.env.BE_SESSION_ID;
    const fromClaude = gate.sessionKey({});
    process.env.CLAUDE_SESSION_ID = 'env-2';
    assert.notStrictEqual(gate.sessionKey({}), fromClaude, 'CLAUDE_SESSION_ID is read');
    delete process.env.CLAUDE_SESSION_ID; process.env.BE_SESSION_ID = 'be-1';
    const fromBe = gate.sessionKey(null);
    process.env.BE_SESSION_ID = 'be-2';
    assert.notStrictEqual(gate.sessionKey(null), fromBe, 'BE_SESSION_ID is read');
  } finally {
    for (const [k, v] of [['CLAUDE_SESSION_ID', saved.c], ['BE_SESSION_ID', saved.b]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

test('gateguard state: a corrupt, malformed or expired state file starts clean, and an unwritable one fails open', () => {
  const os = require('os');
  const path = require('path');
  const { spawnSync } = require('child_process');
  const gate = require('../plugins/be/hooks/scripts/_gateguard.js');
  const stateDir = path.join(os.tmpdir(), 'be-gateguard');
  const data = { session_id: 'state-' + Math.random().toString(36).slice(2) };
  const file = path.join(stateDir, `state-${gate.sessionKey(data)}.json`);
  fs.mkdirSync(stateDir, { recursive: true });
  for (const bad of ['not json', 'null', JSON.stringify({ checked: '/a', ts: Date.now() }), JSON.stringify({ checked: ['/a'], ts: 1 })]) {
    fs.writeFileSync(file, bad);
    assert.strictEqual(gate.isChecked(data, '/a'), false, `starts clean from: ${bad}`);
  }
  fs.writeFileSync(file, JSON.stringify({ checked: ['/a'], ts: Date.now() }));
  assert.strictEqual(gate.isChecked(data, '/a'), true, 'a fresh, well-formed state is kept');
  // An unwritable temp dir: markChecked reports false, so the dispatcher never blocks in a loop.
  const tmpAsFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'be-tmpfile-')), 'file');
  fs.writeFileSync(tmpAsFile, 'x');
  const r = spawnSync(process.execPath, ['-e', `process.stdout.write(String(require(${JSON.stringify(require.resolve('../plugins/be/hooks/scripts/_gateguard.js'))}).markChecked({session_id:'x'}, '/a')))`], { env: { ...process.env, TMPDIR: tmpAsFile, TMP: tmpAsFile, TEMP: tmpAsFile }, encoding: 'utf8' });
  assert.strictEqual(r.stdout, 'false');
});

// ── 8.2: gestures that carry a rule, and the stack map with a trigger ──────────

test('gestures are read from the commands a line runs — never from text that mentions them', () => {
  const runs = {
    "sed -i 's/a/b/' src/x.ts": 'sed in place',
    "sed -E -i.bak 's/a/b/' f": 'sed in place',
    "sed --in-place 's/a/b/' f": 'sed in place',
    "cd docs && sed -i 's/5\\.6/5.5/' plan.md": 'sed in place',
    "perl -pi -e 's/a/b/' f": 'perl in place',
    'git mv old.ts new.ts': 'git mv',
    "find . -name '*.md' -exec sed -i 's/a/b/' {} +": 'find -exec rewrite',
    "LC_ALL=C sed -i 's/a/b/' f": 'sed in place',
  };
  for (const [cmd, g] of Object.entries(runs)) assert.strictEqual(lib.bulkGesture(cmd), g, cmd);
  for (const cmd of ["sed -n '1,5p' f", "sed 's/a/b/' f > g", 'echo "use sed -i carefully"', 'grep "git mv" notes.md', 'npm test', '']) {
    assert.strictEqual(lib.bulkGesture(cmd), null, cmd);
  }
  assert.strictEqual(lib.removalGesture('git rm src/old.js'), 'git rm');
  assert.strictEqual(lib.removalGesture('git add . && git rm -r --cached build'), 'git rm');
  for (const cmd of ['git remote -v', 'echo "git rm is permanent"', 'rm -rf /tmp/x', '']) assert.strictEqual(lib.removalGesture(cmd), null, cmd);
  assert.deepStrictEqual(lib.commandSegments('a && b "c ; d" ; e'), ['a', 'b ""', 'e']);
  assert.strictEqual(lib.bulkGesture('echo "a; sed -i x"'), null, 'a separator inside quotes does not start a command');
  // An unpaired apostrophe is literal, so it cannot hide the command after it —
  // the security guard reads the same segments.
  const flag = '--no' + '-verify';
  assert.deepStrictEqual(lib.commandSegments(`echo don't && git commit ${flag}`), ["echo don't", `git commit ${flag}`]);
  assert.ok(lib.isNoVerify(`echo don't && git commit ${flag}`));
  assert.ok(lib.isNoVerify(`git commit -m "a \\" b" && git commit ${flag}`), 'an escaped quote inside "…" does not end it');
  assert.strictEqual(lib.bulkGesture('echo "a \\" ; sed -i x"'), null, '…so the separator after it is still quoted');
  for (const sep of ['; ', ' | ', ' & ', '\n']) assert.strictEqual(lib.removalGesture(`true${sep}git rm x`), 'git rm', JSON.stringify(sep));
});

test('removedLines nets old against new over every edit; isCodeFile is for source, not docs', () => {
  const lines = (n) => Array.from({ length: n }, (_, i) => `l${i}`).join('\n');
  assert.strictEqual(lib.removedLines({ old_string: lines(20), new_string: lines(2) }), 18);
  assert.strictEqual(lib.removedLines({ edits: [{ old_string: lines(10), new_string: lines(1) }, null, { old_string: lines(8), new_string: lines(2) }] }), 15);
  assert.strictEqual(lib.removedLines({ content: lines(50) }), 0, 'a Write removes nothing by this measure');
  assert.strictEqual(lib.removedLines(null), 0);
  for (const f of ['A.java', 'x.ts', 'y.py', 'z.sql']) assert.ok(lib.isCodeFile(f), f);
  for (const f of ['README.md', 'pom.xml', 'a.json', '']) assert.ok(!lib.isCodeFile(f), f);
});

test('detectStacks reads the indicators at the project root, globs included', () => {
  const os = require('os');
  const path = require('path');
  const mappings = require('../plugins/be/config/stack-mappings.json');
  const mk = (files) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'be-stack-')); for (const f of files) fs.writeFileSync(path.join(d, f), ''); return d; };
  assert.deepStrictEqual(lib.detectStacks(mk(['pom.xml']), mappings).map((s) => s.id), ['java-maven']);
  assert.deepStrictEqual(lib.detectStacks(mk(['App.csproj']), mappings).map((s) => s.id), ['dotnet'], 'a *.csproj glob');
  assert.deepStrictEqual(lib.detectStacks(mk(['README.md']), mappings), []);
  assert.deepStrictEqual(lib.detectStacks(mk(['my-pom.xml']), mappings), [], 'a plain indicator is an exact name, not a suffix');
  assert.deepStrictEqual(lib.detectStacks('', mappings), []);
  assert.deepStrictEqual(lib.detectStacks(mk(['pom.xml']), null), []);
  assert.deepStrictEqual(lib.detectStacks(path.join(os.tmpdir(), 'does-not-exist-be'), { stacks: [{ id: 'x', indicators: ['*.csproj'] }] }), [], 'an unreadable root is no stack');
});

test('reminders, run as Claude Code runs the hook: once per kind per session, logged, never a block', () => {
  const os = require('os');
  const path = require('path');
  const { spawnSync } = require('child_process');
  const hook = path.join(__dirname, '..', 'plugins', 'be', 'hooks', 'scripts', 'pre-tooluse.js');
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'be-remind-'));
  fs.writeFileSync(path.join(project, 'pom.xml'), '<project/>');
  const logDir = path.join(project, '.log');
  const session = 'remind-' + Math.random().toString(36).slice(2);
  const at = (tool, toolInput, extraEnv = {}, sid = session) => {
    const env = { ...process.env, BE_HOOK_LOG_DIR: logDir, BE_GATEGUARD: 'off', ...extraEnv };
    for (const k of Object.keys(env)) if (/^BE_HOOKS?_(?!LOG_DIR)|^BE_HOOKS$/.test(k) && !(k in extraEnv)) delete env[k];
    const r = spawnSync(process.execPath, [hook], { input: JSON.stringify({ session_id: sid, cwd: project, tool_name: tool, tool_input: toolInput }), env, encoding: 'utf8' });
    assert.strictEqual(r.status, 0, 'a reminder never blocks');
    return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : '';
  };
  const code = path.join(project, 'src', 'App.java');

  assert.match(at('Edit', { file_path: code, old_string: 'a', new_string: 'b' }), /stack detected: java-maven — .*be-db-migrations/);
  assert.strictEqual(at('Edit', { file_path: code, old_string: 'a', new_string: 'b' }), '', 'the stack reminder comes once');
  assert.strictEqual(at('Edit', { file_path: path.join(project, 'README.md'), old_string: 'a', new_string: 'b' }), '');
  assert.match(at('Bash', { command: "sed -i 's/5.6/5.5/' docs/plan.md" }), /bulk rewrite \(sed in place\): run it on text already at rest/);
  assert.strictEqual(at('Bash', { command: 'git mv a.md b.md' }), '', 'the lot reminder comes once, whatever the gesture');
  assert.strictEqual(at('Bash', { command: 'echo "git rm"' }), '', 'a mention is not a gesture');
  const block = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n');
  assert.match(at('Edit', { file_path: code, old_string: block, new_string: '' }), /removing code \(20 lines in one edit\): clear proc-safe-removal/);
  assert.strictEqual(at('Bash', { command: 'git rm src/Old.java' }), '', 'the removal reminder comes once');
  assert.strictEqual(at('Bash', { command: 'git rm x' }, { BE_HOOK_REMINDERS: 'off' }, 'optout-' + Math.random().toString(36).slice(2)), '', 'opt-out');

  const log = fs.readFileSync(path.join(logDir, `${session}.jsonl`), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepStrictEqual(log.map((l) => `${l.kind}:${l.rule}`), ['reminder:stack', 'reminder:lot', 'reminder:removal']);
});

test('reminders: each fires on its own gesture only — fresh sessions, one trigger at a time', () => {
  const os = require('os');
  const path = require('path');
  const { spawnSync } = require('child_process');
  const hook = path.join(__dirname, '..', 'plugins', 'be', 'hooks', 'scripts', 'pre-tooluse.js');
  const withPom = fs.mkdtempSync(path.join(os.tmpdir(), 'be-remind2-'));
  fs.writeFileSync(path.join(withPom, 'pom.xml'), '<project/>');
  const noStack = fs.mkdtempSync(path.join(os.tmpdir(), 'be-remind3-'));
  const at = (project, tool, toolInput) => {
    const env = { ...process.env, BE_HOOK_LOG_DIR: path.join(project, '.log'), BE_GATEGUARD: 'off' };
    for (const k of Object.keys(env)) if (/^BE_HOOKS?_(?!LOG_DIR)|^BE_HOOKS$/.test(k)) delete env[k];
    const sid = 'fresh-' + Math.random().toString(36).slice(2);
    const r = spawnSync(process.execPath, [hook], { input: JSON.stringify({ session_id: sid, cwd: project, tool_name: tool, tool_input: toolInput }), env, encoding: 'utf8' });
    return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : '';
  };
  assert.strictEqual(at(withPom, 'Bash', { command: 'npm test' }), '', 'an ordinary command carries no rule');
  assert.match(at(withPom, 'Bash', { command: 'git rm src/Old.java' }), /removing code \(git rm\)/);
  assert.strictEqual(at(withPom, 'Edit', { file_path: path.join(withPom, 'README.md'), old_string: 'a', new_string: 'b' }), '', 'docs do not get the stack reminder');
  assert.match(at(withPom, 'MultiEdit', { edits: [{ file_path: path.join(withPom, 'App.java'), old_string: 'a', new_string: 'b' }] }), /stack detected: java-maven/, 'the file can come from edits[0]');
  assert.strictEqual(at(noStack, 'Edit', { file_path: path.join(noStack, 'App.java'), old_string: 'a', new_string: 'b' }), '', 'no indicator, no stack reminder');
});

test('gateguard remembers checked files per session', () => {
  const gate = require('../plugins/be/hooks/scripts/_gateguard.js');
  const data = { session_id: 'test-' + Math.random().toString(36).slice(2) };

  assert.ok(!gate.isChecked(data, '/x/app.ts'), 'unseen file not checked');
  assert.ok(gate.markChecked(data, '/x/app.ts'), 'marks checked');
  assert.ok(gate.isChecked(data, '/x/app.ts'), 'remembers checked file');
  assert.ok(!gate.isChecked(data, '/x/other.ts'), 'other file still unchecked');
});

// ── companion repositories (session-start) ─────────────────────────────────
// The close is supposed to run in every repo the session touched. These pin the
// fail-open behaviour: a companion that cannot be read must never turn a session
// start into an error.

const os = require('os');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

function projectWith(mapJson) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'be-comp-'));
  fs.mkdirSync(path.join(root, 'main', 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'main', 'docs', 'HISTORY.md'), '# H\n\n## Current State\nwork\n');
  if (mapJson !== null) fs.writeFileSync(path.join(root, 'main', '.be-paths.json'), mapJson);
  return root;
}

function runHook(cwd) {
  const script = path.join(__dirname, '..', 'plugins', 'be', 'hooks', 'scripts', 'session-start.js');
  const r = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' });
  return { status: r.status, out: r.stdout || '' };
}

test('a declared companion repo is reported at session start', () => {
  const root = projectWith('{"companions":["../sibling"]}');
  const sib = path.join(root, 'sibling');
  fs.mkdirSync(sib);
  execSync('git init -q && git config user.email t@t && git config user.name t && ' +
    'echo x > a.txt && git add . && git commit -qm w', { cwd: sib, stdio: 'ignore' });
  const { status, out } = runHook(path.join(root, 'main'));
  assert.strictEqual(status, 0);
  assert.match(out, /Companion repo \.\.\/sibling/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('a companion path that is missing or not a repo is skipped silently', () => {
  const root = projectWith('{"companions":["../ghost","../notgit"]}');
  fs.mkdirSync(path.join(root, 'notgit'));
  const { status, out } = runHook(path.join(root, 'main'));
  assert.strictEqual(status, 0);
  assert.ok(!out.includes('Companion repo'), 'must not report an unreadable companion');
  fs.rmSync(root, { recursive: true, force: true });
});

test('a malformed .be-paths.json never breaks session start', () => {
  const root = projectWith('{ not json');
  const { status, out } = runHook(path.join(root, 'main'));
  assert.strictEqual(status, 0);
  assert.ok(out.includes('Session-continuity protocol active'));
  fs.rmSync(root, { recursive: true, force: true });
});
