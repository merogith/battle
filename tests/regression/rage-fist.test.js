// Regression: Rage Fist must scale with the number of hits the user has taken.
//
// Bug history: `volatile.timesHit` was declared (init 0) and read by Rage Fist's
// base-power formula (BP = min(50 + 50*hits, 350)), but nothing ever incremented
// it when the user was hit. Result: Rage Fist was permanently stuck at 50 BP.
// The fix increments `timesHit` on the mon that takes a damaging hit in the
// single-hit and multi-hit damage-application paths.
//
// runTurn API (tests/helpers/load-engine.js): { playerMon, foeMon, playerMoveSlot,
// foeMoveSlot }. The player is pinned fast (moves first); the foe's move is forced
// to foeMoveSlot.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

describe('Rage Fist scaling', () => {
  // Mew (Normal) is the Rage Fist user so it has no type immunities and reliably
  // takes the foe's Normal-type Tackle. Rage Fist (Ghost) hits Sceptile (Grass)
  // neutrally. Slot 0 = first move, slot 1 = Splash (no effect).
  const mkUser = () => mkMon({ species: 'Mew', ability: 'None', moves: ['Rage Fist', 'Splash', 'Splash', 'Splash'] });
  const mkFoe = () => mkMon({ species: 'Sceptile', ability: 'None', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });

  it('counts each hit taken on volatile.timesHit', async () => {
    const user = mkUser();
    const foe = mkFoe();
    assert.equal(user.volatile.timesHit || 0, 0, 'starts at 0 hits');
    // player Splashes (slot 1), foe Tackles (slot 0) -> user takes a hit each turn
    for (let i = 1; i <= 3; i++) {
      await runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 1, foeMoveSlot: 0 });
      assert.equal(user.volatile.timesHit, i, `timesHit should be ${i} after ${i} hits`);
    }
  });

  it('Rage Fist hits harder after the user has been hit', async () => {
    // Baseline: 0 hits taken. player Rage Fist (slot 0), foe Splash (slot 1).
    const userA = mkUser();
    const foeA = mkFoe();
    const foeABefore = foeA.currentHp;
    await runTurn({ playerMon: userA, foeMon: foeA, playerMoveSlot: 0, foeMoveSlot: 1 });
    const baseDmg = foeABefore - foeA.currentHp;
    assert.ok(baseDmg > 0, 'baseline Rage Fist should deal damage');
    assert.equal(userA.volatile.timesHit || 0, 0, 'no hits taken in baseline');

    // Boosted: take 3 hits first, then Rage Fist (same seed -> same damage roll).
    const userB = mkUser();
    const foeB = mkFoe();
    for (let i = 0; i < 3; i++) {
      await runTurn({ playerMon: userB, foeMon: foeB, playerMoveSlot: 1, foeMoveSlot: 0 });
    }
    assert.equal(userB.volatile.timesHit, 3, 'three hits recorded before Rage Fist');
    const foeBBefore = foeB.currentHp;
    await runTurn({ playerMon: userB, foeMon: foeB, playerMoveSlot: 0, foeMoveSlot: 1 });
    const boostedDmg = foeBBefore - foeB.currentHp;

    // BP goes 50 -> 200 (50 + 50*3), so boosted should clearly exceed baseline.
    assert.ok(
      boostedDmg > baseDmg,
      `Rage Fist after 3 hits (${boostedDmg}) should out-damage the 0-hit baseline (${baseDmg})`,
    );
  });
});
