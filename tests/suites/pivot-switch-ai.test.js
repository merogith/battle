// Pivot-move switching suite. Covers the two behavioural changes shipped alongside the
// "switch moves force my next Pokémon" fix:
//
//   1. aiPivotWorth() — the anti-spam multiplier applied to U-turn / Volt Switch /
//      Flip Turn / Parting Shot / Baton Pass / Teleport in getBestMove. It should DISCOUNT
//      a pivot from a winning position (nothing to gain by switching) and REWARD one that
//      escapes a walled matchup into a better switch-in.
//   2. aiBestSwitch() — the dies-on-entry penalty, so the AI stops feeding a fresh mon that
//      the active foe (plus hazards) simply OHKOs the moment it lands.
//
// These exercise the REAL AI closures via window.__engine (the harness stubs the window
// globals for playTurn, but __engine captured the genuine references at parse time).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

function freshSide() {
  return {
    stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false,
    reflect: 0, lightScreen: 0, auroraVeil: 0, safeguard: 0, tailwind: 0, mist: 0, luckychant: 0,
  };
}

function setState(eng, { fActive, pActive, foeParty, playerParty, weather = null, trickRoom = 0, mode = 'pve', turnNumber = 3, lastSwitchTurn = undefined, fSide }) {
  eng.engine.state = {
    mode, turnNumber, score: 0,
    playerParty: playerParty || [pActive],
    foeParty: foeParty || [fActive],
    pActive, fActive,
    isOver: false, isLocked: false,
    weather, weatherTurns: weather ? 5 : 0, terrain: null, terrainTurns: 0, trickRoom,
    fieldLastMove: null,
    pSide: freshSide(), fSide: fSide || freshSide(),
    currentPlayer: 1, p1Action: null, p2Action: null,
    _aiLastSwitchTurn: lastSwitchTurn,
  };
}

const pinRandom = (eng) => { eng.window.Math.random = () => 0; };

test('aiPivotWorth: discounts a pivot when we are winning outright (can KO)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  // Garchomp KOs a frail Furret with Earthquake; U-turning away throws the position away.
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'U-turn', 'Dragon Claw', 'Stone Edge'] });
  const frail = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  frail.currentHp = Math.max(1, Math.floor(frail.maxHp * 0.2)); // clearly KO range
  // A live bench mon must exist for the multiplier to engage (no bench → face value).
  const bench = mkMon({ species: 'Metagross', moves: ['Meteor Mash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: chomp, pActive: frail, foeParty: [chomp, bench] });
  const mult = engine.aiPivotWorth(chomp, frail);
  assert.ok(mult <= 0.5, `Winning position should discount the pivot (got ${mult})`);
});

test('aiPivotWorth: rewards a pivot that escapes a walled matchup into a better switch-in', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  // Furret is walled by Skarmory (Steel/Flying resists everything it has). Infernape on the
  // bench torches Skarmory and comes in safely — pivoting is the right call.
  const furret = mkMon({ species: 'Furret', moves: ['Tackle', 'Quick Attack', 'U-turn', 'Tackle'] });
  const skarm = mkMon({ species: 'Skarmory', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const ape = mkMon({ species: 'Infernape', moves: ['Flamethrower', 'Close Combat', 'Fire Blast', 'Overheat'] });
  setState(eng, { fActive: furret, pActive: skarm, foeParty: [furret, ape] });
  const mult = engine.aiPivotWorth(furret, skarm);
  assert.ok(mult >= 1.2, `Walled matchup with a better switch-in should reward the pivot (got ${mult})`);
});

test('aiPivotWorth: no bench → face value (multiplier 1.0, no spam risk)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'U-turn', 'Dragon Claw', 'Stone Edge'] });
  const frail = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: chomp, pActive: frail, foeParty: [chomp] }); // no bench
  const mult = engine.aiPivotWorth(chomp, frail);
  assert.equal(mult, 1.0, `No bench should leave the move at face value (got ${mult})`);
});

test('aiPivotWorth: having just switched compounds the discount (anti-panic hysteresis)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  const furret = mkMon({ species: 'Furret', moves: ['Tackle', 'Quick Attack', 'U-turn', 'Tackle'] });
  const target = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const karp = mkMon({ species: 'Magikarp', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  // Neutral, no better switch on the bench. Baseline vs just-switched.
  setState(eng, { fActive: furret, pActive: target, foeParty: [furret, karp], turnNumber: 5 });
  const base = engine.aiPivotWorth(furret, target);
  setState(eng, { fActive: furret, pActive: target, foeParty: [furret, karp], turnNumber: 5, lastSwitchTurn: 4 });
  const justSwitched = engine.aiPivotWorth(furret, target);
  assert.ok(justSwitched < base, `Just-switched should discount further (base ${base}, after ${justSwitched})`);
});

test('getBestMove: does not spam U-turn from a winning position when a strong attack exists', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Garchomp can Earthquake a frail Furret for a clean KO. U-turn should not be chosen —
  // it surrenders a won position (and, with a bench present, the anti-spam gate bites).
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'U-turn', 'Dragon Claw', 'Stone Edge'] });
  const frail = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  frail.currentHp = Math.max(1, Math.floor(frail.maxHp * 0.25));
  const bench = mkMon({ species: 'Metagross', moves: ['Meteor Mash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: chomp, pActive: frail, foeParty: [chomp, bench] });
  const pick = engine.getBestMove(chomp, frail);
  assert.notEqual(pick.name, 'U-turn', `AI should not pivot away from a winning position, picked ${pick.name}`);
});

test('selectPartyMember: a pending pivot resolves with the player-chosen bench mon (no force-pick)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine, window } = eng;
  const active = mkMon({ species: 'Furret', moves: ['U-turn', 'Splash', 'Splash', 'Splash'] });
  const benchA = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Splash', 'Splash', 'Splash'] });
  const benchB = mkMon({ species: 'Metagross', moves: ['Meteor Mash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: mkMon({ species: 'Snorlax', moves: ['Splash','Splash','Splash','Splash'] }), pActive: active,
    playerParty: [active, benchA, benchB] });

  // Simulate the pivot menu awaiting a choice (what awaitPlayerPivotSwitch installs).
  let resolvedWith = null;
  window._pivotSwitchPending = { isP1: true, resolve: (m) => { resolvedWith = m; } };

  // Player clicks the THIRD party slot (index 2 = Metagross) — must honour that pick,
  // not silently force bench[0] (Garchomp). This is the bug the fix targets.
  await window.selectPartyMember(2, true);

  assert.equal(resolvedWith && resolvedWith.name, 'Metagross', `Pivot must switch to the chosen mon, got ${resolvedWith && resolvedWith.name}`);
  assert.equal(window._pivotSwitchPending, null, 'pending pivot should be cleared after selection');
});

test('selectPartyMember: a pending pivot ignores clicks on a fainted / active slot', async () => {
  const eng = await loadEngine();
  const { mkMon, engine, window } = eng;
  const active = mkMon({ species: 'Furret', moves: ['U-turn', 'Splash', 'Splash', 'Splash'] });
  const fainted = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Splash', 'Splash', 'Splash'] });
  fainted.currentHp = 0;
  const ok = mkMon({ species: 'Metagross', moves: ['Meteor Mash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: mkMon({ species: 'Snorlax', moves: ['Splash','Splash','Splash','Splash'] }), pActive: active,
    playerParty: [active, fainted, ok] });

  let resolvedWith = 'untouched';
  window._pivotSwitchPending = { isP1: true, resolve: (m) => { resolvedWith = m; } };

  await window.selectPartyMember(0, true); // active slot — ignored
  assert.equal(resolvedWith, 'untouched', 'clicking the active slot must not resolve the pivot');
  await window.selectPartyMember(1, true); // fainted slot — ignored
  assert.equal(resolvedWith, 'untouched', 'clicking a fainted slot must not resolve the pivot');
  assert.ok(window._pivotSwitchPending, 'pivot still pending after invalid clicks');

  await window.selectPartyMember(2, true); // valid
  assert.equal(resolvedWith && resolvedWith.name, 'Metagross');
});

test('Shed Tail: the passed substitute transfers to the incoming Pokémon', async () => {
  const eng = await loadEngine();
  const { mkMon, engine, window, reset } = eng;
  reset();
  const player = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const shed = mkMon({ species: 'Snorlax', moves: ['Shed Tail', 'Splash', 'Splash', 'Splash'] });
  const incoming = mkMon({ species: 'Metagross', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  engine.state.pActive = player; engine.state.fActive = shed;
  engine.state.playerParty = [player]; engine.state.foeParty = [shed, incoming];
  engine.state.mode = 'pve';
  const shedMaxHp = shed.maxHp;
  const expectedSub = Math.floor(shedMaxHp / 4);
  const expectedCost = Math.floor(shedMaxHp / 2);
  engine.setForcedFoeMoveSlot(0); // foe uses Shed Tail
  await window.playTurn(1, null);  // player uses Splash (harmless)

  assert.equal(engine.state.fActive.name, 'Metagross', 'the benched mon should have switched in');
  assert.equal(engine.state.fActive.volatile.sub, expectedSub,
    `incoming mon should inherit the substitute (${expectedSub}), got ${engine.state.fActive.volatile.sub}`);
  assert.equal(shed.volatile.sub, 0, 'the Shed Tail user should no longer hold the sub after switching out');
  assert.equal(shed.currentHp, shedMaxHp - expectedCost, 'Shed Tail should cost half the user\'s max HP');
});

test('Shed Tail: only the sub is passed — stat boosts are NOT (unlike Baton Pass)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine, window, reset } = eng;
  reset();
  const player = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const shed = mkMon({ species: 'Snorlax', moves: ['Shed Tail', 'Splash', 'Splash', 'Splash'] });
  shed.stages.atk = 3; // a boost that Baton Pass WOULD carry but Shed Tail must not
  const incoming = mkMon({ species: 'Metagross', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  engine.state.pActive = player; engine.state.fActive = shed;
  engine.state.playerParty = [player]; engine.state.foeParty = [shed, incoming];
  engine.state.mode = 'pve';
  engine.setForcedFoeMoveSlot(0);
  await window.playTurn(1, null);

  assert.equal(engine.state.fActive.name, 'Metagross');
  assert.ok(engine.state.fActive.volatile.sub > 0, 'sub should be passed');
  assert.equal(engine.state.fActive.stages.atk, 0, 'Shed Tail must NOT pass the +3 Atk boost');
});

test('Shed Tail: fails (no HP spent) when there is no one to switch to', async () => {
  const eng = await loadEngine();
  const { mkMon, engine, window, reset, logs } = eng;
  reset();
  const player = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const shed = mkMon({ species: 'Snorlax', moves: ['Shed Tail', 'Splash', 'Splash', 'Splash'] });
  engine.state.pActive = player; engine.state.fActive = shed;
  engine.state.playerParty = [player]; engine.state.foeParty = [shed]; // no bench
  engine.state.mode = 'pve';
  const before = shed.currentHp;
  engine.setForcedFoeMoveSlot(0);
  const startLen = logs.length;
  await window.playTurn(1, null);
  const turnLogs = logs.slice(startLen);

  assert.equal(engine.state.fActive.name, 'Snorlax', 'no switch should occur');
  assert.equal(shed.currentHp, before, 'a failed Shed Tail must not spend HP');
  assert.equal(shed.volatile.sub, 0, 'a failed Shed Tail must not leave a substitute');
  assert.ok(turnLogs.some(l => /no one to switch to/i.test(l.text)), 'should log the failure');
});

test('closeModal: dismissing modal-party settles a stranded pivot resolver (no turn hang)', async () => {
  const eng = await loadEngine();
  const { window } = eng;
  // Simulate a pivot awaiting the player's pick, then a GENERIC close (Esc handler / screen
  // transition) that does NOT go through selectPartyMember. The resolver must be settled so
  // the parked handlePivotSwitch turn can't hang forever.
  let settled = 'never';
  window._pivotSwitchPending = { isP1: true, resolve: (m) => { settled = m; } };
  window.closeModal('modal-party');
  assert.equal(settled, null, 'a generic close must settle the pivot resolver (with the fallback null)');
  assert.equal(window._pivotSwitchPending, null, 'pending pivot cleared after a generic close');
});

test('closeModal: settling a game-confirm still works and does not touch an absent pivot', async () => {
  const eng = await loadEngine();
  const { window } = eng;
  window._pivotSwitchPending = null; // no pivot in flight
  // Should be a no-op for the pivot path and not throw.
  assert.doesNotThrow(() => window.closeModal('modal-party'));
  assert.equal(window._pivotSwitchPending, null);
});

test('aiBestSwitch: avoids a switch-in that gets KO’d on entry, preferring a survivor', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  // Player active is a fast, hard-hitting Garchomp (Earthquake). Bench choice:
  //  - Electivire: 2x weak to Ground, frail enough to be OHKO'd on entry (bad switch-in).
  //  - Skarmory: Ground-immune (Flying), walls Garchomp's Earthquake, survives.
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Stone Edge', 'Dragon Claw', 'Splash'] });
  const victim = mkMon({ species: 'Electivire', moves: ['Thunderbolt', 'Ice Punch', 'Splash', 'Splash'] });
  victim.currentHp = Math.max(1, Math.floor(victim.maxHp * 0.5)); // will be OHKO'd by Earthquake on entry
  const survivor = mkMon({ species: 'Skarmory', moves: ['Body Press', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: mkMon({ species: 'Furret', moves: ['Splash','Splash','Splash','Splash'] }), pActive: chomp,
    foeParty: [victim, survivor] });
  const chosen = engine.aiBestSwitch([victim, survivor], chomp);
  assert.ok(chosen, 'should choose a switch-in');
  assert.equal(chosen.name, 'Skarmory', `Should avoid the mon that dies on entry, chose ${chosen && chosen.name}`);
});
