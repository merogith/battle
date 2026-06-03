// DRAFT — fills for the last cleanly-testable status stragglers: Geomancy (2-turn
// charge), Teatime (force the foe to eat its Berry), Revival Blessing (revive a
// fainted teammate). Promote per the workflow.
//
// Not filled (need user-faint / switch-in heal choreography): Healing Wish,
// Lunar Dance.
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

describe('Misc status moves (draft fills)', () => {
  it('Geomancy charges one turn, then raises Sp.Atk/Sp.Def/Speed', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Geomancy', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    await runTurn({ playerMon: a, foeMon: d, playerMoveSlot: 0 }); // charge
    assert.equal(a.stages.spa, 0, 'Geomancy should still be charging on turn 1');
    engine.setForcedFoeMoveSlot(0);
    await window.playTurn(1, null); // release
    assert.equal(a.stages.spa, 2);
    assert.equal(a.stages.spd, 2);
    assert.equal(a.stages.spe, 2);
  });

  it('Teatime makes the foe eat its Berry', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Teatime', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', item: 'Oran Berry', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    d.currentHp = Math.round(d.maxHp * 0.4);
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.item, null, 'Teatime should consume the foe\'s Berry');
  });

  it('Revival Blessing revives a fainted teammate', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Revival Blessing', 'Splash', 'Splash', 'Splash'] });
    const b = mkMon({ species: 'Pikachu', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    b.currentHp = 0;
    b.status = 'FNT';
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
    a.stats.spe = 999;
    engine.setForcedFoeMoveSlot(0);
    await window.playTurn(0, null);
    assert.ok(b.currentHp > 0, 'the fainted teammate should be revived');
    assert.equal(b.status, null, 'the revived teammate should no longer be fainted');
  });
});
