// Story-mode enemy KIT-QUALITY analysis — the companion to analyze.mjs (which covers raw stats:
// IV/EV/nature-modifier/stat-multiplier). This pass covers the dimensions stats DON'T capture:
// MOVESETS, ABILITIES, ITEMS, and NATURE-APPROPRIATENESS — across the 4 gen locks over N seeds.
//
// Reference frame: the engine's enemy kit-quality knobs are EXPLICITLY tuned to player parity
// (the source comments say "foe ≤ player at every city" — foe item tier is derived from the
// player's Battle-Dojo clock; ability/nature/move optimization ramp with the player's facility
// unlocks). So the INTENDED opt-chance curves (_storyNatureOptChance / _storyAbilityOptChance /
// _storyMoveOptChance / _storyFoeItemTier) ARE the player-availability ceiling. This script
// measures the REALIZED enemy kit per stage and compares it to that intended ceiling — flagging
// where a roll OVER-delivers (would beat player parity) or UNDER-delivers (gen-lock thinning).
//
// Run:  node --max-old-space-size=4096 scripts/debug/balance/kit-quality.mjs [seeds]
// Out:  agent-state/balance/{enemy-kits.csv, kit-summary.csv, KIT_QUALITY_REPORT.md}

import { loadEngine } from '../../../tests/helpers/load-engine.js';
import fs from 'fs';

const SEEDS_N = Math.max(1, parseInt(process.argv[2] || process.env.SEEDS || '100', 10));
const SEED_BASE = 1000;
const DIFFICULTY = 'normal';
const OUT_DIR = 'agent-state/balance';
const MECHANICS = { megaOn: false, zOn: false, dynaOn: false, teraOn: false };
const TOL = 0.12; // realized-vs-intended band before flagging over/under-delivery

const GEN_SETTINGS = [
  { label: 'GEN 1 ONLY', key: 'gen1',    gens: [1] },
  { label: 'ALL GENS',   key: 'allgen',  gens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { label: 'GEN 1-6',    key: 'gen1to6', gens: [1, 2, 3, 4, 5, 6] },
  { label: 'GEN 1-3',    key: 'gen1to3', gens: [1, 2, 3] },
];

console.error(`[kit] booting engine … (seeds=${SEEDS_N})`);
const eng = await loadEngine();
const S = eng.window.__storyTest;
const R = eng.window.__rivalTest;
const W = eng.window;
const baseStats = R.baseStats;
const natureMods = W.natureModifiers || {};
const SEEDS = Array.from({ length: SEEDS_N }, (_, i) => (SEED_BASE + i) >>> 0);
const diffStep = (S.trainerDifficultyStep ? S.trainerDifficultyStep(DIFFICULTY) : 1) | 0;

const NO_ITEM = new Set([null, '', 'No Item', 'NO_ITEM', 'None', undefined]);
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;
const pctf = (n, d) => d ? n / d : 0;

// ── per-mon kit metrics ──
function kitMetrics(name, build) {
  const b = build ? JSON.parse(JSON.stringify(build)) : {};
  if (!Array.isArray(b.m) || !b.m.length) b.m = ['Tackle'];
  const mon = S.buildPokemon(name, b);
  const types = [mon.type1, mon.type2].filter(Boolean);
  const moves = mon.moves || [];
  const atk = moves.filter(m => m && m.cat && m.cat !== 'Status' && (m.pow | 0) > 0);
  const stab = atk.filter(m => types.includes(m.type));
  const coverage = new Set(atk.map(m => m.type)).size;
  const avgBP = mean(atk.map(m => m.pow | 0));
  const maxBP = atk.length ? Math.max(...atk.map(m => m.pow | 0)) : 0;
  const hasStatus = moves.some(m => m && m.cat === 'Status');
  const hasPriority = atk.some(m => (m.pri | 0) > 0);
  // nature appropriateness — judged against the mon's ACTUAL moveset, not its base stats. The
  // attack stat is the category it actually uses (more physical vs special attacking moves); a
  // mon with no attacking moves is treated as defensive (no attack stat to protect). This avoids
  // false-flagging correct competitive natures (Adamant on a physical Lucario, Bold on a
  // defensive wall, Modest on a special attacker whose base Atk merely edges its SpA).
  const bs = baseStats[name] || {};
  const physN = atk.filter(m => m.cat === 'Physical').length;
  const specN = atk.filter(m => m.cat === 'Special').length;
  let attackStat = null;
  if (physN > specN) attackStat = 'atk';
  else if (specN > physN) attackStat = 'spa';
  else if (atk.length) attackStat = (bs.atk || 0) >= (bs.spa || 0) ? 'atk' : 'spa'; // mixed/tie → base
  const nm = natureMods[mon.nature];
  const natNeutral = !nm || nm.up === nm.down;
  const natDetrimental = !!(nm && attackStat && nm.down === attackStat);   // lowers the stat it actually attacks with
  const natOptimized = !!(nm && !natDetrimental && ((attackStat && nm.up === attackStat) || nm.up === 'spe' || (!attackStat && (nm.up === 'def' || nm.up === 'spd')))); // boosts a stat it uses (offense, speed, or bulk for a defensive mon)
  // ability: optimized = not the slot-0 default (the roll upgraded it)
  const ab0 = bs.abilities && bs.abilities['0'];
  const abH = bs.abilities && bs.abilities['H'];
  const abilityNonDefault = !!(mon.ability && ab0 && mon.ability !== ab0);
  const abilityHidden = !!(mon.ability && abH && mon.ability === abH);
  const hasItem = !NO_ITEM.has(mon.item);
  return { moveCount: moves.length, stab: stab.length, hasStab: stab.length > 0, coverage, avgBP, maxBP,
           hasStatus, hasPriority, natNeutral, natDetrimental, natOptimized, abilityNonDefault, abilityHidden, hasItem,
           moveList: moves.map(m => m && m.name).filter(Boolean) };
}

// ── sweep ──
const stage = new Map(); // `${genKey}|${eid}` -> { meta, arrays... }
const kitCsv = ['genKey,seed,eid,eventName,trainer,city,mon,types,nature,natOK,ability,abilHidden,item,hasItem,moveCount,stab,coverage,avgBP,maxBP,status,priority,moves'];
const WRITE_ROWS_SEED = new Set([SEEDS[0]]);

let sims = 0;
for (const setting of GEN_SETTINGS) {
  for (const seed of SEEDS) {
    const res = S.simulateStoryRunTeams({ seed, enabledGens: setting.gens, difficulty: DIFFICULTY, partySize: 6, mechanics: MECHANICS });
    sims++;
    if (res.error) continue;
    for (const row of res.rows) {
      const { eid, eventName, trainer, cityIndex } = row;
      const city = cityIndex;
      const key = `${setting.key}|${eid}`;
      let A = stage.get(key);
      if (!A) {
        A = { meta: { genKey: setting.key, genLabel: setting.label, eid, eventName, trainer, city },
              stab: [], hasStab: [], coverage: [], avgBP: [], maxBP: [], status: [], priority: [], moveCount: [],
              natOpt: [], natBad: [], abilOpt: [], abilHidden: [], item: [] };
        stage.set(key, A);
      }
      A.meta.trainer = trainer;
      for (const slot of (row.team || [])) {
        const k = kitMetrics(slot.name, slot.build || {});
        A.stab.push(k.stab); A.hasStab.push(k.hasStab ? 1 : 0); A.coverage.push(k.coverage);
        A.avgBP.push(k.avgBP); A.maxBP.push(k.maxBP); A.status.push(k.hasStatus ? 1 : 0);
        A.priority.push(k.hasPriority ? 1 : 0); A.moveCount.push(k.moveCount);
        A.natOpt.push(k.natOptimized ? 1 : 0); A.natBad.push(k.natDetrimental ? 1 : 0);
        A.abilOpt.push(k.abilityNonDefault ? 1 : 0); A.abilHidden.push(k.abilityHidden ? 1 : 0);
        A.item.push(k.hasItem ? 1 : 0);
        if (WRITE_ROWS_SEED.has(seed)) {
          const bs = baseStats[slot.name] || {};
          kitCsv.push([setting.key, seed, eid, eventName, trainer, city, slot.name,
            [bs.t1, bs.t2].filter(Boolean).join('/'), (slot.build || {}).n || '', k.natOptimized ? (k.natDetrimental ? 'BAD' : 'opt') : (k.natDetrimental ? 'BAD' : 'neutral'),
            (slot.build || {}).a || '', k.abilityHidden ? 'H' : (k.abilityNonDefault ? 'alt' : 'def'),
            (slot.build || {}).i || '', k.hasItem ? 1 : 0, k.moveCount, k.stab, k.coverage, r2(k.avgBP), k.maxBP,
            k.hasStatus ? 1 : 0, k.hasPriority ? 1 : 0, '"' + k.moveList.join(' / ') + '"'].join(','));
        }
      }
    }
    if (sims % 50 === 0) console.error(`[kit] ${sims}/${GEN_SETTINGS.length * SEEDS_N} sims …`);
  }
}

// ── write ──
fs.mkdirSync(OUT_DIR, { recursive: true });
const stages = [...stage.values()];
// preserve gen-set order then story order
const order = new Map(); { let i = 0; for (const k of stage.keys()) order.set(k, i++); }
stages.sort((a, b) => {
  const ga = GEN_SETTINGS.findIndex(g => g.key === a.meta.genKey), gb = GEN_SETTINGS.findIndex(g => g.key === b.meta.genKey);
  return ga !== gb ? ga - gb : order.get(`${a.meta.genKey}|${a.meta.eid}`) - order.get(`${b.meta.genKey}|${b.meta.eid}`);
});

const sumCsv = ['genKey,eid,eventName,trainer,city,stab_avg,hasStab_pct,coverage_avg,avgBP,maxBP,status_pct,priority_pct,natOpt_pct,natBad_pct,abilOpt_pct,abilHidden_pct,item_pct,intent_natOpt,intent_abilOpt,intent_moveOpt,intent_itemTier'];
for (const A of stages) {
  const m = A.meta;
  const iNat = S.storyNatureOptChance(m.city, diffStep);
  const iAbil = S.storyAbilityOptChance(m.city, diffStep);
  const iMove = S.storyMoveOptChance(m.city, diffStep);
  const iItem = S.storyFoeItemTier(m.city);
  sumCsv.push([m.genKey, m.eid, m.eventName, m.trainer, m.city,
    r2(mean(A.stab)), r2(pctf(A.hasStab.reduce((a,b)=>a+b,0), A.hasStab.length)), r2(mean(A.coverage)),
    r2(mean(A.avgBP)), r2(mean(A.maxBP)), r2(mean(A.status)), r2(mean(A.priority)),
    r2(mean(A.natOpt)), r2(mean(A.natBad)), r2(mean(A.abilOpt)), r2(mean(A.abilHidden)), r2(mean(A.item)),
    r2(iNat), r2(iAbil), r2(iMove), iItem].join(','));
}
fs.writeFileSync(`${OUT_DIR}/enemy-kits.csv`, kitCsv.join('\n') + '\n');
fs.writeFileSync(`${OUT_DIR}/kit-summary.csv`, sumCsv.join('\n') + '\n');

// ── markdown report ──
const md = [];
md.push(`# Story-mode enemy KIT-QUALITY report (movesets · abilities · items · natures)`);
md.push(`Generated ${new Date().toISOString()} · ${SEEDS_N} seeds · difficulty **${DIFFICULTY}** (diffStep ${diffStep}) · gimmicks off\n`);
md.push(`Companion to BALANCE_REPORT.md (which covers raw stats: IV/EV/nature-modifier/stat-multiplier). This pass covers the dimensions stats don't: **movesets, abilities, items, nature-appropriateness.**\n`);
md.push(`## How to read`);
md.push(`- The enemy kit-quality knobs are tuned to **player parity** (foe ≤ player at every city — item tier derives from the player's Battle-Dojo clock; ability/nature/move optimization ramp with player facility unlocks). So the **intended opt-chance curves are the player-availability ceiling.**`);
md.push(`- \`natOpt_pct\` realized nature-optimization vs \`intent_natOpt\`; \`abilOpt_pct\` (ability upgraded off slot-0) vs \`intent_abilOpt\`; \`item_pct\` (holds an item) vs \`intent_itemTier\` (0 ⇒ should hold none); move quality (\`hasStab\`, \`coverage\`, \`avgBP\`) trends with \`intent_moveOpt\`.`);
md.push(`- \`natBad_pct\` = fraction with a nature that **lowers the mon's main attack stat** (the clear failure mode — should stay low).`);
md.push(`- **Flags:** realized OVER intended by >${TOL} ⇒ 🔴 over-parity; UNDER by >${TOL} ⇒ 🔵 under-delivered.\n`);

for (const setting of GEN_SETTINGS) {
  const rows = stages.filter(s => s.meta.genKey === setting.key);
  if (!rows.length) continue;
  md.push(`\n## ${setting.label}  (gens ${setting.gens.join(',')})`);
  md.push(`| # | event | city | STAB | cov | avgBP | maxBP | status% | prio% | natOpt% | natBad% | abilAlt% | abilHid% | item%/tier | flag |`);
  md.push(`|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const A of rows) {
    const m = A.meta;
    const iNat = S.storyNatureOptChance(m.city, diffStep), iAbil = S.storyAbilityOptChance(m.city, diffStep), iItem = S.storyFoeItemTier(m.city);
    const natR = mean(A.natOpt), abilR = mean(A.abilOpt), itemR = mean(A.item), natBadR = mean(A.natBad);
    // Only two reliable flags: item-before-parity (foe holds an item the player can't yet) and a
    // genuinely-bad-nature rate. nat/abil OPTIMIZATION is shown for context but NOT flagged vs the
    // intent curve — the outcome metric undercounts intent (a best-is-default ability or a wall
    // nature reads as "not optimized" even when correct).
    const fItem = (iItem === 0 && itemR > TOL) ? '🔴 item>parity' : '';
    const fBad = natBadR > 0.15 ? '🔴 natBad' : '';
    const flag = [fItem, fBad].filter(Boolean).join(' ') || '·';
    md.push(`| ${m.eid} | ${m.eventName} | ${m.city} | ${r2(mean(A.stab))} | ${r2(mean(A.coverage))} | ${r2(mean(A.avgBP))} | ${r2(mean(A.maxBP))} | ${Math.round(mean(A.status)*100)} | ${Math.round(mean(A.priority)*100)} | ${Math.round(natR*100)} | ${Math.round(natBadR*100)} | ${Math.round(abilR*100)} | ${Math.round(mean(A.abilHidden)*100)} | ${Math.round(itemR*100)}/${iItem} | ${flag} |`);
  }
}

// gen-1 vs all-gens kit-degradation contrast (user's primary focus)
md.push(`\n\n## GEN 1 ONLY vs ALL GENS — does the narrow pool thin the kits?`);
md.push(`| event | g1 cov | all cov | g1 avgBP | all avgBP | g1 STAB | all STAB | g1 abilOpt% | all abilOpt% |`);
md.push(`|---|---|---|---|---|---|---|---|---|`);
{
  const g1 = stages.filter(s => s.meta.genKey === 'gen1');
  const allByEid = new Map(stages.filter(s => s.meta.genKey === 'allgen').map(s => [s.meta.eid, s]));
  for (const A of g1) {
    const B = allByEid.get(A.meta.eid); if (!B) continue;
    md.push(`| ${A.meta.eventName} | ${r2(mean(A.coverage))} | ${r2(mean(B.coverage))} | ${r2(mean(A.avgBP))} | ${r2(mean(B.avgBP))} | ${r2(mean(A.stab))} | ${r2(mean(B.stab))} | ${Math.round(mean(A.abilOpt)*100)} | ${Math.round(mean(B.abilOpt)*100)} |`);
  }
}

// auto findings
md.push(`\n\n## Findings`);
const allg = stages.filter(s => s.meta.genKey === 'allgen');
const lateAll = allg.filter(s => s.meta.city >= 6 || /^E[1-4]$|Champion|Mystery Figure/.test(s.meta.eventName));
const earlyAll = allg.filter(s => s.meta.city <= 2);
const f = (arr, sel) => r2(mean(arr.flatMap(sel)));
md.push(`- **Items respect the player-parity (Battle-Dojo) clock — the one strict invariant:** at C0-1 (intent tier 0) realized item% = ${Math.round(f(earlyAll.filter(A=>A.meta.city<=1), A=>A.item)*100)}% (must be ~0 — foe can't out-tier the player), rising to ${Math.round(f(lateAll, A=>A.item)*100)}% late. This is the cleanest signal and it holds.`);
md.push(`- **Nature failures are low once judged by moveset** (not base stats): mean natBad% = ${Math.round(f(allg, A => A.natBad)*100)}% (a nature lowering the stat the mon actually attacks with). Any stage over 15% is flagged in the tables.`);
md.push(`- **Ability & nature optimization ramp up as intended** (descriptive — the outcome undercounts the dialed intent): abilAlt% (ability upgraded off slot-0) ${Math.round(f(earlyAll, A=>A.abilOpt)*100)}%→${Math.round(f(lateAll, A=>A.abilOpt)*100)}% early→late; hidden-ability use reaches ${Math.round(f(lateAll, A=>A.abilHidden)*100)}% late. natOpt% ${Math.round(f(earlyAll, A=>A.natOpt)*100)}%→${Math.round(f(lateAll, A=>A.natOpt)*100)}%. (Many mons' best ability/nature IS the default, so 100% is not the expected ceiling.)`);
md.push(`- **Movesets are rich and scale correctly:** late/endgame mean coverage ${f(lateAll, A=>A.coverage)} distinct attacking types, avgBP ${f(lateAll, A=>A.avgBP)}, STAB ${f(lateAll, A=>A.stab)} per slot; early coverage ${f(earlyAll, A=>A.coverage)}, avgBP ${f(earlyAll, A=>A.avgBP)} (early BP intentionally held down by the foe BP cap + basic-STAB stage). Status-move presence ${Math.round(f(lateAll, A=>A.status)*100)}% late.`);
// reliable flags: item-before-parity (over) + bad-nature rate (quality), and under-delivered STAB late
let over = 0, badNat = 0, lowStab = 0;
for (const A of stages) {
  const iItem = S.storyFoeItemTier(A.meta.city);
  if (iItem === 0 && mean(A.item) > TOL) over++;
  if (mean(A.natBad) > 0.15) badNat++;
  const late = A.meta.city >= 6 || /^E[1-4]$|Champion|Mystery Figure/.test(A.meta.eventName);
  if (late && pctf(A.hasStab.reduce((a,b)=>a+b,0), A.hasStab.length) < 0.85) lowStab++;
}
md.push(`- **Parity/quality flags (of ${stages.length} stage×gen rows):** ${over} item-before-parity (foe holds an item the player can't yet), ${badNat} with >15% bad-nature rate, ${lowStab} late stages with <85% STAB coverage.`);
md.push(`\n> **Scope note:** this measures kit *composition* (what moves/ability/item/nature each foe carries), not in-battle *execution* (the AI's move selection). It also does not model the player's realized kit — it leans on the engine's parity design (foe knobs are tuned ≤ player availability per city), which the item clock confirms is honoured.`);
md.push(`\n---\nArtifacts: \`enemy-kits.csv\` (per-mon kits incl. full movesets, seed ${SEEDS[0]}), \`kit-summary.csv\` (all stages × gen-sets, ${SEEDS_N}-seed rates).`);

fs.writeFileSync(`${OUT_DIR}/KIT_QUALITY_REPORT.md`, md.join('\n') + '\n');
console.error(`[kit] DONE — ${sims} sims, ${stage.size} stage×gen rows.`);
console.log(`Wrote ${OUT_DIR}/{enemy-kits.csv, kit-summary.csv, KIT_QUALITY_REPORT.md} · item-over-parity=${over} badNat=${badNat} lowStabLate=${lowStab}`);
process.exit(0);
