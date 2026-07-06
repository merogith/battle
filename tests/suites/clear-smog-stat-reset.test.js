// Clear Smog resets ALL of the target's stat stages to 0 — Showdown parity.
//
// Bug (pre-fix): Clear Smog's moves.json entry has `secondary: null` and no `boosts`
// field, and no named handler existed anywhere in parseMoveEffects. The move dealt its
// 50 BP of Special damage but never touched the target's stat stages — the defining
// effect of the move ("Resets all of the target's stat stages to 0") did nothing.
//
// Fix (battle.html, parseMoveEffects): a guaranteed additional-effect handler resets
// every stage (raised AND lowered) back to 0 after damage. Not a chance-based secondary
// (Serene Grace / Shield Dust don't apply); Clear Body / White Smoke do NOT prevent the
// reset; a Substitute on the target blocks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();

function setup(userOpts, foeOpts) {
  eng.reset();
  const st = eng.engine.state;
  const user = eng.mkMon({ species: 'Weezing', moves: ['Clear Smog', 'Tackle', 'Tackle', 'Tackle'], ...userOpts });
  const foe = eng.mkMon({ species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'], ...foeOpts });
  st.pActive = user; st.fActive = foe; st.playerParty = [user]; st.foeParty = [foe];
  return { st, user, foe };
}

test('Clear Smog resets both raised and lowered target stages to 0', async () => {
  const { user, foe } = setup();
  foe.stages.atk = 2; foe.stages.spe = 1; foe.stages.def = -1; foe.stages.spd = 3; foe.stages.eva = 2;
  const move = eng.engine.buildMoveObject('Clear Smog', user);
  await eng.engine.parseMoveEffects(user, foe, move, true);
  assert.deepEqual(
    { atk: foe.stages.atk, def: foe.stages.def, spa: foe.stages.spa, spd: foe.stages.spd, spe: foe.stages.spe, acc: foe.stages.acc, eva: foe.stages.eva },
    { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    'all seven stages reset to 0');
});

test('Clear Smog full turn: deals damage AND clears the target boosts', async () => {
  const { user, foe } = setup();
  foe.stages.atk = 2; foe.stages.spe = 1;
  const hpBefore = foe.currentHp;
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.ok(foe.currentHp < hpBefore, 'foe took Clear Smog damage');
  assert.equal(foe.stages.atk, 0, 'atk boost cleared');
  assert.equal(foe.stages.spe, 0, 'spe boost cleared');
});

test('Clear Smog is NOT blocked by Clear Body (reset is not "lowering")', async () => {
  const { user, foe } = setup({}, { species: 'Metang', ability: 'Clear Body' });
  foe.stages.atk = 2; foe.stages.def = 2;
  const move = eng.engine.buildMoveObject('Clear Smog', user);
  await eng.engine.parseMoveEffects(user, foe, move, true);
  assert.equal(foe.stages.atk, 0, 'Clear Body does not stop the reset');
  assert.equal(foe.stages.def, 0, 'Clear Body does not stop the reset');
});

test('Clear Smog reset is blocked by the target Substitute', async () => {
  const { foe, user } = setup();
  foe.stages.atk = 2;
  foe.volatile.sub = Math.floor(foe.maxHp / 4);
  const move = eng.engine.buildMoveObject('Clear Smog', user);
  await eng.engine.parseMoveEffects(user, foe, move, true);
  assert.equal(foe.stages.atk, 2, 'Substitute protects the target boosts');
});

test('Clear Smog on an unboosted target is a no-op on stages (still valid)', async () => {
  const { foe, user } = setup();
  const move = eng.engine.buildMoveObject('Clear Smog', user);
  await eng.engine.parseMoveEffects(user, foe, move, true);
  assert.equal(foe.stages.atk, 0);
  assert.equal(foe.stages.def, 0);
});
