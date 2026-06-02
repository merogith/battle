import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

// Supersedes the old ISSUE-004 additive-league-bonus test. League / boss stat
// boosts (E1-E4 / Champion / Mystery / league Rival) are no longer applied by
// applyStoryLeagueFoeStatBoost as an additive _leagueStatBonus delta merged in
// applyFoeDifficultyScaling. They now live in the UNIFIED foe curve, stamped onto
// the build and applied ONCE in buildPokemon (curve × difficulty, one floor).
//
// This file pins the new contract:
//   1. applyStoryLeagueFoeStatBoost no longer touches a non-Frontier league mon.
//   2. It still scales Frontier mons (that ladder is out of scope but must work).
//   3. applyFoeDifficultyScaling skips any foe already scaled at build time.

function makeFakeMon() {
  return { maxHp: 100, currentHp: 100, stats: { atk: 100, def: 100, spa: 100, spd: 100, spe: 100 } };
}

test('applyStoryLeagueFoeStatBoost no longer mutates a non-Frontier league mon', async () => {
  const { window } = await loadEngine();
  if (!window.applyStoryLeagueFoeStatBoost || !window.sm || !Array.isArray(window.STORY_EVENTS_RAW)) return;

  const champRow = window.STORY_EVENTS_RAW.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && r[2] === 'Champion');
  if (champRow < 0) return;

  window.sm.active = true;
  window.sm.eventIndex = champRow;
  window.sm.frontier = null;
  if (window.StoryMode && window.StoryMode.state) {
    window.StoryMode.state.active = true;
    window.StoryMode.state.frontier = null;
  }

  const mon = makeFakeMon();
  window.applyStoryLeagueFoeStatBoost(mon);

  assert.equal(mon.maxHp, 100, 'maxHp untouched — boss scaling moved to the unified curve');
  assert.equal(mon.stats.atk, 100, 'atk untouched');
  assert.equal(mon.stats.spe, 100, 'spe untouched');
  assert.equal(mon._leagueStatBonus, undefined, 'no additive league bonus is produced anymore');
});

test('applyStoryLeagueFoeStatBoost still scales Frontier mons each round', async () => {
  const { window } = await loadEngine();
  if (!window.applyStoryLeagueFoeStatBoost) return;
  const sm = (window.StoryMode && window.StoryMode.state) || window.sm;
  if (!sm) return;

  sm.active = true;
  sm.frontier = { active: true, currentRound: 1 };

  const mon = makeFakeMon();
  window.applyStoryLeagueFoeStatBoost(mon);

  // Round 1 Frontier: HP ×1.50, bulk/speed ×1.25.
  assert.equal(mon.maxHp, 150, 'Frontier round-1 HP ×1.50');
  assert.equal(mon.stats.atk, 125, 'Frontier round-1 bulk ×1.25');
  assert.equal(mon.stats.spe, 125, 'Frontier round-1 speed ×1.25');

  sm.frontier = null; // reset so we don't leak state into other tests
});

test('applyFoeDifficultyScaling skips a foe already scaled at build time', async () => {
  const { window } = await loadEngine();
  if (!window.applyFoeDifficultyScaling) return;
  if (window.StoryMode && window.StoryMode.state) window.StoryMode.state.storyDifficulty = 'challenge';

  const stamped = makeFakeMon();
  stamped._foeMultApplied = true; // buildPokemon set this — curve × difficulty already applied
  window.applyFoeDifficultyScaling(stamped);
  assert.equal(stamped.maxHp, 100, 'stamped foe is not scaled a second time');
  assert.equal(stamped.stats.spe, 100, 'stamped foe speed untouched');
});
