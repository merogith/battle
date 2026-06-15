// Batch 4 — balance-decisions memo (agent-state/handoff/04-balance-decisions-memo.md),
// maintainer-decided 2026-06-11. Locks in:
//   #3  Safari grade curve re-keyed +1 badge (debut visit @ C5 / 4 badges gets the
//       gentlest row; the old unreachable badges-3 key is gone).
//   #7  Boss 0.50-HP heal phase fires exactly once per battle (ratified existing
//       behavior — the hp_<at> fired-key never resets mid-battle).
//   #9  All-immune skip: an attacker whose every damaging move is immune against
//       the defender, with no usable status move, switches out unconditionally
//       (no HP gate, no boost hold). Mons with a live status move keep the old
//       hold-position logic.
//   #10 Featured Mega/Ultra stones (mega_*/ultra_* ids) are sell-locked.
// Run: node --test tests/suites/balance-memo-batch4.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

function freshSide() {
  return {
    stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false,
    reflect: 0, lightScreen: 0, auroraVeil: 0, safeguard: 0, tailwind: 0, mist: 0, luckychant: 0,
  };
}

function setState(eng, { fActive, pActive, foeParty, playerParty, weather = null, trickRoom = 0 }) {
  eng.engine.state = {
    mode: 'pve', turnNumber: 3, score: 0,
    playerParty: playerParty || [pActive],
    foeParty: foeParty || [fActive],
    pActive, fActive,
    isOver: false, isLocked: false,
    weather, weatherTurns: weather ? 5 : 0, terrain: null, terrainTurns: 0, trickRoom,
    fieldLastMove: null,
    pSide: freshSide(), fSide: freshSide(),
    currentPlayer: 1, p1Action: null, p2Action: null,
  };
}

function pinRandom(eng) { eng.window.Math.random = () => 0; }

// All Fighting/Normal coverage into a Ghost type — every damaging move is immune.
const ALL_IMMUNE_MOVES = ['Close Combat', 'Mach Punch', 'Body Slam', 'Double-Edge'];

test('aiDecision (memo #9): all-immune attacker with no status move switches even below the HP gate', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const chan = mkMon({ species: 'Hitmonchan', moves: ALL_IMMUNE_MOVES });
  chan.currentHp = Math.floor(chan.maxHp * 0.3); // below the 0.35 walled-switch gate
  const gengar = mkMon({ species: 'Gengar', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const ttar = mkMon({ species: 'Tyranitar', moves: ['Crunch', 'Stone Edge', 'Earthquake', 'Splash'] });
  setState(eng, { fActive: chan, pActive: gengar, foeParty: [chan, ttar], playerParty: [gengar] });
  const decision = engine.aiDecision();
  assert.equal(decision, 1, `All-immune Hitmonchan should switch to Tyranitar (index 1), got ${decision}`);
});

test('aiDecision (memo #9): a usable status move keeps the old low-HP hold (no switch)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const chan = mkMon({ species: 'Hitmonchan', moves: ['Close Combat', 'Mach Punch', 'Body Slam', 'Bulk Up'] });
  chan.currentHp = Math.floor(chan.maxHp * 0.3);
  const gengar = mkMon({ species: 'Gengar', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const ttar = mkMon({ species: 'Tyranitar', moves: ['Crunch', 'Stone Edge', 'Earthquake', 'Splash'] });
  setState(eng, { fActive: chan, pActive: gengar, foeParty: [chan, ttar], playerParty: [gengar] });
  const decision = engine.aiDecision();
  assert.equal(decision, null, `With a live status move the low-HP hold should keep it in, got switch index ${decision}`);
});

test('aiDecision (memo #9): accumulated boosts do not pin an all-immune attacker in place', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const chan = mkMon({ species: 'Hitmonchan', moves: ALL_IMMUNE_MOVES });
  chan.stages.atk = 2; // previously an unconditional "stay" — boosts are worthless at 0 damage
  const gengar = mkMon({ species: 'Gengar', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const ttar = mkMon({ species: 'Tyranitar', moves: ['Crunch', 'Stone Edge', 'Earthquake', 'Splash'] });
  setState(eng, { fActive: chan, pActive: gengar, foeParty: [chan, ttar], playerParty: [gengar] });
  const decision = engine.aiDecision();
  assert.equal(decision, 1, `Boosted but all-immune should still switch, got ${decision}`);
});

test('Safari curve (memo #3): debut visit (4 badges) gets the gentlest row; table has no badges-3 key', async () => {
  const eng = await loadEngine();
  const W = eng.window;
  const story = W.__story;
  assert.ok(story && typeof story.safariGradeWeightsForBadges === 'function', '__story.safariGradeWeightsForBadges missing');
  if (!story.sm || typeof story.sm !== 'object') story.sm = {};
  // Spread into a local-realm object: jsdom-realm prototypes fail deepEqual.
  const weightsAt = (b) => { story.sm.badges = b; return { ...story.safariGradeWeightsForBadges() }; };
  assert.deepEqual(weightsAt(4), { g1: 0, g2: 5, g3: 60, g4: 35 }, 'debut visit must use the gentle row');
  assert.deepEqual(weightsAt(8), { g1: 2, g2: 45, g3: 45, g4: 8 }, 'post-G8 row drifted');
  // Pre-unlock badge counts are unreachable in normal flow but must not NaN —
  // they fall back to the debut row.
  assert.deepEqual(weightsAt(0), { g1: 0, g2: 5, g3: 60, g4: 35 }, 'pre-unlock fallback must be the debut row');
});

test('Boss heal phase (memo #7): the 0.50-HP heal fires exactly once per battle', async () => {
  const eng = await loadEngine();
  const W = eng.window;
  const tick = W.StoryMode && W.StoryMode.bossMechanicsTurnTick;
  assert.ok(typeof tick === 'function', 'StoryMode.bossMechanicsTurnTick missing');
  const stateRef = {
    _bossMechanics: [{ type: 'hpThresholdPhase', at: 0.50, effect: 'heal', banner: 'TEST PHASE' }],
    _bossMechanicsFired: {}, _bossPendingTelegraphs: [],
    _bossSurgeTurns: 0, _bossImmuneTurns: 0, turnNumber: 1,
  };
  const boss = { maxHp: 100, currentHp: 40 };
  tick(stateRef, boss);                       // crosses 0.50 → telegraph queued
  assert.equal(stateRef._bossPendingTelegraphs.length, 1, 'heal telegraph should queue on first crossing');
  tick(stateRef, boss);                       // telegraph activates → +25% maxHp
  assert.equal(boss.currentHp, 65, `heal should restore 25% maxHp (40→65), got ${boss.currentHp}`);
  boss.currentHp = 30;                        // player knocks it back below the bar
  tick(stateRef, boss);
  tick(stateRef, boss);
  assert.equal(stateRef._bossPendingTelegraphs.length, 0, 'no second telegraph after re-crossing');
  assert.equal(boss.currentHp, 30, `no second heal: HP should stay 30, got ${boss.currentHp}`);
});

// SUPERSEDED (2026-06-15): memo #10's blanket sell-lock on featured Mega/Ultra
// stones was lifted by the "make every bag item sellable" decision. Featured
// stones now resell like any other shop item (the bag computes price/2). sellItem
// no longer refuses mega_*/ultra_* ids — this test now locks the new behavior.
test('Featured stones: sellItem now sells mega_*/ultra_* ids (sell-everything policy)', async () => {
  const eng = await loadEngine();
  const W = eng.window;
  const SM = W.StoryMode;
  assert.ok(SM && typeof SM.sellItem === 'function', 'StoryMode.sellItem missing');
  const sm = SM.state;
  if (!sm.inventory || typeof sm.inventory !== 'object') sm.inventory = {};
  sm.inventory['mega_charizarditex'] = 1;
  sm.inventory['ultra_beastball'] = 2;
  const gold = sm.gold | 0;
  SM.sellItem('mega_charizarditex', 500);
  SM.sellItem('ultra_beastball', 300);
  assert.ok(!sm.inventory['mega_charizarditex'], 'mega stone is consumed by the sale');
  assert.equal(sm.inventory['ultra_beastball'], 1, 'one ultra stone sold, one remains');
  assert.equal(sm.gold | 0, gold + 800, 'gold increases by the two sale prices (500 + 300)');
});
