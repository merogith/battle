// Regression coverage for a cluster of stat-stage manipulation bugs found alongside
// the Clear Smog fix. All canonical behaviours below were cross-checked against @pkmn/sim.
//
//  1. Keen Eye / Illuminate never guarded accuracy drops (changeStage had atk/def guards
//     via Hyper Cutter / Big Pecks but no acc guard; the status-move path's guard table was
//     also dead — keyed "acc" while moves.json delivers "accuracy").
//  2. Heart/Power/Guard/Speed Swap + Psych Up carry bypasssub:1 but were wrongly blocked
//     by the target's Substitute.
//  3. Psych Up is a full copy — a user with Focus Energy must LOSE it when the target lacks it.
//  4. Spectral Thief stole boosts from a type-immune target (steal ran before the immunity check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();

function arena(userOpts, foeOpts) {
  eng.reset();
  const st = eng.engine.state;
  const user = eng.mkMon(userOpts);
  const foe = eng.mkMon(foeOpts);
  st.pActive = user; st.fActive = foe; st.playerParty = [user]; st.foeParty = [foe];
  return { st, user, foe };
}

// ── 1. Keen Eye / Illuminate accuracy protection ─────────────────────────────
test('Keen Eye blocks a Sand Attack accuracy drop', async () => {
  const { user, foe } = arena(
    { species: 'Diglett', moves: ['Sand Attack', 'Tackle', 'Tackle', 'Tackle'] },
    { species: 'Pidgey', ability: 'Keen Eye', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(foe.stages.acc, 0, 'Keen Eye prevents the accuracy drop');
});

test('Illuminate blocks a Sand Attack accuracy drop', async () => {
  const { user, foe } = arena(
    { species: 'Diglett', moves: ['Sand Attack', 'Tackle', 'Tackle', 'Tackle'] },
    { species: 'Staryu', ability: 'Illuminate', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(foe.stages.acc, 0, 'Illuminate prevents the accuracy drop');
});

test('Keen Eye still allows non-accuracy drops (Growl lowers Atk)', async () => {
  const { user, foe } = arena(
    { species: 'Diglett', moves: ['Growl', 'Tackle', 'Tackle', 'Tackle'] },
    { species: 'Pidgey', ability: 'Keen Eye', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(foe.stages.atk, -1, 'Keen Eye only guards accuracy, not Attack');
});

// ── 2. Substitute bypass for the swap / copy family ──────────────────────────
async function swapThroughSub(moveName, setup) {
  const { user, foe } = arena(
    { species: 'Mew', moves: [moveName, 'Splash', 'Splash', 'Splash'] },
    { species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  foe.volatile.sub = Math.floor(foe.maxHp / 4);
  setup(user, foe);
  const move = eng.engine.buildMoveObject(moveName, user);
  await eng.engine.parseMoveEffects(user, foe, move, true);
  return { user, foe };
}

test('Heart Swap works through the target Substitute', async () => {
  const { user } = await swapThroughSub('Heart Swap', (u, f) => { f.stages.atk = 3; f.stages.spe = 2; });
  assert.equal(user.stages.atk, 3, 'Heart Swap swaps through a sub');
  assert.equal(user.stages.spe, 2);
});

test('Power Swap works through the target Substitute', async () => {
  const { user } = await swapThroughSub('Power Swap', (u, f) => { f.stages.atk = 2; f.stages.spa = 1; });
  assert.equal(user.stages.atk, 2);
  assert.equal(user.stages.spa, 1);
});

test('Guard Swap works through the target Substitute', async () => {
  const { user } = await swapThroughSub('Guard Swap', (u, f) => { f.stages.def = 2; f.stages.spd = 1; });
  assert.equal(user.stages.def, 2);
  assert.equal(user.stages.spd, 1);
});

test('Psych Up copies through the target Substitute', async () => {
  const { user } = await swapThroughSub('Psych Up', (u, f) => { f.stages.spa = 3; });
  assert.equal(user.stages.spa, 3, 'Psych Up copies through a sub');
});

// ── 3. Psych Up is a full copy of the crit-rate boost too ────────────────────
test('Psych Up clears the user Focus Energy when the target lacks it', async () => {
  const { user, foe } = arena(
    { species: 'Mew', moves: ['Psych Up', 'Splash', 'Splash', 'Splash'] },
    { species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  user.volatile.focusEnergy = true;
  foe.volatile.focusEnergy = false;
  foe.stages.atk = 2;
  const move = eng.engine.buildMoveObject('Psych Up', user);
  await eng.engine.parseMoveEffects(user, foe, move, true);
  assert.equal(user.stages.atk, 2, 'stat stages copied');
  assert.equal(user.volatile.focusEnergy, false, 'Focus Energy cleared to match the target');
});

test('Psych Up copies the target Focus Energy when present', async () => {
  const { user, foe } = arena(
    { species: 'Mew', moves: ['Psych Up', 'Splash', 'Splash', 'Splash'] },
    { species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  user.volatile.focusEnergy = false;
  foe.volatile.focusEnergy = true;
  const move = eng.engine.buildMoveObject('Psych Up', user);
  await eng.engine.parseMoveEffects(user, foe, move, true);
  assert.equal(user.volatile.focusEnergy, true, 'Focus Energy copied from the target');
});

// ── 4. Spectral Thief does not steal from a type-immune target ────────────────
test('Spectral Thief does not steal boosts from a Normal-type (Ghost-immune) target', async () => {
  const { user, foe } = arena(
    { species: 'Marshadow', moves: ['Spectral Thief', 'Splash', 'Splash', 'Splash'] },
    { species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  foe.stages.atk = 6; foe.stages.spe = 2;
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(foe.stages.atk, 6, 'immune target keeps its boosts');
  assert.equal(foe.stages.spe, 2, 'immune target keeps its boosts');
  assert.equal(user.stages.atk, 0, 'attacker steals nothing from an immune target');
  assert.equal(user.stages.spe, 0, 'attacker steals nothing from an immune target');
});

test('Spectral Thief still steals boosts from a non-immune target', async () => {
  const { user, foe } = arena(
    { species: 'Marshadow', moves: ['Spectral Thief', 'Splash', 'Splash', 'Splash'] },
    { species: 'Gengar', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  foe.stages.atk = 2;
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(user.stages.atk, 2, 'boosts stolen from a hittable target');
  assert.equal(foe.stages.atk, 0, 'target loses its boosts');
});
