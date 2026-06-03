// DRAFT — fills for status moves with a gender or sleep precondition. Promote per workflow.
//
// Attract/Captivate need opposite genders (set .gender M vs F). Sleep Talk needs the
// user asleep and calls one of its other moves (all Tackle here, so it always
// damages).
//
// Deferred (no-op in harness): Powder, Me First.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

describe('Gender / precondition moves (draft fills)', () => {
  it('Attract infatuates an opposite-gender foe', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Attract', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a.gender = 'M';
    d.gender = 'F';
    await runTurn({ playerMon: a, foeMon: d });
    assert.ok(d.volatile.infatuated, 'Attract should infatuate the foe');
  });

  it("Captivate sharply lowers an opposite-gender foe's Sp.Atk", async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Captivate', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a.gender = 'M';
    d.gender = 'F';
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.stages.spa, -2);
  });

  it('Sleep Talk calls another move while the user is asleep', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Sleep Talk', 'Tackle', 'Tackle', 'Tackle'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a.status = 'SLP';
    a.sleepTurns = 3;
    const before = d.currentHp;
    await runTurn({ playerMon: a, foeMon: d, playerMoveSlot: 0 });
    assert.ok(before - d.currentHp > 0, 'Sleep Talk should call a damaging move while asleep');
  });
});
