// DRAFT — fills for the singles-testable GUARD moves (Quick/Wide Guard) and the
// PHAZE moves (Roar/Whirlwind). Promote per the workflow.
//
// Quick Guard blocks priority, Wide Guard blocks spread — both observable in singles.
// Roar/Whirlwind need a 2-mon foe party to have something to force in.
//
// Deferred (don't block in this engine): Crafty Shield, Mat Block.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn, reset, seedRng, engine, window;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
  reset = e.reset;
  seedRng = e.seedRng;
  engine = e.engine;
  window = e.window;
});

async function guard(move, foeMove) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: [foeMove, 'Splash', 'Splash', 'Splash'] });
  const before = a.currentHp;
  await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0 });
  return before - a.currentHp;
}

async function phaze(move) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const d2 = mkMon({ species: 'Pikachu', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  reset();
  seedRng(0);
  engine.state.pActive = a;
  engine.state.fActive = d;
  engine.state.playerParty = [a];
  engine.state.foeParty = [d, d2];
  engine.state.mode = 'pve';
  engine.state.turnNumber = 0;
  engine.state.isOver = false;
  engine.state.isLocked = false;
  a.stats.spe = 999;
  engine.setForcedFoeMoveSlot(0);
  await window.playTurn(0, null);
  return { fActive: engine.state.fActive, d2 };
}

describe('Guard / phaze moves (draft fills)', () => {
  it('Quick Guard blocks a priority move', async () => {
    assert.equal(await guard('Quick Guard', 'Quick Attack'), 0);
  });
  it('Wide Guard blocks a spread move', async () => {
    assert.equal(await guard('Wide Guard', 'Surf'), 0);
  });
  it('Roar forces the foe to switch out', async () => {
    const { fActive, d2 } = await phaze('Roar');
    assert.equal(fActive, d2, 'Roar should drag in the benched foe');
  });
  it('Whirlwind forces the foe to switch out', async () => {
    const { fActive, d2 } = await phaze('Whirlwind');
    assert.equal(fActive, d2, 'Whirlwind should drag in the benched foe');
  });
});
