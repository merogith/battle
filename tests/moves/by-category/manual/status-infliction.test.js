// DRAFT — fills for the STATUS-INFLICTION cluster (moves that give the target a
// major status or confusion/drowsiness). Promote per the test-coverage-filler flow.
//
// These moves roll accuracy, and the harness pins the RNG to seed 0 on every
// runTurn (reset() -> seedRng(0)), so a single runTurn is deterministic but may
// land on a miss. Setup-shape: sweep seeds (manual setup + seedRng + playTurn, no
// reset) until the per-seed-deterministic accuracy roll connects — robust without
// depending on where seed 0 happens to fall. Status strings are uppercase
// (PAR/BRN/TOX/PSN/SLP); confusion/drowsiness are volatiles.
//
// Excluded: Dark Void (Darkrai-only — correctly fails from other users).
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, reset, seedRng, engine, window;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  reset = e.reset;
  seedRng = e.seedRng;
  engine = e.engine;
  window = e.window;
});

// Mirror runTurn's battle setup but WITHOUT its seedRng(0), so the caller can pin
// the seed itself.
function setup(a, d) {
  reset();
  engine.state.pActive = a;
  engine.state.fActive = d;
  engine.state.playerParty = [a];
  engine.state.foeParty = [d];
  engine.state.mode = 'pve';
  engine.state.turnNumber = 0;
  engine.state.isOver = false;
  engine.state.isLocked = false;
  a.stats.spe = Math.max(a.stats.spe || 0, 999); // player moves first
  engine.setForcedFoeMoveSlot(0);
}

// Sweep seeds until `check(foe)` is true; assert the move *can* land its effect.
async function inflicts(move, check, { foe = 'Snorlax', tries = 40 } = {}) {
  for (let seed = 0; seed < tries; seed++) {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: foe, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    setup(a, d);
    seedRng(seed);
    await window.playTurn(0, null);
    if (check(d)) return true;
  }
  return false;
}
const confused = (d) => !!(d.volatile && d.volatile.confusion);

describe('Status-infliction moves (draft fills)', () => {
  for (const [move, status] of [
    ['Thunder Wave', 'PAR'], ['Stun Spore', 'PAR'], ['Glare', 'PAR'],
    ['Will-O-Wisp', 'BRN'],
    ['Toxic', 'TOX'],
    ['Poison Powder', 'PSN'], ['Poison Gas', 'PSN'],
    ['Spore', 'SLP'], ['Sleep Powder', 'SLP'], ['Hypnosis', 'SLP'], ['Sing', 'SLP'], ['Lovely Kiss', 'SLP'], ['Grass Whistle', 'SLP'],
  ]) {
    it(`${move} can inflict ${status}`, async () => {
      assert.ok(await inflicts(move, (d) => d.status === status), `${move} should be able to inflict ${status}`);
    });
  }

  for (const move of ['Confuse Ray', 'Supersonic', 'Sweet Kiss', 'Teeter Dance']) {
    it(`${move} can confuse the target`, async () => {
      assert.ok(await inflicts(move, confused), `${move} should be able to confuse the target`);
    });
  }

  it('Yawn makes the target drowsy', async () => {
    assert.ok(await inflicts('Yawn', (d) => !!(d.volatile && d.volatile.yawnTurns)), 'Yawn should set drowsiness');
  });
});
