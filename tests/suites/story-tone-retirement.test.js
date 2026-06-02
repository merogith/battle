// Tone retirement (2026-06): the legacy 8-tone STORYLINE_VARIANTS layer is
// retired in favor of the 3-track system (sm.tracks). Several tones
// (project_mewtwo / hypnos_lullaby / static / bone_keepers) pointed the player
// at the removed post-HoF "Caged God" boss (broker / cage / Subject Zero).
// These tests lock in that every run resolves to the clean 'classic' tone, for
// BOTH new runs (the 'surprise_me' roll) and existing in-progress saves (the
// load back-fill). To revive tone rolling, see _readStorylineFromUI().
// Run: node --test tests/suites/story-tone-retirement.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

// The harness boots jsdom on an opaque file:// origin, so window.localStorage
// throws on access. Install a Map-backed shim so the real load() can read the
// save we plant. (The engine itself guards localStorage in try/catch at boot.)
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
    return shim;
}
const LS = installLocalStorageShim();

function plantSave(storyLine) {
    LS.setItem('pbs_story_save', JSON.stringify({
        version: W.__STORY_SAVE_VER,
        active: true,
        storyLine,
        eventIndex: 0,
        badges: 0,
        team: [],
        settings: { minGen: 1, maxGen: 9, enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    }));
}

test('new run: surprise_me sentinel resolves to classic (tone rolling retired)', () => {
    // _tcState.storyline defaults to (and the trainer-create screen forces) the
    // 'surprise_me' sentinel. After retirement it must resolve to 'classic',
    // never a dirty tone. Drawn many times: if rolling were ever re-enabled this
    // loop would draw a non-classic tone and fail (the roller is non-deterministic
    // with no active run), so it stays a real guard rather than a one-shot.
    for (let i = 0; i < 40; i++) {
        assert.equal(ST.readStorylineFromUI(), 'classic', `draw ${i} was not classic`);
    }
});

test('existing save: a dirty tone normalizes to classic on load', () => {
    // The unconditional back-fill in load() must rewrite a locked-in dirty tone to
    // 'classic' so the player never sees champion/cold-open lines pointing at the
    // removed boss.
    plantSave('project_mewtwo');
    assert.equal(ST.loadSaveForTest(), true, 'load() should succeed on a current-version save');
    assert.equal(ST.sm.storyLine, 'classic', 'dirty tone must be normalized to classic on load');
});

test('existing save: a clean tone is also normalized to classic (full retirement)', () => {
    // Retirement is a clean sweep — even clean tones (e.g. second_sun) collapse to
    // classic so the going-forward experience is consistent with new runs.
    plantSave('second_sun');
    assert.equal(ST.loadSaveForTest(), true);
    assert.equal(ST.sm.storyLine, 'classic');
});
