// Hidden Power availability — derived, self-healing state (2026-07). The Diviner
// (City-3 road scene) is now the narrative REVEAL, not the load-bearing switch:
// availability also derives from story progress (City 3+), and reading it at the
// point of use back-fills the persisted flag + the one-time first-pick token. So a
// Diviner scene that was skipped, fast-tracked on a replay, or predates the feature
// can never silently lock the mechanic out — the "there is no NPC / where did my
// Hidden Power go" failure mode.
//
// Locks: (1) _hpAvailable derives from City 3 and honours the explicit flag;
// (2) _hpEnsureUnlockState self-heals the flag past the threshold; (3) it lazily
// grants the first-pick token once (not re-granting after it is spent, and never
// when the mon already knows Hidden Power); (4) the tutor pool surfaces Hidden Power
// from derived availability alone.
//
// Run: node --test tests/suites/hidden-power-availability.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const W = E.window;
const HP = W.__hpTest;
const RAW = W.__narrationTest.STORY_EVENTS_RAW;

function firstCityRow(cityIdx) {
    for (let i = 0; i < RAW.length; i++) {
        const r = RAW[i];
        if (r && r[1] === 'City' && String(r[2]).match(/\d+/) && +String(r[2]).match(/\d+/)[0] === cityIdx) return i;
    }
    return -1;
}
function resetSm({ city, unlocked = false }) {
    const sm = HP.sm;
    sm.eventIndex = firstCityRow(city);
    sm.hiddenPowerUnlocked = unlocked;
    sm.hiddenPowerChoosePending = false;
    sm.hpChooseGranted = false;
    sm.team = [{ name: 'Snorlax', build: { m: ['Body Slam'], n: 'Careful' } }];
    return sm;
}

test('availability derives from City 3, and the explicit flag always wins', () => {
    resetSm({ city: 2, unlocked: false });
    assert.equal(HP.hpAvailable(), false, 'locked before City 3 when the flag is unset');
    resetSm({ city: 3, unlocked: false });
    assert.equal(HP.hpAvailable(), true, 'available from City 3 by derivation alone');
    resetSm({ city: 1, unlocked: true });
    assert.equal(HP.hpAvailable(), true, 'an explicit unlock (early Diviner) still wins pre-City-3');
});

test('self-heal: reaching City 3 back-fills the persisted unlock flag', () => {
    const sm = resetSm({ city: 3, unlocked: false });
    HP.hpEnsureUnlockState();
    assert.equal(sm.hiddenPowerUnlocked, true, 'flag back-filled from story progress (skipped Diviner recovered)');
});

test('lazy first-pick: token granted once when no Hidden Power taught yet', () => {
    const sm = resetSm({ city: 3, unlocked: false });
    HP.hpEnsureUnlockState();
    assert.equal(sm.hiddenPowerChoosePending, true, 'first-pick token granted at the point of use');
    assert.equal(sm.hpChooseGranted, true, 'issue is recorded');

    // Spend it, then re-run: it must NOT come back.
    sm.hiddenPowerChoosePending = false;
    HP.hpEnsureUnlockState();
    assert.equal(sm.hiddenPowerChoosePending, false, 'spent token is never re-granted');
});

test('no lazy token when the mon already knows Hidden Power (already past the first lesson)', () => {
    const sm = resetSm({ city: 4, unlocked: false });
    sm.team = [{ name: 'Gengar', build: { m: ['Hidden Power Ice', 'Shadow Ball'] } }];
    HP.hpEnsureUnlockState();
    assert.equal(sm.hiddenPowerUnlocked, true, 'still unlocks the mechanic');
    assert.equal(sm.hiddenPowerChoosePending, false, 'but grants no fresh first-pick — a HP is already taught');
    assert.equal(sm.hpChooseGranted, true, 'and records the token as issued so it never fires later');
});

test('below the threshold, nothing self-heals', () => {
    const sm = resetSm({ city: 1, unlocked: false });
    HP.hpEnsureUnlockState();
    assert.equal(sm.hiddenPowerUnlocked, false, 'no unlock before City 3');
    assert.equal(sm.hiddenPowerChoosePending, false, 'no token before City 3');
});

test('the tutor pool surfaces Hidden Power from derived availability alone', async () => {
    resetSm({ city: 5, unlocked: false });
    const pool = await HP._tutorGetStagedMovePoolAsync('Magikarp', ['Splash']);
    assert.ok(pool.includes('Hidden Power'), 'City-5 run offers Hidden Power even with the flag unset');
    const variants = [...pool].filter(m => /^Hidden Power/.test(m));
    assert.deepEqual(variants, ['Hidden Power'], 'still exactly one unified entry');
});
