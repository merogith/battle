// Direct in-house assertions for the Stage-1 engine fixes that the differential
// oracle can't cleanly cover on its own:
//
//   - finding #3 (Gravity): Gravity-banned moves must fail outright. The differential
//     can't assert this because Showdown rejects the illegal *choice* and substitutes
//     a default move, so the two engines diverge for a reason unrelated to the gate.
//   - finding #4 (Facade): a burned Facade keeps its ×2 (the burn Attack-drop is
//     exempted). The damage sweep verifies this too, but the sweep is a standalone
//     script, not part of `npm test` — so this locks the fix into CI.
//
// Reference for both: tests/differential/FINDINGS.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;

// Full neutral field-state a real battle sets at start (mirrors inhouse-oracle.mjs);
// playTurn needs these so held items / field checks behave.
function setup(p, f, { gravity = 0 } = {}) {
  eng.reset();
  const st = eng.engine.state;
  Object.assign(st, {
    pActive: p, fActive: f, playerParty: [p], foeParty: [f], mode: 'pve',
    turnNumber: 0, isOver: false, isLocked: false, weather: null, weatherTurns: 0,
    terrain: null, terrainTurns: 0, trickRoom: 0, gravity, magicRoom: 0,
    mudSport: 0, waterSport: 0, wonderRoom: 0,
  });
  const side = {
    stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0,
    lightScreen: 0, auroraVeil: 0, wishHp: 0, wishTurns: 0, safeguard: 0, mist: 0,
    tailwind: 0, luckychant: 0,
  };
  st.pSide = { ...side };
  st.fSide = { ...side };
}

// Player uses `playerMove`; the foe uses a Gravity-legal move (Defense Curl) so the
// foe's own action never confounds the "blocked" check.
async function useMove(playerMove, { gravity = 0 } = {}) {
  const p = eng.mkMon({ species: 'Pelipper', ability: 'Keen Eye', moves: [playerMove, 'Water Gun'], nature: 'Modest', evs: { spa: 252 } });
  const f = eng.mkMon({ species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'], nature: 'Impish', evs: { hp: 252, def: 252 } });
  setup(p, f, { gravity });
  const start = eng.logs.length;
  eng.engine.setForcedFoeMoveSlot(0);
  await W.playTurn(0, null);
  return { p, f, logs: eng.logs.slice(start).map((l) => l.text) };
}

test('finding #3: Gravity blocks ground-defying moves; legal moves are unaffected', async () => {
  for (const mv of ['Splash', 'Fly', 'Magnet Rise', 'Telekinesis', 'Jump Kick', 'Bounce']) {
    const { p, logs } = await useMove(mv, { gravity: 5 });
    assert.ok(logs.some((l) => /because of gravity/i.test(l)),
      `${mv} should be refused under Gravity (logs: ${logs.join(' | ')})`);
    assert.equal(p.volatile.charging, null, `${mv} must not be left mid-charge under Gravity`);
  }
  // Control 1: a legal move works under Gravity (deals damage, not blocked).
  const ctrl = await useMove('Water Gun', { gravity: 5 });
  assert.ok(!ctrl.logs.some((l) => /Pelipper can't use/i.test(l)), 'Water Gun must not be Gravity-blocked');
  assert.ok(ctrl.f.maxHp - ctrl.f.currentHp > 0, 'Water Gun should deal damage under Gravity');
  // Control 2: without Gravity, Fly charges normally.
  const noGrav = await useMove('Fly', { gravity: 0 });
  assert.equal(noGrav.p.volatile.charging, 'Fly', 'Fly should charge normally without Gravity');
});

test('finding #4: a burned Facade keeps its ×2 (burn Attack-drop exempted)', async () => {
  // Facade damage to a fixed wall, burned vs unburned, averaged over several damage
  // rolls. Burned Facade is ×2 (status boost) with NO burn halving → ~2× unburned.
  async function facadeMeanDmg(burned) {
    let total = 0;
    const N = 8;
    for (let i = 0; i < N; i++) {
      eng.seedRng(100 + i);
      const p = eng.mkMon({ species: 'Snorlax', ability: 'Limber', moves: ['Facade', 'Splash'], nature: 'Adamant', evs: { atk: 252 } });
      if (burned) p.status = 'BRN';
      const f = eng.mkMon({ species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'], nature: 'Impish', evs: { hp: 252, def: 252 } });
      setup(p, f);
      eng.engine.setForcedFoeMoveSlot(0);
      const before = f.currentHp;
      await W.playTurn(0, null);
      total += before - f.currentHp;
    }
    return total / N;
  }
  const burned = await facadeMeanDmg(true);
  const clean = await facadeMeanDmg(false);
  const ratio = burned / clean;
  assert.ok(ratio > 1.7 && ratio < 2.3,
    `burned Facade should be ~2× unburned (burn drop exempted); got burned=${burned.toFixed(1)} clean=${clean.toFixed(1)} ratio=${ratio.toFixed(2)}`);
});
