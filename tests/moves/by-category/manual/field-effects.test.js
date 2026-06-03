// DRAFT — fills for the FIELD-EFFECT cluster: weather, terrain, entry hazards,
// and side conditions / screens. Promote per the test-coverage-filler workflow.
//
// Setup-shape: one runTurn, then assert engine.state. Weather is a string
// (Rain/Sun/Sandstorm/Hail; Snowscape maps to Hail); terrain is a string
// (Electric/Grassy/Misty/Psychic); hazards land on the FOE's side (fSide); screens
// and side conditions land on the user's side (pSide). Aurora Veil needs snow up
// first, so it runs as a two-turn sequence.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn, engine, window;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
  engine = e.engine;
  window = e.window;
});

async function field(move) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await runTurn({ playerMon: a, foeMon: d });
  return engine.state;
}

describe('Field-effect moves (draft fills)', () => {
  for (const [move, weather] of [
    ['Rain Dance', 'Rain'], ['Sunny Day', 'Sun'], ['Sandstorm', 'Sandstorm'], ['Hail', 'Hail'], ['Snowscape', 'Hail'],
  ]) {
    it(`${move} sets ${weather} weather`, async () => {
      assert.equal((await field(move)).weather, weather, `${move} should set ${weather}`);
    });
  }

  for (const [move, terrain] of [
    ['Electric Terrain', 'Electric'], ['Grassy Terrain', 'Grassy'], ['Misty Terrain', 'Misty'], ['Psychic Terrain', 'Psychic'],
  ]) {
    it(`${move} sets ${terrain} Terrain`, async () => {
      assert.equal((await field(move)).terrain, terrain, `${move} should set ${terrain} Terrain`);
    });
  }

  // Entry hazards land on the foe's side.
  it('Stealth Rock sets rocks on the foe side', async () => assert.equal((await field('Stealth Rock')).fSide.stealthRock, true));
  it('Spikes sets spikes on the foe side', async () => assert.ok((await field('Spikes')).fSide.spikes > 0));
  it('Toxic Spikes sets toxic spikes on the foe side', async () => assert.ok((await field('Toxic Spikes')).fSide.toxicSpikes > 0));
  it('Sticky Web sets webs on the foe side', async () => assert.equal((await field('Sticky Web')).fSide.stickyWeb, true));

  // Screens / side conditions land on the user's side.
  it('Reflect raises the physical screen', async () => assert.ok((await field('Reflect')).pSide.reflect > 0));
  it('Light Screen raises the special screen', async () => assert.ok((await field('Light Screen')).pSide.lightScreen > 0));
  it('Tailwind sets tailwind', async () => assert.ok((await field('Tailwind')).pSide.tailwind > 0));
  it('Safeguard sets safeguard', async () => assert.ok((await field('Safeguard')).pSide.safeguard > 0));
  it('Mist sets mist', async () => assert.ok((await field('Mist')).pSide.mist > 0));
  it('Lucky Chant sets lucky chant', async () => assert.ok((await field('Lucky Chant')).pSide.luckychant > 0));

  it('Aurora Veil sets the veil once snow is up', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Snowscape', 'Aurora Veil', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    await runTurn({ playerMon: a, foeMon: d, playerMoveSlot: 0 }); // snow up
    engine.setForcedFoeMoveSlot(0);
    await window.playTurn(1, null);                                // Aurora Veil
    assert.ok(engine.state.pSide.auroraVeil > 0, 'Aurora Veil should set the veil in snow');
  });
});
