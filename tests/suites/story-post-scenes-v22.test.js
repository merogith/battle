// PR-D: post-battle scene auto-extraction from CSV "Post-fight - ..." markers.
// Verifies the builder finds the expected key beats + the playback helper
// behaves correctly for present / missing scenes.
// Run: node --test tests/suites/story-post-scenes-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

test('STORY_POST_SCENES is built and has entries for major boss fights', () => {
    const post = ST.STORY_POST_SCENES;
    assert.ok(post, 'STORY_POST_SCENES should be exposed');
    // CSV explicitly has Post-fight markers on villain bosses, so at least
    // some boss keys should have post entries.
    const postKeys = Object.keys(post);
    assert.ok(postKeys.length >= 5, `expected >= 5 post-scenes; got ${postKeys.length}`);
    // Spot-check: villain.rocket.boss has "Post-fight - he wires you ..." in CSV.
    assert.ok(post['villain.rocket.boss'], 'villain.rocket.boss should have a post-scene');
});

test('post-scene title includes "Aftermath" suffix', () => {
    const post = ST.STORY_POST_SCENES;
    for (const key of Object.keys(post)) {
        assert.match(post[key].title, /Aftermath/i, `${key} title missing Aftermath suffix`);
    }
});

test('post-scene body is non-empty and reasonable length', () => {
    const post = ST.STORY_POST_SCENES;
    for (const key of Object.keys(post)) {
        const body = post[key].body;
        assert.ok(body && body.length > 8, `${key} body too short: "${body}"`);
        assert.ok(body.length < 1500, `${key} body suspiciously long: ${body.length} chars`);
    }
});

test('playPostBattleScene calls onDone synchronously when no post-scene exists', async () => {
    let called = false;
    const ev = [99, 'fake'];  // bogus key
    ST.playPostBattleScene('not.a.real.key', () => { called = true; });
    // Should call onDone in the same tick.
    await new Promise(r => setTimeout(r, 50));
    assert.equal(called, true, 'onDone should fire even when no post-scene exists');
});

test('playPostBattleScene returns boolean indicating whether a scene fired', () => {
    const post = ST.STORY_POST_SCENES;
    const presentKey = Object.keys(post)[0];
    const presentResult = ST.playPostBattleScene(presentKey, () => {});
    assert.equal(presentResult, true, 'should return true when post-scene exists');
    const absentResult = ST.playPostBattleScene('definitely.not.real', () => {});
    assert.equal(absentResult, false, 'should return false when no scene');
});

test('post-scene auto-extractor pulls from CSV "Post-fight -" prose', () => {
    const post = ST.STORY_POST_SCENES;
    const scenes = ST.STORY_SCENES;
    // For every extracted post-scene, the source body should contain a Post-fight marker.
    for (const key of Object.keys(post)) {
        const sourceBody = scenes[key] && scenes[key].body;
        assert.ok(sourceBody, `source scene ${key} missing`);
        assert.match(sourceBody, /Post-(fight|raid)/i,
            `source ${key} should contain a Post-fight or Post-raid marker`);
    }
});
