import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

// Regression guard for the "Can't find variable: sm. Turn skipped." bug.
//
// The StoryMode state `sm` is private to the StoryMode IIFE. The battle engine
// (script-top scope) used to read it bare in a story-aware RNG selector idiom:
//   (sm && sm.active && typeof window.storyRngNext === 'function') ? ... : Math.random
// Because `sm` is evaluated before `&&` can short-circuit, this threw a
// ReferenceError ("sm is not defined" in V8, "Can't find variable: sm" in
// WebKit) whenever a confusion / thaw / trap / swagger / flatter / coin-shower /
// Harvest effect fired — in EVERY battle mode, not just story. The turn loop's
// catch swallowed it as "[Error: ... Turn skipped.]". Fix routes those sites
// through the storyAwareRng() helper, which reads window.StoryMode.state.

function findCrashLogs(logs) {
  return logs.filter((l) =>
    /can't find variable|is not defined|Turn skipped|ReferenceError/i.test(l.text));
}

test('status RNG: confusion infliction does not throw "sm is not defined" outside story mode', async () => {
  const { mkMon, runTurn } = await loadEngine();
  // Dynamic Punch has a 100% confusion secondary -> exercises the _tryConfuse path.
  const attacker = mkMon({ species: 'Machamp', moves: ['Dynamic Punch', 'Tackle', 'Tackle', 'Tackle'] });
  const target = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const logs = await runTurn({ playerMon: attacker, foeMon: target, playerMoveSlot: 0, foeMoveSlot: 0 });
  const crashes = findCrashLogs(logs);
  assert.equal(crashes.length, 0,
    `confusion path threw / skipped the turn: ${JSON.stringify(crashes.map((c) => c.text))}`);
});

test('status RNG: Swagger does not skip the turn outside story mode', async () => {
  const { mkMon, runTurn } = await loadEngine();
  const attacker = mkMon({ species: 'Gengar', moves: ['Swagger', 'Tackle', 'Tackle', 'Tackle'] });
  const target = mkMon({ species: 'Snorlax', moves: ['Splash', 'Splash', 'Splash', 'Splash'] });
  const logs = await runTurn({ playerMon: attacker, foeMon: target, playerMoveSlot: 0, foeMoveSlot: 0 });
  assert.equal(findCrashLogs(logs).length, 0, 'Swagger must not skip the turn');
});

test('status RNG: storyAwareRng helper exists and returns a callable without throwing', async () => {
  const { window } = await loadEngine();
  assert.equal(typeof window.storyAwareRng, 'function', 'storyAwareRng must be defined at engine scope');
  const rng = window.storyAwareRng();
  assert.equal(typeof rng, 'function', 'storyAwareRng() must return a callable RNG');
  const v = rng();
  assert.ok(v >= 0 && v < 1, `RNG output ${v} must be in [0,1)`);
});
