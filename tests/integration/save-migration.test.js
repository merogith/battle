import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

function installLocalStorageShim(window) {
  const store = new Map();
  const shim = {
    getItem: (k) => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  try { Object.defineProperty(window, 'localStorage', { value: shim, configurable: true }); } catch {}
  return shim;
}

// The real save key is `version` (NOT `saveVer`), and the migration chain
// (migrateStoryPreV8..PreV20) runs inside load(). window.__storyLoad exposes
// that entry so this suite exercises the actual safety-critical path instead
// of round-tripping JSON.

test('migration entry point is exposed for testing', async () => {
  const { window } = await loadEngine();
  assert.equal(typeof window.__storyLoad, 'function', 'window.__storyLoad must be exposed');
  assert.equal(typeof window.__STORY_SAVE_VER, 'number', 'SAVE_VER must be exposed');
});

test('pre-v20 save migrates up: version bumped + v20 fields backfilled', async () => {
  const { window } = await loadEngine();
  installLocalStorageShim(window);
  const old = {
    version: 19,                          // REAL key is `version`
    eventIndex: 5,
    badges: 1,
    team: [{ name: 'Pikachu', build: {} }],
    runSeed: 1234,
  };
  window.localStorage.setItem('pbs_story_save', JSON.stringify(old));

  assert.doesNotThrow(() => window.__storyLoad(), 'migration must not throw');

  const sm = window.StoryMode && window.StoryMode.state;
  assert.ok(sm, 'state should be populated after load');
  assert.equal(sm.version, window.__STORY_SAVE_VER, 'version migrated to current SAVE_VER');
  assert.ok(sm.daycare && typeof sm.daycare === 'object', 'v20 daycare field backfilled');
  assert.ok(sm.pits && typeof sm.pits === 'object', 'v20 pits field backfilled');
  assert.ok(Array.isArray(sm.team), 'team preserved across migration');
});

test('corrupted save JSON is swallowed by load() (no throw)', async () => {
  const { window } = await loadEngine();
  installLocalStorageShim(window);
  window.localStorage.setItem('pbs_story_save', '{this-is-not-valid-json');
  let result;
  assert.doesNotThrow(() => { result = window.__storyLoad(); }, 'load must catch corrupt JSON');
  assert.notEqual(result, true, 'corrupt save must not report a successful load');
});

test('out-of-range save version is rejected, not migrated', async () => {
  const { window } = await loadEngine();
  installLocalStorageShim(window);
  window.localStorage.setItem('pbs_story_save', JSON.stringify({ version: 999 }));
  let result;
  assert.doesNotThrow(() => { result = window.__storyLoad(); });
  assert.notEqual(result, true, 'a future/invalid version must be rejected');
});
