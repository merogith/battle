// DRAFT — fills for STAT-STAGE swap/copy moves and raw-stat split/swap moves.
// Promote per the workflow.
//
// Setup-shapes: for stage moves, pre-set the foe's stages then assert the
// swap/copy/inversion. For raw-stat moves (Power/Guard Split, Speed Swap) use
// Shuckle (extreme Def, tiny Atk/Spe) so the averaging/swap is unmistakable.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function swap(move, foeStages = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  Object.assign(d.stages, foeStages);
  await runTurn({ playerMon: a, foeMon: d });
  return { a, d };
}

describe('Stat-swap / split moves (draft fills)', () => {
  it('Power Swap exchanges Attack & Sp.Atk stages', async () => {
    const { a, d } = await swap('Power Swap', { atk: 2, spa: 1 });
    assert.equal(a.stages.atk, 2);
    assert.equal(a.stages.spa, 1);
    assert.equal(d.stages.atk, 0);
  });
  it('Guard Swap exchanges Defense & Sp.Def stages', async () => {
    const { a, d } = await swap('Guard Swap', { def: 2, spd: -1 });
    assert.equal(a.stages.def, 2);
    assert.equal(a.stages.spd, -1);
    assert.equal(d.stages.def, 0);
  });
  it('Heart Swap exchanges all stat stages', async () => {
    const { a, d } = await swap('Heart Swap', { atk: 2, def: 2, spa: 1, spd: -1 });
    assert.equal(a.stages.atk, 2);
    assert.equal(a.stages.spd, -1);
    assert.equal(d.stages.atk, 0);
  });
  it("Psych Up copies the foe's stat stages onto the user", async () => {
    const { a, d } = await swap('Psych Up', { atk: 2, def: 2, spa: 1, spd: -1 });
    assert.equal(a.stages.atk, 2);
    assert.equal(a.stages.spd, -1);
    assert.equal(d.stages.atk, 2); // foe keeps its own
  });
  it("Topsy-Turvy inverts the foe's stat stages", async () => {
    const { d } = await swap('Topsy-Turvy', { atk: 2, def: 2, spa: 1, spd: -1 });
    assert.equal(d.stages.atk, -2);
    assert.equal(d.stages.spd, 1);
  });

  // raw-stat moves vs Shuckle (huge Def, tiny Atk/Spe)
  async function vsShuckle(move) {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Shuckle', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    const before = { atk: a.stats.atk, def: a.stats.def, spe: a.stats.spe };
    await runTurn({ playerMon: a, foeMon: d });
    return { before, after: { atk: a.stats.atk, def: a.stats.def, spe: a.stats.spe }, foe: d };
  }
  it('Power Split lowers the user\'s Attack toward the weaker target', async () => {
    const r = await vsShuckle('Power Split');
    assert.ok(r.after.atk < r.before.atk, 'Power Split should average Attack down vs Shuckle');
  });
  it('Guard Split raises the user\'s Defense toward the bulkier target', async () => {
    const r = await vsShuckle('Guard Split');
    assert.ok(r.after.def > r.before.def, 'Guard Split should average Defense up vs Shuckle');
  });
  it('Speed Swap exchanges raw Speed with the target', async () => {
    const r = await vsShuckle('Speed Swap');
    // After the swap the user holds Shuckle's (much lower) Speed.
    assert.ok(r.after.spe < r.before.spe, 'Speed Swap should hand the user Shuckle\'s low Speed');
  });
});
