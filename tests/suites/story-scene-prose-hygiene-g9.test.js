// G9 — prose hygiene. Some battle/raid STORY_SCENES carry raw stage-directions in
// their `body` field (e.g. extra.cubone.miniRaid2: "At 50% HP it gains +1 priority
// on Bone Club"). That mechanics text must never reach the player as narration.
//
// It doesn't today: a scene's `body` is only rendered by _playStoryBeatScene's
// legacy flat path, which runs ONLY when the scene has no `acts` array. Every
// scene that carries stage-directions in its body also has `acts`, so the body is
// never shown — the mechanics live there purely as authoring notes. (The post-scene
// builder reads `body` too, but only scrapes "Post-fight - '…'" markers, and
// _playPostBattleScene prefers the structured `outro`.)
//
// This test LOCKS that invariant so a future scene authored without `acts` can't
// silently leak mechanics into prose.
//
// Run: node --test tests/suites/story-scene-prose-hygiene-g9.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;
const SCENES = ST.STORY_SCENES;

// Clearly-mechanical stage-direction markers (kept deliberately specific so it
// can't false-positive on ordinary prose).
const STAGE_DIRECTION = /At \d+%|\bPhase \d|takes no damage|\+\d+\s*priority|for \d+ turns?|\bimmune to\b|does not flinch/i;

const hasActs = (s) => Array.isArray(s.acts) && s.acts.length > 0;

test('G9: no RENDERED scene body leaks stage-directions (body shows only for acts-less scenes)', () => {
    const leaks = [];
    for (const key of Object.keys(SCENES)) {
        const s = SCENES[key];
        if (!s || hasActs(s) || !s.body) continue;          // acts-scenes never render body
        if (STAGE_DIRECTION.test(String(s.body))) leaks.push(key);
    }
    assert.deepEqual(leaks, [],
        'these acts-less scenes would render mechanics as prose: ' + leaks.join(', '));
});

test('G9: every scene with stage-directions in body also has acts (so the body stays unrendered)', () => {
    const offenders = [];
    let withStageDirs = 0;
    for (const key of Object.keys(SCENES)) {
        const s = SCENES[key];
        if (!s || !s.body) continue;
        if (!STAGE_DIRECTION.test(String(s.body))) continue;
        withStageDirs++;
        if (!hasActs(s)) offenders.push(key);
    }
    assert.deepEqual(offenders, [],
        'stage-direction body without acts (would leak to the player): ' + offenders.join(', '));
    // Guard against a vacuous pass: there really ARE scenes with mechanics in body
    // (the raids), so the invariant above is exercising live data.
    assert.ok(withStageDirs > 0, 'expected some scene bodies to carry stage-directions (the raids)');
});
