// Plain scene bodies and the live raid narration should contain story prose.
// Mechanical phase instructions belong to the separate battle presentation.
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

test('G9: raid scenes keep phase instructions out of story prose', () => {
    const raids = Object.entries(SCENES).filter(([key]) => /\.(?:miniRaid\d*|raid)$/i.test(key));
    assert.ok(raids.some(([key]) => key === 'extra.cubone.miniRaid2'));
    for (const [key, scene] of raids) {
        const lines = [scene.body, ...Array.from(scene.acts || []).flatMap(act => Array.from(act.lines || []))];
        assert.doesNotMatch(lines.join('\n'), STAGE_DIRECTION, key);
    }
});
