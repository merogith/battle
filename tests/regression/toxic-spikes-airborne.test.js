// Regression: airborne Pokémon must not be affected by grounded entry hazards.
//
// Root cause (fixed): applyEntryHazards computed `isGrounded` with a drifted copy of the
// grounding test that omitted the Air Balloon and Magnet Rise clauses, so an airborne
// Pokémon (Air Balloon holder / Magnet Rise user) was poisoned by Toxic Spikes and the
// Toxic Spikes layers were never consumed — the reported "toxic spikes are bugged, not
// consumed yet poisons" symptom. The grounding test is now the single helper
// isGroundedMon(), used by entry hazards, the AI hazard estimate, and the terrain checks.
//
// These cases lock in the corrected behavior so the duplicate-and-drift can't recur.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let h;
before(async () => { h = await loadEngine(); });

// Send `mon` into a side seeded with `layers` of Toxic Spikes and report the outcome as
// "STATUS:REMAINING_LAYERS" (STATUS is '-' when unstatused). Exercises the real
// applyEntryHazards path inside the engine scope.
function toxicSpikesOutcome(mon, layers) {
  h.reset();
  const side = h.engine.state.fSide;
  side.toxicSpikes = layers;
  side.stealthRock = false;
  side.spikes = 0;
  side.stickyWeb = false;
  h.engine.state.fActive = mon;
  h.window.applyEntryHazards(mon, false);
  return (mon.status || '-') + ':' + h.engine.state.fSide.toxicSpikes;
}

// --- Baseline mechanics (must keep working) ---

test('grounded non-Poison: 1 layer poisons (PSN), layers persist', () => {
  const mon = h.mkMon({ species: 'Garchomp', ability: 'Rough Skin' });
  assert.equal(toxicSpikesOutcome(mon, 1), 'PSN:1');
});

test('grounded non-Poison: 2 layers badly poison (TOX), layers persist', () => {
  const mon = h.mkMon({ species: 'Garchomp', ability: 'Rough Skin' });
  assert.equal(toxicSpikesOutcome(mon, 2), 'TOX:2');
});

test('grounded Poison-type absorbs Toxic Spikes (consumed, no status)', () => {
  const mon = h.mkMon({ species: 'Muk', ability: 'Stench' });
  assert.equal(toxicSpikesOutcome(mon, 2), '-:0');
});

test('Steel-type is immune to poison; layers persist', () => {
  const mon = h.mkMon({ species: 'Ferrothorn', ability: 'Iron Barbs' });
  assert.equal(toxicSpikesOutcome(mon, 2), '-:2');
});

test('Flying Poison (Crobat) is airborne: no absorb, no poison', () => {
  const mon = h.mkMon({ species: 'Crobat', ability: 'Inner Focus' });
  assert.equal(toxicSpikesOutcome(mon, 2), '-:2');
});

// --- Regression: airborne via item / volatile (the bug) ---

test('Air Balloon holder floats over Toxic Spikes (no poison, layers persist)', () => {
  const mon = h.mkMon({ species: 'Garchomp', ability: 'Rough Skin', item: 'Air Balloon' });
  assert.equal(toxicSpikesOutcome(mon, 2), '-:2');
});

test('Magnet Rise keeps a mon airborne over Toxic Spikes', () => {
  const mon = h.mkMon({ species: 'Garchomp', ability: 'Rough Skin' });
  mon.volatile.magnetRise = 5;
  assert.equal(toxicSpikesOutcome(mon, 2), '-:2');
});

test('airborne Poison-type (Air Balloon) does NOT absorb Toxic Spikes', () => {
  const mon = h.mkMon({ species: 'Muk', ability: 'Stench', item: 'Air Balloon' });
  assert.equal(toxicSpikesOutcome(mon, 2), '-:2');
});

// --- Same root cause, other grounded-only hazards on an Air Balloon holder ---

test('Air Balloon holder takes no Spikes damage and no Sticky Web drop', () => {
  const mon = h.mkMon({ species: 'Garchomp', ability: 'Rough Skin', item: 'Air Balloon' });
  h.reset();
  const side = h.engine.state.fSide;
  side.toxicSpikes = 0;
  side.stealthRock = false;
  side.spikes = 3;
  side.stickyWeb = true;
  h.engine.state.fActive = mon;
  const hpBefore = mon.currentHp;
  const speBefore = mon.statStages ? mon.statStages.spe : (mon.boosts ? mon.boosts.spe : 0);
  h.window.applyEntryHazards(mon, false);
  const speAfter = mon.statStages ? mon.statStages.spe : (mon.boosts ? mon.boosts.spe : 0);
  assert.equal(mon.currentHp, hpBefore, 'Air Balloon holder should take no Spikes damage');
  assert.equal(speAfter, speBefore, 'Air Balloon holder should not be slowed by Sticky Web');
});
