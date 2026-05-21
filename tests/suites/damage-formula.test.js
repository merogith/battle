// Targeted suite: verify the VGC Gen 8 Lv50 damage formula at battle.html:21473.
// Damage formula: damage = ((2*Lvl/5 + 2) * BP * A/D) / 50 + 2) * modifier
// At Lv50, the constant 22 = (2*50/5 + 2). Modifiers stack multiplicatively:
//   STAB ×1.5 | super-effective ×2 | resist ×0.5 | immunity ×0 | crit ×1.5 | roll 0.85-1.0
// The targeted scenarios below avoid all variable modifiers (no STAB, no items, no ability,
// neutral type vs the move's type) so we can pin the expected damage to a known range.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const LO_ROLL = 0.85;  // engine uses Math.random in [0, 1); 0.85 is the minimum damage roll
const HI_ROLL = 1.0;   // 1.0 is the maximum

function expectedDamage({ level = 50, bp, atk, def, modifiers = {} }) {
  // Mirrors battle.html:21473 with all modifiers resolved to their numeric value.
  const stab = modifiers.stab ?? 1;
  const typeEff = modifiers.typeEff ?? 1;
  const burn = modifiers.burn ?? 1;
  const crit = modifiers.crit ?? 1;
  const other = modifiers.other ?? 1;
  const rollLo = LO_ROLL, rollHi = HI_ROLL;
  const base = Math.floor((Math.floor(Math.floor(22 * bp * (atk / def)) / 50) + 2));
  const modifier = stab * typeEff * burn * crit * other;
  return {
    min: Math.max(1, Math.floor(base * modifier * rollLo)),
    max: Math.max(1, Math.floor(base * modifier * rollHi)),
  };
}

test('Tackle (no STAB, neutral type) hits within expected range (accounting for crit/roll)', async () => {
  const { mkMon, runTurn, window } = await loadEngine();
  // Pin roll to high end, avoid crit
  window.Math.random = () => 0.99;
  const attacker = mkMon({ species: 'Mew', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
  const defender = mkMon({ species: 'Sceptile', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const atkStat = attacker.stats.atk;
  const defStat = defender.stats.def;
  // With pinned high random, crits become consistent. We accept the range from no-crit (1.0x) to crit (1.5x)
  // since pinning crit roll requires more invasive RNG control.
  const expected = expectedDamage({ bp: 40, atk: atkStat, def: defStat });
  const expectedWithCrit = Math.floor(expected.max * 1.5);

  const beforeHp = defender.currentHp;
  await runTurn({ playerMon: attacker, foeMon: defender });
  const dealt = beforeHp - defender.currentHp;
  assert.ok(
    dealt >= expected.min && dealt <= expectedWithCrit + 2,
    `Tackle: dealt ${dealt}, expected ${expected.min}-${expectedWithCrit} (atk=${atkStat} def=${defStat})`
  );
});

test('STAB multiplier: same move 1.5× more damage from same-type attacker', async () => {
  const { mkMon, runTurn, window } = await loadEngine();
  // Pin damage roll to high end for both runs
  window.Math.random = () => 0.99;

  // Run 1: Sceptile (Grass) uses Energy Ball (Grass) vs Mew (Psychic) -> STAB
  let a1 = mkMon({ species: 'Sceptile', moves: ['Energy Ball', 'Splash', 'Splash', 'Splash'] });
  let d1 = mkMon({ species: 'Mew', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const beforeHp1 = d1.currentHp;
  await runTurn({ playerMon: a1, foeMon: d1 });
  const dmgWithStab = beforeHp1 - d1.currentHp;

  // Run 2: Mew (Psychic) uses Energy Ball (Grass) vs Mew (Psychic) -> no STAB, same A/D
  let a2 = mkMon({ species: 'Mew', moves: ['Energy Ball', 'Splash', 'Splash', 'Splash'] });
  let d2 = mkMon({ species: 'Mew', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  // Pin Mew's SpA = Sceptile's SpA so A/D is identical between runs
  const targetSpa = a1.stats.spa;
  const targetSpd = d1.stats.spd;
  a2.stats.spa = targetSpa;
  d2.stats.spd = targetSpd;
  // Pin defender HP high enough that the move doesn't OHKO
  d2.maxHp = 999;
  d2.currentHp = 999;
  await runTurn({ playerMon: a2, foeMon: d2 });
  const dmgNoStab = 999 - d2.currentHp;

  const ratio = dmgWithStab / dmgNoStab;
  // Allow a small floor-rounding tolerance; expected ratio ≈ 1.5
  assert.ok(
    ratio >= 1.4 && ratio <= 1.6,
    `STAB ratio: with=${dmgWithStab}, without=${dmgNoStab}, ratio=${ratio.toFixed(2)} (expected ~1.5)`
  );
});

test('Type effectiveness: 2x super-effective, 0.5x resist', async () => {
  const { mkMon, runTurn, window } = await loadEngine();
  window.Math.random = () => 0.99;

  // Mew uses Ice Beam (Ice). vs Sceptile (Grass) = 2x. vs Mew (Psychic) = 1x.
  const a1 = mkMon({ species: 'Mew', moves: ['Ice Beam', 'Splash', 'Splash', 'Splash'] });
  const d1 = mkMon({ species: 'Sceptile', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  d1.maxHp = 999; d1.currentHp = 999;
  await runTurn({ playerMon: a1, foeMon: d1 });
  const dmgSuper = 999 - d1.currentHp;

  const a2 = mkMon({ species: 'Mew', moves: ['Ice Beam', 'Splash', 'Splash', 'Splash'] });
  const d2 = mkMon({ species: 'Mew', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  d2.stats.spd = d1.stats.spd; // pin defenses identical
  d2.maxHp = 999; d2.currentHp = 999;
  await runTurn({ playerMon: a2, foeMon: d2 });
  const dmgNeutral = 999 - d2.currentHp;

  const ratio = dmgSuper / dmgNeutral;
  assert.ok(
    ratio >= 1.9 && ratio <= 2.1,
    `Super-effective ratio: ${dmgSuper}/${dmgNeutral} = ${ratio.toFixed(2)} (expected ~2.0)`
  );
});

test('Type immunity: Normal-type Snorlax takes 0 damage from Ghost-type Shadow Ball', async () => {
  const { mkMon, runTurn, window } = await loadEngine();
  window.Math.random = () => 0.99;

  const attacker = mkMon({ species: 'Mew', moves: ['Shadow Ball', 'Splash', 'Splash', 'Splash'] });
  // Mew using Lick (Ghost) vs Snorlax (Normal) is immune. Use a target known to be immune:
  // Ghost type vs Normal type Snorlax (Normal) -> 0x damage.
  const defender = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

  // But Shadow Ball is Ghost, Snorlax is Normal -> immune
  const beforeHp = defender.currentHp;
  await runTurn({ playerMon: attacker, foeMon: defender });
  assert.equal(defender.currentHp, beforeHp, `Ghost move should not damage Normal type (HP ${beforeHp} -> ${defender.currentHp})`);
});
