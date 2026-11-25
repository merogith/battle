// The Notebook groups the scenes the player has seen by story track and hides
// undiscovered tracks. The HUD and the recap still show the main journey's status.
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

test('journal labels discovered story tracks', () => {
    plantRun();
    const html = ST.journalRenderHTML();
    assert.match(html, /<h3>Main Story<\/h3>/);
    assert.match(html, /Villain · Rocket/, 'Villain track must be labelled with its arc');
    assert.doesNotMatch(html, /Mystery · Cubone/, 'the Mystery track has yet to appear');
    ST.sm.storyEventsFired['extra.cubone.event1'] = true;
    assert.match(ST.journalRenderHTML(), /Mystery · Cubone/, 'the Mystery track appears after the first scene');
});

test('the encounter history is folded away and reveals discovered chapter titles', () => {
    plantRun();
    const html = ST.journalRenderHTML();
    const journal = W.document.createElement('div');
    journal.innerHTML = html;
    assert.equal(journal.querySelector('details').open, false);
    assert.ok(journal.textContent.includes(ST.STORY_SCENES['main.event1'].title));
    assert.ok(!journal.textContent.includes(ST.STORY_SCENES['main.event3'].title));
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
