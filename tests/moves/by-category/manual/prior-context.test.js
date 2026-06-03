// DRAFT — fills for the PRIOR-CONTEXT cluster (moves that react to what the foe
// just did). Promote per the test-coverage-filler workflow. Runs in CI as-is.
//
// Setup-shape: give the foe an attacking move in slot 0, the player the reactive
// move, and assert both the "lands" and the "fails" branch where the move has a
// gate. Counter/Mirror Coat/Avalanche/Revenge have negative priority so they
// resolve after the foe even with the harness's forced-fast player; Metal Burst
// (0 priority) must be made the slower mon to have something to reflect.
//
// Engine gaps found while writing this:
//   • Comeuppance reflected 0 in every case — FIXED (now routed through the same
//     attacker-volatile reflect path as its twin Metal Burst); asserted below.
//   • Upper Hand / Shell Trap now enforce their gates (priority-attacking foe /
//     having taken a physical hit); asserted below — connect under the gate, fail otherwise.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn, window, engine;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
  window = e.window;
  engine = e.engine;
});

// Player uses pMove (slot 0) reacting to the foe's fMove (slot 0). Returns damage
// dealt to the foe. `slow` makes the player the slower mon (for 0-priority reflectors).
async function react(pMove, fMove, { slow = false } = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [pMove, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: [fMove, 'Splash', 'Splash', 'Splash'] });
  if (slow) d.stats.spe = 999;
  const before = d.currentHp;
  await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0, forcePlayerFast: !slow });
  return before - d.currentHp;
}

describe('Prior-context moves (draft fills)', () => {
  it('Counter reflects a physical hit and fails versus special', async () => {
    assert.ok(await react('Counter', 'Body Slam') > 0, 'Counter should reflect a physical hit');
    assert.equal(await react('Counter', 'Water Gun'), 0, 'Counter should fail versus a special hit');
  });
  it('Mirror Coat reflects a special hit and fails versus physical', async () => {
    assert.ok(await react('Mirror Coat', 'Water Gun') > 0, 'Mirror Coat should reflect a special hit');
    assert.equal(await react('Mirror Coat', 'Body Slam'), 0, 'Mirror Coat should fail versus a physical hit');
  });
  it('Metal Burst reflects the last hit (either kind), and needs a prior hit', async () => {
    assert.ok(await react('Metal Burst', 'Body Slam', { slow: true }) > 0, 'reflects a physical hit');
    assert.ok(await react('Metal Burst', 'Water Gun', { slow: true }) > 0, 'reflects a special hit');
    assert.equal(await react('Metal Burst', 'Splash', { slow: true }), 0, 'fails with no prior hit');
  });
  it('Comeuppance reflects the last hit like its twin Metal Burst, and needs a prior hit', async () => {
    assert.ok(await react('Comeuppance', 'Body Slam', { slow: true }) > 0, 'reflects a physical hit');
    assert.ok(await react('Comeuppance', 'Water Gun', { slow: true }) > 0, 'reflects a special hit');
    assert.equal(await react('Comeuppance', 'Splash', { slow: true }), 0, 'fails with no prior hit');
  });

  it('Avalanche is stronger when the user was hit first', async () => {
    const hit = await react('Avalanche', 'Body Slam');
    const notHit = await react('Avalanche', 'Splash');
    assert.ok(hit > notHit, `Avalanche: hit ${hit} > not-hit ${notHit}`);
  });
  it('Revenge is stronger when the user was hit first', async () => {
    const hit = await react('Revenge', 'Body Slam');
    const notHit = await react('Revenge', 'Splash');
    assert.ok(hit > notHit, `Revenge: hit ${hit} > not-hit ${notHit}`);
  });

  it('Focus Punch lands if undisturbed and fails if struck', async () => {
    assert.ok(await react('Focus Punch', 'Splash') > 0, 'Focus Punch should land when not hit');
    assert.equal(await react('Focus Punch', 'Body Slam'), 0, 'Focus Punch should fail when hit by a damaging move');
  });
  it('Sucker Punch lands versus an attacker and fails versus a status move', async () => {
    assert.ok(await react('Sucker Punch', 'Body Slam') > 0, 'Sucker Punch should land versus an attack');
    assert.equal(await react('Sucker Punch', 'Splash'), 0, 'Sucker Punch should fail versus a status move');
  });

  // First-turn-only moves: land on turn 1, fail on turn 2 (driven without reset).
  for (const m of ['Fake Out', 'First Impression']) {
    it(`${m} works on turn 1 only`, async () => {
      const a = mkMon({ species: 'Mew', ability: 'None', moves: [m, 'Splash', 'Splash', 'Splash'] });
      const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
      const before = d.currentHp;
      await runTurn({ playerMon: a, foeMon: d });
      assert.ok(d.currentHp < before, `${m} should land on turn 1`);
      const mid = d.currentHp;
      engine.setForcedFoeMoveSlot(0);
      await window.playTurn(0, null);
      assert.equal(d.currentHp, mid, `${m} should fail on turn 2`);
    });
  }

  it('Last Resort fails until the user has used its other moves', async () => {
    assert.equal(await react('Last Resort', 'Splash'), 0, 'Last Resort should fail on turn 1');
  });

  it('Bide releases stored damage after charging two turns', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Bide', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    const before = d.currentHp;
    await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0 });       // store 1
    engine.setForcedFoeMoveSlot(0);
    await window.playTurn(0, null);                                   // store 2
    engine.setForcedFoeMoveSlot(0);
    await window.playTurn(0, null);                                   // release
    assert.ok(d.currentHp < before, 'Bide should release stored damage on the third turn');
  });

  // Plain damaging hits in singles (no special context to trigger the bonus).
  for (const [m, foeMove] of [
    ['Pursuit', 'Splash'], ['Beat Up', 'Splash'], ['Assurance', 'Splash'],
  ]) {
    it(`${m} deals damage`, async () => {
      assert.ok(await react(m, foeMove) > 0, `${m} should deal damage`);
    });
  }

  it('Upper Hand connects only versus a priority attacking move', async () => {
    assert.ok(await react('Upper Hand', 'Quick Attack') > 0, 'connects versus a priority move');
    assert.equal(await react('Upper Hand', 'Body Slam'), 0, 'fails versus a non-priority move');
    assert.equal(await react('Upper Hand', 'Splash'), 0, 'fails versus a status move');
  });
  it('Shell Trap connects only after the user takes a physical hit', async () => {
    assert.ok(await react('Shell Trap', 'Body Slam', { slow: true }) > 0, 'connects after a physical hit');
    assert.equal(await react('Shell Trap', 'Water Gun', { slow: true }), 0, 'fails versus a special hit');
    assert.equal(await react('Shell Trap', 'Splash', { slow: true }), 0, 'fails with no prior hit');
  });
});
