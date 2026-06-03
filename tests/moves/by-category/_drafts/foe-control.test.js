// DRAFT — fills for the FOE-CONTROL cluster (status moves that apply a volatile to
// the target: taunt/torment/trap/identify/suppress). Promote per the workflow.
//
// Setup-shape: one runTurn, assert the foe's volatile flag is set. Encore needs the
// foe to have already moved, so the user is made slower (foe acts first).
//
// Deferred (no readable volatile in the harness — possibly field-level or
// unimplemented; left todo, not asserted): Electrify, Fairy Lock, Nightmare,
// Disable.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function foeGets(move, flag, { slow = false } = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  if (slow) d.stats.spe = 999;
  await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0, forcePlayerFast: !slow });
  return !!(d.volatile && d.volatile[flag]);
}

describe('Foe-control moves (draft fills)', () => {
  for (const [move, flag] of [
    ['Taunt', 'taunt'], ['Torment', 'torment'], ['Heal Block', 'healBlock'],
    ['Embargo', 'embargo'], ['Telekinesis', 'telekinesis'], ['Leech Seed', 'leechSeed'],
    ['Foresight', 'identified'], ['Odor Sleuth', 'identified'], ['Miracle Eye', 'identifiedDark'],
    ['Octolock', 'octolock'], ['Gastro Acid', 'abilityGastroAcid'],
  ]) {
    it(`${move} applies ${flag} to the foe`, async () => {
      assert.ok(await foeGets(move, flag), `${move} should set ${flag} on the foe`);
    });
  }

  for (const move of ['Mean Look', 'Block', 'Spider Web']) {
    it(`${move} traps the foe`, async () => {
      assert.ok(await foeGets(move, 'partialTrap'), `${move} should trap the foe`);
    });
  }

  it('Encore locks the foe into its last move', async () => {
    assert.ok(await foeGets('Encore', 'encore', { slow: true }), 'Encore should set encore on the foe');
  });
});
