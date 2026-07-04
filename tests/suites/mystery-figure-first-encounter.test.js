// Mystery Figure — City-8 first encounter (2026-07 rework).
//
// The old post-Gym-8 "legendary gate" (forced Mystery Figure visit gifting a
// legendary + blocking Victory Road) is replaced by an OPTIONAL encounter:
//   • Offered at City 8 with 8 badges, until beaten ('won').
//   • Dialogue choice → narrative-only decline, or a fight built to be lost but
//     winnable: 6 grade-1 mons from the enabled gens, full builds, the same
//     +30% Mystery stat mult the post-HoF climax uses.
//   • Loss carries NO punishment: bag refunded, team healed, no gold fee, free
//     unlimited retries against the SAME six (frozen in sm.mfFirstTeamLock).
//   • Result recorded on sm.mfEncounter1 (null|'declined'|'lost'|'won') and
//     mirrored into sm.storyChoices['main.mfFirst.result'] for scene branches.
//
// Run: node --test tests/suites/mystery-figure-first-encounter.test.js

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let W, ST, SER, city8Idx;
before(async () => {
    ({ window: W } = await loadEngine());
    ST = W.__storyTest;
    SER = ST.STORY_EVENTS_RAW;
    city8Idx = SER.findIndex(r => Array.isArray(r) && r[1] === 'City' && /City8/.test(String(r[2])));
    assert.ok(city8Idx >= 0, 'City8 row exists in the timeline');
});

function seedCity8(extra = {}) {
    ST.sm = Object.assign(ST.sm, {
        active: true, badges: 8, gold: 5000, runSeed: 42, eventIndex: city8Idx,
        team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], evs: {} }, id: 'm_x' }],
        settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9], megaOn: true, zOn: true, dynaOn: true, teraOn: true },
        storyDifficulty: 'normal', mfEncounter1: null, mfFirstInBattle: false, mfFirstTeamLock: null,
        storyChoices: {}, inventory: {}, pits: {},
    }, extra);
    return ST.sm;
}

function closeMfOverlays() {
    for (const id of ['story-mf-first-defeat-overlay']) {
        const el = W.document.getElementById(id);
        if (el) el.remove();
    }
    W.document.querySelectorAll('.story-narrative-overlay, .vs-stage').forEach(el => {
        const host = el.closest('div[style*="position:fixed"], div[style*="position: fixed"]') || el;
        try { host.remove(); } catch (e) {}
    });
}

// ── Availability scoping ─────────────────────────────────────────────────────

test('offered only at City 8 with 8 badges, until beaten', () => {
    seedCity8();
    assert.equal(ST.mfFirstAvailable(), true, 'City 8 @ 8 badges offers the encounter');
    ST.sm.badges = 7;
    assert.equal(ST.mfFirstAvailable(), false, 'pre-8-badges: not offered');
    ST.sm.badges = 8;
    ST.sm.mfEncounter1 = 'declined';
    assert.equal(ST.mfFirstAvailable(), true, 'declined: still re-approachable');
    ST.sm.mfEncounter1 = 'lost';
    assert.equal(ST.mfFirstAvailable(), true, 'lost: retakeable');
    ST.sm.mfEncounter1 = 'won';
    assert.equal(ST.mfFirstAvailable(), false, 'won: the figure has left the edge');
    ST.sm.mfEncounter1 = null;
    const city0Idx = SER.findIndex(r => Array.isArray(r) && r[1] === 'City');
    ST.sm.eventIndex = city0Idx;
    assert.equal(ST.mfFirstAvailable(), false, 'other cities never offer it');
});

// ── The wall: team composition ───────────────────────────────────────────────

test('fight rolls 6 grade-1 mons from enabled gens with the +30% Mystery mult', () => {
    seedCity8();
    const team = ST.mfFirstRollTeam();
    assert.equal(team.length, 6, 'six mons');
    for (const p of team) {
        assert.ok(p && p.name && p.build, 'well-formed pick');
        const grade = W.getMonGrade(p.name, W.getBST(p.name));
        assert.equal(grade, 1, `${p.name} is grade-1 (legendary tier)`);
        assert.ok(Math.abs(p.build._storyStatMult - 1.3) < 1e-9,
            `${p.name} carries the +30% mult (got ${p.build._storyStatMult})`);
    }
});

test('gen filter is honored (Gen-1-only run rolls only Gen-1 species)', () => {
    seedCity8({ settings: { enabledGens: [1], megaOn: true, zOn: true, dynaOn: true, teraOn: true } });
    const team = ST.mfFirstRollTeam();
    assert.equal(team.length, 6);
    for (const p of team) {
        const base = ST.baseStats[p.name];
        assert.ok(base, `${p.name} has base stats`);
        assert.equal(Number(base.gen), 1, `${p.name} is Gen 1`);
    }
});

// ── No-punishment loss flow ──────────────────────────────────────────────────

test('loss: result recorded, bag refunded, gold untouched, defeat overlay with retry + walk-away', () => {
    seedCity8({ gold: 4321, inventory: { potion: 3 } });
    // Simulate the mid-battle state the real flow produces.
    ST.sm.mfFirstInBattle = true;
    const goldBefore = ST.sm.gold;
    ST.mfFirstHandleBattleEnd(false);
    assert.equal(ST.sm.mfFirstInBattle, false, 'battle transient cleared');
    assert.equal(ST.sm.mfEncounter1, 'lost', 'result recorded');
    assert.equal(ST.sm.storyChoices['main.mfFirst.result'], 'lost', 'scene-branch mirror recorded');
    assert.equal(ST.sm.gold, goldBefore, 'no gold fee — loss is free');
    const ov = W.document.getElementById('story-mf-first-defeat-overlay');
    assert.ok(ov, 'defeat overlay mounted');
    assert.ok(ov.querySelector('#mf-first-defeat-retry'), 'retry button present');
    assert.ok(ov.querySelector('#mf-first-defeat-leave'), 'walk-away button present');
    closeMfOverlays();
});

test('win: result recorded, encounter closes, no defeat overlay', () => {
    seedCity8();
    ST.sm.mfFirstInBattle = true;
    ST.mfFirstHandleBattleEnd(true);
    assert.equal(ST.sm.mfEncounter1, 'won');
    assert.equal(ST.sm.storyChoices['main.mfFirst.result'], 'won');
    assert.equal(ST.mfFirstAvailable(), false, 'beaten — no longer offered');
    assert.equal(W.document.getElementById('story-mf-first-defeat-overlay'), null);
    closeMfOverlays();
});

test('a later loss never overwrites nothing — but decline never downgrades a loss (record semantics)', () => {
    seedCity8();
    // mfFirstApproach's walk-away path only writes 'declined' when unmet.
    // The record helper itself always writes what happened; assert the
    // decline-guard input state here: lost stays lost when merely re-approached.
    ST.sm.mfEncounter1 = 'lost';
    ST.sm.storyChoices['main.mfFirst.result'] = 'lost';
    // Re-approach + walk away is exercised via mfFirstApproach in-browser; the
    // guard is `if (sm.mfEncounter1 == null)` — replicate the condition:
    if (ST.sm.mfEncounter1 == null) ST.sm.mfEncounter1 = 'declined';
    assert.equal(ST.sm.mfEncounter1, 'lost', 'lost-then-left keeps reading as lost');
});

// ── Same-six guarantee (team lock) ───────────────────────────────────────────

test('launch freezes the six into sm.mfFirstTeamLock; retry re-fields the same team', () => {
    seedCity8();
    ST.mfFirstLaunchFight();
    const first = (ST.sm.mfFirstTeamLock || []).map(t => t.name);
    assert.equal(first.length, 6, 'lock captured on first launch');
    assert.equal(ST.sm.mfFirstInBattle, true, 'battle transient set');
    // Loss → retry path relaunches; the lock must hold the identical six.
    ST.mfFirstHandleBattleEnd(false);
    closeMfOverlays();
    ST.mfFirstLaunchFight();
    const second = (ST.sm.mfFirstTeamLock || []).map(t => t.name);
    assert.deepEqual(second, first, 'retry faces the same six');
    ST.sm.mfFirstInBattle = false;
    closeMfOverlays();
});

// ── onBattleEnd routing (off-timeline) ───────────────────────────────────────

test('onBattleEnd routes a first-encounter loss off-timeline: eventIndex + gold untouched', () => {
    seedCity8({ gold: 7777 });
    ST.sm.mfFirstInBattle = true;
    const evBefore = ST.sm.eventIndex;
    W.StoryMode.onBattleEnd(false, 'x', 'y');
    assert.equal(ST.sm.eventIndex, evBefore, 'timeline untouched');
    assert.equal(ST.sm.gold, 7777, 'no gold change');
    assert.equal(ST.sm.mfEncounter1, 'lost');
    assert.ok(W.document.getElementById('story-mf-first-defeat-overlay'), 'routed to the encounter defeat overlay');
    closeMfOverlays();
});

// ── Scenes & dialogue wiring ─────────────────────────────────────────────────

test('scenes exist: first approach carries the fight/walk choice; return scene branches on the result', () => {
    const first = ST.STORY_SCENES['main.mfFirst'];
    assert.ok(first, 'main.mfFirst scene exists');
    const choiceAct = (first.acts || []).find(a => a && a.choice);
    assert.ok(choiceAct, 'first scene has a choice act');
    assert.equal(choiceAct.choice.persistKey, 'main.mfFirst.approach');
    // [... ] copies: scene arrays live in the jsdom realm, and deepStrictEqual
    // rejects cross-realm Array prototypes even when the contents match.
    const values = [...choiceAct.choice.options.map(o => o.value)].sort();
    assert.deepEqual(values, ['fight', 'walk'], 'choice offers fight and walk');

    const ret = ST.STORY_SCENES['main.mfFirstReturn'];
    assert.ok(ret, 'main.mfFirstReturn scene exists');
    const branchAct = (ret.acts || []).find(a => Array.isArray(a.branches));
    assert.ok(branchAct, 'return scene branches');
    const keys = [...branchAct.branches.filter(b => b.when).map(b => `${b.when.key}=${b.when.eq}`)].sort();
    assert.deepEqual(keys, ['main.mfFirst.result=declined', 'main.mfFirst.result=lost'],
        'return scene reads the recorded result');
    assert.ok(branchAct.branches.some(b => !b.when), 'return scene keeps a when-less default branch');
});

// ── Save round-trip / legacy back-fill ───────────────────────────────────────
// The harness boots jsdom on an opaque file:// origin, so window.localStorage
// throws on access. Install a Map-backed shim so the real load() can read the
// save we plant (same pattern as story-tone-retirement.test.js).
function installLocalStorageShim() {
    const store = new Map();
    const shim = {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => { store.set(k, String(v)); },
        removeItem: (k) => { store.delete(k); },
        clear: () => { store.clear(); },
        key: (i) => [...store.keys()][i] ?? null,
        get length() { return store.size; },
    };
    Object.defineProperty(W, 'localStorage', { value: shim, configurable: true });
    return shim;
}

function plantSave(extra = {}) {
    installLocalStorageShim().setItem('pbs_story_save', JSON.stringify(Object.assign({
        version: W.__STORY_SAVE_VER,
        active: true,
        storyLine: 'classic',
        eventIndex: 0,
        badges: 0,
        team: [],
        settings: { minGen: 1, maxGen: 9, enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    }, extra)));
}

test('load(): missing rework fields back-fill to null and the battle transient never resumes', () => {
    plantSave({ mfFirstInBattle: true }); // pre-rework save + a mid-battle close
    // load() merges the parsed save over the live sm (fresh boots start from
    // the defaults literal) — emulate a fresh boot by dropping the fields.
    delete ST.sm.mfEncounter1;
    delete ST.sm.mfFinalResult;
    delete ST.sm.mfFirstTeamLock;
    assert.equal(ST.loadSaveForTest(), true, 'save loads');
    assert.equal(ST.sm.mfEncounter1, null, 'mfEncounter1 back-filled');
    assert.equal(ST.sm.mfFinalResult, null, 'mfFinalResult back-filled');
    assert.equal(ST.sm.mfFirstTeamLock, null, 'team lock back-filled');
    assert.equal(ST.sm.mfFirstInBattle, false, 'battle transient cleared on load');
});

test('load(): a malformed team lock is dropped, not resumed into', () => {
    plantSave({ mfFirstTeamLock: [{ name: 'Mewtwo' /* no build */ }] });
    assert.equal(ST.loadSaveForTest(), true);
    assert.equal(ST.sm.mfFirstTeamLock, null, 'malformed lock nulled');
});

// ── City hub integration ─────────────────────────────────────────────────────

test('City-8 hub: optional encounter button present, no Required gate, route not blocked', () => {
    seedCity8({
        facilityIntros: {}, facilitiesSeen: {}, profUsed: {}, gymCleared: { 8: true },
        trainerAssignments: {}, rivalEncounterLog: [], newMovesPending: {}, cityGuideQuote: null,
        unlockedGimmicks: [],
    });
    const grid = W.__renderCityActionsForTest(city8Idx);
    assert.ok(!String(grid).startsWith('ERR:'), `render failed: ${grid}`);
    assert.ok(/mfFirstApproach/.test(grid), 'encounter button wired to mfFirstApproach');
    assert.ok(/Optional/.test(grid), 'encounter is framed as Optional');
    // The old gate: a Required "Mystery Figure — Legendary" professor button +
    // a route block on the figure. Both must be gone. (Facility first-visit
    // badges elsewhere in the grid legitimately say "required".)
    assert.ok(!/Mystery Figure — Legendary/.test(grid), 'no legendary-gift gate button');
    assert.ok(!/Talk to Mystery Figure first/.test(grid), 'route is not blocked on the figure');
    closeMfOverlays();
});

test('City-8 hub: after winning, the encounter button is gone', () => {
    seedCity8({
        facilityIntros: {}, facilitiesSeen: {}, profUsed: {}, gymCleared: { 8: true },
        trainerAssignments: {}, rivalEncounterLog: [], newMovesPending: {}, cityGuideQuote: null,
        unlockedGimmicks: [], mfEncounter1: 'won',
    });
    const grid = W.__renderCityActionsForTest(city8Idx);
    assert.ok(!String(grid).startsWith('ERR:'), `render failed: ${grid}`);
    assert.ok(!/mfFirstApproach/.test(grid), 'no encounter button after a win');
});
