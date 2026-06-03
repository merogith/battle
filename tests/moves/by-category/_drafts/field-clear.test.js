// DRAFT — fills for FIELD-CLEAR / reset moves. Promote per the workflow.
// Setup-shapes: seed the thing to be cleared (stages / evasion / a hazard), run the
// move, assert it was reset/lowered/swapped.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn, engine, window;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
  engine = e.engine;
  window = e.window;
});

describe('Field-clear moves (draft fills)', () => {
  it("Haze resets both sides' stat stages", async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Haze', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a.stages.atk = 2;
    d.stages.def = 2;
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(a.stages.atk, 0);
    assert.equal(d.stages.def, 0);
  });

  it("Tidy Up raises the user's Attack and Speed", async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Tidy Up', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(a.stages.atk, 1);
    assert.equal(a.stages.spe, 1);
  });

  it("Defog lowers the foe's evasion", async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Defog', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    d.stages.eva = 2;
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.stages.eva, 1);
  });

  it('Court Change swaps hazards between the two sides', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Stealth Rock', 'Court Change', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    await runTurn({ playerMon: a, foeMon: d, playerMoveSlot: 0 }); // rocks land on the foe side
    assert.equal(engine.state.fSide.stealthRock, true);
    engine.setForcedFoeMoveSlot(0);
    await window.playTurn(1, null); // Court Change
    assert.equal(engine.state.fSide.stealthRock, false, 'rocks should leave the foe side');
    assert.equal(engine.state.pSide.stealthRock, true, 'rocks should move to the user side');
  });
});
