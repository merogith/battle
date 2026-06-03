// DRAFT — fills for the multi-target STAT-DROP status moves. Promote per the workflow.
//
// These are todo only because they target allAdjacentFoes; in singles they just
// lower the lone foe's stat. Setup-shape: one runTurn (No-Guard attacker so the
// accuracy roll never costs us the assertion), then check the foe's stage.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

describe('Multi-target stat-drop moves (draft fills)', () => {
  for (const [move, stat, delta] of [
    ['Growl', 'atk', -1],
    ['Leer', 'def', -1],
    ['Tail Whip', 'def', -1],
    ['String Shot', 'spe', -2],
    ['Cotton Spore', 'spe', -2],
    ['Sweet Scent', 'eva', -2],
  ]) {
    it(`${move} lowers the foe's ${stat} by ${Math.abs(delta)}`, async () => {
      const a = mkMon({ species: 'Mew', ability: 'No Guard', moves: [move, 'Splash', 'Splash', 'Splash'] });
      const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
      await runTurn({ playerMon: a, foeMon: d });
      assert.equal(d.stages[stat], delta, `${move} should set the foe's ${stat} stage to ${delta}`);
    });
  }
});
