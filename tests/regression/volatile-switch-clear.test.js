// Regression coverage for the volatile-status switch-clear / fail-after-switch bugs.
//
// Two root symptoms were proven before the fix and are guarded here:
//   1. Switch-sensitive volatiles (Taunt, Destiny Bond, Focus Energy, Curse, Aqua Ring,
//      Stockpile, Grudge, Embargo, ...) leaked onto the benched mon because
//      clearVolatileOnSwitch() never reset them.
//   2. The leak made a fresh application "fail when it should land" on the returning mon
//      (re-Taunt / re-Embargo / re-Destiny Bond tripped their already-applied guards).
//
// Also covers: the Destiny Bond consecutive-use leftover (non-switch), the makeVolatile()
// factory shape, and that Baton Pass still transfers passables while firing Regenerator
// and leaving no leak on the bench.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let E;
before(async () => { E = await loadEngine(); });

// Build a 2-mon player party (slot 0 active, slot 1 bench) + a single passive foe.
// The active player mon is pinned fast so its move resolves before the foe's.
function twoMonSetup({
  pMoves = ['Splash', 'Splash', 'Splash', 'Splash'],
  pAbility = 'None',
  pSpecies = 'Gengar',
  benchSpecies = 'Snorlax',
  foeSpecies = 'Pikachu',
} = {}) {
  const { engine, mkMon, reset } = E;
  reset();
  const a = mkMon({ species: pSpecies, ability: pAbility, moves: pMoves });
  const b = mkMon({ species: benchSpecies, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const foe = mkMon({ species: foeSpecies, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  a.stats.spe = 999;
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

const logTexts = (from) => E.logs.slice(from).map((l) => (l && l.text) || l).map(String);

describe('volatile clears on switch-out', () => {
  it('clears every leaked switch-sensitive volatile on the benched mon', async () => {
    const { a } = twoMonSetup();
    Object.assign(a.volatile, {
      taunt: 3, destinyBond: true, destinyBondUsedLast: true, focusEnergy: true,
      cursed: true, aquaRing: true, stockpile: 2, grudge: true, embargo: 5,
      micleBerry: true, defenseCurled: true, noRetreatUsed: true, furyCutterCount: 3,
      echoedVoiceCount: 2, metronomeCount: 4, metronomeLastMove: 'Tackle',
    });
    await E.window.playTurn(null, 1); // switch a -> b
    assert.equal(E.engine.state.pActive.name, 'Snorlax', 'switch happened');
    const v = a.volatile;
    assert.equal(v.taunt, 0, 'taunt');
    assert.equal(v.destinyBond, false, 'destinyBond');
    assert.equal(v.destinyBondUsedLast, false, 'destinyBondUsedLast');
    assert.equal(v.focusEnergy, false, 'focusEnergy');
    assert.equal(v.cursed, false, 'cursed');
    assert.equal(v.aquaRing, false, 'aquaRing');
    assert.equal(v.stockpile, 0, 'stockpile');
    assert.equal(v.grudge, false, 'grudge');
    assert.equal(v.embargo, 0, 'embargo');
    assert.equal(v.micleBerry, false, 'micleBerry');
    assert.equal(v.defenseCurled, false, 'defenseCurled');
    assert.equal(v.noRetreatUsed, false, 'noRetreatUsed');
    assert.equal(v.furyCutterCount, 0, 'furyCutterCount');
    assert.equal(v.echoedVoiceCount, 0, 'echoedVoiceCount');
    assert.equal(v.metronomeCount, 0, 'metronomeCount');
    assert.equal(v.metronomeLastMove, null, 'metronomeLastMove');
  });

  it('still clears Encore (regression guard — this one was always correct)', async () => {
    const { a } = twoMonSetup();
    Object.assign(a.volatile, { encore: 3, encoreMove: 'Splash', lastMoveUsed: 'Splash' });
    await E.window.playTurn(null, 1);
    assert.equal(a.volatile.encore, 0);
    assert.equal(a.volatile.encoreMove, null);
  });
});

describe('Destiny Bond', () => {
  it('can be re-used after a switch round-trip (fails-when-should-land is fixed)', async () => {
    const { a } = twoMonSetup({ pMoves: ['Destiny Bond', 'Splash', 'Splash', 'Splash'] });
    await E.window.playTurn(0, null);                 // T1: use Destiny Bond
    assert.equal(a.volatile.destinyBondUsedLast, true, 'armed after first use');
    await E.window.playTurn(null, 1);                 // T2: switch out
    assert.equal(a.volatile.destinyBondUsedLast, false, 'consecutive tracker reset by switch');
    assert.equal(a.volatile.destinyBond, false, 'bond cleared by switch');
    await E.window.playTurn(null, 0);                 // T3: switch back in
    const from = E.logs.length;
    await E.window.playTurn(0, null);                 // T4: use Destiny Bond again
    const logs = logTexts(from);
    assert.ok(!logs.some((t) => t.includes('But it failed')), 'Destiny Bond should land after a switch');
    assert.equal(a.volatile.destinyBond, true, 're-armed');
  });

  it('disarms the prior bond when a failed consecutive use occurs (no wrongful co-faint)', async () => {
    const { a } = twoMonSetup({ pMoves: ['Destiny Bond', 'Splash', 'Splash', 'Splash'] });
    await E.window.playTurn(0, null);                 // T1: success
    assert.equal(a.volatile.destinyBond, true);
    const from = E.logs.length;
    await E.window.playTurn(0, null);                 // T2: consecutive -> fails
    assert.ok(logTexts(from).some((t) => t.includes('But it failed')), 'consecutive use fails');
    assert.equal(a.volatile.destinyBond, false, 'prior bond disarmed because the user acted again');
    assert.equal(a.volatile.destinyBondUsedLast, false);
  });
});

describe('makeVolatile() factory', () => {
  it('returns the full schema with an independent moveHistory array per mon', () => {
    const m1 = E.mkMon({ species: 'Pikachu' });
    const m2 = E.mkMon({ species: 'Pikachu' });
    assert.notEqual(m1.volatile, m2.volatile, 'distinct volatile objects');
    assert.notEqual(m1.volatile.moveHistory, m2.volatile.moveHistory, 'moveHistory not shared');
    m1.volatile.moveHistory.push('Tackle');
    assert.equal(m2.volatile.moveHistory.length, 0, 'mutation does not bleed across mons');
    for (const [k, v] of Object.entries({ taunt: 0, destinyBond: false, focusEnergy: false, perishCount: -1, embargo: 0, stockpile: 0, cursed: false })) {
      assert.equal(m1.volatile[k], v, `default for ${k}`);
    }
    // Wish and Future Sight were migrated to side storage — they must NOT be volatile fields.
    for (const k of ['wishHp', 'wishTurns', 'futureSightTurns', 'futureSightDmg', 'futureSightName']) {
      assert.equal(k in m1.volatile, false, `${k} should no longer live on the mon volatile`);
    }
  });
});

describe('Future Sight (side-stored, redirects on switch)', () => {
  function fsSetup(foeMons) {
    const { engine, mkMon, reset } = E;
    reset();
    const a = mkMon({ species: 'Alakazam', ability: 'None', moves: ['Future Sight', 'Splash', 'Splash', 'Splash'] });
    const foes = foeMons.map((sp) => mkMon({ species: sp, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] }));
    a.stats.spe = 999;
    engine.state.mode = 'pve';
    engine.state.playerParty = [a];
    engine.state.foeParty = foes;
    engine.state.pActive = a;
    engine.state.fActive = foes[0];
    engine.state.isOver = false;
    engine.state.isLocked = false;
    engine.setForcedFoeMoveSlot(0);
    return { a, foes };
  }

  it('is stored on the targeted side, not on any mon volatile', async () => {
    const { a, foes } = fsSetup(['Snorlax']);
    await E.window.playTurn(0, null); // cast Future Sight at the foe
    assert.equal(E.engine.state.fSide.futureSightTurns, 2, 'stored on the foe side (ticked once at EoT)');
    assert.equal('futureSightTurns' in a.volatile, false, 'not on the caster');
    assert.equal('futureSightTurns' in foes[0].volatile, false, 'not on the target mon');
  });

  it('strikes whoever is active on that side when it lands — not the original target', async () => {
    const { a, foes } = fsSetup(['Snorlax', 'Blissey']);
    const [f1, f2] = foes;
    await E.window.playTurn(0, null);            // cast (counter 3 -> 2)
    E.engine.state.fActive = f2;                 // original target switched out; replacement is active
    const f1hp = f1.currentHp, f2hp = f2.currentHp;
    await E.window.playTurn(1, null);            // Splash (2 -> 1)
    await E.window.playTurn(1, null);            // Splash (1 -> 0): Future Sight resolves
    assert.equal(E.engine.state.fSide.futureSightTurns, 0, 'resolved');
    assert.ok(f2.currentHp < f2hp, 'the active replacement took the Future Sight hit');
    assert.equal(f1.currentHp, f1hp, 'the original (now benched) target was not hit');
  });
});

describe('Baton Pass', () => {
  it('transfers passables + stages, fires Regenerator, and leaves no leak on the outgoing mon', async () => {
    const { a, b } = twoMonSetup({ pMoves: ['Baton Pass', 'Splash', 'Splash', 'Splash'], pAbility: 'Regenerator' });
    a.currentHp = Math.floor(a.maxHp / 2);
    const hpBefore = a.currentHp;
    a.volatile.focusEnergy = true;   // passable -> should land on b
    a.volatile.leechSeed = true;     // passable (canon set) -> should land on b
    a.volatile.torment = true;       // NOT passable -> cleared on a, absent on b
    a.stages.atk = 2;                // stages transfer
    await E.window.playTurn(0, null);
    assert.equal(E.engine.state.pActive, b, 'b is now active');
    assert.equal(b.volatile.focusEnergy, true, 'focusEnergy passed to incoming mon');
    assert.equal(b.volatile.leechSeed, true, 'Leech Seed passed (expanded canon set)');
    assert.equal(b.stages.atk, 2, 'stat stages passed');
    assert.equal(b.volatile.torment, false, 'non-passable Torment not transferred');
    assert.equal(a.volatile.torment, false, 'outgoing mon Torment cleared (no bench leak)');
    assert.equal(a.volatile.focusEnergy, false, 'outgoing mon volatile cleared');
    assert.ok(a.currentHp > hpBefore, 'Regenerator healed the Baton Passer on switch-out');
  });
});
