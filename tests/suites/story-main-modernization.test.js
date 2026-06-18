// Main-story modernization (signature + regular pass). Locks the headline
// arc's interactive beats so a future content edit can't silently strip them:
// every main event beat is interactive (a micro-game signature or a flavor
// choice), the four signature games resolve through the registry, and the
// loop-capstone choice survives untouched.
// Run: node --test tests/suites/story-main-modernization.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const SS = (W.__narrationTest && W.__narrationTest.STORY_SCENES) || W.STORY_SCENES;
const REG = (W.__miniGameTest && W.__miniGameTest.registry) || {};

function actsOf(key) {
    const sc = SS && SS[key];
    return (sc && Array.isArray(sc.acts)) ? sc.acts.filter(Boolean) : [];
}
function interactionGame(key) {
    for (const a of actsOf(key)) if (a.interaction && a.interaction.gameId) return a.interaction.gameId;
    return null;
}
function hasChoice(key) {
    return actsOf(key).some(a => a.choice && a.choice.persistKey && Array.isArray(a.choice.options) && a.choice.options.length >= 2);
}

test('STORY_SCENES is present and main arc is intact', () => {
    assert.ok(SS, 'STORY_SCENES must load');
    for (const k of ['main.event1', 'main.event9', 'main.ending', 'main.mfReveal']) {
        assert.ok(SS[k], 'missing ' + k);
    }
});

test('the four main signature micro-games are wired to their beats', () => {
    const want = {
        'main.event2': 'main_song_memory',
        'main.event4': 'main_dex_spot',
        'main.event5': 'main_first_riddle',
        'main.event9': 'main_count_cipher',
    };
    for (const [key, game] of Object.entries(want)) {
        assert.equal(interactionGame(key), game, key + ' must host ' + game);
    }
});

test('every main signature game definition resolves and is the right type', () => {
    const types = {
        main_song_memory: 'memory', main_dex_spot: 'spot',
        main_first_riddle: 'riddle', main_count_cipher: 'cipher',
    };
    for (const [id, type] of Object.entries(types)) {
        assert.ok(REG[id], 'minigames.json missing ' + id);
        assert.equal(REG[id].type, type, id + ' wrong type');
    }
});

test('signature games actually resolve to a real outcome through play()', async () => {
    for (const id of ['main_song_memory', 'main_dex_spot', 'main_first_riddle', 'main_count_cipher']) {
        const res = await W.StoryMiniGames.play(id, {});
        assert.ok(['win', 'lose'].includes(res.outcome), id + ' must resolve to win/lose, got ' + res.outcome);
    }
});

test('the remaining main event beats carry a flavor choice (interactive every step)', () => {
    for (const k of ['main.event3', 'main.event6', 'main.event7', 'main.event8']) {
        assert.ok(hasChoice(k), k + ' must offer a flavor choice');
    }
});

test('the loop capstone choice is preserved untouched', () => {
    const acts = actsOf('main.ending');
    const cap = acts.find(a => a.choice && a.choice.persistKey === 'main.loop.remember');
    assert.ok(cap, 'main.ending must keep the remember/forget capstone');
    const vals = cap.choice.options.map(o => o.value);
    assert.ok(vals.includes('forget') && vals.includes('remember'), 'both loop branches must remain');
});

test('main signature beats carry tone framing (regular pass)', () => {
    let toned = 0;
    for (const k of ['main.event2', 'main.event3', 'main.event4', 'main.event5', 'main.event6', 'main.event7', 'main.event8', 'main.event9']) {
        if (actsOf(k).some(a => typeof a.tone === 'string' && a.tone)) toned++;
    }
    assert.ok(toned >= 6, 'most main event beats should carry a per-act tone, got ' + toned);
});
