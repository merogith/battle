// Enemy move pool is gated by the city's TUTOR STAGE (user model), mirroring what
// the player can teach at that city. Thresholds tutor:[0,2,5]:
//   C0–C1 (Inner Strength): Natural only, BP ≤ 75.
//   C2–C4 (Unleashed):      ALL Natural (cap lifts; still NO Learnt/TM).
//   C5+   (Guru):           no gate — full pool (Natural + Learnt + Awakened).
//
// We test by warming the learnset cache for a real species (Garchomp), then
// running a synthetic enemy team through _storyGateFoeMovesByCity at each stage
// and asserting the surviving moves all belong to the allowed pool. Cities are
// resolved via cityAtTutorStage() so the tests survive threshold tuning.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

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

test('foe gate: at Inner, only Natural moves survive (Learnt stripped)', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(learn.natural.length && learn.learnt.length, 'precondition: buckets populated (offline index)');
  const naturalMove = learn.natural[0];
  const learntMove  = learn.learnt[0];
  assert.notEqual(naturalMove, learntMove, 'sample moves come from distinct tag buckets');
  const team = [{ name: 'Garchomp', build: { m: [naturalMove, learntMove, learntMove, naturalMove] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(0)));
  // At Inner (stage 0) every kept move must be Natural.
  for (const m of team[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.ok(tag === 'natural' || tag === 'unknown', `Inner kept move "${m}" should be Natural (was ${tag})`);
  }
});

test('foe gate: at Unleashed, Learnt AND Awakened are filtered (Natural only)', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(learn.learnt.length && learn.awakened.length, 'precondition: buckets populated (offline index)');
  const learntMove = learn.learnt[0];
  const awakened   = learn.awakened[0];
  const team = [{ name: 'Garchomp', build: { m: [learntMove, awakened, learntMove, awakened] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(1)));
  // User model: at Unleashed (stage 1) ONLY Natural is allowed — both Learnt/TM and
  // Awakened are stripped (TMs unlock only at Guru). The all-Learnt/Awakened set is
  // fully replaced by Natural backfill.
  for (const m of team[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.notEqual(tag, 'awakened', `Unleashed kept move "${m}" must not be Awakened`);
    assert.notEqual(tag, 'learnt', `Unleashed kept move "${m}" must not be Learnt/TM`);
  }
});
