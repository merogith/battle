// DRAFT — fills for SELF-UTILITY status moves: self-volatiles, status cures, and
// genuine no-ops. Promote per the test-coverage-filler workflow.
//
// Setup-shapes: self-buffs set a volatile (or Belly Drum maxes Attack); cures clear
// a pre-set status on the user; no-ops resolve without damaging/statusing anything.
//
// Deferred (no readable self-volatile here): Laser Focus.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function run(move, { selfStatus = null } = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  if (selfStatus) a.status = selfStatus;
  const foeHp = d.currentHp;
  await runTurn({ playerMon: a, foeMon: d });
  return { self: a, foeDmg: foeHp - d.currentHp, foeStatus: d.status };
}

describe('Self-utility moves (draft fills)', () => {
  // self-volatiles
  for (const [move, flag] of [
    ['Focus Energy', 'focusEnergy'], ['Lock-On', 'lockOn'], ['Mind Reader', 'lockOn'],
    ['Magnet Rise', 'magnetRise'], ['Substitute', 'sub'], ['Stockpile', 'stockpile'],
    ['Power Trick', 'powerTrick'],
  ]) {
    it(`${move} sets ${flag} on the user`, async () => {
      const { self } = await run(move);
      assert.ok(self.volatile && self.volatile[flag], `${move} should set ${flag}`);
    });
  }
  it("Belly Drum maxes the user's Attack", async () => {
    const { self } = await run('Belly Drum');
    assert.equal(self.stages.atk, 6, 'Belly Drum should raise Attack to +6');
  });

  // status cures (user starts burned)
  for (const move of ['Refresh', 'Heal Bell', 'Aromatherapy']) {
    it(`${move} cures the user's status`, async () => {
      const { self } = await run(move, { selfStatus: 'BRN' });
      assert.equal(self.status, null, `${move} should cure the burn`);
    });
  }

  // genuine no-ops: resolve cleanly, no damage, no status
  for (const move of ['Splash', 'Celebrate', 'Happy Hour', 'Hold Hands']) {
    it(`${move} resolves with no effect`, async () => {
      const r = await run(move);
      assert.equal(r.foeDmg, 0, `${move} should not damage`);
      assert.equal(r.foeStatus, null, `${move} should not status the foe`);
    });
  }
});
