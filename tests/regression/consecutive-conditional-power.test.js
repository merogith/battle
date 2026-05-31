// Regression: "stuck at base power" move family (same shape as the Rage Fist bug).
//
// 1) Stomping Tantrum / Temper Flare double in power if the user's PREVIOUS move failed.
//    Bug: `lastMoveFailed` is a cross-turn signal, but it was wiped in the turn-start reset
//    block before the base-power formula could read it, so the doubling never fired. Fixed by
//    snapshotting it per-move (`_prevMoveFailed`) and removing the turn-start wipe.
// 2) Fury Cutter ramps 40 -> 80 -> 160 (cap) on consecutive use.
// 3) Echoed Voice ramps 40 -> 80 -> 120 -> 160 -> 200 on consecutive use.
//    Bug: neither move had any consecutive-use power scaling at all — flat BP forever.
//
// The jsdom harness re-seeds RNG to 0 on every runTurn, so the damage roll is identical
// turn-to-turn and damage scales purely with base power. mon.volatile persists across
// runTurn calls (same object), which is what lets these counters accumulate.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

describe('Consecutive / conditional power moves', () => {
  describe('Fury Cutter ramps on consecutive use', () => {
    const mkUser = () => mkMon({ species: 'Mew', ability: 'None', moves: ['Fury Cutter', 'Tackle', 'Splash', 'Splash'] });
    const mkFoe = () => mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    it('damage increases each consecutive use, then caps', async () => {
      const user = mkUser();
      const foe = mkFoe();
      const dmgs = [];
      for (let i = 0; i < 4; i++) {
        // Refill the foe to full BEFORE each measured hit so damage reflects base power, not
        // the remaining-HP cap (actualDamage = min(currentHp, damage)). Volatile (the
        // furyCutterCount chain) persists across the refill, so the ramp is unaffected.
        foe.currentHp = foe.maxHp;
        const before = foe.currentHp;
        await runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
        dmgs.push(before - foe.currentHp);
      }
      assert.equal(user.volatile.furyCutterCount, 4, 'counter reaches 4 after 4 uses');
      assert.ok(dmgs[1] > dmgs[0], `use2 (${dmgs[1]}) > use1 (${dmgs[0]})`);
      assert.ok(dmgs[2] > dmgs[1], `use3 (${dmgs[2]}) > use2 (${dmgs[1]})`);
      // BP caps at 160 (use3 already 160), so use4 deals the same as use3.
      assert.equal(dmgs[3], dmgs[2], `use4 (${dmgs[3]}) == use3 (${dmgs[2]}) at the 160 cap`);
    });

    it('resets when a different move is used in between', async () => {
      const user = mkUser();
      const foe = mkFoe();
      // ramp up
      await runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
      await runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
      assert.equal(user.volatile.furyCutterCount, 2, 'ramped to 2');
      // break the chain with Tackle (slot 1)
      await runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 1, foeMoveSlot: 0 });
      assert.equal(user.volatile.furyCutterCount, 0, 'reset after a different move');
      // first Fury Cutter again -> back to base
      foe.currentHp = foe.maxHp;
      const before = foe.currentHp;
      await runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
      const baseAgain = before - foe.currentHp;
      assert.equal(user.volatile.furyCutterCount, 1, 'back to 1');
      // sanity: this base hit is smaller than a ramped (count=2) hit
      foe.currentHp = foe.maxHp;
      const before2 = foe.currentHp;
      await runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
      const rampedAgain = before2 - foe.currentHp;
      assert.ok(rampedAgain > baseAgain, `ramped (${rampedAgain}) > base (${baseAgain}) after a fresh chain`);
    });
  });

  describe('Echoed Voice ramps on consecutive use', () => {
    const mkUser = () => mkMon({ species: 'Mew', ability: 'None', moves: ['Echoed Voice', 'Splash', 'Splash', 'Splash'] });
    const mkFoe = () => mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    it('damage increases on each of the first three consecutive uses', async () => {
      const user = mkUser();
      const foe = mkFoe();
      const dmgs = [];
      for (let i = 0; i < 3; i++) {
        const before = foe.currentHp;
        await runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
        dmgs.push(before - foe.currentHp);
        if (foe.currentHp <= 0) foe.currentHp = foe.maxHp;
      }
      assert.equal(user.volatile.echoedVoiceCount, 3, 'counter reaches 3');
      assert.ok(dmgs[1] > dmgs[0], `use2 (${dmgs[1]}) > use1 (${dmgs[0]})`);
      assert.ok(dmgs[2] > dmgs[1], `use3 (${dmgs[2]}) > use2 (${dmgs[1]})`);
    });
  });

  describe('Stomping Tantrum doubles after a failed move', () => {
    // Blissey (Normal) is the foe: bulky enough to survive several hits and never faints.
    // Lick (Ghost) is immune vs Normal -> a guaranteed failure to set up the flag.
    // Tackle (Normal) connects vs Normal -> a guaranteed success (control).
    const mkFoe = () => mkMon({ species: 'Blissey', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

    it('Stomping Tantrum hits ~2x harder if the previous move failed', async () => {
      // Baseline: previous move SUCCEEDS, so no doubling.
      const baseUser = mkMon({ species: 'Mew', ability: 'None', moves: ['Stomping Tantrum', 'Tackle', 'Splash', 'Splash'] });
      const baseFoe = mkFoe();
      await runTurn({ playerMon: baseUser, foeMon: baseFoe, playerMoveSlot: 1, foeMoveSlot: 0 }); // Tackle connects
      assert.notEqual(baseUser.volatile.lastMoveFailed, true, 'successful move leaves lastMoveFailed false');
      const baseBefore = baseFoe.currentHp;
      await runTurn({ playerMon: baseUser, foeMon: baseFoe, playerMoveSlot: 0, foeMoveSlot: 0 }); // Stomping Tantrum
      const baseDmg = baseBefore - baseFoe.currentHp;

      // Boosted: previous move FAILS (Lick is immune vs Normal), so Stomping Tantrum doubles.
      const boostUser = mkMon({ species: 'Mew', ability: 'None', moves: ['Stomping Tantrum', 'Lick', 'Splash', 'Splash'] });
      const boostFoe = mkFoe();
      await runTurn({ playerMon: boostUser, foeMon: boostFoe, playerMoveSlot: 1, foeMoveSlot: 0 }); // Lick -> immune -> fail
      assert.equal(boostUser.volatile.lastMoveFailed, true, 'failed move sets lastMoveFailed = true');
      const boostBefore = boostFoe.currentHp;
      await runTurn({ playerMon: boostUser, foeMon: boostFoe, playerMoveSlot: 0, foeMoveSlot: 0 }); // Stomping Tantrum
      const boostDmg = boostBefore - boostFoe.currentHp;

      assert.ok(baseDmg > 0 && boostDmg > 0, `both hits land (base ${baseDmg}, boost ${boostDmg})`);
      assert.ok(boostDmg > baseDmg * 1.5, `boosted (${boostDmg}) ~2x baseline (${baseDmg})`);
    });
  });
});
