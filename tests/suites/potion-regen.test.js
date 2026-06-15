// Repurposed Potion line — instant heal + HP-regen (replaces the dead flat heals; Max Potion
// and Full Restore already own the instant-full niche). Locks the behaviour so a future edit
// can't silently regress it:
//   - each potion heals %-of-maxHP INSTANTLY on use, then the same % at end of the next 2 turns
//     (3 portions; the instant one means you don't have to survive a round to benefit),
//   - per-portion % (Potion 12% · Super 24% · Hyper 48% — tiers double; values live in BAG_REGEN_PCT),
//   - the 2-turn lingering regen + clean expiry,
//   - clear-on-switch (cannot be "banked" by switching out — mirrors Aqua Ring),
//   - NO STACKING: one mist per mon, the STRONGEST active pct wins and re-applying refreshes
//     the window (a weaker potion can never downgrade a stronger active one); the instant heal
//     always uses the just-used potion's own pct,
//   - player (applyBagItem) and foe item AI both heal off the SAME BAG_REGEN_PCT via applyBagRegen,
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
    { tier: 'Potion (12%)', pct: 0.12 },
    { tier: 'Super Potion (24%)', pct: 0.24 },
    { tier: 'Hyper Potion (48%)', pct: 0.48 },
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

describe('Per-portion values + instant heal + no-stacking (BAG_REGEN_PCT / applyBagRegen)', () => {
  it('per-portion pcts are 12/24/48 and still double per tier', () => {
    const P = E.window.BAG_REGEN_PCT;
    assert.equal(P.potion, 0.12, 'Potion 12%/portion');
    assert.equal(P.super, 0.24, 'Super 24%/portion');
    assert.equal(P.hyper, 0.48, 'Hyper 48%/portion');
    assert.equal(P.super, P.potion * 2, 'Super doubles Potion');
    assert.equal(P.hyper, P.super * 2, 'Hyper doubles Super');
  });

  it('heals instantly on use (front-loaded) and arms a 2-turn lingering regen', () => {
    const mon = { maxHp: 200, currentHp: 50, volatile: {} };
    const r = E.window.applyBagRegen(mon, E.window.BAG_REGEN_PCT.hyper); // 48% of 200 = 96
    assert.equal(r.instant, 96, 'instant heal = floor(maxHp * pct)');
    assert.equal(mon.currentHp, 146, 'HP went up immediately, no surviving required');
    assert.equal(mon.volatile.bagRegen.turns, 2, 'lingering regen ticks for 2 more turns');
    assert.equal(mon.volatile.bagRegen.pct, 0.48, 'lingering pct matches the potion');
  });

  it('instant heal clamps to max and is skipped at full HP', () => {
    const mon = { maxHp: 100, currentHp: 90, volatile: {} };
    const r = E.window.applyBagRegen(mon, E.window.BAG_REGEN_PCT.hyper); // would be 48, clamped to 10
    assert.equal(r.instant, 10, 'instant clamped to the missing HP');
    assert.equal(mon.currentHp, 100, 'never over-heals');
    const full = { maxHp: 100, currentHp: 100, volatile: {} };
    assert.equal(E.window.applyBagRegen(full, E.window.BAG_REGEN_PCT.potion).instant, 0, 'no instant at full');
  });

  it('does not stack: a weaker potion cannot downgrade a stronger active mist (strongest wins)', () => {
    const mon = { maxHp: 200, currentHp: 100, volatile: {} };
    E.window.applyBagRegen(mon, E.window.BAG_REGEN_PCT.hyper); // Hyper first
    mon.volatile.bagRegen.turns = 1;                            // partially elapsed
    mon.currentHp = 100;                                        // re-damaged so the next instant has room
    const after = E.window.applyBagRegen(mon, E.window.BAG_REGEN_PCT.potion); // Potion over it
    assert.equal(after.pct, 0.48, 'lingering slot kept the stronger Hyper pct');
    assert.equal(after.instant, 24, 'instant heal uses the just-used Potion pct (12% of 200)');
    assert.equal(mon.volatile.bagRegen.turns, 2, 're-applying refreshed the window');
  });

  it('a stronger potion upgrades a weaker active mist', () => {
    const mon = { maxHp: 200, currentHp: 100, volatile: {} };
    E.window.applyBagRegen(mon, E.window.BAG_REGEN_PCT.potion); // Potion first
    const after = E.window.applyBagRegen(mon, E.window.BAG_REGEN_PCT.hyper); // Hyper over it
    assert.equal(after.pct, 0.48, 'lingering slot upgraded to Hyper pct');
    assert.equal(mon.volatile.bagRegen.turns, 2, 'fresh window');
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
