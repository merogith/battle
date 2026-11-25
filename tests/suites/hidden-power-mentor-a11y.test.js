// Hidden Power mentor — trigger reachability + type-picker accessibility (2026-07).
//
// Two regressions this locks against:
//   (1) The Diviner must actually fire in play. It is gated to the City-3 approach
//       inside enterCity (deliberate 2026-07 pacing — deferred from City 1 so the
//       fundamentals land first). If that gate ever drifts to a city index the run
//       never enters through enterCity, the whole feature goes silently missing —
//       exactly the "there is no NPC" report. We drive enterCity at a City-3 row and
//       assert the Diviner overlay renders.
//   (2) The one-time type picker (_chooseHiddenPowerType) is a modal dialog and must
//       carry the same keyboard / screen-reader contract as its sibling tutorial
//       overlay: a labeled dialog, a real element choice to focus, and Escape → cancel.
//       Before this it had Escape only — no focus target, no Tab containment.
//
// Run: node --test tests/suites/hidden-power-mentor-a11y.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const W = E.window;
const doc = W.document;
const HP = W.__hpTest;

function clearOverlays() {
    [...doc.querySelectorAll('.story-tutorial-overlay')].forEach(n => n.remove());
}

function firstCityRow(cityIdx) {
    const RAW = W.__narrationTest.STORY_EVENTS_RAW;
    for (let i = 0; i < RAW.length; i++) {
        const r = RAW[i];
        if (r && r[1] === 'City' && String(r[2]).match(/\d+/) && +String(r[2]).match(/\d+/)[0] === cityIdx) return i;
    }
    return -1;
}

test('the Diviner fires on the City-3 approach (trigger is reachable in play)', () => {
    clearOverlays();
    const cityRow = firstCityRow(3);
    assert.ok(cityRow > 0, 'there is a City3 row in the timeline');
    const sm = HP.sm;
    sm.scenesShown = {};
    sm.hiddenPowerUnlocked = false;
    sm.hiddenPowerChoosePending = false;
    sm.atCrucible = false;
    sm.citiesArrived = { 0: true, 1: true, 2: true };
    sm.eventIndex = cityRow;
    try { W.settings.replayTutorials = true; } catch (e) {}
    W.StoryMode.enterCity();
    const ov = doc.querySelector('.story-tutorial-overlay');
    assert.ok(ov, 'a tutorial overlay rendered on entering City 3');
    const nm = ov.querySelector('.story-tutorial-name');
    assert.ok(nm && /Diviner/i.test(nm.textContent), 'it is the Wandering Diviner');
    clearOverlays();
});

test('the Diviner does NOT fire at City 2 (gate is city-specific, not "any city")', () => {
    clearOverlays();
    const cityRow = firstCityRow(2);
    const sm = HP.sm;
    sm.scenesShown = {};
    sm.hiddenPowerUnlocked = false;
    sm.atCrucible = false;
    sm.citiesArrived = { 0: true, 1: true };
    sm.eventIndex = cityRow;
    try { W.settings.replayTutorials = true; } catch (e) {}
    W.StoryMode.enterCity();
    const ov = doc.querySelector('.story-tutorial-overlay');
    const name = ov && ov.querySelector('.story-tutorial-name');
    assert.ok(!ov || !/Diviner/i.test((name && name.textContent) || ''), 'no Diviner at City 2');
    clearOverlays();
});

test('the type picker is an accessible modal: labeled dialog, focusable choice, Escape cancels', async () => {
    clearOverlays();
    HP.sm.hiddenPowerChoosePending = true;
    const opener = doc.createElement('button');
    doc.body.append(opener);
    opener.focus();
    const p = HP.chooseHiddenPowerType({ name: 'Eevee', build: { hpType: 'Ice' } });
    const ov = doc.querySelector('.story-tutorial-overlay[aria-label="Choose Hidden Power type"]');
    assert.ok(ov, 'picker overlay rendered');
    assert.equal(ov.getAttribute('role'), 'dialog', 'role=dialog');
    assert.equal(ov.getAttribute('aria-modal'), 'true', 'aria-modal=true');
    assert.equal(ov.tabIndex, -1, 'overlay is focus-programmable (tabIndex -1)');
    const group = ov.querySelector('[role="group"][aria-labelledby]');
    assert.ok(group, 'the type badges form a labeled group');
    const badges = ov.querySelectorAll('button[data-hp]');
    assert.equal(badges.length, W.HP_TYPES.length - 1, 'one button for every alternative to the natural element');
    assert.ok([...badges].every(b => b.getAttribute('aria-label')), 'every type button is aria-labelled');
    const natural = ov.querySelector('button[data-hp-natural]');
    const cancel = ov.querySelector('button[data-hp-cancel]');
    assert.equal(natural.textContent, 'Keep Ice');
    assert.equal(doc.activeElement, natural, 'focus lands on the natural element');
    doc.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
    assert.equal(doc.activeElement, cancel, 'keyboard focus wraps within the picker');

    // Escape resolves the promise to null (cancel) and tears the overlay down.
    doc.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape' }));
    const val = await p;
    assert.equal(val, null, 'Escape cancels the picker (resolves null)');
    assert.ok(!doc.querySelector('.story-tutorial-overlay[aria-label="Choose Hidden Power type"]'), 'overlay removed on cancel');
    assert.equal(doc.activeElement, opener, 'cancel returns focus to the opener');
    opener.remove();
    clearOverlays();
});

test('picking an element resolves that type and the guard blocks a second Hidden Power', async () => {
    clearOverlays();
    HP.sm.hiddenPowerChoosePending = true;
    const p = HP.chooseHiddenPowerType({ name: 'Snorlax', build: { hpType: 'Ice' } });
    const fire = doc.querySelector('button[data-hp="Fire"]');
    assert.ok(fire, 'Fire choice present');
    fire.click();
    assert.equal((await p)?.chosenType, 'Fire', 'clicking a badge resolves its type');
    clearOverlays();

    // A mon that already knows a Hidden Power cannot be taught a second one.
    const mon = { name: 'Gengar', build: { m: ['Hidden Power Ice', 'Shadow Ball'] } };
    const pre = await HP._hpTutorPreteach(mon, 'Hidden Power');
    assert.equal(pre.proceed, false, 'second Hidden Power is refused');
    clearOverlays();
});
