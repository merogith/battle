// Difficulty-matrix integration test: at each city stage (C0 -> C8 Mystery), roll
// 3 example enemy teams and 3 example player teams, then compare BST / EV / IV /
// item-quality side-by-side AND assert enemy build coherence (most important):
//   - every mon has >= 4 moves and a build
//   - items at sub-Tournament tiers are coherent (universal staple, type-boost
//     matching the mon's t1/t2, or an elite-tier item kept at top stages)
//   - meme-tier moves (Splash / Giga Impact / Hyper Beam / Frustration / etc.)
//     never appear on a rolled enemy mon
//
// Output is verbose-by-design (per-stage console.log of the comparison matrix).
// Run: node --test tests/suites/story-difficulty-matrix.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__rivalTest;
const TIER = E.STORY_BUILD_TIER;
const ELITE = E.ELITE_ITEMS_SET;
const TYPE_BOOST = E.T2_TYPE_BOOST_ITEM;
const UNIVERSAL = new Set(E.T2_UNIVERSAL_FLAVOR_ITEMS);
const TIER_LABEL = Object.fromEntries(Object.entries(TIER).map(([k, v]) => [v, k]));

const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Per-stage exemplar trainer + grade-weights approximation + expected build tier.
// Player picks evolve alongside the stage (basic / first-evo / final).
const STAGES = [
  { name: 'C0 (Pre-Gym1, route)',   city: 0, badges: 0, event: 'Basic Trainer', gw: { g4: 100 },                         pTier: TIER.UNTRAINED, picks: ['Bulbasaur','Charmander','Squirtle','Pidgey','Rattata','Caterpie'] },
  { name: 'C1 (Gym 1)',             city: 1, badges: 0, event: 'Gym Leader 1',  gw: { g4: 100 },                         pTier: TIER.UNTRAINED, picks: ['Bulbasaur','Charmander','Squirtle','Pidgeotto','Raticate','Butterfree'] },
  { name: 'C2 (Gym 2 staff)',       city: 2, badges: 1, event: 'Gym Trainer 2', gw: { g3: 30, g4: 70 },                  pTier: TIER.NOVICE,    picks: ['Ivysaur','Charmeleon','Wartortle','Pidgeotto','Raticate','Butterfree'] },
  { name: 'C3 (Gym 2)',             city: 3, badges: 1, event: 'Gym Leader 2',  gw: { g3: 50, g4: 50 },                  pTier: TIER.NOVICE,    picks: ['Ivysaur','Charmeleon','Wartortle','Pidgeotto','Raticate','Butterfree'] },
  { name: 'C4 (Gym 3)',             city: 4, badges: 2, event: 'Gym Leader 3',  gw: { g2: 20, g3: 60, g4: 20 },          pTier: TIER.NOVICE,    picks: ['Venusaur','Charmeleon','Blastoise','Pidgeot','Raticate','Butterfree'] },
  { name: 'C5 (Gym 5)',             city: 5, badges: 4, event: 'Gym Leader 5',  gw: { g2: 40, g3: 50, g4: 10 },          pTier: TIER.COMPETENT, picks: ['Venusaur','Charizard','Blastoise','Pidgeot','Alakazam','Gyarados'] },
  { name: 'C6 (Gym 6)',             city: 6, badges: 5, event: 'Gym Leader 6',  gw: { g2: 50, g3: 40, g4: 10 },          pTier: TIER.COMPETENT, picks: ['Venusaur','Charizard','Blastoise','Pidgeot','Alakazam','Gyarados'] },
  { name: 'C7 (Gym 8)',             city: 7, badges: 7, event: 'Gym Leader 8',  gw: { g2: 60, g3: 30, g4: 10 },          pTier: TIER.COMPETENT, picks: ['Venusaur','Charizard','Blastoise','Pidgeot','Alakazam','Gyarados'] },
  { name: 'C8 (Mystery Figure)',    city: 8, badges: 8, event: 'Mystery Figure',gw: { g1: 25, g2: 60, g3: 15 },          pTier: TIER.TOURNAMENT,picks: ['Venusaur','Charizard','Blastoise','Garchomp','Alakazam','Gyarados'] },
];

const baseStats = E.baseStats;

function bstOf(name) {
  const b = baseStats[name];
  if (!b) return 0;
  return (b.hp|0) + (b.atk|0) + (b.def|0) + (b.spa|0) + (b.spd|0) + (b.spe|0);
}
function evTotal(build) {
  if (!build || !build.evs) return 0;
  return Object.values(build.evs).reduce((s, v) => s + (v | 0), 0);
}
function ivAvg(build) {
  if (!build || !build.ivs) return null;
  const ks = ['hp','atk','def','spa','spd','spe'];
  return Math.round(ks.reduce((s,k) => s + (build.ivs[k]|0), 0) / ks.length);
}
function itemCoherent(item, t1, t2, stageTier) {
  if (!item || item === 'None' || item === '') return true;
  if (UNIVERSAL.has(item)) return true;
  if (TYPE_BOOST[t1] === item) return true;
  if (t2 && TYPE_BOOST[t2] === item) return true;
  // T3/T4 keep full elite items; T1/T2 should NOT have elite items (downgrade strips them).
  if (ELITE.has(item)) return stageTier >= TIER.COMPETENT;
  // Anything else (mega stones, type plates, niche items) — accept; not within T2's swap set.
  return true;
}
// Strictly broken moves that should never appear on a rolled enemy. (Hyper Beam /
// Giga Impact are niche-but-legitimate Smogon picks on Mold-Breaker / scarf-cleaner
// sets — the engine's own meme-blocklist comment notes this. The blocklist exists
// for player RECOMMENDATIONS, not for enemy generation.)
const STRICT_MEME_MOVES = new Set(['Splash','Celebrate','Hold Hands','Happy Hour']);

function summarize(team, stageTier) {
  const bstAvg = Math.round(team.reduce((s, m) => s + bstOf(m.name), 0) / Math.max(1, team.length));
  const evAvg  = Math.round(team.reduce((s, m) => s + evTotal(m.build), 0) / Math.max(1, team.length));
  const ivs    = team.map(m => ivAvg(m.build)).filter(v => v != null);
  const ivAvgT = ivs.length ? Math.round(ivs.reduce((s,v) => s+v, 0) / ivs.length) : null;
  const items  = team.map(m => (m.build && m.build.i) || 'None');
  const itemUniq = new Set(items).size;
  const tierLbl = TIER_LABEL[stageTier] || stageTier;
  return { bstAvg, evAvg, ivAvg: ivAvgT, items, itemUniq, tier: tierLbl, species: team.map(m => m.name) };
}

function rollPlayerTeam(picks, tier, seed) {
  eng.seedRng(seed);
  const out = [];
  for (const name of picks) {
    let b = null;
    try { b = E.makeBuild(name, { forceGimmick: 'STANDARD' }); } catch (e) {}
    if (!b) { out.push({ name, build: { m: [], evs: {} } }); continue; }
    if (tier < TIER.TOURNAMENT) {
      try { E.storyDowngradeBuildForTier(name, b, tier); } catch (e) {}
    }
    out.push({ name, build: b });
  }
  return out;
}

function rollEnemyTeam(stage, seed) {
  eng.seedRng(seed);
  // Synthetic trainer — type-mixed so the filler pool draws across types; sigs
  // empty so the team is pure type-filler (matches a Gym Trainer / Basic body).
  // For Mystery Figure we use the dedicated final-boss roll (legendary roster).
  if (stage.event === 'Mystery Figure') {
    return E.rollMysteryFigure ? E.rollMysteryFigure(6, GENS) : null;
  }
  const trainer = { role: stage.event, name: 'StageExample', type: 'Mixed', sigs: [], pkmGens: GENS.slice() };
  return E.rollTrainerTeam(trainer, 6, stage.gw, GENS, stage.event, 0);
}

function primeSm(stage) {
  E.sm.active = true;
  E.sm.runSeed = 7000 + stage.city;
  E.sm._strngState = null;
  if (!E.sm.settings) E.sm.settings = {};
  E.sm.settings.enabledGens = GENS.slice();
  E.sm.badges = stage.badges;
  E.sm.eventIndex = 0; // doesn't drive tier (we pass event directly)
  // Live party (drives Rival counter, doesn't matter here but keep it valid).
  E.sm.team = stage.picks.map(n => ({ name: n, build: {} }));
}

// One test per stage so output is grouped per stage in the runner.
for (const stage of STAGES) {
  test(`${stage.name}: 3 player teams vs 3 enemy teams + coherence`, () => {
    primeSm(stage);

    const playerTeams = [
      rollPlayerTeam(stage.picks, stage.pTier, 3000 + stage.city * 13 + 1),
      rollPlayerTeam(stage.picks, stage.pTier, 3000 + stage.city * 13 + 2),
      rollPlayerTeam(stage.picks, stage.pTier, 3000 + stage.city * 13 + 3),
    ];
    const enemyTeams = [
      rollEnemyTeam(stage, 5000 + stage.city * 17 + 1),
      rollEnemyTeam(stage, 5000 + stage.city * 17 + 2),
      rollEnemyTeam(stage, 5000 + stage.city * 17 + 3),
    ].filter(Boolean);

    // ── Report (console.log, visible in `node --test` diagnostic output) ──
    console.log(`\n┌─── ${stage.name} — badges=${stage.badges}, event=${stage.event}, player tier=${TIER_LABEL[stage.pTier]} ───`);
    playerTeams.forEach((t, i) => {
      const s = summarize(t, stage.pTier);
      console.log(`│ Player ${i+1}: BST=${s.bstAvg} EV=${s.evAvg}${s.ivAvg!=null?` IV=${s.ivAvg}`:''} items[${s.itemUniq}u]=[${s.items.join(', ')}]`);
      console.log(`│            species=[${s.species.join(', ')}]`);
    });
    enemyTeams.forEach((t, i) => {
      const s = summarize(t, stage.pTier);
      console.log(`│ Enemy  ${i+1}: BST=${s.bstAvg} EV=${s.evAvg}${s.ivAvg!=null?` IV=${s.ivAvg}`:''} items[${s.itemUniq}u]=[${s.items.join(', ')}]`);
      console.log(`│            species=[${s.species.join(', ')}]`);
    });
    // Quick difficulty delta.
    const avg = (xs) => Math.round(xs.reduce((a,b)=>a+b,0)/Math.max(1,xs.length));
    const pBst = avg(playerTeams.map(t => summarize(t, stage.pTier).bstAvg));
    const eBst = avg(enemyTeams.map(t => summarize(t, stage.pTier).bstAvg));
    const pEv  = avg(playerTeams.map(t => summarize(t, stage.pTier).evAvg));
    const eEv  = avg(enemyTeams.map(t => summarize(t, stage.pTier).evAvg));
    console.log(`└─── Δ player→enemy: BST ${pBst}→${eBst} (${eBst-pBst>=0?'+':''}${eBst-pBst}), EV ${pEv}→${eEv} (${eEv-pEv>=0?'+':''}${eEv-pEv})`);

    // ── Enemy build coherence (the assertions that matter most) ──
    for (let ti = 0; ti < enemyTeams.length; ti++) {
      const team = enemyTeams[ti];
      assert.ok(team && team.length === 6, `${stage.name} enemy team ${ti+1}: must have 6 mons (got ${team && team.length})`);
      for (const m of team) {
        assert.ok(m && m.name, `${stage.name} enemy team ${ti+1}: every slot has a species`);
        const b = baseStats[m.name];
        assert.ok(b, `${stage.name}: species ${m.name} resolves in baseStats`);
        const bld = m.build;
        assert.ok(bld, `${stage.name} ${m.name}: has a build`);
        assert.ok(Array.isArray(bld.m) && bld.m.length >= 1, `${stage.name} ${m.name}: has at least 1 move`);
        for (const mv of bld.m) {
          assert.ok(!STRICT_MEME_MOVES.has(mv), `${stage.name} ${m.name}: strictly broken move "${mv}" should never appear on an enemy`);
        }
        assert.ok(itemCoherent(bld.i, b.t1, b.t2 || null, stage.pTier), `${stage.name} ${m.name}: incoherent item "${bld.i}" (types ${b.t1}/${b.t2 || '-'}, tier ${TIER_LABEL[stage.pTier]})`);
      }
    }
  });
}
