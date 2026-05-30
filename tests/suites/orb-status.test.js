// Flame Orb / Toxic Orb end-of-turn behavior.
//
// The orb inflicts its status during the end-of-turn phase, AFTER the status-
// damage step, so the holder takes no burn/poison tick on the activation turn;
// damage (and the toxic ramp) start the next turn. Regression guard for the
// activation site (battle.html:28521-28522): the orb is never consumed, so
// without a `!mon.status` guard applyStatus re-fired every turn and logged
// "<mon> is already affected by BRN/TOX!" for the rest of the battle.
//
// Note: these drive endOfTurnEffects() directly because the jsdom harness's
// reset() does not set state.magicRoom, so _monItemActive (which requires
// `state.magicRoom === 0`) is false under the normal runTurn() path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;

async function runOrb(species, orb, turns = 3) {
  eng.reset();
  const st = eng.engine.state;
  // Field defaults a real battle sets at start (battle.html:17064-17070).
  st.magicRoom = 0; st.terrain = null; st.terrainTurns = 0;
  st.trickRoom = 0; st.gravity = 0; st.wonderRoom = 0;
  const holder = eng.mkMon({ species, moves: ['Splash', 'Splash', 'Splash', 'Splash'], item: orb });
  holder.ability = 'Pressure'; // inert — avoid an ability that blocks the status (e.g. Snorlax Immunity)
  const foe = eng.mkMon({ species: 'Caterpie', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  foe.ability = 'Pressure';
  st.pActive = holder; st.fActive = foe; st.playerParty = [holder]; st.foeParty = [foe];

  const perTurn = [];
  for (let t = 0; t < turns; t++) {
    const hpBefore = holder.currentHp;
    const start = eng.logs.length;
    await W.endOfTurnEffects(holder, foe);
    perTurn.push({
      status: holder.status,
      dmg: hpBefore - holder.currentHp,
      logs: eng.logs.slice(start).map(l => l.text),
    });
  }
  return { holder, perTurn };
}

const noSpam = (perTurn) => {
  for (const turn of perTurn) {
    assert.ok(!turn.logs.some(x => /already affected by/.test(x)),
      `no "already affected by" spam (got: ${turn.logs.join(' | ')})`);
  }
};

test('Flame Orb: burns on the activation turn with no damage, 1/16 each turn after, no log spam', async () => {
  const { holder, perTurn } = await runOrb('Snorlax', 'Flame Orb');
  assert.equal(perTurn[0].status, 'BRN', 'burned at the end of the activation turn');
  assert.equal(perTurn[0].dmg, 0, 'no burn damage on the activation turn');
  const tick = Math.max(1, Math.floor(holder.maxHp / 16));
  assert.equal(perTurn[1].dmg, tick, 'burn deals 1/16 from turn 2');
  assert.equal(perTurn[2].dmg, tick, 'burn stays flat 1/16');
  noSpam(perTurn);
});

test('Toxic Orb: badly poisons on the activation turn with no damage, ramps 1/16 -> 2/16, no log spam', async () => {
  const { holder, perTurn } = await runOrb('Raticate', 'Toxic Orb');
  assert.equal(perTurn[0].status, 'TOX', 'badly poisoned at the end of the activation turn');
  assert.equal(perTurn[0].dmg, 0, 'no toxic damage on the activation turn');
  assert.equal(perTurn[1].dmg, Math.max(1, Math.floor(holder.maxHp * 1 / 16)), 'first toxic tick is 1/16');
  assert.equal(perTurn[2].dmg, Math.max(1, Math.floor(holder.maxHp * 2 / 16)), 'toxic ramps to 2/16 (orb re-fire does not reset the counter)');
  noSpam(perTurn);
});
