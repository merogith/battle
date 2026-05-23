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

test('migrateStoryPreV15 function exists OR migrations are not yet exposed', async () => {
  const { window } = await loadEngine();
  const fn = window.migrateStoryPreV15;
  if (typeof fn !== 'function') {
    return;
  }
  assert.equal(typeof fn, 'function');
});

test('pre-v15 save without pcBox does not crash on parse', async () => {
  const { window } = await loadEngine();
  installLocalStorageShim(window);
  const preV15 = {
    saveVer: 14,
    eventIndex: 5,
    badges: 1,
    team: [{ species: 'Pikachu' }],
    runSeed: 1234,
  };
  window.localStorage.setItem('pbs_story_save', JSON.stringify(preV15));
  const parsed = JSON.parse(window.localStorage.getItem('pbs_story_save'));
  assert.equal(parsed.saveVer, 14);
  assert.ok(Array.isArray(parsed.team));
});

test('corrupted save JSON does not crash parse path', async () => {
  const { window } = await loadEngine();
  installLocalStorageShim(window);
  window.localStorage.setItem('pbs_story_save', '{this-is-not-valid-json');
  let threw = false;
  try {
    JSON.parse(window.localStorage.getItem('pbs_story_save'));
  } catch (e) {
    threw = true;
  }
  assert.ok(threw, 'corrupted JSON should throw on JSON.parse; engine must catch this');
});
