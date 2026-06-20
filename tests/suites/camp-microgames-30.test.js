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
    // toolkit expansion (17 → 22)
    'tracePath', 'stack', 'breathBand', 'goNoGo', 'whack',
];

test('roster: 6 actions × 5-game pools = 30 micro-games, all wired to a registered primitive', () => {
    const A = ST.CAMP_ACTIONS, G = ST.CAMP_MICROGAMES, P = ST.CAMP_PRIMITIVES;
    assert.equal(Object.keys(G).length, 30, '30 micro-games total');
    assert.equal(Object.keys(P).length, 22, '22 input primitives');
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

test('pool variety: each pool is 5 DISTINCT mechanics, and no mechanic is over-used', () => {
    const A = ST.CAMP_ACTIONS, G = ST.CAMP_MICROGAMES;
    const globalUse = {};
    for (const aid in A) {
        const prims = A[aid].games.map(g => G[g].primitive);
        assert.equal(new Set(prims).size, 5, `${aid} pool: 5 DISTINCT mechanics (no repeat within a pool)`);
        for (const p of prims) globalUse[p] = (globalUse[p] || 0) + 1;
    }
    for (const p in globalUse) assert.ok(globalUse[p] <= 2, `mechanic '${p}' used ${globalUse[p]}× (cap 2 — no over-representation)`);
});

test('shared tuning: a mechanic reused across pools has the SAME difficulty curve (skins only)', () => {
    const G = ST.CAMP_MICROGAMES;
    // combo & copy are both `sequence`; dontblink & holdclose are both `holdRelease`;
    // loom & gaze are both `track`; flinch & react are both `goNoGo`. Same numbers, different names.
    const sameCurve = (a, b, keys) => keys.every(k => JSON.stringify(G[a][k]) === JSON.stringify(G[b][k]));
    assert.ok(sameCurve('combo', 'copy', ['len', 'flashMs', 'gapMs']), 'sequence skins share one curve');
    assert.ok(sameCurve('dontblink', 'holdclose', ['green', 'overdoAt', 'durationMs']), 'holdRelease skins share one curve');
    assert.ok(sameCurve('loom', 'gaze', ['needFrac', 'ms', 'tol']), 'track skins share one curve');
    assert.ok(sameCurve('flinch', 'react', ['rounds', 'windowMs', 'goRatio']), 'goNoGo skins share one curve');
    assert.notEqual(G.combo.name, G.copy.name, 'but the skins are named differently');
});

test('pure deciders (toolkit expansion: tracePath/stack/breathBand/goNoGo/whack)', () => {
    assert.equal(ST.campScoreTrace(5, 5), true, 'hit every checkpoint');
    assert.equal(ST.campScoreTrace(4, 5), false, 'one short');
    assert.equal(ST.campScoreStack(4, 4), true);
    assert.equal(ST.campScoreStack(3, 4), false, 'toppled before the last layer');
    assert.equal(ST.campScoreBreath(1600, 1560), true);
    assert.equal(ST.campScoreBreath(900, 1560), false);
    assert.equal(ST.campScoreGoNoGo(4, 4), true, 'every round answered correctly');
    assert.equal(ST.campScoreGoNoGo(3, 4), false, 'flinched / missed one');
    assert.equal(ST.campScoreWhack(5, 5), true);
    assert.equal(ST.campScoreWhack(4, 5), false);
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
    const hold = ST.CAMP_MICROGAMES.dontblink;
    assert.ok(Array.isArray(hold.green), 'dontblink.green is a [easy,hard] range');
    assert.equal(ST.campEffectiveGame(hold, 0).green, hold.green[0], 'diff 0 → easy band edge');
    assert.equal(ST.campEffectiveGame(hold, 1).green, hold.green[1], 'diff 1 → hard band edge');
    assert.ok(hold.green[1] > hold.green[0], 'green band floor rises (tighter) as difficulty climbs');
});

// ── Fix E — sequence (Combo!/Copy!): no back-to-back repeats ──────────────────
// Two flashes of the same pad with a short gap read as ONE long flash → the player
// taps once and loses unfairly. _campSeqGen must never emit a consecutive duplicate.
test('sequence gen: correct length, in range, and NEVER two of the same pad in a row', () => {
    const gen = ST.campSeqGen;
    // deterministic LCG so the invariant is checked over a fixed, reproducible spread
    let s = 0x2545f491;
    const rng = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let trial = 0; trial < 400; trial++) {
        const len = 2 + (trial % 6);   // lengths 2..7 (covers combo 3-5 + copy 4-7)
        const seq = gen(len, 4, rng);
        assert.equal(seq.length, len, 'length honoured');
        for (let i = 0; i < seq.length; i++) {
            assert.ok(seq[i] >= 0 && seq[i] < 4 && Number.isInteger(seq[i]), 'pad index in [0,4)');
            if (i > 0) assert.notEqual(seq[i], seq[i - 1], `no back-to-back repeat at ${i} (trial ${trial})`);
        }
    }
});

// ── Fix I — steady (Groom!/Plant!): drift amplitude is driven by the knob ──────
// Regression: the X drift was hard-coded to 0.30·width (~108px) and ignored `driftAmp`,
// so even the easy setting was an un-holdable chase. Amplitude must now track the knob.
test('steady amp: tied 1:1 to driftAmp; easy setting is hold-still-viable, hard has teeth', () => {
    const amp = ST.campSteadyAmp;
    assert.equal(amp(8), 8, 'amp == driftAmp');
    assert.equal(amp(26), 26, 'amp == driftAmp');
    assert.ok(amp(8) < amp(26), 'monotonic with the knob');
    assert.equal(amp(-3), 0, 'clamped non-negative');
    assert.equal(amp('nope'), 16, 'non-number → sane default');
    const G = ST.CAMP_MICROGAMES;
    const R2 = Math.SQRT2;   // worst-case dev when the player holds dead-centre and the dot drifts
    for (const id of ['groom', 'plant']) {
        const g = G[id];
        const easy = ST.campEffectiveGame(g, 0), hard = ST.campEffectiveGame(g, 1);
        assert.ok(amp(easy.driftAmp) * R2 <= easy.limitPx, `${id}: easy is holdable without tracking`);
        assert.ok(amp(hard.driftAmp) * R2 > hard.limitPx, `${id}: hard forces active tracking`);
    }
});

// ── Fix J — track (Loom!/Sync!/Gaze!): winnable with perfect play ──────────────
// Two regressions fixed: (1) the deadline now starts on first CONTACT (was: at mount,
// so acquisition lag alone could doom a perfect run), making any needFrac<1 feasible;
// (2) the mark was slowed so a human can stay glued within `tol`.
test('track mark: slowed path stays within a human-trackable speed', () => {
    const pos = ST.campTrackPos;
    const W = 360, H = 240;   // jsdom field size (min(360,84vw) × 240)
    let maxSpeed = 0;   // px/sec
    let prev = pos(0);
    for (let el = 1; el <= 6000; el++) {
        const p = pos(el);
        const dx = (p.fx - prev.fx) * W, dy = (p.fy - prev.fy) * H;
        maxSpeed = Math.max(maxSpeed, Math.hypot(dx, dy) * 1000);   // per-ms → per-sec
        prev = p;
    }
    assert.ok(maxSpeed < 240, `mark peak speed ${maxSpeed.toFixed(0)}px/s is trackable (was ~290)`);
});
test('track data: every track game tops out at a winnable required-fraction & radius', () => {
    const G = ST.CAMP_MICROGAMES;
    for (const id of ['loom', 'gaze']) {
        const hard = ST.campEffectiveGame(G[id], 1);
        // contact-gated clock ⇒ a flawless tracker accrues on-time == budget, so needFrac<1 is
        // always clearable; we still lock a sane ceiling so an impossible value can't creep back.
        assert.ok(hard.needFrac < 0.80, `${id}: hard needFrac ${hard.needFrac} leaves slip room`);
        assert.ok(hard.tol >= 22, `${id}: hard catch radius ${hard.tol}px stays human`);
    }
});

test('run-routing: unknown primitive → freebie win; known primitives mount an interactive overlay', () => {
    W.__campSkipCountdown = true;   // start games instantly so the overlay mounts synchronously (production shows a 3·2·1·GO! countdown first)
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

    // spot-check the interactive primitives mount with their expected widgets (no sync resolve).
    const cases = [
        { game: { primitive: 'quickMath', name: 'Snap!', optionCount: 4, ms: 5000, maxOperand: 9 }, sel: '[data-camp-qm]' },
        { game: { primitive: 'block', name: 'Brace!', hits: 3, telegraphMs: 800 }, sel: '[data-camp-bk]' },
        { game: { primitive: 'dodge', name: 'Quick Dodge!', windowMs: 700, feints: 1 }, sel: '[data-camp-dg]' },
        // toolkit expansion (17 → 22)
        { game: { primitive: 'tracePath', name: 'Soothe!', dots: 5, tol: 34, ms: 4200 }, sel: '#camp-tp-field' },
        { game: { primitive: 'stack', name: 'Stack!', need: 4, tol: 26, slideMs: 1200 }, sel: '#camp-sk-drop' },
        { game: { primitive: 'breathBand', name: 'Hold Nerve!', ms: 3200, needFrac: 0.6, bandHalf: 0.16 }, sel: '#camp-bb-field' },
        { game: { primitive: 'goNoGo', name: 'Flinch?', rounds: 4, windowMs: 800, goRatio: 0.5 }, sel: '#camp-gn-tap' },
        { game: { primitive: 'whack', name: 'Tag!', need: 5, lifeMs: 900, badRatio: 0.2 }, sel: '#camp-wk-field' },
    ];
    for (const c of cases) {
        let r = 'pending';
        ST.campRunMicrogame(c.game, (won) => { r = won; });
        assert.equal(r, 'pending', `${c.game.primitive} awaits input (no sync freebie)`);
        ov = W.document.getElementById('camp-microgame');
        assert.ok(ov && ov.querySelector(c.sel), `${c.game.primitive} overlay rendered (${c.sel})`);
        if (ov) ov.remove();
    }

    // Stack! drop produces a visible placed-slab in the field (both hit and miss
    // branches spawn one; a resolving drop defers settle() so it is present now).
    {
        ST.campRunMicrogame({ primitive: 'stack', name: 'Stack!', need: 4, tol: 26, slideMs: 1200 }, () => {});
        ov = W.document.getElementById('camp-microgame');
        const drop = ov && ov.querySelector('#camp-sk-drop');
        assert.ok(drop, 'stack DROP button present');
        drop.click();
        const field = ov.querySelector('#camp-sk-field');
        assert.ok(field && field.querySelector('.camp-sk-placed'), 'stack drop spawns a placed slab');
        if (ov && ov.parentNode) ov.remove();
    }
});

test('get-ready countdown gates every microgame start (unknown primitives skip it)', () => {
    delete W.__campSkipCountdown;   // exercise the real countdown path
    let resolved = 'pending';
    ST.campRunMicrogame({ primitive: 'stack', name: 'Stack!', need: 4, tol: 26, slideMs: 1200 }, (won) => { resolved = won; });
    const cd = W.document.getElementById('camp-countdown');
    assert.ok(cd, 'countdown overlay mounts before the game');
    assert.ok(cd.textContent.includes('Stack!'), 'countdown names the upcoming game');
    assert.equal(W.document.getElementById('camp-microgame'), null, 'game overlay is gated behind the countdown');
    assert.equal(resolved, 'pending', 'game cannot resolve during the countdown');

    let freebie = null;   // unknown primitive: instant freebie, no countdown, never a soft-lock
    ST.campRunMicrogame({ primitive: 'totally-unknown', name: 'X' }, (won) => { freebie = won; });
    assert.equal(freebie, true, 'unknown primitive resolves instantly with no countdown');

    if (cd && cd.parentNode) cd.remove();
    W.__campSkipCountdown = true;   // restore instant mode
});
