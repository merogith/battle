// DRAFT — fills for status-transfer / condition moves + the Sport field moves.
// Promote per the workflow.
//
// Setup-shapes: Psycho Shift needs the user pre-statused; Conversion 2 and Spite
// need the foe to have moved first (user made slower); the Sports set a global flag.
//
// Deferred (no observable effect in the harness): Purify, Venom Drench, Ion Deluge.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn, engine;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
  engine = e.engine;
});

async function use(move, { selfStatus = null, slow = false } = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
  if (selfStatus) a.status = selfStatus;
  if (slow) d.stats.spe = 999;
  await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0, forcePlayerFast: !slow });
  return { a, d };
}

describe('Condition / sport moves (draft fills)', () => {
  it('Psycho Shift transfers the user\'s status to the foe', async () => {
    const { a, d } = await use('Psycho Shift', { selfStatus: 'BRN' });
    assert.equal(d.status, 'BRN', 'foe should receive the burn');
    assert.equal(a.status, null, 'user should be cured');
  });

  it('Grudge sets the grudge volatile on the user', async () => {
    assert.ok((await use('Grudge')).a.volatile.grudge);
  });

  it('Conversion 2 retypes the user to resist the foe\'s last move', async () => {
    // foe used Tackle (Normal); Ghost is immune to Normal
    assert.equal((await use('Conversion 2', { slow: true })).a.type1, 'Ghost');
  });

  it('Spite drains PP from the foe\'s last move', async () => {
    const a = mkMon({ species: 'Mew', ability: 'None', moves: ['Spite', 'Splash', 'Splash', 'Splash'] });
    const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    d.stats.spe = 999; // foe moves first
    const ppBefore = d.moves[0].pp;
    await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0, forcePlayerFast: false });
    assert.ok(ppBefore - d.moves[0].pp > 1, 'Spite should remove more PP than the single use');
  });

  it('Mud Sport sets the mudSport field', async () => {
    await use('Mud Sport');
    assert.ok(engine.state.mudSport > 0);
  });
  it('Water Sport sets the waterSport field', async () => {
    await use('Water Sport');
    assert.ok(engine.state.waterSport > 0);
  });
});
