// Phase 3 — Capability-Ceiling Parity.
// Governing rule: at every city, for every trainer, the foe's facility-gated
// CATEGORY unlocks (evolution stage · held-item tier · hidden ability · move
// stage) must be ≤ the PLAYER's access at that city. Foes may roll better WITHIN
// the ceiling (grade / EV-IV / nature precision) but never unlock a category
// before the player can.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

// _storyEvoStageCapForRow returns the unrestricted frontier default unless a story
// run is active — prime one so the city-keyed cap is exercised.
ST.sm.active = true;
ST.sm.runSeed = 1;
ST.sm._strngState = null;
ST.sm.settings = Object.assign(ST.sm.settings || {}, { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
ST.sm.badges = 0;

test('evolution: foe evo-stage cap == player evo cap at every city', () => {
  for (let c = 0; c <= 9; c++) {
    assert.equal(ST.storyEvoStageCapForCity(c), ST.playerEvoStageCapForCity(c), `C${c} evo parity`);
  }
});

test('items: foe item tier never exceeds the player Dojo tier (foe ≤ player)', () => {
  // Player Dojo item tier at city c = dojoStage(c)+1, with no items before the
  // Dojo opens (C0-1). Foe must be ≤ that at every city.
  for (let c = 0; c <= 9; c++) {
    const foe = ST.storyFoeItemTier(c);
    const playerTier = c <= 1 ? 0 : (ST.npcStageForCity('dojo', c) + 1);
    assert.ok(foe <= playerTier, `C${c}: foe item tier ${foe} must be ≤ player ${playerTier}`);
  }
  // Concretely (1.6.0 ladder [1,4,6,8]): berries C2-3, staples open at C4 (Black Belt),
  // best meta at C6 (Master), all by C8 (Grandmaster).
  assert.equal(ST.storyFoeItemTier(3), 1, 'C3 foe berries (White Belt)');
  assert.equal(ST.storyFoeItemTier(4), 2, 'C4 foe staples (== Black Belt)');
  assert.equal(ST.storyFoeItemTier(5), 2, 'C5 foe still staples');
  assert.equal(ST.storyFoeItemTier(6), 3, 'C6 foe best meta (== Master)');
  assert.equal(ST.storyFoeItemTier(8), 4, 'C8 foe all (== Grandmaster; tier-4 = no item gated)');
});

test('hidden abilities: foe HA opens at the player Black Belt (C4), not C3', () => {
  // The foe HA gate is derived from dojo stage ≥ 1; under the 1.6.0 ladder that is C4.
  assert.equal(ST.npcStageForCity('dojo', 3), 0, 'C3 dojo stage 0 → no Hidden for player OR foe');
  assert.equal(ST.npcStageForCity('dojo', 4), 1, 'C4 dojo stage 1 (Black Belt) → Hidden unlocks');
});

test('#23 fix: the intro rival (row 68) resolves to City 0, not City 9', () => {
  // Row id 68 lives at array idx 1 (a C0 fight). The buggy path walked off the end
  // of the array to City 9, unlocking evolved mons / best items / max EV-IV.
  assert.equal(ST.cityIndexForStoryRow(68), 0, 'intro rival row 68 → C0');
  assert.equal(ST.storyEvoStageCapForRow(68), 0, 'intro rival evo cap = Basic (0), not ALL (2)');
  // Contrast: feeding the row id straight into the array-indexed resolver is the bug.
  assert.equal(ST.cityIndexFromEventIndex(68), 9, '(documents the old bug: row-id 68 → C9)');
});

test('#23 fix: mid rival (row 12) resolves to its true city (C3)', () => {
  assert.equal(ST.cityIndexForStoryRow(12), 3, 'mid rival row 12 lives in the C3 segment');
});
