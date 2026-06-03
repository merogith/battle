// DRAFT — fills for DOOM / disruption status moves (perish, bond, trap-on-use,
// reflect-status, curse). Promote per the workflow.
// Setup-shape: one runTurn; assert the volatile/stage outcome. Curse branches on
// the user's type — a Ghost user pays HP and curses the foe; a non-Ghost user gets
// the +Atk/+Def/-Spe stat package instead.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function cast(move, { atk = 'Mew' } = {}) {
  const a = mkMon({ species: atk, ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const aHp = a.currentHp;
  await runTurn({ playerMon: a, foeMon: d });
  return { a, d, aHpDelta: a.currentHp - aHp };
}

describe('Doom / disruption moves (draft fills)', () => {
  it('Perish Song sets a perish count on both sides', async () => {
    const { a, d } = await cast('Perish Song');
    assert.equal(a.volatile.perishCount, 3);
    assert.equal(d.volatile.perishCount, 3);
  });

  for (const [move, flag] of [
    ['Destiny Bond', 'destinyBond'],
    ['Imprison', 'imprisoned'],
    ['Magic Coat', 'magicCoat'],
    ['Snatch', 'snatch'],
  ]) {
    it(`${move} sets ${flag} on the user`, async () => {
      assert.ok((await cast(move)).a.volatile[flag], `${move} should set ${flag}`);
    });
  }

  it('Curse from a non-Ghost raises Atk/Def and lowers Speed', async () => {
    const { a } = await cast('Curse'); // Mew is Psychic
    assert.equal(a.stages.atk, 1);
    assert.equal(a.stages.def, 1);
    assert.equal(a.stages.spe, -1);
  });
  it('Curse from a Ghost costs the user HP and curses the foe', async () => {
    const { d, aHpDelta } = await cast('Curse', { atk: 'Gengar' });
    assert.ok(aHpDelta < 0, 'Ghost Curse should cost the user HP');
    assert.ok(d.volatile.cursed, 'Ghost Curse should curse the foe');
  });
});
