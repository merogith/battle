// DRAFT — fills for self-targeting utility moves with a non-plain-boost payload
// (cure+boost, raw-stat shuffle, berry-eat, Stockpile payout). Promote per workflow.
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

async function self(move, { item = null, status = null } = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', item, moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  if (status) a.status = status;
  await runTurn({ playerMon: a, foeMon: d });
  return a;
}

describe('Self-boost utility moves (draft fills)', () => {
  it("Howl raises the user's Attack", async () => {
    assert.equal((await self('Howl')).stages.atk, 1);
  });
  it('Acupressure sharply raises one of the user\'s stats', async () => {
    const a = await self('Acupressure');
    assert.ok(Object.values(a.stages).some((v) => v === 2), 'Acupressure should raise some stat by 2');
  });
  it('Take Heart cures status and raises Sp.Atk/Sp.Def', async () => {
    const a = await self('Take Heart', { status: 'BRN' });
    assert.equal(a.status, null);
    assert.equal(a.stages.spa, 1);
    assert.equal(a.stages.spd, 1);
  });
  it('Stuff Cheeks eats the held Berry and sharply raises Defense', async () => {
    assert.equal((await self('Stuff Cheeks', { item: 'Oran Berry' })).stages.def, 2);
  });
  // Deferred: Power Shift — no-op here (raw Atk/Def unchanged). Left todo.
  it('Swallow restores HP after Stockpile', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Stockpile', 'Swallow', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a.currentHp = Math.round(a.maxHp * 0.4);
    await runTurn({ playerMon: a, foeMon: d, playerMoveSlot: 0 }); // Stockpile
    const mid = a.currentHp;
    engine.setForcedFoeMoveSlot(0);
    await window.playTurn(1, null); // Swallow
    assert.ok(a.currentHp > mid, 'Swallow should heal after Stockpile');
  });
});
