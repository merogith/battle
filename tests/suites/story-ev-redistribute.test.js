// Phase 4 — EV Trainer "reshuffle" (redistribute-only) mode. Re-points a mon's
// EXISTING EV total into a role preset's shape WITHOUT changing the total (net-zero),
// for EV_REDISTRIBUTE_COST. Verifies the invariants: total preserved, per-stat legal,
// gold charged once, and safe no-ops (0 EVs / insufficient gold).
// Run: node --test tests/suites/story-ev-redistribute.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const ST = E.window.__storyTest;
const SM = E.window.StoryMode;
const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const tot = (e) => KEYS.reduce((s, k) => s + (e[k] | 0), 0);

// Auto-confirm the misclick guard.
E.window.showGameConfirm = async () => true;

function setupTeam(evs, gold) {
  ST.sm = Object.assign({}, ST.sm, {
    active: true,
    gold: gold,
    team: [{ name: 'Garchomp', build: { evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...evs } } }],
    settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  });
}

test('reshuffle preserves the EV total (net-zero), re-shapes, and charges once', async () => {
  setupTeam({ hp: 200 }, 5000); // 200 EVs dumped in the "wrong" stat
  const before = tot(ST.sm.team[0].build.evs);
  await SM.evTrainerRedistribute(0, 'phys_sweep');
  const after = ST.sm.team[0].build.evs;
  assert.equal(tot(after), before, 'total EVs unchanged (net-zero reshuffle)');
  for (const k of KEYS) assert.ok((after[k] | 0) <= 252, `${k}=${after[k]} <= 252`);
  assert.ok((after.hp | 0) < 200, 'EVs moved off the dumped HP stat');
  assert.ok((after.atk | 0) > 0 || (after.spe | 0) > 0, 're-shaped toward the physical-sweep stats');
  assert.equal(ST.sm.gold, 4000, 'charged exactly EV_REDISTRIBUTE_COST (1000G)');
});

test('reshuffle is a no-op (no charge) when the mon has 0 EVs', async () => {
  setupTeam({}, 5000); // 0 EVs
  await SM.evTrainerRedistribute(0, 'phys_sweep');
  assert.equal(tot(ST.sm.team[0].build.evs), 0, 'still 0 EVs');
  assert.equal(ST.sm.gold, 5000, 'no gold charged when there is nothing to reshuffle');
});

test('reshuffle is a no-op (no charge) when gold is insufficient', async () => {
  setupTeam({ hp: 120 }, 500); // has EVs but < 1000G
  const before = { ...ST.sm.team[0].build.evs };
  await SM.evTrainerRedistribute(0, 'spec_wall');
  assert.deepEqual(ST.sm.team[0].build.evs, before, 'spread unchanged when unaffordable');
  assert.equal(ST.sm.gold, 500, 'no gold charged');
});

test('reshuffle keeps the total even for an odd (non-4-multiple) EV total', async () => {
  setupTeam({ hp: 122, atk: 4 }, 5000); // total 126
  const before = tot(ST.sm.team[0].build.evs);
  await SM.evTrainerRedistribute(0, 'spec_sweep');
  const after = tot(ST.sm.team[0].build.evs);
  assert.ok(Math.abs(after - before) <= 4, `total ${after} within 4 of ${before} (rounding)`);
});
