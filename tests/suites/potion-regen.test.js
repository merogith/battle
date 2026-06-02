// Repurposed Potion line — HP-regen over 3 turns (replaces the dead flat heals; Max Potion
// and Full Restore already own the instant-full niche). Locks the behaviour so a future edit
// can't silently regress it:
//   - the static %-of-maxHP tick (Potion 1/16 · Super 1/8 · Hyper 1/4 — tiers double),
//   - the 3-turn duration + clean expiry,
//   - clear-on-switch (cannot be "banked" by switching out — mirrors Aqua Ring),
//   - the catalog: regen effect strings, Ether/Elixir cut, Max Elixir kept,
//   - Ultra Ball offered only in the dept featured pool (1500G), isolated from the battle/city bag.
// Run: node --test tests/suites/potion-regen.test.js

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let E;
before(async () => { E = await loadEngine(); });

// One active mon (pinned fast, Splash-only so nothing else perturbs HP), a bench mon for the
// switch test, and a passive Splash foe. Both sides do nothing, so the only HP delta per turn
// is the regen tick under test.
function setup({ pSpecies = 'Snorlax', benchSpecies = 'Blissey', foeSpecies = 'Pikachu' } = {}) {
  const { engine, mkMon, reset } = E;
  reset();
  const splash = ['Splash', 'Splash', 'Splash', 'Splash'];
  const a = mkMon({ species: pSpecies, ability: 'None', moves: splash });
  const b = mkMon({ species: benchSpecies, ability: 'None', moves: splash });
  const foe = mkMon({ species: foeSpecies, ability: 'None', moves: splash });
  a.stats.spe = 999; // player always moves first; irrelevant for Splash but keeps order fixed
  engine.state.mode = 'pve';
  engine.state.playerParty = [a, b];
  engine.state.foeParty = [foe];
  engine.state.pActive = a;
  engine.state.fActive = foe;
  engine.state.isOver = false;
  engine.state.isLocked = false;
  engine.setForcedFoeMoveSlot(0);
  return { a, b, foe };
}

describe('Potion-line HP-regen (repurposed)', () => {
  for (const { tier, pct } of [
    { tier: 'Potion (1/16)', pct: 1 / 16 },
    { tier: 'Super Potion (1/8)', pct: 1 / 8 },
    { tier: 'Hyper Potion (1/4)', pct: 1 / 4 },
  ]) {
    it(`${tier} heals floor(maxHP * pct) each turn for 3 turns, then expires`, async () => {
      const { a } = setup();
      const max = a.maxHp;
      a.currentHp = Math.max(1, Math.floor(max * 0.05)); // heavily damaged so every tick has room
      a.volatile.bagRegen = { pct, turns: 3 };
      const per = Math.max(1, Math.floor(max * pct));
      let prev = a.currentHp;
      for (let t = 1; t <= 3; t++) {
        await E.window.playTurn(0, null); // both Splash
        assert.equal(a.currentHp, Math.min(max, prev + per), `${tier}: turn ${t} tick`);
        assert.equal(a.volatile.bagRegen ? a.volatile.bagRegen.turns : 0, 3 - t, `${tier}: ${3 - t} turns left`);
        prev = a.currentHp;
      }
      assert.equal(a.volatile.bagRegen, null, `${tier}: volatile cleared after 3 ticks`);
      const before = a.currentHp;
      await E.window.playTurn(0, null);
      assert.equal(a.currentHp, before, `${tier}: no healing once expired`);
    });
  }

  it('never over-heals past max HP', async () => {
    const { a } = setup();
    a.currentHp = a.maxHp - 1;
    a.volatile.bagRegen = { pct: 1 / 4, turns: 3 };
    await E.window.playTurn(0, null);
    assert.equal(a.currentHp, a.maxHp, 'tick is clamped to max HP');
  });

  it('clears on switch-out so it cannot be banked (mirrors Aqua Ring)', async () => {
    const { a } = setup();
    a.currentHp = Math.floor(a.maxHp * 0.5);
    a.volatile.bagRegen = { pct: 1 / 8, turns: 3 };
    await E.window.playTurn(null, 1); // switch a -> bench
    assert.notEqual(E.engine.state.pActive.name, a.name, 'switch happened');
    assert.equal(a.volatile.bagRegen, null, 'bagRegen cleared on the benched mon');
  });
});

describe('Item catalog after the overhaul', () => {
  it('Potion line carries regen effects; Ether/Elixir cut; Max Elixir kept', () => {
    const byId = new Map((E.window.POKEMART_ITEMS || []).map((i) => [i.id, i]));
    assert.equal(byId.get('potion')?.effect, 'regen16');
    assert.equal(byId.get('superPotion')?.effect, 'regen8');
    assert.equal(byId.get('hyperPotion')?.effect, 'regen4');
    assert.equal(byId.has('ether'), false, 'Ether cut');
    assert.equal(byId.has('elixir'), false, 'Elixir cut');
    assert.equal(byId.get('maxElixir')?.effect, 'elixirFull', 'Max Elixir kept');
  });

  it('Ultra Ball is sold only in the dept featured pool (1500G), never the shared bag pool', () => {
    const ST = E.window.__storyTest;
    const base = ST.getStoryFeaturedItems();
    assert.equal(base.some((i) => i.id === 'ultra_ball'), false,
      'Ultra Ball must NOT be in the shared featured generator (it would leak into the battle/city bag)');
    const dept = ST.getDeptFeaturedCatalogItems();
    const ub = dept.find((i) => i.id === 'ultra_ball');
    assert.ok(ub, 'Ultra Ball is offered in the dept featured catalog');
    assert.equal(ub.price, 1500, 'Ultra Ball costs 1500G');
    assert.equal(ub.kind, 'ball', 'routes as a ball (kind=ball)');
    assert.equal(ub.ballKey, 'ultra', 'into sm.balls.ultra');
  });
});
