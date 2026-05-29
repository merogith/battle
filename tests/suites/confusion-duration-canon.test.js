// Confusion duration is now canon 2-5 turns (floor(rng*4)+2) at all 7 inflict sites,
// up from the non-canon 2-4 (floor(rng*3)+2). Per the maintainer's call to align to
// modern-gen behavior.
// Run: node --test tests/suites/confusion-duration-canon.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const { mkMon, runTurn, window } = await loadEngine();

// Confuse Ray (100% accuracy, guaranteed confusion) sets target confusion via
// floor(rng*4)+2; storyAwareRng() resolves to the engine window's Math.random outside a
// story run, so we pin THAT. With rng=0.95 the set value is floor(3.8)+2 = 5. The player
// moves first (harness), so the target is confused, then takes its own confused turn,
// which decrements the counter once (no self-hit: 0.95 ≥ 0.3333) → post-turn 4.
// Under the old *3 formula the set value would be floor(0.95*3)+2 = 4, decremented to 3 —
// so a post-turn value of 4 is ONLY reachable with the canon 2-5 range.
test('confusion can roll the full canon 2-5 range (max set value 5)', async () => {
  const orig = window.Math.random;
  window.Math.random = () => 0.95;
  try {
    const attacker = mkMon({ species: 'Gengar', moves: ['Confuse Ray', 'Tackle', 'Tackle', 'Tackle'] });
    const target = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    await runTurn({ playerMon: attacker, foeMon: target, playerMoveSlot: 0, foeMoveSlot: 0 });
    assert.equal(target.volatile.confusion, 4,
      'set to 5 by Confuse Ray, −1 from the confused turn = 4 (unreachable under the old *3 formula)');
  } finally {
    window.Math.random = orig;
  }
});
