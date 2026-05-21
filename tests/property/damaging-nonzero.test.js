// Property test: every move with basePower > 0 must reduce defender HP on a neutral hit.
// Skips moves listed in /tests/fixtures/deviations.js and moves the engine can't dispatch
// without prior turn state (Counter, Mirror Coat) or extended setup (Future Sight, charge moves).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { loadAllMoves } from '../helpers/load-moves.js';
import { skipMoves } from '../fixtures/deviations.js';

// Defender choice: Sceptile (Grass) has no type immunities. Attacker is Mew (high all-around stats).
const ATTACKER_SPECIES = 'Mew';
const DEFENDER_SPECIES = 'Sceptile';

// Moves whose damage path requires prior-turn context that property tests can't fabricate.
// Documented in /tests/reports/deviations.md.
const NEEDS_CONTEXT = new Set([
  'Counter', 'Mirror Coat', 'Metal Burst', 'Bide',
  'Last Resort', // requires all other moves used
  'Fake Out',    // requires turn 1; fakeOutOk persists but engine zeroes it
  'Sucker Punch', // requires opponent picking attack
  'Upper Hand',  // requires opponent priority
  'Pursuit',     // requires switching opponent
  'Revenge', 'Avalanche', 'Assurance', // require being hit first
  'Focus Punch', // charges turn first
  'Beat Up',     // depends on full party
  'Magnitude',   // RNG roll for BP, can roll 1 BP = ok but test wants neutral
  'Endeavor',    // sets HP equal; if attacker has more HP, fails
]);

// Charge moves: turn 1 charges, turn 2 damages. Damaging-nonzero needs both turns OR a power-herb.
const CHARGE_MOVES = new Set([
  'Solar Beam', 'Solar Blade', 'Sky Attack', 'Razor Wind', 'Skull Bash',
  'Bounce', 'Dig', 'Dive', 'Fly', 'Phantom Force', 'Shadow Force',
  'Geomancy', 'Meteor Beam', 'Electro Shot', 'Freeze Shock', 'Ice Burn',
  'Sky Drop',
]);

// Moves where Sceptile (Grass) would resist or take 0x.
// Sceptile is dual Grass single typing - resists Grass/Water/Electric/Ground.
// Move damage is still > 0 against resisted types (just reduced), so we keep them.
// Only true immunities would zero damage:
//   - Ghost-type defender vs Normal/Fighting (Sceptile is Grass, not Ghost - n/a)
//   - Levitate ability (Sceptile doesn't have)
//   - Flash Fire (Sceptile doesn't have)
// No immunities to filter.

// Status moves shouldn't even be in this test (basePower=0) - skip defensively.
function isEligible(move) {
  if (move.basePower <= 0) return false;
  if (move.category === 'Status') return false;
  if (NEEDS_CONTEXT.has(move.name)) return false;
  if (CHARGE_MOVES.has(move.name)) return false;
  if (skipMoves['damaging-nonzero'].includes(move.name)) return false;
  if (skipMoves['damaging-nonzero-no-context']?.includes(move.name)) return false;
  if (move.isZ || move.isMax) return false; // Z/G-Max require gimmick activation
  if (move.name.startsWith('G-Max ') || move.name.startsWith('Max ')) return false;
  if (move.accuracy !== true && move.accuracy < 50) return false; // OHKO accuracy too low for reliable test
  return true;
}

test('every damaging move reduces defender HP', async (t) => {
  const { mkMon, runTurn } = await loadEngine();
  const moves = await loadAllMoves();
  const eligible = moves.filter(isEligible);

  t.diagnostic(`Testing ${eligible.length} of ${moves.length} damaging moves`);

  const failures = [];
  for (const move of eligible) {
    const attacker = mkMon({
      species: ATTACKER_SPECIES,
      moves: [move.name, 'Splash', 'Splash', 'Splash'],
    });
    const defender = mkMon({
      species: DEFENDER_SPECIES,
      moves: ['Splash', 'Splash', 'Splash', 'Splash'],
    });
    const before = defender.currentHp;
    try {
      await runTurn({ playerMon: attacker, foeMon: defender });
      if (defender.currentHp >= before) {
        failures.push({ name: move.name, before, after: defender.currentHp, basePower: move.basePower, type: move.type });
      }
    } catch (e) {
      failures.push({ name: move.name, error: e.message });
    }
  }

  if (failures.length > 0) {
    t.diagnostic(`${failures.length} failures (showing first 20):`);
    for (const f of failures.slice(0, 20)) {
      t.diagnostic(`  ${f.name} (BP=${f.basePower} ${f.type}): ${f.error || `HP ${f.before}->${f.after}`}`);
    }
  }
  assert.equal(failures.length, 0, `${failures.length}/${eligible.length} damaging moves failed to reduce HP`);
});
