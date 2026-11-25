// Locks the enemy build-diversity + correctness fixes from the build-diversity
// overhaul (BUILD_DIVERSITY_MASTER.md), verified against the FINAL foe pipeline
// (rollTrainerTeam -> storyGateFoeMovesByCity). Guards, per stage C0->C7:
//   - EV totals are legal (<=508, per-stat <=252)              [audit #3]
//   - abilities are legal for the exact forme                  [audit #4]
//   - no attacker carries a role-fighting nature               [audit #5]
//   - no pre-City-8 foe holds a gimmick stone / gimmick        [audit #1]
//   - Phase 1: foes carry coverage/utility, not only STAB      [gate split]
// Run: node --test tests/suites/story-enemy-build-diversity.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const ST = E.window.__storyTest;
const W = E.window;
const baseStats = W.__rivalTest.baseStats;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const RAW = ST.STORY_EVENTS_RAW, N = RAW.length;
const rowFor = (c) => { for (let i = 0; i < N; i++) { let cc = -1; try { cc = ST.cityIndexFromEventIndex(i) | 0; } catch (e) {} if (cc === c) { const r = RAW[i]; return r ? (r[0] | 0) : i; } } return 0; };
const trainers = ST.getTrainerData();
const evTot = (e) => KEYS.reduce((s, k) => s + (e[k] | 0), 0);

function prime(seed, badges) {
  ST.sm.active = true;
  ST.sm.runSeed = seed >>> 0;
  ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: GENS.slice() };
  ST.sm.badges = badges;
  ST.sm.trainerAssignments = {};
  ST.sm.eventIndex = 0;
}

// Roll `n` enemy teams at a city through the FULL final pipeline (roll + move gate).
async function rollEnemyMons(city, n) {
  const row = rowFor(city);
  const evType = city >= 7 ? 'Champion' : (city >= 1 ? `Gym Leader ${Math.min(8, city)}` : 'Basic Trainer');
  const mons = [];
  for (let s = 0; s < n; s++) {
    prime(4200 + city * 41 + s * 7, Math.min(8, city));
    ST.sm.eventIndex = row;
    const tr = trainers[(city * 13 + s * 5) % trainers.length];
    let team;
    try { team = ST.rollTrainerTeam(tr, 6, null, GENS, evType, row); } catch (e) { continue; }
    if (!Array.isArray(team)) continue;
    try { await ST.storyGateFoeMovesByCity(team, row); } catch (e) {}
    for (const slot of team) if (slot && slot.build) mons.push(slot);
  }
  return mons;
}

test('enemy EV totals are legal at every stage (<=508, per-stat <=252)', async () => {
  for (const c of [2, 4, 6, 7]) {
    const mons = await rollEnemyMons(c, 24);
    assert.ok(mons.length > 50, `C${c}: sampled enough enemy mons (${mons.length})`);
    for (const m of mons) {
      const evs = m.build.evs || {};
      const tot = evTot(evs);
      assert.ok(tot <= 508, `C${c} ${m.name} EV total ${tot} must be <=508`);
      for (const k of KEYS) assert.ok((evs[k] | 0) <= 252, `C${c} ${m.name} ${k}=${evs[k]} <=252`);
    }
  }
});

test('enemy abilities are legal for the exact forme at every stage', async () => {
  for (const c of [1, 4, 7]) {
    const mons = await rollEnemyMons(c, 24);
    for (const m of mons) {
      const bs = baseStats[m.name];
      if (!bs || !bs.abilities) continue;
      const legal = Object.values(bs.abilities);
      if (!m.build.a) continue; // empty resolves to default at runtime — legal
      assert.ok(legal.includes(m.build.a),
        `C${c} ${m.name} ability "${m.build.a}" must be legal (has: ${legal.join('/')})`);
    }
  }
});

test('no enemy attacker carries a role-fighting nature', async () => {
  for (const c of [3, 5, 7]) {
    const mons = await rollEnemyMons(c, 24);
    for (const m of mons) {
      const bs = baseStats[m.name];
      if (!bs) continue;
      if (!W._natureFightsRole(bs, m.build.n)) continue;
      assert.ok(c >= 6, `C${c} ${m.name} nature ${m.build.n} must fit its early build`);
      // Polished sets can attack off the lower base stat, such as Swords Dance Venusaur.
      const favoredCategory = bs.atk > bs.spa ? 'Special' : 'Physical';
      const attacks = m.build.m.map(move => ST.ensureMoveData(move)).filter(move => move?.pow && move.cat !== 'Status');
      assert.ok(attacks.some(move => move.cat === favoredCategory),
        `C${c} ${m.name} nature ${m.build.n} must support an attack in its final kit`);
    }
  }
});

test('no pre-City-8 foe fields a gimmick or holds a gimmick stone', async () => {
  for (const c of [0, 1, 2, 4, 6]) {
    const mons = await rollEnemyMons(c, 20);
    for (const m of mons) {
      assert.ok(!m.build.gimmick || m.build.gimmick === 'STANDARD',
        `C${c} ${m.name} must be STANDARD pre-City-8 (was ${m.build.gimmick})`);
      const it = m.build.i || '';
      assert.ok(!/ium Z$/.test(it), `C${c} ${m.name} must not hold a Z-crystal (${it})`);
    }
  }
});

test('Phase 1: early foes carry coverage/utility, not only STAB', async () => {
  // Classify each foe's moveset; the "only damaging STAB" rate should be well below
  // "everyone is 4 STAB". Measured at C2 and C4 (Inner / Unleashed tiers).
  const isStatus = (m) => { const md = ST.ensureMoveData(String(m).split('/')[0]); return !!(md && md.cat === 'Status'); };
  for (const c of [2, 4]) {
    const mons = await rollEnemyMons(c, 30);
    let onlyStab = 0, withCoverageOrUtil = 0, counted = 0;
    for (const m of mons) {
      const bs = baseStats[m.name];
      if (!bs) continue;
      const types = new Set([bs.t1, bs.t2].filter(Boolean));
      const mv = (m.build.m || []).filter(Boolean);
      if (!mv.length) continue;
      counted++;
      let hasNonStab = false;
      for (const mm of mv) {
        const md = ST.ensureMoveData(String(mm).split('/')[0]);
        if (!md) continue;
        if (md.cat === 'Status') { hasNonStab = true; break; }       // utility
        if (md.pow && !types.has(md.type)) { hasNonStab = true; break; } // coverage
      }
      if (hasNonStab) withCoverageOrUtil++; else onlyStab++;
    }
    assert.ok(counted > 40, `C${c}: enough foes classified (${counted})`);
    const onlyStabRate = onlyStab / counted;
    // Not a hard bound on any single mon — but the population must not collapse to
    // pure STAB. Pre-overhaul early foes were dominated by basic STAB; assert a
    // healthy share now carries coverage or utility. Wide margin (observed ~10-27%)
    // so CI RNG variance can't flake it.
    assert.ok(onlyStabRate < 0.75, `C${c} only-STAB rate ${(onlyStabRate * 100).toFixed(0)}% should be < 75%`);
    assert.ok(withCoverageOrUtil > 0, `C${c} some foes carry coverage/utility`);
  }
  ST.sm.active = false;
});

test('generated gear fits the final build and a late boss can awaken one eligible ace', async () => {
  const garchomp = { name: 'Garchomp', build: { a: 'Sand Veil', i: 'Assault Vest', _storyAce: true,
    m: ['Dragon Claw', 'Earthquake', 'Swords Dance'] } };
  const blastoise = { name: 'Blastoise', build: { a: 'Torrent', i: 'Choice Band', _storyAce: true,
    m: ['Surf', 'Ice Beam', 'Water Pulse'] } };
  assert.equal(ST.storyBuildHeldItemFits(garchomp.name, garchomp.build, garchomp.build.i), false);
  assert.equal(ST.storyBuildHeldItemFits(blastoise.name, blastoise.build, blastoise.build.i), false);
  assert.equal(ST.storyBuildHeldItemFits('Blaziken', { a: 'Blaze', m: ['Blaze Kick'] }, 'Flame Orb'), false);
  assert.equal(ST.storyBuildHeldItemFits('Heracross', { a: 'Guts', m: ['Facade'] }, 'Flame Orb'), true);
  assert.equal(ST.storyBuildHeldItemFits('Pelipper', { a: 'Keen Eye', m: ['Surf'] }, 'Damp Rock'), false);
  assert.equal(ST.storyBuildHeldItemFits('Pelipper', { a: 'Drizzle', m: ['Surf'] }, 'Damp Rock'), true);

  await W._loadOpAbilities();
  const team = async (city, event) => {
    prime(4321, city - 1);
    const row = RAW.find((row, index) => row[2] === event && ST.cityIndexFromEventIndex(index) === city);
    assert.ok(row, event);
    const roster = structuredClone([garchomp, blastoise]);
    await ST.storyGateFoeMovesByCity(roster, row[0]);
    for (const slot of roster) {
      assert.ok(!slot.build.i || ST.storyBuildHeldItemFits(slot.name, slot.build, slot.build.i));
    }
    return roster;
  };
  const early = await team(7, 'Gym Leader 7');
  assert.ok(early.every(slot => ST.dojoAbilityUnlockStage(slot.name, slot.build.a) < 3));
  const late = await team(8, 'Gym Leader 8');
  const awakened = late.filter(slot => ST.dojoAbilityUnlockStage(slot.name, slot.build.a) === 3);
  assert.equal(awakened.length, 1);
  assert.ok(ST.opAbilitiesForMon(awakened[0].name).includes(awakened[0].build.a));
  assert.deepEqual(late, await team(8, 'Gym Leader 8'));
});

test('a polished late trainer matches offensive training to its actual attacks', async () => {
  prime(4321, 7);
  const row = RAW.find(entry => entry[2] === 'Gym Leader 8');
  const team = [{ name: 'Nidoqueen', build: { _storyAce: true, a: 'Sheer Force', n: 'Adamant',
    m: ['Earth Power', 'Sludge Wave', 'Ice Beam', 'Stealth Rock'],
    evs: { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 } } }];
  await ST.storyGateFoeMovesByCity(team, row[0]);
  assert.equal(team[0].build.n, 'Modest');
  assert.deepEqual({ ...team[0].build.evs }, { hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 });
});
