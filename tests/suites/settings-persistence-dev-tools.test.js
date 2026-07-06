// Settings persistence + developer-tools guard (2026-06).
//
// Two polish changes are locked in here:
//   1. persistMiscSettings() now serializes the audio + visual prefs that
//      previously reset on every reload — musicEnabled / soundEnabled /
//      animations / weatherAnimation / terrainBackground + the two volumes
//      (musicVol / soundVol). The vestigial out-of-scope `pvpBattleItems`
//      control was removed and must NOT reappear in the persisted blob.
//   2. The four new developer-testing globals (__devLoseBattle /
//      __devHealParty / __devRevealFoeTeam + StoryMode.devStoryJump) exist
//      alongside the kept __devAutoWinBattle.
//
// Run: node --test tests/suites/settings-persistence-dev-tools.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;

// jsdom boots on an opaque file:// origin, so window.localStorage throws on
// access (the engine guards its own reads in try/catch). Install a Map-backed
// shim so persistMiscSettings() can actually write, and we can read it back.
function installLocalStorageShim() {
    const store = new Map();
    const shim = {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => { store.set(k, String(v)); },
        removeItem: (k) => { store.delete(k); },
        clear: () => { store.clear(); },
        key: (i) => [...store.keys()][i] ?? null,
        get length() { return store.size; },
    };
    Object.defineProperty(W, 'localStorage', { value: shim, configurable: true });
    return store;
}
const STORE = installLocalStorageShim();

test('persistMiscSettings serializes audio + visual prefs and volumes', () => {
    assert.equal(typeof W.persistMiscSettings, 'function');
    W.persistMiscSettings();
    const raw = JSON.parse(STORE.get('pbs_settings') || '{}');
    for (const key of ['musicEnabled', 'soundEnabled', 'animations', 'weatherAnimation', 'terrainBackground', 'musicVol', 'soundVol']) {
        assert.ok(key in raw, `expected persisted settings to include "${key}"`);
    }
    // Volumes serialize as numbers in 0..1.
    assert.equal(typeof raw.musicVol, 'number');
    assert.ok(raw.musicVol >= 0 && raw.musicVol <= 1);
    assert.equal(typeof raw.soundVol, 'number');
    assert.ok(raw.soundVol >= 0 && raw.soundVol <= 1);
});

test('removed out-of-scope pvpBattleItems is not persisted', () => {
    W.persistMiscSettings();
    const raw = JSON.parse(STORE.get('pbs_settings') || '{}');
    assert.equal('pvpBattleItems' in raw, false);
});

test('Battle Options prefs now survive a reload (weather/terrain/party/grades/gens)', () => {
    W.persistMiscSettings();
    const raw = JSON.parse(STORE.get('pbs_settings') || '{}');
    for (const key of ['randomWeather', 'randomTerrain', 'partySize', 'draftGrades']) {
        assert.ok(key in raw, `expected persisted settings to include "${key}"`);
    }
    // draftGens is null until the pool count runs, but the key must be serialized.
    assert.ok('draftGens' in raw, 'draftGens key is persisted');
    // classicMode (once-per-battle gimmicks) now persists for Quick/Gauntlet too.
    assert.ok('classicMode' in raw, 'classicMode is persisted');
});

test('Battle Options panel exposes a live re-sync entry point', () => {
    assert.equal(typeof W.syncBattleOptionsFromSettings, 'function',
        'syncBattleOptionsFromSettings is callable (repaints the panel from settings)');
    assert.doesNotThrow(() => W.syncBattleOptionsFromSettings(), 're-sync is safe to call');
});

test('dead audioBus setting is no longer persisted', () => {
    W.persistMiscSettings();
    const raw = JSON.parse(STORE.get('pbs_settings') || '{}');
    assert.equal('audioBus' in raw, false, 'audioBus was removed as dead code');
    assert.equal(typeof W.AudioBus, 'undefined', 'window.AudioBus dead wrapper removed');
});

test('developer tools: auto-win kept, plus the four new helpers exist', () => {
    assert.equal(typeof W.__devAutoWinBattle, 'function');
    assert.equal(typeof W.__devLoseBattle, 'function');
    assert.equal(typeof W.__devHealParty, 'function');
    assert.equal(typeof W.__devRevealFoeTeam, 'function');
    assert.equal(typeof (W.StoryMode && W.StoryMode.devStoryJump), 'function');
});

test('dev battle tools no-op safely with no active battle', () => {
    // With no live battle they should return false rather than throw.
    assert.equal(W.__devHealParty(), false);
    assert.equal(W.__devRevealFoeTeam(), false);
});
