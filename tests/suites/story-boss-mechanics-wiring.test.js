// Regression for ISSUE-014/015: startBattle (line ~16663) and the turn loop both
// live OUTSIDE the window.StoryMode IIFE (29307+), so their bare `sm`,
// `BOSS_CONFIGS`, and `_storyBossMechanics*` references were silent ReferenceErrors
// (sm) or out-of-scope `typeof` misses (BOSS_CONFIGS) — the whole boss-mechanics
// init block was dead, so story boss/raid beats fought as vanilla mons with none
// of their scripted field locks / HP-threshold phases / immunity rounds.
// Fix: read sm via window.StoryMode.state and expose the config + helpers on window.
// Run: node --test tests/suites/story-boss-mechanics-wiring.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;

test('boss-mechanics config + helpers are exposed to script-top scope (ISSUE-014/015)', () => {
  assert.equal(typeof w.BOSS_CONFIGS, 'object', 'window.BOSS_CONFIGS exposed');
  assert.ok(w.BOSS_CONFIGS && w.BOSS_CONFIGS['main.mfBattle'], 'a known boss key resolves');
  assert.equal(typeof w._storyBossMechanicsBattleInit, 'function', 'battle-init helper exposed');
  assert.equal(typeof w._storyBossMechanicsTurnTick, 'function', 'turn-tick helper exposed');
});

test('battle-init applies a field-lock boss mechanic (weather)', () => {
  const cfg = w.BOSS_CONFIGS['villain.magma.boss']; // Sun fieldLock + hpThresholdPhase
  const stateRef = {
    _bossMechanics: cfg.mechanics.slice(),
    _bossMechanicsFired: {}, _bossPendingTelegraph: null,
    turnNumber: 0, weather: null, weatherTurns: 0,
  };
  w._storyBossMechanicsBattleInit(stateRef);
  assert.equal(stateRef.weather, 'Sun', 'magma boss locks Sun at battle init');
  assert.ok(stateRef._bossWeatherLocked, 'weather flagged boss-locked');
});

test('turn-tick telegraphs an HP-threshold phase, then activates the damage surge', () => {
  const cfg = w.BOSS_CONFIGS['villain.rocket.boss']; // hpThresholdPhase at 0.25
  const stateRef = {
    _activeStoryBeatKey: 'villain.rocket.boss',
    _bossMechanics: cfg.mechanics.slice(),
    _bossMechanicsFired: {}, _bossPendingTelegraph: null, turnNumber: 1,
  };
  const foe = { currentHp: 100, maxHp: 100 };
  w._storyBossMechanicsTurnTick(stateRef, foe);
  assert.equal(stateRef._bossPendingTelegraph, null, 'nothing queued above 25% HP');

  foe.currentHp = 20; stateRef.turnNumber = 2;       // drop below threshold
  w._storyBossMechanicsTurnTick(stateRef, foe);
  assert.ok(stateRef._bossPendingTelegraph, 'HP-threshold phase telegraphed for next turn');

  stateRef.turnNumber = 3;                            // next turn activates it
  w._storyBossMechanicsTurnTick(stateRef, foe);
  assert.equal(stateRef._bossPendingTelegraph, null, 'telegraph consumed on activation');
  assert.ok(foe._bossSurgeTurns > 0, 'damage surge activated on the foe');
});
