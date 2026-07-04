// Mystery Figure — post-HoF climax rework (2026-07, Part B).
//
// The final encounter keeps its mirror-self mechanics (HoF-snapshot team, +30%
// mult, main.mfBattle boss config) and gains:
//   • Result-branching dialogue keyed on the City-8 first encounter
//     (sm.mfEncounter1): row-67 cold-open extra line + VS-splash callback line.
//   • A third no-punishment loss option: "Accept the Loss" → sm.mfFinalResult =
//     'accepted_loss', climax marked done, endgame opens, gold untouched, and
//     the MASK STAYS ON (main.mfReveal unfired — the reveal is the prize for a
//     later Crucible-encore win, which upgrades the result to 'won').
//   • Free retreat from the pending climax on every difficulty.
//   • A result-keyed coda on the post-HoF Oak epilogue.
//
// Run: node --test tests/suites/mystery-figure-final-rework.test.js

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let W, ST, SER, mysteryRowIdx;
before(async () => {
    ({ window: W } = await loadEngine());
    ST = W.__storyTest;
    SER = ST.STORY_EVENTS_RAW;
    mysteryRowIdx = SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && String(r[2]) === 'Mystery Figure');
    assert.ok(mysteryRowIdx >= 0, 'Mystery Figure battle row exists');
});

function seedClimaxLoss(extra = {}) {
    ST.sm = Object.assign(ST.sm, {
        active: true, badges: 8, gold: 9000, runSeed: 7, eventIndex: mysteryRowIdx,
        team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], evs: {} }, id: 'm_x' }],
        settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9], megaOn: true, zOn: true, dynaOn: true, teraOn: true },
        storyDifficulty: 'normal', postHofMysteryClimaxDone: false, mfFinalResult: null,
        mfEncounter1: null, storyChoices: {}, storyEventsFired: {}, inventory: {},
        currentEnemyLock: null, crucibleBattleSource: null, pits: {},
        hofPartySnapshot: [{ name: 'Pikachu', build: { m: ['Thunderbolt'] } }],
    }, extra);
    return ST.sm;
}

function clearOverlays() {
    W.document.querySelectorAll('body > div[style*="position:fixed"], body > div[style*="position: fixed"]')
        .forEach(el => { try { el.remove(); } catch (e) {} });
}

// ── Accept the Loss ──────────────────────────────────────────────────────────

test('accept-loss: climax resolves, endgame opens, gold untouched, mask stays on', () => {
    seedClimaxLoss();
    const goldBefore = ST.sm.gold;
    W.StoryMode.acceptMysteryLossAndContinue();
    assert.equal(ST.sm.postHofMysteryClimaxDone, true, 'climax marked done — endgame opens');
    assert.equal(ST.sm.mfFinalResult, 'accepted_loss', 'outcome recorded');
    assert.equal(ST.sm.gold, goldBefore, 'no gold penalty (unlike rival concede)');
    assert.ok(!(ST.sm.storyEventsFired || {})['main.mfReveal'],
        'main.mfReveal NOT fired — the mask stays on until a real win');
    clearOverlays();
});

test('accept-loss guard: refuses when not standing on a pending Mystery loss', () => {
    seedClimaxLoss({ postHofMysteryClimaxDone: true, mfFinalResult: 'won' });
    W.StoryMode.acceptMysteryLossAndContinue();
    assert.equal(ST.sm.mfFinalResult, 'won', 'already-resolved climax is untouched');
    clearOverlays();
});

// ── Game-over UI ─────────────────────────────────────────────────────────────

test('game-over screen offers Accept the Loss only on a pending Mystery climax loss', () => {
    seedClimaxLoss();
    ST.refreshStoryGameOverRetreatUI();
    const btn = W.document.getElementById('story-gameover-btn-mystery-accept');
    assert.ok(btn, 'button exists in the game-over markup');
    assert.equal(btn.style.display, 'block', 'shown on a pending Mystery climax loss');
    assert.ok(/no cost/i.test(btn.innerHTML), 'button copy promises no cost');
    const hint = W.document.getElementById('story-gameover-center-hint');
    assert.ok(/all free/i.test(hint.textContent), 'hint spells out the free options');

    // Not shown once resolved, nor on an ordinary loss row.
    seedClimaxLoss({ postHofMysteryClimaxDone: true });
    ST.refreshStoryGameOverRetreatUI();
    assert.equal(btn.style.display, 'none', 'hidden once the climax is resolved');
    const basicRowIdx = SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && String(r[2]) !== 'Mystery Figure');
    seedClimaxLoss({ eventIndex: basicRowIdx });
    ST.refreshStoryGameOverRetreatUI();
    assert.equal(btn.style.display, 'none', 'hidden on ordinary losses');
});

// ── Free retreat from the pending climax ─────────────────────────────────────

test('retreating from the pending climax is free on every difficulty', () => {
    seedClimaxLoss({ storyDifficulty: 'hard', gold: 8000 });
    ST.applyRetreatToCity();
    assert.equal(ST.sm.gold, 8000, 'no retreat fee on the Mystery Figure row (hard difficulty)');
    assert.ok(ST.sm.eventIndex < mysteryRowIdx, 'warped back to the last city row');
});

test('control: a non-Mystery retreat on hard difficulty still charges', () => {
    const basicRowIdx = SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && String(r[2]) !== 'Mystery Figure');
    seedClimaxLoss({ storyDifficulty: 'hard', gold: 8000, eventIndex: basicRowIdx });
    ST.applyRetreatToCity();
    assert.ok(ST.sm.gold < 8000, 'ordinary retreats keep their fee on hard');
});

// ── Result-branching dialogue data ───────────────────────────────────────────

test('row-67 cold-open carries the trial framing and a line per first-encounter result', () => {
    const scene = ST.MYSTERY67_BY_VARIANT.classic;
    assert.ok(scene.lines.some(l => /sorting|test|weak/i.test(l)), 'trial/sorting framing present');
    const byResult = scene.lineByFirstEncounter || {};
    for (const key of ['won', 'lost', 'declined']) {
        assert.ok(typeof byResult[key] === 'string' && byResult[key].length > 10, `callback line for '${key}'`);
    }
});

test('main.mfSpare scene: branches on the first-encounter result + default, mask never comes off', () => {
    const scene = ST.STORY_SCENES['main.mfSpare'];
    assert.ok(scene, 'main.mfSpare exists');
    const branchAct = (scene.acts || []).find(a => Array.isArray(a.branches));
    assert.ok(branchAct, 'spare scene branches');
    const keys = [...branchAct.branches.filter(b => b.when).map(b => `${b.when.key}=${b.when.eq}`)].sort();
    assert.deepEqual(keys,
        ['main.mfFirst.result=declined', 'main.mfFirst.result=lost', 'main.mfFirst.result=won'],
        'all three first-encounter results branch');
    assert.ok(branchAct.branches.some(b => !b.when), 'default branch present');
    const allText = JSON.stringify(scene.acts);
    assert.ok(/do not remove the cap/i.test(allText), 'the mask stays on in the spare scene');
});

test('mfReveal gains the multiverse-sorting act with per-result branches', () => {
    const scene = ST.STORY_SCENES['main.mfReveal'];
    const branchActs = (scene.acts || []).filter(a => Array.isArray(a.branches));
    assert.ok(branchActs.length >= 1, 'reveal has a branch act');
    const text = JSON.stringify(branchActs);
    assert.ok(/more Professor Oaks than there are stars/.test(text), 'multiverse framing present');
    assert.ok(/sort/i.test(text), 'sorting/elimination framing present');
});

test('post-HoF Oak epilogue carries a coda per final result', () => {
    const entry = ST.POSTHOF_EPILOGUE_BY_VARIANT.classic;
    assert.ok(entry.lineByFinalResult, 'coda map present');
    assert.ok(typeof entry.lineByFinalResult.won === 'string', 'won coda');
    assert.ok(typeof entry.lineByFinalResult.accepted_loss === 'string', 'accepted-loss coda');
});
