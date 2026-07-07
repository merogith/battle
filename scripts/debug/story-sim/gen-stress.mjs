// Gen-lock stress test — run the content census across many enabled-gen configurations to stress
// team generation, signature survival, and theming when the species pool is restricted.
//
//   node scripts/debug/story-sim/gen-stress.mjs --seeds 30 --out agent-state/story-sim/gen-stress
//   node scripts/debug/story-sim/gen-stress.mjs --configs 1,9,1-3,1-9 --seeds 40
//
// Gen locks shrink the pool, which forces gym-leader signatures out of range (they get filtered
// and replaced by generic filler) and can degrade type theming or leave teams undersized. This
// walks every config through the fast census (no battles) and compares:
//   - rollfail / undersized-team counts  (robustness — does generation still fill teams?)
//   - signature survival (sigRate)        (do authored aces survive the lock, or fall back?)
//   - theme-match rate                    (does theming hold with a thin pool?)
//   - species diversity + BST scaling     (does the curve still progress?)
// Emits gen-stress-report.json + gen-stress-dashboard.html and flags configs that degrade.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEngine } from '../../../tests/helpers/load-engine.js';
import { censusSeed, makeMetaAccessor, gensOf } from './observe.mjs';

const DEFAULT_CONFIGS = ['1', '2', '5', '9', '1-2', '1-3', '4-6', '7-9', '1-6', '1-9'];

function parseArgs(argv) {
  const a = { seeds: 30, difficulty: 'normal', wildsPerCity: 6, configs: DEFAULT_CONFIGS.join(','), out: 'agent-state/story-sim/gen-stress' };
  for (let i = 0; i < argv.length; i++) { const [k, vRaw] = argv[i].replace(/^--/, '').split('='); const v = vRaw !== undefined ? vRaw : argv[++i]; if (k === 'seeds' || k === 'wildsPerCity') a[k] = Number(v); else if (k in a) a[k] = v; }
  return a;
}
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const rate = (n, d) => d ? n / d : 0;

async function main() {
  const A = parseArgs(process.argv.slice(2));
  const configs = String(A.configs).split(',').map(s => s.trim()).filter(Boolean);
  mkdirSync(A.out, { recursive: true });

  const _l = console.log; console.log = () => {};
  const E = await loadEngine();
  console.log = _l;
  const { meta, sigFamily } = makeMetaAccessor(E);

  const results = [];
  const t0 = Date.now();
  for (const cfg of configs) {
    const gens = gensOf(cfg);
    // per-config accumulators
    const acc = { cfg, gens, foes: 0, wilds: 0, rollfail: 0, undersized: 0,
      species: new Set(), glGrade: [], glStage: [], glBst: [], glThemeHit: 0, glThemeTot: 0, glSig: 0, glTot: 0,
      themeHitAll: 0, themeTotAll: 0, bstCity: {}, aceSig: 0, aceTot: 0 };
    for (let seed = 1; seed <= A.seeds; seed++) {
      censusSeed(E, seed, { difficulty: A.difficulty, gens, wildsPerCity: A.wildsPerCity, policy: 'recommended', tag: cfg, meta, sigFamily }, (r) => {
        if (r.kind === 'rollfail') { acc.rollfail++; return; }
        if (r.kind === 'wild') { acc.wilds++; acc.species.add(r.species); return; }
        // foe
        acc.foes++; acc.species.add(r.species);
        if (r.teamSize < r.expectedSize) acc.undersized++;
        (acc.bstCity[r.city] = acc.bstCity[r.city] || []).push(r.bst);
        if (r.matchesTheme !== null) { acc.themeTotAll++; if (r.matchesTheme) acc.themeHitAll++; }
        if (r.role === 'Gym Leader') {
          acc.glGrade.push(r.grade); acc.glStage.push(r.stage); acc.glBst.push(r.bst); acc.glTot++; if (r.isSig) acc.glSig++;
          if (r.matchesTheme !== null) { acc.glThemeTot++; if (r.matchesTheme) acc.glThemeHit++; }
          if (r.isAce) { acc.aceTot++; if (r.isSig) acc.aceSig++; }
        }
      });
    }
    const bstAt = (c) => acc.bstCity[c] ? Math.round(mean(acc.bstCity[c])) : null;
    results.push({
      cfg, gens: gens.length, seeds: A.seeds,
      species: acc.species.size, foes: acc.foes, wilds: acc.wilds,
      rollfail: acc.rollfail, undersized: acc.undersized, undersizedPct: +rate(acc.undersized, acc.foes ? (acc.foes) : 1).toFixed(3),
      glGrade: +mean(acc.glGrade).toFixed(2), glStage: +mean(acc.glStage).toFixed(2),
      glBstEarly: bstAt(1), glBstLate: bstAt(8),
      sigRate: +rate(acc.glSig, acc.glTot).toFixed(3), aceSigRate: +rate(acc.aceSig, acc.aceTot).toFixed(3),
      themeMatch: +rate(acc.themeHitAll, acc.themeTotAll).toFixed(3), glThemeMatch: +rate(acc.glThemeHit, acc.glThemeTot).toFixed(3),
    });
    _l(`[gen-stress] ${cfg.padEnd(5)} species=${acc.species.size} sigRate=${(100 * rate(acc.glSig, acc.glTot)).toFixed(0)}% theme=${(100 * rate(acc.themeHitAll, acc.themeTotAll)).toFixed(0)}% rollfail=${acc.rollfail} undersized=${acc.undersized}`);
  }

  // Flags: robustness / quality degradation under locks.
  const base = results.find(r => r.cfg === '1-9') || results[results.length - 1];
  const flags = [];
  for (const r of results) {
    if (r.rollfail > 0) flags.push({ kind: 'roll-failure', cfg: r.cfg, detail: `${r.rollfail} battles failed to roll a team` });
    if (r.undersized > 0) flags.push({ kind: 'undersized-team', cfg: r.cfg, detail: `${r.undersized} enemy mons in undersized teams (${(100 * r.undersizedPct).toFixed(1)}%)` });
    if (r.sigRate < 0.5) flags.push({ kind: 'signature-collapse', cfg: r.cfg, detail: `gym-leader signature rate ${(100 * r.sigRate).toFixed(0)}% (authored aces mostly filtered out)` });
    if (r.glThemeMatch < 0.8) flags.push({ kind: 'theming-degraded', cfg: r.cfg, detail: `gym-leader theme-match ${(100 * r.glThemeMatch).toFixed(0)}%` });
    if (base && r.glBstLate && base.glBstLate && r.glBstLate < base.glBstLate * 0.85) flags.push({ kind: 'weak-late-scaling', cfg: r.cfg, detail: `late gym BST ${r.glBstLate} vs ${base.glBstLate} at 1-9 (${Math.round(100 * r.glBstLate / base.glBstLate)}%)` });
  }

  writeFileSync(join(A.out, 'gen-stress-report.json'), JSON.stringify({ results, flags }, null, 2));
  writeFileSync(join(A.out, 'gen-stress-dashboard.html'), renderHtml(results, flags));
  _l(`\n[gen-stress] ${configs.length} configs in ${((Date.now() - t0) / 1000).toFixed(0)}s · ${flags.length} flags`);
  for (const f of flags) _l(`  [${f.kind}] ${f.cfg}: ${f.detail}`);
  _l(`wrote ${A.out}/gen-stress-report.json + gen-stress-dashboard.html`);
  E.teardown();
}

function renderHtml(results, flags) {
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const cell = (v, good) => `<td style="background:hsl(${Math.round((good) * 120)} 55% 40%)">${v}</td>`;
  const rows = results.map(r => `<tr><td style="text-align:left"><b>${esc(r.cfg)}</b></td><td>${r.species}</td>` +
    cell(`${Math.round(100 * r.sigRate)}%`, r.sigRate) +
    cell(`${Math.round(100 * r.glThemeMatch)}%`, r.glThemeMatch) +
    `<td>${r.glGrade}</td><td>${r.glStage}</td><td>${r.glBstEarly}→${r.glBstLate}</td>` +
    `<td style="background:${r.rollfail ? '#a33' : ''}">${r.rollfail}</td><td style="background:${r.undersized ? '#a63' : ''}">${r.undersized}</td></tr>`).join('');
  const flagRows = flags.length ? flags.map(f => `<li><b>${esc(f.kind)}</b> [${esc(f.cfg)}] — ${esc(f.detail)}</li>`).join('') : '<li>none — generation locking is robust</li>';
  return `<!doctype html><meta charset="utf8"><title>Gen-lock Stress</title>
<style>:root{color-scheme:dark light}body{font:13px/1.4 system-ui,sans-serif;margin:20px;background:#111;color:#ddd}
h1{font-size:18px}h2{font-size:14px;margin-top:22px;border-bottom:1px solid #333;padding-bottom:4px}
table{border-collapse:collapse}td,th{border:1px solid #2a2a2a;padding:3px 8px;text-align:center}small{color:#888}ul{margin:4px 0}</style>
<h1>Gen-lock Stress Test</h1>
<p><small>Content census run under each enabled-gen configuration. sig% = gym-leader mons that are signature-derived (authored aces surviving the lock); theme% = team typing matching the gym theme; BST early→late = gym-leader scaling city 1→8.</small></p>
<table><tr><th>gens</th><th>species</th><th>sig%</th><th>theme%</th><th>gl grade</th><th>gl stage</th><th>gl BST 1→8</th><th>rollfail</th><th>undersized</th></tr>${rows}</table>
<h2>Flags <small>(robustness/quality degradation under locks)</small></h2>
<ul>${flagRows}</ul>`;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error('gen-stress crashed:', e); process.exit(1); });
