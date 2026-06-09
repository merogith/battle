// Camp micro-games — 30-game roster (6 actions × 5) + the 17-primitive toolkit +
// the difficulty system (ranged [easy,hard] params lerp on bond progress). The
// roster + the pure win/lose deciders + the difficulty resolver are the
// deterministic parts and are locked here; the interactive FEEL (windows, speeds)
// is [MAINTAINER]-tunable data and wants a playtest pass.
//
// Run: node --test tests/suites/camp-microgames-30.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

const PRIMITIVES = [
    'tapTiming', 'holdRelease', 'mash', 'pickMatch', 'dragAim', 'swipeCover', 'track',
    'restraint', 'sequence', 'dodge', 'catch', 'lobAim', 'steady', 'block', 'balance',
    'gaugeStop', 'quickMath',
];

test('roster: 6 actions × 5-game pools = 30 micro-games, all wired to a registered primitive', () => {
    const A = ST.CAMP_ACTIONS, G = ST.CAMP_MICROGAMES, P = ST.CAMP_PRIMITIVES;
    assert.equal(Object.keys(G).length, 30, '30 micro-games total');
    assert.equal(Object.keys(P).length, 17, '17 input primitives');
    for (const p of PRIMITIVES) assert.ok(P[p], `primitive '${p}' is registered`);
    const referenced = new Set();
    for (const aid in A) {
        assert.equal(A[aid].games.length, 5, `${aid} pool has 5 games`);
        for (const g of A[aid].games) {
            assert.ok(G[g], `${aid} → ${g} exists`);
            assert.ok(P[G[g].primitive], `${g} primitive '${G[g].primitive}' is registered`);
            referenced.add(g);
        }
    }
    assert.equal(referenced.size, 30, 'every micro-game is referenced by exactly one action pool');
});

test('campPickMicrogame: seeded, and over many seeds covers the whole 5-pool', () => {
    const sm = W.StoryMode.state;
    sm.active = true; sm.runSeed = 12345; sm._strngState = null;
    const seen = new Set();
    for (let i = 0; i < 80; i++) seen.add(ST.campPickMicrogame('cheer'));
    for (const g of seen) assert.ok(ST.CAMP_ACTIONS.cheer.games.includes(g), `${g} is in the cheer pool`);
    assert.ok(seen.size >= 3, 'seeded picks vary across the pool (not stuck on one game)');
});

test('pure deciders (original 9)', () => {
    assert.equal(ST.campScoreTapTiming(0.5, 0.5, 0.1), true);
    assert.equal(ST.campScoreTapTiming(0.7, 0.5, 0.1), false);
    assert.equal(ST.campScoreHoldRelease(0.7, 0.6, 0.9), true);
    assert.equal(ST.campScoreHoldRelease(0.95, 0.6, 0.9), false, 'overdid it');
    assert.equal(ST.campScoreMash(18, 18), true);
    assert.equal(ST.campScoreMash(17, 18), false);
    assert.equal(ST.campScorePickMatch('💪', '💪'), true);
    assert.equal(ST.campScorePickMatch('✌️', '💪'), false);
    assert.equal(ST.campScoreDragAim(3, 4, 0, 0, 5), true, 'on the radius (dist 5)');
    assert.equal(ST.campScoreDragAim(20, 0, 0, 0, 10), false, 'outside');
    assert.equal(ST.campScoreSwipeCover(5, 5), true);
    assert.equal(ST.campScoreSwipeCover(4, 5), false);
    assert.equal(ST.campScoreTrack(1600, 1560), true);
    assert.equal(ST.campScoreTrack(900, 1560), false);
    assert.equal(ST.campScoreRestraint(false), true, 'waited it out → win');
    assert.equal(ST.campScoreRestraint(true), false, 'tapped → fail');
    assert.equal(ST.campScoreSequence([1, 2, 3], [1, 2, 3]), true);
    assert.equal(ST.campScoreSequence([1, 3, 2], [1, 2, 3]), false);
    assert.equal(ST.campScoreSequence([1, 2], [1, 2, 3]), false, 'length mismatch → fail');
});

test('pure deciders (new 8: dodge/catch/lobAim/steady/block/balance/gaugeStop/quickMath)', () => {
    assert.equal(ST.campScoreDodge('L', 'L', 300, 420), true, 'right dir in time');
    assert.equal(ST.campScoreDodge('L', 'L', 500, 420), false, 'too slow');
    assert.equal(ST.campScoreDodge('L', 'R', 300, 420), false, 'wrong dir');

    assert.equal(ST.campScoreCatch(3, 3), true);
    assert.equal(ST.campScoreCatch(2, 3), false);

    assert.equal(ST.campScoreLob(124, 100, 24), true, 'on the tolerance');
    assert.equal(ST.campScoreLob(125, 100, 24), false, 'one past');

    assert.equal(ST.campScoreSteady(15, 16), true);
    assert.equal(ST.campScoreSteady(16, 16), true, 'on the limit');
    assert.equal(ST.campScoreSteady(17, 16), false);

    assert.equal(ST.campScoreBlock(3, 3), true);
    assert.equal(ST.campScoreBlock(2, 3), false);

    assert.equal(ST.campScoreBalance(0.30, 0.30), true, 'on the cap');
    assert.equal(ST.campScoreBalance(0.31, 0.30), false, 'toppled');

    assert.equal(ST.campScoreGaugeStop(0.5, 0.5, 0.06), true);
    assert.equal(ST.campScoreGaugeStop(0.6, 0.5, 0.06), false);

    assert.equal(ST.campScoreQuickMath(7, 7), true);
    assert.equal(ST.campScoreQuickMath(6, 7), false);
});

test('_campEffectiveGame resolves [easy,hard] ranges; scalars/strings/non-pair arrays pass through', () => {
    const eg = ST.campEffectiveGame;
    assert.equal(eg({ green: [0.5, 0.66] }, 0).green, 0.5, 'diff 0 → easy bound');
    assert.equal(eg({ green: [0.5, 0.66] }, 1).green, 0.66, 'diff 1 → hard bound');
    assert.ok(Math.abs(eg({ green: [0.5, 0.66] }, 0.5).green - 0.58) < 1e-9, 'midpoint lerps');
    assert.equal(eg({ rounds: 3 }, 0.7).rounds, 3, 'scalar passes through');
    assert.equal(eg({ name: 'Hold!' }, 0.4).name, 'Hold!', 'string passes through');
    assert.deepEqual(eg({ choices: ['a', 'b', 'c'] }, 0.5).choices, ['a', 'b', 'c'], '3-element array is not a range');
    // a literal 2-NUMBER array IS treated as a range (the documented convention) — that's expected.
    const orig = { green: [0.5, 0.66] };
    eg(orig, 1);
    assert.ok(Array.isArray(orig.green), 'source config is never mutated');
});

test('difficulty curve: bond-progress only, floored, monotonic', () => {
    const mk = (n) => ({ build: { n: 'Hardy' }, bonds: { discipline: n } });
    const thr = ST.bondThreshold ? ST.bondThreshold('discipline', mk(0)) : 5;
    const d0 = ST.campDifficultyFor(mk(0), 'discipline');
    const dMid = ST.campDifficultyFor(mk(Math.floor(thr / 2)), 'discipline');
    const dFull = ST.campDifficultyFor(mk(thr), 'discipline');
    assert.ok(Math.abs(d0 - 0.20) < 1e-9, 'fresh mon sits at the floor (0.20)');
    assert.ok(Math.abs(dFull - 1.0) < 1e-9, 'a mastered path is at max difficulty');
    assert.ok(d0 <= dMid && dMid <= dFull, 'monotonic with bond progress');
    // post-mastery (counter past threshold) clamps at 1.0
    assert.ok(Math.abs(ST.campDifficultyFor(mk(thr + 10), 'discipline') - 1.0) < 1e-9, 'clamps at 1.0');
});

test('end-to-end: a ranged game resolves to its easy bound at diff 0 and hard bound at diff 1', () => {
    const hold = ST.CAMP_MICROGAMES.hold;
    assert.ok(Array.isArray(hold.green), 'hold.green is a [easy,hard] range');
    assert.equal(ST.campEffectiveGame(hold, 0).green, hold.green[0], 'diff 0 → easy band edge');
    assert.equal(ST.campEffectiveGame(hold, 1).green, hold.green[1], 'diff 1 → hard band edge');
    assert.ok(hold.green[1] > hold.green[0], 'green band floor rises (tighter) as difficulty climbs');
});

test('run-routing: unknown primitive → freebie win; known primitives mount an interactive overlay', () => {
    let res = null;
    ST.campRunMicrogame({ primitive: 'totally-unknown', name: 'X' }, (won) => { res = won; });
    assert.equal(res, true, 'unknown primitive → freebie win, never a soft-lock');

    // pickMatch (backward-compatible explicit-choices form) mounts, awaits input.
    let pmRes = 'pending';
    ST.campRunMicrogame({ primitive: 'pickMatch', name: 'Pose!', choices: ['💪', '✌️'] }, (won) => { pmRes = won; });
    assert.equal(pmRes, 'pending', 'pickMatch awaits a tap');
    let ov = W.document.getElementById('camp-microgame');
    assert.ok(ov && ov.querySelector('[data-camp-pm]'), 'pickMatch overlay rendered with choices');
    if (ov) ov.remove();

    // spot-check three new primitives mount with their expected widgets (no sync resolve).
    const cases = [
        { game: { primitive: 'quickMath', name: 'Snap!', optionCount: 4, ms: 5000, maxOperand: 9 }, sel: '[data-camp-qm]' },
        { game: { primitive: 'block', name: 'Brace!', hits: 3, telegraphMs: 800 }, sel: '[data-camp-bk]' },
        { game: { primitive: 'dodge', name: 'Quick Dodge!', windowMs: 700, feints: 1 }, sel: '[data-camp-dg]' },
    ];
    for (const c of cases) {
        let r = 'pending';
        ST.campRunMicrogame(c.game, (won) => { r = won; });
        assert.equal(r, 'pending', `${c.game.primitive} awaits input (no sync freebie)`);
        ov = W.document.getElementById('camp-microgame');
        assert.ok(ov && ov.querySelector(c.sel), `${c.game.primitive} overlay rendered (${c.sel})`);
        if (ov) ov.remove();
    }
});
