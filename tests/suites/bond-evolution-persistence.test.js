// Camp bonds PERSIST through evolution. A Pokémon's camp relationship counters
// (slot.bonds — the six "Praise/Nurture/Discipline/Intimidate/Mimicry/Devotion"
// meters) belong to the individual, not the species: evolving Magnemite -> Magneton
// is the same partner in a new form, so its earned bonds (and any mastered paths)
// must carry over unchanged. They must NOT reset to the 1/5 fresh-relationship floor.
//
// Regression guard for the reported bug "bond is lost when a Pokémon evolves".
// _evoLabApplyEvolution rebuilds the team/PC slot around the new species; this locks
// in that the camp bonds ride through that rebuild for BOTH a team mon and a PC mon,
// and that they survive a save() / load() round-trip afterwards.
//
// See battle.html _evoLabApplyEvolution and the camp system (RELATIONSHIP_PATHS).
// Run: node --test tests/suites/bond-evolution-persistence.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const STORY = W.__story;        // applyEvolution / makeBuild / sm getter+setter
const ST = W.__storyTest;       // campAwardBond / campMasteredPaths / bondCount / defaultBonds

test('test surfaces needed for the evolution-bond guard are present', () => {
    assert.equal(typeof STORY.applyEvolution, 'function', '__story.applyEvolution');
    assert.equal(typeof STORY.makeBuild, 'function', '__story.makeBuild');
    assert.equal(typeof ST.campAwardBond, 'function', '__storyTest.campAwardBond');
    assert.equal(typeof ST.campMasteredPaths, 'function', '__storyTest.campMasteredPaths');
    assert.equal(typeof ST.bondCount, 'function', '__storyTest.bondCount');
});

// Plant a single mon with FULLY-bonded camp counters (every path mastered) and
// return the slot. Uses the real campAwardBond so the counts/keys match production.
function plantFullyBondedMon(id, species) {
    const slot = { id, name: species, build: STORY.makeBuild(species) };
    const paths = ['praise', 'nurture', 'discipline', 'intimidate', 'mimicry', 'devotion'];
    // Award enough wins on every path to clear the flat mastery threshold (5),
    // starting from the CAMP_BOND_START floor of 1. Six wins is comfortably over.
    for (const p of paths) for (let i = 0; i < 6; i++) ST.campAwardBond(slot, p);
    return { slot, paths };
}

test('camp bonds survive evolution for a TEAM mon (counts + mastery preserved)', async () => {
    const { slot, paths } = plantFullyBondedMon('m_team_evo', 'Magnemite');
    STORY.sm.team = [slot];
    STORY.sm.pcBox = [];

    const before = paths.map((p) => ST.bondCount(slot, p));
    // Spread coerces the jsdom-realm array campMasteredPaths returns into a node-realm
    // one, so deepStrictEqual compares by value rather than failing on cross-realm
    // prototype identity.
    const masteredBefore = [...ST.campMasteredPaths(slot)].sort();
    assert.deepEqual(masteredBefore, paths.slice().sort(), 'all six paths mastered pre-evolution');

    const ok = await STORY.applyEvolution('m_team_evo', 'Magneton');
    assert.equal(ok, true, 'evolution applied');

    const evolved = STORY.sm.team[0];
    assert.equal(evolved.name, 'Magneton', 'species advanced');
    assert.equal(evolved.id, 'm_team_evo', 'stable slot id kept');
    assert.ok(evolved.bonds && typeof evolved.bonds === 'object', 'bonds object carried, not dropped');

    const after = paths.map((p) => ST.bondCount(evolved, p));
    assert.deepEqual(after, before, 'every per-path bond count unchanged across evolution');
    assert.deepEqual(
        [...ST.campMasteredPaths(evolved)].sort(),
        masteredBefore,
        'mastered-path set unchanged — no reset to the 1/5 floor',
    );
});

test('camp bonds survive evolution for a PC-box mon', async () => {
    const { slot, paths } = plantFullyBondedMon('m_pc_evo', 'Magnemite');
    // Keep one fighter on the team (the box mon evolves in place via the PC path).
    STORY.sm.team = [{ id: 'm_keep', name: 'Pikachu', build: STORY.makeBuild('Pikachu') }];
    STORY.sm.pcBox = [slot];

    const before = paths.map((p) => ST.bondCount(slot, p));

    const ok = await STORY.applyEvolution('m_pc_evo', 'Magneton');
    assert.equal(ok, true, 'evolution applied to the PC slot');

    const evolved = STORY.sm.pcBox[0];
    assert.equal(evolved.name, 'Magneton', 'PC species advanced');
    const after = paths.map((p) => ST.bondCount(evolved, p));
    assert.deepEqual(after, before, 'PC bond counts unchanged across evolution');
});

test('preserved bonds survive a save() / load() round-trip after evolving', () => {
    // save() is a plain JSON.stringify(sm); confirm the carried bonds serialize and
    // re-read with their counts intact (no schema whitelist silently drops them).
    const { slot, paths } = plantFullyBondedMon('m_save_evo', 'Magnemite');
    // The slot is already on sm.team from the team test above only if it ran; set
    // it up freshly here so this case is order-independent.
    STORY.sm.team = [{ ...slot, name: 'Magneton' }]; // post-evolution shape
    const expected = paths.map((p) => ST.bondCount(STORY.sm.team[0], p));

    const json = JSON.stringify(STORY.sm);
    const reloaded = JSON.parse(json);
    const slotBack = reloaded.team[0];
    assert.ok(slotBack.bonds && typeof slotBack.bonds === 'object', 'bonds serialized into the save');
    const after = paths.map((p) => ST.bondCount(slotBack, p));
    assert.deepEqual(after, expected, 'bond counts identical after a save/load round-trip');
});
