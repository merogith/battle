// Deterministic coverage for the PC-box display view (sort / filter / search).
// This is the regression net for the Pokémon Center "Storage tab" grid refactor:
// _pcBoxView is PURE and display-only — it must never mutate the input box, and
// the actions (deposit/withdraw/release/sell) resolve mons by stable `id`, so the
// on-screen order is free to change without touching sm.pcBox.
//
// Run: node --test tests/suites/story-pc-box-view.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const view = W.StoryMode.pcBoxView;

// Slots only need { name, id, build:{_isShiny}, nickname?, isEgg? } for the view.
const mk = (name, opts = {}) => ({
    name,
    id: 'm_' + name.toLowerCase(),
    nickname: opts.nick || null,
    isEgg: !!opts.egg,
    build: { _isShiny: !!opts.shiny },
});

// Dex numbers: Bulbasaur 1, Charizard 6, Pikachu 25, Gengar 94 (Ghost/Poison),
// Dragonite 149, Mewtwo 150. Insertion order below is deliberately scrambled.
const BOX = [
    mk('Pikachu', { nick: 'Sparky' }),
    mk('Mewtwo', { shiny: true }),
    mk('Bulbasaur'),
    mk('Gengar'),
    mk('Charizard', { shiny: true }),
    mk('Dragonite'),
];
const names = (arr) => arr.map(s => s.name);

test('pcBoxView export exists', () => {
    assert.equal(typeof view, 'function', 'StoryMode.pcBoxView must be exported for the toolbar + tests');
});

test('default (caught) keeps insertion order', () => {
    assert.deepEqual(names(view(BOX, {})), names(BOX));
    assert.deepEqual(names(view(BOX, { sort: 'caught' })), names(BOX));
});

test('is pure — does not mutate the input box', () => {
    const before = names(BOX);
    view(BOX, { sort: 'dex' });
    view(BOX, { sort: 'name', shiny: true, search: 'a' });
    assert.deepEqual(names(BOX), before, 'sm.pcBox order must be preserved (display-only)');
});

test('sort by dex number ascending', () => {
    assert.deepEqual(
        names(view(BOX, { sort: 'dex' })),
        ['Bulbasaur', 'Charizard', 'Pikachu', 'Gengar', 'Dragonite', 'Mewtwo']
    );
});

test('sort by name uses nickname when present, alphabetical', () => {
    // "Sparky" (Pikachu) sorts under S, not P.
    const out = names(view(BOX, { sort: 'name' }));
    assert.ok(out.indexOf('Bulbasaur') < out.indexOf('Charizard'));
    assert.equal(out[out.length - 1], 'Pikachu', 'nickname "Sparky" should sort last');
});

test('filter: shiny only', () => {
    assert.deepEqual(names(view(BOX, { shiny: true })), ['Mewtwo', 'Charizard']);
});

test('filter: by type (Ghost → only Gengar)', () => {
    assert.deepEqual(names(view(BOX, { type: 'Ghost' })), ['Gengar']);
});

test('search: substring match on name (case-insensitive)', () => {
    assert.deepEqual(names(view(BOX, { search: 'char' })), ['Charizard']);
    assert.deepEqual(names(view(BOX, { search: 'spark' })), ['Pikachu'], 'matches nickname too');
});

test('combined filter + sort is stable', () => {
    // shiny + dex sort → Charizard(6) before Mewtwo(150)
    assert.deepEqual(names(view(BOX, { shiny: true, sort: 'dex' })), ['Charizard', 'Mewtwo']);
});

test('eggs are excluded by type filter but kept otherwise', () => {
    const withEgg = [...BOX, mk('Egg', { egg: true })];
    assert.ok(!names(view(withEgg, { type: 'Ghost' })).includes('Egg'));
    assert.equal(view(withEgg, {}).length, withEgg.length, 'no filter keeps the egg');
});
