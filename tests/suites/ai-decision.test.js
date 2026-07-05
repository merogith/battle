// AI decision suite: exercises the REAL battle AI (window.__engine.getBestMove /
// aiEstimateDmg / aiPredictPlayerSwitchIn), not the harness stub that load-engine.js
// installs for playTurn. The __engine object captured the genuine function references
// at script-parse time, so these handles bypass the stub.
//
// Focus areas:
//   1. Damage-estimate fidelity — fixed-damage (Seismic Toss), multi-hit (Bullet Seed),
//      OHKO (Fissure) moves used to be scored as 0 / ~1 hit, blinding the AI to real KOs.
//   2. Move selection — KO recognition, immune/illegal-status avoidance (regression guards).
//   3. Switch-in prediction — the AI loads the move that punishes the counter the player is
//      most likely to bring in once it is clearly winning the active matchup.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

function freshSide() {
  return {
    stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false,
    reflect: 0, lightScreen: 0, auroraVeil: 0, safeguard: 0, tailwind: 0, mist: 0, luckychant: 0,
  };
}

// Install a full battle state so the AI closures (state.foeParty / pSide / weather …) resolve.
function setState(eng, { fActive, pActive, foeParty, playerParty, weather = null, trickRoom = 0, mode = 'pve', turnNumber = 3, terrain = null }) {
  eng.engine.state = {
    mode, turnNumber, score: 0,
    playerParty: playerParty || [pActive],
    foeParty: foeParty || [fActive],
    pActive, fActive,
    isOver: false, isLocked: false,
    weather, weatherTurns: weather ? 5 : 0, terrain, terrainTurns: terrain ? 5 : 0, trickRoom,
    fieldLastMove: null, gravity: 0, magicRoom: 0,
    pSide: freshSide(), fSide: freshSide(),
    currentPlayer: 1, p1Action: null, p2Action: null,
  };
}

// Zero out the AI's random tie-break factor for deterministic move-choice assertions.
function pinRandom(eng) { eng.window.Math.random = () => 0; }

test('aiEstimateDmg: Seismic Toss is 50 fixed damage, not 0', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  const chansey = mkMon({ species: 'Chansey', moves: ['Seismic Toss', 'Tackle', 'Splash', 'Splash'] });
  const target = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: chansey, pActive: target });
  const stoss = chansey.moves.find(m => m.name === 'Seismic Toss');
  const dmg = engine.aiEstimateDmg(chansey, target, stoss);
  assert.equal(dmg, 50, `Seismic Toss should estimate 50 fixed damage, got ${dmg}`);
});

test('aiEstimateDmg: fixed-damage move respects type immunity (Seismic Toss vs Ghost = 0)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  const chansey = mkMon({ species: 'Chansey', moves: ['Seismic Toss', 'Splash', 'Splash', 'Splash'] });
  const ghost = mkMon({ species: 'Gengar', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: chansey, pActive: ghost });
  const stoss = chansey.moves.find(m => m.name === 'Seismic Toss');
  const dmg = engine.aiEstimateDmg(chansey, ghost, stoss);
  assert.equal(dmg, 0, `Seismic Toss (Fighting) vs Ghost should be 0, got ${dmg}`);
});

test('aiEstimateDmg: multi-hit move is scaled by expected hits (Bullet Seed >> single hit)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  const attacker = mkMon({ species: 'Breloom', moves: ['Bullet Seed', 'Splash', 'Splash', 'Splash'] });
  const target = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: attacker, pActive: target });
  const bseed = attacker.moves.find(m => m.name === 'Bullet Seed');
  // Sanity: the move object actually carries a multi-hit spec from moves.json.
  assert.ok(bseed.multihit != null, 'Bullet Seed should carry a multihit spec');
  const dmg = engine.aiEstimateDmg(attacker, target, bseed);
  // A single 25-BP STAB hit on a neutral 100-base target lands in the low double digits; ~3.2
  // hits must clear 50. (Upper bound guards against a runaway multiplier.)
  assert.ok(dmg > 50 && dmg < 250, `Bullet Seed multi-hit estimate out of range: ${dmg}`);
});

test('aiEstimateDmg: OHKO move estimates a full KO on a valid target, 0 vs Sturdy at full HP', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  const attacker = mkMon({ species: 'Garchomp', moves: ['Fissure', 'Splash', 'Splash', 'Splash'] });
  const target = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: attacker, pActive: target });
  const fissure = attacker.moves.find(m => m.name === 'Fissure');
  const dmg = engine.aiEstimateDmg(attacker, target, fissure);
  assert.equal(dmg, target.currentHp, `Fissure should estimate a full KO (${target.currentHp}), got ${dmg}`);

  const sturdy = mkMon({ species: 'Donphan', ability: 'Sturdy', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: attacker, pActive: sturdy });
  const dmg2 = engine.aiEstimateDmg(attacker, sturdy, fissure);
  assert.ok(dmg2 < sturdy.currentHp, `Fissure vs Sturdy-at-full should not read as a KO, got ${dmg2}/${sturdy.currentHp}`);
});

test('getBestMove: picks the fixed-damage KO move a weak attack cannot match', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Chansey has minuscule Attack, so Tackle barely chips; Seismic Toss does a flat 50.
  const chansey = mkMon({ species: 'Chansey', moves: ['Seismic Toss', 'Tackle', 'Soft-Boiled', 'Toxic'] });
  const target = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  target.maxHp = 200; target.currentHp = 49; // 50 dmg KOs, Tackle from Chansey will not
  setState(eng, { fActive: chansey, pActive: target });
  const pick = engine.getBestMove(chansey, target);
  assert.equal(pick.name, 'Seismic Toss', `Expected Seismic Toss KO, got ${pick.name}`);
});

test('getBestMove: does not pick a type-immune move (Earthquake vs Flying)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const attacker = mkMon({ species: 'Golem', moves: ['Earthquake', 'Rock Slide', 'Splash', 'Splash'] });
  const flyer = mkMon({ species: 'Pidgeot', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: attacker, pActive: flyer });
  const pick = engine.getBestMove(attacker, flyer);
  assert.notEqual(pick.name, 'Earthquake', 'AI should never select an immune move');
  assert.equal(pick.name, 'Rock Slide', `Expected Rock Slide vs Flying, got ${pick.name}`);
});

test('getBestMove: does not waste an illegal status move (Toxic vs Steel) when a real move exists', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Toxic can't poison Steel; Flamethrower is super-effective on Skarmory. The AI must take the hit.
  const attacker = mkMon({ species: 'Salazzle', moves: ['Toxic', 'Flamethrower', 'Splash', 'Splash'] });
  const steel = mkMon({ species: 'Skarmory', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: attacker, pActive: steel });
  const pick = engine.getBestMove(attacker, steel);
  assert.equal(pick.name, 'Flamethrower', `Expected Flamethrower vs Steel, got ${pick.name}`);
});

test('aiPredictPlayerSwitchIn: returns the bench mon with the strongest matchup', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  const ourActive = mkMon({ species: 'Mew', moves: ['Ice Beam', 'Thunderbolt', 'Splash', 'Splash'] });
  const playerActive = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  // Bench: Garchomp threatens Mew hard (Ground/Dragon, fast); Magikarp is harmless.
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Dragon Claw', 'Splash', 'Splash'] });
  const karp = mkMon({ species: 'Magikarp', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: ourActive, pActive: playerActive, playerParty: [playerActive, chomp, karp] });
  const predicted = engine.aiPredictPlayerSwitchIn(ourActive);
  assert.ok(predicted, 'should predict a switch-in');
  assert.equal(predicted.name, 'Garchomp', `Expected Garchomp as the strongest switch-in, got ${predicted && predicted.name}`);
});

test('getBestMove: switch-in prediction breaks a KO tie toward the move that hits the counter', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Mew (no STAB on either) can KO the frail active with Ice Beam or Thunderbolt equally.
  const mew = mkMon({ species: 'Mew', moves: ['Ice Beam', 'Thunderbolt', 'Splash', 'Splash'] });
  const active = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  active.currentHp = 1; // either special move trivially KOs -> equal base score
  // Only switch-in is Garchomp: Ice 4x super-effective, Electric immune (Ground).
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: mew, pActive: active, playerParty: [active, chomp], foeParty: [mew] });
  const pick = engine.getBestMove(mew, active);
  assert.equal(pick.name, 'Ice Beam', `Prediction should favor Ice Beam vs a Garchomp switch-in, got ${pick.name}`);
});

test('aiDecision: a Choice mon locked into an immune move switches out instead of spamming it', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Choice-Specs Tapu Koko locked into Thunderbolt, vs a Lightning Rod Rhydon (immune by type AND
  // ability). Bench has a Garchomp that wrecks the wall. The AI must pivot, not loop Thunderbolt.
  const koko = mkMon({ species: 'Tapu Koko', item: 'Choice Specs', moves: ['Thunderbolt', 'Dazzling Gleam', 'U-turn', 'Roost'] });
  koko.volatile.choiceLock = 'Thunderbolt';
  const wall = mkMon({ species: 'Rhydon', ability: 'Lightning Rod', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Stone Edge', 'Dragon Claw', 'Splash'] });
  setState(eng, { fActive: koko, pActive: wall, foeParty: [koko, chomp], playerParty: [wall] });
  const decision = engine.aiDecision();
  assert.equal(decision, 1, `Locked-into-immune AI should switch to Garchomp (index 1), got ${decision}`);
});

test('aiDecision: a Choice mon locked into a useful move stays in (no over-switching)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Same Koko locked into Thunderbolt, but now vs a neutral, bulky target it hits hard. Staying
  // is correct — the locked move is doing its job, so it must NOT pivot away from a winning spot.
  const koko = mkMon({ species: 'Tapu Koko', item: 'Choice Specs', moves: ['Thunderbolt', 'Dazzling Gleam', 'U-turn', 'Roost'] });
  koko.volatile.choiceLock = 'Thunderbolt';
  const target = mkMon({ species: 'Furret', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  target.maxHp = 250; target.currentHp = 250; // bulky enough not to be a 1-shot, but Thunderbolt still bites
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Stone Edge', 'Dragon Claw', 'Splash'] });
  setState(eng, { fActive: koko, pActive: target, foeParty: [koko, chomp], playerParty: [target] });
  const decision = engine.aiDecision();
  assert.equal(decision, null, `Locked into a working move, the AI should stay, got switch index ${decision}`);
});

test('getBestMove: does not loop a setup move into an active phazer', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Dragonite vs a Skarmory holding Whirlwind: Earthquake is immune (Flying), but Dragon Dance
  // gets phazed away every turn. The AI must take the (priority) attack rather than loop setup.
  const dnite = mkMon({ species: 'Dragonite', moves: ['Dragon Dance', 'Earthquake', 'Extreme Speed', 'Roost'] });
  const skarm = mkMon({ species: 'Skarmory', moves: ['Whirlwind', 'Splash', 'Splash', 'Splash'] });
  setState(eng, { fActive: dnite, pActive: skarm, foeParty: [dnite], playerParty: [skarm, mkMon({ species: 'Furret', moves: ['Splash','Splash','Splash','Splash'] })] });
  const pick = engine.getBestMove(dnite, skarm);
  assert.notEqual(pick.name, 'Dragon Dance', 'AI should not loop Dragon Dance into a Whirlwind user');
  assert.equal(pick.name, 'Extreme Speed', `Expected the priority attack vs a phazer, got ${pick.name}`);
});

// === Enemy-bot nuance: conditional-move preconditions & ability/field immunities (2026-07) ===
// Regression guards for ISSUE-006/007/008 — the AI scorer must mirror the engine gates so it never
// clicks a move the engine then fails ("But it failed!" / wasted turn / heals the foe).

test('getBestMove: does not pick Last Resort while sibling moves are unused', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Turn 1, empty moveHistory: the engine fails Last Resort until every other move has been used.
  const lax = mkMon({ species: 'Snorlax', moves: ['Last Resort', 'Crunch', 'Earthquake', 'Body Slam'] });
  const target = mkMon({ species: 'Furret', moves: ['Body Slam', 'Knock Off', 'U-turn', 'Coil'] });
  setState(eng, { fActive: lax, pActive: target, turnNumber: 1 });
  const pick = engine.getBestMove(lax, target).name;
  assert.notEqual(pick, 'Last Resort', `Last Resort must not be picked with unused siblings, got ${pick}`);
});

test('getBestMove: does not click Earthquake into an Earth Eater target (would heal the foe)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Scale Shot', 'Fire Fang', 'Swords Dance'] });
  const wall = mkMon({ species: 'Orthworm', ability: 'Earth Eater', moves: ['Iron Head', 'Body Press', 'Coil', 'Rest'] });
  setState(eng, { fActive: chomp, pActive: wall });
  const eq = chomp.moves.find(m => m.name === 'Earthquake');
  assert.equal(engine.aiEstimateDmg(chomp, wall, eq), 0, 'Earthquake vs Earth Eater must estimate 0');
  assert.notEqual(engine.getBestMove(chomp, wall).name, 'Earthquake', 'AI must not click EQ into Earth Eater');
});

test('getBestMove: treats an Air Balloon holder as Ground-immune', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const chomp = mkMon({ species: 'Garchomp', moves: ['Earthquake', 'Scale Shot', 'Fire Fang', 'Swords Dance'] });
  const heatran = mkMon({ species: 'Heatran', item: 'Air Balloon', moves: ['Magma Storm', 'Earth Power', 'Taunt', 'Protect'] });
  setState(eng, { fActive: chomp, pActive: heatran });
  const eq = chomp.moves.find(m => m.name === 'Earthquake');
  assert.equal(engine.aiEstimateDmg(chomp, heatran, eq), 0, 'Earthquake vs Air Balloon must estimate 0');
  assert.notEqual(engine.getBestMove(chomp, heatran).name, 'Earthquake', 'AI must not click EQ into Air Balloon');
});

test('getBestMove: does not use Spore into a sleep-immune ability', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const breloom = mkMon({ species: 'Breloom', moves: ['Spore', 'Mach Punch', 'Bullet Seed', 'Swords Dance'] });
  const insomniac = mkMon({ species: 'Noctowl', ability: 'Insomnia', moves: ['Hyper Voice', 'Roost', 'Defog', 'Heat Wave'] });
  setState(eng, { fActive: breloom, pActive: insomniac });
  assert.notEqual(engine.getBestMove(breloom, insomniac).name, 'Spore', 'AI must not Spore an Insomnia mon');
});

test('getBestMove: Spore is blocked by a Grass-type target (powder immunity, full block not a soft penalty)', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const breloom = mkMon({ species: 'Breloom', moves: ['Spore', 'Seed Bomb', 'Swords Dance', 'Protect'] });
  const grass = mkMon({ species: 'Cradily', moves: ['Recover', 'Giga Drain', 'Stealth Rock', 'Toxic'] });
  setState(eng, { fActive: breloom, pActive: grass });
  assert.notEqual(engine.getBestMove(breloom, grass).name, 'Spore', 'Spore must not be used on a Grass-type');
});

test('getBestMove: does not use a foe-targeting status move into Good as Gold', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const bliss = mkMon({ species: 'Blissey', moves: ['Will-O-Wisp', 'Flamethrower', 'Seismic Toss', 'Soft-Boiled'] });
  const gold = mkMon({ species: 'Gholdengo', ability: 'Good as Gold', moves: ['Shadow Ball', 'Nasty Plot', 'Recover', 'Thunderbolt'] });
  setState(eng, { fActive: bliss, pActive: gold });
  assert.notEqual(engine.getBestMove(bliss, gold).name, 'Will-O-Wisp', 'AI must not WoW into Good as Gold');
});

test('getBestMove: does not use Fake Out into a priority-blocking ability', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const mien = mkMon({ species: 'Mienshao', moves: ['Fake Out', 'Close Combat', 'U-turn', 'Knock Off'] });
  mien.fakeOutOk = true;
  const queen = mkMon({ species: 'Tsareena', ability: 'Queenly Majesty', moves: ['Power Whip', 'U-turn', 'Synthesis', 'Rapid Spin'] });
  setState(eng, { fActive: mien, pActive: queen, turnNumber: 1 });
  assert.notEqual(engine.getBestMove(mien, queen).name, 'Fake Out', 'Fake Out must not be picked vs Queenly Majesty');
});

test('getBestMove: does not use priority into Psychic Terrain vs a grounded target', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const dnite = mkMon({ species: 'Dragonite', moves: ['Extreme Speed', 'Dragon Claw', 'Roost', 'Dragon Dance'] });
  dnite.currentHp = Math.floor(dnite.maxHp * 0.3);
  const indeedee = mkMon({ species: 'Indeedee', moves: ['Expanding Force', 'Psychic', 'Calm Mind', 'Healing Wish'] });
  indeedee.currentHp = Math.floor(indeedee.maxHp * 0.25);
  setState(eng, { fActive: dnite, pActive: indeedee, terrain: 'Psychic' });
  assert.notEqual(engine.getBestMove(dnite, indeedee).name, 'Extreme Speed', 'Priority must not be used into Psychic Terrain');
});

test('getBestMove: a sleeping mon picks Sleep Talk instead of a move it cannot use', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const lax = mkMon({ species: 'Snorlax', moves: ['Rest', 'Sleep Talk', 'Body Slam', 'Crunch'] });
  lax.status = 'SLP'; lax.statusTurns = 0; lax.sleepDuration = 2;
  const skarm = mkMon({ species: 'Skarmory', moves: ['Spikes', 'Roost', 'Whirlwind', 'Brave Bird'] });
  setState(eng, { fActive: lax, pActive: skarm });
  const pick = engine.getBestMove(lax, skarm).name;
  assert.ok(pick === 'Sleep Talk' || pick === 'Snore', `Asleep mon must use Sleep Talk/Snore, got ${pick}`);
});

test('getBestMove: does not use Dream Eater on an awake target', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  const hypno = mkMon({ species: 'Hypno', moves: ['Dream Eater', 'Psychic', 'Protect', 'Nasty Plot'] });
  const slow = mkMon({ species: 'Slowbro', moves: ['Scald', 'Slack Off', 'Calm Mind', 'Psyshock'] });
  setState(eng, { fActive: hypno, pActive: slow });
  assert.notEqual(engine.getBestMove(hypno, slow).name, 'Dream Eater', 'Dream Eater must not be used on an awake target');
});

test('parseMoveEffects gate: Poltergeist fails against an itemless target', async () => {
  const eng = await loadEngine();
  const { mkMon, engine } = eng;
  pinRandom(eng);
  // Belch's precondition sibling — assert the AI precondition path zeroes Poltergeist vs no item.
  const gholdengo = mkMon({ species: 'Gholdengo', moves: ['Poltergeist', 'Make It Rain', 'Nasty Plot', 'Recover'] });
  const itemless = mkMon({ species: 'Furret', moves: ['Body Slam', 'Knock Off', 'U-turn', 'Coil'] });
  itemless.item = null;
  setState(eng, { fActive: gholdengo, pActive: itemless });
  assert.notEqual(engine.getBestMove(gholdengo, itemless).name, 'Poltergeist', 'Poltergeist must not be used vs an itemless target');
});
