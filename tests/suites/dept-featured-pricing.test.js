// Department-store featured-item pricing (2026-06): both the Mega and Ultra
// tiers cost exactly 2x their base item's price (previously Mega was 5x and
// Ultra was 3x). Example the maintainer gave: X Attack (1000G) → Ultra X Attack
// and Mega X Attack both 2000G. This locks the multiplier so a future edit to
// getStoryFeaturedItems can't silently drift it.
// Run: node --test tests/suites/dept-featured-pricing.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
await W.__testReady;

const ST = W.__storyTest;
const baseById = new Map(
    [...(W.POKEMART_ITEMS || []), ...(W.DEPT_ITEMS || [])].map(i => [i.id, i])
);

function featured() {
    assert.ok(ST && typeof ST.getStoryFeaturedItems === 'function',
        '__storyTest.getStoryFeaturedItems must be exposed by the harness');
    return ST.getStoryFeaturedItems();
}

test('every Mega/Ultra featured item is exactly 2x its base price', () => {
    const items = featured();
    assert.ok(items.length > 0, 'expected a non-empty featured catalog');
    for (const f of items) {
        const base = baseById.get(f.baseItemId);
        assert.ok(base, `base item ${f.baseItemId} should exist in the catalog`);
        assert.equal(f.price, base.price * 2,
            `${f.id} (${f.tier}) should be 2x base ${base.price}, got ${f.price}`);
    }
});

test('Mega and Ultra of the same base item are priced identically', () => {
    const items = featured();
    const byBase = new Map();
    for (const f of items) {
        (byBase.get(f.baseItemId) || byBase.set(f.baseItemId, []).get(f.baseItemId)).push(f);
    }
    for (const [baseId, group] of byBase) {
        if (group.length < 2) continue; // only bases that have both tiers
        const prices = new Set(group.map(f => f.price));
        assert.equal(prices.size, 1,
            `tiers for ${baseId} should share one price, saw ${[...prices].join(',')}`);
    }
});

test("maintainer example: X Attack 1000G -> Mega/Ultra X Attack 2000G", () => {
    const items = featured();
    assert.equal(baseById.get('xAttack')?.price, 1000, 'X Attack base price should be 1000G');
    const ultraX = items.find(f => f.id === 'ultra_xAttack');
    const megaX = items.find(f => f.id === 'mega_xAttack');
    assert.ok(ultraX, 'ultra_xAttack should be offered');
    assert.ok(megaX, 'mega_xAttack should be offered');
    assert.equal(ultraX.price, 2000, 'Ultra X Attack should cost 2000G');
    assert.equal(megaX.price, 2000, 'Mega X Attack should cost 2000G');
});
