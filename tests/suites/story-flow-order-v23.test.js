// GOLDEN flow-order snapshot — the deterministic 3-track dispatch sequence as it
// fires today (villain=rocket, extra=cubone). This is the regression net for the
// "single story-flow engine" refactor (see docs/story-design/STORY_FLOW_AUDIT.md):
//
//   • P1–P3 are behavior-PRESERVING — this snapshot MUST stay green.
//   • P4 is the intentional ordering FIX — update the EXPECTED block then, in the
//     same commit, with a note on what changed and why.
//
// The snapshot intentionally encodes today's BUGS so the refactor is honest about
// what it changes. Bugs captured here (see audit §3/§4):
//   B3  villain.rocket.ending fires (idx48) BEFORE villain.rocket.boss (idx49)
//   B4  extra.cubone.miniRaid2 injects on idx36 = a Gym-6 APPROACH row
//   B2  multi-scene dumps (idx19 = 3 scenes; idx48 = 4)
//   B10 league dump (idx59 = 6 scenes) — FIXED (this commit): event6/7/8 pace
//       across E1/Champion/Rival via fireAtEvent sub-anchors; event9 + mfReveal
//       + ending are firePostHoF and now fire from the post-Hall-of-Fame flow
//       (continuePostGame + the Mystery-win path), so the finale no longer
//       spoils at E1. B2/B3/B4 remain captured below (still pending).
//
// Run: node --test tests/suites/story-flow-order-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window, ST = W.__storyTest, EV = W.STORY_EVENTS_RAW;

// Deterministically walk the timeline and record, per row, the scenes the road
// dump fires and the battle-beat that injects — mirroring processNextEvent +
// enterBattleEvent's 3-track paths (no RNG involved).
function traceFlow(villain, extra) {
    const sm = ST.sm;
    sm.tracks = { main: 'classic', villain, extra };
    sm.storyEventsFired = {};
    sm.active = true;
    const lines = [];
    for (let i = 0; i < EV.length; i++) {
        sm.eventIndex = i;
        const row = EV[i], type = row[1];
        const road = ST.roadForArrayIdx(i);
        const scenes = [];
        if (type !== 'City' && road) {
            for (const b of ST.resolveActiveRoadBeats(road)) {
                scenes.push(b.sceneKey);
                sm.storyEventsFired[b.sceneKey] = true;
            }
        }
        let inject = null;
        if (type === 'Battle') {
            const bb = ST.activeBattleBeatForCurrentRow();
            if (bb) { inject = `${bb.sceneKey}(${bb.kind})`; sm.storyEventsFired[bb.sceneKey] = true; }
        }
        if (scenes.length || inject) {
            lines.push(`${i}|${scenes.join('+')}|${inject || ''}`);
        }
    }
    return lines;
}

// EXPECTED golden snapshot for rocket+cubone (current behavior, bugs and all).
const EXPECTED_ROCKET_CUBONE = [
    '7|main.event1+extra.cubone.event1|',
    '13|villain.rocket.event1+extra.cubone.event2|',
    '19|main.event2+villain.rocket.event2+extra.cubone.event3|',
    '26|villain.rocket.event3+extra.cubone.event4|villain.rocket.battle1(battle)',
    '27||extra.cubone.miniRaid(miniRaid)',
    '33|main.event3+villain.rocket.event4+extra.cubone.event5|main.battle1(battle)',
    '34||villain.rocket.battle2(battle)',
    '36||extra.cubone.miniRaid2(miniRaid)',
    '40|villain.rocket.event5+extra.cubone.event6|villain.rocket.miniBoss(miniBoss)',
    '41||extra.cubone.raid(raid)',
    '48|main.event4+villain.rocket.event6+villain.rocket.ending+extra.cubone.ending|main.battle2(battle)',
    '49||villain.rocket.boss(boss)',
    '55|main.event5|',
    // B10 FIXED: the league road no longer drains every beat at E1. event6/7/8
    // pace across E1 (idx59) / Champion (idx63) / Rival (idx64); event9 +
    // mfReveal + ending are firePostHoF, so they no longer appear in the road
    // dump at all — they fire from the post-HoF flow + the Mystery-win path.
    '59|main.event6|',
    '63|main.event7|',
    '64|main.event8|',
];

test('GOLDEN: 3-track dispatch order for rocket+cubone is unchanged', () => {
    const got = traceFlow('rocket', 'cubone');
    assert.deepEqual(got, EXPECTED_ROCKET_CUBONE);
});

test('the dispatch is deterministic (same trace on repeat)', () => {
    assert.deepEqual(traceFlow('rocket', 'cubone'), traceFlow('rocket', 'cubone'));
});

test('B10 FIXED: the league road never dumps and never leaks the finale', () => {
    const got = traceFlow('rocket', 'cubone');
    // No row fires more than one MAIN league event beat — event6/7/8 pace
    // one-per-row instead of draining together at E1.
    for (const line of got) {
        const scenes = line.split('|')[1].split('+').filter(Boolean);
        const mainLeague = scenes.filter(s => /^main\.(event[6-9]|mfReveal|ending)$/.test(s));
        assert.ok(mainLeague.length <= 1, 'league beats must pace one-per-row, got: ' + line);
    }
    // The post-HoF beats (lead-in + reveal + ending) are NEVER road-dispatched —
    // they belong to continuePostGame + the Mystery-win path. This is the core
    // of the finale-spoiler fix: the twist can't appear before the player fights.
    const flat = got.join('\n');
    for (const k of ['main.event9', 'main.mfReveal', 'main.ending']) {
        assert.ok(!flat.includes(k), k + ' must fire post-HoF, not from the road dispatcher');
    }
    // event6/7/8 still all fire, and in narrative order.
    const order = ['main.event6', 'main.event7', 'main.event8'];
    const idxs = order.map(k => got.findIndex(l => l.includes(k)));
    assert.ok(idxs.every(i => i >= 0), 'event6/7/8 must all still fire');
    assert.deepEqual(idxs.slice().sort((a, b) => a - b), idxs, 'event6/7/8 fire in order');
});

test('league beat data carries the pacing sub-anchors', () => {
    const B = ST.MAIN_STORY_BEATS;
    assert.equal(B.event6.fireAtEvent, 'E1');
    assert.equal(B.event7.fireAtEvent, 'Champion');
    assert.equal(B.event8.fireAtEvent, 'Rival');
    assert.equal(B.event9.firePostHoF, true);
    assert.equal(B.mfReveal.firePostHoF, true);
    assert.equal(B.ending.firePostHoF, true);
    // The pre-HoF beats must NOT also be flagged post-HoF (and vice-versa).
    assert.ok(!B.event6.firePostHoF && !B.event7.firePostHoF && !B.event8.firePostHoF);
    assert.ok(!B.event9.fireAtEvent && !B.mfReveal.fireAtEvent && !B.ending.fireAtEvent);
});

test('BUG B3 (documented): villain ending fires before villain boss', () => {
    const got = traceFlow('rocket', 'cubone');
    const endingIdx = got.findIndex(l => l.includes('villain.rocket.ending'));
    const bossIdx = got.findIndex(l => l.includes('villain.rocket.boss('));
    assert.ok(endingIdx >= 0 && bossIdx >= 0);
    // TODO(P4): after the fix this must INVERT (boss before ending). Update then.
    assert.ok(endingIdx < bossIdx, 'snapshot of the current ending-before-boss bug');
});

test('the structural bugs reproduce across a different roll (galactic+mewtwo)', () => {
    const got = traceFlow('galactic', 'mewtwo');
    // Same shape: an ending scene precedes its boss inject, and a story battle
    // injects onto a gym-approach row — proving the bugs are structural, not
    // content-specific.
    const endingIdx = got.findIndex(l => l.includes('villain.galactic.ending'));
    const bossIdx = got.findIndex(l => l.includes('villain.galactic.boss('));
    assert.ok(endingIdx >= 0 && bossIdx >= 0 && endingIdx < bossIdx,
        'galactic arc also shows ending-before-boss');
});
