// Verifies the enemy-mechanics city floor (Phase 1f): battle gimmicks (Mega /
// Z / Dynamax / Tera) stay off for enemies until City 7 — the player unlocks and
// uses them a city earlier. Above C7 the existing per-mon/guaranteed distribution
// (parity-gated, difficulty-scaled) takes over unchanged.
// Run: node --test tests/suites/story-build-curve-mechanics.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 7, team: [],
    settings: { enabledGens: GENS.slice(), megaOn: true, classicMode: true },
    unlockedGimmicks: ['mega'], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {},
  }, extra);
}
setSm();

const RAW = ST.STORY_EVENTS_RAW;
const N = RAW.length;
const cityRowFor = (c) => { for (let i = 0; i < N; i++) if (ST.cityIndexFromEventIndex(i) === c) return i; return -1; };
const countMechs = (eventType, row, trials = 8) => {
  let mech = 0;
  for (let t = 0; t < trials; t++) {
    const team = [{ name: 'Charizard', build: {} }, { name: 'Venusaur', build: {} }, { name: 'Blastoise', build: {} }];
    ST.applyEnemyGimmickDistribution(team, eventType, null, row);
    for (const m of team) if (m.build && m.build.gimmick && m.build.gimmick !== 'STANDARD') mech++;
  }
  return mech;
};

test('enemy mechanics are floored to zero before City 7', () => {
  setSm();
  for (const c of [0, 2, 4, 5, 6]) {
    const row = cityRowFor(c);
    assert.ok(row >= 0, `found a C${c} row`);
    // Even a Gym Leader 8 event (max guaranteed) with Mega unlocked gets nothing pre-C7.
    assert.equal(countMechs('Gym Leader 8', row), 0, `C${c}: no enemy mechanics (floored)`);
  }
});

test('the floor lifts at City 7+ (distribution runs)', () => {
  setSm({ badges: 8 });
  const row7 = cityRowFor(7), row8 = cityRowFor(8);
  // Mega is unlocked + species are Mega-capable, so the guaranteed-mech path should
  // assign at least one across trials once the floor lifts.
  const total = countMechs('Gym Leader 8', row7, 12) + countMechs('Gym Leader 8', row8, 12);
  assert.ok(total > 0, `C7/C8 produced ${total} mechanics (floor lifted)`);
});

test('Mystery Figure (no storyRowIdx) bypasses the floor entirely', () => {
  setSm({ badges: 8 });
  // Called with an explicit mech ctx + no storyRowIdx — must not be floored.
  let mech = 0;
  for (let t = 0; t < 12; t++) {
    const team = [{ name: 'Charizard', build: {} }, { name: 'Venusaur', build: {} }];
    ST.applyEnemyGimmickDistribution(team, 'Mystery Figure', { settings: { enabledGens: GENS.slice(), megaOn: true, classicMode: true } });
    for (const m of team) if (m.build && m.build.gimmick && m.build.gimmick !== 'STANDARD') mech++;
  }
  assert.ok(mech > 0, `Mystery Figure assigned ${mech} mechanics (not floored)`);
});
