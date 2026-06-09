// Camp bonding — relationship → stat buff, DORMANT plumbing (Camp System PR B).
// See docs/story-design/camp/BONDING_RELATIONSHIPS.md + IMPLEMENTATION_ROADMAP §3 PR B.
//
// PR B lands the SAVE_VER 24→25 migration + the relationshipStatMult math + the
// buildPokemon apply block + the launchBattle stamp — all DORMANT: with every bond
// counter 0, the per-stat multiplier is all-1.0, so built stats are byte-identical
// to pre-feature. The buff only goes LIVE in PR D (earning loop). These assertions
// lock: (1) the dormant guard, (2) the pure relationshipStatMult, (3) Nature-driven
// thresholds, (4) the migration shape/idempotency.
//
// Run: node --test tests/suites/camp-bonding-dormant-v25.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

const freshBuild = (n = 'Hardy') => ({
    n,
    ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
    evs: {},
});

test('SAVE_VER is current (>= 25, the camp release floor)', () => {
    // Camp shipped at v25; later schema bumps (v26 narration overhaul, …) raise
    // the current version. The camp migration is still exercised below.
    assert.ok(W.__STORY_SAVE_VER >= 25);
});

test('relationshipStatMult: empty / no-bonds slot → all 1.0 (dormant)', () => {
    // Spread normalizes the jsdom-realm object into a test-realm literal (deepEqual
    // is reference-equal on prototypes across realms otherwise).
    assert.deepEqual({ ...ST.relationshipStatMult({}) }, { hp:1, atk:1, def:1, spa:1, spd:1, spe:1 });
    assert.deepEqual({ ...ST.relationshipStatMult({ build: freshBuild(), bonds: { praise:0, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0 } }) },
        { hp:1, atk:1, def:1, spa:1, spd:1, spe:1 });
});

test('relationshipStatMult: a mastered path → its stat ×1.05, others 1', () => {
    // Flat threshold 5 for every path/nature. praise→atk.
    const slot = { build: freshBuild('Hardy'), bonds: { praise: 5 } };
    const m = ST.relationshipStatMult(slot);
    assert.equal(m.atk, 1.05);
    assert.equal(m.def, 1);
    assert.equal(m.hp, 1);
    // below threshold contributes nothing
    assert.equal(ST.relationshipStatMult({ build: freshBuild('Hardy'), bonds: { praise: 4 } }).atk, 1);
});

test('relationshipStatMult: all six mastered → every stat ×1.05', () => {
    const maxed = { praise:99, nurture:99, discipline:99, intimidate:99, mimicry:99, devotion:99 };
    const m = ST.relationshipStatMult({ build: freshBuild('Hardy'), bonds: maxed });
    for (const k of ['hp','atk','def','spa','spd','spe']) assert.equal(m[k], 1.05, `${k} should be 1.05`);
});

test('bondThreshold: FLAT 5 reps for every path — Nature no longer shifts it', () => {
    // Temperament multipliers are all 1.0, so even a stat-shifting Nature masters at 5.
    const slot = { build: freshBuild('Adamant') }; // +atk,-spa — was loved/resisted, now flat
    assert.equal(ST.bondThreshold('praise', slot), 5);     // atk raised → still 5
    assert.equal(ST.bondThreshold('nurture', slot), 5);    // spa lowered → still 5
    assert.equal(ST.bondThreshold('discipline', slot), 5); // def untouched
    assert.equal(ST.bondThreshold('devotion', slot), 5);   // hp always neutral
});

test('bondThreshold: neutral nature → all paths 5', () => {
    const slot = { build: freshBuild('Hardy') };
    for (const p of ['praise','nurture','discipline','intimidate','mimicry','devotion'])
        assert.equal(ST.bondThreshold(p, slot), 5, `${p} threshold`);
});

test('DORMANT GUARD: buildPokemon with an all-1.0 relationship mult == without it', () => {
    const build = freshBuild('Adamant');
    const base = ST.buildPokemon('Pikachu', build);
    const dormant = ST.buildPokemon('Pikachu', Object.assign({}, build, {
        _relationshipStatMult: { hp:1, atk:1, def:1, spa:1, spd:1, spe:1 },
    }));
    assert.equal(dormant.maxHp, base.maxHp, 'maxHp byte-identical');
    for (const k of ['atk','def','spa','spd','spe'])
        assert.equal(dormant.stats[k], base.stats[k], `${k} byte-identical`);
});

test('buildPokemon applies a live per-stat relationship mult (atk +5%)', () => {
    const build = freshBuild('Hardy');
    const base = ST.buildPokemon('Pikachu', build);
    const buffed = ST.buildPokemon('Pikachu', Object.assign({}, build, {
        _relationshipStatMult: { hp:1, atk:1.05, def:1, spa:1, spd:1, spe:1 },
    }));
    assert.equal(buffed.stats.atk, Math.floor(base.stats.atk * 1.05));
    assert.equal(buffed.stats.def, base.stats.def, 'def untouched');
    assert.equal(buffed.maxHp, base.maxHp, 'hp untouched (mult 1)');
});

test('migrateStoryPreV25: adds default bonds to party mons, skips eggs, sets camp fields', () => {
    const sm = W.StoryMode.state;
    sm.team = [{ name: 'Pikachu', build: freshBuild() }, { isEgg: true, build: {} }];
    sm.pcBox = [{ name: 'Bulbasaur', build: freshBuild() }];
    delete sm.team[0].bonds; delete sm.pcBox[0].bonds;
    delete sm.campByEventIdx; delete sm.campReturnPoint;

    ST.migrateStoryPreV25();

    // Spread normalizes jsdom-realm objects (built inside migrateStoryPreV25) for deepEqual.
    assert.deepEqual({ ...sm.team[0].bonds }, { praise:0, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0 });
    assert.equal(sm.team[1].bonds, undefined, 'egg gets no bonds');
    assert.deepEqual({ ...sm.pcBox[0].bonds }, { praise:0, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0 });
    assert.deepEqual({ ...sm.campByEventIdx }, {});
    assert.equal(sm.campReturnPoint, null);
});

test('migrateStoryPreV25: idempotent — does not clobber existing progress', () => {
    const sm = W.StoryMode.state;
    sm.team = [{ name: 'Pikachu', build: freshBuild(), bonds: { praise: 5, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0 } }];
    sm.pcBox = [];
    sm.campByEventIdx = { '3': { done: true } };
    sm.campReturnPoint = { eventIndex: 3 };

    ST.migrateStoryPreV25();

    assert.equal(sm.team[0].bonds.praise, 5, 'existing bond preserved');
    assert.deepEqual(sm.campByEventIdx, { '3': { done: true } }, 'existing camp gate preserved');
    assert.deepEqual(sm.campReturnPoint, { eventIndex: 3 }, 'existing return point preserved');
});
