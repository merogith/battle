// 1.6.1 — wild / caught / gift Pokémon follow the same per-city moveset ruleset as
// trainer foes via _storyFilterBuildMovesForCity: natural moves within the city BP cap.
// Stripped moves are RE-TEACHABLE through the Move Tutor as the city cap lifts (so the
// filter is reversible, mirroring real-Pokémon "slowly get stronger" pacing). The
// professor's first-choice STARTER follows the same filter with a cap+20 BP allowance
// (Q9 — replaces the old blanket exemption; the battle clamp mirrors the same bonus).
//   node --test tests/suites/story-wild-catch-movecap.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

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
const bp = (m) => { const md = ST.ensureMoveData(String(m).split('/')[0]); return md ? (md.pow | 0) : 0; };
const tag = (mon, m) => { try { return ST.moveTagForSpecies(mon, String(m).split('/')[0]); } catch (e) { return 'unknown'; } };

test('wild/caught build is filtered to natural moves within the city cap (C0 = 40)', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp');
  // Outrage(120,nat) + Dragon Claw(80,nat) are over the C0 cap; Earthquake/Stone Edge are TMs.
  const build = { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] };
  const changed = await ST.storyFilterBuildMovesForCity(build, 'Garchomp', 0, false);
  assert.equal(changed, true, 'an over-cap wild build is filtered at C0');
  for (const m of build.m) {
    assert.ok(tag('Garchomp', m) === 'natural' || tag('Garchomp', m) === 'unknown', `kept "${m}" is natural`);
    assert.ok(bp(m) <= 40, `kept "${m}" is within the C0 cap (≤40, was ${bp(m)})`);
  }
  assert.ok(build.m.length >= 1, 'never leaves an empty moveset');
});

test('the starter can generate moves one tier earlier than a wild catch', async () => {
  primeStory();
  const starter = { m: ['Outrage', 'Bite'], starter: true };
  const ordinary = { m: [...starter.m] };
  await ST.storyFilterBuildMovesForCity(starter, 'Garchomp', 0, false);
  await ST.storyFilterBuildMovesForCity(ordinary, 'Garchomp', 0, false);
  assert.ok(starter.m.includes('Bite'));
  assert.ok(!starter.m.includes('Outrage'));
  assert.ok(!ordinary.m.includes('Bite'));
});

test('Guru cities (C6+) leave the moveset unfiltered (full pool, matches trainers)', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp');
  const build = { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Swords Dance'] };
  assert.equal(await ST.storyFilterBuildMovesForCity(build, 'Garchomp', cityAtTutorStage(2), false), false, 'Guru → no-op');
  assert.deepEqual(build.m, ['Outrage', 'Earthquake', 'Stone Edge', 'Swords Dance'], 'unchanged at Guru');
});

test('reversible-via-tutor: a stripped natural move is re-offered once the city cap lifts', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  // A high-BP NATURAL move (>40) that C0 strips but the tutor can re-teach later.
  const highNat = learn.natural.find(m => ST.storyMoveLessonTier('Garchomp', m) === 4);
  assert.ok(highNat, 'precondition: Garchomp has a >40-BP natural move');
  // Filter a caught build at C0 → the high-BP natural move is stripped.
  const build = { m: [highNat, 'Earthquake', 'Stone Edge', 'Dragon Claw'] };
  await ST.storyFilterBuildMovesForCity(build, 'Garchomp', 0, false);
  assert.ok(!build.m.includes(highNat), `C0 strips the over-cap natural move (${highNat})`);
  // The Move Tutor at a city where the cap has lifted re-offers it (grows back).
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 5) { ST.sm.eventIndex = ei; break; } }
  const pool = new Set(await ST.tutorGetStagedMovePoolAsync('Garchomp', []));
  assert.ok(pool.has(highNat), `the Move Tutor re-offers ${highNat} once the cap lifts (C5)`);
});

test('graceful no-op when the species learnset is unavailable (cold cache / offline)', async () => {
  primeStory();
  const build = { m: ['Outrage', 'Earthquake'] };
  // A nonsense species never resolves a learnset → the filter leaves the build as-is
  // (the battle-time clamp still caps damage). Must not throw or empty the moveset.
  const changed = await ST.storyFilterBuildMovesForCity(build, 'NotARealSpecies1234', 0, false);
  assert.equal(changed, false, 'unknown species → no-op');
  assert.deepEqual(build.m, ['Outrage', 'Earthquake'], 'moveset untouched on cold cache');
});

test('inactive story run → no filtering (filter is story-only)', async () => {
  ST.sm.active = false;
  const build = { m: ['Outrage', 'Earthquake'] };
  assert.equal(await ST.storyFilterBuildMovesForCity(build, 'Garchomp', 0, false), false, 'no-op when sm inactive');
  assert.deepEqual(build.m, ['Outrage', 'Earthquake'], 'moveset untouched outside an active run');
});

test('preparing Professor offers restores the story RNG and discards a departed visit', async () => {
  primeStory();
  Object.assign(ST.sm, { eventIndex: 0, team: [], profUsed: {} });
  const { document, StoryMode, storyRngNext } = eng.window;
  const cards = document.getElementById('story-prof-rolled-card');
  const lab = document.getElementById('screen-story-professor');

  const preparation = StoryMode.enterProfessor();
  assert.equal(eng.window.storyRngNext, storyRngNext, 'seeding ends before the first await');
  assert.equal(ST.sm._strngState, null, 'rolling an offer leaves the world RNG cursor alone');
  assert.equal(cards.children.length, 0, 'no raw preview is rendered while preparing');

  StoryMode.showMenu(false);
  await preparation;
  assert.ok(lab.classList.contains('hidden'));
  assert.equal(cards.children.length, 0, 'a departed visit cannot render a late offer');

  await StoryMode.enterProfessor();
  assert.equal(cards.querySelectorAll('.prof-pick-card').length, 3);
  assert.equal(ST.sm._strngState, null, 'rendering the offer leaves the world RNG cursor alone');
});
