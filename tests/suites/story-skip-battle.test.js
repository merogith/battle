// Pacifist / ransom "no fight" route. Locks the rare skipBattle path: the
// effect stamps a per-row flag, a choice option can carry it, and the
// resolution helper marks the beat fired + advances the timeline WITHOUT a
// battle (and grants no combat loot — peace costs the loot, by design).
// Run: node --test tests/suites/story-skip-battle.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const MG = W.__miniGameTest;
const ST = W.__storyTest;

test('skip path is exposed', () => {
    assert.equal(typeof W._storyResolveBeatBySkip, 'function');
    assert.equal(typeof W._mgBattleModForRow, 'function');
});

test('skipBattle effect stamps the row flag battleModForRow reads back', () => {
    const sm = ST.sm;
    sm.flags = {}; sm.eventIndex = 9;
    MG.applyOutcome({ skipBattle: true });
    assert.equal(W._mgBattleModForRow(9).skip, true);
});

test('a choice-option effect can carry skipBattle (ransom route)', () => {
    const sm = ST.sm;
    sm.flags = {}; sm.eventIndex = 14;
    // Mirrors the overlay choice handler: apply the option effect through the
    // sanctioned helper. A "pay the ransom" option would also include gold:-N.
    W._applyStoryInteractionOutcome({ gold: 0, skipBattle: true, row: 14 });
    assert.equal(W._mgBattleModForRow(14).skip, true);
});

test('_storyResolveBeatBySkip marks the beat fired, advances, and clears the flag', () => {
    const sm = ST.sm;
    const beatKey = '__test_skip_beat__';
    sm.eventIndex = 5;
    sm.flags = { 'mgSkipBattle:5': true };
    sm.storyEventsFired = {};
    sm._activeBeatBattleKey = beatKey;
    let advanced = false;
    // beatKey isn't a real scene → _playPostBattleScene short-circuits to onDone.
    W._storyResolveBeatBySkip(beatKey, null, () => { advanced = true; });
    assert.equal(sm.storyEventsFired[beatKey], true, 'beat marked fired');
    assert.equal(sm.eventIndex, 6, 'timeline advanced one row');
    assert.ok(!sm.flags['mgSkipBattle:5'], 'skip flag consumed');
    assert.ok(!sm._activeBeatBattleKey, 'in-flight beat key cleared');
    assert.ok(advanced, 'continuation ran');
});

test('skip resolution clamps at the final timeline row (never overruns)', () => {
    const sm = ST.sm;
    const last = W.STORY_EVENTS_RAW.length - 1;
    sm.eventIndex = last;
    sm.flags = { ['mgSkipBattle:' + last]: true };
    sm.storyEventsFired = {};
    sm._activeBeatBattleKey = '__test_skip_last__';
    W._storyResolveBeatBySkip('__test_skip_last__', null, () => {});
    assert.equal(sm.eventIndex, last, 'eventIndex stays clamped at the last row');
});
