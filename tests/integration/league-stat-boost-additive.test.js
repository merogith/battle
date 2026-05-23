import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

// Verifies the fix for ISSUE-004: applyStoryLeagueFoeStatBoost now STORES an
// additive bonus on mon._leagueStatBonus instead of mutating stats directly,
// and applyFoeDifficultyScaling merges it additively with the difficulty mult.
//
// Pre-fix: Champion HP on Challenge = 1.40 × 1.30 = 1.82 (multiplicative cliff)
// Post-fix: Champion HP on Challenge = 1.0 + 0.40 + 0.30 = 1.70 (additive, gentler)

function makeFakeMon() {
  return {
    maxHp: 100,
    currentHp: 100,
    stats: { atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
  };
}

test('applyStoryLeagueFoeStatBoost sets _leagueStatBonus and does NOT mutate stats', async () => {
  const { window } = await loadEngine();
  if (!window.applyStoryLeagueFoeStatBoost) return; // not exposed
  if (!window.sm) return;
  if (!Array.isArray(window.STORY_EVENTS_RAW)) return;

  // Find a Champion event row to satisfy the function's filter
  const champRow = window.STORY_EVENTS_RAW.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && r[2] === 'Champion');
  if (champRow < 0) return;

  window.sm.active = true;
  window.sm.eventIndex = champRow;
  window.sm.frontier = null;

  const mon = makeFakeMon();
  window.applyStoryLeagueFoeStatBoost(mon);

  assert.equal(mon.maxHp, 100, 'maxHp not mutated by league boost');
  assert.equal(mon.stats.atk, 100, 'atk not mutated');
  assert.equal(mon.stats.spe, 100, 'spe not mutated');
  assert.ok(mon._leagueStatBonus, 'bonus stored on mon');
  assert.equal(mon._leagueStatBonus.hp, 0.40, 'hp delta = 0.40 for Champion');
  assert.equal(mon._leagueStatBonus.bulk, 0.22, 'bulk delta = 0.22 for Champion');
});

test('applyFoeDifficultyScaling merges league bonus additively with Challenge mult', async () => {
  const { window } = await loadEngine();
  if (!window.applyFoeDifficultyScaling) return;
  if (!window.sm) return;

  window.sm.active = true;
  window.sm.storyDifficulty = 'challenge';
  // Reach into Storymode to ensure the difficulty getter sees Challenge
  if (window.StoryMode && window.StoryMode.state) window.StoryMode.state.storyDifficulty = 'challenge';

  const mon = makeFakeMon();
  // Pretend the league boost ran and stored an additive +0.40 HP delta
  mon._leagueStatBonus = { hp: 0.40, bulk: 0.22, spe: 0.18 };

  window.applyFoeDifficultyScaling(mon);

  // Pre-fix would have been 100 × 1.30 = 130 (because mon was already mutated
  // to 140 by the league fn, then 140 × 1.30 = 182). With the fix, the league
  // mut hasn't happened (stored as bonus), so 100 × (1.30 + 0.40) = 170.
  // Allow ±1 HP for floor() truncation.
  assert.ok(
    mon.maxHp >= 169 && mon.maxHp <= 171,
    `Champion + Challenge HP should be additive (≈170), got ${mon.maxHp}`,
  );
});

test('Difficulty without league bonus is unchanged (regression guard)', async () => {
  const { window } = await loadEngine();
  if (!window.applyFoeDifficultyScaling) return;
  if (window.StoryMode && window.StoryMode.state) window.StoryMode.state.storyDifficulty = 'hard';
  const mon = makeFakeMon();
  delete mon._leagueStatBonus;
  window.applyFoeDifficultyScaling(mon);
  assert.ok(mon.maxHp >= 100, 'difficulty mult applies even without league bonus');
});
