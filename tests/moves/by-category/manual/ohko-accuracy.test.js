// Showdown-parity regression tests for OHKO move accuracy
// (Fissure / Guillotine / Horn Drill / Sheer Cold).
//
//   - acc = 30 + (attacker level − defender level); NOT modified by acc/eva
//     stages, items or abilities (Showdown skips ModifyAccuracy for ohko moves)
//   - Sheer Cold: 20 base acc for a non-Ice attacker (gen 7+); Ice targets immune
//   - fails outright when the defender's level is higher
//   - Sturdy: full immunity (not a survive-at-1-HP)
//   - Focus Sash still survives at 1 HP
//
// Accuracy rolls are pinned by replacing the harness Math.random with a
// constant for the duration of each test (restored afterwards).
import { describe, it, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn, window, nextFloat, engine, reset;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
  window = e.window;
  nextFloat = e.nextFloat;
  engine = e.engine;
  reset = e.reset;
});

afterEach(() => {
  // restore the seeded PRNG no matter what a test did
  window.Math.random = nextFloat;
});

const pinRoll = (v) => { window.Math.random = () => v; };

describe('OHKO move accuracy (Showdown parity)', () => {
  it('ignores defender evasion stages (roll 25 vs base 30 hits through +6 eva)', async () => {
    const a = mkMon({ species: 'Mew', moves: ['Fissure', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Sceptile', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    d.stages.eva = 6; // legacy pipeline: 30 × (3/9) = 10 acc → roll 25 missed
    pinRoll(0.25);
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.currentHp, 0, 'Fissure must ignore evasion stages and land at roll 25 < 30');
  });

  it('ignores attacker accuracy stages (roll 35 vs base 30 misses despite +6 acc)', async () => {
    const a = mkMon({ species: 'Mew', moves: ['Fissure', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Sceptile', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a.stages.acc = 6; // legacy pipeline: 30 × 3 = 90 acc → roll 35 hit
    pinRoll(0.35);
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.currentHp, d.maxHp, 'Fissure must miss at roll 35 > 30 regardless of acc stages');
  });

  it('Sheer Cold has 20 base accuracy for a non-Ice attacker', async () => {
    const a = mkMon({ species: 'Mew', moves: ['Sheer Cold', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Sceptile', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    pinRoll(0.25); // 25 > 20 → miss for a non-Ice attacker, would hit at base 30
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.currentHp, d.maxHp, 'non-Ice Sheer Cold is 20 acc → roll 25 must miss');
  });

  it('Sheer Cold keeps 30 base accuracy for an Ice-type attacker', async () => {
    const a = mkMon({ species: 'Glalie', moves: ['Sheer Cold', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Sceptile', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    pinRoll(0.25); // 25 < 30 → hit for an Ice attacker
    await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.currentHp, 0, 'Ice-type Sheer Cold is 30 acc → roll 25 must land');
  });

  it('Sheer Cold cannot affect Ice-type targets, even through No Guard', async () => {
    const a = mkMon({ species: 'Mew', ability: 'No Guard', moves: ['Sheer Cold', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Glalie', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const turnLogs = await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.currentHp, d.maxHp, 'Ice-type target must be immune to Sheer Cold');
    assert.ok(turnLogs.some((l) => l.text.includes("doesn't affect") && l.text.includes('Ice type')),
      'immunity message expected');
  });

  it('fails outright against a higher-level defender', async () => {
    const a = mkMon({ species: 'Mew', ability: 'No Guard', moves: ['Fissure', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Sceptile', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    d.level = 60; // engine is flat-Lv50; simulate a higher-level target
    const turnLogs = await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.currentHp, d.maxHp, 'OHKO must fail against a higher-level target');
    assert.ok(turnLogs.some((l) => l.text.includes('unaffected')), 'level-fail message expected');
  });

  it('Sturdy grants full immunity to OHKO moves (no damage at all)', async () => {
    const a = mkMon({ species: 'Mew', ability: 'No Guard', moves: ['Fissure', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Sceptile', ability: 'Sturdy', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const turnLogs = await runTurn({ playerMon: a, foeMon: d });
    assert.equal(d.currentHp, d.maxHp, 'Sturdy target must take NO damage from an OHKO move');
    assert.ok(turnLogs.some((l) => l.text.includes('Sturdy')), 'Sturdy immunity message expected');
  });

  it('Focus Sash still survives an OHKO at exactly 1 HP', async () => {
    // runTurn()'s reset leaves state.magicRoom undefined which disables item
    // checks (`state.magicRoom === 0`); set real-battle field defaults manually
    // (same pattern as tests/suites/orb-status.test.js).
    const a = mkMon({ species: 'Mew', ability: 'No Guard', moves: ['Fissure', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Sceptile', item: 'Focus Sash', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    reset();
    const st = engine.state;
    st.magicRoom = 0; st.terrain = null; st.terrainTurns = 0;
    st.trickRoom = 0; st.gravity = 0; st.wonderRoom = 0;
    st.pActive = a; st.fActive = d; st.playerParty = [a]; st.foeParty = [d];
    a.stats.spe = 999; // player acts first
    await window.playTurn(0, null);
    assert.equal(d.currentHp, 1, 'Focus Sash holder survives the OHKO at 1 HP');
    assert.equal(d.item, null, 'Focus Sash is consumed');
  });
});
