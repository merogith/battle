// DRAFT — fills for moves with a gender, sleep, or berry precondition. Promote per workflow.
//
// Attract/Captivate need opposite genders (set .gender M vs F). Sleep Talk needs the
// user asleep and calls one of its other moves (all Tackle here, so it always
// damages). Belch needs the user to have eaten a Berry (set volatile.belchReady),
// otherwise it is gated and deals no damage.
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

  it('Belch fails without an eaten Berry, then lands after belchReady is set', async () => {
    // No Berry eaten -> Belch is gated and deals no damage.
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Belch', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const before = d.currentHp;
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.currentHp, before, 'Belch should fail when the user has not eaten a Berry');

    // After a Berry has been eaten (belchReady volatile set), Belch connects.
    const a2 = mkMon({ species: 'Mew', ability: 'None', moves: ['Belch', 'Splash', 'Splash', 'Splash'] });
    const d2 = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a2.volatile = a2.volatile || {};
    a2.volatile.belchReady = true;
    const before2 = d2.currentHp;
    await runTurn({ playerMon: a2, foeMon: d2 });
    assert.ok(d2.currentHp < before2, 'Belch should reduce defender HP after a Berry has been eaten');
  });
});
