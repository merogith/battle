// Property test: every status move (basePower=0, category=Status) must NOT change defender HP
// after a single use, EXCEPT moves whose declared behavior is HP transfer (Pain Split, Endeavor).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { loadAllMoves } from '../helpers/load-moves.js';
import { skipMoves } from '../fixtures/deviations.js';

const ATTACKER_SPECIES = 'Mew';
const DEFENDER_SPECIES = 'Sceptile';

const HP_TOUCHING = new Set([
  ...skipMoves['status-no-damage'],
  'Healing Wish', 'Lunar Dance', // attacker faints; foe untouched
  'Self-Destruct', 'Explosion', 'Misty Explosion', // attacker faints, deal damage actually (basePower > 0; not in this test)
  'Memento', // attacker faints
  'Belly Drum', // user halves own HP
  'Substitute', 'Curse', // attacker pays HP
  'Healing Wish', 'Wish', // ally healing
  'Pollen Puff', // damages foe, heals ally (basePower > 0 normally; gen 9 ambiguous)
  'Heal Pulse', // heals foe
  'Floral Healing',
  'Aromatic Mist',
  'Sparkling Aria', // not a status move technically
  'Nature Power', // status-categorized, but dispatches a real damaging move (terrain-based; Tri Attack by default)
]);

function isEligible(move) {
  if (move.basePower > 0) return false;
  if (move.category !== 'Status') return false;
  if (HP_TOUCHING.has(move.name)) return false;
  if (move.isZ || move.isMax) return false;
  if (move.name.startsWith('G-Max ') || move.name.startsWith('Max ')) return false;
  return true;
}

test('status moves do not change defender HP', async (t) => {
  const { mkMon, runTurn } = await loadEngine();
  const moves = await loadAllMoves();
  const eligible = moves.filter(isEligible);

  t.diagnostic(`Testing ${eligible.length} of ${moves.length} status moves`);

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
      if (defender.currentHp < before) {
        // Account for poison/burn/leech-seed end-of-turn damage from status that the move applied.
        const dmg = before - defender.currentHp;
        const tolerance = Math.ceil(defender.maxHp / 6); // 16.67% max for status end-of-turn
        if (dmg > tolerance) {
          failures.push({ name: move.name, before, after: defender.currentHp, dmg, tolerance });
        }
      }
    } catch (e) {
      failures.push({ name: move.name, error: e.message });
    }
  }

  if (failures.length > 0) {
    t.diagnostic(`${failures.length} failures (showing first 20):`);
    for (const f of failures.slice(0, 20)) {
      t.diagnostic(`  ${f.name}: ${f.error || `HP ${f.before}->${f.after} (dmg ${f.dmg} > tol ${f.tolerance})`}`);
    }
  }
  assert.equal(failures.length, 0, `${failures.length}/${eligible.length} status moves changed defender HP`);
});
