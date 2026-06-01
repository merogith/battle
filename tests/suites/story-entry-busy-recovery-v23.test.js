// Story battle-entry wedge guard — _storyBattleEntryBusy must never latch true.
// proceedToNextBattle sets the flag on entry and only enterCity / launchBattle
// clear it. A throw in the cold-open (`_runStoryColdOpen` onPlayed) or beat-
// scene (`enterBattleEvent` beat continuation) used to be swallowed by a
// log-only catch WITHOUT releasing the flag — latching it true and wedging
// every later proceedToNextBattle with "Finish your current action first", a
// hard progression soft-lock with no in-game recovery. _storyRecoverFromEntry-
// Failure now releases the flag (and falls back to the city) on any such throw.
//
// Run: node --test tests/suites/story-entry-busy-recovery-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const T = h.window.__storyTest;

test('test hooks reach the real module flag (scope sanity)', () => {
    T.setBattleEntryBusy(true);
    assert.equal(T.battleEntryBusy(), true, 'setter updates the module-scope _storyBattleEntryBusy');
    T.setBattleEntryBusy(false);
    assert.equal(T.battleEntryBusy(), false);
});

test('recoverFromEntryFailure releases a latched busy flag (no wedge)', () => {
    T.setBattleEntryBusy(true);
    assert.equal(T.battleEntryBusy(), true, 'precondition: flag latched as if mid-entry');
    T.recoverFromEntryFailure('test', new Error('boom'));
    assert.equal(T.battleEntryBusy(), false,
        'flag released so a later proceedToNextBattle is not wedged');
});

test('recovery is self-contained — never throws out even if enterCity fails', () => {
    T.setBattleEntryBusy(true);
    assert.doesNotThrow(() => T.recoverFromEntryFailure('test-2', new Error('boom2')));
    assert.equal(T.battleEntryBusy(), false);
});
