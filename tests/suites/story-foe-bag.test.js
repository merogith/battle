// Phase 2 — enemy "kit tiers" (integration). Verifies the boss/anchor rows in the real
// STORY_EVENTS_RAW resolve to the right consumable tier + signature via the actual
// buildFoeStoryInventoryForBattle. (Unit tests in foe-item-system.test.js craft the inv
// object directly; this is the "the real story rows wire up correctly" check.)
// Replaces the old Phase-4.6 "+1 Full Restore" boss-delta assertions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

function rowIdxForLabel(label) {
  for (let i = 0; i < eng.window.STORY_EVENTS_RAW.length; i++) {
    const r = eng.window.STORY_EVENTS_RAW[i];
    if (Array.isArray(r) && r[1] === 'Battle' && r[2] === label) return i;
  }
  return -1;
}

function primeBattleAt(label) {
  ST.sm.active = true;
  ST.sm.runSeed = 1;
  if (!ST.sm.settings) ST.sm.settings = {};
  ST.sm.settings.enabledGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm.storyDifficulty = 'normal';
  ST.sm.badges = 8;     // late-game (E4 / Champion / Mystery happen at the League)
  ST.sm.gymCleared = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true };
  const idx = rowIdxForLabel(label);
  if (idx < 0) return false;
  ST.sm.eventIndex = idx;
  return true;
}

test('Champion bag: tier 3 — Max Potion + Full Heal + INSTANT Mega signature + Revive', () => {
  if (!primeBattleAt('Champion')) return;
  const inv = eng.window.buildFoeStoryInventoryForBattle();
  assert.ok(inv, 'inventory returned');
  assert.equal(inv.tier, 3, 'Champion is tier 3');
  assert.equal(inv.maxPotion, 1, 'one Max Potion (instant threshold heal)');
  assert.equal(inv.fullHeal, 1, 'one Full Heal');
  assert.ok(inv.signature && inv.signature.instant === true, 'Champion gets the instant Mega signature');
  assert.ok((inv.revive | 0) >= 1, 'Champion carries a bench Revive');
});

test('Mystery Figure bag: tier 3 with a Max Revive + instant signature', () => {
  if (!primeBattleAt('Mystery Figure')) return;
  const inv = eng.window.buildFoeStoryInventoryForBattle();
  assert.ok(inv);
  assert.equal(inv.tier, 3);
  assert.ok((inv.maxRevive | 0) >= 1, 'Mystery carries a Max Revive');
  assert.ok(inv.signature && inv.signature.instant === true, 'Mystery gets the instant Mega signature');
});

test('Elite Four (E1–E4) bag: tier 3 with an Ultra (non-instant) signature + Revive', () => {
  let checked = 0;
  for (const label of ['E1', 'E2', 'E3', 'E4']) {
    if (!primeBattleAt(label)) continue;
    const inv = eng.window.buildFoeStoryInventoryForBattle();
    assert.ok(inv);
    assert.equal(inv.tier, 3, `${label} is tier 3`);
    assert.ok(inv.signature && inv.signature.instant === false, `${label} gets the Ultra buff signature (not instant)`);
    assert.ok((inv.revive | 0) >= 1, `${label} carries a Revive`);
    checked++;
  }
  assert.ok(checked > 0, 'at least one Elite Four row exists');
});

test('Route Basic Trainer is fodder — never carries a consumable', () => {
  let idx = -1;
  for (let i = 0; i < eng.window.STORY_EVENTS_RAW.length; i++) {
    const r = eng.window.STORY_EVENTS_RAW[i];
    if (Array.isArray(r) && r[1] === 'Battle' && r[2] === 'Basic Trainer') { idx = i; break; }
  }
  if (idx < 0) return;
  ST.sm.active = true;
  if (!ST.sm.settings) ST.sm.settings = {};
  ST.sm.eventIndex = idx;
  ST.sm.badges = 0;
  ST.sm.storyDifficulty = 'normal';
  ST.sm.gymCleared = {};
  const inv = eng.window.buildFoeStoryInventoryForBattle();
  const total = (inv.superPotion | 0) + (inv.hyperPotion | 0) + (inv.maxPotion | 0) + (inv.fullRestore | 0) + (inv.fullHeal | 0) + (inv.revive | 0) + (inv.maxRevive | 0) + (inv.xItem | 0);
  assert.equal(inv.tier, 0, 'Basic Trainer is tier 0');
  assert.equal(total, 0, `Basic Trainer carries nothing (got ${total})`);
});
