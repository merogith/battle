// DRAFT — fills for MOVE-COPY / move-calling status moves + Bestow. Promote per workflow.
//
// Setup-shapes: Transform copies the target outright; Mimic/Sketch need the foe to
// have moved (user made slower); Metronome calls a random move (assert it called
// *something*, not itself); Bestow hands the user's item to the foe.
//
// Deferred (no-op here): Assist, Instruct, Sleep Talk.
// (Copycat / Mirror Move / Me First / Nature Power now dispatch the real move via
//  performAction — the copied damaging move actually lands; asserted below.)
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let mkMon, runTurn;
before(async () => {
  const e = await loadEngine();
  mkMon = e.mkMon;
  runTurn = e.runTurn;
});

const moveNames = (m) => (m.moves || []).map((x) => (typeof x === 'string' ? x : (x && x.name) || '?'));

async function use(move, { slow = false, item = null } = {}) {
  const a = mkMon({ species: 'Mew', ability: 'None', item, moves: [move, 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', ability: 'None', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
  if (slow) d.stats.spe = 999;
  await runTurn({ playerMon: a, foeMon: d, foeMoveSlot: 0, forcePlayerFast: !slow });
  return { a, d };
}

describe('Move-copy / calling moves (draft fills)', () => {
  it("Transform copies the target's type and moves", async () => {
    const { a } = await use('Transform');
    assert.equal(a.type1, 'Normal', 'Transform should copy Snorlax\'s Normal typing');
    assert.ok(moveNames(a).includes('Tackle'), 'Transform should copy the target\'s moves');
  });
  it("Mimic copies the foe's last move into the user's set", async () => {
    const { a } = await use('Mimic', { slow: true });
    assert.ok(moveNames(a).includes('Tackle'), 'Mimic should replace its slot with Tackle');
  });
  it("Sketch copies the foe's last move into the user's set", async () => {
    const { a } = await use('Sketch', { slow: true });
    assert.ok(moveNames(a).includes('Tackle'), 'Sketch should replace its slot with Tackle');
  });
  it('Metronome calls another move', async () => {
    const { a } = await use('Metronome');
    assert.ok(a.volatile.lastMoveUsed, 'Metronome should record a called move');
    assert.notEqual(a.volatile.lastMoveUsed, 'Metronome', 'Metronome should call a move other than itself');
  });
  it("Bestow hands the user's held item to the foe", async () => {
    const { a, d } = await use('Bestow', { item: 'Oran Berry' });
    assert.equal(a.item, null, 'Bestow should give away the user\'s item');
    assert.equal(d.item, 'Oran Berry', 'the foe should receive the item');
  });
  it('Copycat copies and actually uses the last damaging move', async () => {
    const { d } = await use('Copycat', { slow: true }); // foe Tackles first; Copycat copies Tackle
    assert.ok(d.currentHp < d.maxHp, 'Copycat should deal damage with the copied move');
  });
  it("Mirror Move copies and uses the foe's last damaging move", async () => {
    const { d } = await use('Mirror Move', { slow: true });
    assert.ok(d.currentHp < d.maxHp, 'Mirror Move should deal damage with the copied move');
  });
  it("Me First copies and uses the foe's queued damaging move", async () => {
    const { d } = await use('Me First'); // player faster; copies the foe's queued Tackle
    assert.ok(d.currentHp < d.maxHp, 'Me First should deal damage with the copied move');
  });
  it('Nature Power becomes a damaging move (Tri Attack with no terrain)', async () => {
    const { d } = await use('Nature Power');
    assert.ok(d.currentHp < d.maxHp, 'Nature Power should deal damage as Tri Attack');
  });
});
