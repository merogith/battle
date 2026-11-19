import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { values } = parseArgs({ options: {
  'report-only': { type: 'boolean' },
  'out-dir': { type: 'string' },
  'only': { type: 'string' },
  'seed': { type: 'string', default: '1' },
  'road-choice': { type: 'string', default: 'scout' },
  'road-choices': { type: 'string' },
  'chapter-choice': { type: 'string', default: 'clue' },
  viewport: { type: 'string', default: '430x880' },
  'real-battles': { type: 'string', default: '1' },
  'real-turns': { type: 'string', default: '4' },
  'milestone-turns': { type: 'string', default: '0' },
  'fight-style': { type: 'string', default: 'first' },
  'offline-pack': { type: 'boolean' },
  chapters: { type: 'boolean' },
} });
const out = resolve(values['out-dir'] || join(root, 'agent-state/playthrough',
  new Date().toISOString().replace(/[:.]/g, '-')));
await mkdir(out, { recursive: true });

const suites = [
  { id: 'story', label: 'Campaign', script: 'story-playthrough.mjs',
    args: folder => [`--seed=${values.seed}`, `--road-choice=${values['road-choice']}`, `--real-battles=${values['real-battles']}`,
      `--real-turns=${values['real-turns']}`, `--milestone-turns=${values['milestone-turns']}`,
      `--fight-style=${values['fight-style']}`, `--viewport=${values.viewport}`, `--out-dir=${folder}`,
      ...(values['road-choices'] ? [`--road-choices=${values['road-choices']}`] : []),
      `--chapter-choice=${values['chapter-choice']}`,
      ...(values['offline-pack'] ? ['--offline-pack=true'] : []), ...(values.chapters ? ['--chapters=true'] : [])] },
  { id: 'facilities', label: 'City services and training', script: 'player-facilities-playtest.mjs' },
  { id: 'postgame', label: 'Optional routes and postgame', script: 'player-postgame-playtest.mjs' },
  { id: 'casino', label: 'Game Corner', script: 'player-casino-playtest.mjs' },
  { id: 'modes', label: 'Other game modes', script: 'player-modes-playtest.mjs' },
  { id: 'progress', label: 'Onboarding, practice and save recovery', script: 'player-progress-playtest.mjs' },
];
const wanted = values.only?.split(',').map(name => name.trim()) || suites.map(suite => suite.id);
for (const id of wanted) {
  if (!suites.some(suite => suite.id === id)) throw new Error('Unknown playtest suite: ' + id);
}

async function ready(url, server) {
  for (let i = 0; i < 50; i++) {
    if (server?.exitCode != null) throw new Error('Local server stopped during startup');
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) }).catch(() => null);
    if (response?.ok) {
      await response.body?.cancel();
      return;
    }
    await delay(200);
  }
  throw new Error('Game did not respond at ' + url);
}

function runSuite(suite, url, folder) {
  return new Promise((done, fail) => {
    const child = spawn(process.execPath, [join(root, 'scripts/debug', suite.script), ...(suite.args?.(folder) || [])], {
      cwd: root,
      env: { ...process.env, BATTLE_TEST_URL: url, BATTLE_PLAYTEST_OUT: folder },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const log = createWriteStream(join(folder, 'run.log'));
    for (const stream of [child.stdout, child.stderr]) stream.pipe(log, { end: false });
    child.once('error', error => log.end(() => fail(error)));
    child.once('close', (code, signal) => log.end(() => done({ code, signal })));
  });
}

const outcomes = new Map();
if (!values['report-only']) {
  const port = process.env.BATTLE_PLAYTEST_PORT || '5196';
  const base = new URL(process.env.BATTLE_TEST_URL || `http://127.0.0.1:${port}/battle.html`);
  if (base.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) {
    throw new Error('Use a loopback HTTP server for this playtest');
  }
  const server = process.env.BATTLE_TEST_URL ? null : spawn(process.execPath, [join(root, 'scripts/dev-server.cjs')], {
    cwd: root, env: { ...process.env, PORT: port }, stdio: ['ignore', 'ignore', 'inherit'],
  });
  try {
    await ready(base.href, server);
    for (const suite of suites.filter(suite => wanted.includes(suite.id))) {
      const folder = join(out, suite.id);
      await mkdir(folder, { recursive: true });
      console.log('Running ' + suite.label);
      outcomes.set(suite.id, await runSuite(suite, base.href, folder));
    }
  } finally {
    server?.kill();
  }
}

async function json(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function surfaceIds(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map(entry => typeof entry === 'string' ? entry : entry?.id)
    .filter(id => typeof id === 'string' && id.trim());
}

const results = [];
const locations = new Map();
for (const suite of suites) {
  const folder = join(out, suite.id);
  const reportFile = existsSync(join(folder, 'report.json')) ? 'report.json' : 'findings.json';
  const payload = await json(join(folder, reportFile));
  const exit = outcomes.get(suite.id);
  if (!payload && !exit) continue;
  const rawTrace = payload?.trace || await json(join(folder, 'trace.json')) || [];
  const findings = (Array.isArray(payload) ? payload : payload?.findings) || [];
  const failed = (exit && exit.code !== 0) || findings.some(finding => finding.severity === 'error');
  const status = failed ? 'failed' : payload?.status ||
    (!payload || payload.completed === false ? 'incomplete' : payload.completed ? 'passed' : 'recorded');
  const steps = rawTrace.flatMap(row => {
    if (!Array.isArray(row.steps)) return [row];
    return [row, ...row.steps.filter(step => step && typeof step === 'object').map(step => ({
      ...step, label: [row.name, step.label || step.phase || step.name].filter(Boolean).join(' · '),
    }))];
  });
  const trace = steps.map((row, index) => ({
    ...row,
    label: row.label || row.step || row.action || row.name || row.phase || `Step ${index + 1}`,
    screens: surfaceIds(row.screens),
    dialogs: surfaceIds(row.dialogs),
    screenshot: row.screenshot ? relative(out, resolve(folder, row.screenshot)) : null,
  }));
  for (const row of trace) {
    for (const id of [...row.screens, ...row.dialogs]) {
      if (!locations.has(id)) locations.set(id, []);
      const evidence = locations.get(id);
      if (!evidence.some(entry => entry.suite === suite.id)) evidence.push({ suite: suite.id, screenshot: row.screenshot });
      else if (row.screenshot) {
        const entry = evidence.find(entry => entry.suite === suite.id);
        entry.screenshot ||= row.screenshot;
      }
    }
  }
  results.push({
    id: suite.id, label: suite.label, status, exit, findings, trace,
    observations: payload?.observations || [],
    setup: [payload?.fixture, ...(payload?.bypasses || [])].filter(Boolean),
    report: payload ? suite.id + '/' + reportFile : null,
    log: existsSync(join(folder, 'run.log')) ? suite.id + '/run.log' : null,
  });
}

const parsed = new JSDOM(await readFile(join(root, 'battle.html'), 'utf8'));
const inventory = Array.from(parsed.window.document.querySelectorAll('.screen[id], .modal[id]')).map(node => ({
  id: node.id,
  label: node.getAttribute('aria-label') || node.querySelector('h1,h2')?.textContent.trim() || node.id,
  kind: node.classList.contains('screen') ? 'screen' : 'dialog',
  developer: node.id === 'screen-story-tester',
  note: node.id === 'modal-story-artifact' ? 'No player-facing opener found. Current relic details are inline.' : null,
  evidence: locations.get(node.id) || [],
}));
parsed.window.close();
const counts = (items, predicate) => items.filter(predicate).length;
const sections = [
  ['Player screens', inventory.filter(item => item.kind === 'screen' && !item.developer)],
  ['Dialogs', inventory.filter(item => item.kind === 'dialog')],
];
const total = results.reduce((sum, result) => sum + result.trace.length, 0);
const dynamic = Array.from(locations.keys()).filter(id =>
  typeof id === 'string' && id.length <= 100 && !id.includes('\n') && !inventory.some(item => item.id === id)
).sort();
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const href = path => escape(path.split(/[\\/]/).map(encodeURIComponent).join('/'));
const evidenceLink = entry => entry.screenshot
  ? `<a href="${href(entry.screenshot)}">${escape(entry.suite)}</a>` : escape(entry.suite);
const inventoryHtml = sections.map(([label, items]) => `
  <h3>${label} <span>${counts(items, item => item.evidence.length)}/${items.length}</span></h3>
  <table><thead><tr><th>Surface</th><th>Evidence</th></tr></thead><tbody>
  ${items.map(item => `<tr><td>${escape(item.label)} <small>${escape(item.id)}</small></td>
    <td>${item.evidence.map(evidenceLink).join(', ') || 'Unobserved'}${item.note ? `<small>${escape(item.note)}</small>` : ''}</td></tr>`).join('')}
  </tbody></table>`).join('');
const body = results.map(result => `
  <section id="${result.id}"><h2>${escape(result.label)} <span>${escape(result.status)}</span></h2>
  <p>${result.trace.length} recorded steps${result.report ? ` · <a href="${result.report}">Suite report</a>` : ''}${result.log ? ` · <a href="${result.log}">Runner log</a>` : ''}</p>
  ${result.setup.length ? `<details><summary>Test setup</summary><ul>${result.setup.map(item => `<li>${escape(item)}</li>`).join('')}</ul></details>` : ''}
  ${result.findings.length + result.observations.length ? `<ul>${[...result.findings, ...result.observations].map(finding =>
    `<li><strong>${escape(finding.severity || finding.status || 'note')}</strong> ${escape(finding.area || finding.case || finding.phase || finding.scenario || '')} ${escape(finding.message || finding.msg || finding.error || finding.issue || finding.detail || '')}${finding.screenshot ? ` · <a href="${href(result.id + '/' + finding.screenshot)}">Screenshot</a>` : ''}</li>`).join('')}</ul>` : ''}
  <div class="steps">${result.trace.map(row => `<figure>
    ${row.screenshot ? `<a href="${href(row.screenshot)}" aria-label="Open screenshot of ${escape(row.label)}"><img src="${href(row.screenshot)}" alt="" loading="lazy"></a>` : ''}
    <figcaption><strong>${escape(row.label)}</strong><small>${escape([...row.screens, ...row.dialogs].filter(id =>
    typeof id === 'string' && id.length <= 100 && !id.includes('\n')).join(' · '))}</small></figcaption>
  </figure>`).join('')}</div></section>`).join('');

await writeFile(join(out, 'index.html'), `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pokémon Arena player experience playtest</title>
<style>
  body{font:16px/1.55 system-ui;color:#e6eaf2;background:#10131a;margin:0 auto;padding:clamp(16px,4vw,48px);max-width:1280px}
  h1,h2,h3{line-height:1.2}h2{margin-top:2.5rem}h2 span,h3 span,small{color:#abb9cc;font-size:.85rem}
  a{color:#94ccff}nav{display:flex;gap:.85rem;flex-wrap:wrap}
  table{border-collapse:collapse;width:100%}td,th{text-align:left;border-bottom:1px solid #39414e;padding:8px}
  small{display:block;overflow-wrap:anywhere}.steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:16px}
  figure{margin:0;padding:10px;background:#1e2632;border-radius:8px;min-width:0}
  img{width:100%;height:180px;object-fit:contain;background:#080a0d}figcaption{padding:6px 0}
</style>
<h1>Pokémon Arena player experience playtest</h1>
<p>${total} recorded steps across ${results.length} suites. An observed surface has a trace entry. Successful actions and bypasses are recorded in the suite reports.</p>
<nav><a href="#surface-coverage">Surface coverage</a>${results.map(result =>
  `<a href="#${result.id}">${escape(result.label)}</a>`).join('')}<a href="coverage.json">Coverage data</a></nav>
<section id="surface-coverage"><h2>Surface coverage</h2>${inventoryHtml}
${dynamic.length ? `<h3>Other observed surfaces</h3><p>${dynamic.map(escape).join(' · ')}</p>` : ''}</section>
${body}</html>
`);
await writeFile(join(out, 'coverage.json'), JSON.stringify({ total, inventory, dynamic, results }, null, 2) + '\n');
for (const [label, items] of sections) console.log(`${label}: ${counts(items, item => item.evidence.length)}/${items.length}`);
console.log(`Evidence gallery: ${join(out, 'index.html')}`);
for (const result of results) {
  if (!wanted.includes(result.id) || !['failed', 'incomplete'].includes(result.status)) continue;
  process.exitCode = 1;
  console.error(`${result.label} ${result.status} (${result.log || 'no runner log'})`);
  for (const finding of result.findings) console.error(JSON.stringify(finding).slice(0, 600));
}
