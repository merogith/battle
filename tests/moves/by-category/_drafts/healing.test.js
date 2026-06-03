// DRAFT — fills for the HEALING cluster (moves that restore the user's HP).
// Promote per the test-coverage-filler workflow.
//
// Setup-shape: drop the user to half HP, use the move, assert HP went up. Rest also
// sleeps the user; Wish heals on the FOLLOWING turn (driven via playTurn, no reset).
// Aqua Ring / Ingrain heal a small end-of-turn tick the turn they're set.
//
// Excluded (ally/target heals — no-op in singles, heal 0 here): Heal Pulse,
// Floral Healing. Also excluded: Lunar Dance / Healing Wish / Revival Blessing
// (require a fainted teammate / switch).
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

async function heal(move, selfHpFrac = 0.5) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  a.currentHp = Math.round(a.maxHp * selfHpFrac);
  const before = a.currentHp;
  await runTurn({ playerMon: a, foeMon: d });
  return { delta: a.currentHp - before, status: a.status };
}

describe('Healing moves (draft fills)', () => {
  for (const move of [
    'Recover', 'Roost', 'Soft-Boiled', 'Synthesis', 'Slack Off', 'Milk Drink',
    'Moonlight', 'Morning Sun', 'Shore Up', 'Heal Order', 'Life Dew', 'Jungle Healing',
    'Lunar Blessing', 'Strength Sap', 'Pain Split', 'Aqua Ring', 'Ingrain',
  ]) {
    it(`${move} restores the user's HP`, async () => {
      assert.ok((await heal(move)).delta > 0, `${move} should heal the user`);
    });
  }

  it('Rest heals the user and puts it to sleep', async () => {
    const r = await heal('Rest', 0.3);
    assert.ok(r.delta > 0, 'Rest should heal the user');
    assert.equal(r.status, 'SLP', 'Rest should put the user to sleep');
  });

  it('Wish heals on the following turn', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Wish', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a.currentHp = Math.round(a.maxHp * 0.5);
    const before = a.currentHp;
    await runTurn({ playerMon: a, foeMon: d });          // T1: Wish queued, no heal yet
    assert.equal(a.currentHp, before, 'Wish should not heal on the turn it is used');
    engine.setForcedFoeMoveSlot(1);
    await window.playTurn(1, null);                       // T2: Wish resolves
    assert.ok(a.currentHp > before, 'Wish should heal on the following turn');
  });
});
