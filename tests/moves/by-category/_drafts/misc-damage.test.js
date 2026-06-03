// DRAFT — fills for the MISC-DAMAGE stragglers (self-KO, friendship, item,
// user-type, terrain, sleep). Promote per the test-coverage-filler workflow.
//
// Setup-shape varies per sub-group, but each is one runTurn:
//   self-KO  — damages foe + faints the user (Mind Blown only costs half HP)
//   friendship — Return/Frustration/etc. just deal damage at the harness default
//   item     — Fling / Natural Gift fail with no held item, connect with one
//   user-type — Burn Up needs a Fire-type user (fails from non-Fire); Double Shock Electric
//   terrain/sleep — Steel Roller / Snore fail without their precondition
//
// Closes every physical+special damage todo EXCEPT Comeuppance, which is left as
// it.todo because it currently reflects 0 (see findings — twin Metal Burst works).
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

async function fire(move, { atk = 'Mew', def = 'Sceptile', item = null, status = null } = {}) {
  const a = mkMon({ species: atk, ability: 'None', item, moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: def, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  if (status) a.status = status;
  const before = d.currentHp;
  await runTurn({ playerMon: a, foeMon: d });
  return { dealt: before - d.currentHp, attacker: a };
}

describe('Misc-damage moves (draft fills)', () => {
  // ── self-KO: damage the foe and faint the user ──
  for (const m of ['Explosion', 'Self-Destruct', 'Misty Explosion']) {
    it(`${m} damages the foe and faints the user`, async () => {
      const r = await fire(m, { def: 'Blissey' });
      assert.ok(r.dealt > 0, `${m} should damage the foe`);
      assert.equal(r.attacker.currentHp, 0, `${m} should faint the user`);
    });
  }
  it('Mind Blown damages the foe and costs the user half its HP', async () => {
    const r = await fire('Mind Blown', { def: 'Blissey' });
    assert.ok(r.dealt > 0, 'Mind Blown should damage the foe');
    assert.ok(r.attacker.currentHp > 0 && r.attacker.currentHp <= Math.ceil(r.attacker.maxHp / 2),
      'Mind Blown should cost ~half the user HP without fainting it');
  });

  // ── friendship-based power: deal damage at the harness default ──
  for (const m of ['Return', 'Frustration', 'Veevee Volley', 'Pika Papow']) {
    it(`${m} deals damage`, async () => {
      assert.ok((await fire(m)).dealt > 0, `${m} should deal damage`);
    });
  }

  // ── item-based: fail with no held item, connect with one ──
  it('Fling fails with no item and connects with a held item', async () => {
    assert.equal((await fire('Fling')).dealt, 0, 'Fling should fail with no held item');
    assert.ok((await fire('Fling', { item: 'Iron Ball' })).dealt > 0, 'Fling should connect holding Iron Ball');
  });
  it('Natural Gift fails with no Berry and connects with one', async () => {
    assert.equal((await fire('Natural Gift')).dealt, 0, 'Natural Gift should fail with no Berry');
    assert.ok((await fire('Natural Gift', { item: 'Cheri Berry' })).dealt > 0, 'Natural Gift should connect holding a Berry');
  });

  // ── user-type requirement ──
  it('Burn Up connects from a Fire-type and fails from a non-Fire-type', async () => {
    assert.ok((await fire('Burn Up', { atk: 'Charizard' })).dealt > 0, 'Burn Up should connect from a Fire-type');
    assert.equal((await fire('Burn Up', { atk: 'Mew' })).dealt, 0, 'Burn Up should fail from a non-Fire-type');
  });
  it('Double Shock connects from an Electric-type', async () => {
    assert.ok((await fire('Double Shock', { atk: 'Pikachu' })).dealt > 0, 'Double Shock should connect from an Electric-type');
  });

  // ── terrain / sleep preconditions ──
  it('Steel Roller fails with no terrain active', async () => {
    assert.equal((await fire('Steel Roller')).dealt, 0, 'Steel Roller should fail with no terrain');
  });
  it('Ice Spinner deals damage', async () => {
    assert.ok((await fire('Ice Spinner')).dealt > 0, 'Ice Spinner should deal damage');
  });
  it('Snore fails while the user is awake', async () => {
    assert.equal((await fire('Snore')).dealt, 0, 'Snore should fail unless the user is asleep');
  });
});
