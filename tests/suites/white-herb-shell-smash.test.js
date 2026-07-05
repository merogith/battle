// White Herb restores ALL of a move's lowered stats at once — Showdown parity.
//
// Bug (pre-fix): White Herb resolved *inline* inside changeStage on every drop,
// and consumed itself on the FIRST lowered stat. Shell Smash lowers Def then SpD
// via two sequential changeStage calls, so the herb fired on the Def drop, was
// consumed, and left SpD stuck at -1. The competitive item text is "Restores all
// lowered stat stages to 0 when one is less than 0."
//
// Fix (battle.html): changeStage defers the herb while a stat-change batch is open
// (beginStatBatch / endStatBatch wrap the multi-stat application sites — the generic
// `move.boosts` loop, the Shell Smash fallback, and the two `move.self.boosts`
// forEach sites). endStatBatch flushes resolveWhiteHerb() once for both active mons
// AFTER the whole block resolves. Single, un-batched drops (opponent secondaries,
// Intimidate, hazards) still resolve inline exactly as before.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();

function stagesOf(mon) {
  const s = mon.stages;
  return { def: s.def, spd: s.spd, atk: s.atk, spa: s.spa, spe: s.spe };
}

function herbRestoreLogs() {
  return eng.logs.filter(l => /White Herb restored its stats!/.test(l.text)).length;
}

test('Shell Smash + White Herb (full turn): both Def AND SpD restored, herb consumed', async () => {
  const user = eng.mkMon({ species: 'Cloyster', item: 'White Herb', ability: 'Skill Link',
    moves: ['Shell Smash', 'Tackle', 'Tackle', 'Tackle'] });
  const foe = eng.mkMon({ species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const startLog = eng.logs.length;
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });

  assert.deepEqual(stagesOf(user), { def: 0, spd: 0, atk: 2, spa: 2, spe: 2 },
    'Def and SpD both restored to 0; the +2 boosts stay');
  assert.equal(user.item, null, 'White Herb consumed');
  assert.equal(user.itemConsumed, true, 'itemConsumed flag set');
  const restores = eng.logs.slice(startLog).filter(l => /White Herb restored/.test(l.text)).length;
  assert.equal(restores, 1, 'White Herb restore message logged exactly once');
});

test('Shell Smash + White Herb (parseMoveEffects / generic boosts loop): both drops restored', async () => {
  eng.reset();
  const st = eng.engine.state;
  const user = eng.mkMon({ species: 'Omastar', item: 'White Herb',
    moves: ['Shell Smash', 'Tackle', 'Tackle', 'Tackle'] });
  const foe = eng.mkMon({ species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  st.pActive = user; st.fActive = foe; st.playerParty = [user]; st.foeParty = [foe];

  const move = eng.engine.buildMoveObject('Shell Smash', user);
  await eng.engine.parseMoveEffects(user, foe, move, true);

  assert.deepEqual(stagesOf(user), { def: 0, spd: 0, atk: 2, spa: 2, spe: 2 });
  assert.equal(user.item, null, 'White Herb consumed');
});

test('Shell Smash WITHOUT White Herb: Def and SpD stay lowered (no phantom restore)', async () => {
  const user = eng.mkMon({ species: 'Cloyster', ability: 'Skill Link',
    moves: ['Shell Smash', 'Tackle', 'Tackle', 'Tackle'] });
  const foe = eng.mkMon({ species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });

  assert.deepEqual(stagesOf(user), { def: -1, spd: -1, atk: 2, spa: 2, spe: 2 },
    'no White Herb -> both drops remain');
});

test('Close Combat + White Herb (move.self.boosts multi-drop): Def AND SpD restored', async () => {
  const user = eng.mkMon({ species: 'Machamp', item: 'White Herb',
    moves: ['Close Combat', 'Tackle', 'Tackle', 'Tackle'] });
  const foe = eng.mkMon({ species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });

  assert.equal(user.stages.def, 0, 'Def restored');
  assert.equal(user.stages.spd, 0, 'SpD restored');
  assert.equal(user.item, null, 'White Herb consumed');
});

test('Overheat + White Herb (single self-drop): still restores and consumes', async () => {
  const user = eng.mkMon({ species: 'Charizard', item: 'White Herb',
    moves: ['Overheat', 'Tackle', 'Tackle', 'Tackle'] });
  const foe = eng.mkMon({ species: 'Blissey', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });

  assert.equal(user.stages.spa, 0, 'SpA drop restored');
  assert.equal(user.item, null, 'White Herb consumed');
});

test('Opponent secondary drop (Acid Spray) + White Herb: un-batched inline restore still works', async () => {
  const user = eng.mkMon({ species: 'Snorlax', item: 'White Herb',
    moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const foe = eng.mkMon({ species: 'Gengar',
    moves: ['Acid Spray', 'Acid Spray', 'Acid Spray', 'Acid Spray'] });
  await eng.runTurn({ playerMon: user, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });

  assert.equal(user.stages.spd, 0, 'Acid Spray SpD drop restored inline (no batch open)');
  assert.equal(user.item, null, 'White Herb consumed on the single un-batched drop');
});
