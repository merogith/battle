// Enemy move pool (build-diversity overhaul — "diverse early, power scales"):
// below Guru the FOE gate keeps the full LEGAL movepool (Natural + Learnt/TM —
// coverage, setup, hazards, status) subject only to the per-city FOE BP cap, so a
// foe reads as a real role-coherent build instead of 4 basic STAB. Off-legal
// "Awakened" CSV moves are still excluded below Guru. Power is curbed by the BP cap
// + the low EV band, not by stripping move variety. Foe BP cap [40,60,60,80,80,∞].
//   C0–C2 (Inner):     legal moves, FOE BP ≤ 40/60/60.
//   C3–C5 (Unleashed): legal moves, BP ≤ 80/80/∞.
//   C6+   (Guru):      no gate — full pool (incl. Awakened).
// NOTE: the PLAYER wild/caught/gift gate is UNCHANGED (Natural-only + Learnt status
// — the catch-and-train headroom) — see story-wild-catch-movecap.test.js.
//
// We test by warming the learnset cache for a real species (Garchomp), then
// running a synthetic enemy team through _storyGateFoeMovesByCity at each stage
// and asserting the surviving moves obey the new foe contract. Cities are resolved
// via cityAtTutorStage() so the tests survive threshold tuning.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

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

function primeStory() {
  ST.sm.active = true;
  ST.sm.runSeed = 1;
  ST.sm._strngState = null;
  if (!ST.sm.settings) ST.sm.settings = {};
  ST.sm.settings.enabledGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm.badges = 0;
}
function cityAtTutorStage(stage) {
  for (let c = 0; c <= 12; c++) { if ((ST.npcStageForCity('tutor', c) | 0) === stage) return c; }
  return 0;
}

test('foe gate: Guru leaves moves untouched (full pool)', async () => {
  primeStory();
  const team = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(2)));
  // Guru short-circuits before any cache lookup; all 4 moves survive verbatim.
  assert.deepEqual(team[0].build.m, ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance'], 'no filtering at Guru tier');
});

test('foe gate: at Inner, legal moves (Natural + Learnt) survive within the BP cap; Awakened stripped', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(learn.natural.length && learn.learnt.length && learn.awakened.length, 'precondition: buckets populated (offline index)');
  const bp = (m) => { const md = ST.ensureMoveData(String(m).split('/')[0]); return md ? (md.pow | 0) : 0; };
  // Phase 1: a LEGAL Learnt/TM move within the foe BP cap must now be KEPT (the foe
  // gate opened to coverage/utility). Use C2 — Inner tier (tutor stage 0) with the
  // 60 BP cap — and prove a ≤60-BP learnt move survives. (C0's cap is 40.)
  assert.equal(ST.npcStageForCity('tutor', 2) | 0, 0, 'precondition: C2 is Inner-tier');
  const learntLow = (learn.learnt || []).find((m) => bp(m) <= 60 && bp(m) > 0);
  const natural = learn.natural[0];
  const awakened = learn.awakened[0];
  const team = [{ name: 'Garchomp', build: { m: [natural, learntLow || natural, awakened, awakened] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(2));
  for (const m of team[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.notEqual(tag, 'awakened', `Inner foe kept move "${m}" must not be Awakened (off-legal)`);
    assert.ok(bp(m) <= 60, `Inner (C2) foe kept move "${m}" must be ≤60 BP (was ${bp(m)})`);
  }
  if (learntLow) assert.ok(team[0].build.m.includes(learntLow), `legal ≤60 Learnt move "${learntLow}" should now survive the foe gate`);
});

test('foe gate: at Unleashed, Learnt/TM coverage is kept; Awakened still stripped', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(learn.learnt.length && learn.awakened.length, 'precondition: buckets populated (offline index)');
  const bp = (m) => { const md = ST.ensureMoveData(String(m).split('/')[0]); return md ? (md.pow | 0) : 0; };
  const learntLow = (learn.learnt || []).find((m) => bp(m) <= 80) || learn.learnt[0];
  const awakened = learn.awakened[0];
  const team = [{ name: 'Garchomp', build: { m: [learntLow, awakened, learntLow, awakened] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(1)));
  // Phase 1: Learnt/TM is now allowed for foes (subject to BP cap); only off-legal
  // Awakened is still stripped below Guru.
  for (const m of team[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.notEqual(tag, 'awakened', `Unleashed foe kept move "${m}" must not be Awakened`);
  }
  assert.ok(team[0].build.m.some((m) => ST.moveTagForSpecies('Garchomp', m) === 'learnt'),
    'a Learnt/TM move survives the foe gate at Unleashed (Phase 1)');
});
