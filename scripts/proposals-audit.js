#!/usr/bin/env node
'use strict';
/**
 * Keeps the proposal ledgers in feedback/ honest: every numbered proposal in a
 * feedback/<dir>/SUGESTOES.md carries its state, under its own title.
 *
 * Why this exists: proposal 28 of project-a-2026-08-19. Its triage of
 * 2026-08-19 was a snapshot. Proposals 24–28 were then written in the project's
 * unversioned draft and reached this repo only on 2026-09-22 — and in between,
 * the number 24 was used for two different proposals. Nothing said so, because
 * no command read the ledger: the same failure backlog-audit.js exists for.
 *
 * Rules (--check), all filesystem, no shell:
 *   - every `## N. …` / `### N. …` heading is followed by an `**Estado:**` line;
 *   - numbers are unique and run 1..N without a gap;
 *   - the state starts with aberta | implantada | descartada;
 *   - implantada and descartada carry a date; implantada cites a commit;
 *     descartada says why ("porque").
 * A cited commit is checked for form, not existence: CI checks out a shallow
 * clone, where an old commit is absent and a true claim would fail.
 *
 * Usage:
 *   node scripts/proposals-audit.js                          report
 *   node scripts/proposals-audit.js --check                  exit 1 on any defect
 *   node scripts/proposals-audit.js --draft <file> --from <feedback/…/SUGESTOES.md>
 *       regenerate the status index at the top of a project's draft copy, and
 *       list what the draft has that the ledger lacks. The draft lives in
 *       another repository on one machine, so its path is an argument, never a
 *       constant here.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HEADING = /^#{2,3} (\d+)\. (.*)$/;
const ESTADO = '**Estado:** ';
const STATES = ['aberta', 'implantada', 'descartada'];
const DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const COMMIT = /`[0-9a-f]{7,40}`/;
const BEGIN = '<!-- be:estado:inicio — gerado por proposals-audit.js; não editar à mão -->';
const END = '<!-- be:estado:fim -->';

/** Numbered proposals of a ledger or draft; headings inside code fences are not proposals. */
function parse(text) {
  const lines = text.split('\n');
  const out = [];
  let fenced = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('```')) fenced = !fenced;
    const m = !fenced && lines[i].match(HEADING);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    const estado = lines[j] && lines[j].startsWith(ESTADO) ? lines[j].slice(ESTADO.length).trim() : null;
    out.push({ n: Number(m[1]), title: m[2].replace(/\s*[🔴🟠🟡]\s*$/u, '').trim(), estado, line: i + 1 });
  }
  return out;
}

/** Defects of one ledger, as human-readable strings; empty means it is honest. */
function check(text) {
  const errors = [];
  const props = parse(text);
  const seen = new Set();
  props.forEach((p) => {
    const at = `proposal ${p.n} (line ${p.line})`;
    if (seen.has(p.n)) errors.push(`${at}: number used twice`);
    seen.add(p.n);
    if (p.estado === null) return errors.push(`${at}: no **Estado:** line under its title`);
    const state = STATES.find((s) => p.estado.startsWith(s));
    if (!state) return errors.push(`${at}: state must start with ${STATES.join(' | ')}`);
    if (state !== 'aberta' && !DATE.test(p.estado)) errors.push(`${at}: "${state}" needs a date`);
    if (state === 'implantada' && !COMMIT.test(p.estado)) errors.push(`${at}: "implantada" needs the commit that proves it`);
    if (state === 'descartada' && !/porque/.test(p.estado)) errors.push(`${at}: "descartada" needs its reason ("porque …")`);
  });
  const max = Math.max(0, ...seen);
  for (let n = 1; n <= max; n++) if (!seen.has(n)) errors.push(`proposal ${n}: missing — the numbers run 1..${max} with a gap`);
  return errors;
}

/** Every feedback/<dir>/SUGESTOES.md, relative to root. */
function ledgers(root = ROOT) {
  const dir = path.join(root, 'feedback');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'SUGESTOES.md')))
    .map((d) => path.join('feedback', d.name, 'SUGESTOES.md'));
}

const norm = (t) => t.replace(/[*`_]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const cell = (t) => t.replace(/\|/g, '\\|');

/** Proposals the draft has and the ledger lacks, and numbers the two use for different proposals. */
function drift(props, draftProps) {
  const byN = new Map(props.map((p) => [p.n, p]));
  return {
    onlyInDraft: draftProps.filter((d) => !byN.has(d.n)),
    collisions: draftProps.filter((d) => byN.has(d.n) && norm(byN.get(d.n).title) !== norm(d.title)),
  };
}

/** The generated block for a draft: one row per proposal, split into state and proof/destination. */
function renderIndex(props, draftProps, fromRel, date) {
  const split = (e) => {
    if (!e) return ['sem estado', ''];
    const at = e.indexOf(' — ') >= 0 ? e.indexOf(' — ') : e.indexOf(', porque ');
    return at < 0 ? [e, ''] : [e.slice(0, at), e.slice(at).replace(/^( — |, )/, '')];
  };
  const count = (s) => props.filter((p) => p.estado && p.estado.startsWith(s)).length;
  const { onlyInDraft, collisions } = drift(props, draftProps);
  const lines = [
    BEGIN,
    '## Estado das propostas no `be`',
    '',
    `> Gerado em ${date} a partir de \`${fromRel}\` do repo \`basic-engineering\`, onde cada`,
    '> proposta tem a linha **Estado:** completa, com a prova. Proposta nova continua nascendo neste',
    '> rascunho; o estado mora lá. Regerar, no repo do `be`:',
    `> \`node scripts/proposals-audit.js --draft <este arquivo> --from ${fromRel}\``,
    '',
    `**${props.length} propostas · ${count('implantada')} implantadas · ${count('descartada')} descartada(s) · ${count('aberta')} abertas**`,
    '',
    '| # | Proposta | Estado | Prova ou destino |',
    '|---|---|---|---|',
    ...props.map((p) => { const [s, d] = split(p.estado); return `| ${p.n} | ${cell(p.title)} | ${cell(s)} | ${cell(d)} |`; }),
  ];
  if (onlyInDraft.length) lines.push('', `**Só neste rascunho — ainda sem estado no \`be\`:** ${onlyInDraft.map((d) => `${d.n} (${d.title})`).join(' · ')}`);
  if (collisions.length) lines.push('', `**Mesmo número, proposta diferente:** ${collisions.map((d) => `${d.n} — aqui "${d.title}", no \`be\` "${props.find((p) => p.n === d.n).title}"`).join(' · ')}`);
  lines.push(END);
  return lines.join('\n');
}

/** The draft with its block replaced, or inserted after the title block (the first `---`). */
function applyDraft(draftText, block) {
  const b = draftText.indexOf(BEGIN);
  const e = draftText.indexOf(END);
  if (b >= 0 && e > b) return draftText.slice(0, b) + block + draftText.slice(e + END.length);
  const lines = draftText.split('\n');
  const at = lines.findIndex((l) => l.trim() === '---');
  if (at < 0) return block + '\n\n' + draftText;
  lines.splice(at + 1, 0, '', block, '', '---');
  return lines.join('\n');
}

function main(argv) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const draft = arg('--draft');
  if (draft) {
    const fromRel = arg('--from');
    if (!fromRel) { console.error('proposals-audit: --draft needs --from <feedback/…/SUGESTOES.md>'); return 2; }
    const props = parse(fs.readFileSync(path.join(ROOT, fromRel), 'utf8'));
    const text = fs.readFileSync(draft, 'utf8');
    const draftProps = parse(text.replace(new RegExp(`${BEGIN}[\\s\\S]*?${END}`), ''));
    const block = renderIndex(props, draftProps, fromRel, new Date().toISOString().slice(0, 10));
    fs.writeFileSync(draft, applyDraft(text, block));
    const { onlyInDraft, collisions } = drift(props, draftProps);
    console.log(`proposals-audit: index written to the draft — ${props.length} proposals from ${fromRel}.`);
    onlyInDraft.forEach((d) => console.log(`  only in the draft: ${d.n}. ${d.title}`));
    collisions.forEach((d) => console.log(`  same number, different proposal: ${d.n}`));
    return 0;
  }
  let failed = 0;
  for (const rel of ledgers()) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const errors = check(text);
    const n = parse(text).length;
    if (errors.length) { failed++; console.log(`✗ ${rel}`); errors.forEach((e) => console.log(`    ${e}`)); } else console.log(n ? `✔ ${rel}  (${n} proposals, each with its state)` : `·  ${rel}  (no numbered proposals — nothing to check)`);
  }
  if (argv.includes('--check') && failed) { console.error(`proposals-audit: ${failed} ledger(s) with a proposal whose state is missing or unproven.`); return 1; }
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { parse, check, ledgers, drift, renderIndex, applyDraft, BEGIN, END };
