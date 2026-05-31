// EXP-Share gift (extra-arc raid reward — revives ISSUE-243).
// Run: node --test tests/suites/story-exp-share-gift-v22.test.js
//
// The gift is a bounded "level-up": 6 distributable units, max 3 per mon,
// spendable on any party/PC Pokémon. It is a REAL level-up — the gifted mon's
// level climbs 50 → 53 and buildPokemon recomputes it at that real level via
// the canonical Pokémon stat formula, so stats grow base-proportionally (no
// separate bonus layer; non-gifted mons stay byte-for-byte at Lv50). Wallet
// lives in sm.inventory.expShareVoucher; per-mon count in build.expShareLevels.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

const freshBuild = () => ({
    n: 'Hardy',
    ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
    evs: {},
});

test('flagship raid grants 6 EXP-Share units to the wallet', () => {
    ST.sm = Object.assign({}, ST.sm, { inventory: {}, _trackRewardGranted: {} });
    const r = ST.grantTrackEndReward({ sceneKey: 'extra.cubone.raid' });
    assert.equal(r.kind, 'expShareGift');
    assert.equal(r.units, 6);
    assert.equal(ST.sm.inventory.expShareVoucher | 0, 6);
});

test('applying one unit raises the mon a level, spends a unit, and lifts stats', () => {
    const build = freshBuild();
    ST.sm = Object.assign({}, ST.sm, {
        team: [{ name: 'Pikachu', build }],
        pcBox: [],
        inventory: { expShareVoucher: 6 },
        _trackRewardGranted: {},
    });
    const before = ST.buildPokemon('Pikachu', ST.sm.team[0].build);
    W.StoryMode.applyExpShareLevel('team', 0);
    const after = ST.buildPokemon('Pikachu', ST.sm.team[0].build);

    assert.equal(ST.sm.team[0].build.expShareLevels, 1, 'per-mon level count');
    assert.equal(ST.sm.inventory.expShareVoucher, 5, 'one unit spent');
    assert.equal(ST.monDisplayLevel(ST.sm.team[0].build), 51, 'displayed level 50 → 51');
    // Stats rise via the real-level recompute in buildPokemon — NOT a bonus layer.
    assert.ok(after.maxHp > before.maxHp, `maxHp should rise (${before.maxHp} → ${after.maxHp})`);
    assert.ok(after.stats.atk > before.stats.atk, `atk should rise (${before.stats.atk} → ${after.stats.atk})`);
    // The gift must NOT write the Fight Club build.bonus layer (no double-dip).
    assert.ok(!ST.sm.team[0].build.bonus || (ST.sm.team[0].build.bonus.atk | 0) === 0, 'build.bonus untouched');
});

test('caps at +3 levels per mon; the 4th application is refused and spends nothing', () => {
    const build = freshBuild();
    ST.sm = Object.assign({}, ST.sm, {
        team: [{ name: 'Charizard', build }],
        pcBox: [],
        inventory: { expShareVoucher: 6 },
        _trackRewardGranted: {},
    });
    let prevHp = ST.buildPokemon('Charizard', ST.sm.team[0].build).maxHp;
    for (let i = 1; i <= 3; i++) {
        W.StoryMode.applyExpShareLevel('team', 0);
        const hp = ST.buildPokemon('Charizard', ST.sm.team[0].build).maxHp;
        assert.equal(ST.sm.team[0].build.expShareLevels, i, `level ${i}`);
        assert.ok(hp >= prevHp, 'stats monotonically rise per level');
        prevHp = hp;
    }
    assert.equal(ST.monDisplayLevel(ST.sm.team[0].build), 53, 'capped display level');
    assert.equal(ST.sm.inventory.expShareVoucher, 3, '3 units spent');
    const cappedHp = ST.buildPokemon('Charizard', ST.sm.team[0].build).maxHp;
    // 4th application — refused, stats unchanged.
    W.StoryMode.applyExpShareLevel('team', 0);
    assert.equal(ST.sm.team[0].build.expShareLevels, 3, 'still capped at 3');
    assert.equal(ST.sm.inventory.expShareVoucher, 3, 'no unit spent past cap');
    assert.equal(ST.buildPokemon('Charizard', ST.sm.team[0].build).maxHp, cappedHp, 'stats frozen at the cap');
});

test('units can be spent on a PC-boxed mon', () => {
    const build = freshBuild();
    ST.sm = Object.assign({}, ST.sm, {
        team: [],
        pcBox: [{ name: 'Eevee', build }],
        inventory: { expShareVoucher: 6 },
        _trackRewardGranted: {},
    });
    W.StoryMode.applyExpShareLevel('pc', 0);
    assert.equal(ST.sm.pcBox[0].build.expShareLevels, 1);
    assert.equal(ST.sm.inventory.expShareVoucher, 5);
});

test('an empty wallet applies nothing', () => {
    const build = freshBuild();
    ST.sm = Object.assign({}, ST.sm, {
        team: [{ name: 'Snorlax', build }],
        pcBox: [],
        inventory: { expShareVoucher: 0 },
        _trackRewardGranted: {},
    });
    W.StoryMode.applyExpShareLevel('team', 0);
    assert.equal(ST.sm.team[0].build.expShareLevels | 0, 0, 'no level applied on empty wallet');
    assert.equal(ST.sm.inventory.expShareVoucher | 0, 0);
});

test('EXP-Share state survives a JSON save round-trip', () => {
    const build = freshBuild();
    ST.sm = Object.assign({}, ST.sm, {
        team: [{ name: 'Pikachu', build }],
        pcBox: [],
        inventory: { expShareVoucher: 6 },
        _trackRewardGranted: {},
    });
    W.StoryMode.applyExpShareLevel('team', 0);
    W.StoryMode.applyExpShareLevel('team', 0);
    const round = JSON.parse(JSON.stringify(ST.sm));
    assert.equal(round.inventory.expShareVoucher, 4, 'wallet persisted');
    assert.equal(round.team[0].build.expShareLevels, 2, 'per-mon levels persisted');
    // Rebuilding from the round-tripped save reproduces the leveled stats.
    const rebuilt = ST.buildPokemon('Pikachu', round.team[0].build);
    const baseline = ST.buildPokemon('Pikachu', freshBuild());
    assert.ok(rebuilt.maxHp > baseline.maxHp, 'leveled stats survive the round-trip');
});

test('a mon with no EXP-Share levels still reads as Lv50', () => {
    assert.equal(ST.monDisplayLevel(freshBuild()), 50);
    assert.equal(ST.monDisplayLevel({}), 50);
    assert.equal(ST.monDisplayLevel(null), 50);
});
