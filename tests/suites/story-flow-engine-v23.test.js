// UNIFIED STORY-FLOW ENGINE — P1 equivalence proof.
// See docs/story-design/STORY_FLOW_AUDIT.md. The new engine (one registry +
// one resolver + one flowSeen ledger) must reproduce the LEGACY dispatch
// (_resolveActiveRoadBeats + _activeBattleBeatForCurrentRow) EXACTLY before it
// is swapped live (P2). This test is that proof. The flow FIXES come at P4 —
// at which point this equivalence test is replaced by a corrected-order test.
//
// Run: node --test tests/suites/story-flow-engine-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window, ST = W.__storyTest, EV = W.STORY_EVENTS_RAW;

// Legacy dispatch trace (the live path today).
function legacyTrace(villain, extra) {
    const sm = ST.sm;
    sm.tracks = { main: 'classic', villain, extra };
    sm.storyEventsFired = {};
    const lines = [];
    for (let i = 0; i < EV.length; i++) {
        sm.eventIndex = i;
        const type = EV[i][1];
        const road = ST.roadForArrayIdx(i);
        const scenes = [];
        if (type !== 'City' && road) {
            for (const b of ST.resolveActiveRoadBeats(road)) { scenes.push(b.sceneKey); sm.storyEventsFired[b.sceneKey] = true; }
        }
        let inject = null;
        if (type === 'Battle') {
            const bb = ST.activeBattleBeatForCurrentRow();
            if (bb) { inject = `${bb.sceneKey}(${bb.kind})`; sm.storyEventsFired[bb.sceneKey] = true; }
        }
        if (scenes.length || inject) lines.push(`${i}|${scenes.join('+')}|${inject || ''}`);
    }
    return lines;
}

// Unified engine trace (the new path — registry + resolver + ledger oracle).
function unifiedTrace(villain, extra) {
    const sm = ST.sm;
    sm.tracks = { main: 'classic', villain, extra };
    sm.flowSeen = {};
    const registry = ST.buildUnifiedStoryEvents();
    const seen = new Set();
    const seenFn = (id) => seen.has(id);
    const lines = [];
    for (let i = 0; i < EV.length; i++) {
        const r = ST.unifiedResolveRow(i, registry, seenFn);
        const scenes = r.scenes.map(e => e.sceneKey);
        for (const id of scenes) seen.add(id);
        let inject = null;
        if (r.battle) { inject = `${r.battle.sceneKey}(${r.battle.kind})`; seen.add(r.battle.id); }
        if (scenes.length || inject) lines.push(`${i}|${scenes.join('+')}|${inject || ''}`);
    }
    return lines;
}

for (const [v, x] of [['rocket', 'cubone'], ['galactic', 'mewtwo'], ['plasma', 'yamask'], ['star', 'drifloon']]) {
    test(`unified engine reproduces the legacy dispatch EXACTLY — ${v}+${x}`, () => {
        assert.deepEqual(unifiedTrace(v, x), legacyTrace(v, x));
    });
}

test('flowSeen ledger: seen()/markSeen() round-trip on one store', () => {
    ST.sm = Object.assign({}, ST.sm, { flowSeen: {} });
    assert.equal(ST.flowSeen('beat:probe'), false);
    ST.flowMarkSeen('beat:probe');
    assert.equal(ST.flowSeen('beat:probe'), true);
    // Distinct ids are independent.
    assert.equal(ST.flowSeen('facility:probe'), false);
});

test('registry: every .ending carries requires → its arc climax (P4 metadata)', () => {
    ST.sm = Object.assign({}, ST.sm, { tracks: { main: 'classic', villain: 'rocket', extra: 'cubone' } });
    const reg = ST.buildUnifiedStoryEvents();
    assert.equal(reg.find(e => e.id === 'villain.rocket.ending').requires, 'villain.rocket.boss');
    assert.equal(reg.find(e => e.id === 'extra.cubone.ending').requires, 'extra.cubone.raid');
});

test('registry holds main+villain+extra beats with shape {id,road,kind,track}', () => {
    ST.sm = Object.assign({}, ST.sm, { tracks: { main: 'classic', villain: 'rocket', extra: 'cubone' } });
    const reg = ST.buildUnifiedStoryEvents();
    const tracks = new Set(reg.map(e => e.track));
    assert.ok(tracks.has('main') && tracks.has('villain') && tracks.has('extra'));
    for (const e of reg) assert.ok(e.id && e.kind && e.track, `bad entry: ${JSON.stringify(e)}`);
    assert.ok(reg.length >= 30, `registry too small: ${reg.length}`);
});
