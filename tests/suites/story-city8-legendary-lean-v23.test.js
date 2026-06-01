// City-8 legendary gate (ISSUE-036): the "required" pre-Victory-Road legendary
// used to fire only for a FULL party (_profLegendaryMysteryMode = _profMystery-
// Mode && gate). A deliberately lean party got a plain 3-roll Professor gift and
// could reach Victory Road with no legendary despite the gate's "Required" copy.
// Fix decouples the legendary mode from party fullness — a lean party is offered
// the legendary into an open slot (normal accept path); a full party keeps the
// swap-to-PC flow.
//
// Run: node --test tests/suites/story-city8-legendary-lean-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window } = h;
const SM = window.StoryMode;
const T = window.__storyTest;
const sm = SM.state;
const RAW = window.STORY_EVENTS_RAW;

function cityRowIdx(name) {
    for (let i = 0; i < RAW.length; i++) {
        if (RAW[i] && RAW[i][1] === 'City' && String(RAW[i][2]) === name) return i;
    }
    return -1;
}
function team(n) {
    const names = ['Pikachu', 'Eevee', 'Bulbasaur', 'Charmander', 'Squirtle', 'Pidgey'];
    return Array.from({ length: n }, (_, i) => ({
        name: names[i], level: 50, hp: 100, maxHp: 100, moves: [], types: ['Normal'],
    }));
}
function setup(city, badges, teamSize) {
    sm.eventIndex = cityRowIdx(city);
    sm.badges = badges;
    sm.team = team(teamSize);
    if (!sm.settings) sm.settings = {};
    sm.settings.enabledGens = [1, 2, 3, 4];
    sm.profUsed = {};
}
// The legendary-mode flag is decided early in enterProfessor (before the heavy
// swap-UI render), so reading it is valid even if a later render step trips on
// the minimal stub mons.
function legendaryModeAfterEnter(city, badges, teamSize) {
    setup(city, badges, teamSize);
    try { SM.enterProfessor(); } catch (e) { /* flag is already set pre-render */ }
    return T.profLegendaryMysteryMode();
}

test('gate predicate depends only on cityIdx + badges, never party size', () => {
    sm.badges = 8;
    assert.equal(T.preLeagueLegendaryGate(8), true);
    assert.equal(T.preLeagueLegendaryGate(7), false);
    sm.badges = 7;
    assert.equal(T.preLeagueLegendaryGate(8), false);
});

test('LEAN party at City-8 post-Gym-8 now enters legendary mode (the fix)', () => {
    assert.equal(legendaryModeAfterEnter('City8', 8, 3), true,
        'a sub-cap party is offered the required legendary, not a plain gift');
});

test('FULL party at City-8 still enters legendary mode (swap path unchanged)', () => {
    assert.equal(legendaryModeAfterEnter('City8', 8, 6), true);
});

test('City-8 before Gym-8 (under 8 badges) does NOT enter legendary mode', () => {
    assert.equal(legendaryModeAfterEnter('City8', 7, 3), false);
});

test('a non-gate city never enters legendary mode', () => {
    assert.equal(legendaryModeAfterEnter('City2', 8, 3), false);
});
