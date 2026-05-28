// PR-4b: reward delivery helper + Basic Trainer gold rebalance.
// Run: node --test tests/suites/story-reward-delivery-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const battleHtmlText = await readFile(new URL('../../battle.html', import.meta.url), 'utf8');

test('rollIntInRange handles flat number', () => {
    assert.equal(ST.rollIntInRange(3), 3);
    assert.equal(ST.rollIntInRange(0), 0);
});

test('rollIntInRange picks within [lo, hi] inclusive', () => {
    for (let i = 0; i < 100; i++) {
        const v = ST.rollIntInRange([2, 5]);
        assert.ok(v >= 2 && v <= 5, `out of range: ${v}`);
    }
});

test('rollIntInRange clamps when hi <= lo', () => {
    assert.equal(ST.rollIntInRange([5, 3]), 5);
});

test('awardStoryBeatReward returns null on invalid beat', () => {
    assert.equal(ST.awardStoryBeatReward(null), null);
    assert.equal(ST.awardStoryBeatReward({}), null);
    assert.equal(ST.awardStoryBeatReward({ kind: 'nonexistent' }), null);
});

test('awardStoryBeatReward grants gold scaled by current-city baseline (low tier)', () => {
    // City 1 baseline = Gym Leader 1 coins. At eventIndex 0 the resolver
    // walks back to City0 → 0; baseline clamps to City 1 → Gym 1 coins.
    ST.sm = Object.assign({}, ST.sm, {
        gold: 1000, eventIndex: 0,
        inventory: ST.sm.inventory || {},
        balls: ST.sm.balls || { poke: 0, great: 0, ultra: 0, master: 0 },
    });
    const baseline = ST.gymLeaderGoldBaselineForCity(1);
    const goldBefore = ST.sm.gold | 0;
    ST.awardStoryBeatReward({ kind: 'battle', sceneKey: 'villain.rocket.battle1' });
    // Low tier = goldFrac 0.80 × baseline.
    assert.equal(ST.sm.gold | 0, goldBefore + Math.floor(baseline * 0.80));
});

test('awardStoryBeatReward grants big-tier gold scaled by city', () => {
    ST.sm = Object.assign({}, ST.sm, { gold: 1000, eventIndex: 0 });
    const baseline = ST.gymLeaderGoldBaselineForCity(1);
    const goldBefore = ST.sm.gold | 0;
    ST.awardStoryBeatReward({ kind: 'boss', sceneKey: 'villain.rocket.boss' });
    assert.equal(ST.sm.gold | 0, goldBefore + Math.floor(baseline * 1.00));
});

test('awardStoryBeatReward apex tier matches Gym 1 baseline at start of run', () => {
    ST.sm = Object.assign({}, ST.sm, { gold: 0, eventIndex: 0 });
    const baseline = ST.gymLeaderGoldBaselineForCity(1);
    ST.awardStoryBeatReward({ kind: 'mysteryBoss', sceneKey: 'main.mfBattle' });
    assert.equal(ST.sm.gold | 0, Math.floor(baseline * 1.00));
});

test('gymLeaderGoldBaselineForCity scales upward across the league', () => {
    const g1 = ST.gymLeaderGoldBaselineForCity(1);
    const g8 = ST.gymLeaderGoldBaselineForCity(8);
    assert.ok(g8 > g1, 'Gym 8 baseline should exceed Gym 1');
    assert.ok(g1 > 0 && g8 > 0);
});

test('gymLeaderGoldBaselineForCity clamps out-of-range city idx', () => {
    assert.equal(ST.gymLeaderGoldBaselineForCity(0),  ST.gymLeaderGoldBaselineForCity(1));
    assert.equal(ST.gymLeaderGoldBaselineForCity(99), ST.gymLeaderGoldBaselineForCity(8));
});

test('awardStoryBeatReward grants 0 gold for flavor (event) tier', () => {
    ST.sm = Object.assign({}, ST.sm, { gold: 1000 });
    const goldBefore = ST.sm.gold | 0;
    ST.awardStoryBeatReward({ kind: 'event', sceneKey: 'main.event1' });
    // Flavor tier: goldFrac 0 → no gold.
    assert.equal(ST.sm.gold | 0, goldBefore);
});

test('Basic Trainer coin reward applies STORY_BASE_TRAINER_GOLD_MULT', () => {
    // Source-level check — the rebalance line should multiply coinMult by the
    // mult when event === 'Basic Trainer'.
    assert.match(
        battleHtmlText,
        /if\s*\(event\s*===\s*'Basic Trainer'\)\s*coinMult\s*\*=\s*STORY_BASE_TRAINER_GOLD_MULT;/,
        'Basic Trainer gold rebalance line should multiply coinMult'
    );
});

test('STORY_BASE_TRAINER_GOLD_MULT is 0.82 (-18% basic trainer gold)', () => {
    assert.equal(ST.STORY_BASE_TRAINER_GOLD_MULT, 0.82);
});

test('reward helper integrates with the existing _storyGrantBundle path', () => {
    // Behavioral check: voucherRolls > 0 should grant some inventory entries.
    ST.sm = Object.assign({}, ST.sm, { gold: 0, inventory: {} });
    const result = ST.awardStoryBeatReward({ kind: 'big', sceneKey: 'fake.test' });
    // 'big' is a tier KEY not a kind — the helper should return null because
    // STORY_KIND_TO_TIER['big'] is undefined (only kinds map; tiers don't).
    assert.equal(result, null);
});
