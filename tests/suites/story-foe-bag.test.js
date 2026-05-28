// Phase 4.6 — boss-tier inventory expansion for the existing enemy bag-use AI
// (window.tryFoeStoryBattleItem at ~16927). The AI was already wired with HP
// thresholds + bench Revive logic; this test just verifies the new richer
// allocations for E1–E4 / Champion / Mystery Figure land correctly on
// Normal difficulty (Hard+ uses its own badge-keyed Revive ladder).
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
  ST.sm.settings.enabledGens = [1,2,3,4,5,6,7,8,9];
  ST.sm.storyDifficulty = 'normal';
  ST.sm.badges = 8;     // late-game (E4 / Champion / Mystery happen at 7+/8+)
  ST.sm.gymCleared = { 1:true,2:true,3:true,4:true,5:true,6:true,7:true,8:true };
  const idx = rowIdxForLabel(label);
  if (idx < 0) return false;
  ST.sm.eventIndex = idx;
  return true;
}

test('Champion bag: +1 revive + +1 fullRestore (not -1 max potion)', () => {
  if (!primeBattleAt('Champion')) return;
  const inv = eng.window.buildFoeStoryInventoryForBattle();
  assert.ok(inv, 'inventory returned');
  assert.ok(inv.revive >= 1, `Champion has at least 1 Revive (got ${inv.revive})`);
  assert.ok(inv.fullRestore >= 2, `Champion has 2+ Full Restores (base 1 + boss bonus 1, got ${inv.fullRestore})`);
});

test('Mystery Figure bag: +1 maxRevive + +1 fullRestore', () => {
  if (!primeBattleAt('Mystery Figure')) return;
  const inv = eng.window.buildFoeStoryInventoryForBattle();
  assert.ok(inv);
  assert.ok(inv.maxRevive >= 1, `Mystery has 1+ Max Revive (got ${inv.maxRevive})`);
  assert.ok(inv.fullRestore >= 2, `Mystery has 2+ Full Restores (got ${inv.fullRestore})`);
});

test('Elite Four (E1–E4) bag: +1 revive + +1 fullRestore', () => {
  for (const label of ['E1','E2','E3','E4']) {
    if (!primeBattleAt(label)) continue;
    const inv = eng.window.buildFoeStoryInventoryForBattle();
    assert.ok(inv);
    assert.ok(inv.revive >= 1, `${label} has 1+ Revive (got ${inv.revive})`);
    assert.ok(inv.fullRestore >= 2, `${label} has 2+ Full Restores (got ${inv.fullRestore})`);
  }
});

test('Route Basic Trainer bag stays modest at C0 (no boss bonus)', () => {
  // Use the first Battle row that isn't a leader / E4 / champion.
  let idx = -1;
  for (let i = 0; i < eng.window.STORY_EVENTS_RAW.length; i++) {
    const r = eng.window.STORY_EVENTS_RAW[i];
    if (Array.isArray(r) && r[1] === 'Battle' && r[2] === 'Basic Trainer') { idx = i; break; }
  }
  if (idx < 0) return;
  ST.sm.eventIndex = idx;
  ST.sm.badges = 0;
  ST.sm.storyDifficulty = 'normal';
  ST.sm.gymCleared = {};
  const inv = eng.window.buildFoeStoryInventoryForBattle();
  // Basic at C0 with 0 badges should have an empty / near-empty bag.
  const total = (inv.maxPotion|0) + (inv.fullRestore|0) + (inv.fullHeal|0) + (inv.revive|0) + (inv.maxRevive|0);
  assert.ok(total <= 1, `Basic Trainer @ 0 badges has ≤1 item total (got ${total})`);
});
