// DRAFT — fills for the OHKO, FIXED-DAMAGE and DELAYED-DAMAGE clusters.
// Promote per the test-coverage-filler workflow. Runs in CI as-is.
//
// Setup-shapes:
//   OHKO    — No-Guard attacker vs a same-level foe → instant KO.
//   fixed   — damage ignores the target's Defense (level/constant based).
//   delayed — Future Sight / Doom Desire deal nothing when used and strike two
//             turns later; turn 2/3 are driven via playTurn (no reset).
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

async function dealt(move, defSpecies, attackerAbility = 'None') {
  const a = mkMon({ species: 'Mew', ability: attackerAbility, moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: defSpecies, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const before = d.currentHp;
  await runTurn({ playerMon: a, foeMon: d });
  return { dmg: before - d.currentHp, foe: d };
}

describe('OHKO / fixed / delayed moves (draft fills)', () => {
  // ── OHKO: guaranteed hit via No Guard, same level → instant KO ──
  for (const m of ['Fissure', 'Sheer Cold', 'Horn Drill', 'Guillotine']) {
    it(`${m} one-hit KOs a same-level foe`, async () => {
      const r = await dealt(m, 'Sceptile', 'No Guard');
      assert.equal(r.foe.currentHp, 0, `${m} should one-hit KO`);
    });
  }

  // ── fixed / level-based: damage is independent of the target's Defense ──
  // (harness builds at L50, so Seismic Toss / Night Shade land for 50.)
  it('Seismic Toss deals level-based damage, ignoring Defense', async () => {
    const frail = (await dealt('Seismic Toss', 'Blissey')).dmg; // Def 10
    const bulky = (await dealt('Seismic Toss', 'Aggron')).dmg;  // Def 180
    assert.equal(frail, bulky, 'Seismic Toss should ignore Defense');
    assert.equal(frail, 50, 'at L50 Seismic Toss deals 50');
  });
  it('Night Shade deals level-based damage, ignoring Defense', async () => {
    const frail = (await dealt('Night Shade', 'Sceptile')).dmg; // not Normal (Ghost hits)
    const bulky = (await dealt('Night Shade', 'Aggron')).dmg;
    assert.equal(frail, bulky, 'Night Shade should ignore Defense');
    assert.equal(frail, 50, 'at L50 Night Shade deals 50');
  });
  it('Dragon Rage always deals 40', async () => {
    assert.equal((await dealt('Dragon Rage', 'Blissey')).dmg, 40);
    assert.equal((await dealt('Dragon Rage', 'Aggron')).dmg, 40);
  });
  it('Sonic Boom always deals 20', async () => {
    assert.equal((await dealt('Sonic Boom', 'Blissey')).dmg, 20);
    assert.equal((await dealt('Sonic Boom', 'Aggron')).dmg, 20);
  });

  // ── delayed: lands two turns after use ──
  for (const m of ['Future Sight', 'Doom Desire']) {
    it(`${m} strikes two turns after it is used`, async () => {
      const a = mkMon({ species: 'Mew', ability: 'None', moves: [m, 'Splash', 'Splash', 'Splash'] });
      const d = mkMon({ species: 'Blissey', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
      const before = d.currentHp;
      await runTurn({ playerMon: a, foeMon: d });                  // T1: queue the strike
      assert.equal(d.currentHp, before, `${m} should deal no damage the turn it is used`);
      engine.setForcedFoeMoveSlot(1);
      await window.playTurn(1, null);                              // T2: still pending
      assert.equal(d.currentHp, before, `${m} should still be pending on turn 2`);
      engine.setForcedFoeMoveSlot(1);
      await window.playTurn(1, null);                              // T3: strike lands
      assert.ok(d.currentHp < before, `${m} should strike on turn 3`);
    });
  }
});
