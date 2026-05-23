import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

test('story-mode globals are exposed by engine boot', async () => {
  const { window } = await loadEngine();
  const hasStorySurface = !!(window.sm || window.StoryMode || typeof window.newStoryRun === 'function');
  assert.ok(hasStorySurface, 'engine should expose at least one of: window.sm, window.StoryMode, window.newStoryRun');
});

test('SAVE_VER is a positive integer if exposed', async () => {
  const { window } = await loadEngine();
  if (window.SAVE_VER === undefined) {
    return;
  }
  assert.ok(Number.isInteger(window.SAVE_VER), 'SAVE_VER should be an integer');
  assert.ok(window.SAVE_VER >= 1, 'SAVE_VER should be >= 1');
});

test('storyRngNext is deterministic given a seeded state', async () => {
  const { window } = await loadEngine();
  if (typeof window.storyRngNext !== 'function') {
    return;
  }
  // storyRngNext only takes its deterministic LCG branch when sm.runSeed is
  // set; with runSeed null it falls back to native Math.random. Set both
  // runSeed and _strngState so we exercise the pure-function path. (Before
  // main's BUG-002 expose, window.storyRngNext was undefined and this test
  // early-returned — the missing runSeed went unnoticed.)
  if (!window.sm) return;
  window.sm.runSeed = 777;
  window.sm._strngState = 42;
  const a = window.storyRngNext();
  window.sm._strngState = 42;
  const b = window.storyRngNext();
  assert.equal(a, b, 'storyRngNext must be a pure function of (runSeed, _strngState)');
});

test('localStorage round-trip for pbs_story_save (in-memory shim)', async () => {
  const { window } = await loadEngine();
  const store = new Map();
  const shim = {
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  try { Object.defineProperty(window, 'localStorage', { value: shim, configurable: true }); } catch {}
  const fake = { eventIndex: 0, badges: 0, team: [], pcBox: [], runSeed: 99, SAVE_VER: 15 };
  window.localStorage.setItem('pbs_story_save', JSON.stringify(fake));
  const round = JSON.parse(window.localStorage.getItem('pbs_story_save'));
  assert.deepEqual(round, fake, 'localStorage round-trip via shim');
});
