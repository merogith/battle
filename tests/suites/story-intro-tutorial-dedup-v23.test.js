// INTRO-1 — wild double-tutorial dedup. See STORY_FLOW_AUDIT.md §8b.
// The intro route node chains catchTutorial → wildRoute (chainAfter:true), so
// firstWild ("Catching 101") and firstWildRoute ("The Road") fired as two
// back-to-back Prof. Oak overlays both re-explaining ball odds + flee. The fix
// routes the catch-screen tutorial pick through _catchIntroSceneId, which
// suppresses the route overlay once the catch tutorial taught catching this run.
//
// Run: node --test tests/suites/story-intro-tutorial-dedup-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window } = h;
const T = window.__storyTest;
const sm = window.StoryMode.state;
const FIRST_WILD_KEY = 'tutorial-first-wild'; // STORY_TUTORIAL_SCENES.firstWild.metaKey

function clearScenes() { sm.scenesShown = {}; }

test('catch-tutorial state picks firstWild', () => {
    clearScenes();
    assert.equal(T.catchIntroSceneId({ tutorialMode: true }), 'firstWild');
});

test('safari state picks firstSafariCatch', () => {
    clearScenes();
    assert.equal(T.catchIntroSceneId({ safariMode: true }), 'firstSafariCatch');
});

test('null state picks no intro tutorial', () => {
    clearScenes();
    assert.equal(T.catchIntroSceneId(null), null);
});

test('normal wild before the catch tutorial picks firstWildRoute', () => {
    clearScenes();
    assert.equal(T.catchIntroSceneId({}), 'firstWildRoute');
});

test('INTRO-1: a normal wild AFTER the catch tutorial is suppressed (no double overlay)', () => {
    clearScenes();
    // The catch tutorial showed firstWild, which marks its metaKey before the
    // chained wildRoute encounter renders.
    sm.scenesShown[FIRST_WILD_KEY] = true;
    assert.equal(T.catchIntroSceneId({}), null,
        'firstWildRoute must not fire right after the catch tutorial already taught catching');
});

test('INTRO-1 guard does not touch the catch-tutorial or safari branches', () => {
    clearScenes();
    sm.scenesShown[FIRST_WILD_KEY] = true;
    // tutorialMode/safariMode short-circuit before the guard; downstream
    // playStoryTutorial still per-run-dedups the actual overlay.
    assert.equal(T.catchIntroSceneId({ tutorialMode: true }), 'firstWild');
    assert.equal(T.catchIntroSceneId({ safariMode: true }), 'firstSafariCatch');
});
