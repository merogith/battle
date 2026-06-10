// Direct in-house assertions for the Stage-1 engine fixes that the differential
// oracle can't cleanly cover on its own:
//
//   - finding #3 (Gravity): Gravity-banned moves must fail outright. The differential
//     can't assert this because Showdown rejects the illegal *choice* and substitutes
//     a default move, so the two engines diverge for a reason unrelated to the gate.
//   - finding #4 (Facade): a burned Facade keeps its ×2 (the burn Attack-drop is
//     exempted). The damage sweep verifies this too, but the sweep is a standalone
//     script, not part of `npm test` — so this locks the fix into CI.
//
// Reference for both: tests/differential/FINDINGS.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;

// Full neutral field-state a real battle sets at start (mirrors inhouse-oracle.mjs);
// playTurn needs these so held items / field checks behave.
function setup(p, f, { gravity = 0 } = {}) {
  eng.reset();
  const st = eng.engine.state;
  Object.assign(st, {
    pActive: p, fActive: f, playerParty: [p], foeParty: [f], mode: 'pve',
    turnNumber: 0, isOver: false, isLocked: false, weather: null, weatherTurns: 0,
    terrain: null, terrainTurns: 0, trickRoom: 0, gravity, magicRoom: 0,
    mudSport: 0, waterSport: 0, wonderRoom: 0,
  });
  const side = {
    stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0,
    lightScreen: 0, auroraVeil: 0, wishHp: 0, wishTurns: 0, safeguard: 0, mist: 0,
    tailwind: 0, luckychant: 0,
  };
  st.pSide = { ...side };
  st.fSide = { ...side };
}

// Player uses `playerMove`; the foe uses a Gravity-legal move (Defense Curl) so the
// foe's own action never confounds the "blocked" check.
async function useMove(playerMove, { gravity = 0 } = {}) {
  const p = eng.mkMon({ species: 'Pelipper', ability: 'Keen Eye', moves: [playerMove, 'Water Gun'], nature: 'Modest', evs: { spa: 252 } });
  const f = eng.mkMon({ species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'], nature: 'Impish', evs: { hp: 252, def: 252 } });
  setup(p, f, { gravity });
  const start = eng.logs.length;
  eng.engine.setForcedFoeMoveSlot(0);
  await W.playTurn(0, null);
  return { p, f, logs: eng.logs.slice(start).map((l) => l.text) };
}

test('finding #3: Gravity blocks ground-defying moves; legal moves are unaffected', async () => {
  for (const mv of ['Splash', 'Fly', 'Magnet Rise', 'Telekinesis', 'Jump Kick', 'Bounce']) {
    const { p, logs } = await useMove(mv, { gravity: 5 });
    assert.ok(logs.some((l) => /because of gravity/i.test(l)),
      `${mv} should be refused under Gravity (logs: ${logs.join(' | ')})`);
    assert.equal(p.volatile.charging, null, `${mv} must not be left mid-charge under Gravity`);
  }
  // Control 1: a legal move works under Gravity (deals damage, not blocked).
  const ctrl = await useMove('Water Gun', { gravity: 5 });
  assert.ok(!ctrl.logs.some((l) => /Pelipper can't use/i.test(l)), 'Water Gun must not be Gravity-blocked');
  assert.ok(ctrl.f.maxHp - ctrl.f.currentHp > 0, 'Water Gun should deal damage under Gravity');
  // Control 2: without Gravity, Fly charges normally.
  const noGrav = await useMove('Fly', { gravity: 0 });
  assert.equal(noGrav.p.volatile.charging, 'Fly', 'Fly should charge normally without Gravity');
});

test('finding #2: Stakeout ×2 vs a freshly-switched-in target, but NOT vs a turn-1 lead', async () => {
  // The FOE is the Stakeout attacker; the player's target is either the lead or a
  // mon switched in on turn 1. A target that just switched in is "fresh" (×2); a lead
  // is not. Average over rolls.
  async function foeStakeoutDmg({ switchIn }) {
    let total = 0;
    const N = 8;
    for (let i = 0; i < N; i++) {
      eng.seedRng(200 + i);
      const filler = eng.mkMon({ species: 'Pidgey', ability: 'Keen Eye', moves: ['Splash', 'Splash'], nature: 'Hardy' });
      const target = eng.mkMon({ species: 'Snorlax', ability: 'Thick Fat', moves: ['Splash', 'Splash'], nature: 'Impish', evs: { hp: 252, def: 252 } });
      const attacker = eng.mkMon({ species: 'Bisharp', ability: 'Stakeout', moves: ['Strength', 'Splash'], nature: 'Adamant', evs: { atk: 252 } });
      const party = switchIn ? [filler, target] : [target];
      const lead = switchIn ? filler : target;
      eng.reset();
      Object.assign(eng.engine.state, {
        playerParty: party, foeParty: [attacker], pActive: lead, fActive: attacker, mode: 'pve',
        turnNumber: 0, isOver: false, isLocked: false, weather: null, weatherTurns: 0,
        terrain: null, terrainTurns: 0, trickRoom: 0, gravity: 0, magicRoom: 0, mudSport: 0, waterSport: 0, wonderRoom: 0,
      });
      const side = { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0, auroraVeil: 0, wishHp: 0, wishTurns: 0, safeguard: 0, mist: 0, tailwind: 0, luckychant: 0 };
      eng.engine.state.pSide = { ...side };
      eng.engine.state.fSide = { ...side };
      eng.engine.setForcedFoeMoveSlot(0); // foe uses Strength (Stakeout attack)
      const before = target.currentHp;
      if (switchIn) await W.playTurn(null, 1); // player switches to target this turn
      else await W.playTurn(0, null);          // player (target) Splashes
      total += before - target.currentHp;
    }
    return total / N;
  }
  const lead = await foeStakeoutDmg({ switchIn: false });
  const fresh = await foeStakeoutDmg({ switchIn: true });
  const ratio = fresh / lead;
  assert.ok(ratio > 1.7 && ratio < 2.3,
    `Stakeout should ×2 a freshly-switched-in target but not a lead; got lead=${lead.toFixed(1)} switch-in=${fresh.toFixed(1)} ratio=${ratio.toFixed(2)}`);
});

test('finding #4: a burned Facade keeps its ×2 (burn Attack-drop exempted)', async () => {
  // Facade damage to a fixed wall, burned vs unburned, averaged over several damage
  // rolls. Burned Facade is ×2 (status boost) with NO burn halving → ~2× unburned.
  async function facadeMeanDmg(burned) {
    let total = 0;
    const N = 8;
    for (let i = 0; i < N; i++) {
      eng.seedRng(100 + i);
      const p = eng.mkMon({ species: 'Snorlax', ability: 'Limber', moves: ['Facade', 'Splash'], nature: 'Adamant', evs: { atk: 252 } });
      if (burned) p.status = 'BRN';
      const f = eng.mkMon({ species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'], nature: 'Impish', evs: { hp: 252, def: 252 } });
      setup(p, f);
      eng.engine.setForcedFoeMoveSlot(0);
      const before = f.currentHp;
      await W.playTurn(0, null);
      total += before - f.currentHp;
    }
    return total / N;
  }
  const burned = await facadeMeanDmg(true);
  const clean = await facadeMeanDmg(false);
  const ratio = burned / clean;
  assert.ok(ratio > 1.7 && ratio < 2.3,
    `burned Facade should be ~2× unburned (burn drop exempted); got burned=${burned.toFixed(1)} clean=${clean.toFixed(1)} ratio=${ratio.toFixed(2)}`);
});

// Generic single-turn driver: the player uses move-slot 0; the foe uses a forced slot.
// `player`/`foe` are mkMon configs; an extra `foe.status` (e.g. 'SLP') is applied post-build.
async function run({ player, foe, foeSlot = 0, seed = 909 }) {
  eng.seedRng(seed);
  const p = eng.mkMon(player);
  const f = eng.mkMon(foe);
  if (foe.status) f.status = foe.status;
  setup(p, f);
  const start = eng.logs.length;
  eng.engine.setForcedFoeMoveSlot(foeSlot);
  await W.playTurn(0, null);
  return { p, f, logs: eng.logs.slice(start).map((l) => l.text) };
}

// ── ISSUE-055: the generic boost block must not swallow a move's extra effect ──
// Each of these moves carries a `boosts` data field AND a named branch that adds a
// second effect (faint / status / confusion / trap). Pre-fix the block's
// `if (applied > 0) return;` fired first and the second effect was silently lost, so
// these assertions target the second effect specifically.

test('ISSUE-055: Memento drops foe Atk/SpA AND faints the user', async () => {
  const { p, f } = await run({
    player: { species: 'Pelipper', ability: 'Keen Eye', moves: ['Memento', 'Water Gun'] },
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'] },
  });
  assert.equal(p.currentHp, 0, 'Memento must faint the user');
  assert.equal(f.stages.atk, -2, 'Memento must drop the foe Attack by 2');
  assert.equal(f.stages.spa, -2, 'Memento must drop the foe Sp. Atk by 2');
});

test('ISSUE-055: Toxic Thread drops foe Speed AND poisons it', async () => {
  const { f } = await run({
    player: { species: 'Pelipper', ability: 'Keen Eye', moves: ['Toxic Thread', 'Water Gun'] },
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'] },
  });
  assert.equal(f.stages.spe, -1, 'Toxic Thread must drop the foe Speed by 1');
  assert.equal(f.status, 'PSN', 'Toxic Thread must poison the foe');
});

test('ISSUE-055: Swagger raises foe Atk AND confuses it', async () => {
  const { f } = await run({
    player: { species: 'Pelipper', ability: 'Keen Eye', moves: ['Swagger', 'Water Gun'] },
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'] },
  });
  assert.equal(f.stages.atk, 2, 'Swagger must raise the foe Attack by 2');
  assert.ok(f.volatile.confusion > 0, 'Swagger must confuse the foe');
});

test('ISSUE-055: No Retreat raises all the user\'s stats AND traps it', async () => {
  const { p } = await run({
    player: { species: 'Pelipper', ability: 'Keen Eye', moves: ['No Retreat', 'Water Gun'] },
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'] },
  });
  for (const s of ['atk', 'def', 'spa', 'spd', 'spe']) {
    assert.equal(p.stages[s], 1, `No Retreat must raise the user's ${s} by 1`);
  }
  assert.equal(p.volatile.trapped, true, 'No Retreat must trap the user');
});

// ── ISSUE-186: three moves were missing their fail-precondition ──

test('ISSUE-186: Dream Eater fails on an awake target, connects on a sleeping one', async () => {
  const awake = await run({
    player: { species: 'Pelipper', ability: 'Keen Eye', moves: ['Dream Eater', 'Water Gun'] },
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'] },
  });
  assert.ok(awake.logs.some((l) => /isn't asleep/i.test(l)), `Dream Eater should fail vs an awake foe (logs: ${awake.logs.join(' | ')})`);
  assert.equal(awake.f.currentHp, awake.f.maxHp, 'Dream Eater must deal 0 to an awake foe');

  const asleep = await run({
    player: { species: 'Pelipper', ability: 'Keen Eye', moves: ['Dream Eater', 'Water Gun'] },
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'], status: 'SLP' },
  });
  assert.ok(asleep.f.maxHp - asleep.f.currentHp > 0, 'Dream Eater must damage a sleeping foe');
});

test('ISSUE-186: Synchronoise fails on a no-shared-type target, hits a shared-type one', async () => {
  const noShare = await run({
    player: { species: 'Abra', ability: 'Inner Focus', moves: ['Synchronoise', 'Shadow Ball'] }, // Psychic
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Defense Curl'] },   // Normal
  });
  assert.ok(noShare.logs.some((l) => /it failed/i.test(l)), `Synchronoise should fail vs a non-shared-type foe (logs: ${noShare.logs.join(' | ')})`);
  assert.equal(noShare.f.currentHp, noShare.f.maxHp, 'Synchronoise must deal 0 to a non-shared-type foe');

  const share = await run({
    player: { species: 'Abra', ability: 'Inner Focus', moves: ['Synchronoise', 'Shadow Ball'] }, // Psychic
    foe: { species: 'Drowzee', ability: 'Insomnia', moves: ['Defense Curl', 'Defense Curl'] },    // Psychic
  });
  assert.ok(share.f.maxHp - share.f.currentHp > 0, 'Synchronoise must hit a shared-type foe');
});

test('ISSUE-186: Thunderclap fails when the target picks a status move, hits when it attacks', async () => {
  // Foe slot 0 = Defense Curl (Status) → Thunderclap fails; slot 0 = Tackle (damaging) → hits.
  const vsStatus = await run({
    player: { species: 'Pelipper', ability: 'Keen Eye', moves: ['Thunderclap', 'Water Gun'] },
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Tackle'] },
    foeSlot: 0,
  });
  assert.ok(vsStatus.logs.some((l) => /it failed/i.test(l)), `Thunderclap should fail vs a status-selecting foe (logs: ${vsStatus.logs.join(' | ')})`);
  assert.equal(vsStatus.f.currentHp, vsStatus.f.maxHp, 'Thunderclap must deal 0 vs a status-selecting foe');

  const vsAttack = await run({
    player: { species: 'Pelipper', ability: 'Keen Eye', moves: ['Thunderclap', 'Water Gun'] },
    foe: { species: 'Snorlax', ability: 'Thick Fat', moves: ['Defense Curl', 'Tackle'] },
    foeSlot: 1,
  });
  assert.ok(vsAttack.f.maxHp - vsAttack.f.currentHp > 0, 'Thunderclap must hit a foe that selected a damaging move');
});
