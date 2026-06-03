// DRAFT — fills for the PROTECT / guard cluster (moves that block the foe's hit).
// Promote per the test-coverage-filler workflow.
//
// Setup-shape: player uses the guard move (it has +priority, so it resolves first),
// foe uses Body Slam; assert the user took no damage. Endure instead survives a
// lethal hit at 1 HP.
//
// Quick Guard / Wide Guard / Crafty Shield / Mat Block are doubles-only targeted
// guards and left as todo. (Note: move names must keep their apostrophe — "King's
// Shield" — since an apostrophe-stripped name silently resolves to a damaging
// fallback rather than the real move.)
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function guard(move) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Body Slam', 'Splash', 'Splash', 'Splash'] });
  const before = a.currentHp;
  await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0 });
  return before - a.currentHp;
}

describe('Protect / guard moves (draft fills)', () => {
  for (const move of ['Protect', 'Detect', "King's Shield", 'Spiky Shield', 'Baneful Bunker', 'Obstruct', 'Silk Trap', 'Burning Bulwark']) {
    it(`${move} blocks the foe's attack`, async () => {
      assert.equal(await guard(move), 0, `${move} should block the incoming hit`);
    });
  }

  it('Endure leaves the user at 1 HP after a lethal hit', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Endure', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Body Slam', 'Splash', 'Splash', 'Splash'] });
    a.currentHp = 10;
    await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0 });
    assert.equal(a.currentHp, 1, 'Endure should leave the user on 1 HP');
  });
});
