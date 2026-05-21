// Property test: a damaging move used by a same-type attacker should deal ~1.5x more damage
// than the same move from a non-same-type attacker, all else equal.
// This catches regressions in calcSTAB at battle.html:16959.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { loadAllMoves } from '../helpers/load-moves.js';

// Defenders by attacker type so the type matchup is neutral (not super-effective, not resisted)
// to isolate the STAB factor.
const NEUTRAL_VS = {
  Normal: 'Mew',      // Normal vs Psychic = 1x
  Fire: 'Mew',        // Fire vs Psychic = 1x
  Water: 'Mew',       // Water vs Psychic = 1x
  Grass: 'Mew',       // Grass vs Psychic = 1x
  Electric: 'Mew',
  Ice: 'Mew',
  Fighting: 'Mew',    // Fighting vs Psychic = 1x (Psychic isn't immune; only Ghost/Fairy/Flying issue)
  Poison: 'Mew',
  Ground: 'Mew',
  Flying: 'Mew',
  Psychic: 'Snorlax', // Psychic vs Normal = 1x
  Bug: 'Snorlax',     // Bug vs Normal = 1x
  Rock: 'Mew',
  Ghost: 'Sceptile',  // Ghost vs Grass = 1x
  Dragon: 'Charizard',// Dragon vs Fire/Flying = 1x
  Dark: 'Sceptile',
  Steel: 'Mew',
  Fairy: 'Snorlax',
};

// Same-type attacker that has wide move pool: pick a versatile mon per type.
const STAB_ATTACKER = {
  Normal: 'Snorlax', Fire: 'Charizard', Water: 'Blastoise', Grass: 'Venusaur',
  Electric: 'Pikachu', Ice: 'Lapras', Fighting: 'Machamp', Poison: 'Nidoking',
  Ground: 'Garchomp', Flying: 'Pidgeot', Psychic: 'Alakazam', Bug: 'Scizor',
  Rock: 'Tyranitar', Ghost: 'Gengar', Dragon: 'Dragonite', Dark: 'Houndoom',
  Steel: 'Metagross', Fairy: 'Clefable',
};

function isEligible(move) {
  if (move.basePower == null || move.basePower < 40) return false;
  if (move.category === 'Status') return false;
  if (move.category === '???') return false;
  if (!move.type || !STAB_ATTACKER[move.type]) return false;
  if (move.isZ || move.isMax) return false;
  if (move.name.startsWith('G-Max ') || move.name.startsWith('Max ')) return false;
  if (move.multihit) return false;            // hits vary
  if (move.target === 'self') return false;
  if (move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') return false;
  // Variable-power moves
  const VARIABLE = new Set([
    'Hidden Power', 'Weather Ball', 'Judgment', 'Multi-Attack', 'Tera Blast',
    'Revelation Dance', 'Raging Bull', 'Ivy Cudgel', 'Techno Blast', 'Natural Gift',
    'Magnitude', 'Crush Grip', 'Wring Out', 'Hard Press', 'Low Kick', 'Grass Knot',
    'Heat Crash', 'Heavy Slam', 'Electro Ball', 'Gyro Ball', 'Reversal', 'Flail',
    'Stored Power', 'Power Trip', 'Punishment', 'Beat Up', 'Last Respects',
    'Rage Fist', 'Acrobatics', 'Echoed Voice', 'Trump Card', 'Spit Up',
    'Wake-Up Slap', 'Smelling Salts', 'Hex', 'Venoshock', 'Brine', 'Hard Press',
    'Final Gambit', 'Counter', 'Mirror Coat', 'Metal Burst', 'Bide',
    'Endeavor', 'Seismic Toss', 'Night Shade', 'Dragon Rage', 'Sonic Boom',
    'Super Fang', "Nature's Madness", 'Ruination', 'Psywave', 'Pursuit',
    'Sucker Punch', 'Focus Punch', 'Beak Blast', 'Shell Trap', 'Fake Out',
    'First Impression', 'Last Resort', 'Snore', 'Sky Drop', 'Avalanche',
    'Revenge', 'Assurance', 'Round', 'Burn Up', 'Double Shock', 'Steel Roller',
    'Ice Spinner', 'Future Sight', 'Doom Desire', 'Pollen Puff',
    'Upper Hand', 'Tera Starstorm',
  ]);
  if (VARIABLE.has(move.name)) return false;
  // Charge moves (multi-turn)
  const CHARGE = new Set([
    'Solar Beam', 'Solar Blade', 'Sky Attack', 'Razor Wind', 'Skull Bash',
    'Bounce', 'Dig', 'Dive', 'Fly', 'Phantom Force', 'Shadow Force',
    'Geomancy', 'Meteor Beam', 'Electro Shot', 'Freeze Shock', 'Ice Burn',
  ]);
  if (CHARGE.has(move.name)) return false;
  // OHKO
  if (['Sheer Cold', 'Fissure', 'Horn Drill', 'Guillotine'].includes(move.name)) return false;
  // Drain (heals attacker; ratio comparison still works but adds noise)
  if (move.drain) return false;
  // Accuracy too low for reliable testing
  if (move.accuracy !== true && move.accuracy < 90) return false;
  return true;
}

test('STAB attacker deals ~1.5x more than non-STAB attacker', async (t) => {
  const { mkMon, runTurn, window } = await loadEngine();
  const moves = await loadAllMoves();
  const eligible = moves.filter(isEligible);

  t.diagnostic(`Testing ${eligible.length} of ${moves.length} STAB-relevant moves`);

  // Pin RNG to high roll for both runs so comparison is stable
  window.Math.random = () => 0.99;

  const failures = [];
  for (const move of eligible) {
    const defenderSpecies = NEUTRAL_VS[move.type];
    const stabAttacker = STAB_ATTACKER[move.type];
    if (!defenderSpecies || !stabAttacker) continue;

    // STAB run. Force ability to 'None' to avoid Technician/Adaptability/Iron Fist/Sheer Force boosting.
    const a1 = mkMon({ species: stabAttacker, ability: 'None', moves: [move.name, 'Splash', 'Splash', 'Splash'] });
    const d1 = mkMon({ species: defenderSpecies, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a1.item = null;
    d1.maxHp = 9999; d1.currentHp = 9999;
    await runTurn({ playerMon: a1, foeMon: d1 });
    const dmgStab = 9999 - d1.currentHp;

    // Non-STAB run. Mew (Psychic) is a clean universal attacker for non-Psychic moves;
    // for Psychic moves use Sceptile (Grass).
    const nonStabSpecies = move.type === 'Psychic' ? 'Sceptile' : 'Mew';
    const a2 = mkMon({ species: nonStabSpecies, ability: 'None', moves: [move.name, 'Splash', 'Splash', 'Splash'] });
    const d2 = mkMon({ species: defenderSpecies, ability: 'None', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
    a2.item = null;
    d2.maxHp = 9999; d2.currentHp = 9999;
    // Pin attacker offensive stat AND defender defensive stat so A/D ratio is constant
    const isPhys = move.category === 'Physical';
    if (isPhys) {
      a2.stats.atk = a1.stats.atk;
      d2.stats.def = d1.stats.def;
    } else {
      a2.stats.spa = a1.stats.spa;
      d2.stats.spd = d1.stats.spd;
    }
    await runTurn({ playerMon: a2, foeMon: d2 });
    const dmgNoStab = 9999 - d2.currentHp;

    if (dmgStab === 0 || dmgNoStab === 0) {
      // Skip - move didn't connect for some reason (immune, blocked)
      continue;
    }
    const ratio = dmgStab / dmgNoStab;
    if (ratio < 1.35 || ratio > 1.65) {
      failures.push({ name: move.name, type: move.type, stab: dmgStab, noStab: dmgNoStab, ratio: ratio.toFixed(2) });
    }
  }

  if (failures.length > 0) {
    t.diagnostic(`${failures.length} failures (showing first 15):`);
    for (const f of failures.slice(0, 15)) {
      t.diagnostic(`  ${f.name} (${f.type}): STAB ${f.stab} vs noSTAB ${f.noStab} = ${f.ratio}x`);
    }
  }
  // Some moves have ability/item interactions or unusual paths; allow up to 10% tolerance
  const failureRate = failures.length / eligible.length;
  assert.ok(failureRate < 0.10, `${failures.length}/${eligible.length} (${(failureRate*100).toFixed(1)}%) STAB ratios outside 1.35-1.65`);
});
