// Showdown-parity regression: multi-hit moves roll damage variance (85–100)
// AND the crit check independently PER HIT (the engine previously computed one
// roll + one crit and reused it for every hit).
//
// Technique: once the engine announces "used Double Kick", Math.random is fed
// from a scripted queue. For this scenario the consumption order is:
//   [accuracy, hit1-crit, hit1-rng, hit2-crit, hit2-rng]
// Double Kick always hits exactly twice (no hit-count roll), has no secondary
// effect, and both mons carry inert abilities/items, so no other consumer
// interleaves. Queue exhaustion falls back to the seeded harness PRNG.
import { describe, it, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../../../helpers/load-engine.js';

let e;
before(async () => { e = await loadEngine(); });

afterEach(() => {
  e.window.Math.random = e.nextFloat;
});

async function doubleKickWithRolls(rolls) {
  const { mkMon, runTurn, window, nextFloat } = e;
  const a = mkMon({ species: 'Mew', moves: ['Double Kick', 'Splash', 'Splash', 'Splash'] });
  const d = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  a.ability = 'Pressure'; // inert — avoid species-default abilities with RNG hooks
  d.ability = 'Pressure';
  const q = rolls.slice();
  let armed = false;
  const origLog = window.logMsg;
  window.logMsg = (text, ch) => {
    if (String(text).includes('used Double Kick')) armed = true;
    return origLog(text, ch);
  };
  window.Math.random = () => (armed && q.length > 0) ? q.shift() : nextFloat();
  try {
    const turnLogs = await runTurn({ playerMon: a, foeMon: d });
    return { total: d.maxHp - d.currentHp, logs: turnLogs, queueLeft: q.length };
  } finally {
    window.logMsg = origLog;
    window.Math.random = nextFloat;
  }
}

const NO_CRIT = 0.99; // crit roll fails (base rate 1/24)
const CRIT = 0.0;     // crit roll succeeds
const ROLL_85 = 0.0;      // floor(0.0*16)=0  → 85/100
const ROLL_100 = 0.9999;  // floor(.9999*16)=15 → 100/100

describe('multi-hit per-hit damage/crit rolls (Showdown parity)', () => {
  it('each hit rolls its own 85–100 variance', async () => {
    const base = await doubleKickWithRolls([0.5, NO_CRIT, ROLL_85, NO_CRIT, ROLL_85]);
    assert.equal(base.queueLeft, 0, 'all five scripted rolls must be consumed (acc, crit×2, rng×2)');
    assert.ok(base.total > 0, 'Double Kick must deal damage');
    assert.equal(base.total % 2, 0, 'identical 85-rolls on both hits → total is exactly 2×hit1');
    const h1 = base.total / 2;

    const maxRoll2 = await doubleKickWithRolls([0.5, NO_CRIT, ROLL_85, NO_CRIT, ROLL_100]);
    const expected = h1 + Math.floor(h1 * (1.0 / 0.85));
    assert.equal(maxRoll2.total, expected,
      `hit 2 must use its own variance roll (hit1=${h1}, expected total ${expected}, got ${maxRoll2.total})`);
    assert.ok(maxRoll2.total > base.total, 'a max second-hit roll must out-damage two min rolls');
  });

  it('each hit rolls its own crit check (and the crit is announced)', async () => {
    const base = await doubleKickWithRolls([0.5, NO_CRIT, ROLL_85, NO_CRIT, ROLL_85]);
    assert.ok(!base.logs.some((l) => l.text.includes('A critical hit!')), 'no crit expected in base case');
    const h1 = base.total / 2;

    const crit2 = await doubleKickWithRolls([0.5, NO_CRIT, ROLL_85, CRIT, ROLL_85]);
    const expected = h1 + Math.floor(h1 * 1.5);
    assert.equal(crit2.total, expected,
      `hit 2 must crit independently (hit1=${h1}, expected total ${expected}, got ${crit2.total})`);
    assert.ok(crit2.logs.some((l) => l.text.includes('A critical hit!')),
      'a crit on any hit must be announced');
  });
});
