// ── Battle Mentor / recommender suggestion probe ──────────────────────────────
// Walks a matrix of (Pokémon × evolution stage × game city) and dumps exactly what
// the Battle Mentor + the per-facility recommenders suggest RIGHT NOW, plus an
// objective "suggestion-quality" scorecard. Run it BEFORE a recommender change to
// snapshot the current system, then AFTER to prove the suggestions improved.
//
//   node scripts/debug/mentor-suggestion-probe.mjs                 # writes BEFORE
//   node scripts/debug/mentor-suggestion-probe.mjs --label after   # writes AFTER
//   node scripts/debug/mentor-suggestion-probe.mjs --diff          # BEFORE vs AFTER scorecard
//
// Output: agent-state/mentor-probe/<label>.md  (human-readable report)
//         agent-state/mentor-probe/<label>.json (scorecard for diffing)
//
// Faithful path: it drives the real `enterMentor()` NPC (warms staged pools exactly
// like the game) and reads `_txBuildFastBuildPlan` — the actual Auto-Build the player
// sees — so the report is what the game recommends, not a re-derivation.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../../tests/helpers/load-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', '..', 'agent-state', 'mentor-probe');

const argv = process.argv.slice(2);
const LABEL = (() => { const i = argv.indexOf('--label'); return i >= 0 ? argv[i + 1] : 'before'; })();
const DIFF = argv.includes('--diff');

// ── The matrix ────────────────────────────────────────────────────────────────
// Pass 1 — evolution stages: each line at its plausible city, so we see how the
// recommendation reads a base form vs a mid vs a final.
const EVO_STAGES = [
  { line: 'Grass starter (bulky special)',   forms: [['Bulbasaur', 0], ['Ivysaur', 2], ['Venusaur', 6]] },
  { line: 'Fire starter (mixed/special)',     forms: [['Charmander', 0], ['Charmeleon', 2], ['Charizard', 6]] },
  { line: 'Water starter (bulky)',            forms: [['Squirtle', 0], ['Wartortle', 2], ['Blastoise', 6]] },
  { line: 'Dragon pseudo (physical sweeper)', forms: [['Gible', 2], ['Gabite', 4], ['Garchomp', 7]] },
  { line: 'Ghost (special sweeper)',          forms: [['Gastly', 2], ['Haunter', 4], ['Gengar', 7]] },
  { line: 'Rock/Dark (bulky physical)',       forms: [['Larvitar', 2], ['Pupitar', 4], ['Tyranitar', 7]] },
  { line: 'Normal (HP wall, NFE→final)',      forms: [['Chansey', 4], ['Blissey', 7]] },
  { line: 'Water/Poison (defensive wall)',    forms: [['Mareanie', 4], ['Toxapex', 7]] },
];
// Pass 2 — game progression: the SAME final mon start→end, so we see the Mentor
// grow from moves-only (C0) to the full kit (C7+).
const PROGRESSION = [
  { name: 'Garchomp', cities: [0, 1, 2, 4, 6, 7, 9] },
  { name: 'Venusaur',  cities: [0, 1, 2, 4, 6, 7, 9] },
];

// Probe-reference themed-gym types by city (a DIAGNOSTIC assumption — real runs
// randomize gym typings per run into sm.trainerAssignments). Used only to measure
// "does today's suggestion happen to answer the next gym?"; a matchup-aware
// recommender (Lens A) would read the run's real assignment.
const REFERENCE_GYM_TYPE_BY_CITY = {
  0: 'Rock', 1: 'Water', 2: 'Electric', 3: 'Grass', 4: 'Poison',
  5: 'Psychic', 6: 'Fire', 7: 'Ground', 8: 'Dragon',
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const baseStats = ST.baseStats;
const natureModifiers = ST.natureModifiers();
const typeChart = w.typeChart || {};
// movesDB isn't exposed on window in the harness; ensureMoveData is the live reader.
const moveData = (m) => { try { return w.ensureMoveData(String(m).split('/')[0]) || null; } catch (e) { return null; } };

const eventIndexForCity = (city) => {
  for (let ei = 0; ei <= 160; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) return ei; }
  return 0;
};

function primeSm(name, city, build) {
  ST.sm = {
    active: true, runSeed: 1, _strngState: null,
    badges: Math.max(0, city - 1), gold: 999999, inventory: {},
    settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    storyDifficulty: 'normal', unlockedGimmicks: [],
    eventIndex: eventIndexForCity(city),
    trainerAssignments: {}, gymCleared: {}, profUsed: {},
    facilityIntros: {}, facilitiesSeen: {}, npcStageSeen: {}, scenesShown: {},
    team: [{ name, build: JSON.parse(JSON.stringify(build)), id: 'm1' }],
  };
}

async function primeMentor(name, city, build) {
  primeSm(name, city, build);
  w.StoryMode.enterMentor();
  const host = () => doc.getElementById('story-mentor-team');
  for (let i = 0; i < 50; i++) {
    await wait(30);
    const h = host();
    if (h && (h.querySelector('[data-fastbuild-open]') || h.querySelector('.tx-fastbuild-bar--done'))) break;
  }
  return ST.txBuildFastBuildPlan(0);
}

// ── Analysis helpers ────────────────────────────────────────────────────────
const md = (m) => moveData(m);
const eff = (atk, def) => (typeChart[atk] && typeChart[atk][def] !== undefined) ? typeChart[atk][def] : 1;

// The 4 moves the Mentor would end up with: current build minus the moves its steps
// replace, plus every suggested move.
function resultingMoves(build, plan) {
  const cur = ((build && build.m) || []).filter(Boolean).map((m) => String(m).split('/')[0]);
  const set = cur.slice();
  for (const s of plan.moveSteps || []) {
    const mv = String(s.move).split('/')[0];
    if (s.replaces) {
      const idx = set.indexOf(String(s.replaces).split('/')[0]);
      if (idx >= 0) set[idx] = mv; else set.push(mv);
    } else set.push(mv);
  }
  return [...new Set(set)].slice(0, 4);
}

function part(plan, kind) { return (plan.parts || []).find((p) => p.kind === kind) || null; }

// Objective per-cell "smells" — each is a suggestion-quality defect. The scorecard
// sums them; a better recommender drives them toward 0 (matchup_miss is the metric
// Lens A targets; team_gap_unflagged is Lens B's).
function smells(name, build, plan, city) {
  const base = baseStats[name] || {};
  const atk = base.atk | 0, spa = base.spa | 0;
  const physical = atk >= spa;
  const mainOff = physical ? 'atk' : 'spa', weakOff = physical ? 'spa' : 'atk';
  const ba = w._txBestArchetypeFor(name, null);
  const role = w._txMonRole(null, name);
  const isWall = role && role.coarse === 'wall';
  const out = {};

  // Recommended nature: raises the weaker offense, or lowers the main offense (attackers only).
  const recNat = (part(plan, 'nature') || {}).to || ba.nature;
  const nmod = natureModifiers[recNat];
  if (nmod && !isWall) {
    if (nmod.up === weakOff) out.nature_offense_mismatch = 1;
    if (nmod.down === mainOff) out.nature_lowers_main = 1;
  }

  // Recommended EV spread: invests the weaker offense while ignoring the main (attackers).
  if (ba && ba.evs && !isWall) {
    if ((ba.evs[weakOff] | 0) > 0 && (ba.evs[mainOff] | 0) === 0) out.ev_offense_mismatch = 1;
  }

  // Resulting moveset quality.
  const moves = resultingMoves(build, plan);
  const dmg = moves.map(md).filter((m) => m && (m.cat === 'Physical' || m.cat === 'Special'));
  const types = [base.t1, base.t2].filter(Boolean);
  const hasStab = dmg.some((m) => types.includes(m.type));
  if (dmg.length && !hasStab) out.moves_no_stab = 1;
  // wrong-category filler: a damaging move off the main stat that isn't real coverage (BP<70).
  out.moves_wrong_cat = dmg.filter((m) => (m.cat === 'Physical') !== physical && (m.pow | 0) < 70).length || undefined;
  // weak filler: a chosen damaging move with tiny BP and no priority (e.g. Mud-Slap 20,
  // Fury Cutter 10) — a smarter rec prefers a 2nd STAB or a good status over these.
  out.filler_low_bp = dmg.filter((m) => (m.pow | 0) > 0 && (m.pow | 0) < 45 && !(m.pri > 0)).length || undefined;

  // Matchup miss (diagnostic): at a pre-gym city, no damaging move is SE vs the reference gym type.
  const gymT = REFERENCE_GYM_TYPE_BY_CITY[city];
  if (gymT && dmg.length) {
    const answers = dmg.some((m) => eff(m.type, gymT) > 1);
    if (!answers) out.matchup_miss = 1;
  }
  return out;
}

// ── Report rendering ──────────────────────────────────────────────────────────
function fmtMoveStep(s) {
  const mv = String(s.move).split('/')[0];
  const where = s.replaces ? `replaces ${String(s.replaces).split('/')[0]}` : 'open slot';
  return `      + ${mv.padEnd(18)} (${where}) ${((s.cost | 0)).toLocaleString()}G`;
}
function fmtPart(p) {
  if (p.kind === 'evfocus') return `    EV focus:  train ${p.to} (free, from battles)`;
  return `    ${p.label.padEnd(9)} ${String(p.from)} → ${p.to}  ${((p.cost | 0)).toLocaleString()}G`;
}

async function runCell(name, city, buildIn, lines, tally) {
  const build = buildIn || { m: ['Tackle'], n: 'Hardy', a: (baseStats[name] && baseStats[name].abilities && baseStats[name].abilities['0']) || 'Overgrow' };
  let plan;
  try { plan = await primeMentor(name, city, build); } catch (e) { lines.push(`### ${name} @ City ${city} — ERROR: ${e.message}`); return; }
  if (!plan) { lines.push(`### ${name} @ City ${city} — no plan (mon unbuildable?)`); return; }
  const role = w._txMonRole(null, name);
  const ba = w._txBestArchetypeFor(name, null);
  const evStr = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].filter((k) => (ba.evs[k] | 0) > 0).map((k) => `${ba.evs[k]} ${k.toUpperCase()}`).join(' / ') || '—';
  const s = smells(name, build, plan, city);
  const smellStr = Object.keys(s).filter((k) => s[k]).map((k) => `${k}×${s[k]}`).join(', ') || 'clean';
  for (const k of Object.keys(s)) if (s[k]) tally[k] = (tally[k] || 0) + s[k];

  lines.push(`### ${name} @ City ${city}`);
  lines.push(`  role: **${role.label}** (${role.why})  ·  archetype: ${ba.archetype || '—'}`);
  lines.push(`  canonical nature/EV: ${ba.nature} · ${evStr}`);
  lines.push(`  Auto-Build plan — total ${((plan.total | 0)).toLocaleString()}G:`);
  if ((plan.moveSteps || []).length) { lines.push('    Moves:'); for (const st of plan.moveSteps) lines.push(fmtMoveStep(st)); }
  else lines.push('    Moves: (already optimal / none suggested)');
  for (const p of plan.parts || []) if (p.kind !== 'evfocus') lines.push(fmtPart(p));
  const evfocus = part(plan, 'evfocus'); if (evfocus) lines.push(fmtPart(evfocus));
  if ((plan.locked || []).length) lines.push(`    Locked: ${plan.locked.map((l) => l.kind).join(', ')}`);
  lines.push(`  resulting moves: ${resultingMoves(build, plan).join(', ')}`);
  lines.push(`  ⚑ smells: ${smellStr}`);
  lines.push('');
}

// Team-level probe (Lens B target): a sample 6-mon team with a deliberate shared
// Ground weakness + no hazard removal. Reports whether the Mentor surfaces it.
async function runTeamProbe(lines, tally) {
  const team = ['Charizard', 'Gengar', 'Magnezone', 'Heatran', 'Salamence', 'Volcarona']
    .filter((n) => baseStats[n]).map((n, i) => ({ name: n, build: { m: ['Tackle'], n: 'Hardy', a: (baseStats[n].abilities && baseStats[n].abilities['0']) || '' }, id: 'tm' + i }));
  primeSm('Charizard', 7, team[0].build);
  ST.sm.team = team;
  w.StoryMode.enterMentor();
  const host = doc.getElementById('story-mentor-team');
  for (let i = 0; i < 50; i++) { await wait(30); if (host && host.querySelector('[data-fastbuild-open], .tx-fastbuild-bar--done')) break; }
  // Compute the true shared weakness the Mentor SHOULD flag.
  const counts = {};
  for (const t of team) {
    const b = baseStats[t.name] || {}; const ts = [b.t1, b.t2].filter(Boolean);
    for (const atkT of Object.keys(typeChart)) {
      const m = ts.reduce((x, dt) => x * eff(atkT, dt), 1);
      if (m > 1) counts[atkT] = (counts[atkT] || 0) + 1;
    }
  }
  const worst = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
  const bannerTxt = host ? (host.querySelector('.tx-mentor-banner') || {}).textContent || '' : '';
  const flagsWeakness = /weak|weakness|Ground|coverage|hazard|team/i.test(bannerTxt) && /\b(weak|hazard|coverage)\b/i.test(bannerTxt);
  lines.push('## Team-level probe (6-mon, deliberate shared Ground weakness)');
  lines.push(`  team: ${team.map((t) => t.name).join(', ')}`);
  lines.push(`  true worst shared weakness: **${worst[0]}** (${worst[1]}/${team.length} mons weak)`);
  lines.push(`  Mentor banner: "${bannerTxt.trim()}"`);
  lines.push(`  ⚑ team_gap_unflagged: ${flagsWeakness ? 0 : 1}  (Mentor ${flagsWeakness ? 'surfaces' : 'does NOT surface'} the shared weakness)`);
  lines.push('');
  if (!flagsWeakness) tally.team_gap_unflagged = (tally.team_gap_unflagged || 0) + 1;
}

// ── Diff mode ───────────────────────────────────────────────────────────────
if (DIFF) {
  const b = JSON.parse(readFileSync(join(OUT_DIR, 'before.json'), 'utf8'));
  const a = JSON.parse(readFileSync(join(OUT_DIR, 'after.json'), 'utf8'));
  const keys = [...new Set([...Object.keys(b.tally), ...Object.keys(a.tally)])].sort();
  console.log('\nSCORECARD DIFF  (lower = better suggestions)\n');
  console.log('  metric'.padEnd(30) + 'before   after   Δ');
  for (const k of keys) {
    const bv = b.tally[k] || 0, av = a.tally[k] || 0, d = av - bv;
    console.log('  ' + k.padEnd(28) + String(bv).padEnd(9) + String(av).padEnd(8) + (d === 0 ? '·' : (d < 0 ? `${d} ✅` : `+${d} ⚠`)));
  }
  const bt = Object.values(b.tally).reduce((s, v) => s + v, 0), at = Object.values(a.tally).reduce((s, v) => s + v, 0);
  console.log('  ' + 'TOTAL'.padEnd(28) + String(bt).padEnd(9) + String(at).padEnd(8) + (at <= bt ? `${at - bt} ✅` : `+${at - bt} ⚠`));
  process.exit(0);
}

// ── Run ───────────────────────────────────────────────────────────────────────
const lines = [];
const tally = {};
lines.push(`# Battle Mentor suggestion probe — ${LABEL.toUpperCase()}`);
lines.push(`> Generated ${new Date().toISOString()}. Faithful \`enterMentor()\` path.`);
lines.push(`> smells = objective suggestion-quality defects (lower is better). matchup_miss uses the probe's reference gym themes (diagnostic).`);
lines.push('');

lines.push('## Pass 1 — evolution stages (base → mid → final)');
lines.push('');
for (const grp of EVO_STAGES) {
  lines.push(`## ${grp.line}`);
  lines.push('');
  for (const [name, city] of grp.forms) {
    if (!baseStats[name]) { lines.push(`### ${name} — not in dex, skipped\n`); continue; }
    await runCell(name, city, null, lines, tally);
  }
}

lines.push('## Pass 2 — same final mon from start to endgame');
lines.push('');
for (const grp of PROGRESSION) {
  if (!baseStats[grp.name]) continue;
  lines.push(`## ${grp.name} across the campaign`);
  lines.push('');
  for (const city of grp.cities) await runCell(grp.name, city, null, lines, tally);
}

await runTeamProbe(lines, tally);

// Scorecard footer.
lines.push('## Scorecard (this run)');
const totalSmells = Object.values(tally).reduce((s, v) => s + v, 0);
lines.push('```');
for (const k of Object.keys(tally).sort()) lines.push(`  ${k.padEnd(26)} ${tally[k]}`);
lines.push(`  ${'TOTAL'.padEnd(26)} ${totalSmells}`);
lines.push('```');

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, `${LABEL}.md`), lines.join('\n'));
writeFileSync(join(OUT_DIR, `${LABEL}.json`), JSON.stringify({ label: LABEL, tally, generated: new Date().toISOString() }, null, 2));

console.log(`\n[${LABEL}] report → agent-state/mentor-probe/${LABEL}.md`);
console.log(`[${LABEL}] scorecard:`);
for (const k of Object.keys(tally).sort()) console.log(`   ${k.padEnd(26)} ${tally[k]}`);
console.log(`   ${'TOTAL'.padEnd(26)} ${totalSmells}`);

eng.teardown();
process.exit(0);
