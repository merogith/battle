// DRAFT — fills for the FIELD-ROOM / Gravity moves. Promote per the workflow.
// Setup-shape: one runTurn; assert the global counter on engine.state (=turns left).
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

async function room(move) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  await runTurn({ playerMon: a, foeMon: d });
  return engine.state;
}

describe('Field-room moves (draft fills)', () => {
  for (const [move, flag] of [
    ['Trick Room', 'trickRoom'],
    ['Gravity', 'gravity'],
    ['Magic Room', 'magicRoom'],
    ['Wonder Room', 'wonderRoom'],
  ]) {
    it(`${move} sets the ${flag} field counter`, async () => {
      assert.ok((await room(move))[flag] > 0, `${move} should set state.${flag}`);
    });
  }
});
