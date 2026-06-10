// Guard: arrival reactivity (H4-4 / H2-5). On arriving in a city, the arrival screen
// acknowledges the villain/extra lead the player JUST crossed on the road in — a callback
// off sm.storyEventsFired. Locks: (1) every arc id resolves an acknowledge line, (2)
// _lastRoadArcForCity reads the fired-state correctly (villain beats extra, silent when
// nothing fired), and (3) anomaly seeds render on the diegetic overlay, not a bare alert.
// Run: node --test tests/suites/story-arrival-reactivity.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const document = W.document;
assert.ok(ST, 'window.__storyTest must be exposed under the harness');

const VILLAIN_ARCS = ['rocket', 'magma', 'aqua', 'galactic', 'plasma', 'skull', 'yell', 'flare', 'macroCosmos', 'star'];
const EXTRA_ARCS = ['cubone', 'yamask', 'hypno', 'phantump', 'mimikyu', 'drifloon', 'parasect', 'mewtwo'];

// First sceneKey in `beats` whose roadAnchor has the given road ordinal.
const keyAtOrd = (beats, ord) => {
    for (const slot of Object.values(beats || {})) {
        if (slot && ST.roadOrdinal(slot.roadAnchor) === ord) return slot.sceneKey;
    }
    return null;
};

test('every villain + extra arc resolves a non-empty arrival acknowledgment line', () => {
    const M = ST.CITY_ARRIVAL_BY_PRIOR_ARC;
    for (const arc of [...VILLAIN_ARCS, ...EXTRA_ARCS]) {
        assert.ok(typeof M[arc] === 'string' && M[arc].trim().length > 10, `${arc} has an arrival line`);
    }
    assert.equal(Object.keys(M).length, 18, '10 villain + 8 extra arcs covered (no missing-key fallthrough)');
});

test('_lastRoadArcForCity acknowledges the arc whose beat fired on the road into the city', () => {
    const sk = keyAtOrd(ST.VILLAIN_STORY_BEATS.rocket, 2);   // road2 arrives at city 2
    assert.ok(sk, 'rocket has a road-2 beat');
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: { [sk]: true },
    });
    assert.equal(ST.lastRoadArcForCity(2), 'rocket', 'rocket acknowledged after its road-2 beat fired');
});

test('_lastRoadArcForCity is silent when no arc beat fired on the prior segment', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
    });
    assert.equal(ST.lastRoadArcForCity(2), '', 'no fired beat → generic blurb (empty arc id)');
    assert.equal(ST.lastRoadArcForCity(0), '', 'city 0 (start town) never acknowledges a prior road');
});

test('villain arc wins over extra when both fired on the same road', () => {
    let ord = -1, vk = null, xk = null;
    for (let o = 2; o <= 8; o++) {
        const a = keyAtOrd(ST.VILLAIN_STORY_BEATS.rocket, o);
        const b = keyAtOrd(ST.EXTRA_STORY_BEATS.cubone, o);
        if (a && b) { ord = o; vk = a; xk = b; break; }
    }
    assert.ok(ord > 0, 'a shared road ordinal exists for rocket + cubone');
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: { [vk]: true, [xk]: true },
    });
    assert.equal(ST.lastRoadArcForCity(ord), 'rocket', 'the louder villain road event wins');
});

test('extra arc is acknowledged when only its beat fired', () => {
    let ord = -1, xk = null;
    for (let o = 2; o <= 8; o++) { const b = keyAtOrd(ST.EXTRA_STORY_BEATS.cubone, o); if (b) { ord = o; xk = b; break; } }
    assert.ok(xk, 'cubone has a road beat');
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: { [xk]: true },   // only the extra beat fired
    });
    assert.equal(ST.lastRoadArcForCity(ord), 'cubone', 'extra acknowledged when the villain track was quiet');
});

test('anomaly seed renders on the diegetic overlay (not a system alert) and fires once', () => {
    ST.sm = Object.assign({}, ST.sm, { scenesShown: {} });
    Array.from(document.querySelectorAll('.story-anomaly')).forEach(n => n.remove());
    let alertCalled = false;
    const origAlert = W.showGameAlert;
    W.showGameAlert = () => { alertCalled = true; };
    try {
        const fired = ST.tryFireAnomalySeed([7, 'City', 'Pallet']);   // rowId 7 carries a seed
        assert.equal(fired, true, 'seed eligible on a fresh run');
        assert.ok(document.querySelector('.story-anomaly'), 'anomaly seed mounted on the diegetic narration overlay');
        assert.equal(alertCalled, false, 'did NOT fall back to the bare system alert (the NOTIF z-order bug)');
        assert.equal(ST.tryFireAnomalySeed([7, 'City', 'Pallet']), false, 'dedup — the seed fires exactly once');
    } finally {
        W.showGameAlert = origAlert;
        Array.from(document.querySelectorAll('.story-anomaly')).forEach(n => n.remove());
    }
});
