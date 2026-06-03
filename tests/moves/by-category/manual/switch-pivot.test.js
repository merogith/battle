// DRAFT — fills for SWITCH / pivot status moves. Promote per the workflow.
//
// Setup-shape: a 2-mon player party (Mew + Pikachu) built manually so the engine
// has a bench to switch into; after the move, assert pActive moved to the bench mon.
// Baton Pass also carries stat stages across; Chilly Reception also sets snow.
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

function team(move) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const b = mkMon({ species: 'Pikachu', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  return { a, b, d };
}

async function pivot({ a, b, d }) {
  reset();
  seedRng(0);
  engine.state.pActive = a;
  engine.state.fActive = d;
  engine.state.playerParty = [a, b];
  engine.state.foeParty = [d];
  engine.state.mode = 'pve';
  engine.state.turnNumber = 0;
  engine.state.isOver = false;
  engine.state.isLocked = false;
  a.stats.spe = Math.max(a.stats.spe || 0, 999);
  engine.setForcedFoeMoveSlot(0);
  await window.playTurn(0, null);
}

describe('Switch / pivot moves (draft fills)', () => {
  it('Baton Pass switches out and passes stat stages to the replacement', async () => {
    const t = team('Baton Pass');
    t.a.stages.atk = 2;
    await pivot(t);
    assert.equal(engine.state.pActive, t.b, 'should switch to the bench mon');
    assert.equal(t.b.stages.atk, 2, 'the +2 Attack should pass to the replacement');
  });

  it('Teleport switches the user out', async () => {
    const t = team('Teleport');
    await pivot(t);
    assert.equal(engine.state.pActive, t.b);
  });

  it('Chilly Reception sets snow and switches the user out', async () => {
    const t = team('Chilly Reception');
    await pivot(t);
    assert.equal(engine.state.pActive, t.b);
    assert.equal(engine.state.weather, 'Hail');
  });

  it('Shed Tail switches the user out', async () => {
    const t = team('Shed Tail');
    await pivot(t);
    assert.equal(engine.state.pActive, t.b);
  });

  it("Parting Shot lowers the foe's Attack & Sp.Atk, then switches the user out", async () => {
    const t = team('Parting Shot');
    await pivot(t);
    assert.equal(engine.state.pActive, t.b, 'should switch to the bench mon');
    assert.equal(t.d.stages.atk, -1, 'foe Attack should drop by 1');
    assert.equal(t.d.stages.spa, -1, 'foe Sp.Atk should drop by 1');
  });
});
