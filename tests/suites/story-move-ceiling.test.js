// Phase 0 + Phase 1 — the unified move-pacing ceiling.
//
// Phase 0: the Natural/Learnt classification is served from the precomputed
//   data/move-tags.json index (offline-safe), so the gate no longer silently
//   no-ops without a CDN.
// Phase 1: the gate is the single move-pacing authority, keyed on tutor stage:
//   stage 0 (Inner, C0–C3): Natural-tag only, BP ≤ 75.
//   stage 1 (Expert, C4–C6): Natural + Learnt, no BP cap.
//   stage 2 (Guru,  C7+):    no gate.
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

test('Phase 1: BP-cap table — 75 at stage 0, none after', () => {
  assert.equal(ST.storyMoveBpCapForStage(0), 75, 'stage 0 caps at 75');
  assert.equal(ST.storyMoveBpCapForStage(1), Infinity, 'stage 1 uncapped');
  assert.equal(ST.storyMoveBpCapForStage(2), Infinity, 'stage 2 uncapped');
});

test('Phase 1: stage 0 (C0–3) = Natural only AND BP ≤ 75', async () => {
  primeStory();
  // Outrage(120,nat) Dragon Claw(80,nat) are Natural but ABOVE the 75 cap → stripped.
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(2));
  for (const m of team[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.ok(tag === 'natural' || tag === 'unknown', `C2 kept "${m}" must be Natural (was ${tag})`);
    assert.ok(bp(m) <= 75, `C2 kept "${m}" must be ≤75 BP (was ${bp(m)})`);
  }
  assert.equal(team[0].build.m.length, 4, 'still a full 4-move set after coherent backfill');
});

test('Phase 1: stage 1 (C4–6) allows Learnt and removes the BP cap', async () => {
  primeStory();
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(5));
  // All four are Natural or Learnt, so at C5 the whole set survives (no cap).
  assert.deepEqual(team[0].build.m, ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'], 'C5 keeps Learnt + high-BP moves');
});

test('Phase 1: stage 2 (C7+) leaves moves untouched', async () => {
  primeStory();
  const team = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(7));
  assert.deepEqual(team[0].build.m, ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance']);
});

test('Phase 1: _storyApplyMoveStageToBuild is the shared helper (direct)', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp'); // warm the cache
  const build = { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] };
  const changed = ST.storyApplyMoveStageToBuild(build, 'Garchomp', 0);
  assert.ok(changed, 'stage 0 changes a 120-BP Smogon set');
  for (const m of build.m) assert.ok(bp(m) <= 75, `${m} ≤75`);
});

test('Phase 4: coherent downgrade keeps the build on-identity (STAB attacker)', async () => {
  primeStory();
  // Garchomp = Dragon/Ground, physical. A downgraded C2 build should lead with its
  // own STAB attacks (not generic Tackle / off-stat special moves).
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(2));
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
