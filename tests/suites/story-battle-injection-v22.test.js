// PR-4c: battle-beat scene attachment + reward grant via onBattleEnd hook.
// Verifies the helper resolvers + the in-flight battle key lifecycle.
// Run: node --test tests/suites/story-battle-injection-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

test('findBeatBySceneKey resolves main / villain / extra slots', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
    });
    const a = ST.findBeatBySceneKey('main.event1');
    assert.ok(a && a.sceneKey === 'main.event1');
    const b = ST.findBeatBySceneKey('villain.rocket.boss');
    assert.ok(b && b.sceneKey === 'villain.rocket.boss');
    const c = ST.findBeatBySceneKey('extra.cubone.raid');
    assert.ok(c && c.sceneKey === 'extra.cubone.raid');
});

test('findBeatBySceneKey returns null for inactive track keys', () => {
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
    });
    // Player rolled rocket, so magma slots aren't resolvable.
    assert.equal(ST.findBeatBySceneKey('villain.magma.boss'), null);
    // Player rolled cubone, so yamask slots aren't resolvable.
    assert.equal(ST.findBeatBySceneKey('extra.yamask.raid'), null);
});

test('findBeatBySceneKey returns null for bogus keys', () => {
    assert.equal(ST.findBeatBySceneKey(null), null);
    assert.equal(ST.findBeatBySceneKey(''), null);
    assert.equal(ST.findBeatBySceneKey('not.a.real.key'), null);
});

test('activeBattleBeatForCurrentRow returns null when sm.tracks missing', () => {
    ST.sm = Object.assign({}, ST.sm, { tracks: null });
    assert.equal(ST.activeBattleBeatForCurrentRow(), null);
});

test('activeBattleBeatForCurrentRow finds villain.rocket.battle1 on Road 4', () => {
    // Road 4 = rows between Gym 4 (id 24, array idx ~21) and Gym 5 (id 31).
    // Find a Road 4 trainer row.
    const RAW = ST.STORY_EVENTS_RAW;
    let road4ArrayIdx = -1;
    for (let i = 0; i < RAW.length; i++) {
        if (ST.roadForArrayIdx(i) === 'road4' && RAW[i] && RAW[i][1] === 'Battle' && RAW[i][2] === 'Basic Trainer') {
            road4ArrayIdx = i;
            break;
        }
    }
    assert.ok(road4ArrayIdx > 0, 'should find a Road 4 Basic Trainer row');

    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
        eventIndex: road4ArrayIdx,
    });
    const beat = ST.activeBattleBeatForCurrentRow();
    assert.ok(beat, 'a battle-kind beat should be active on Road 4');
    // Either villain.rocket.battle1 or extra.cubone.{miniRaid,event4} ordering
    // depends on priority — but the kind must be a battle-shaped one.
    assert.match(beat.kind, /^(battle|miniBoss|boss|miniRaid|raid)$/);
});

test('activeBattleBeatForCurrentRow returns null when all road beats already fired', () => {
    const RAW = ST.STORY_EVENTS_RAW;
    let road4ArrayIdx = -1;
    for (let i = 0; i < RAW.length; i++) {
        if (ST.roadForArrayIdx(i) === 'road4') { road4ArrayIdx = i; break; }
    }
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {
            'villain.rocket.battle1': true,
            'extra.cubone.miniRaid': true,
        },
        eventIndex: road4ArrayIdx,
    });
    const beat = ST.activeBattleBeatForCurrentRow();
    assert.equal(beat, null, 'no beat should be active once both Road 4 battle beats are marked fired');
});

test('activeBattleBeatForCurrentRow excludes event-kind beats (only battle/raid/boss)', () => {
    const RAW = ST.STORY_EVENTS_RAW;
    let road1ArrayIdx = -1;
    for (let i = 0; i < RAW.length; i++) {
        if (ST.roadForArrayIdx(i) === 'road1' && RAW[i] && RAW[i][1] === 'Battle') {
            road1ArrayIdx = i;
            break;
        }
    }
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
        eventIndex: road1ArrayIdx,
    });
    // Road 1 has main.event1 + extra.cubone.event1 — both event-kind. No
    // battle/raid/boss beats on Road 1, so should return null.
    const beat = ST.activeBattleBeatForCurrentRow();
    assert.equal(beat, null, 'Road 1 has no battle-kind beats; should return null');
});

test('activeBattleBeatForCurrentRow finds villain.rocket.boss on Road 7 after main beats fired', () => {
    const RAW = ST.STORY_EVENTS_RAW;
    let road7ArrayIdx = -1;
    for (let i = 0; i < RAW.length; i++) {
        if (ST.roadForArrayIdx(i) === 'road7' && RAW[i] && RAW[i][1] === 'Battle') {
            road7ArrayIdx = i;
            break;
        }
    }
    // Forward-spill (route-only fix): an injected fight is hosted on the EARLIEST
    // unfired inject beat at or behind the current road, so to isolate the road7
    // boss we mark every inject beat anchored before/at road7 (except the boss) as
    // already fired — the realistic state once the player has worked roads 4–6.
    const firedBefore = {};
    for (const tbl of [ST.MAIN_STORY_BEATS, ST.VILLAIN_STORY_BEATS.rocket, ST.EXTRA_STORY_BEATS.cubone]) {
        for (const slot of Object.values(tbl)) {
            if (!slot || !/^(battle|miniBoss|boss|miniRaid|raid)$/.test(slot.kind || '')) continue;
            if (slot.sceneKey === 'villain.rocket.boss') continue;
            if (ST.roadOrdinal(slot.roadAnchor) <= 7) firedBefore[slot.sceneKey] = true;
        }
    }
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: firedBefore,
        eventIndex: road7ArrayIdx,
    });
    const beat = ST.activeBattleBeatForCurrentRow();
    assert.ok(beat, 'Road 7 should have an unfired battle beat (villain boss)');
    assert.equal(beat.sceneKey, 'villain.rocket.boss');
    assert.equal(beat.kind, 'boss');
});

test('activeBattleBeatForCurrentRow excludes mysteryBoss kind (handled by existing path)', () => {
    // mysteryBoss anchors to 'league', not a road. So even on a league row,
    // the resolver wouldn't return mfBattle if road resolves to 'league' —
    // but main.mfBattle has kind 'mysteryBoss' which is excluded by the
    // isInjectKind filter. Verify directly.
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: {},
    });
    // Force eventIndex to a league row.
    const RAW = ST.STORY_EVENTS_RAW;
    let leagueIdx = -1;
    for (let i = 0; i < RAW.length; i++) {
        if (ST.roadForArrayIdx(i) === 'league' && RAW[i] && RAW[i][1] === 'Battle') {
            leagueIdx = i;
            break;
        }
    }
    if (leagueIdx >= 0) {
        ST.sm.eventIndex = leagueIdx;
        const beat = ST.activeBattleBeatForCurrentRow();
        // Should either be null (no league battle beats) or a non-mysteryBoss
        // kind. We assert it's not mysteryBoss specifically.
        if (beat) assert.notEqual(beat.kind, 'mysteryBoss');
    }
});
