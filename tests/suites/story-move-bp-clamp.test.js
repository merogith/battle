// System A (1.6.0) — battle-time per-city BP clamp.
//
// The per-city move cap (40/60/60/80/80/∞) is primarily a tutor/foe POOL filter, but a
// high-BP move can still reach a moveset (heart-scale vouchers, foe signature presets,
// builds.csv, Return's hard-coded 102). This clamp is the hard ceiling at damage time:
// it lowers a move's effective base power to the city cap. Variable-power moves (weight /
// HP / speed / consecutive-use scaling) are EXEMPT; Return/Frustration are CLAMPED; the
// professor's starter (build.starter) keeps a 60-BP floor.
//   node --test tests/suites/story-move-bp-clamp.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const W = E.window;
const ST = W.__storyTest;

function primeStoryCity(city) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1);
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
}

// Run ONE player move and return the damage dealt to the foe. Deterministic (pinned roll,
// no crit). The move is forced into the player's moveset directly (bypassing the pool gate)
// so the clamp is the only thing standing between a high-BP move and the foe.
async function dealtBy(moveName, city, { starter = false } = {}) {
  primeStoryCity(city);
  const player = E.mkMon({ species: 'Machamp', moves: [moveName, 'Splash', 'Splash', 'Splash'] });
  const foe = E.mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  E.reset();
  E.engine.state.pActive = player; E.engine.state.playerParty = [player];
  E.engine.state.fActive = foe; E.engine.state.foeParty = [foe];
  E.engine.state.mode = 'story';
  if (starter) { player.buildData = player.buildData || {}; player.buildData.starter = true; }
  player.stats.spe = 999; // player moves first
  E.engine.setForcedFoeMoveSlot(0);
  const fHp = foe.currentHp;
  const origRandom = W.Math.random;
  W.Math.random = () => 0.99; // pin roll, no crit
  try { await W.playTurn(0, null); } finally { W.Math.random = origRandom; }
  return fHp - foe.currentHp;
}

test('resolver: window._storyBattleBpCap gives the per-city cap in a story battle, ∞ otherwise', () => {
  primeStoryCity(2); // cap 60
  const story = { mode: 'story' };
  assert.equal(W._storyBattleBpCap({}, false, story), 60, 'C2 → 60 in a story battle');
  assert.equal(W._storyBattleBpCap({}, false, { mode: 'pve' }), Infinity, 'non-story battle → no clamp');
  primeStoryCity(0); // cap 40, starter floor 60
  assert.equal(W._storyBattleBpCap({ buildData: {} }, false, story), 40, 'C0 non-starter capped at 40');
  assert.equal(W._storyBattleBpCap({ buildData: { starter: true } }, true, story), 60, 'C0 starter floored to 60');
  assert.equal(W._storyBattleBpCap({ buildData: { starter: true } }, false, story), 40, 'foe side never gets the starter floor');
  primeStoryCity(6); // cap ∞
  assert.equal(W._storyBattleBpCap({ buildData: { starter: true } }, true, story), Infinity, 'starter floor never lowers an uncapped city');
});

test('a fixed-power move above the cap is clamped (less damage early, full damage late)', async () => {
  // Double-Edge = 120 BP. At C2 (cap 60) it is clamped to 60; at C6 (∞) it hits at 120.
  const early = await dealtBy('Double-Edge', 2);
  const late = await dealtBy('Double-Edge', 6);
  assert.ok(early > 0 && late > 0, 'both deal damage');
  assert.ok(early < late, `C2 clamp (${early}) deals less than the uncapped C6 hit (${late})`);
  // Clamped 120→60 should land near a native 60-BP equivalent of the same move at C6
  // (Body Slam = 85, Headbutt = 70 — use the ratio as a sanity band, not an exact match).
  assert.ok(early <= late * 0.6 + 2, 'clamped damage is roughly half the 120-BP hit (60/120)');
});

test('Return (102, hard-coded) IS clamped early but full late', async () => {
  const early = await dealtBy('Return', 2); // cap 60 → clamped
  const late = await dealtBy('Return', 6);  // ∞ → full 102
  assert.ok(early > 0 && late > 0, 'both deal damage');
  assert.ok(early < late, `Return is clamped at C2 (${early}) vs full at C6 (${late})`);
});

test('variable-power moves are now CLAMPED too (1.6.1 — Low Kick capped early, full late)', async () => {
  // 1.6.1: variable-power moves are no longer exempt. Low Kick's weight-computed BP
  // (Snorlax is very heavy → 120) is clamped to the city cap, so it deals less at C2
  // (cap 60) than at C6 (∞).
  const early = await dealtBy('Low Kick', 2);
  const late = await dealtBy('Low Kick', 6);
  assert.ok(early > 0 && late > 0, 'Low Kick deals damage');
  assert.ok(early < late, `Low Kick clamped at C2 (${early}) vs full at C6 (${late})`);
});

test('fixed-damage moves are now CAPPED to the city cap (1.6.1 — Seismic Toss scales)', async () => {
  // 1.6.1 System G: a flat-damage move can't out-hit a cap-BP move of its profile. At C0
  // (cap 40) Seismic Toss's flat 50 is reduced; once the cap is high enough it is its
  // full flat 50.
  const c0 = await dealtBy('Seismic Toss', 0);   // capped below 50
  const late = await dealtBy('Seismic Toss', 6); // ∞ → full flat 50
  assert.equal(late, 50, 'Seismic Toss deals its flat 50 once the cap lifts (C6)');
  assert.ok(c0 < 50, `Seismic Toss capped below its flat 50 at C0 (got ${c0})`);
  assert.ok(c0 > 0, 'still deals damage');
});

test('the starter keeps a 60-BP floor — a 120-BP move hits harder for the starter at C0', async () => {
  const nonStarter = await dealtBy('Double-Edge', 0);            // capped at 40
  const starter = await dealtBy('Double-Edge', 0, { starter: true }); // floored to 60
  assert.ok(nonStarter > 0 && starter > 0, 'both deal damage');
  assert.ok(starter > nonStarter, `starter (cap 60 → ${starter}) out-hits the non-starter (cap 40 → ${nonStarter}) at C0`);
});

test('multi-hit moves clamp PER HIT — no leak (Dragon Darts 50/hit ×2)', async () => {
  // Dragon Darts = 50 BP, fixed 2 hits. At C0 (cap 40) each hit's base power is clamped to
  // 40; at C6 (∞) each hits at 50. The clamp lowers per-hit POWER, not the hit count — so
  // C0 total < C6 total and the move never leaks its uncapped per-hit BP across hits.
  const early = await dealtBy('Dragon Darts', 0); // 40/hit ×2
  const late = await dealtBy('Dragon Darts', 6);  // 50/hit ×2
  assert.ok(early > 0 && late > 0, 'both deal damage across the 2 hits');
  assert.ok(early < late, `multi-hit clamped per hit at C0 (${early}) vs full at C6 (${late})`);
});
