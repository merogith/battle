// Route-only beat firing + forward-spill (event-scheduling fix). Story beats —
// narrative event scenes AND injected boss/raid fights — must only land on ROUTE
// battle rows (between cities), never inside a gym (Gym Trainer / Gym Leader). A
// road that has more beats than route rows spills its overflow onto the next
// road's route rows, so nothing strands and nothing lands in a city. This locks
// the three reported bugs: (1) a raid injected onto a gym fight, (2) events
// firing "in cities", (3) — covered elsewhere — misleading next-step labels.
//
// Run: node --test tests/suites/story-route-only-firing.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;
const RAW = ST.STORY_EVENTS_RAW;

const VILLAINS = ['rocket', 'magma', 'aqua', 'galactic', 'plasma', 'flare', 'skull', 'yell', 'macroCosmos', 'star'];
const EXTRAS = ['cubone', 'yamask', 'hypno', 'phantump', 'mimikyu', 'drifloon', 'parasect', 'mewtwo'];
const INJECT_KINDS = /^(battle|miniBoss|boss|miniRaid|raid)$/;

// Pre-League event + inject beats expected to fire for a roll (firePostHoF and
// League-anchored beats are delivered by their own paths).
function preLeagueBeats(villain, extra) {
    const ev = new Set(), inj = new Set();
    const tables = [ST.MAIN_STORY_BEATS, ST.VILLAIN_STORY_BEATS[villain], ST.EXTRA_STORY_BEATS[extra]];
    for (const t of tables) {
        for (const k in t) {
            const b = t[k];
            if (!b || b.firePostHoF) continue;
            const ord = ST.roadOrdinal(b.roadAnchor);
            if (ord < 1 || ord > 8) continue;
            if (b.kind === 'event') ev.add(b.sceneKey);
            else if (INJECT_KINDS.test(b.kind)) inj.add(b.sceneKey);
        }
    }
    return { ev, inj };
}

// Walk the timeline exactly as the live dispatcher does.
function simulate(villain, extra) {
    ST.sm = Object.assign({}, ST.sm, { tracks: { main: 'classic_v2', villain, extra }, storyEventsFired: {} });
    const fired = ST.sm.storyEventsFired;
    const evFired = new Set(), injFired = new Set();
    let cityInject = false, cityEvent = false;
    for (let i = 0; i < RAW.length; i++) {
        if (!RAW[i] || RAW[i][1] !== 'Battle') continue;
        ST.sm.eventIndex = i;
        const road = ST.roadForArrayIdx(i);
        if (!road) continue;
        const isRoute = ST.isRouteBattleRow(i);
        // events (mirror _tryFireRoadStoryBeats)
        if (isRoute) {
            const q = ST.resolveActiveRoadBeats(road);
            if (q.length) {
                const toFire = ST.isLastPreLeagueRouteRow(i) ? q : [q[0]];
                for (const b of toFire) { evFired.add(b.sceneKey); fired[b.sceneKey] = true; }
            }
        }
        // injected fight (mirror _activeBattleBeatForCurrentRow)
        const ib = ST.injectedBattleBeatForRow(i);
        if (ib) {
            if (!isRoute) cityInject = true;
            injFired.add(ib.sceneKey); fired[ib.sceneKey] = true;
        }
    }
    return { evFired, injFired, cityInject, cityEvent };
}

test('the in-city detector classifies gym vs route battle rows correctly', () => {
    // Gym Trainer / Gym Leader rows are in-city; Basic / Elite Trainer + route
    // Rival rows are on routes; League rows count as route (next stop is HoF).
    for (let i = 0; i < RAW.length; i++) {
        if (!RAW[i] || RAW[i][1] !== 'Battle') continue;
        const name = String(RAW[i][2] || '');
        const isRoute = ST.isRouteBattleRow(i);
        if (/^Gym (Trainer|Leader)/.test(name)) assert.equal(isRoute, false, `${name} @${i} is in-city`);
    }
    // At least some route rows exist and some gym rows exist (sanity).
    let routes = 0, gyms = 0;
    for (let i = 0; i < RAW.length; i++) {
        if (!RAW[i] || RAW[i][1] !== 'Battle') continue;
        if (/^Gym (Trainer|Leader)/.test(String(RAW[i][2] || ''))) gyms++;
        else if (ST.isRouteBattleRow(i)) routes++;
    }
    assert.ok(gyms > 0 && routes > 0);
});

test('no injected fight ever lands on an in-city gym row (all 80 rolls)', () => {
    for (const v of VILLAINS) for (const x of EXTRAS) {
        const r = simulate(v, x);
        assert.equal(r.cityInject, false, `${v}+${x}: an inject landed inside a city`);
    }
});

test('every pre-League event + inject beat still fires exactly once — nothing strands (all 80 rolls)', () => {
    for (const v of VILLAINS) for (const x of EXTRAS) {
        const expect = preLeagueBeats(v, x);
        const got = simulate(v, x);
        const missEv = [...expect.ev].filter(k => !got.evFired.has(k));
        const missInj = [...expect.inj].filter(k => !got.injFired.has(k));
        assert.equal(missEv.length, 0, `${v}+${x}: stranded events ${JSON.stringify(missEv)}`);
        assert.equal(missInj.length, 0, `${v}+${x}: stranded injects ${JSON.stringify(missInj)}`);
    }
});

test('the villain boss and extra raid climaxes always fire (reward beats are never stranded)', () => {
    for (const v of VILLAINS) for (const x of EXTRAS) {
        const got = simulate(v, x);
        const bossKey = `villain.${v}.boss`;
        const raidKey = `extra.${x}.raid`;
        if (ST.VILLAIN_STORY_BEATS[v][ 'boss']) assert.ok(got.injFired.has(bossKey), `${v}+${x}: villain boss stranded`);
        if (ST.EXTRA_STORY_BEATS[x]['raid']) assert.ok(got.injFired.has(raidKey), `${v}+${x}: extra raid stranded`);
    }
});

test('injectedBattleBeatForRow previews null on reserved + in-city rows', () => {
    ST.sm = Object.assign({}, ST.sm, { tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' }, storyEventsFired: {} });
    for (let i = 0; i < RAW.length; i++) {
        if (!RAW[i] || RAW[i][1] !== 'Battle') continue;
        const name = String(RAW[i][2] || '');
        if (/^Gym (Trainer|Leader)/.test(name)) {
            assert.equal(ST.injectedBattleBeatForRow(i), null, `${name} @${i} must never host an inject`);
        }
    }
});
