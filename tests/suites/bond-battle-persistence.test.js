// Camp bonds (and every other SLOT-level field) PERSIST through a battle.
//
// A Pokémon's camp relationship counters (slot.bonds — the six Praise / Nurture /
// Discipline / Intimidate / Mimicry / Devotion meters) belong to the INDIVIDUAL,
// not to a single battle. So does its nickname, its starter / unsellable flags, its
// caughtAt, and its stable slot id. After a story fight, `afterBattleReturn()`
// rebuilds sm.team from the battle's `state.playerParty` so HP/PP/status carry over —
// but it must NOT reset any of those slot-level fields back to their fresh defaults
// (bonds → the 1/5 floor, nickname/starter → dropped).
//
// Regression guard for the reported bug "bonds reset, sometimes": the old rebuild
// constructed bare { name, build, id } slots, so EVERY battle wiped a fully-bonded
// partner. Bonds survived only until the next fight — hence "sometimes works,
// sometimes not". See battle.html _storyTeamSlotsFromBattle / afterBattleReturn.
//
// Run: node --test tests/suites/bond-battle-persistence.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const STORY = W.__story;        // makeBuild + sm getter/setter
const ST = W.__storyTest;       // campAwardBond / bondCount / campMasteredPaths
const ENG = W.__engine;         // state getter/setter (the module battle state)

const PATHS = ['praise', 'nurture', 'discipline', 'intimidate', 'mimicry', 'devotion'];

test('surfaces needed for the battle-bond guard are present', () => {
    assert.equal(typeof STORY.makeBuild, 'function', '__story.makeBuild');
    assert.equal(typeof ST.campAwardBond, 'function', '__storyTest.campAwardBond');
    assert.equal(typeof ST.bondCount, 'function', '__storyTest.bondCount');
    assert.equal(typeof W.StoryMode.afterBattleReturn, 'function', 'StoryMode.afterBattleReturn');
});

// Plant a fully-bonded, nicknamed, starter-flagged mon and return the slot.
function plantBondedMon(id, species, nickname) {
    const build = STORY.makeBuild(species);
    const slot = { id, name: species, build, nickname, starter: true, unsellable: true, caughtAt: 'Route 1' };
    for (const p of PATHS) for (let i = 0; i < 6; i++) ST.campAwardBond(slot, p);
    return slot;
}

// Simulate "a story battle just ended": point the module battle state's playerParty
// at battle mons whose `buildData` is the SAME reference as each slot's build (the
// engine invariant afterBattleReturn relies on), then run the return path.
function simulateBattleReturn(team) {
    ENG.state = {
        mode: 'story',
        playerParty: team
            .filter((s) => !s.isEgg)
            .map((s) => ({ name: s.name, _baseName: s.name, buildData: s.build, currentHp: 5, maxHp: 30 })),
    };
    STORY.sm._crucibleBattleJustEnded = false;
    // afterBattleReturn also pokes the DOM / processNextEvent after the sync; that's
    // outside the try around the team rebuild, so swallow any UI-side throw here.
    try { W.StoryMode.afterBattleReturn(); } catch (e) { /* UI nav not under test */ }
}

test('camp bonds + nickname + flags survive a story battle (single mon)', () => {
    const slot = plantBondedMon('m_bond_solo', 'Magnemite', 'Sparky');
    STORY.sm.team = [slot];
    STORY.sm.pcBox = [];

    const before = PATHS.map((p) => ST.bondCount(slot, p));

    simulateBattleReturn(STORY.sm.team);

    const after = STORY.sm.team[0];
    assert.ok(after, 'slot survived the rebuild');
    assert.equal(after.id, 'm_bond_solo', 'stable id kept');
    assert.ok(after.bonds && typeof after.bonds === 'object', 'bonds object not dropped');
    assert.deepEqual(PATHS.map((p) => ST.bondCount(after, p)), before, 'every bond count unchanged — no 1/5 reset');
    assert.equal(after.nickname, 'Sparky', 'nickname kept');
    assert.equal(after.starter, true, 'starter flag kept');
    assert.equal(after.unsellable, true, 'unsellable flag kept');
    assert.equal(after.caughtAt, 'Route 1', 'caughtAt kept');
});

test('two same-species mons keep their OWN bonds across a battle (build-identity match)', () => {
    // Build-identity matching (buildData === slot.build) must disambiguate duplicates,
    // so the lightly-bonded twin does not inherit the heavily-bonded twin's counters.
    const a = { id: 'm_twin_a', name: 'Voltorb', build: STORY.makeBuild('Voltorb') };
    const b = { id: 'm_twin_b', name: 'Voltorb', build: STORY.makeBuild('Voltorb') };
    for (let i = 0; i < 6; i++) ST.campAwardBond(a, 'praise'); // a: heavily bonded
    ST.campAwardBond(b, 'praise');                            // b: barely bonded
    STORY.sm.team = [a, b];
    STORY.sm.pcBox = [];

    const aBefore = ST.bondCount(a, 'praise');
    const bBefore = ST.bondCount(b, 'praise');
    assert.notEqual(aBefore, bBefore, 'twins start with distinct bond counts');

    simulateBattleReturn(STORY.sm.team);

    const aAfter = STORY.sm.team.find((s) => s.id === 'm_twin_a');
    const bAfter = STORY.sm.team.find((s) => s.id === 'm_twin_b');
    assert.ok(aAfter && bAfter, 'both twins survived with their ids');
    assert.equal(ST.bondCount(aAfter, 'praise'), aBefore, 'twin A keeps its higher bond');
    assert.equal(ST.bondCount(bAfter, 'praise'), bBefore, 'twin B keeps its lower bond');
});

test('an egg in the party is preserved alongside the battling mon', () => {
    const slot = plantBondedMon('m_bond_egg', 'Magnemite', 'Sparky');
    const egg = { id: 'm_egg', name: 'Egg', isEgg: true, build: STORY.makeBuild('Magnemite') };
    STORY.sm.team = [slot, egg];
    STORY.sm.pcBox = [];

    const before = PATHS.map((p) => ST.bondCount(slot, p));

    simulateBattleReturn(STORY.sm.team);

    const ids = STORY.sm.team.map((s) => s.id);
    assert.ok(ids.includes('m_bond_egg'), 'battling mon kept');
    assert.ok(ids.includes('m_egg'), 'egg kept across the rebuild');
    const battledSlot = STORY.sm.team.find((s) => s.id === 'm_bond_egg');
    assert.deepEqual(
        PATHS.map((p) => ST.bondCount(battledSlot, p)),
        before,
        'battling mon kept its bonds with the egg present',
    );
});
