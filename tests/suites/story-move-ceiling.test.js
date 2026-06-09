// Phase 0 + Phase 1 — the unified move-pacing ceiling.
//
// Phase 0: the Natural/Learnt classification is served from the precomputed
//   data/move-tags.json index (offline-safe), so the gate no longer silently
//   no-ops without a CDN.
// Phase 1: the gate is the single move-pacing authority, keyed on tutor stage
// (user model — TMs/tutor moves unlock only at Guru). Thresholds tutor:[0,2,5]:
//   stage 0 (Inner,     C0–C1): Natural-tag only. Player BP ≤ 75; FOES ≤ 60 (a tighter
//                               early-game ceiling — STORY_FOE_MOVE_BP_CAP_BY_STAGE).
//   stage 1 (Unleashed, C2–C4): ALL Natural (BP cap lifts; still NO Learnt/TM).
//   stage 2 (Guru,      C5+):   no gate (Natural + Learnt + Awakened).
// NB: tests resolve cities via cityAtTutorStage() so they survive threshold tuning.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

function cityRowIdx(targetCity) {
  for (let ei = 0; ei <= 120; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === targetCity) return ei;
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

test('Phase 1: BP-cap table — player 75 / foe 60 at stage 0 (foe ≤ player), none after', () => {
  // Player (shared) authority: 75 at stage 0, uncapped after.
  assert.equal(ST.storyMoveBpCapForStage(0), 75, 'player stage 0 caps at 75');
  assert.equal(ST.storyMoveBpCapForStage(1), Infinity, 'player stage 1 uncapped');
  assert.equal(ST.storyMoveBpCapForStage(2), Infinity, 'player stage 2 uncapped');
  // Foe-only ceiling: tighter at stage 0 (early-game nerf), never above the player's.
  assert.equal(ST.storyFoeMoveBpCapForStage(0), 60, 'foe stage 0 caps at 60 (early-game nerf)');
  assert.ok(ST.storyFoeMoveBpCapForStage(0) <= ST.storyMoveBpCapForStage(0), 'foe cap ≤ player cap at stage 0');
  assert.equal(ST.storyFoeMoveBpCapForStage(1), Infinity, 'foe stage 1 uncapped');
  assert.equal(ST.storyFoeMoveBpCapForStage(2), Infinity, 'foe stage 2 uncapped');
});

test('Phase 1: stage 0 (Inner) foe gate = Natural only AND BP ≤ 60', async () => {
  primeStory();
  // Outrage(120,nat) Dragon Claw(80,nat) are Natural but ABOVE the 60 foe cap → stripped.
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(0)));
  for (const m of team[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.ok(tag === 'natural' || tag === 'unknown', `Inner kept "${m}" must be Natural (was ${tag})`);
    assert.ok(bp(m) <= 60, `Inner foe kept "${m}" must be ≤60 BP (was ${bp(m)})`);
  }
  assert.equal(team[0].build.m.length, 4, 'still a full 4-move set after coherent backfill');
});

test('Phase 1: stage 1 (Unleashed) = ALL Natural, NO Learnt, no BP cap', async () => {
  primeStory();
  // Outrage(120) + Dragon Claw(80) are high-BP Natural → KEPT (cap lifts at Unleashed).
  // Earthquake + Stone Edge are TMs (Learnt) → STRIPPED (Learnt unlocks only at Guru).
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(1)));
  const kept = team[0].build.m;
  assert.ok(kept.includes('Outrage'), 'Unleashed keeps high-BP Natural (Outrage 120) — cap is lifted');
  for (const m of kept) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.notEqual(tag, 'learnt', `Unleashed must NOT keep a Learnt/TM move ("${m}")`);
  }
  assert.ok(!kept.includes('Earthquake') && !kept.includes('Stone Edge'), 'Unleashed strips TMs (Earthquake/Stone Edge)');
});

test('Phase 1: stage 2 (Guru) leaves moves untouched', async () => {
  primeStory();
  const team = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(2)));
  assert.deepEqual(team[0].build.m, ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance']);
});

test('Phase 1: _storyApplyMoveStageToBuild is the shared helper (direct)', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp'); // warm the cache
  const build = { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] };
  // No override → falls back to the shared PLAYER cap (75).
  const changed = ST.storyApplyMoveStageToBuild(build, 'Garchomp', 0);
  assert.ok(changed, 'stage 0 changes a 120-BP Smogon set');
  for (const m of build.m) assert.ok(bp(m) <= 75, `${m} ≤75`);
});

test('Phase 1: bpCapOverride threads the foe ceiling (60) into the shared helper', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp'); // warm the cache
  const build = { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] };
  // Pass the resolved foe cap explicitly (what _storyGateFoeMovesByCity does).
  ST.storyApplyMoveStageToBuild(build, 'Garchomp', 0, ST.storyCoherentMoveRanker, ST.storyFoeMoveBpCapForStage(0));
  for (const m of build.m) assert.ok(bp(m.split('/')[0]) <= 60, `foe-capped "${m}" ≤60 (was ${bp(m.split('/')[0])})`);
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
  // Beldum at stage 0 (Inner): its ONLY Natural move is Take Down (90 BP), which is
  // above the stage-0 cap (75). With NO ≤cap option in the allowed pool, the fallback
  // must still yield a move (the lowest-BP one) — not crash or leave an empty moveset.
  const learn = await ST.tutorFetchLearnsetMoveNames('Beldum'); // warm _tutorLearnsetCache
  assert.ok(learn.natural.length, 'precondition: Beldum has ≥1 Natural move');
  const build = { m: ['Flash Cannon', 'Meteor Mash', 'Bullet Punch', 'Zen Headbutt'] };
  const changed = ST.storyApplyMoveStageToBuild(build, 'Beldum', 0, ST.storyCoherentMoveRanker);
  assert.equal(changed, true, 'build changed — all originals were off-ceiling');
  assert.ok(build.m.length >= 1, 'fallback always yields at least one move (never empty)');
  const minNatBp = Math.min(...learn.natural.map(bp));
  assert.equal(bp(build.m[0].split('/')[0]), minNatBp, 'fallback picks the lowest-BP Natural move');
});
