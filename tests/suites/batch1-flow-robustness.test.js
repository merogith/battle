// Batch-1 (W2) flow & robustness fixes — regression net.
// Covers:
//  1. Mystery Figure forced mechanics ctx actually bypasses the unlock gate
//     (was dead code: unlockedGimmicks derives from the same settings toggles).
//  2. proceedToNextBattle egg-only-party guard (fighter-count parity with the
//     fight-launch guard — egg-only used to advance eventIndex then bounce).
//  3. _daycareDropOff last-fighter re-check (handler is directly callable;
//     only the BUTTON was gated before).
//  4. Victory overlay: milestone (gotBadge) overlays no longer auto-dismiss;
//     routine overlays still auto-advance on a content-scaled timer.
//  5. End-of-turn residual isolation: a throwing residual effect no longer
//     aborts the turn tail into the generic "[... Turn skipped.]" catch, and
//     window._lastTurnError records what failed.
//
// Run: node --test tests/suites/batch1-flow-robustness.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window, engine } = h;
const T = window.__storyTest;
const sm = T.sm;

const BUILD = {
    m: ['Tackle', 'Tackle', 'Tackle', 'Tackle'], i: null, a: null, n: 'Hardy',
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
};

function snapshotSm() {
    return {
        team: sm.team, settings: sm.settings, unlockedGimmicks: sm.unlockedGimmicks,
        eventIndex: sm.eventIndex, gold: sm.gold, badges: sm.badges, daycare: sm.daycare,
        active: sm.active,
    };
}
function restoreSm(s) { Object.assign(sm, s); }

test('Mystery Figure ctx bypasses the unlock gate; default path still respects it', () => {
    const snap = snapshotSm();
    try {
        sm.active = false; // plain Math.random path; assignment outcome is what matters
        sm.unlockedGimmicks = [];
        sm.settings = { megaOn: false, dynaOn: false, teraOn: false, zOn: false, classicMode: true };
        const mk = () => [
            { name: 'Charizard', build: { ...BUILD } },
            { name: 'Venusaur', build: { ...BUILD } },
            { name: 'Blastoise', build: { ...BUILD } },
            { name: 'Gengar', build: { ...BUILD } },
        ];
        // No ctx: zero mech keys -> every build untouched (STANDARD).
        const plain = T.applyEnemyGimmickDistribution(mk(), 'Mystery Figure', null);
        assert.ok(plain.every(p => !p.build.gimmick || p.build.gimmick === 'STANDARD'),
            'without a forced ctx and with nothing unlocked, no foe rolls a mechanic');
        // Forced ctx (what rollMysteryFigureFinalBossTeam passes): mechanics
        // must be assignable even though unlockedGimmicks is empty.
        const ctx = { settings: { megaOn: true, dynaOn: true, teraOn: true, zOn: true, classicMode: true } };
        const forced = T.applyEnemyGimmickDistribution(mk(), 'Mystery Figure', ctx);
        assert.ok(forced.some(p => p.build.gimmick && p.build.gimmick !== 'STANDARD'),
            'forced ctx assigns at least one real mechanic (was dead: unlock gate filtered everything)');
    } finally { restoreSm(snap); }
});

test('proceedToNextBattle blocks an egg-only party without advancing eventIndex', () => {
    const snap = snapshotSm();
    const origAlert = window.showGameAlert;
    const alerts = [];
    try {
        window.showGameAlert = (msg) => alerts.push(String(msg));
        sm.team = [{ id: 'egg-test-1', name: 'Egg', isEgg: true }];
        sm.eventIndex = 3;
        window.StoryMode.proceedToNextBattle();
        assert.equal(sm.eventIndex, 3, 'eventIndex must not advance for a 0-fighter party');
        assert.ok(alerts.some(m => /battle-ready/i.test(m)), 'player is told the party is eggs-only');
    } finally { window.showGameAlert = origAlert; restoreSm(snap); }
});

test('_daycareDropOff refuses to take the last party fighter', () => {
    const snap = snapshotSm();
    const origAlert = window.showGameAlert;
    const alerts = [];
    try {
        window.showGameAlert = (msg) => alerts.push(String(msg));
        sm.daycare = {};
        sm.team = [{ id: 'last-fighter-1', name: 'Pikachu', build: { ...BUILD } }];
        T.daycareDropOff('last-fighter-1');
        assert.equal(sm.team.length, 1, 'team unchanged');
        assert.equal(sm.team[0].id, 'last-fighter-1', 'the fighter was not swapped for an egg');
        assert.ok(!sm.team[0].isEgg, 'no egg replaced the last fighter');
        assert.ok(alerts.some(m => /battle-ready/i.test(m)), 'player is told why');
    } finally { window.showGameAlert = origAlert; restoreSm(snap); }
});

test('victory overlay: milestone holds for explicit Continue; routine auto-advances', async () => {
    const snap = snapshotSm();
    try {
        sm.gold = 1000; sm.badges = 1;
        // Milestone (gotBadge=true): no auto-close. Wait past the old 6s yank.
        let milestoneAdvanced = 0;
        T.showVictoryOverlay('VICTORY!', 100, true, () => { milestoneAdvanced++; }, 'Gym Leader 1', 5, []);
        await new Promise(r => setTimeout(r, 6800));
        assert.equal(milestoneAdvanced, 0, 'milestone overlay must NOT auto-advance (old code yanked at 6s)');
        const overlay = window.document.querySelector('[role="dialog"][aria-label="VICTORY!"]');
        assert.ok(overlay, 'milestone overlay still on screen');
        // Explicit Continue still works.
        const btn = Array.from(overlay.querySelectorAll('button')).find(b => /Continue/.test(b.textContent));
        btn.click();
        assert.equal(milestoneAdvanced, 1, 'Continue advances exactly once');
        assert.ok(!overlay.parentElement, 'overlay removed after Continue');

        // Routine (gotBadge=false): auto-advances on the content-scaled timer.
        let routineAdvanced = 0;
        T.showVictoryOverlay('VICTORY!', 50, false, () => { routineAdvanced++; }, null, null, []);
        const deadline = Date.now() + 14000;
        while (routineAdvanced === 0 && Date.now() < deadline) {
            await new Promise(r => setTimeout(r, 250));
        }
        assert.equal(routineAdvanced, 1, 'routine overlay still auto-advances (content-scaled timer)');
    } finally { restoreSm(snap); }
});

test('a throwing end-of-turn residual no longer skips the turn tail', async () => {
    const st = engine.state;
    st.mode = 'pve';
    st.p1Draft = [{ name: 'Machamp', build: { ...BUILD } }];
    st.p2Draft = [{ name: 'Rattata', build: { ...BUILD } }];
    await window.startBattle();

    const origEot = window.endOfTurnEffects;
    const logEl = window.document.getElementById('battle-log');
    if (logEl) logEl.innerHTML = '';
    window._lastTurnError = null;
    try {
        window.endOfTurnEffects = () => { throw new Error('residual-boom'); };
        const turnsBefore = st.pActive.turnCount | 0;
        await window.playTurn(0, null);
        assert.ok(window._lastTurnError, '_lastTurnError recorded');
        assert.match(String(window._lastTurnError.step || ''), /residuals/, 'failure attributed to the residual step');
        assert.equal(window._lastTurnError.message, 'residual-boom');
        assert.ok((st.pActive.turnCount | 0) > turnsBefore, 'turn tail still ran (turnCount incremented)');
        assert.equal(st.isLocked, false, 'input lock released');
        const logText = logEl ? logEl.textContent : '';
        assert.ok(!/Turn skipped/.test(logText), 'no misleading "[... Turn skipped.]" line for a residual-only failure');
    } finally {
        window.endOfTurnEffects = origEot;
        window._lastTurnError = null;
    }
});
