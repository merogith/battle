// G3 + G4 — story dispatch-ordering flow-bugs (design-pass fixes, Stream 1).
//
// G3: a villain arc's `ending` (kind "event", road7) was DUMPED before the arc's
//     `boss` (kind "boss", injected, road7) — both anchor road7, but events dump
//     at the road's first battle while the boss injects at its own row, so the
//     aftermath played before the climax. Fix: defer the villain ending until the
//     arc boss is fired. (Extra-arc endings need no gate — their raid climax is on
//     an earlier road.)
//
// G4: `_activeBattleBeatForCurrentRow` injected the next boss/raid onto whatever
//     the road's first battle row was — including the road6 Rival (→ Proton), with
//     no in-fiction reason the fight changed identity. Fix: reserved rows (Rival,
//     Gym Leader, Champion, E1-E4, Mystery Figure, Victory Road) are never
//     overwritten; the inject waits for the next generic row.
//
// Run: node --test tests/suites/story-flow-order-g3g4.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const RAW = ST.STORY_EVENTS_RAW;
const RESERVED = /^(Rival|Gym Leader [1-8]|Champion|E[1-4]|Mystery Figure|Victory Road)$/;

function firstRowOnRoad(road, pred) {
    for (let i = 0; i < RAW.length; i++) {
        if (ST.roadForArrayIdx(i) === road && RAW[i] && RAW[i][1] === 'Battle' && (!pred || pred(RAW[i]))) return i;
    }
    return -1;
}

// ───────────────────────── G3 ─────────────────────────

test('G3: a villain ending is deferred while its arc boss is un-fired', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
        eventIndex: firstRowOnRoad('road7'),
    });
    const before = ST.resolveActiveRoadBeats('road7').map(b => b.sceneKey);
    assert.ok(before.includes('villain.rocket.event6'), 'the pre-boss lead-in (event6) still dumps');
    assert.ok(!before.includes('villain.rocket.ending'), 'the ending is held back before the boss');
});

test('G3: once the arc boss is fired, the ending becomes eligible', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: { 'villain.rocket.boss': true },
        eventIndex: firstRowOnRoad('road7'),
    });
    const after = ST.resolveActiveRoadBeats('road7').map(b => b.sceneKey);
    assert.ok(after.includes('villain.rocket.ending'), 'after the climax, the ending dumps (next road7 row)');
});

test('G3: gate applies to every villain arc (not just rocket)', () => {
    for (const arc of ['magma', 'aqua', 'galactic', 'plasma', 'skull', 'yell', 'flare', 'macroCosmos', 'star']) {
        ST.sm = Object.assign({}, ST.sm, {
            tracks: { main: 'classic_v2', villain: arc, extra: 'cubone' },
            storyEventsFired: {},
            eventIndex: firstRowOnRoad('road7'),
        });
        const keys = ST.resolveActiveRoadBeats('road7').map(b => b.sceneKey);
        assert.ok(!keys.includes('villain.' + arc + '.ending'),
            arc + ' ending must be gated while its boss is un-fired');
        ST.sm.storyEventsFired = { ['villain.' + arc + '.boss']: true };
        const keys2 = ST.resolveActiveRoadBeats('road7').map(b => b.sceneKey);
        assert.ok(keys2.includes('villain.' + arc + '.ending'),
            arc + ' ending must fire once its boss is done');
    }
});

test('G3: extra-arc ending is NOT gated (its raid climax is on a prior road)', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
        eventIndex: firstRowOnRoad('road7'),
    });
    const keys = ST.resolveActiveRoadBeats('road7').map(b => b.sceneKey);
    assert.ok(keys.includes('extra.cubone.ending'), 'extra ending is eligible regardless of boss state');
});

// ───────────────────────── G4 ─────────────────────────

test('G4: no boss/raid is injected onto the road6 Rival row', () => {
    const rivalIdx = firstRowOnRoad('road6', r => r[2] === 'Rival');
    assert.ok(rivalIdx > 0, 'road6 has a Rival battle row');
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
        eventIndex: rivalIdx,
    });
    assert.equal(ST.activeBattleBeatForCurrentRow(), null, 'the Rival row is reserved — nothing injects');
});

test('G4: the mini-boss lands on the next GENERIC road6 row instead (Proton, not the Rival)', () => {
    const rivalIdx = firstRowOnRoad('road6', r => r[2] === 'Rival');
    let genIdx = -1;
    for (let i = rivalIdx + 1; i < RAW.length; i++) {
        if (ST.roadForArrayIdx(i) !== 'road6') break;
        if (RAW[i][1] === 'Battle' && !RESERVED.test(String(RAW[i][2]))) { genIdx = i; break; }
    }
    assert.ok(genIdx > 0, 'road6 has a generic battle row after the Rival');
    // Forward-spill: mark every inject anchored before road6 as fired (the state
    // after the player has cleared roads 4–5), so the road6 mini-boss is the
    // earliest unfired inject — it then lands on this generic row, not the Rival.
    const firedBefore6 = {};
    for (const tbl of [ST.MAIN_STORY_BEATS, ST.VILLAIN_STORY_BEATS.rocket, ST.EXTRA_STORY_BEATS.cubone]) {
        for (const slot of Object.values(tbl)) {
            if (!slot || !/^(battle|miniBoss|boss|miniRaid|raid)$/.test(slot.kind || '')) continue;
            if (ST.roadOrdinal(slot.roadAnchor) < 6) firedBefore6[slot.sceneKey] = true;
        }
    }
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: firedBefore6,
        eventIndex: genIdx,
    });
    const beat = ST.activeBattleBeatForCurrentRow();
    assert.ok(beat && beat.kind === 'miniBoss', 'the villain mini-boss injects here');
    assert.equal(ST.BEAT_CANON_TRAINER[beat.sceneKey], 'Proton', 'resolving to Proton on a generic row');
});

test('G4: NO reserved battle row ever receives an injected beat (sweep all rows, all kinds)', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
    });
    let reservedRows = 0;
    for (let i = 0; i < RAW.length; i++) {
        if (!RAW[i] || RAW[i][1] !== 'Battle' || !RESERVED.test(String(RAW[i][2]))) continue;
        reservedRows++;
        ST.sm.eventIndex = i;
        ST.sm.storyEventsFired = {};   // nothing fired → an un-guarded resolver WOULD inject here
        assert.equal(ST.activeBattleBeatForCurrentRow(), null,
            `reserved row eventIndex=${RAW[i][0]} "${RAW[i][2]}" must never be overwritten`);
    }
    assert.ok(reservedRows > 0, 'sanity: there are reserved battle rows');
});

test('G4: no inject beat is STRANDED — every villain/extra inject beat resolves to a non-reserved row', () => {
    // For each track, walk all battle rows; the resolver must surface each inject
    // beat on SOME non-reserved row (i.e., reserved-skipping never orphans a beat).
    const villains = ['rocket', 'magma', 'aqua', 'galactic', 'plasma', 'skull', 'yell', 'flare', 'macroCosmos', 'star'];
    const extras = ['cubone', 'yamask', 'hypno', 'phantump', 'mimikyu', 'drifloon', 'parasect', 'mewtwo'];
    for (const villain of villains) {
        for (const extra of extras.slice(0, 2)) {   // 20 combos is plenty to exercise the road layout
            ST.sm = Object.assign({}, ST.sm, { tracks: { main: 'classic_v2', villain, extra }, storyEventsFired: {} });
            const seen = new Set();
            const fired = {};
            for (let i = 0; i < RAW.length; i++) {
                if (!RAW[i] || RAW[i][1] !== 'Battle') continue;
                ST.sm.eventIndex = i;
                ST.sm.storyEventsFired = fired;
                const beat = ST.activeBattleBeatForCurrentRow();
                if (beat && !RESERVED.test(String(RAW[i][2]))) { seen.add(beat.sceneKey); fired[beat.sceneKey] = true; }
            }
            // Every road-anchored inject beat for these tracks must have surfaced.
            for (const key of [`villain.${villain}.miniBoss`, `villain.${villain}.boss`, `extra.${extra}.raid`]) {
                assert.ok(seen.has(key), `${key} should resolve onto a non-reserved row (not stranded)`);
            }
        }
    }
});
