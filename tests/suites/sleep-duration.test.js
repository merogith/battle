// Regression for ISSUE-008: sleep off-by-one. applyStatus rolls sleepDuration =
// floor(rand*3)+1 (1-3). canMove used `statusTurns >= wakeThreshold`, so a
// duration-1 roll (1/3 of sleeps) woke AND acted on the very first turn — costing
// the target ZERO turns. Showdown semantics: a slept mon loses `duration` turns
// (>= 1). Fixed to `statusTurns > wakeThreshold`.
// Run: node --test tests/suites/sleep-duration.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const w = h.window;

// Put a fresh mon to sleep with a pinned RNG, then count how many turns it cannot
// act before it wakes (and acts).
function lostTurns(rngVal) {
  const m = h.mkMon({ species: 'Snorlax', moves: ['Tackle', 'Splash', 'Splash', 'Splash'] });
  const realRandom = w.Math.random;
  w.Math.random = () => rngVal;
  w.applyStatus(m, 'SLP');
  w.Math.random = realRandom;
  const dur = m.sleepDuration;
  let lost = 0;
  for (let i = 0; i < 8 && m.status === 'SLP'; i++) {
    if (w.canMove(m, 'Tackle')) break; // woke and gets to act this turn
    lost++;                            // fast asleep, no action
  }
  return { dur, lost };
}

test('a freshly-slept mon cannot act on its first turn (ISSUE-008)', () => {
  const r = lostTurns(0.0); // floor(0*3)+1 = duration 1
  assert.equal(r.dur, 1, 'rng 0.0 rolls a 1-turn sleep');
  assert.equal(r.lost, 1, 'duration-1 sleep must still cost exactly one turn (was 0)');
});

test('effective lost turns equal the rolled sleep duration (1-3)', () => {
  for (const [rng, expDur] of [[0.0, 1], [0.4, 2], [0.7, 3]]) {
    const r = lostTurns(rng);
    assert.equal(r.dur, expDur, `rng ${rng} -> duration ${expDur}`);
    assert.equal(r.lost, expDur, `a ${expDur}-turn sleep should cost ${expDur} turns`);
  }
});

test('Rest sleeps its canonical 2 turns, not 1', () => {
  const m = h.mkMon({ species: 'Snorlax', moves: ['Rest', 'Splash', 'Splash', 'Splash'] });
  m.status = 'SLP'; m.statusTurns = 0; m.sleepDuration = 2; // mirrors the Rest handler
  let lost = 0;
  for (let i = 0; i < 8 && m.status === 'SLP'; i++) {
    if (w.canMove(m, 'Splash')) break;
    lost++;
  }
  assert.equal(lost, 2, 'Rest user should be asleep for 2 turns and act on the 3rd');
});
