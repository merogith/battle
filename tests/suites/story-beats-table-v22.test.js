// PR-2: structural validation of the 3-track beat tables + reward tiers.
// Confirms every track has the expected slot shape, every beat's sceneKey
// resolves to a STORY_SCENES entry, and every kind maps to a known tier.
// Content was ingested from docs/story-design/story-core-structure.csv via
// scripts/build-story-scenes.mjs.
// Run: node --test tests/suites/story-beats-table-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

const MAIN_SLOT_KEYS = [
    'event1', 'event2', 'event3',
    'battle1',
    'event4',
    'battle2',
    'event5', 'event6', 'event7', 'event8', 'event9',
    'mfBattle', 'mfReveal', 'ending',
];

const VILLAIN_SLOT_KEYS = [
    'event1', 'event2', 'event3',
    'battle1',
    'event4',
    'battle2',
    'event5',
    'miniBoss',
    'event6',
    'boss',
    'ending',
];

const EXTRA_SLOT_KEYS = [
    'event1', 'event2', 'event3',
    'event4',
    'miniRaid',
    'event5',
    'miniRaid2',
    'event6',
    'raid',
    'ending',
];

const ALL_VILLAIN_TRACKS = ['rocket','magma','aqua','galactic','plasma','flare','skull','yell','macroCosmos','star'];
const ALL_EXTRA_TRACKS   = ['cubone','yamask','hypno','phantump','mimikyu','drifloon','parasect','mewtwo'];

test('MAIN_STORY_BEATS has all 14 slots', () => {
    const t = ST.MAIN_STORY_BEATS;
    assert.equal(Object.keys(t).length, MAIN_SLOT_KEYS.length, 'main slot count');
    for (const k of MAIN_SLOT_KEYS) {
        assert.ok(t[k], `missing main slot: ${k}`);
        assert.equal(t[k].sceneKey, 'main.' + k);
        assert.ok(t[k].roadAnchor, `slot ${k} missing roadAnchor`);
        assert.ok(t[k].kind, `slot ${k} missing kind`);
    }
});

test('VILLAIN_STORY_BEATS has all 10 tracks with all 11 slots', () => {
    const t = ST.VILLAIN_STORY_BEATS;
    for (const track of ALL_VILLAIN_TRACKS) {
        const beats = t[track];
        assert.ok(beats, `missing villain track: ${track}`);
        for (const slot of VILLAIN_SLOT_KEYS) {
            assert.ok(beats[slot], `villain ${track} missing slot: ${slot}`);
            assert.equal(beats[slot].sceneKey, `villain.${track}.${slot}`);
            assert.ok(beats[slot].roadAnchor, `villain ${track}.${slot} missing roadAnchor`);
            assert.ok(beats[slot].kind, `villain ${track}.${slot} missing kind`);
        }
    }
});

test('EXTRA_STORY_BEATS has all 8 tracks with all 10 slots', () => {
    const t = ST.EXTRA_STORY_BEATS;
    for (const track of ALL_EXTRA_TRACKS) {
        const beats = t[track];
        assert.ok(beats, `missing extra track: ${track}`);
        for (const slot of EXTRA_SLOT_KEYS) {
            assert.ok(beats[slot], `extra ${track} missing slot: ${slot}`);
            assert.equal(beats[slot].sceneKey, `extra.${track}.${slot}`);
            assert.ok(beats[slot].roadAnchor, `extra ${track}.${slot} missing roadAnchor`);
            assert.ok(beats[slot].kind, `extra ${track}.${slot} missing kind`);
        }
    }
});

test('every beat sceneKey resolves to a STORY_SCENES entry with prose', () => {
    const scenes = ST.STORY_SCENES;
    const collectBeats = (table) => {
        const out = [];
        for (const slot of Object.values(table)) {
            if (slot && slot.sceneKey) out.push(slot);
            else if (typeof slot === 'object') for (const inner of Object.values(slot)) out.push(inner);
        }
        return out;
    };
    const all = [
        ...collectBeats(ST.MAIN_STORY_BEATS),
        ...collectBeats(ST.VILLAIN_STORY_BEATS),
        ...collectBeats(ST.EXTRA_STORY_BEATS),
    ];
    for (const beat of all) {
        const scene = scenes[beat.sceneKey];
        assert.ok(scene, `STORY_SCENES missing: ${beat.sceneKey}`);
        assert.ok(scene.title && scene.title.length > 0, `${beat.sceneKey} missing title`);
        assert.ok(scene.body && scene.body.length > 0, `${beat.sceneKey} missing body`);
    }
});

test('every beat kind maps to a known reward tier', () => {
    const k2t = ST.STORY_KIND_TO_TIER;
    const tiers = ST.STORY_REWARD_TIERS;
    const allKinds = new Set();
    const visit = (table) => {
        for (const slot of Object.values(table)) {
            if (slot && slot.kind) allKinds.add(slot.kind);
            else if (typeof slot === 'object') for (const inner of Object.values(slot)) if (inner && inner.kind) allKinds.add(inner.kind);
        }
    };
    visit(ST.MAIN_STORY_BEATS);
    visit(ST.VILLAIN_STORY_BEATS);
    visit(ST.EXTRA_STORY_BEATS);
    for (const kind of allKinds) {
        const tierKey = k2t[kind];
        assert.ok(tierKey, `kind '${kind}' not in STORY_KIND_TO_TIER`);
        assert.ok(tiers[tierKey], `tier '${tierKey}' not in STORY_REWARD_TIERS`);
    }
});

test('STORY_REWARD_TIERS has all 5 tiers with required fields', () => {
    const tiers = ST.STORY_REWARD_TIERS;
    const required = ['flavor', 'low', 'mid', 'big', 'apex'];
    for (const t of required) {
        const tier = tiers[t];
        assert.ok(tier, `missing tier: ${t}`);
        assert.equal(typeof tier.goldFrac, 'number', `tier ${t} missing goldFrac`);
        assert.ok('vouchers' in tier, `tier ${t} missing vouchers`);
        assert.ok('vitamins' in tier, `tier ${t} missing vitamins`);
        assert.ok(Array.isArray(tier.items), `tier ${t} items not an array`);
    }
});

test('STORY_BASE_TRAINER_GOLD_MULT is a sub-1 multiplier', () => {
    const m = ST.STORY_BASE_TRAINER_GOLD_MULT;
    assert.equal(typeof m, 'number');
    assert.ok(m > 0 && m < 1, `expected (0, 1) gold multiplier; got ${m}`);
});

test('road anchors are well-formed (road1..road8 or league)', () => {
    const valid = new Set(['road1','road2','road3','road4','road5','road6','road7','road8','league']);
    const visit = (table) => {
        for (const slot of Object.values(table)) {
            if (slot && slot.roadAnchor) {
                assert.ok(valid.has(slot.roadAnchor), `bad anchor: ${slot.roadAnchor} on ${slot.sceneKey}`);
            } else if (typeof slot === 'object') {
                for (const inner of Object.values(slot)) {
                    if (inner && inner.roadAnchor) {
                        assert.ok(valid.has(inner.roadAnchor), `bad anchor: ${inner.roadAnchor} on ${inner.sceneKey}`);
                    }
                }
            }
        }
    };
    visit(ST.MAIN_STORY_BEATS);
    visit(ST.VILLAIN_STORY_BEATS);
    visit(ST.EXTRA_STORY_BEATS);
});

test('STORY_SCENES has exactly 207 entries (17 main + 110 villain + 80 extra)', () => {
    // 17 main = the 14 original + the 3 Mystery Figure rework scenes
    // (main.mfFirst, main.mfFirstReturn, main.mfSpare — 2026-07).
    const scenes = ST.STORY_SCENES;
    assert.equal(Object.keys(scenes).length, 207);
});
