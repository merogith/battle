// DRAFT — fills for ABILITY-CHANGING status moves. Promote per the workflow.
// Setup-shape: distinct abilities (user Levitate, foe Sturdy), one runTurn, assert
// the resulting .ability on each side.
//
// Deferred: Doodle — no-op in singles here (user's ability is left unchanged; it is
// an ally-copy move). Left todo, not asserted.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function cast(move) {
  const a = mkMon({ species: 'Mew', ability: 'Levitate', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'Sturdy', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await runTurn({ playerMon: a, foeMon: d });
  return { a, d };
}

describe('Ability-changing moves (draft fills)', () => {
  it('Worry Seed sets the foe ability to Insomnia', async () => {
    assert.equal((await cast('Worry Seed')).d.ability, 'Insomnia');
  });
  it('Simple Beam sets the foe ability to Simple', async () => {
    assert.equal((await cast('Simple Beam')).d.ability, 'Simple');
  });
  it("Entrainment copies the user's ability onto the foe", async () => {
    assert.equal((await cast('Entrainment')).d.ability, 'Levitate');
  });
  it("Role Play copies the foe's ability onto the user", async () => {
    assert.equal((await cast('Role Play')).a.ability, 'Sturdy');
  });
  it('Skill Swap exchanges the two abilities', async () => {
    const { a, d } = await cast('Skill Swap');
    assert.equal(a.ability, 'Sturdy');
    assert.equal(d.ability, 'Levitate');
  });
});
