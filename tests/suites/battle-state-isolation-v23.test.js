// Between-battle STATE ISOLATION — regression net for the state-bleed fix.
// See docs/story-design/STORY_FLOW_AUDIT.md §8a. `state` is a persistent
// module-level object reused across Story battles; before the fix, startBattle
// only reset a fixed field list, so boss/raid mechanics, the battle log, and
// Healing Wish / Lunar Dance flags bled into the next fight — most severely the
// boss immunity hook, which clamped a follow-up fight's damage to 0.
//
// Run: node --test tests/suites/battle-state-isolation-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window, engine } = h;

const BUILD = {
    m: ['Tackle', 'Tackle', 'Tackle', 'Tackle'], i: null, a: null, n: 'Hardy',
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
};

// Simulate the residue a prior boss/raid fight leaves on the shared `state`.
function injectBossBleed(st) {
    st._activeStoryBeatKey = 'villain.rocket.boss';
    st._bossImmuneTurns = 2; st._bossSurgeTurns = 3;
    st._bossMechanics = [{ type: 'hpThresholdPhase', effect: 'immunity' }];
    st._bossMechanicsFired = { a: 1 }; st._bossPendingTelegraphs = [1];
    st._bossWeatherLocked = true; st._bossTerrainLocked = true;
    st._healingWish = true; st._healingWishFoe = true;
    st._lunarDance = true; st._lunarDanceFoe = true;
    st._fTeraReserveLogged = true;
}

// Inject bleed, stamp the log, then run the REAL startBattle (which rebuilds the
// parties from the drafts and runs the reset block under test).
async function startFreshAfterBleed(playerMoves) {
    const st = engine.state;
    st.mode = 'pve';
    st.p1Draft = [{ name: 'Machamp', build: { ...BUILD, m: playerMoves || BUILD.m } }];
    st.p2Draft = [{ name: 'Rattata', build: BUILD }];
    injectBossBleed(st);
    const logEl = window.document.getElementById('battle-log');
    if (logEl) logEl.innerHTML = '<div>PREVIOUS FIGHT LINE</div>';
    await window.startBattle();
    return st;
}

test('BLEED-1: startBattle clears bled boss/raid mechanics', async () => {
    const st = await startFreshAfterBleed();
    assert.equal(st._activeStoryBeatKey, null, '_activeStoryBeatKey gates the surge/immunity hooks');
    assert.equal(st._bossImmuneTurns, 0);
    assert.equal(st._bossSurgeTurns, 0);
    assert.equal(st._bossMechanics, null);
    assert.equal(st._bossMechanicsFired, null);
    assert.equal(st._bossPendingTelegraphs, null);
    assert.equal(st._bossWeatherLocked, false);
    assert.equal(st._bossTerrainLocked, false);
});

test('BLEED-3: startBattle clears bled Healing Wish / Lunar Dance flags', async () => {
    const st = await startFreshAfterBleed();
    assert.equal(st._healingWish, false);
    assert.equal(st._healingWishFoe, false);
    assert.equal(st._lunarDance, false);
    assert.equal(st._lunarDanceFoe, false);
    assert.equal(st._fTeraReserveLogged, false);
});

test('BLEED-2: startBattle clears the battle log (no previous-fight lines)', async () => {
    await startFreshAfterBleed();
    const logEl = window.document.getElementById('battle-log');
    assert.ok(logEl, 'battle-log element exists');
    assert.equal(logEl.innerHTML.indexOf('PREVIOUS FIGHT LINE'), -1, 'previous fight log must not bleed in');
});

test('BLEED-1 consequence: a post-boss ordinary fight no longer clamps damage to 0', async () => {
    const st = await startFreshAfterBleed(['Close Combat', 'Tackle', 'Tackle', 'Tackle']);
    st.fActive.currentHp = st.fActive.maxHp;
    const before = st.fActive.currentHp;
    const captured = [];
    const realLog = window.logMsg;
    window.logMsg = (m) => { captured.push(String(m)); };
    try {
        if (window.setForcedFoeMoveSlot) window.setForcedFoeMoveSlot(0);
        await window.playTurn(0, null);
    } finally { window.logMsg = realLog; }
    const dmg = before - st.fActive.currentHp;
    const braced = captured.some(l => /braces|does no damage/i.test(l));
    assert.ok(dmg > 0, `expected real damage in the next fight, got ${dmg} (boss immunity bled in)`);
    assert.ok(!braced, 'no boss-immunity "braces" message should fire in an ordinary fight');
});
