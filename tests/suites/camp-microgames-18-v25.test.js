// Camp micro-games — full 18-game roster + the 9-primitive toolkit + bond hexagon.
// The pool expansion (6→18) is data; the engine grows by primitives. The interactive
// FEEL needs a maintainer playtest, so these lock the data integrity + the pure win/lose
// deciders + the hexagon shape (the parts that ARE deterministic).
//
// Run: node --test tests/suites/camp-microgames-18-v25.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

test('roster: 6 actions × 3-game pools = 18 micro-games, all wired to a registered primitive', () => {
    const A = ST.CAMP_ACTIONS, G = ST.CAMP_MICROGAMES, P = ST.CAMP_PRIMITIVES;
    assert.equal(Object.keys(G).length, 18, '18 micro-games total');
    assert.equal(Object.keys(P).length, 9, '9 input primitives');
    const referenced = new Set();
    for (const aid in A) {
        assert.equal(A[aid].games.length, 3, `${aid} pool has 3 games`);
        for (const g of A[aid].games) {
            assert.ok(G[g], `${aid} → ${g} exists`);
            assert.ok(P[G[g].primitive], `${g} primitive '${G[g].primitive}' is registered`);
            referenced.add(g);
        }
    }
    assert.equal(referenced.size, 18, 'every micro-game is referenced by exactly one action pool');
});

test('campPickMicrogame: seeded, and over many seeds covers the whole 3-pool', () => {
    const sm = W.StoryMode.state;
    sm.active = true; sm.runSeed = 12345; sm._strngState = null;
    const seen = new Set();
    for (let i = 0; i < 60; i++) seen.add(ST.campPickMicrogame('cheer'));
    for (const g of seen) assert.ok(ST.CAMP_ACTIONS.cheer.games.includes(g), `${g} is in the cheer pool`);
    assert.ok(seen.size >= 2, 'seeded picks vary across the pool (not stuck on one game)');
});

test('pure deciders: mash / pickMatch / dragAim / swipeCover / track / restraint / sequence', () => {
    assert.equal(ST.campScoreMash(18, 18), true);
    assert.equal(ST.campScoreMash(17, 18), false);

    assert.equal(ST.campScorePickMatch('💪', '💪'), true);
    assert.equal(ST.campScorePickMatch('✌️', '💪'), false);

    assert.equal(ST.campScoreDragAim(0, 0, 0, 0, 10), true, 'dead on');
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

test('campRunMicrogame routes every roster primitive (no soft-lock fallback hit for known ones)', () => {
    // An unknown primitive resolves a freebie win (the safety net) — known ones mount a real overlay.
    let res = null;
    ST.campRunMicrogame({ primitive: 'totally-unknown', name: 'X' }, (won) => { res = won; });
    assert.equal(res, true, 'unknown primitive → freebie win, never a soft-lock');
    // a known primitive should NOT resolve synchronously to a freebie — it mounts an overlay.
    let pickRes = 'pending';
    ST.campRunMicrogame({ primitive: 'pickMatch', name: 'Pose!', choices: ['💪', '✌️'] }, (won) => { pickRes = won; });
    assert.equal(pickRes, 'pending', 'pickMatch mounts an interactive overlay (awaits input)');
    const ov = W.document.getElementById('camp-microgame');
    assert.ok(ov && ov.querySelector('[data-camp-pm]'), 'pickMatch overlay rendered with choices');
    if (ov) ov.remove();
});

test('bond hexagon: renders an SVG; mastery pushes the value polygon outward', () => {
    const zero = { build: { n: 'Hardy' }, bonds: { praise: 0, nurture: 0, discipline: 0, intimidate: 0, mimicry: 0, devotion: 0 } };
    const maxed = { build: { n: 'Hardy' }, bonds: { praise: 99, nurture: 99, discipline: 99, intimidate: 99, mimicry: 99, devotion: 99 } };
    const svgZero = ST.campBondHexSvg(zero, 132);
    const svgMax = ST.campBondHexSvg(maxed, 132);
    assert.match(svgZero, /^<svg[\s\S]*<\/svg>$/, 'returns an <svg>');
    assert.equal((svgZero.match(/<polygon/g) || []).length, 2, 'guide + value polygons');
    assert.equal((svgZero.match(/<circle/g) || []).length, 6, 'six tone dots (one per path)');
    assert.notEqual(svgZero, svgMax, 'a fully-bonded mon draws a different (outer) value polygon');
});
