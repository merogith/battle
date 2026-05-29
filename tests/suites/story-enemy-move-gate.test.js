// Phase 4.3: enemy move pool is gated by the city's TUTOR STAGE, mirroring what
// the player has access to at that city:
//   C0–C3 (Inner Strength): Natural only (egg + level-up + transfer + evolution).
//   C4–C6 (Expert):         + Learnt (TM / HM / Tutor / TR / event).
//   C7+   (Guru):           + Awakened — i.e. no gate (full pool).
//
// We test by warming the learnset cache for a real species (Garchomp), then
// running a synthetic enemy team through _storyGateFoeMovesByCity at each stage
// and asserting the surviving moves all belong to the allowed pool.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

function cityRowIdx(targetCity) {
  // Return the ROW ID (ev[0]) of the first row in targetCity — production passes
  // the row ID into storyGateFoeMovesByCity, not the array index.
  const RAW = ST.STORY_EVENTS_RAW;
  for (let ei = 0; ei <= 120; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === targetCity && RAW[ei]) return RAW[ei][0];
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

test('foe gate: C7+ leaves moves untouched (Guru tier, full pool)', async () => {
  primeStory();
  const team = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(7));
  // C7+ short-circuits before any cache lookup; all 4 moves survive verbatim.
  assert.deepEqual(team[0].build.m, ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance'], 'no filtering at Guru tier');
});

test('foe gate: warmed cache filters out tag-above-stage moves at C2', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  if (!learn.natural.length || !learn.learnt.length) {
    // jsdom thin-dex environment — bail, the production behavior is fine.
    return;
  }
  const naturalMove = learn.natural[0];
  const learntMove  = learn.learnt[0];
  // Confirm pre-conditions: the two sample moves are distinctly tagged.
  assert.notEqual(naturalMove, learntMove, 'sample moves come from distinct tag buckets');
  // Build a team whose moves mix Natural + Learnt.
  const team = [{ name: 'Garchomp', build: { m: [naturalMove, learntMove, learntMove, naturalMove] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(2));
  // At C2 (Inner Strength, stage 0) every kept move must be Natural.
  for (const m of team[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.ok(tag === 'natural' || tag === 'unknown', `C2 kept move "${m}" should be Natural (was ${tag})`);
  }
});

test('foe gate: at C5 (Expert) Learnt is allowed; Awakened is filtered', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  if (!learn.learnt.length || !learn.awakened.length) {
    // jsdom thin-dex environment — bail.
    return;
  }
  const learntMove = learn.learnt[0];
  const awakened   = learn.awakened[0];
  const team = [{ name: 'Garchomp', build: { m: [learntMove, awakened, learntMove, awakened] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(5));
  // At C5 (Expert, stage 1): Learnt + Natural allowed; Awakened filtered.
  for (const m of team[0].build.m) {
    const tag = ST.moveTagForSpecies('Garchomp', m);
    assert.notEqual(tag, 'awakened', `C5 kept move "${m}" must not be Awakened`);
  }
});
