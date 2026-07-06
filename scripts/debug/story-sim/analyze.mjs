// Story-Sim analysis + dashboard (Phase 6).
//
//   node scripts/debug/story-sim/analyze.mjs --in agent-state/story-sim --out agent-state/story-sim
//
// Reads runs*.jsonl + stages*.jsonl (concatenating shard files), aggregates into a report bundle,
// runs red-flag detectors (config thresholds), and writes:
//   report.json     — machine-readable aggregates (diffable across commits to catch balance regressions)
//   dashboard.html  — self-contained visual: difficulty heatmap, power curve, economy, reach, flags
//
// The player-experience metrics (§7 of the strategy doc) come straight from the telemetry:
// per-stage win-rate, player-vs-foe PowerIndex, gold curve, where each policy walls, item delta.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Thresholds are the maintainer's to own (balance calls). Exposed as config; defaults are
// deliberately loose flags, not verdicts.
const FLAGS = {
  tooHardWinRate: 0.5,     // optimal policy below this at a stage => "too hard even for a tryhard"
  tooEasyWinRate: 0.98,    // casual policy above this at a stage => "trivial"
  spikeDropPct: 0.30,      // adjacent-stage win-rate drop beyond this => difficulty spike
  powerInversionCities: 2, // foe PowerIndex dropping across >= this many city steps => curve bug
};

function parseArgs(argv) {
  const a = { in: 'agent-state/story-sim', out: 'agent-state/story-sim' };
  for (let i = 0; i < argv.length; i++) {
    const [k, v] = argv[i].replace(/^--/, '').split('=');
    a[k] = v !== undefined ? v : argv[++i];
  }
  return a;
}
function readJsonl(dir, base) {
  const files = readdirSync(dir).filter(f => f.startsWith(base) && f.endsWith('.jsonl'));
  const rows = [];
  for (const f of files) {
    const txt = readFileSync(join(dir, f), 'utf8').trim();
    if (!txt) continue;
    for (const line of txt.split('\n')) { if (line.trim()) rows.push(JSON.parse(line)); }
  }
  return rows;
}
function pctOr(n, d) { return d ? n / d : null; }
function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }

function aggregate(runs, stages) {
  const policies = [...new Set(runs.map(r => r.policy))];
  const diffs = [...new Set(runs.map(r => r.difficulty))];
  const items = [...new Set(runs.map(r => r.itemMode))];

  // Per-(event,difficulty,policy) win-rate, keyed by event name.
  const byStage = {}; // event -> {pos, city, cells: {"diff|policy|item": {w,n}}}
  for (const s of stages) {
    const ev = s.event;
    byStage[ev] = byStage[ev] || { event: ev, pos: s.pos, city: s.city, cells: {} };
    const key = `${s.difficulty}|${s.policy}|${s.itemMode}`;
    const c = (byStage[ev].cells[key] = byStage[ev].cells[key] || { w: 0, n: 0, pPow: [], fPow: [], turns: [] });
    c.n++; if (s.won) c.w++;
    c.pPow.push(s.pPower); c.fPow.push(s.fPower); c.turns.push(s.turns);
  }
  const stageList = Object.values(byStage).sort((a, b) => a.pos - b.pos);

  // Reach distribution: how far each policy/difficulty gets (max pos reached).
  const reach = {};
  for (const r of runs) {
    const key = `${r.difficulty}|${r.policy}|${r.itemMode}`;
    (reach[key] = reach[key] || []).push(r.reachedPos);
  }
  const reachSummary = Object.fromEntries(Object.entries(reach).map(([k, v]) =>
    [k, { n: v.length, meanReach: mean(v), minReach: Math.min(...v), maxReach: Math.max(...v),
      hofRate: pctOr(runs.filter(r => `${r.difficulty}|${r.policy}|${r.itemMode}` === k && /hof|mystery/.test(r.outcome)).length, v.length) }]));

  // Power curve per city (player vs foe). Use PER-MON power (total / party size) so the curve
  // is not distorted by party-size differences across cities (a per-city *total* average dips
  // at city 4 purely because filler-trainer party size drops there — a metric artifact, not a
  // difficulty inversion). Per-mon power is the apples-to-apples difficulty spine.
  const powerByCity = {}; // "diff|policy|item" -> city -> {p:[],f:[]}
  for (const s of stages) {
    const k = `${s.difficulty}|${s.policy}|${s.itemMode}`;
    powerByCity[k] = powerByCity[k] || {};
    const c = (powerByCity[k][s.city] = powerByCity[k][s.city] || { p: [], f: [] });
    if (s.playerSize > 0) c.p.push(s.pPower / s.playerSize);
    if (s.foeSize > 0) c.f.push(s.fPower / s.foeSize);
  }
  const powerCurve = {};
  for (const [k, cities] of Object.entries(powerByCity)) {
    powerCurve[k] = Object.entries(cities).map(([city, v]) => ({ city: +city, pPower: Math.round(mean(v.p) || 0), fPower: Math.round(mean(v.f) || 0) }))
      .sort((a, b) => a.city - b.city);
  }

  // Per-battle-TYPE foe power by city (surfaces filler-trainer scaling vs the gym spine).
  const byType = {}; // typeKey -> city -> [fPower/size]
  for (const s of stages) {
    const type = s.event.replace(/ \d+$/, '');
    byType[type] = byType[type] || {};
    if (s.foeSize > 0) (byType[type][s.city] = byType[type][s.city] || []).push(s.fPower / s.foeSize);
  }
  const foePowerByType = {};
  for (const [type, cities] of Object.entries(byType))
    foePowerByType[type] = Object.entries(cities).map(([city, v]) => ({ city: +city, perMon: Math.round(mean(v)) })).sort((a, b) => a.city - b.city);

  // Economy: mean gold curve by battle position, per policy/difficulty.
  const goldByPos = {};
  for (const s of stages) {
    const k = `${s.difficulty}|${s.policy}|${s.itemMode}`;
    goldByPos[k] = goldByPos[k] || {};
    (goldByPos[k][s.pos] = goldByPos[k][s.pos] || []).push(s.goldAfter);
  }
  const economy = {};
  for (const [k, poss] of Object.entries(goldByPos))
    economy[k] = Object.entries(poss).map(([pos, v]) => ({ pos: +pos, gold: Math.round(mean(v)) })).sort((a, b) => a.pos - b.pos);

  // Item off-vs-on delta: for matched (diff,policy), win-rate difference per stage.
  const itemDelta = [];
  if (items.includes('on') && items.includes('off')) {
    for (const st of stageList) {
      for (const difficulty of diffs) for (const policy of policies) {
        const off = st.cells[`${difficulty}|${policy}|off`];
        const on = st.cells[`${difficulty}|${policy}|on`];
        if (off && on && off.n && on.n) {
          itemDelta.push({ event: st.event, pos: st.pos, difficulty, policy,
            winOff: off.w / off.n, winOn: on.w / on.n, delta: (on.w / on.n) - (off.w / off.n) });
        }
      }
    }
  }

  return { policies, diffs, items, stageList, reachSummary, powerCurve, foePowerByType, economy, itemDelta };
}

function detectFlags(agg) {
  const flags = [];
  for (const st of agg.stageList) {
    for (const difficulty of agg.diffs) for (const itemMode of agg.items) {
      const opt = st.cells[`${difficulty}|optimal|${itemMode}`];
      const cas = st.cells[`${difficulty}|casual|${itemMode}`];
      if (opt && opt.n >= 3 && opt.w / opt.n < FLAGS.tooHardWinRate)
        flags.push({ kind: 'too-hard', event: st.event, pos: st.pos, difficulty, itemMode, detail: `optimal win ${(100 * opt.w / opt.n).toFixed(0)}% (<${100 * FLAGS.tooHardWinRate}%)` });
      if (cas && cas.n >= 3 && cas.w / cas.n > FLAGS.tooEasyWinRate)
        flags.push({ kind: 'too-easy', event: st.event, pos: st.pos, difficulty, itemMode, detail: `casual win ${(100 * cas.w / cas.n).toFixed(0)}% (>${100 * FLAGS.tooEasyWinRate}%)` });
    }
  }
  // Power inversion: PER-MON foe power dropping city-to-city (party-size-normalized, so this is
  // a real difficulty inversion, not a filler-mix artifact). Tolerance 3% to ignore noise.
  for (const [k, curve] of Object.entries(agg.powerCurve)) {
    for (let i = 1; i < curve.length; i++) {
      if (curve[i].fPower < curve[i - 1].fPower * 0.97)
        flags.push({ kind: 'power-inversion', detail: `${k}: per-mon foe power drops city ${curve[i - 1].city}->${curve[i].city} (${curve[i - 1].fPower}->${curve[i].fPower})` });
    }
  }
  // Filler-trivial: filler trainer types (Basic/Elite) whose per-mon power falls far below the
  // Gym Leader spine at the same late city — late-game route battles become trivial speed-bumps.
  const spine = agg.foePowerByType['Gym Leader'] || [];
  const spineAt = (c) => { const e = spine.find(x => x.city === c); return e ? e.perMon : null; };
  for (const type of ['Basic Trainer', 'Elite Trainer']) {
    const curve = agg.foePowerByType[type] || [];
    for (const pt of curve) {
      if (pt.city < 4) continue;
      const g = spineAt(pt.city);
      if (g && pt.perMon < 0.45 * g)
        flags.push({ kind: 'filler-trivial', detail: `${type} @ city ${pt.city}: per-mon power ${pt.perMon} is ${Math.round(100 * pt.perMon / g)}% of the Gym Leader ${g} — trivial vs the spine` });
    }
  }
  return flags;
}

function renderHtml(agg, flags, meta) {
  const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  // Heatmap: rows = stages, cols = (diff|policy|item), cell = win-rate color.
  const cols = [];
  for (const d of agg.diffs) for (const p of agg.policies) for (const it of agg.items) cols.push(`${d}|${p}|${it}`);
  const heatRows = agg.stageList.map(st => {
    const cells = cols.map(k => {
      const c = st.cells[k];
      if (!c || !c.n) return `<td class="na"></td>`;
      const wr = c.w / c.n;
      const hue = Math.round(wr * 120); // red->green
      return `<td style="background:hsl(${hue} 65% 45%)" title="${k}: ${c.w}/${c.n}">${Math.round(wr * 100)}</td>`;
    }).join('');
    return `<tr><th>${esc(st.event)}<span class="pos">#${st.pos}</span></th>${cells}</tr>`;
  }).join('');
  const colHead = cols.map(k => `<th class="rot"><span>${esc(k)}</span></th>`).join('');

  // Power curve sparql (SVG) for the first policy/diff key present.
  const pcKey = Object.keys(agg.powerCurve)[0];
  const pc = agg.powerCurve[pcKey] || [];
  const maxPow = Math.max(1, ...pc.flatMap(d => [d.pPower, d.fPower]));
  const W = 520, H = 160, pad = 30;
  const xFor = (i) => pad + (pc.length > 1 ? i * (W - 2 * pad) / (pc.length - 1) : 0);
  const yFor = (v) => H - pad - (v / maxPow) * (H - 2 * pad);
  const line = (sel) => pc.map((d, i) => `${i ? 'L' : 'M'}${xFor(i).toFixed(0)},${yFor(d[sel]).toFixed(0)}`).join(' ');
  const svg = pc.length ? `<svg viewBox="0 0 ${W} ${H}" width="100%"><path d="${line('pPower')}" fill="none" stroke="#4ea1ff" stroke-width="2"/><path d="${line('fPower')}" fill="none" stroke="#ff6b6b" stroke-width="2"/>${pc.map((d, i) => `<text x="${xFor(i)}" y="${H - 8}" font-size="9" text-anchor="middle" fill="#888">C${d.city}</text>`).join('')}</svg>` : '<p>no data</p>';

  // Per-battle-type foe per-mon power table (built here to avoid nested template literals).
  const ttCities = [...new Set(Object.values(agg.foePowerByType).flat().map(p => p.city))].sort((a, b) => a - b);
  const ttTypes = Object.keys(agg.foePowerByType).sort();
  const ttHead = ttCities.map(c => `<th>C${c}</th>`).join('');
  const ttRows = ttTypes.map(t => {
    const m = Object.fromEntries((agg.foePowerByType[t] || []).map(p => [p.city, p.perMon]));
    return `<tr><th style="text-align:left">${esc(t)}</th>${ttCities.map(c => `<td>${m[c] != null ? m[c] : ''}</td>`).join('')}</tr>`;
  }).join('');
  const typeTable = `<div style="overflow-x:auto"><table><tr><th></th>${ttHead}</tr>${ttRows}</table></div>`;

  const reachRows = Object.entries(agg.reachSummary).map(([k, v]) =>
    `<tr><td>${esc(k)}</td><td>${v.n}</td><td>${v.meanReach?.toFixed(1)}</td><td>${v.minReach}</td><td>${v.maxReach}</td><td>${v.hofRate != null ? (100 * v.hofRate).toFixed(0) + '%' : '—'}</td></tr>`).join('');
  const flagRows = flags.length ? flags.map(f => `<li><b>${esc(f.kind)}</b> ${esc(f.event || '')} ${esc(f.difficulty || '')} ${esc(f.itemMode || '')} — ${esc(f.detail)}</li>`).join('') : '<li>none</li>';
  const deltaRows = agg.itemDelta.filter(d => Math.abs(d.delta) > 0.001).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 20)
    .map(d => `<tr><td>${esc(d.event)}</td><td>${esc(d.difficulty)}/${esc(d.policy)}</td><td>${(100 * d.winOff).toFixed(0)}%</td><td>${(100 * d.winOn).toFixed(0)}%</td><td>${(d.delta >= 0 ? '+' : '') + (100 * d.delta).toFixed(0)}pt</td></tr>`).join('');

  return `<!doctype html><meta charset="utf8"><title>Story-Sim Dashboard</title>
<style>
:root{color-scheme:dark light}body{font:13px/1.4 system-ui,sans-serif;margin:20px;background:#111;color:#ddd}
h1{font-size:18px}h2{font-size:14px;margin-top:26px;border-bottom:1px solid #333;padding-bottom:4px}
table{border-collapse:collapse;margin:8px 0}td,th{border:1px solid #2a2a2a;padding:2px 6px;text-align:center}
.heat td{color:#fff;font-size:11px;min-width:26px}.heat th{text-align:right;font-size:11px;white-space:nowrap}
.heat .pos{color:#777;margin-left:6px;font-size:9px}.na{background:#1a1a1a}
th.rot{height:90px;vertical-align:bottom}th.rot span{writing-mode:vertical-rl;transform:rotate(180deg);font-size:9px;color:#aaa}
.meta{color:#888;font-size:12px}.legend span{display:inline-block;width:14px;height:14px;vertical-align:middle;margin:0 2px}
ul{margin:4px 0}small{color:#888}
</style>
<h1>Story-Sim Dashboard</h1>
<p class="meta">${esc(meta.runs)} runs · ${esc(meta.stages)} battle stages · policies: ${esc(agg.policies.join(', '))} · difficulties: ${esc(agg.diffs.join(', '))} · items: ${esc(agg.items.join(', '))}<br>generated from telemetry — win-rate = fraction of runs winning that stage.</p>

<h2>Difficulty heatmap <small>(win-rate %, red 0 → green 100; columns = difficulty|policy|item)</small></h2>
<div style="overflow-x:auto"><table class="heat"><tr><th></th>${colHead}</tr>${heatRows}</table></div>

<h2>Power curve <small>(${esc(pcKey || '')} — <span style="color:#4ea1ff">player</span> vs <span style="color:#ff6b6b">foe</span> PowerIndex by city)</small></h2>
${svg}

<h2>Foe per-mon power by battle type <small>(party-size-normalized — the gym spine vs filler; totals mislead because filler fields fewer mons)</small></h2>
${typeTable}

<h2>Reach summary <small>(how far each cohort gets; hofRate = reached ending)</small></h2>
<table><tr><th>diff|policy|item</th><th>n</th><th>mean pos</th><th>min</th><th>max</th><th>finish%</th></tr>${reachRows}</table>

<h2>Item off→on delta <small>(top 20 by |Δ win-rate|)</small></h2>
${deltaRows ? `<table><tr><th>event</th><th>diff/policy</th><th>off</th><th>on</th><th>Δ</th></tr>${deltaRows}</table>` : '<p><small>run with --item off,on to populate</small></p>'}

<h2>Red flags <small>(config thresholds — balance calls are the maintainer's)</small></h2>
<ul>${flagRows}</ul>
`;
}

function main() {
  const A = parseArgs(process.argv.slice(2));
  const runs = readJsonl(A.in, 'runs');
  const stages = readJsonl(A.in, 'stages');
  if (!runs.length) { console.error('no runs found in', A.in); process.exit(1); }
  const agg = aggregate(runs, stages);
  const flags = detectFlags(agg);
  const meta = { runs: runs.length, stages: stages.length };
  writeFileSync(join(A.out, 'report.json'), JSON.stringify({ meta, flags, ...agg }, null, 2));
  writeFileSync(join(A.out, 'dashboard.html'), renderHtml(agg, flags, meta));
  console.log(`analyzed ${runs.length} runs / ${stages.length} stages`);
  console.log(`flags: ${flags.length}`);
  for (const f of flags.slice(0, 12)) console.log(`  [${f.kind}] ${f.event || ''} ${f.difficulty || ''} ${f.itemMode || ''} ${f.detail}`);
  console.log(`wrote ${A.out}/report.json + dashboard.html`);
}
main();
