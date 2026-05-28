// Smoke-test ISSUE-005 fix: getBestMove move-pick distribution should
// differ between veryeasy/easy (random fumbles + jitter) and hard/challenge
// (deterministic, zero jitter). Pre-fix the AI was byte-identical across
// tiers — this asserts the new _aiBehaviorProfile actually changes behavior.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

test('AI behavior profile differs across difficulty tiers', () => {
  const profile = W._aiBehaviorProfile;
  assert.equal(typeof profile, 'function', '_aiBehaviorProfile must be exposed');

  // Pretend story-mode is active so the profile reads sm.storyDifficulty
  ST.sm = Object.assign(ST.sm || {}, { active: true });

  ST.sm.storyDifficulty = 'veryeasy';
  const ve = profile();
  ST.sm.storyDifficulty = 'easy';
  const e = profile();
  ST.sm.storyDifficulty = 'normal';
  const n = profile();
  ST.sm.storyDifficulty = 'hard';
  const h = profile();
  ST.sm.storyDifficulty = 'challenge';
  const c = profile();

  // Override probability: monotonic decrease from veryeasy down to 0 at hard/challenge.
  assert.ok(ve.overrideProb > e.overrideProb, 'veryeasy override > easy');
  assert.ok(e.overrideProb > n.overrideProb,   'easy override > normal');
  assert.equal(h.overrideProb, 0,               'hard never overrides');
  assert.equal(c.overrideProb, 0,               'challenge never overrides');

  // Jitter: widens at low tiers, zero at challenge (strict optimal).
  assert.ok(ve.jitter > n.jitter, 'veryeasy jitter wider than normal');
  assert.ok(n.jitter  > h.jitter, 'normal jitter wider than hard');
  assert.equal(c.jitter, 0,        'challenge has zero jitter');

  // Switch policy: only low tiers refuse to pivot.
  assert.equal(ve.allowSwitch, false, 'veryeasy AI cannot switch');
  assert.equal(e.allowSwitch,  false, 'easy AI cannot switch');
  assert.equal(n.allowSwitch,  true,  'normal AI can switch');
  assert.equal(h.allowSwitch,  true,  'hard AI can switch');
  assert.equal(c.allowSwitch,  true,  'challenge AI can switch');
});

test('non-story mode + unknown difficulty defaults to normal profile', () => {
  const profile = W._aiBehaviorProfile;
  // story inactive
  ST.sm = Object.assign(ST.sm || {}, { active: false });
  const offStory = profile();
  assert.equal(offStory.tier, 'normal', 'non-story uses normal profile');
  assert.equal(offStory.allowSwitch, true);
  // unknown tier
  ST.sm = Object.assign(ST.sm || {}, { active: true, storyDifficulty: 'lunatic' });
  const unknown = profile();
  assert.equal(unknown.tier, 'normal', 'unknown difficulty falls back to normal');

  // Restore so neighbouring tests in the same load don't leak.
  ST.sm = Object.assign(ST.sm || {}, { active: false, storyDifficulty: 'normal' });
});
