// Phase 0 + Phase 1 — the unified move-pacing ceiling.
//
// Phase 0: the Natural/Learnt classification is served from the precomputed
//   data/move-tags.json index (offline-safe), so the gate no longer silently
//   no-ops without a CDN.
// Phase 1 (1.6.0): the gate is the single move-pacing authority. The move
// CATEGORY is keyed on the tutor TIER (TMs/tutor moves unlock only at Guru,
// tutor:[0,3,6]); the BP CAP is now PER-CITY (STORY_MOVE_BP_CAP_BY_CITY):
//   C0=40 · C1=60 · C2=60 · C3=80 · C4=80 · C5+=∞.  Foe cap == player cap.
//   Starter (build.starter) gets a 60-BP floor (only bites at C0).
// Category gate (tutor tier): Inner/Unleashed = Natural only; Guru (C6+) = all.
// NB: tests resolve cities via cityAtTutorStage() so they survive threshold tuning.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

function cityRowIdx(targetCity) {
  // Return the ROW ID (ev[0]) of the target city's hub row — that is what
  // storyGateFoeMovesByCity expects (it resolves row id → city via
  // _cityIndexForStoryRow). Returning the bare array index mis-resolves cities
  // in the reordered mid-rival region (e.g. C3) to a lower stage.
  for (let ei = 0; ei <= 120; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === targetCity) { const row = ST.STORY_EVENTS_RAW && ST.STORY_EVENTS_RAW[ei]; return row ? (row[0] | 0) : ei; }
  }
  return 0;
}
// Resolve a city that sits at the given tutor stage (0/1/2), so tests don't hardcode
// city numbers against the NPC_STAGE_CITY.tutor thresholds (which the user tunes).
function cityAtTutorStage(stage) {
  for (let c = 0; c <= 12; c++) { if ((ST.npcStageForCity('tutor', c) | 0) === stage) return c; }
  return 0;
}
function primeStory() {
  ST.sm.active = true;
  ST.sm.runSeed = 1;
  ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 0;
}
const bp = (m) => { try { const md = ST.ensureMoveData ? ST.ensureMoveData(m) : (w.movesDB && w.movesDB[m]); return md ? (md.pow | 0) : 0; } catch (e) { return 0; } };

test('Phase 0: the precomputed move-tag index is loaded offline (no CDN)', () => {
  const idx = w.MOVE_TAG_INDEX || {};
  assert.ok(idx.species && Object.keys(idx.species).length > 1000, 'index has 1000+ species');
  assert.ok(Array.isArray(idx.moves) && idx.moves.length > 500, 'index has a move table');
});

test('Phase 0: classification is served from the index (deterministic)', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(learn._fromIndex, 'Garchomp tags came from the precomputed index');
  assert.ok(learn.natural.length && learn.learnt.length, 'both buckets populated offline');
  assert.equal(ST.moveTagForSpecies('Garchomp', 'Earthquake'), 'learnt', 'Earthquake is a TM (Learnt)');
  assert.equal(ST.moveTagForSpecies('Garchomp', 'Outrage'), 'natural', 'Outrage is a level-up (Natural)');
});

test('Phase 1: per-city BP-cap table — 40/60/60/80/80/∞ (player & foe equal), starter cap+20', () => {
  assert.equal(ST.storyMoveBpCapForCity(0), 40, 'C0 = 40');
  assert.equal(ST.storyMoveBpCapForCity(1), 60, 'C1 = 60');
  assert.equal(ST.storyMoveBpCapForCity(2), 60, 'C2 = 60');
  assert.equal(ST.storyMoveBpCapForCity(3), 80, 'C3 = 80');
  assert.equal(ST.storyMoveBpCapForCity(4), 80, 'C4 = 80');
  assert.equal(ST.storyMoveBpCapForCity(5), Infinity, 'C5 = no cap');
  assert.equal(ST.storyMoveBpCapForCity(6), Infinity, 'C6 = no cap');
  assert.equal(ST.storyMoveBpCapForCity(9), Infinity, 'C9 (past array end) clamps to no cap');
  // Foe cap == player cap at every city (foe ≤ player rule, set equal in 1.6.0).
  for (let c = 0; c <= 9; c++) assert.equal(ST.storyFoeMoveBpCapForCity(c), ST.storyMoveBpCapForCity(c), `foe cap == player cap at C${c}`);
  // Starter advantage (Q9): city cap + 20 wherever a cap exists (so 60 at C0).
  assert.equal(ST.storyMoveBpCapForCity(0, true), 60, 'starter = 40+20 = 60 at C0');
  assert.equal(ST.storyMoveBpCapForCity(1, true), 80, 'starter = 60+20 = 80 at C1');
  assert.equal(ST.storyMoveBpCapForCity(3, true), 100, 'starter = 80+20 = 100 at C3');
  assert.equal(ST.storyMoveBpCapForCity(5, true), Infinity, 'starter bonus never changes an uncapped city');
});

test('Phase 1: foe gate per-city — C3 caps at 80 (legal ≤80 kept, over-cap stripped); C0 ≤40', async () => {
  primeStory();
  // Build-diversity overhaul: Learnt/TM moves are now ALLOWED for foes if ≤ the city
  // BP cap — only the BP cap + off-legal Awakened gate them. C3 (cap 80): Dragon
  // Claw(80,nat) survives; Outrage(120)/Earthquake(100) stripped as over-cap.
  const t3 = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(t3, cityRowIdx(3));
  assert.ok(!t3[0].build.m.includes('Outrage'), 'C3 (cap 80) strips Outrage (120)');
  assert.ok(!t3[0].build.m.includes('Earthquake'), 'C3 (cap 80) strips Earthquake (100)');
  assert.ok(t3[0].build.m.includes('Dragon Claw'), 'C3 keeps the ≤80 Natural Dragon Claw');
  for (const m of t3[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m.split('/')[0]);
    assert.notEqual(tag, 'awakened', `C3 must not keep an off-legal Awakened move ("${m}")`);
    assert.ok(bp(m.split('/')[0]) <= 80, `C3 foe kept "${m}" must be ≤80 BP (was ${bp(m.split('/')[0])})`);
  }
  // C0 (cap 40): every original move is >40 BP → all stripped, backfilled ≤40.
  const t0 = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(t0, cityRowIdx(0));
  assert.ok(!t0[0].build.m.includes('Outrage') && !t0[0].build.m.includes('Dragon Claw'), 'C0 (cap 40) strips both 120/80 BP moves');
  for (const m of t0[0].build.m) assert.ok(bp(m.split('/')[0]) <= 40, `C0 foe kept "${m}" must be ≤40 BP`);
});

test('Phase 1: foe gate at C5 lifts the BP cap and keeps the full LEGAL set (Learnt included)', async () => {
  primeStory();
  // C5: per-city cap is ∞. Under the foe gate all LEGAL moves (Natural + Learnt/TM)
  // are kept — coverage is no longer stripped. Only off-legal Awakened stays gated.
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(5));
  const kept = team[0].build.m;
  assert.ok(kept.includes('Outrage'), 'C5 keeps high-BP Natural (Outrage 120) — cap lifted');
  assert.ok(kept.includes('Earthquake') && kept.includes('Stone Edge'), 'C5 now keeps legal Learnt/TM coverage (Phase 1)');
  for (const m of kept) assert.notEqual(ST.moveTagForSpecies('Garchomp', m), 'awakened', `C5 must not keep an Awakened move ("${m}")`);
});

test('Phase 1: stage 2 (Guru) leaves moves untouched', async () => {
  primeStory();
  const team = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(2)));
  assert.deepEqual(team[0].build.m, ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance']);
});

test('Phase 1: bpCapOverride threads a resolved per-city cap into the shared helper', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp'); // warm the cache
  const build = { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] };
  // Pass the resolved C0 foe cap (40) explicitly — what _storyGateFoeMovesByCity does.
  ST.storyApplyMoveStageToBuild(build, 'Garchomp', 0, ST.storyCoherentMoveRanker, ST.storyFoeMoveBpCapForCity(0));
  for (const m of build.m) assert.ok(bp(m.split('/')[0]) <= 40, `foe-capped "${m}" ≤40 (was ${bp(m.split('/')[0])})`);
});

test('Phase 4: coherent downgrade keeps the build on-identity (STAB attacker)', async () => {
  primeStory();
  // Garchomp = Dragon/Ground, physical. A downgraded Inner build (BP cap + Learnt
  // stripped) should lead with its own STAB attacks (not generic filler / off-stat).
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(0)));
  const types = team[0].build.m.map(m => { const md = ST.ensureMoveData(m); return md ? md.type : '?'; });
  const stab = types.filter(t => t === 'Dragon' || t === 'Ground').length;
  assert.ok(stab >= 1, `coherent downgrade keeps ≥1 STAB move (got types ${types.join(',')})`);
  // No purely-special off-stat dump: at least one physical attack survives (Atk≥SpA mon).
  const cats = team[0].build.m.map(m => { const md = ST.ensureMoveData(m); return md ? md.cat : '?'; });
  assert.ok(cats.includes('Physical'), `physical attacker keeps a physical move (got ${cats.join(',')})`);
});

test('Phase 4: coherent ranker orders STAB damage above utility', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp');
  const ranked = ST.storyCoherentMoveRanker(['Sandstorm', 'Dragon Claw', 'Sand Tomb'], 'Garchomp');
  assert.notEqual(ranked[0], 'Sandstorm', 'a STAB attack outranks a weather utility move');
});

test('E1: degenerate ceiling fallback never empties the set, picks lowest BP', async () => {
  primeStory();
  // Beldum at C0 (cap 40): its ONLY Natural move is Take Down (90 BP), above the cap.
  // With NO ≤cap option in the allowed pool, the fallback must still yield a move (the
  // lowest-BP one) — not crash or leave an empty moveset.
  const learn = await ST.tutorFetchLearnsetMoveNames('Beldum'); // warm _tutorLearnsetCache
  assert.ok(learn.natural.length, 'precondition: Beldum has ≥1 Natural move');
  const build = { m: ['Flash Cannon', 'Meteor Mash', 'Bullet Punch', 'Zen Headbutt'] };
  const changed = ST.storyApplyMoveStageToBuild(build, 'Beldum', 0, ST.storyCoherentMoveRanker, ST.storyMoveBpCapForCity(0));
  assert.equal(changed, true, 'build changed — all originals were off-ceiling');
  assert.ok(build.m.length >= 1, 'fallback always yields at least one move (never empty)');
  const minNatBp = Math.min(...learn.natural.map(bp));
  assert.equal(bp(build.m[0].split('/')[0]), minNatBp, 'fallback picks the lowest-BP Natural move');
});
