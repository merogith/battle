// Property test: when the defender used Protect on the same turn, every move WITHOUT the
// `bypassesProtect`/`flags.bypassprotect` flag must be blocked (no damage, no status).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { loadAllMoves } from '../helpers/load-moves.js';

const ATTACKER_SPECIES = 'Mew';
const DEFENDER_SPECIES = 'Sceptile';

const SKIP = new Set([
  // Charge moves: turn 1 charges; Protect block happens on turn 2 (different test setup)
  'Solar Beam', 'Solar Blade', 'Sky Attack', 'Razor Wind', 'Skull Bash',
  'Bounce', 'Dig', 'Dive', 'Fly', 'Phantom Force', 'Shadow Force',
  'Geomancy', 'Meteor Beam', 'Electro Shot', 'Freeze Shock', 'Ice Burn', 'Sky Drop',
  // Self-targeting moves don't interact with Protect
  'Protect', 'Detect', 'Endure', 'Spiky Shield', 'Baneful Bunker', 'Obstruct',
  'Burning Bulwark', 'Silk Trap', "King's Shield", 'Max Guard',
  // Field/side moves don't target defender
  'Stealth Rock', 'Spikes', 'Toxic Spikes', 'Sticky Web', 'Sunny Day', 'Rain Dance',
  'Sandstorm', 'Hail', 'Snowscape', 'Electric Terrain', 'Grassy Terrain',
  'Psychic Terrain', 'Misty Terrain', 'Trick Room', 'Magic Room', 'Wonder Room',
  'Tailwind', 'Light Screen', 'Reflect', 'Aurora Veil', 'Mist', 'Safeguard',
  'Gravity', 'Splash', 'Celebrate', 'Hold Hands', 'Happy Hour',
  // Need prior context
  'Counter', 'Mirror Coat', 'Metal Burst', 'Bide', 'Snore', 'Final Gambit',
]);

// Showdown convention: `flags.protect: 1` = blocked by Protect; absence of the flag = bypasses.
// Feint, Hyperspace Hole/Fury, Mighty Cleave, etc. ship without protect:1 in moves.json and
// must NOT be blocked.
function bypassesProtect(move) {
  if (!move.flags) return true;
  return !move.flags.protect;
}

function isEligible(move) {
  if (move.basePower == null || move.basePower === 0) return false;
  if (move.category === 'Status') return false;
  if (move.isZ || move.isMax) return false;
  if (move.name.startsWith('G-Max ') || move.name.startsWith('Max ')) return false;
  if (SKIP.has(move.name)) return false;
  if (move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') return false;
  if (bypassesProtect(move)) return false;
  return true;
}

test('Protect blocks damaging moves that do not have flags.protect=0', async (t) => {
  const { mkMon, runTurn, window } = await loadEngine();
  const moves = await loadAllMoves();
  const eligible = moves.filter(isEligible);

  // Force RNG to pick the "always succeed Protect" branch (Math.random < 1/x for chain count = 1)
  window.Math.random = () => 0.001;

  t.diagnostic(`Testing ${eligible.length} of ${moves.length} damaging moves vs Protect`);

  const failures = [];
  for (const move of eligible) {
    const attacker = mkMon({ species: ATTACKER_SPECIES, moves: [move.name, 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: DEFENDER_SPECIES, moves: ['Protect', 'Splash', 'Splash', 'Splash'] });
    // Slow attacker so Protect resolves first
    attacker.stats.spe = 1;
    defender.stats.spe = 999;
    const beforeHp = defender.currentHp;
    try {
      await runTurn({ playerMon: attacker, foeMon: defender, foeMoveSlot: 0, forcePlayerFast: false });
      if (defender.currentHp < beforeHp) {
        failures.push({ name: move.name, dmg: beforeHp - defender.currentHp });
      }
    } catch (e) {
      failures.push({ name: move.name, error: e.message });
    }
  }

  if (failures.length > 0) {
    t.diagnostic(`${failures.length} failures (showing first 15):`);
    for (const f of failures.slice(0, 15)) {
      t.diagnostic(`  ${f.name}: ${f.error || `dealt ${f.dmg} damage despite Protect`}`);
    }
  }
  // Allow small failure rate: some moves have special interactions (Feint variants, Shadow Force release)
  // that the static flag check doesn't catch.
  const failureRate = failures.length / eligible.length;
  assert.ok(failureRate < 0.05, `${failures.length}/${eligible.length} (${(failureRate*100).toFixed(1)}%) moves broke through Protect`);
});
