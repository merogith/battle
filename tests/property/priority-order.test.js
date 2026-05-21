// Property test: a move with positive priority used by a slower attacker still moves first
// against a faster defender. Moves with negative priority always move last.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { loadAllMoves } from '../helpers/load-moves.js';

const ATTACKER_SPECIES = 'Pikachu';   // base speed 90
const DEFENDER_SPECIES = 'Snorlax';   // base speed 30

// Priority moves that can't be tested without specific setup (charge moves, situational, etc.)
const SKIP = new Set([
  'Mat Block',        // first turn only, defensive
  'Quick Guard',      // ally-side protect; needs ally
  'Wide Guard',       // ally-side
  'Crafty Shield',    // ally-side, status-only
  'Aromatherapy',     // heals party - prio 0 actually
  'Heal Bell',        // same
  'Magnet Rise',      // self volatile - not a damaging move
  'Fake Out',         // first-turn-only flinch
  'First Impression', // first-turn-only damage
  'Counter', 'Mirror Coat', 'Metal Burst', 'Bide',  // require prior damage
  'Sucker Punch',     // requires opp attacking
  'Upper Hand',       // requires opp priority
  'Pursuit',          // double on switch only
  'Beak Blast', 'Shell Trap', 'Focus Punch',  // charging
]);

function isEligible(move) {
  if (move.priority == null || move.priority === 0) return false;
  if (move.isZ || move.isMax) return false;
  if (move.name.startsWith('G-Max ') || move.name.startsWith('Max ')) return false;
  if (SKIP.has(move.name)) return false;
  if (move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') return false;
  return true;
}

test('priority moves resolve in the right order', async (t) => {
  const { mkMon, runTurn, logs } = await loadEngine();
  const moves = await loadAllMoves();
  const eligible = moves.filter(isEligible);

  t.diagnostic(`Testing ${eligible.length} of ${moves.length} priority moves`);

  const failures = [];
  for (const move of eligible) {
    // Pikachu is slower than max-speed Snorlax in this contrived setup
    const attacker = mkMon({ species: ATTACKER_SPECIES, moves: [move.name, 'Splash', 'Splash', 'Splash'] });
    const defender = mkMon({ species: DEFENDER_SPECIES, moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
    attacker.stats.spe = 1;       // Pikachu pinned slow
    defender.stats.spe = 999;     // Snorlax pinned fast

    const startLog = logs.length;
    try {
      await runTurn({ playerMon: attacker, foeMon: defender, foeMoveSlot: 0, forcePlayerFast: false });
      const turnLogs = logs.slice(startLog);
      // Find "Pikachu used X!" and "Snorlax used Tackle!" lines
      const pikaIdx = turnLogs.findIndex(l => l.text.startsWith(`${attacker.name} used ${move.name}`));
      const lopuIdx = turnLogs.findIndex(l => l.text.startsWith(`${defender.name} used Tackle`));
      if (pikaIdx === -1 || lopuIdx === -1) {
        // Move missed or was blocked - not a priority issue
        continue;
      }
      const movedFirst = pikaIdx < lopuIdx;
      const expectedFirst = move.priority > 0;
      if (movedFirst !== expectedFirst) {
        failures.push({ name: move.name, priority: move.priority, movedFirst, expectedFirst });
      }
    } catch (e) {
      failures.push({ name: move.name, error: e.message });
    }
  }

  if (failures.length > 0) {
    t.diagnostic(`${failures.length} failures (showing first 15):`);
    for (const f of failures.slice(0, 15)) {
      t.diagnostic(`  ${f.name} (pri=${f.priority}): ${f.error || `movedFirst=${f.movedFirst} expectedFirst=${f.expectedFirst}`}`);
    }
  }
  assert.equal(failures.length, 0, `${failures.length}/${eligible.length} priority moves resolved in wrong order`);
});
