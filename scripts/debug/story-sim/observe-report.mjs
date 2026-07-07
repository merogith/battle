// Content report + dashboard from the encounter census (observe.mjs).
//
//   node scripts/debug/story-sim/observe-report.mjs --in agent-state/story-sim/content --out agent-state/story-sim/content
//
// Aggregates encounters.jsonl into content-report.json + content-dashboard.html:
//   - Enemy scaling by role × city (mean grade / evolution stage / BST) — is difficulty progressing?
//   - Gym-leader profile per gym (theme, theme-match %, signature %, top ace species)
//   - Trainer-type theming (do gym trainers follow the gym leader's type?) + off-theme flags
//   - Wild scaling by city (grade mix, mean BST/stage) — do wilds get stronger?
//   - Top species per role
// This is an observability pass — "what is actually in the game and how it scales" — not balance.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function parseArgs(argv) {
  const a = { in: 'agent-state/story-sim/content', out: 'agent-state/story-sim/content' };
  for (let i = 0; i < argv.length; i++) { const [k, v] = argv[i].replace(/^--/, '').split('='); a[k] = v !== undefined ? v : argv[++i]; }
  return a;
}
function readEnc(dir) {
  const rows = [];
  for (const f of readdirSync(dir).filter(f => f.startsWith('encounters') && f.endsWith('.jsonl'))) {
    const txt = readFileSync(join(dir, f), 'utf8').trim();
    if (txt) for (const l of txt.split('\n')) if (l.trim()) rows.push(JSON.parse(l));
  }
  return rows;
}
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const rate = (n, d) => d ? n / d : 0;
function topN(counts, n) { return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n); }

function aggregate(rows) {
  const foes = rows.filter(r => r.kind === 'foe');
  const wilds = rows.filter(r => r.kind === 'wild');

  // Enemy scaling by role × city.
  const roleCity = {};
  for (const r of foes) {
    const k = `${r.role}|${r.city}`;
    const c = (roleCity[k] = roleCity[k] || { role: r.role, city: r.city, grade: [], stage: [], bst: [], mult: [] });
    c.grade.push(r.grade); c.stage.push(r.stage); c.bst.push(r.bst); c.mult.push(r.foeMult);
  }
  const enemyScaling = Object.values(roleCity).map(c => ({
    role: c.role, city: c.city, n: c.grade.length,
    grade: +mean(c.grade).toFixed(2), stage: +mean(c.stage).toFixed(2), bst: Math.round(mean(c.bst)), mult: +mean(c.mult).toFixed(2),
  })).sort((a, b) => a.city - b.city || a.role.localeCompare(b.role));

  // Gym-leader profile per gym event.
  const gymProfile = {};
  for (const r of foes.filter(r => r.role === 'Gym Leader')) {
    const g = (gymProfile[r.event] = gymProfile[r.event] || { event: r.event, city: r.city, theme: r.theme, grade: [], stage: [], bst: [], themeHit: 0, themeTot: 0, sig: 0, tot: 0, aces: {} });
    g.grade.push(r.grade); g.stage.push(r.stage); g.bst.push(r.bst); g.tot++; if (r.isSig) g.sig++;
    if (r.matchesTheme !== null) { g.themeTot++; if (r.matchesTheme) g.themeHit++; }
    if (r.isAce) g.aces[r.species] = (g.aces[r.species] || 0) + 1;
  }
  const gyms = Object.values(gymProfile).map(g => ({
    event: g.event, city: g.city, theme: g.theme, n: g.tot,
    grade: +mean(g.grade).toFixed(2), stage: +mean(g.stage).toFixed(2), bst: Math.round(mean(g.bst)),
    themeMatch: +rate(g.themeHit, g.themeTot).toFixed(2), sigRate: +rate(g.sig, g.tot).toFixed(2),
    topAces: topN(g.aces, 4).map(([s, n]) => `${s}(${n})`),
  })).sort((a, b) => a.city - b.city);

  // Theming by role (do teams follow their theme type?).
  const themeByRole = {};
  for (const r of foes) {
    if (r.matchesTheme === null) continue;
    const t = (themeByRole[r.role] = themeByRole[r.role] || { hit: 0, tot: 0 });
    t.tot++; if (r.matchesTheme) t.hit++;
  }
  const theming = Object.entries(themeByRole).map(([role, t]) => ({ role, themeMatch: +rate(t.hit, t.tot).toFixed(3), n: t.tot }))
    .sort((a, b) => a.themeMatch - b.themeMatch);

  // Off-theme aces (a gym leader ace whose typing doesn't match the gym theme) — content flag.
  const offThemeAces = {};
  for (const r of foes.filter(r => r.role === 'Gym Leader' && r.isAce && r.matchesTheme === false)) {
    const k = `${r.event}|${r.species}|${r.theme}`;
    offThemeAces[k] = (offThemeAces[k] || 0) + 1;
  }

  // Wild scaling by city.
  const wildCity = {};
  for (const r of wilds) {
    const c = (wildCity[r.city] = wildCity[r.city] || { city: r.city, grade: [], stage: [], bst: [], gd: {} });
    c.grade.push(r.grade); c.stage.push(r.stage); c.bst.push(r.bst); c.gd[r.grade] = (c.gd[r.grade] || 0) + 1;
  }
  const wildScaling = Object.values(wildCity).map(c => ({
    city: c.city, n: c.grade.length, grade: +mean(c.grade).toFixed(2), stage: +mean(c.stage).toFixed(2), bst: Math.round(mean(c.bst)),
    gradeMix: [4, 3, 2, 1].map(g => `G${g}:${Math.round(100 * rate(c.gd[g] || 0, c.grade.length))}%`).filter(s => !s.endsWith('0%')).join(' '),
  })).sort((a, b) => a.city - b.city);

  // Top species per role.
  const roleSpecies = {};
  for (const r of foes) { const s = (roleSpecies[r.role] = roleSpecies[r.role] || {}); s[r.species] = (s[r.species] || 0) + 1; }
  const topSpecies = Object.entries(roleSpecies).map(([role, s]) => ({ role, top: topN(s, 8).map(([n, c]) => `${n}(${c})`) }));

  return { enemyScaling, gyms, theming, offThemeAces, wildScaling, topSpecies,
    counts: { foes: foes.length, wilds: wilds.length, seeds: new Set(rows.map(r => r.seed)).size } };
}

function html(agg) {
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const bar = (v, max, hue) => `<span style="display:inline-block;height:9px;width:${Math.round(60 * v / max)}px;background:hsl(${hue} 60% 50%);vertical-align:middle"></span>`;
  const maxBst = Math.max(1, ...agg.enemyScaling.map(r => r.bst), ...agg.wildScaling.map(r => r.bst));

  const gymRows = agg.gyms.map(g => {
    const mh = g.themeMatch, hue = Math.round(mh * 120);
    return `<tr><td style="text-align:left">${esc(g.event)}</td><td>${g.city}</td><td>${esc(g.theme || '—')}</td><td>${g.grade}</td><td>${g.stage}</td><td>${g.bst} ${bar(g.bst, maxBst, 200)}</td><td style="background:hsl(${hue} 55% 40%)">${Math.round(100 * mh)}%</td><td>${Math.round(100 * g.sigRate)}%</td><td style="text-align:left;font-size:11px">${esc(g.topAces.join(', '))}</td></tr>`;
  }).join('');

  const scaleRows = agg.enemyScaling.filter(r => ['Gym Leader', 'Gym Trainer', 'Basic Trainer', 'Elite Trainer', 'Elite Four', 'Champion', 'Rival'].includes(r.role))
    .map(r => `<tr><td style="text-align:left">${esc(r.role)}</td><td>${r.city}</td><td>${r.grade}</td><td>${r.stage}</td><td>${r.bst} ${bar(r.bst, maxBst, 200)}</td><td>${r.mult}</td><td>${r.n}</td></tr>`).join('');

  const wildRows = agg.wildScaling.map(r => `<tr><td>${r.city}</td><td>${r.grade}</td><td>${r.stage}</td><td>${r.bst} ${bar(r.bst, maxBst, 140)}</td><td style="text-align:left;font-size:11px">${esc(r.gradeMix)}</td><td>${r.n}</td></tr>`).join('');

  const themeRows = agg.theming.map(r => { const hue = Math.round(r.themeMatch * 120); return `<tr><td style="text-align:left">${esc(r.role)}</td><td style="background:hsl(${hue} 55% 40%)">${Math.round(100 * r.themeMatch)}%</td><td>${r.n}</td></tr>`; }).join('');
  const offAce = Object.entries(agg.offThemeAces).sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [ev, sp, th] = k.split('|'); return `<li>${esc(ev)} (theme ${esc(th)}) ace <b>${esc(sp)}</b> is off-theme — ${n}×</li>`; }).join('') || '<li>none</li>';
  const speciesRows = agg.topSpecies.map(r => `<tr><td style="text-align:left">${esc(r.role)}</td><td style="text-align:left;font-size:11px">${esc(r.top.join(', '))}</td></tr>`).join('');

  return `<!doctype html><meta charset="utf8"><title>Story-Sim Content Census</title>
<style>:root{color-scheme:dark light}body{font:13px/1.4 system-ui,sans-serif;margin:20px;background:#111;color:#ddd}
h1{font-size:18px}h2{font-size:14px;margin-top:24px;border-bottom:1px solid #333;padding-bottom:4px}
table{border-collapse:collapse;margin:6px 0}td,th{border:1px solid #2a2a2a;padding:2px 7px;text-align:center}
.meta{color:#888}small{color:#888}ul{margin:4px 0}</style>
<h1>Story-Sim Content Census</h1>
<p class="meta">${agg.counts.seeds} seeds · ${agg.counts.foes} enemy mons · ${agg.counts.wilds} wild encounters · what appears in the game start→end and how it scales.</p>

<h2>Gym leaders by gym <small>(mean grade / evolution-stage / BST · theme-match % · signature % · common aces)</small></h2>
<table><tr><th>gym</th><th>city</th><th>theme</th><th>grade</th><th>stage</th><th>BST</th><th>theme✓</th><th>sig%</th><th>common aces</th></tr>${gymRows}</table>

<h2>Enemy scaling by role × city <small>(mean grade 4→1, evolution-stage 0→2, BST, foe stat-mult)</small></h2>
<table><tr><th>role</th><th>city</th><th>grade</th><th>stage</th><th>BST</th><th>mult</th><th>n</th></tr>${scaleRows}</table>

<h2>Wild encounters by city <small>(do wilds get stronger?)</small></h2>
<table><tr><th>city</th><th>grade</th><th>stage</th><th>BST</th><th>grade mix</th><th>n</th></tr>${wildRows}</table>

<h2>Trainer-type theming <small>(fraction of team matching the theme type — gym trainers should follow the gym's type)</small></h2>
<table><tr><th>role</th><th>theme✓</th><th>n</th></tr>${themeRows}</table>

<h2>Off-theme gym aces <small>(a gym leader ace whose typing doesn't match the gym theme)</small></h2>
<ul>${offAce}</ul>

<h2>Most common species by role</h2>
<table><tr><th>role</th><th>top species (count)</th></tr>${speciesRows}</table>`;
}

function main() {
  const A = parseArgs(process.argv.slice(2));
  const rows = readEnc(A.in);
  if (!rows.length) { console.error('no encounters in', A.in); process.exit(1); }
  const agg = aggregate(rows);
  writeFileSync(join(A.out, 'content-report.json'), JSON.stringify(agg, null, 2));
  writeFileSync(join(A.out, 'content-dashboard.html'), html(agg));
  console.log(`observed ${agg.counts.foes} enemy mons + ${agg.counts.wilds} wilds across ${agg.counts.seeds} seeds`);
  console.log('theming by role:', agg.theming.map(t => `${t.role} ${Math.round(100 * t.themeMatch)}%`).join(' · '));
  console.log('off-theme aces:', Object.keys(agg.offThemeAces).length);
  console.log(`wrote ${A.out}/content-report.json + content-dashboard.html`);
}
main();
