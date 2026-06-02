// Regression guard for the flat-5 IV-vitamin faucet + EV-Voucher gate alignment.
// The per-fight vitamin faucet is a uniform 5 for EVERY fight — Basic / Gym Trainer /
// Elite / Rival AND bosses (Gym Leaders / E1-4 / Champion / MF). Each rank/role is an
// independent knob (REGULAR/ACE/BOSS in VITAMIN_LOOT_BY_CLASS + a separate
// VITAMIN_LOOT_RIVAL). Bosses no longer bundle vitamins in GYM_VICTORY_REWARDS. The
// EV Voucher (`vitamin` key) debuts at C7, matching the EV Trainer facility.
//
// Reached through window.__storyTest — the harness-gated hook (load-engine.js sets
// window.__testHarness before parse).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const ST = E.window.__storyTest;

test('__storyTest exposes the faucet + gate hooks', () => {
  assert.ok(ST, 'window.__storyTest present');
  assert.equal(typeof ST.storyTrainerLootVitamins, 'function');
  assert.equal(typeof ST.VITAMIN_LOOT_BY_CLASS, 'object');
  assert.equal(typeof ST.VOUCHER_DEBUT_CITY, 'object');
});

test('vitamin faucet is a flat 5 for every non-boss trainer rank (D7)', () => {
  assert.equal(ST.storyTrainerLootVitamins('Basic Trainer'), 5);
  assert.equal(ST.storyTrainerLootVitamins('Gym Trainer 1'), 5);
  assert.equal(ST.storyTrainerLootVitamins('Gym Trainer 2'), 5);
  assert.equal(ST.storyTrainerLootVitamins('Elite Trainer'), 5);
});

test('rival drips a flat 5 with no badge ramp (Q4)', () => {
  // The rival is BOSS-classified but special-cased before classification, so it must
  // return 5 directly — independent of sm.badges (the old 3->8 ramp is gone).
  const sm = ST.sm;
  if (sm) { sm.active = true; sm.badges = 0; }
  assert.equal(ST.storyTrainerLootVitamins('Rival'), 5, '0 badges');
  if (sm) sm.badges = 8;
  assert.equal(ST.storyTrainerLootVitamins('Rival'), 5, '8 badges');
});

test('bosses drip 5 from the faucet too (vitamins no longer bundled)', () => {
  for (const boss of ['Gym Leader 1', 'Gym Leader 8', 'E1', 'E4', 'Champion', 'Mystery Figure']) {
    assert.equal(ST.storyTrainerLootVitamins(boss), 5, boss);
  }
});

test('VITAMIN_LOOT_BY_CLASS is the locked flat-5 shape (all ranks = 5)', () => {
  const t = ST.VITAMIN_LOOT_BY_CLASS;
  assert.equal(t.REGULAR, 5);
  assert.equal(t.ACE, 5);
  assert.equal(t.BOSS, 5);
});

test('EV Voucher gate matches the EV Trainer facility debut (C7) (Q1)', () => {
  assert.equal(ST.VOUCHER_DEBUT_CITY.vitamin, 7);
});

test('unrecognized event name yields 0 (no accidental faucet)', () => {
  assert.equal(ST.storyTrainerLootVitamins('Sailor'), 0);
  assert.equal(ST.storyTrainerLootVitamins(''), 0);
});
