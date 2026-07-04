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

test('the starter follows the same filter with a cap+20 BP allowance (Q9)', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp');
  // isStarter arg → allowance 40+20=60 at C0: everything over 60 BP (and all TMs) strips.
  const b1 = { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] };
  assert.equal(await ST.storyFilterBuildMovesForCity(b1, 'Garchomp', 0, true), true, 'starter IS filtered (at cap+20)');
  for (const m of b1.m) {
    assert.ok(tag('Garchomp', m) === 'natural' || tag('Garchomp', m) === 'unknown', `kept "${m}" is natural`);
    assert.ok(bp(m) <= 60, `kept "${m}" is within the starter allowance (≤60, was ${bp(m)})`);
  }
  // build.starter flag carries the same allowance: a 60-BP natural move survives for
  // the starter at C0 where a non-starter (cap 40) would lose it.
  const b2 = { m: ['Outrage', 'Bulldoze'], starter: true };
  await ST.storyFilterBuildMovesForCity(b2, 'Garchomp', 0, false);
  assert.ok(b2.m.includes('Bulldoze'), 'Bulldoze (60) survives for the starter at C0');
  assert.ok(!b2.m.includes('Outrage'), 'Outrage (120) does not');
  const b3 = { m: ['Bulldoze', 'Tackle'] };
  await ST.storyFilterBuildMovesForCity(b3, 'Garchomp', 0, false);
  assert.ok(!b3.m.includes('Bulldoze'), 'the same 60-BP move IS stripped for a non-starter at C0');
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
  const highNat = (learn.natural || []).find(m => bp(m) > 40);
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
