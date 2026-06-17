// Journal 3-track visibility (2026-06): the Adventure Journal must surface ALL
// THREE story tracks — the static Main spine, the run's Villain arc, and the
// run's Extra/Mystery arc — each with a "done / total chapters" progress count.
// Before this change `_journalRenderHTML` rendered villain + extra only and
// omitted the Main track entirely (same omission in the HUD objective subline
// and the "Previously…" recap). These tests lock the Main track back in and
// guard the progress count + per-chapter check marks.
// Run: node --test tests/suites/story-journal-tracks.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

// A deterministic mid-run state: 2 main chapters seen, 1 villain (Rocket) chapter
// seen, no extra (Cubone) chapters seen. Pure data — the render helpers are pure
// reads of sm (no RNG, no DOM beyond the returned HTML string).
function plantRun() {
    ST.sm = {
        active: true,
        badges: 4,
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {
            'main.event1': true,
            'main.event2': true,
            'villain.rocket.event1': true,
        },
        errands: {}, npcsMet: {}, storyChoices: {},
    };
}

test('journal renders all three tracks with labels', () => {
    plantRun();
    const html = ST.journalRenderHTML();
    assert.match(html, /★ Main Story/, 'Main Story track must be present (was omitted before)');
    assert.match(html, /Villain · Rocket/, 'Villain track must be labelled with its arc');
    assert.match(html, /Mystery · Cubone/, 'Extra/Mystery track must be labelled with its arc');
});

test('journal shows per-track progress counts and check marks', () => {
    plantRun();
    const html = ST.journalRenderHTML();
    // Each track block carries an "N / M chapters" count.
    assert.match(html, /\d+ \/ \d+ chapters/, 'a chapter progress count must render');
    // A fired main chapter shows a check; an unfired one shows a bullet.
    assert.match(html, /✓/, 'a fired chapter shows a check mark');
    assert.match(html, /•/, 'an unfired chapter shows a bullet');
});

test('HUD objective subline includes the Main story status', () => {
    plantRun();
    const line = ST.storyThreadObjectiveLine();
    assert.match(line, /★/, 'objective subline must include the Main-story status (★)');
    assert.match(line, /Badge 4\/8/, 'objective subline still shows badge progress');
});

test('recap lines include the Main story thread', () => {
    plantRun();
    const lines = ST.storyRecapLines();
    const joined = lines.join('\n');
    assert.match(joined, /★ Main Story — \d+ of \d+ beats seen/, 'recap must include the Main thread');
});
