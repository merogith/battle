// GOLDEN flow-order snapshot — the deterministic 3-track dispatch sequence as it
// fires today (villain=rocket, extra=cubone). This is the regression net for the
// "single story-flow engine" refactor (see docs/story-design/STORY_FLOW_AUDIT.md):
//
//   • P1–P3 are behavior-PRESERVING — this snapshot MUST stay green.
//   • P4 is the intentional ordering FIX — update the EXPECTED block then, in the
//     same commit, with a note on what changed and why.
//
// The snapshot encodes the dispatch order. Bugs captured / fixed here (audit §3/§4):
//   B3  villain.<arc>.ending fired BEFORE villain.<arc>.boss — FIXED (G3): the
//       villain ending is now gated on the arc boss, so it drops out of the
//       pre-boss dump (idx48) and fires at idx51, after the boss (idx49).
//   G4  an injected boss/raid overwrote the road6 Rival (idx40 → Proton) — FIXED:
//       reserved rows are never overwritten, so the mini-boss moved to idx41 (a
//       generic row) and the raid to idx42; idx40 (Rival) keeps only its dump.
//   B4  extra.cubone.miniRaid2 injects on idx36 = a Gym-6 APPROACH row — still
//       pending (a placement-quality concern, not a reserved-row overwrite).
//   B2  multi-scene dumps (idx19 = 3 scenes; idx48 = 3 now) — still pending.
//   B10 league dump — FIXED earlier: event6/7/8 pace across E1/Champion/Rival via
//       fireAtEvent; event9 + mfReveal + ending are firePostHoF (post-HoF flow).
//
// Run: node --test tests/suites/story-flow-order-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window, ST = W.__storyTest, EV = W.STORY_EVENTS_RAW;

// Deterministically walk the timeline and record, per row, the scene the road
// dispatcher fires and the battle-beat that injects — mirroring the REAL paths:
// _tryFireRoadStoryBeats (events fire on ROUTE battle rows only, ONE per row,
// with all-remaining flushed on the last pre-League route row) + the route-only
// _activeBattleBeatForCurrentRow inject. No RNG involved.
function traceFlow(villain, extra) {
    const sm = ST.sm;
    sm.tracks = { main: 'classic', villain, extra };
    sm.storyEventsFired = {};
    sm.active = true;
    const lines = [];
    for (let i = 0; i < EV.length; i++) {
        sm.eventIndex = i;
        if (EV[i][1] !== 'Battle') continue;
        const road = ST.roadForArrayIdx(i);
        const scenes = [];
        if (road && ST.isRouteBattleRow(i)) {
            const q = ST.resolveActiveRoadBeats(road);
            if (q.length) {
                const toFire = ST.isLastPreLeagueRouteRow(i) ? q : [q[0]];
                for (const b of toFire) { scenes.push(b.sceneKey); sm.storyEventsFired[b.sceneKey] = true; }
            }
        }
        let inject = null;
        const bb = ST.activeBattleBeatForCurrentRow();
        if (bb) { inject = `${bb.sceneKey}(${bb.kind})`; sm.storyEventsFired[bb.sceneKey] = true; }
        if (scenes.length || inject) {
            lines.push(`${i}|${scenes.join('+')}|${inject || ''}`);
        }
    }
    return lines;
}

// EXPECTED golden snapshot for rocket+cubone — post ROUTE-ONLY + FORWARD-SPILL fix.
// Events fire ONE per ROUTE battle row (never inside a gym); injected boss/raid
// fights likewise land only on generic route rows. When a road runs out of route
// rows its overflow spills onto the NEXT road's route rows rather than onto a gym
// fight (the old bug: an injected raid landed on idx36 = a Gym-6 trainer row) or
// stranding. Notably villain.rocket.boss spills from road7 to idx55 (Victory
// Road) because road7's two route rows (idx48/49) are already taken — it still
// fires and still grants its reward, one road later.
const EXPECTED_ROCKET_CUBONE = [
    '7|main.event1|',
    '8|extra.cubone.event1|',
    '13|villain.rocket.event1|',
    '14|extra.cubone.event2|',
    '19|main.event2|',
    '20|villain.rocket.event2|',
    '21|extra.cubone.event3|',
    '26|villain.rocket.event3|villain.rocket.battle1(battle)',
    '27|extra.cubone.event4|extra.cubone.miniRaid(miniRaid)',
    '33|main.event3|main.battle1(battle)',
    '34|villain.rocket.event4|villain.rocket.battle2(battle)',
    // idx40 is the road6 Rival — reserved: no inject, but an event scene may pace here.
    '40|extra.cubone.event5|',
    '41|villain.rocket.event5|extra.cubone.miniRaid2(miniRaid)',
    '42|extra.cubone.event6|villain.rocket.miniBoss(miniBoss)',
    '48|main.event4|extra.cubone.raid(raid)',
    '49|villain.rocket.event6|main.battle2(battle)',
    // Forward-spill: road7's route rows are full, so villain.rocket.boss lands on
    // the first Victory Road row (idx55); the villain ending follows it (idx56).
    '55|extra.cubone.ending|villain.rocket.boss(boss)',
    '56|villain.rocket.ending|',
    '57|main.event5|',
    // The league road paces event6/7/8 across E1 (idx59) / Champion (idx63) /
    // Rival (idx64); event9 + mfReveal + ending are firePostHoF (post-HoF flow).
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

test('G3 FIXED: the villain boss fires before its ending', () => {
    const got = traceFlow('rocket', 'cubone');
    const endingIdx = got.findIndex(l => l.includes('villain.rocket.ending'));
    const bossIdx = got.findIndex(l => l.includes('villain.rocket.boss('));
    assert.ok(endingIdx >= 0 && bossIdx >= 0);
    assert.ok(bossIdx < endingIdx, 'the climax (boss) precedes its aftermath (ending)');
});

test('G3/G4 fixes are structural — they hold across a different roll (galactic+mewtwo)', () => {
    const got = traceFlow('galactic', 'mewtwo');
    // G3: the boss precedes its ending for this arc too.
    const endingIdx = got.findIndex(l => l.includes('villain.galactic.ending'));
    const bossIdx = got.findIndex(l => l.includes('villain.galactic.boss('));
    assert.ok(endingIdx >= 0 && bossIdx >= 0 && bossIdx < endingIdx,
        'galactic boss fires before its ending');
    // G4: the road6 Rival row (idx40) never carries an injected boss/raid.
    const rivalLine = got.find(l => /^40\|/.test(l));
    assert.ok(!rivalLine || rivalLine.split('|')[2] === '',
        'the Rival row (idx40) carries no injected boss');
});
