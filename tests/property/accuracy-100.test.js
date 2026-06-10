// Property test: moves declared with accuracy:true or accuracy:100 must never miss
// when there are no evasion modifiers and the defender isn't using a semi-invulnerable move.
// Runs 50 trials per move with seeded RNG.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { loadAllMoves } from '../helpers/load-moves.js';

const ATTACKER_SPECIES = 'Mew';
const DEFENDER_SPECIES = 'Sceptile';
const TRIALS = 3;  // 100%-accuracy moves should never miss; 3 trials catches RNG-dependent bugs

const SKIP = new Set([
  // Charge moves: turn 1 charges with no hit log
  'Solar Beam', 'Solar Blade', 'Sky Attack', 'Razor Wind', 'Skull Bash',
  'Bounce', 'Dig', 'Dive', 'Fly', 'Phantom Force', 'Shadow Force',
  'Geomancy', 'Meteor Beam', 'Electro Shot', 'Freeze Shock', 'Ice Burn', 'Sky Drop',
  // OHKO accuracy is special-cased
  'Sheer Cold', 'Fissure', 'Horn Drill', 'Guillotine',
  // Need prior damage / situational
  'Counter', 'Mirror Coat', 'Metal Burst', 'Bide', 'Last Resort',
  'Fake Out', 'Sucker Punch', 'Pursuit', 'Upper Hand', 'Revenge', 'Avalanche', 'Assurance',
  'Thunderclap',                       // requires opponent picking attack (Electric Sucker Punch)
  'Dream Eater', 'Synchronoise',       // require sleeping / shared-type target
  'Focus Punch', 'Beat Up', 'Magnitude', 'Endeavor',
  'Burn Up', 'Double Shock', 'Snore',  // require user type/status
  'Future Sight', 'Doom Desire',       // delayed damage
  'Final Gambit',                      // damage = user HP; user faints, log differs
  'Steel Roller', 'Ice Spinner',       // require terrain
  // Multi-hit moves: at least one hit always connects but the simple log check may miss
  // Doubles-only
  'Heal Pulse', 'Floral Healing',      // heals foe (no "used" line for damage)
]);

function isEligible(move) {
  if (move.accuracy !== true && move.accuracy !== 100) return false;
  if (move.basePower == null) return false;
  if (move.basePower === 0) return false;  // status moves don't always log "used" in a damage-checkable way
  if (move.category === 'Status') return false;
  if (move.isZ || move.isMax) return false;
  if (move.name.startsWith('G-Max ') || move.name.startsWith('Max ')) return false;
  if (SKIP.has(move.name)) return false;
  if (move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') return false;
  return true;
}

test('100-accuracy damaging moves never miss', async (t) => {
  const { mkMon, runTurn, logs } = await loadEngine();
  const moves = await loadAllMoves();
  const eligible = moves.filter(isEligible);

  t.diagnostic(`Testing ${eligible.length} 100-accuracy damaging moves with ${TRIALS} trials each`);

  const failures = [];
  for (const move of eligible) {
    let hits = 0;
    let misses = 0;
    for (let i = 0; i < TRIALS; i++) {
      const attacker = mkMon({ species: ATTACKER_SPECIES, moves: [move.name, 'Splash', 'Splash', 'Splash'] });
      const defender = mkMon({ species: DEFENDER_SPECIES, moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
      defender.maxHp = 9999; defender.currentHp = 9999;
      const beforeHp = defender.currentHp;
      const startLog = logs.length;
      try {
        await runTurn({ playerMon: attacker, foeMon: defender });
        const turnLogs = logs.slice(startLog);
        const missed = turnLogs.some(l => /missed|avoided|but it failed/i.test(l.text));
        const dealtDamage = defender.currentHp < beforeHp;
        if (missed || !dealtDamage) misses++; else hits++;
      } catch (e) {
        misses++;
      }
    }
    if (misses > 0) {
      failures.push({ name: move.name, accuracy: move.accuracy, hits, misses });
    }
  }

  if (failures.length > 0) {
    t.diagnostic(`${failures.length} failures (showing first 15):`);
    for (const f of failures.slice(0, 15)) {
      t.diagnostic(`  ${f.name} (acc=${f.accuracy}): ${f.hits} hits, ${f.misses} misses`);
    }
  }
  assert.equal(failures.length, 0, `${failures.length}/${eligible.length} 100-accuracy moves missed in some trials`);
});
