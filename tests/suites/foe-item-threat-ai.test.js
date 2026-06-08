// Phase 3 — threat-aware foe item AI. Locks the incoming-damage gates layered onto
// tryFoeStoryBattleItem so a future edit can't silently regress them:
//   - regen-over-time potions fire ONLY vs chip damage the regen can out-pace AND when the
//     mon survives the hit (kills the "I attack → foe heals → I attack → foe heals…" stall),
//   - instant heals (Max Potion / signature Mega) still fire vs bigger hits (they reset first),
//   - setup/boost items only when the mon isn't being 2HKO'd (no "X-Attack then faint"),
//   - a lethal short-circuit: if the foe could just KO the player this turn, it attacks.
// Incoming damage is engineered via explicit atk/def/maxHp + move power so the thresholds are
// exact and balance-proof. The two multi-turn sims at the bottom are the self-proving harness:
// they step the REAL decision fn across turns and assert the philosophy holds (no stall; sustain
// still works for chip). RNG is overridden per test for determinism.
// Run: node --test tests/suites/foe-item-threat-ai.test.js

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let E;
before(async () => { E = await loadEngine(); });

const ST = () => E.window.__storyTest;

// Engineer the player's expected incoming damage on the foe to a known fraction of maxHp.
// With a Normal move (no STAB for an Electric player) at neutral effectiveness:
//   dmg ≈ ((22 * pow * ATK/DEF)/50 + 2) * avgRoll(0.925).  With ATK=200, DEF=100, maxHp=200:
//   pow 24 → inc ≈ 0.107 (chip) · pow 120 → inc ≈ 0.498 (heavy) · pow 300 → inc ≈ 1.23 (OHKO-from-full)
function mk({
  hpPct = 1.0, status = null, inv = {}, turnNumber = 5, rng = 0,
  playerMovePow = 24, foeMaxHp = 200, foeAtk = 60, foeDef = 100, foeSpe = 50,
  playerAtk = 200, playerSpe = 100, playerMaxHp = 400, foeSpecies = 'Snorlax',
} = {}) {
  const { engine, mkMon, reset } = E;
  reset();
  const foe = mkMon({ species: foeSpecies, ability: 'None', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  const player = mkMon({ species: 'Pikachu', ability: 'None', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  // Deterministic stat block — pin everything the damage formula reads.
  foe.maxHp = foeMaxHp; foe.stats.atk = foeAtk; foe.stats.def = foeDef; foe.stats.spe = foeSpe;
  foe.currentHp = Math.max(1, Math.round(foe.maxHp * hpPct));
  foe.status = status; foe.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  player.maxHp = playerMaxHp; player.currentHp = playerMaxHp;
  player.stats.atk = playerAtk; player.stats.spe = playerSpe; player.stats.def = 100;
  player.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  player.moves.forEach(m => { m.pow = playerMovePow; m.type = 'Normal'; m.cat = 'Physical'; m.acc = 100; });

  engine.state.mode = 'story';
  engine.state.fActive = foe; engine.state.foeParty = [foe];
  engine.state.pActive = player; engine.state.playerParty = [player];
  engine.state.turnNumber = turnNumber; engine.state.isOver = false;
  engine.state.weather = null; engine.state.weatherTurns = 0; engine.state.terrain = null; engine.state.terrainTurns = 0;
  engine.state.foeStoryItemUsedThisTurn = false; engine.state.foeStoryItemUsesThisBattle = 0;
  engine.state.foeStoryInv = Object.assign(
    { superPotion: 0, hyperPotion: 0, maxPotion: 0, fullRestore: 0, fullHeal: 0, revive: 0, maxRevive: 0, xItem: 0, signature: null, tier: 1, role: 1, maxUsesPerBattle: 1 },
    inv
  );
  E.window.settings.storyBattleItems = true;
  E.window.storyRngNext = (typeof rng === 'function') ? rng : (() => rng);
  return { foe, player };
}

describe('Incoming-threat estimate', () => {
  it('foeIncomingFrac reads chip vs heavy hits through the real damage estimator', () => {
    mk({ playerMovePow: 24 });
    const chip = ST().foeIncomingFrac(E.engine.state.fActive);
    assert.ok(chip > 0.05 && chip < 0.20, `chip ~0.107, got ${chip.toFixed(3)}`);
    mk({ playerMovePow: 120 });
    const heavy = ST().foeIncomingFrac(E.engine.state.fActive);
    assert.ok(heavy > 0.40 && heavy < 0.60, `heavy ~0.498, got ${heavy.toFixed(3)}`);
  });
});

describe('Heal-stall fix — regen only vs chip the heal can out-pace', () => {
  it('uses a regen Potion at low HP when the player is only chipping', () => {
    mk({ hpPct: 0.30, playerMovePow: 24, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 } });
    assert.equal(ST().tryFoeStoryBattleItem(), true, 'chip damage → sustaining is worth it');
    assert.ok(E.engine.state.fActive.volatile.bagRegen, 'regen set');
  });

  it('does NOT use a regen Potion when the player out-damages the heal (kills the stall loop)', () => {
    mk({ hpPct: 0.30, playerMovePow: 120, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 } });
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'heavy damage → regen can never catch up; attack instead');
    assert.equal(E.engine.state.foeStoryInv.superPotion, 1, 'the Super Potion is not wasted');
  });

  it('does NOT regen when the incoming hit would KO before the end-of-turn tick (Bug B)', () => {
    // chip-sized hit, but the foe is lower than the hit → faints before the regen ever ticks.
    mk({ hpPct: 0.08, playerMovePow: 24, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 } });
    const inc = ST().foeIncomingFrac(E.engine.state.fActive);
    assert.ok(inc > 0.08, `incoming (${inc.toFixed(3)}) exceeds current HP — a regen would be wasted`);
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'no regen into certain death');
  });
});

describe('Instant heals still fire vs bigger hits', () => {
  it('signature Mega heal pops vs a heavy hit (it resets HP before the next hit)', () => {
    mk({ hpPct: 0.40, playerMovePow: 120, inv: { signature: { kind: 'heal', instant: true }, tier: 3, maxUsesPerBattle: 3 } });
    assert.equal(ST().tryFoeStoryBattleItem(), 'instant', 'instant full heal is worth it vs a 50% hit');
    assert.equal(E.engine.state.fActive.currentHp, E.engine.state.fActive.maxHp, 'fully healed');
  });

  it('but skips the instant heal when the player one-shots even from full (pointless churn)', () => {
    mk({ hpPct: 0.40, playerMovePow: 300, inv: { signature: { kind: 'heal', instant: true }, tier: 3, maxUsesPerBattle: 3 } });
    const inc = ST().foeIncomingFrac(E.engine.state.fActive);
    assert.ok(inc >= 1.0, `incoming (${inc.toFixed(3)}) ≥ full HP`);
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'no heal when it changes nothing');
  });
});

describe('Wasted-boost fix — setup only when the boost can pay off (Bug A)', () => {
  it('sets up an X-item when healthy and not in 2HKO range', () => {
    mk({ hpPct: 0.85, turnNumber: 1, playerMovePow: 24, inv: { xItem: 1, tier: 2, maxUsesPerBattle: 2 } });
    assert.equal(ST().tryFoeStoryBattleItem(), true, 'safe to invest a turn in a boost');
  });

  it('does NOT set up when the mon is being 2HKO\'d (boost would never cash in)', () => {
    mk({ hpPct: 0.85, turnNumber: 1, playerMovePow: 120, inv: { xItem: 1, tier: 2, maxUsesPerBattle: 2 } });
    // inc ~0.50 > 0.85*0.5 → fewer than 2 hits survived → boost is wasted tempo.
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'no X-item into a 2HKO');
    assert.equal(E.engine.state.foeStoryInv.xItem, 1, 'the X-item is preserved');
  });
});

describe('Lethal short-circuit — take the KO over spending a turn on an item', () => {
  it('attacks (no item) when it could KO the player this turn and moves first', () => {
    // Foe outspeeds and one-shots the (frail) player; it also holds a heal it could use.
    mk({ hpPct: 0.30, playerMovePow: 24, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 },
         foeAtk: 400, foeSpe: 300, playerSpe: 1, playerMaxHp: 40 });
    assert.equal(ST().foeCanKOPlayerFirst(E.engine.state.fActive), true, 'lethal + faster');
    assert.equal(ST().tryFoeStoryBattleItem(), false, 'takes the KO instead of healing');
    assert.equal(E.engine.state.foeStoryInv.superPotion, 1, 'heal not wasted');
  });

  it('still heals when it CANNOT KO first (no false short-circuit)', () => {
    mk({ hpPct: 0.30, playerMovePow: 24, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 },
         foeAtk: 60, foeSpe: 50, playerSpe: 300, playerMaxHp: 400 });
    assert.equal(ST().foeCanKOPlayerFirst(E.engine.state.fActive), false, 'not lethal');
    assert.equal(ST().tryFoeStoryBattleItem(), true, 'sustains normally');
  });
});

// ── Self-proving multi-turn sims ───────────────────────────────────────────────
// Step the REAL decision fn across turns: each turn the foe may act, then takes the
// player's (deterministic) hit, then the bagRegen ticks exactly as the engine does.
// Invariants prove the philosophy holds over time, not just per-decision.
function simulate({ playerMovePow, hpPct, inv, maxTurns = 12 }) {
  const { foe } = mk({ hpPct, playerMovePow, inv, turnNumber: 1, rng: 0 });
  let regenUses = 0, regenUsedWhileDoomed = 0, turnsSurvived = 0;
  for (let turn = 1; turn <= maxTurns && foe.currentHp > 0; turn++) {
    E.engine.state.turnNumber = turn;
    E.engine.state.foeStoryItemUsedThisTurn = false;
    const incFrac = ST().foeIncomingFrac(foe);
    const survivesNow = incFrac < foe.currentHp / foe.maxHp;
    const regenBefore = !!(foe.volatile && foe.volatile.bagRegen);
    ST().tryFoeStoryBattleItem();
    const regenAfter = !!(foe.volatile && foe.volatile.bagRegen);
    if (!regenBefore && regenAfter) { regenUses++; if (!survivesNow) regenUsedWhileDoomed++; }
    // Player's hit lands.
    foe.currentHp = Math.max(0, foe.currentHp - Math.round(incFrac * foe.maxHp));
    // End-of-turn regen tick (mirrors endOfTurnEffects).
    if (foe.currentHp > 0 && foe.volatile && foe.volatile.bagRegen && foe.volatile.bagRegen.turns > 0) {
      const br = foe.volatile.bagRegen;
      if (foe.currentHp < foe.maxHp) foe.currentHp += Math.min(foe.maxHp - foe.currentHp, Math.max(1, Math.floor(foe.maxHp * br.pct)));
      br.turns--; if (br.turns <= 0) foe.volatile.bagRegen = null;
    }
    if (foe.currentHp > 0) turnsSurvived = turn;
  }
  return { regenUses, regenUsedWhileDoomed, turnsSurvived, finalHp: foe.currentHp };
}

describe('Self-proving sims', () => {
  it('no heal-stall: vs a heavy hitter the foe never stalls and the battle ends fast', () => {
    const r = simulate({ playerMovePow: 120, hpPct: 0.30, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 } });
    assert.equal(r.regenUses, 0, 'never wastes a regen it cannot out-pace');
    assert.ok(r.finalHp === 0 && r.turnsSurvived <= 2, `battle ends promptly, no stall (survived ${r.turnsSurvived})`);
  });

  it('sustain still works: vs chip damage the foe uses its regen and lives longer', () => {
    const chip = simulate({ playerMovePow: 24, hpPct: 0.30, inv: { superPotion: 1, tier: 1, maxUsesPerBattle: 1 } });
    const none = simulate({ playerMovePow: 24, hpPct: 0.30, inv: { tier: 0, maxUsesPerBattle: 0 } });
    assert.equal(chip.regenUses, 1, 'regen used exactly once (per-battle cap)');
    assert.equal(chip.regenUsedWhileDoomed, 0, 'never used into certain death');
    assert.ok(chip.turnsSurvived > none.turnsSurvived, `sustain bought turns (${chip.turnsSurvived} > ${none.turnsSurvived})`);
  });
});
