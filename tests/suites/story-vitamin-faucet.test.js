// Regression guard for the flat-5 IV-vitamin faucet + EV-Voucher gate alignment
// (Story rewards Step 2). The per-fight vitamin faucet is now a uniform 5 for every
// non-boss trainer rank (Basic / Gym Trainer / Elite / Rival). True bosses stay 0 in
// the faucet because they bundle their vitamins in GYM_VICTORY_REWARDS (the matrix
// artifact later moves them onto the faucet). The EV Voucher (`vitamin` key) now
// debuts at C7, matching the EV Trainer facility (FACILITY_DEBUT_CITY.evtrainer).
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

test('true bosses stay 0 in the faucet (vitamins bundled in GYM_VICTORY_REWARDS)', () => {
  for (const boss of ['Gym Leader 1', 'Gym Leader 8', 'E1', 'E4', 'Champion', 'Mystery Figure']) {
    assert.equal(ST.storyTrainerLootVitamins(boss), 0, boss);
  }
});

test('VITAMIN_LOOT_BY_CLASS is the locked flat-5 shape', () => {
  const t = ST.VITAMIN_LOOT_BY_CLASS;
  assert.equal(t.REGULAR, 5);
  assert.equal(t.ACE, 5);
  assert.equal(t.BOSS, 0);
});

test('EV Voucher gate matches the EV Trainer facility debut (C7) (Q1)', () => {
  assert.equal(ST.VOUCHER_DEBUT_CITY.vitamin, 7);
});

test('unrecognized event name yields 0 (no accidental faucet)', () => {
  assert.equal(ST.storyTrainerLootVitamins('Sailor'), 0);
  assert.equal(ST.storyTrainerLootVitamins(''), 0);
});
