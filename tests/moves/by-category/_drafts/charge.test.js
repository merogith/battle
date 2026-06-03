// DRAFT — oracle-informed fills for the two-turn CHARGE-move cluster.
// Promote (review → fold into the generator / canonical location) per the
// test-coverage-filler workflow. Runs in CI as-is.
//
// Covers the `it.todo()` charge stubs across by-category/{physical,special}.test.js:
//   Fly, Bounce, Dig, Dive, Phantom Force, Shadow Force, Sky Drop, Skull Bash,
//   Sky Attack, Solar Blade, Freeze Shock (physical) and
//   Solar Beam, Razor Wind, Meteor Beam, Electro Shot, Ice Burn (special).
//
// Why they're todo: the auto-generator's one-shot `runTurn` resets state, so a
// charge move never reaches its hit turn (it just charges and the test sees 0 damage).
//
// Setup-shape (shared by the whole cluster): turn 1 charges — no damage; vanish
// moves go semi-invulnerable; Skull Bash raises Def, Meteor Beam / Electro Shot
// raise SpA. Turn 2 is driven directly via playTurn (NO reset, unlike runTurn) and
// must land. Behaviour cross-checked against the differential oracle's two-turn
// scenarios (tests/differential) and the in-game mechanic.
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

// Turn 1 charges (no damage); turn 2 — driven without reset so the charge volatile
// survives — lands the hit.
async function chargeTest(move, { invulnerable = false, chargeBoost = null } = {}) {
  const attacker = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const defender = mkMon({ species: 'Sceptile', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const beforeHp = defender.currentHp;

  // Turn 1: the move charges.
  await runTurn({ playerMon: attacker, foeMon: defender });
  assert.equal(defender.currentHp, beforeHp, `${move} should deal no damage on its charge turn`);
  assert.equal(attacker.volatile.charging, move, `${move} should be charging after turn 1`);
  if (invulnerable) {
    assert.equal(attacker.volatile.invulnerable, true, `${move} should make the user semi-invulnerable while charging`);
  }
  if (chargeBoost) {
    const [stat, delta] = chargeBoost;
    assert.equal(attacker.stages[stat], delta, `${move} should change ${stat} by ${delta} on the charge turn`);
  }

  // Turn 2: the move lands (playTurn directly — runTurn would reset and wipe the charge).
  engine.setForcedFoeMoveSlot(0);
  await window.playTurn(0, null);
  assert.ok(defender.currentHp < beforeHp, `${move} should land and deal damage on turn 2`);
}

describe('Charge / two-turn moves (draft fills)', () => {
  // ── vanish moves: semi-invulnerable while charging ──
  it('Fly [90 BP Flying Physical]', () => chargeTest('Fly', { invulnerable: true }));
  it('Bounce [85 BP Flying Physical]', () => chargeTest('Bounce', { invulnerable: true }));
  it('Dig [80 BP Ground Physical]', () => chargeTest('Dig', { invulnerable: true }));
  it('Dive [80 BP Water Physical]', () => chargeTest('Dive', { invulnerable: true }));
  it('Phantom Force [90 BP Ghost Physical]', () => chargeTest('Phantom Force', { invulnerable: true }));
  it('Shadow Force [120 BP Ghost Physical]', () => chargeTest('Shadow Force', { invulnerable: true }));
  it('Sky Drop [60 BP Flying Physical]', () => chargeTest('Sky Drop', { invulnerable: true }));

  // ── non-vanish charge moves ──
  it('Sky Attack [140 BP Flying Physical]', () => chargeTest('Sky Attack'));
  it('Solar Blade [125 BP Grass Physical]', () => chargeTest('Solar Blade'));
  it('Freeze Shock [140 BP Ice Physical]', () => chargeTest('Freeze Shock'));
  it('Solar Beam [120 BP Grass Special]', () => chargeTest('Solar Beam'));
  it('Razor Wind [80 BP Normal Special]', () => chargeTest('Razor Wind'));
  it('Ice Burn [140 BP Ice Special]', () => chargeTest('Ice Burn'));

  // ── charge moves that boost a stat on the charge turn ──
  it('Skull Bash [130 BP Normal Physical]', () => chargeTest('Skull Bash', { chargeBoost: ['def', 1] }));
  it('Meteor Beam [120 BP Rock Special]', () => chargeTest('Meteor Beam', { chargeBoost: ['spa', 1] }));
  it('Electro Shot [130 BP Electric Special]', () => chargeTest('Electro Shot', { chargeBoost: ['spa', 1] }));
});
