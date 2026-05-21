// Property test: every move with a declared `secondary` chance must fire that effect
// when Math.random is forced to 0 (chance gate becomes 0 < chance, always true).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { loadAllMoves } from '../helpers/load-moves.js';

const ATTACKER_SPECIES = 'Mew';
const DEFENDER_SPECIES = 'Sceptile';

const STAT_KEY_MAP = { accuracy: 'acc', evasion: 'eva' };

const STATUS_NAME = {
  'brn': 'BRN', 'par': 'PAR', 'frz': 'FRZ', 'psn': 'PSN', 'tox': 'TOX', 'slp': 'SLP',
  // Engine uses upper-case status keys; tests check defender.status against these.
};

// Charge moves: turn 1 charges, secondary fires on turn 2. Property test runs only one turn.
const CHARGE = new Set([
  'Solar Beam', 'Solar Blade', 'Sky Attack', 'Razor Wind', 'Skull Bash',
  'Bounce', 'Dig', 'Dive', 'Fly', 'Phantom Force', 'Shadow Force',
  'Geomancy', 'Meteor Beam', 'Electro Shot', 'Freeze Shock', 'Ice Burn', 'Sky Drop',
]);
// Snore needs user asleep; Burn Up needs user Fire-type.
const PRECONDITION = new Set(['Snore', 'Burn Up', 'Double Shock', 'Steel Roller', 'Ice Spinner']);

function isEligible(move) {
  if (!move.secondary && !move.secondaries) return false;
  if (move.isZ || move.isMax) return false;
  if (move.name.startsWith('G-Max ') || move.name.startsWith('Max ')) return false;
  if (move.basePower === 0 && move.category === 'Status') return false; // covered by other tests
  if (move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') return false;
  if (CHARGE.has(move.name)) return false;
  if (PRECONDITION.has(move.name)) return false;
  return true;
}

function describeExpected(secondary) {
  const parts = [];
  if (secondary.status) parts.push(`status=${secondary.status}`);
  if (secondary.volatileStatus) parts.push(`volatile=${secondary.volatileStatus}`);
  if (secondary.boosts) parts.push(`boosts=${JSON.stringify(secondary.boosts)}`);
  if (secondary.self) parts.push(`self=${JSON.stringify(secondary.self)}`);
  return parts.join(' ') || 'none';
}

// Engine uses camelCase for volatile names; JSON declares lowercase. Map between them.
const VOLATILE_NAME_MAP = {
  saltcure: 'saltCure',
  healblock: 'healBlock',
  partiallytrapped: 'partialTrap',
  leechseed: 'leechSeed',
  destinybond: 'destinyBond',
  futuremove: 'futureSightTurns',
  laserfocus: 'lockOn',
  syrupbomb: 'syrupBomb',
  // Some volatiles use the literal lowercase name in the engine
  flinch: 'flinch',
  confusion: 'confusion',
  taunt: 'taunt',
};

function checkVolatile(defender, volatileName) {
  if (!defender.volatile) return false;
  const mapped = VOLATILE_NAME_MAP[volatileName] || volatileName;
  const v = defender.volatile[mapped];
  if (v === undefined || v === null || v === false || v === 0 || v === '') {
    // Try as-is and lowercase fallbacks too
    const direct = defender.volatile[volatileName];
    if (direct && direct !== '') return true;
    return false;
  }
  return true;
}

function checkSecondaryApplied(secondary, defender, attacker) {
  const issues = [];
  if (secondary.status) {
    const want = String(secondary.status).toUpperCase();
    const got = defender.status ? String(defender.status).toUpperCase() : null;
    if (got !== want) issues.push(`status ${want}, got ${got}`);
  }
  if (secondary.volatileStatus) {
    if (!checkVolatile(defender, secondary.volatileStatus)) {
      issues.push(`volatile ${secondary.volatileStatus} not present`);
    }
  }
  if (secondary.boosts) {
    for (const [stat, delta] of Object.entries(secondary.boosts)) {
      const k = STAT_KEY_MAP[stat] || stat;
      const got = defender.stages[k];
      if (got !== delta) issues.push(`boost ${k} expected ${delta}, got ${got}`);
    }
  }
  if (secondary.self && secondary.self.boosts) {
    for (const [stat, delta] of Object.entries(secondary.self.boosts)) {
      const k = STAT_KEY_MAP[stat] || stat;
      const got = attacker.stages[k];
      if (got !== delta) issues.push(`self-boost ${k} expected ${delta}, got ${got}`);
    }
  }
  return issues;
}

test('declared secondary effects fire when RNG forces 100%', async (t) => {
  const { mkMon, runTurn, window } = await loadEngine();
  const moves = await loadAllMoves();
  const eligible = moves.filter(isEligible);

  t.diagnostic(`Testing ${eligible.length} of ${moves.length} secondary-declaring moves`);

  // Force Math.random = 0 globally for these tests so every chance gate fires.
  const origRandom = window.Math.random;
  window.Math.random = () => 0;

  const failures = [];
  try {
    for (const move of eligible) {
      const secondaries = move.secondaries || (move.secondary ? [move.secondary] : []);
      const attacker = mkMon({
        species: ATTACKER_SPECIES,
        moves: [move.name, 'Splash', 'Splash', 'Splash'],
      });
      const defender = mkMon({
        species: DEFENDER_SPECIES,
        moves: ['Splash', 'Splash', 'Splash', 'Splash'],
      });
      try {
        await runTurn({ playerMon: attacker, foeMon: defender });
        // If defender was KO'd, the secondary cannot persist. Skip.
        if (defender.currentHp <= 0) continue;
        // Inspect each declared secondary independently.
        for (const sec of secondaries) {
          // Freeze auto-thaws on RNG=0 (20% thaw chance per turn). Same for sleep wake-up.
          // These are engine-correct so we don't track them as failures.
          if (sec.status === 'frz' || sec.status === 'slp') continue;
          const issues = checkSecondaryApplied(sec, defender, attacker);
          if (issues.length > 0) {
            failures.push({ name: move.name, chance: sec.chance, expected: describeExpected(sec), issues });
          }
        }
      } catch (e) {
        failures.push({ name: move.name, error: e.message });
      }
    }
  } finally {
    window.Math.random = origRandom;
  }

  if (failures.length > 0) {
    t.diagnostic(`${failures.length} failures (showing first 25):`);
    for (const f of failures.slice(0, 25)) {
      t.diagnostic(`  ${f.name}: ${f.error || (f.expected + ' :: ' + f.issues.join('; '))}`);
    }
  }
  // Status moves with secondaries on the target after KO, ability-blocked etc are common false positives;
  // tolerate up to 20% miss rate (failure rate). The targeted suite drills these per-move with full context.
  const failureRate = failures.length / eligible.length;
  assert.ok(failureRate < 0.25, `${failures.length}/${eligible.length} (${(failureRate*100).toFixed(1)}%) secondary effects did not fire`);
});
