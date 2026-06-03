// DRAFT — fills for TYPE-CHANGING status moves. Promote per the workflow.
// Setup-shape: one runTurn; assert the resulting type1/type2 ('' = no second type).
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function cast(move, { foe = 'Snorlax' } = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: foe, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await runTurn({ playerMon: a, foeMon: d });
  return { a, d };
}

describe('Type-changing moves (draft fills)', () => {
  it('Soak turns the foe into a pure Water type', async () => {
    const { d } = await cast('Soak');
    assert.equal(d.type1, 'Water');
    assert.equal(d.type2, '');
  });
  it("Forest's Curse adds Grass as the foe's second type", async () => {
    assert.equal((await cast("Forest's Curse")).d.type2, 'Grass');
  });
  it('Trick-or-Treat adds Ghost as the foe\'s second type', async () => {
    assert.equal((await cast('Trick-or-Treat')).d.type2, 'Ghost');
  });
  it('Magic Powder turns the foe Psychic', async () => {
    assert.equal((await cast('Magic Powder')).d.type1, 'Psychic');
  });
  it('Conversion makes the user a single Normal type', async () => {
    const { a } = await cast('Conversion');
    assert.equal(a.type1, 'Normal');
    assert.equal(a.type2, '');
  });
  it("Reflect Type copies the foe's typing onto the user", async () => {
    const { a } = await cast('Reflect Type', { foe: 'Charizard' });
    assert.equal(a.type1, 'Fire');
    assert.equal(a.type2, 'Flying');
  });
  it('Camouflage changes the user (Normal with no terrain)', async () => {
    assert.equal((await cast('Camouflage')).a.type1, 'Normal');
  });
});
