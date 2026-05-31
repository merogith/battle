// Wander Around — route-exit optional wild search. Validates the user-confirmed
// probability model (50% base; the rate halves ONLY on a generated encounter; a
// miss holds it; cap of 3 searches) plus the suppression gate and the exposed
// constants. Pure-model assertions via __storyTest.wanderSimulate, which shares
// the live WANDER_* constants and rate formula with the shipped screen — so this
// exercises the real logic, not a re-implementation. No live run / DOM needed.
//
// Run: node --test tests/suites/story-wander-around.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;

// __storyTest returns jsdom-realm Arrays; spread into the Node realm before a
// deepStrictEqual against Node array literals (cross-realm prototype mismatch).
const rates = r => [...r].map(x => x.rate);
const hits  = r => [...r].map(x => x.hit);

test('constants are the user-confirmed values', () => {
    assert.equal(ST.WANDER_MAX_TAPS, 3);
    assert.equal(ST.WANDER_BASE_RATE, 0.5);
    assert.equal(ST.WANDER_RATE_DECAY, 0.5);
});

test('rate = base × decay^(encounters generated)', () => {
    assert.equal(ST.wanderRate({ hits: 0 }), 0.5);
    assert.equal(ST.wanderRate({ hits: 1 }), 0.25);
    assert.equal(ST.wanderRate({ hits: 2 }), 0.125);
    // defensive: a missing/!object state reads as the base rate
    assert.equal(ST.wanderRate({}), 0.5);
    assert.equal(ST.wanderRate(null), 0.5);
});

test("scenario A — an encounter each time steps 50 → 25 → 12.5 (user's canonical)", () => {
    // uniforms strictly below the current rate ⇒ a hit on every tap
    const r = ST.wanderSimulate([0.0, 0.0, 0.0]);
    assert.deepEqual(rates(r), [0.5, 0.25, 0.125]);
    assert.deepEqual(hits(r), [true, true, true]);
});

test("scenario B — miss then hit holds the rate then halves: 50 → 50 → 25 (user's canonical)", () => {
    // tap1 u=0.9 ≥ 0.50 → miss (rate holds at 0.50)
    // tap2 u=0.1 < 0.50 → hit  (rate now 0.25)
    // tap3 u=0.3 ≥ 0.25 → miss
    const r = ST.wanderSimulate([0.9, 0.1, 0.3]);
    assert.deepEqual(rates(r), [0.5, 0.5, 0.25]);
    assert.deepEqual(hits(r), [false, true, false]);
});

test('all misses hold the rate at 50% across all three searches', () => {
    const r = ST.wanderSimulate([0.99, 0.99, 0.99]);
    assert.deepEqual(rates(r), [0.5, 0.5, 0.5]);
    assert.deepEqual(hits(r), [false, false, false]);
});

test('a miss never lowers the rate even after an earlier hit', () => {
    // hit, miss, hit → 0.50(hit) 0.25(miss, holds) 0.25(hit)
    const r = ST.wanderSimulate([0.0, 0.9, 0.0]);
    assert.deepEqual(rates(r), [0.5, 0.25, 0.25]);
    assert.deepEqual(hits(r), [true, false, true]);
});

test('cap — never more than WANDER_MAX_TAPS searches even if more are offered', () => {
    const r = ST.wanderSimulate([0, 0, 0, 0, 0]); // 5 offered, only 3 consumed
    assert.equal(r.length, 3);
});

test('suppression — wander is offered for cities 1..8 only (not Pallet 0 / League 9)', () => {
    for (let c = 1; c <= 8; c++) assert.equal(ST.shouldOfferWander(c), true, 'city ' + c + ' should offer wander');
    assert.equal(ST.shouldOfferWander(0), false); // Pallet — run start, no route
    assert.equal(ST.shouldOfferWander(9), false); // League — roaming/league territory
    assert.equal(ST.shouldOfferWander(-1), false);
    assert.equal(ST.shouldOfferWander(10), false);
});

// ── DOM smoke tests — the actual screen wiring the pure model can't cover ──
const doc = eng.window.document;

test('DOM — the prompt renders Search + Move On; Move On marks done, fires onDone, removes overlay', () => {
    ST.sm.wanderByEventIdx = {};
    let onDoneCalls = 0;
    ST.showWanderScreen(9991, 3, () => { onDoneCalls++; });
    assert.ok(doc.querySelector('button[data-wander-search="1"]'), 'Search rendered while searches remain');
    const moveBtn = doc.querySelector('button[data-wander-moveon="1"]');
    assert.ok(moveBtn, 'Move On rendered');
    moveBtn.click();
    assert.equal(onDoneCalls, 1, 'onDone fired exactly once');
    assert.equal(ST.wanderState(9991).done, true, 'route marked done');
    assert.equal(doc.querySelector('button[data-wander-moveon="1"]'), null, 'overlay removed after Move On');
});

test('DOM — at the cap (3 taps spent) Search is disabled and only Move On is actionable', () => {
    ST.sm.wanderByEventIdx = { 9992: { taps: 3, hits: 1, done: false } };
    ST.showWanderScreen(9992, 4, () => {});
    // The disabled Search button intentionally carries no data-wander-search hook.
    assert.equal(doc.querySelector('button[data-wander-search="1"]'), null, 'no actionable Search at the cap');
    assert.ok(doc.querySelector('button[disabled]'), 'a disabled Search button is shown');
    const moveBtn = doc.querySelector('button[data-wander-moveon="1"]');
    assert.ok(moveBtn, 'Move On still present at the cap');
    moveBtn.click(); // cleanup
});

test('DOM — an already-done route does not re-open the prompt (goes straight to onDone)', () => {
    ST.sm.wanderByEventIdx = { 9993: { taps: 1, hits: 0, done: true } };
    let onDoneCalls = 0;
    ST.showWanderScreen(9993, 5, () => { onDoneCalls++; });
    assert.equal(onDoneCalls, 1, 'onDone fired without rendering a prompt');
    assert.equal(doc.querySelector('button[data-wander-moveon="1"]'), null, 'no overlay rendered for a done route');
});
