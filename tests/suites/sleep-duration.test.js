// Sleep duration semantics (Gen 5+): a sleeping mon must miss EXACTLY
// `sleepDuration` of its own turns, then wakes and acts on the next one.
//
// Regression guard for the canMove() wake check (battle.html ~26438). It used
// `statusTurns >= wakeThreshold`, which woke the mon a turn early:
//   - Rest (sleepDuration 2) played as 1 lost turn instead of 2.
//   - A rolled natural duration of 1 cost the target 0 turns.
// Fixed to `statusTurns > wakeThreshold`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();

const logsHave = (logs, re) => logs.some(l => re.test(l.text));

// Keep selecting an attacking move while asleep; count "fast asleep" turns
// until the mon wakes. HP is topped up each turn so chip/KO can't end the
// battle and cut the sleep short. Player is pinned fast so its sleep ticks
// resolve first and deterministically.
async function sleepUntilWake(sleeper, foe, attackSlot) {
  let missed = 0;
  let wokeAndActed = false;
  for (let t = 0; t < 8; t++) {
    sleeper.currentHp = sleeper.maxHp;
    const logs = await eng.runTurn({
      playerMon: sleeper, foeMon: foe,
      playerMoveSlot: attackSlot, foeMoveSlot: 0,
    });
    if (logsHave(logs, /is fast asleep/)) { missed++; continue; }
    if (logsHave(logs, /woke up!/)) {
      wokeAndActed = logsHave(logs, new RegExp(`${sleeper.name} used `));
    }
    break;
  }
  return { missed, wokeAndActed };
}

const splashFoe = () => eng.mkMon({ species: 'Caterpie', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });

test('Rest sleeps the user for exactly 2 turns, then wakes and acts on the 3rd', async () => {
  const snorlax = eng.mkMon({ species: 'Snorlax', moves: ['Rest', 'Tackle', 'Tackle', 'Tackle'] });
  const foe = splashFoe();
  snorlax.currentHp = snorlax.maxHp - 50; // Rest fails at full HP

  const restLogs = await eng.runTurn({ playerMon: snorlax, foeMon: foe, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(snorlax.status, 'SLP', 'Rest puts the user to sleep');
  assert.equal(snorlax.sleepDuration, 2, 'Rest sets a 2-turn sleep');
  assert.equal(snorlax.currentHp, snorlax.maxHp, 'Rest restores full HP');
  assert.ok(logsHave(restLogs, /went to sleep and recovered/), 'Rest emits its heal message');

  const { missed, wokeAndActed } = await sleepUntilWake(snorlax, foe, 1);
  assert.equal(missed, 2, 'asleep for 2 full turns after Rest (was 1 before the fix)');
  assert.ok(wokeAndActed, 'wakes and acts on the same turn it wakes');
});

test('natural sleep lasts exactly its rolled duration (1-3 turns missed)', async () => {
  for (const D of [1, 2, 3]) {
    const sleeper = eng.mkMon({ species: 'Pikachu', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
    sleeper.status = 'SLP'; sleeper.statusTurns = 0; sleeper.sleepDuration = D;
    const { missed } = await sleepUntilWake(sleeper, splashFoe(), 0);
    assert.equal(missed, D, `sleepDuration ${D} should cost exactly ${D} turns`);
  }
});

test('Early Bird halves sleep (a 2-turn sleep costs 1 turn)', async () => {
  const sleeper = eng.mkMon({ species: 'Pikachu', moves: ['Tackle', 'Tackle', 'Tackle', 'Tackle'] });
  sleeper.ability = 'Early Bird';
  sleeper.status = 'SLP'; sleeper.statusTurns = 0; sleeper.sleepDuration = 2;
  const { missed } = await sleepUntilWake(sleeper, splashFoe(), 0);
  assert.equal(missed, 1, 'Early Bird: 2-turn sleep costs 1 missed turn');
});
