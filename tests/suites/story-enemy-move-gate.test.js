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
import { ClassicSimulation } from '../../scripts/competitive/classic-simulation.mjs';

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

test('an early foe with a status-only build keeps its utility and gains a legal attack', async () => {
  primeStory();
  const team = [{ name: 'Poochyena', build: { m: ['Howl'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(0));
    const [utility, attack] = team[0].build.m;
    const learn = await ST.tutorFetchLearnsetMoveNames('Poochyena');
    assert.equal(utility, 'Howl');
    assert.ok([...learn.natural, ...learn.learnt].includes(attack));
    assert.notEqual(attack, 'Snore');

    const player = ST.buildPokemon('Mew', { m: ['Splash'] });
    const foe = ST.buildPokemon(team[0].name, team[0].build);
    const session = new ClassicSimulation({
      seed: 12, playerParty: [player], foeParty: [foe], rules: { scenario: { caps: { p2: [40] } } },
    });
    session.choose('p1', { kind: 'move', slot: 0 });
    const next = session.choose('p2', { kind: 'move', slot: 1 });
    assert.ok(next.player[0].hp < player.maxHp, 'the prepared attack works from the opening turn');
});

test('generated foes use the same ordinary move lessons at every city', async () => {
  primeStory();
  const moveList = ['Toxic', 'Swords Dance', 'Outrage', 'Earthquake'];
  for (const city of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const build = { m: [...moveList] };
    const team = [{ name: 'Garchomp', build }];
    const rowId = cityRowIdx(city);
    ST.sm.eventIndex = ST.STORY_EVENTS_RAW.findIndex(row => row[0] === rowId);
    const playerPool = await ST.tutorGetStagedMovePool('Garchomp', []);
    await ST.storyGateFoeMovesByCity(team, rowId);
    assert.ok(build.m.length >= 1);
    assert.ok(build.m.every(move => playerPool.includes(move)), `City ${city}: ${build.m}`);
    assert.equal(build.m.includes('Earthquake'), city >= 5, `Earthquake, City ${city}`);
    assert.equal(build.m.includes('Outrage'), city >= 7, `Outrage, City ${city}`);
  }
});
