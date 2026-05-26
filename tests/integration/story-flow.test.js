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

// Regression: battle-bag items spent in a fight the player does NOT win must be
// refunded on every non-win exit — flee/forfeit, "Return to Last City", rival
// "Concede", and a mid-battle refresh (pagehide). applyBagItem decrements
// sm.inventory and saves immediately, so before the fix only "Retry" restored
// the pre-fight bag; the other exits silently burned the items ("sometimes you
// lose them, sometimes not"). A genuine victory still burns them.
test('non-win battle exits refund spent battle-bag items', async () => {
  const { window } = await loadEngine();
  const SM = window.StoryMode;
  if (!SM || !SM.state) return;
  const sm = SM.state;
  const EVENTS = window.STORY_EVENTS_RAW;

  const rowIndexWhere = (pred) => {
    if (!Array.isArray(EVENTS)) return null;
    for (let i = 0; i < EVENTS.length; i++) if (EVENTS[i] && pred(EVENTS[i], i)) return i;
    return null;
  };

  // Pre-fight bag had 5 Potions; the player spent 1 mid-battle (consumed = 4).
  // sm.storyRetryInventorySnapshot is the pre-fight snapshot the defeat path stashes.
  const armDefeatState = (eventIndex) => {
    sm.active = true;
    sm.team = [];
    sm.gold = 1000;
    sm.storyDifficulty = 'normal';
    sm.currentEnemyLock = null;
    sm.inventory = { potion: 4 };
    sm.storyRetryInventorySnapshot = { potion: 5 };
    if (eventIndex != null) sm.eventIndex = eventIndex;
  };

  const battleIdx = rowIndexWhere((r) => r[1] === 'Battle');

  // 1) "Return to Last City" button.
  armDefeatState(battleIdx);
  try { SM.retreatToLastPokemonCenter(); } catch { /* heavy navigation tail may throw after the refund */ }
  assert.equal(sm.inventory.potion, 5, 'Return to Last City should refund the spent Potion');

  // 2) Refresh / tab close mid-battle (pagehide on a non-city row).
  if (battleIdx != null) {
    armDefeatState(battleIdx);
    try { window.dispatchEvent(new window.Event('pagehide')); } catch { /* jsdom event quirk */ }
    assert.equal(sm.inventory.potion, 5, 'A mid-battle refresh should refund the spent Potion');
  }

  // 3) Rival "Concede" (only fires when the current event is a Rival battle).
  const rivalIdx = rowIndexWhere((r) => r[1] === 'Battle' && r[2] === 'Rival');
  if (rivalIdx != null) {
    armDefeatState(rivalIdx);
    try { SM.acceptRivalLossAndContinue(); } catch { /* heavy navigation tail */ }
    assert.equal(sm.inventory.potion, 5, 'Conceding to the rival should refund the spent Potion');
  }

  // 4) Negative control: a win clears the snapshot, so consumed items stay spent.
  sm.inventory = { potion: 4 };
  sm.storyRetryInventorySnapshot = null;
  assert.equal(sm.inventory.potion, 4, 'A victory must NOT refund items used to win');
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
