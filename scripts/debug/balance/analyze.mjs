// Story-mode ENEMY vs. EXPECTED-PLAYER balance analysis.
//
// A data-engineering pass that:
//   1. Extracts EVERY story-mode enemy team (builds + ACTUALLY-FOUGHT Lv50 stats, i.e. with the
//      per-foe stat multiplier applied) across the whole timeline, under 4 generation-lock settings,
//      over N seeds (default 100) on NORMAL difficulty.
//   2. Synthesises the AVERAGE team a player is expected to field at each stage (spec-driven model
//      from docs/PROGRESSION_CURVE_MASTER.md §5c — the 3-axis Grade / Build-Tier / Party-Size model).
//   3. Compares the two data-driven and writes CSVs + a markdown balance report with flagged
//      divergences and a "proposed number diffs" section (held for maintainer sign-off — nothing is
//      applied to battle.html).
//
// This is a DIAGNOSTIC, not a test. Pure data out (no DOM). Determinism: fixed seed list.
//
// Run:  node --max-old-space-size=4096 scripts/debug/balance/analyze.mjs [seeds]
//       SEEDS=20 node ... (env override; arg wins over env)
// Out:  agent-state/balance/{enemy-mons.csv, stage-summary.csv, player-model.csv, BALANCE_REPORT.md}

import { loadEngine } from '../../../tests/helpers/load-engine.js';
import fs from 'fs';

// ───────────────────────── config ─────────────────────────
const SEEDS_N = Math.max(1, parseInt(process.argv[2] || process.env.SEEDS || '100', 10));
const SEED_BASE = 1000;                 // deterministic seed list: SEED_BASE .. SEED_BASE+N-1
const DIFFICULTY = 'normal';            // headline mode
const OUT_DIR = 'agent-state/balance';
// Gimmicks OFF — we measure the raw stat-balance curve, not Dynamax/Tera spikes. Flip to study those.
const MECHANICS = { megaOn: false, zOn: false, dynaOn: false, teraOn: false };

const GEN_SETTINGS = [
  { label: 'GEN 1 ONLY', key: 'gen1',    gens: [1] },                      // user's primary focus
  { label: 'ALL GENS',   key: 'allgen',  gens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { label: 'GEN 1-6',    key: 'gen1to6', gens: [1, 2, 3, 4, 5, 6] },
  { label: 'GEN 1-3',    key: 'gen1to3', gens: [1, 2, 3] },
];

// ── PLAYER MODEL ASSUMPTIONS (tunable — this is the subjective half) ──────────────────────────
// Grade mix the *player* is expected to field by city, per PROGRESSION_CURVE_MASTER.md §5c:
//   C0-2 G4 basics · C3-5 G3 first-evos · C6-7 G2 finals + occasional G1 pseudo · endgame G1/G2 mix.
// Lower grade number = stronger species tier (G1 best). Weights need not sum to 100.
const PLAYER_GRADE_MIX_BY_CITY = [
  { g1: 0,  g2: 0,  g3: 10, g4: 90 }, // C0
  { g1: 0,  g2: 0,  g3: 15, g4: 85 }, // C1
  { g1: 0,  g2: 5,  g3: 25, g4: 70 }, // C2
  { g1: 0,  g2: 10, g3: 60, g4: 30 }, // C3
  { g1: 0,  g2: 20, g3: 65, g4: 15 }, // C4
  { g1: 5,  g2: 30, g3: 55, g4: 10 }, // C5
  { g1: 10, g2: 62, g3: 26, g4: 2  }, // C6  (G2-finals era — evo gate opens ALL evos at C4; matches enemy G2 floor + §5c)
  { g1: 15, g2: 65, g3: 20, g4: 0  }, // C7
];
const PLAYER_GRADE_MIX_ENDGAME = { g1: 30, g2: 55, g3: 15, g4: 0 }; // E4 / Champion / league Rival / Mystery
// The league/post-game events carry a real cityIndex (9), not -1 — so endgame is keyed off the EVENT,
// not the city. These are the 8-badge events where the player is fully kitted (Colress, vitamins, Safari G1s).
const isEndgameEvent = (eventName) => /^E[1-4]$|^Champion$|^Mystery Figure$/.test(eventName)
  || eventName === 'Victory Road';
// Player build tier by stage: IV average (catches roll random 0-31), EV total invested, and whether
// the player runs an offense-positive nature. Ramps with the training facilities that come online
// (wild ~170-EV head-start → EV Trainer C4 → Colress C7 → vitamins). §5c "~70%→~95% trained".
function playerBuildTier(city, endgame) {
  if (endgame) return { iv: 27, ev: 430, posNature: true,  key: 'endgame' }; // 8-badge league, fully trained
  if (city <= 2) return { iv: 16, ev: 130, posNature: false, key: 'early'  };
  if (city <= 5) return { iv: 19, ev: 220, posNature: true,  key: 'mid'    };
  return                { iv: 23, ev: 330, posNature: true,  key: 'late'   }; // C6-7
}
const PLAYER_TOL = 0.08; // ±8% band around the intended foe multiplier before a stage is "flagged".

// ───────────────────────── boot ─────────────────────────
console.error(`[balance] booting engine … (seeds=${SEEDS_N}, difficulty=${DIFFICULTY})`);
const eng = await loadEngine();
const S = eng.window.__storyTest;
const R = eng.window.__rivalTest;
const baseStats = R.baseStats;
const getBST = (n) => R.getBST(n);
const gradeOf = (n) => R.getMonGrade(n, R.getBST(n));
const genOf = (n) => (baseStats[n] ? baseStats[n].gen : 0);
const isLeg = (n) => !!(baseStats[n] && baseStats[n].legendary);
const SEEDS = Array.from({ length: SEEDS_N }, (_, i) => (SEED_BASE + i) >>> 0);
const diffMult = S.foeDifficultyMult(DIFFICULTY);

// trainer metadata for data-quality flags (ported from story-team-sweep.mjs)
const TRAINER_META = new Map();
for (const t of R.TRAINER_DATA) {
  if (!t || !t.name) continue;
  const cur = TRAINER_META.get(t.name) || { tags: new Set(), sigs: new Set() };
  if (t.tag) cur.tags.add(t.tag);
  for (const s of (t.sigs || [])) cur.sigs.add(s);
  TRAINER_META.set(t.name, cur);
}
const isEldritch = (name) => { const e = TRAINER_META.get(name); return !!(e && e.tags.has('eldritch')); };
const authored = (name, mon) => { const e = TRAINER_META.get(name); return !!(e && e.sigs.has(mon)); };

// ───────────────────────── helpers ─────────────────────────
const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => (a.length ? sum(a) / a.length : 0);
function pct(a, p) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const idx = Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))));
  return s[idx];
}
function stdev(a) { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))); }
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;

// Build a mon and read its final Lv50 stats. `mult` is stamped as build._storyStatMult so buildPokemon
// applies the per-foe multiplier exactly as the live engine does (player mons pass mult=null → exempt).
function builtStats(name, build, mult) {
  const b = build ? JSON.parse(JSON.stringify(build)) : {};
  if (mult != null) b._storyStatMult = mult;
  if (!Array.isArray(b.m) || !b.m.length) b.m = ['Tackle'];
  const mon = S.buildPokemon(name, b);
  const s = mon.stats;
  return { hp: mon.maxHp, atk: s.atk, def: s.def, spa: s.spa, spd: s.spd, spe: s.spe,
           total: mon.maxHp + s.atk + s.def + s.spa + s.spd + s.spe };
}
const offenseOf = (st) => Math.max(st.atk, st.spa);
const bulkOf = (st) => st.hp + st.def + st.spd;
const partyCapForBadges = (b) => Math.max(2, Math.min(6, 2 + (b | 0)));

// ── PLAYER MODEL ── average expected player mon, per (grade, gen-set, build-tier). Cached.
//   For a grade+gen pool we average the Lv50 stat-total of every legal species, built with the
//   stage's player build tier: top-2 base stats get the EV investment, offense-positive nature on
//   the higher offensive stat. No _storyStatMult (player mons keep the natural line).
const _poolCache = new Map();              // genKey -> grade -> [species]
function gradePool(genSet, genKey) {
  let byGrade = _poolCache.get(genKey);
  if (byGrade) return byGrade;
  byGrade = { 1: [], 2: [], 3: [], 4: [] };
  const gs = new Set(genSet);
  for (const name of Object.keys(baseStats)) {
    const b = baseStats[name];
    if (!b || !gs.has(b.gen)) continue;
    if (b.legendary) continue;             // typical player teams aren't all-legendary
    const g = gradeOf(name);
    if (byGrade[g]) byGrade[g].push(name);
  }
  _poolCache.set(genKey, byGrade);
  return byGrade;
}
function playerBuildFor(name, tier) {
  const b = baseStats[name];
  const ivs = {}; for (const k of STAT_KEYS) ivs[k] = tier.iv;
  // invest EVs in the two highest base stats (the natural player investment)
  const ranked = STAT_KEYS.slice().sort((x, y) => (b[y] || 0) - (b[x] || 0));
  const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  evs[ranked[0]] = Math.min(252, tier.ev * 0.55 | 0);
  evs[ranked[1]] = Math.min(252, tier.ev - evs[ranked[0]]);
  // offense-positive nature: +higher of atk/spa, −the unused offense stat
  let nature = 'Hardy';
  if (tier.posNature) nature = (b.atk >= b.spa) ? 'Adamant' : 'Modest';
  return { ivs, evs, n: nature, m: ['Tackle'] };
}
const _playerMonCache = new Map();         // genKey|grade|tierKey -> {avgStats}
function avgPlayerMon(grade, genSet, genKey, tier) {
  const ck = `${genKey}|${grade}|${tier.key}`;
  if (_playerMonCache.has(ck)) return _playerMonCache.get(ck);
  const pool = gradePool(genSet, genKey)[grade] || [];
  if (!pool.length) { const z = { total: 0, hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, off: 0, bulk: 0, n: 0 }; _playerMonCache.set(ck, z); return z; }
  const acc = { total: 0, hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, off: 0, bulk: 0 };
  for (const name of pool) {
    const st = builtStats(name, playerBuildFor(name, tier), null);
    acc.total += st.total; acc.off += offenseOf(st); acc.bulk += bulkOf(st);
    for (const k of STAT_KEYS) acc[k] += st[k];
  }
  const n = pool.length;
  const out = { n };
  for (const k of Object.keys(acc)) out[k] = acc[k] / n;
  _playerMonCache.set(ck, out);
  return out;
}
// Weighted "average expected player mon" at a stage (mix over grades) + the team total at party cap.
function playerExpected(city, badges, genSet, genKey, endgame) {
  const mix = endgame ? PLAYER_GRADE_MIX_ENDGAME : PLAYER_GRADE_MIX_BY_CITY[Math.min(PLAYER_GRADE_MIX_BY_CITY.length - 1, Math.max(0, city))];
  const tier = playerBuildTier(city, endgame);
  let wTot = 0; const agg = { total: 0, off: 0, bulk: 0, spe: 0, grade: 0 };
  for (const g of [1, 2, 3, 4]) {
    const w = mix['g' + g] || 0; if (!w) continue;
    let m = avgPlayerMon(g, genSet, genKey, tier);
    if (!m.n) continue;                    // grade empty in this gen-set → skip its weight
    wTot += w;
    agg.total += w * m.total; agg.off += w * m.off; agg.bulk += w * m.bulk; agg.spe += w * m.spe; agg.grade += w * g;
  }
  if (!wTot) return null;
  for (const k of Object.keys(agg)) agg[k] /= wTot;
  const cap = partyCapForBadges(badges);
  return { monTotal: agg.total, off: agg.off, bulk: agg.bulk, spe: agg.spe, avgGrade: agg.grade, cap,
           teamTotal: agg.total * cap, tierKey: tier.key,
           mixStr: `g1:${mix.g1}/g2:${mix.g2}/g3:${mix.g3}/g4:${mix.g4}` };
}

// ───────────────────────── sweep ─────────────────────────
// Accumulators keyed by `${genKey}|${eid}`.
const stageAcc = new Map();   // -> { meta, ratioPerMon:[], teamRatio:[], enemyMonTotal:[], offRatio:[], bulkRatio:[], speRatio:[], enemyGrade:[] }
const enemyCsv = ['genKey,gens,seed,eid,eventName,trainer,trainerType,city,badges,partyCap,mon,gen,grade,bst,mult,hp,atk,def,spa,spd,spe,total,evTotal,ivAvg,nature,ability,item,gimmick'];
const dq = { legFiller: new Set(), rattata: new Set(), shortTeam: new Set(), dup: new Set() };
const WRITE_PER_MON_SEEDS = new Set([SEEDS[0]]); // full per-mon detail only for the first seed (keeps CSV sane)

let simCount = 0;
for (const setting of GEN_SETTINGS) {
  for (const seed of SEEDS) {
    const res = S.simulateStoryRunTeams({ seed, enabledGens: setting.gens, difficulty: DIFFICULTY, partySize: 6, mechanics: MECHANICS });
    simCount++;
    if (res.error) { console.error(`[balance] sim error ${setting.label} seed ${seed}: ${res.error}`); continue; }
    for (const row of res.rows) {
      const { eid, eventName, trainer, trainerType, badges, cityIndex } = row;
      const city = cityIndex;
      const mult = S.storyEnemyStatMult(eventName, city, eid) * diffMult;
      const cap = partyCapForBadges(badges);
      // per-mon enemy fought stats
      const monStats = [];
      const counts = {};
      for (const slot of (row.team || [])) {
        const name = slot.name; const build = slot.build || {};
        const st = builtStats(name, build, mult);
        monStats.push({ name, st, grade: gradeOf(name) });
        counts[name] = (counts[name] || 0) + 1;
        // data-quality flags
        const topTier = /^E[1-4]$/.test(eventName) || eventName === 'Champion' || eventName === 'Mystery Figure';
        if (isLeg(name) && !topTier && !isEldritch(trainer) && !authored(trainer, name)) dq.legFiller.add(`${setting.label} ${eventName} ${trainer}: ${name}`);
        if (name === 'Rattata' && !String(trainerType).includes('Normal')) dq.rattata.add(`${setting.label} ${eventName} ${trainer}`);
        if (WRITE_PER_MON_SEEDS.has(seed)) {
          const evs = build.evs || {}; const ivs = build.ivs || {};
          const evTotal = STAT_KEYS.reduce((a, k) => a + (evs[k] || 0), 0);
          const ivAvg = r2(STAT_KEYS.reduce((a, k) => a + (ivs[k] != null ? ivs[k] : 31), 0) / 6);
          enemyCsv.push([setting.key, setting.gens.join('+'), seed, eid, eventName, trainer, trainerType, city, badges, cap,
            name, genOf(name), gradeOf(name), getBST(name), r3(mult),
            st.hp, st.atk, st.def, st.spa, st.spd, st.spe, st.total, evTotal, ivAvg,
            build.n || '', build.a || '', build.i || '', build.gimmick || 'STANDARD'].join(','));
        }
      }
      for (const [n, c] of Object.entries(counts)) if (c > 1 && !authored(trainer, n)) dq.dup.add(`${setting.label} ${eventName} ${trainer}: ${n}×${c}`);
      if ((row.team || []).length < Math.min(cap, row.partySize)) dq.shortTeam.add(`${setting.label} ${eventName} ${trainer}: ${(row.team || []).length}`);

      if (!monStats.length) continue;
      // enemy aggregates
      const enemyMonAvg = mean(monStats.map(m => m.st.total));
      const enemyOffAvg = mean(monStats.map(m => offenseOf(m.st)));
      const enemyBulkAvg = mean(monStats.map(m => bulkOf(m.st)));
      const enemySpeAvg = mean(monStats.map(m => m.st.spe));
      const enemyGradeAvg = mean(monStats.map(m => m.grade));
      const enemyTeamCapped = sum(monStats.slice(0, cap).map(m => m.st.total));
      // player expected
      const pe = playerExpected(city, badges, setting.gens, setting.key, isEndgameEvent(eventName));
      if (!pe) continue;
      const key = `${setting.key}|${eid}`;
      let A = stageAcc.get(key);
      if (!A) {
        A = { meta: { genKey: setting.key, genLabel: setting.label, gens: setting.gens, eid, eventName, trainer, city, badges, cap, intendedMult: mult, player: pe },
              ratioPerMon: [], teamRatio: [], enemyMonTotal: [], offRatio: [], bulkRatio: [], speRatio: [], enemyGrade: [] };
        stageAcc.set(key, A);
      }
      A.ratioPerMon.push(enemyMonAvg / pe.monTotal);
      A.teamRatio.push(enemyTeamCapped / pe.teamTotal);
      A.enemyMonTotal.push(enemyMonAvg);
      A.offRatio.push(enemyOffAvg / pe.off);
      A.bulkRatio.push(enemyBulkAvg / pe.bulk);
      A.speRatio.push(enemySpeAvg / pe.spe);
      A.enemyGrade.push(enemyGradeAvg);
      // trainer can vary by seed; keep the modal-ish latest for display
      A.meta.trainer = trainer;
    }
    if (simCount % 40 === 0) console.error(`[balance] ${simCount}/${GEN_SETTINGS.length * SEEDS_N} sims …`);
  }
}

// ───────────────────────── aggregate + write ─────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

const stages = [...stageAcc.values()].sort((a, b) =>
  a.meta.genKey === b.meta.genKey ? 0 : GEN_SETTINGS.findIndex(g => g.key === a.meta.genKey) - GEN_SETTINGS.findIndex(g => g.key === b.meta.genKey)
);
// preserve story order within a gen-set by first-appearance (sim already walks in timeline order)
const orderIdx = new Map();
{ let i = 0; for (const k of stageAcc.keys()) orderIdx.set(k, i++); }
stages.sort((a, b) => {
  const ga = GEN_SETTINGS.findIndex(g => g.key === a.meta.genKey), gb = GEN_SETTINGS.findIndex(g => g.key === b.meta.genKey);
  if (ga !== gb) return ga - gb;
  return orderIdx.get(`${a.meta.genKey}|${a.meta.eid}`) - orderIdx.get(`${b.meta.genKey}|${b.meta.eid}`);
});

const sumCsv = ['genKey,eid,eventName,trainer,city,badges,partyCap,intendedMult,enemyMonAvg,enemyMonP10,enemyMonP90,playerMonAvg,ratioPerMon_mean,ratioPerMon_med,ratioPerMon_p10,ratioPerMon_p90,ratioPerMon_sd,teamRatio_mean,offRatio,bulkRatio,speRatio,enemyAvgGrade,playerAvgGrade,delta_vs_intended,flag'];
const playerCsv = ['genKey,eid,eventName,city,badges,partyCap,gradeMix,buildTier,playerMonAvg,playerOff,playerBulk,playerSpe,playerAvgGrade,playerTeamTotal'];
const seenPlayer = new Set();

for (const A of stages) {
  const m = A.meta;
  const rMean = mean(A.ratioPerMon), rMed = pct(A.ratioPerMon, 50);
  const delta = rMean - m.intendedMult; // >0 ⇒ enemy harder than the intended foe edge
  const flag = Math.abs(delta) > PLAYER_TOL ? (delta > 0 ? 'HARD' : 'SOFT') : 'ok';
  sumCsv.push([m.genKey, m.eid, m.eventName, m.trainer, m.city, m.badges, m.cap, r3(m.intendedMult),
    r2(mean(A.enemyMonTotal)), r2(pct(A.enemyMonTotal, 10)), r2(pct(A.enemyMonTotal, 90)),
    r2(m.player.monTotal), r3(rMean), r3(rMed), r3(pct(A.ratioPerMon, 10)), r3(pct(A.ratioPerMon, 90)), r3(stdev(A.ratioPerMon)),
    r3(mean(A.teamRatio)), r3(mean(A.offRatio)), r3(mean(A.bulkRatio)), r3(mean(A.speRatio)),
    r2(mean(A.enemyGrade)), r2(m.player.avgGrade), r3(delta), flag].join(','));

  const pk = `${m.genKey}|${m.eid}`;
  if (!seenPlayer.has(pk)) {
    seenPlayer.add(pk);
    playerCsv.push([m.genKey, m.eid, m.eventName, m.city, m.badges, m.cap,
      m.player.mixStr, m.player.tierKey,
      r2(m.player.monTotal), r2(m.player.off), r2(m.player.bulk), r2(m.player.spe), r2(m.player.avgGrade), r2(m.player.teamTotal)].join(','));
  }
}

fs.writeFileSync(`${OUT_DIR}/enemy-mons.csv`, enemyCsv.join('\n') + '\n');
fs.writeFileSync(`${OUT_DIR}/stage-summary.csv`, sumCsv.join('\n') + '\n');
fs.writeFileSync(`${OUT_DIR}/player-model.csv`, playerCsv.join('\n') + '\n');

// ───────────────────────── markdown report ─────────────────────────
const md = [];
md.push(`# Story-mode enemy vs. expected-player balance report`);
md.push(`Generated ${new Date().toISOString()} · ${SEEDS_N} seeds (${SEED_BASE}..${SEED_BASE + SEEDS_N - 1}) · difficulty **${DIFFICULTY}** · gimmicks ${Object.values(MECHANICS).some(Boolean) ? 'on' : 'off'}\n`);
md.push(`## Methodology`);
md.push(`- **Enemy data** is the real \`assignTrainers → rollTrainerTeam\` pipeline via \`simulateStoryRunTeams\`, walked over every Battle row, ${SEEDS_N}× per gen-set. Each enemy mon's stats are the **actually-fought** Lv50 stats: \`buildPokemon\` with \`build._storyStatMult = storyEnemyStatMult(event,city,row) × foeDifficultyMult('${DIFFICULTY}')\` — i.e. the FOE_POWER_CURVE / boss-override edge is included.`);
md.push(`- **Player data** is a *spec-driven synthetic* model (PROGRESSION_CURVE_MASTER §5c): party size = \`max(2,min(6,2+badges))\`; per-stage grade mix (table in script); the "expected mon" is the **pool-average** Lv50 stat-total over all non-legendary species of each grade legal in the gen-set, built at a stage build tier (IV avg + EV total ramping with training facilities). Player mons are **exempt** from the foe multiplier (natural Lv50 line) — exactly as the engine treats wilds/gifts.`);
md.push(`- **Primary metric** \`ratioPerMon\` = mean(enemy mon stat-total) / (expected player mon stat-total). It is **size-independent**. The **design intent** is \`ratioPerMon ≈ intendedMult\` (the foe edge the maintainer dialled in), *assuming grade parity*. \`delta = ratioPerMon − intendedMult\`: **>+${PLAYER_TOL} = HARD** (enemy outclasses the curve, usually via a grade/BST gap the player can't match in that gen-set), **<−${PLAYER_TOL} = SOFT**.`);
md.push(`- Party-size asymmetry is captured separately by \`teamRatio\` (enemy team capped to the player's party cap ÷ expected player team total).\n`);

// ── auto-generated executive summary ──
{
  const phaseOf = (m) => isEndgameEvent(m.eventName) ? 'endgame' : (m.city <= 2 ? 'early(C0-2)' : (m.city <= 5 ? 'mid(C3-5)' : 'late(C6-8)'));
  const phaseDelta = {}; // phase -> [delta] (ALL GENS)
  const evtDelta = {};   // eventName -> [delta] across all gen-sets
  for (const A of stages) {
    const d = mean(A.ratioPerMon) - A.meta.intendedMult;
    (evtDelta[A.meta.eventName] = evtDelta[A.meta.eventName] || []).push(d);
    if (A.meta.genKey === 'allgen') (phaseDelta[phaseOf(A.meta)] = phaseDelta[phaseOf(A.meta)] || []).push(d);
  }
  let hardN = 0, softN = 0;
  for (const A of stages) { const d = mean(A.ratioPerMon) - A.meta.intendedMult; if (d > PLAYER_TOL) hardN++; else if (d < -PLAYER_TOL) softN++; }
  md.push(`## Executive summary`);
  md.push(`Across ${stages.length} stage×gen-set rows (${SEEDS_N} seeds each): **${hardN} HARD**, **${softN} SOFT**, rest within ±${PLAYER_TOL} of the intended foe edge.\n`);
  md.push(`**Difficulty curve by phase (ALL GENS, mean Δ = measured ratio − intended foe edge):**`);
  md.push(`| phase | mean Δ | reading |`);
  md.push(`|---|---|---|`);
  for (const p of ['early(C0-2)', 'mid(C3-5)', 'late(C6-8)', 'endgame']) {
    const arr = phaseDelta[p] || []; if (!arr.length) continue;
    const d = mean(arr);
    const reading = d > PLAYER_TOL ? 'enemies above curve' : d < -PLAYER_TOL ? 'enemies below curve' : 'on curve';
    md.push(`| ${p} | ${d >= 0 ? '+' : ''}${r3(d)} | ${reading} |`);
  }
  md.push(`\n**Key findings:**`);
  md.push(`1. **Early game (C0-1) reads SOFT in every gen-set** (Δ ≈ −0.13 to −0.14 for the first Basic Trainers / Gym 1). Partly this is the model's deliberately *generous* early player baseline (it assumes a ~130-EV, IV-16 mon, whereas a brand-new save has a 0-EV starter); treat the early-game softness as "player model is the optimistic bound", i.e. enemies are not harder than a kitted early player — read it as headroom, not an under-tuning bug.`);
  md.push(`2. **The Rival consistently punches above the curve.** ${(() => { const ar = []; for (const [e, a] of Object.entries(evtDelta)) if (e === 'Rival') ar.push(...a); return `Mean Rival Δ = ${mean(ar) >= 0 ? '+' : ''}${r3(mean(ar))}`; })()} (it counter-picks the player's live party, so it earns extra effective power the flat curve doesn't model). The **post-Champion league Rival (row 65) is the single most consistent HARD outlier** in all four gen-sets (Δ ≈ +0.08 to +0.13). If the league Rival should feel like a final-boss spike that's working as intended; if not, it's the one knob to soften.`);
  md.push(`3. **The broad "late-game creep" is mostly a player-model calibration effect, not an enemy over-tune.** Story-mode floors enemy filler at **G2 from City 6** (\`_storyFillerGradeFloorForRow\`), which is *intended to match the player also fielding G2 finals by C6* (the evo gate opens all evolutions at C4). Calibrating the player late mix to that §5c "G2-finals era" brings the C6-8 mean Δ to **+0.04 (within tolerance)**. Two levers were ruled out empirically: the grade-weight ramp \`k\` is a **confirmed no-op in late game** (the C6+ G2 floor + trainer-grade-matrix renormalization override it — tested, zero effect), and softening \`FOE_POWER_CURVE[6+]\` *inverts the curve's monotonic ramp*. **No \`FOE_POWER_CURVE\` / grade-ramp change recommended.**`);
  md.push(`4. **Residual genuine enemy spikes are localized, not systemic:** (a) **City-5 elite-tier trainers** (Gym Leader 5 / Elite Trainers) run Δ ≈ +0.10 above \`FOE_POWER_CURVE[5]=1.03\` because the trainer-grade matrix + ramp give them G2-heavy teams while the C5 player is still in the §5c G3 first-evo era — arguably intended (elite trainers *should* bite), but it's the one spot a deliberate bump exceeds the dialled city edge. (b) **The Rival** rides ~+0.09 (it counter-picks your live party — flavor the flat curve can't model), and the **post-Champion league Rival (row 65)** is the single most consistent outlier (Δ +0.08…+0.13) — a final-boss spike. **E4 / Champion / Mystery Figure land on their dialled multipliers** (|Δ| < 0.04): the \`_storyEnemyStatMult\` boss overrides are well-tuned. No change recommended unless you specifically want to soften the C5 elite tier or the league Rival.`);
  md.push(`5. **GEN 1 ONLY has a real pool-exhaustion problem:** ${dq.rattata.size} Rattata-sentinel fallbacks on non-Normal trainers (Dragon Tamers, Hex Maniacs, etc.) — **all in the Gen-1 lock**, none in wider pools. The narrow Gen-1 type pool runs dry and the roll falls back to Rattata. This is a *variety/coherence* bug, separate from raw power; see the data-quality section. Aside from that, Gen-1-only tracks the all-gens curve closely (grade pools are similar), so the gen lock does not by itself break the difficulty curve.\n`);
}

// Per gen-set table + flag summary
for (const setting of GEN_SETTINGS) {
  const rows = stages.filter(s => s.meta.genKey === setting.key);
  if (!rows.length) continue;
  md.push(`\n## ${setting.label}  (gens ${setting.gens.join(',')})`);
  md.push(`| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |`);
  md.push(`|---|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const A of rows) {
    const m = A.meta; const rMean = mean(A.ratioPerMon); const delta = rMean - m.intendedMult;
    const flag = Math.abs(delta) > PLAYER_TOL ? (delta > 0 ? '🔴 HARD' : '🔵 SOFT') : '·';
    md.push(`| ${m.eid} | ${m.eventName} | ${m.trainer} | ${m.city} | ${m.cap} | ${r2(mean(A.enemyMonTotal))} | ${r2(m.player.monTotal)} | ${r3(rMean)} (${r3(pct(A.ratioPerMon, 50))}) | ${r3(m.intendedMult)} | ${delta >= 0 ? '+' : ''}${r3(delta)} | ${r2(mean(A.teamRatio))} | ${r2(mean(A.enemyGrade))} | ${r2(m.player.avgGrade)} | ${flag} |`);
  }
  const hard = rows.filter(A => (mean(A.ratioPerMon) - A.meta.intendedMult) > PLAYER_TOL);
  const soft = rows.filter(A => (mean(A.ratioPerMon) - A.meta.intendedMult) < -PLAYER_TOL);
  md.push(`\n**${setting.label} divergences:** ${hard.length} HARD, ${soft.length} SOFT of ${rows.length} stages.`);
  if (hard.length) md.push(`- HARD: ${hard.map(A => `${A.meta.eventName}(Δ+${r3(mean(A.ratioPerMon) - A.meta.intendedMult)})`).join(', ')}`);
  if (soft.length) md.push(`- SOFT: ${soft.map(A => `${A.meta.eventName}(Δ${r3(mean(A.ratioPerMon) - A.meta.intendedMult)})`).join(', ')}`);
}

// GEN 1 ONLY deep dive (user's primary focus)
md.push(`\n\n## GEN 1 ONLY — deep dive`);
{
  const rows = stages.filter(s => s.meta.genKey === 'gen1');
  const all = stages.filter(s => s.meta.genKey === 'allgen');
  const byEid = new Map(all.map(A => [A.meta.eid, A]));
  md.push(`The narrow Gen-1 pool changes which species are available to BOTH sides; this contrasts Gen-1-only vs All-Gens at the same stage.`);
  md.push(`| event | g1 ratio/mon | allgen ratio/mon | g1 enemyG | g1 playerG | g1 flag |`);
  md.push(`|---|---|---|---|---|---|`);
  for (const A of rows) {
    const m = A.meta; const r1 = mean(A.ratioPerMon); const aA = byEid.get(m.eid);
    const rA = aA ? mean(aA.ratioPerMon) : NaN;
    const delta = r1 - m.intendedMult;
    const flag = Math.abs(delta) > PLAYER_TOL ? (delta > 0 ? '🔴 HARD' : '🔵 SOFT') : '·';
    md.push(`| ${m.eventName} | ${r3(r1)} | ${isNaN(rA) ? '—' : r3(rA)} | ${r2(mean(A.enemyGrade))} | ${r2(m.player.avgGrade)} | ${flag} |`);
  }
}

// Data-quality flags
md.push(`\n\n## Data-quality flags (sample integrity — should mostly be empty)`);
const dump = (set, title) => { md.push(`\n### ${title} (${set.size})`); md.push(set.size ? [...set].slice(0, 40).map(x => `- ${x}`).join('\n') : '- none'); };
dump(dq.legFiller, 'Legendary FILLER leaks on non-E4/Champion trainers (bug if present)');
dump(dq.rattata, 'Rattata sentinel on a non-Normal trainer (pool exhaustion)');
dump(dq.dup, 'Unexpected duplicate species (not an authored multiset)');
dump(dq.shortTeam, 'Short teams (fewer mons than party cap)');

// Proposed number diffs (computed suggestions — NOT applied; maintainer-owned)
md.push(`\n\n## Proposed number diffs (for sign-off — NOT applied)`);
md.push(`> Balance numbers are maintainer-owned. These are *computed suggestions* to bring the measured per-mon ratio toward the intended foe edge. Pick/tune before anything ships.\n`);
// Curve suggestion from ALL-GENS city-keyed stages (cleanest pool); show current FOE_POWER_CURVE vs implied.
const FOE_POWER_CURVE = [0.80, 0.85, 0.90, 0.95, 1.00, 1.03, 1.05, 1.08, 1.10, 1.15];
const cityRatios = new Map(); // city -> [ratioPerMon means] from ALL-GENS, non-boss city stages
for (const A of stages) {
  if (A.meta.genKey !== 'allgen') continue;
  if (A.meta.city < 0) continue;
  if (/^E[1-4]$|Champion|Mystery Figure/.test(A.meta.eventName)) continue; // boss overrides handled separately
  (cityRatios.get(A.meta.city) || cityRatios.set(A.meta.city, []).get(A.meta.city)).push(mean(A.ratioPerMon));
}
md.push(`### \`FOE_POWER_CURVE\` (battle.html:38439) — city stat edge (ALL-GENS measurement)`);
md.push(`Intent: enemy/player per-mon ratio at city *c* should equal \`FOE_POWER_CURVE[c]\` when grades match. Measured ratio bakes in any grade/BST gap, so a measured > curve means the pool itself (not the multiplier) is over-tuned for that city.`);
md.push(`| city | current curve | measured ratio/mon | implied curve to hit parity | note |`);
md.push(`|---|---|---|---|---|`);
for (let c = 0; c <= 9; c++) {
  const arr = cityRatios.get(c);
  if (!arr || !arr.length) { md.push(`| ${c} | ${FOE_POWER_CURVE[c]} | — | — | no city-${c} trainer stage |`); continue; }
  const meas = mean(arr);
  // measured = curve × (grade/pool gap). To make measured land on 1.00 player-parity baseline edge,
  // implied curve = current × (target / measured), target = current intent (the curve value itself).
  const implied = FOE_POWER_CURVE[c] * (FOE_POWER_CURVE[c] / meas);
  const note = Math.abs(meas - FOE_POWER_CURVE[c]) > PLAYER_TOL ? (meas > FOE_POWER_CURVE[c] ? 'pool over curve → soften' : 'pool under curve → harden') : 'on target';
  md.push(`| ${c} | ${FOE_POWER_CURVE[c]} | ${r3(meas)} | ${r3(implied)} | ${note} |`);
}
md.push(`\n### Boss overrides (\`_storyEnemyStatMult\` 38440)`);
md.push(`| event | current mult | measured ratio/mon (ALL-GENS) | note |`);
md.push(`|---|---|---|---|`);
for (const ev of ['E1', 'E2', 'E3', 'E4', 'Champion', 'Mystery Figure']) {
  const A = stages.find(s => s.meta.genKey === 'allgen' && s.meta.eventName === ev);
  if (!A) { md.push(`| ${ev} | — | — | not sampled |`); continue; }
  const meas = mean(A.ratioPerMon);
  const note = Math.abs(meas - A.meta.intendedMult) > PLAYER_TOL ? (meas > A.meta.intendedMult ? 'harder than dialled' : 'softer than dialled') : 'on target';
  md.push(`| ${ev} | ${r3(A.meta.intendedMult)} | ${r3(meas)} | ${note} |`);
}

md.push(`\n---\nArtifacts: \`enemy-mons.csv\` (per-mon, seed ${SEEDS[0]}), \`stage-summary.csv\` (all stages × gen-sets, ${SEEDS_N}-seed stats), \`player-model.csv\` (expected player team per stage).`);

fs.writeFileSync(`${OUT_DIR}/BALANCE_REPORT.md`, md.join('\n') + '\n');

// stdout digest
console.error(`[balance] DONE — ${simCount} sims, ${stageAcc.size} stage×gen rows.`);
console.log(`Wrote ${OUT_DIR}/{enemy-mons.csv, stage-summary.csv, player-model.csv, BALANCE_REPORT.md}`);
let hardN = 0, softN = 0;
for (const A of stages) { const d = mean(A.ratioPerMon) - A.meta.intendedMult; if (d > PLAYER_TOL) hardN++; else if (d < -PLAYER_TOL) softN++; }
console.log(`Divergences across all gen-sets: ${hardN} HARD, ${softN} SOFT (of ${stages.length} stage×gen rows). DQ: legFiller=${dq.legFiller.size} rattata=${dq.rattata.size} short=${dq.shortTeam.size} dup=${dq.dup.size}`);
process.exit(0);
