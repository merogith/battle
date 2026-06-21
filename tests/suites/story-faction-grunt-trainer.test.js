// Faction-consistency for grunt-tier villain beats (battle1/battle2).
//
// Bug: the grunt tier was the one villain beat with NO trainer override, so it
// inherited the route row's faction-blind assignment. The late-game "villain
// gauntlet" lean fills those Elite-Trainer slots with named villains from ANY
// team — so a Team ROCKET story could serve a Team FLARE trainer (Lysandre) in a
// fight whose prose says "two Rocket grunts block the road."
//
// Fix: BEAT_FACTION_TRAINER pins battle1 → the team's grunt and battle2 → the
// team's admin, completing the grunt → admin → boss ladder. enterBattleEvent
// resolves it role-agnostically (the grunts/admins are role:'Basic Trainer').
// Teams with no grunt/admin asset (Yell / Macro Cosmos / Star) are omitted and
// fall back to a neutral generated trainer — never a wrong-faction villain.
//
// Run: node --test tests/suites/story-faction-grunt-trainer.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

// The 7 villain teams that ship a grunt + admin trainer (and sprite).
const EXPECTED = {
    rocket:   { battle1: 'Team Rocket Grunt',    battle2: 'Rocket Executive'   },
    aqua:     { battle1: 'Team Aqua Grunt',      battle2: 'Aqua Admin'         },
    magma:    { battle1: 'Team Magma Grunt',     battle2: 'Magma Admin'        },
    galactic: { battle1: 'Team Galactic Grunt',  battle2: 'Galactic Commander' },
    plasma:   { battle1: 'Team Plasma Grunt',    battle2: 'Plasma Sage'        },
    flare:    { battle1: 'Team Flare Grunt',     battle2: 'Flare Scientist'    },
    skull:    { battle1: 'Team Skull Grunt',     battle2: 'Skull Boss'         },
};
// The 3 teams with no grunt/admin asset — must be omitted (generic fallback).
const NO_ASSET = ['yell', 'macroCosmos', 'star'];
// A keyword that must appear in every trainer of a given faction.
const FACTION_KEYWORD = {
    rocket: 'Rocket', aqua: 'Aqua', magma: 'Magma', galactic: 'Galactic',
    plasma: 'Plasma', flare: 'Flare', skull: 'Skull',
};

test('BEAT_FACTION_TRAINER maps each asset team battle1 → grunt, battle2 → admin', () => {
    const map = ST.BEAT_FACTION_TRAINER;
    for (const f of Object.keys(EXPECTED)) {
        assert.equal(map[`villain.${f}.battle1`], EXPECTED[f].battle1, `${f} battle1`);
        assert.equal(map[`villain.${f}.battle2`], EXPECTED[f].battle2, `${f} battle2`);
    }
});

test('no-asset teams (Yell / Macro Cosmos / Star) are intentionally omitted', () => {
    const map = ST.BEAT_FACTION_TRAINER;
    for (const f of NO_ASSET) {
        assert.equal(map[`villain.${f}.battle1`], undefined, `${f} battle1 must be absent`);
        assert.equal(map[`villain.${f}.battle2`], undefined, `${f} battle2 must be absent`);
    }
});

test('BEAT_FACTION_TRAINER only contains grunt-tier (battle1/battle2) keys', () => {
    for (const key of Object.keys(ST.BEAT_FACTION_TRAINER)) {
        assert.match(key, /^villain\.[a-zA-Z]+\.battle[12]$/, `unexpected key ${key}`);
    }
});

test('BEAT_FACTION_TRAINER and BEAT_CANON_TRAINER are tier-disjoint', () => {
    const faction = Object.keys(ST.BEAT_FACTION_TRAINER);
    const canon = new Set(Object.keys(ST.BEAT_CANON_TRAINER));
    for (const key of faction) {
        assert.ok(!canon.has(key), `${key} must not also be a canon (boss/miniBoss) key`);
    }
    // And no boss/miniBoss key leaked into the grunt table.
    for (const key of faction) assert.doesNotMatch(key, /\.(boss|miniBoss)$/);
});

test('every BEAT_FACTION_TRAINER name resolves to a role:Basic Trainer entry', () => {
    const TD = ST.getTrainerData();
    for (const [key, name] of Object.entries(ST.BEAT_FACTION_TRAINER)) {
        // first-match, mirroring the engine's TRAINER_DATA.find() resolution
        // (some names — e.g. 'Rocket Executive' — also exist as an Elite Trainer row).
        const td = TD.find(t => t.name === name);
        assert.ok(td, `${key} → ${name} not in TRAINER_DATA`);
        assert.equal(td.role, 'Basic Trainer', `${name} should be role:'Basic Trainer'`);
    }
});

test('battle1 entries are grunts; battle2 entries are admins (tag:villain, not grunts)', () => {
    const TD = ST.getTrainerData();
    const find = (n) => TD.find(t => t.name === n);
    for (const f of Object.keys(EXPECTED)) {
        const grunt = find(ST.BEAT_FACTION_TRAINER[`villain.${f}.battle1`]);
        const admin = find(ST.BEAT_FACTION_TRAINER[`villain.${f}.battle2`]);
        assert.match(grunt.name, /Grunt/, `${f} battle1 should be a grunt`);
        assert.doesNotMatch(admin.name, /Grunt/, `${f} battle2 should NOT be a grunt`);
        assert.equal(admin.tag, 'villain', `${f} battle2 admin should be tag:'villain'`);
    }
});

test('CROSS-FACTION GUARD: each grunt/admin belongs to its own team, never another', () => {
    for (const f of Object.keys(EXPECTED)) {
        const kw = FACTION_KEYWORD[f];
        for (const tier of ['battle1', 'battle2']) {
            const name = ST.BEAT_FACTION_TRAINER[`villain.${f}.${tier}`];
            assert.ok(name.includes(kw), `${f} ${tier} (${name}) must name its own team`);
            // It must NOT carry any OTHER team's keyword (the Rocket-serves-Flare bug).
            for (const other of Object.keys(FACTION_KEYWORD)) {
                if (other === f) continue;
                assert.ok(!name.includes(FACTION_KEYWORD[other]),
                    `${f} ${tier} (${name}) must not read as team ${other}`);
            }
        }
    }
});

test('resolver + table: an active Rocket grunt beat resolves to a Rocket trainer (never cross-faction)', () => {
    const RAW = ST.STORY_EVENTS_RAW;
    // A Road 4 route (Basic Trainer) row — where villain.rocket.battle1 anchors.
    let road4Idx = -1;
    for (let i = 0; i < RAW.length; i++) {
        if (ST.roadForArrayIdx(i) === 'road4' && RAW[i] && RAW[i][1] === 'Battle' && RAW[i][2] === 'Basic Trainer') {
            road4Idx = i; break;
        }
    }
    assert.ok(road4Idx > 0, 'should find a Road 4 Basic Trainer row');

    // Isolate the rocket grunt beat: mark every other inject beat fired.
    const fired = {};
    for (const tbl of [ST.MAIN_STORY_BEATS, ST.VILLAIN_STORY_BEATS.rocket, ST.EXTRA_STORY_BEATS.cubone]) {
        for (const slot of Object.values(tbl)) {
            if (!slot || !/^(battle|miniBoss|boss|miniRaid|raid)$/.test(slot.kind || '')) continue;
            if (slot.sceneKey === 'villain.rocket.battle1') continue;
            fired[slot.sceneKey] = true;
        }
    }
    ST.sm = Object.assign({}, ST.sm, {
        tracks: { main: 'classic_v2', villain: 'rocket', extra: 'cubone' },
        storyEventsFired: fired,
        eventIndex: road4Idx,
    });

    const beat = ST.activeBattleBeatForCurrentRow();
    assert.ok(beat && beat.sceneKey === 'villain.rocket.battle1', 'rocket grunt beat should be active');
    // Mirror enterBattleEvent's _beatForced resolution: canon first, then faction.
    const name = ST.BEAT_CANON_TRAINER[beat.sceneKey] || ST.BEAT_FACTION_TRAINER[beat.sceneKey];
    assert.ok(name, 'the rocket grunt beat must map to a faction trainer');
    assert.match(name, /Rocket/, 'a Rocket grunt beat must resolve to a Rocket trainer, never another team');
    assert.ok(ST.getTrainerData().some(t => t.name === name), 'mapped trainer exists in TRAINER_DATA');
});
