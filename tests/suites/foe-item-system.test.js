// Phase 2 — enemy trainer item system. Locks the city×trainer-role "kit tier" model and
// the rewritten use-AI so a future edit can't silently regress it:
//   - tier gating: fodder never carries, anchors (Gym Leader/Rival) ramp 0→1→2→3, bosses top out,
//   - the featured/Ultra tier enters at City 7,
//   - signature: marquee bosses (Champion/Mystery) get an INSTANT Mega heal ('instant' — foe still
//     attacks), other tier-3 get an Ultra +4 buff,
//   - the use-AI: HP-threshold + probability roll + HARD per-battle cap (anti-spam),
//   - status-cure only when it matters (not a burn at 95% HP),
//   - regen Potions set bagRegen on the foe; X-items are early-turn setup only.
// RNG is overridden per test for determinism (the live engine uses seeded storyRngNext).
// Run: node --test tests/suites/foe-item-system.test.js

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let E;
before(async () => { E = await loadEngine(); });

const ST = () => E.window.__storyTest;

// Configure module state so window.tryFoeStoryBattleItem() runs against a crafted inventory.
function foeSetup({ hpPct = 1.0, status = null, inv = {}, turnNumber = 5, rng = 0, species = 'Snorlax', party = null } = {}) {
  const { engine, mkMon, reset } = E;
  reset();
  const foe = mkMon({ species, ability: 'None', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  foe.currentHp = Math.max(1, Math.round(foe.maxHp * hpPct));
  foe.status = status;
  engine.state.mode = 'story';
  engine.state.fActive = foe;
  engine.state.foeParty = party || [foe];
  engine.state.pActive = mkMon({ species: 'Pikachu', ability: 'None', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  engine.state.playerParty = [engine.state.pActive];
  engine.state.turnNumber = turnNumber;
  engine.state.isOver = false;
  engine.state.foeStoryItemUsedThisTurn = false;
  engine.state.foeStoryItemUsesThisBattle = 0;
  engine.state.foeStoryInv = Object.assign(
    { superPotion: 0, hyperPotion: 0, maxPotion: 0, fullRestore: 0, fullHeal: 0, revive: 0, maxRevive: 0, xItem: 0, signature: null, tier: 1, role: 1, maxUsesPerBattle: 1 },
    inv
  );
  E.window.settings.storyBattleItems = true;
  E.window.storyRngNext = (typeof rng === 'function') ? rng : (() => rng);
  return { foe };
}

describe('Enemy kit tiers (city × trainer role)', () => {
  it('roles: bosses=2, anchors=1, fodder=0', () => {
    const r = ST().foeItemRole;
    for (const e of ['Champion', 'Mystery Figure', 'E1', 'E4']) assert.equal(r(e), 2, e);
    for (const e of ['Gym Leader 1', 'Gym Leader 8', 'Rival']) assert.equal(r(e), 1, e);
    for (const e of ['Basic Trainer', 'Gym Trainer', 'Elite Trainer', 'Victory Road']) assert.equal(r(e), 0, e);
  });

  it('fodder never carries; bosses always tier 3', () => {
    const t = ST().foeConsumableTier;
    for (let c = 0; c <= 9; c++) assert.equal(t('Basic Trainer', c), 0, 'fodder c' + c);
    for (let c = 0; c <= 9; c++) assert.equal(t('Champion', c), 3, 'boss c' + c);
  });

  it('Gym Leader kit ramps 0→1→2→3 across the gyms; featured tier at C7+', () => {
    const t = ST().foeConsumableTier;
    assert.equal(t('Gym Leader 1', 1), 0, 'Gym 1-2 stays clean');
    assert.equal(t('Gym Leader 2', 2), 0);
    assert.equal(t('Gym Leader 3', 3), 1, 'Gym 3-4 one regen Potion');
    assert.equal(t('Gym Leader 4', 4), 1);
    assert.equal(t('Gym Leader 5', 5), 2, 'Gym 5-6 regen + X-item');
    assert.equal(t('Gym Leader 6', 6), 2);
    assert.equal(t('Gym Leader 7', 7), 3, 'Gym 7-8 featured/Ultra tier');
    assert.equal(t('Gym Leader 8', 8), 3);
  });

  it('signature: marquee bosses instant-heal, other tier-3 Ultra buff, sub-tier-3 none', () => {
    const s = ST().foeSignatureItem;
    // The object comes from the jsdom realm — compare by value, not deepStrictEqual (cross-realm prototype).
    const sig = (e, t) => { const o = s(e, t); return o ? o.kind + '/' + o.instant : String(o); };
    assert.equal(sig('Champion', 3), 'heal/true', 'Champion → instant Mega heal');
    assert.equal(sig('Mystery Figure', 3), 'heal/true', 'Mystery → instant Mega heal');
    assert.equal(sig('E4', 3), 'buff/false', 'E4 → Ultra buff (costs turn)');
    assert.equal(sig('Gym Leader 8', 3), 'buff/false', 'late Gym Leader → Ultra buff');
    assert.equal(sig('Gym Leader 5', 2), 'null', 'sub-tier-3 → no signature');
  });
});

describe('Foe item-use AI', () => {
  it('per-battle cap blocks further item use even with items remaining', () => {
    foeSetup({ hpPct: 0.20, inv: { superPotion: 2, tier: 1, maxUsesPerBattle: 1 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), true, 'first heal used');
    assert.equal(E.engine.state.foeStoryItemUsesThisBattle, 1, 'use counted');
    E.engine.state.foeStoryItemUsedThisTurn = false; // simulate next turn — cap is per-BATTLE
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'cap reached → no second item');
    assert.equal(E.engine.state.foeStoryInv.superPotion, 1, 'the spare Super Potion is untouched');
  });

  it('heals below the tier threshold, not above', () => {
    foeSetup({ hpPct: 0.50, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'no heal at 50% (above the 35% tier-1 threshold)');
    foeSetup({ hpPct: 0.30, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), true, 'heals at 30%');
    const br = E.engine.state.fActive.volatile.bagRegen;
    assert.ok(br, 'Super Potion set regen on the foe');
    assert.equal(br.pct, E.window.BAG_REGEN_PCT.super, 'Super Potion = BAG_REGEN_PCT.super (17.5%) per turn');
  });

  it('the probability roll can decline an item even below threshold', () => {
    foeSetup({ hpPct: 0.20, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 }, rng: 0.99 });
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'USE_ROLL failed → no heal (never robotic)');
  });

  it('cures status only when it matters', () => {
    foeSetup({ hpPct: 0.95, status: 'BRN', inv: { fullHeal: 1, tier: 3, maxUsesPerBattle: 3 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'a burn at 95% HP is not worth a whole turn');
    foeSetup({ hpPct: 0.95, status: 'SLP', inv: { fullHeal: 1, tier: 3, maxUsesPerBattle: 3 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), true, 'sleep is cured even at high HP');
    assert.equal(E.engine.state.fActive.status, null, 'status cleared');
  });

  it('marquee signature is an INSTANT Mega heal (returns "instant" so the foe still attacks)', () => {
    foeSetup({ hpPct: 0.40, inv: { signature: { kind: 'heal', instant: true }, maxPotion: 1, fullHeal: 1, tier: 3, maxUsesPerBattle: 3 }, rng: 0 });
    const r = ST().tryFoeStoryBattleItem();
    assert.equal(r, 'instant', 'instant → the call site does NOT pass the foe turn');
    assert.equal(E.engine.state.fActive.currentHp, E.engine.state.fActive.maxHp, 'fully healed');
    assert.equal(E.engine.state.foeStoryInv.signature, null, 'signature consumed (once per battle)');
  });

  it('non-marquee tier-3 signature is an Ultra X-item (+4 offense, costs the turn)', () => {
    foeSetup({ hpPct: 0.85, turnNumber: 1, inv: { signature: { kind: 'buff', instant: false }, maxPotion: 1, tier: 3, maxUsesPerBattle: 3 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), true, 'costs the turn (not instant)');
    const st = E.engine.state.fActive.stages;
    assert.ok((st.atk | 0) >= 4 || (st.spa | 0) >= 4, 'a +4 offense surge landed');
  });

  it('uses an X-item as early-turn setup while healthy — but not late', () => {
    foeSetup({ hpPct: 0.85, turnNumber: 1, inv: { xItem: 1, hyperPotion: 1, tier: 2, maxUsesPerBattle: 2 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), true, 'X-item used early while healthy');
    const st = E.engine.state.fActive.stages;
    assert.ok((st.spe | 0) >= 2 || (st.atk | 0) >= 2 || (st.spa | 0) >= 2, 'a +2 stat surge landed');
    assert.equal(E.engine.state.foeStoryInv.xItem, 0, 'X-item consumed');

    foeSetup({ hpPct: 0.85, turnNumber: 5, inv: { xItem: 1, tier: 2, maxUsesPerBattle: 2 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'no setup past the early-turn window');
  });

  it('an empty / tier-0 bag never acts', () => {
    foeSetup({ hpPct: 0.10, inv: { tier: 0, maxUsesPerBattle: 0 }, rng: 0 });
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'fodder with no kit does nothing');
  });
});
