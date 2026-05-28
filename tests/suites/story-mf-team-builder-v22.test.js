// PR-7b: Mystery Figure team-builder pivot to player-party mirror + starter
// duplicate per locked decision 16. Verifies The First fields the player's
// own roster back at them.
// Run: node --test tests/suites/story-mf-team-builder-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const roll = ST.rollMysteryFigure;

test('MF team mirrors the player party (5 slots) + duplicates the starter (slot 6)', () => {
    const playerNames = ['Charizard', 'Blastoise', 'Venusaur', 'Pikachu', 'Snorlax'];
    ST.sm = Object.assign({}, ST.sm, {
        team: playerNames.map(name => ({ name, build: { m: ['Tackle'] } })),
        active: true,
        settings: { enabledGens: [1,2,3,4,5,6,7,8,9] },
    });
    const team = roll(6);
    assert.equal(team.length, 6);
    // First 5 slots == player team verbatim.
    for (let i = 0; i < 5; i++) {
        assert.equal(team[i].name, playerNames[i], `slot ${i} should mirror player`);
    }
    // Slot 6 == duplicate of player's starter (sm.team[0]).
    assert.equal(team[5].name, playerNames[0], 'slot 6 should duplicate the starter');
});

test('MF team handles a partial player team (< partySize-1)', () => {
    ST.sm = Object.assign({}, ST.sm, {
        team: [{ name: 'Mewtwo', build: { m: ['Tackle'] } }],
        active: true,
        settings: { enabledGens: [1] },
    });
    const team = roll(6);
    assert.equal(team.length, 6);
    // All slots should be Mewtwo (the lone lead, used as starter + padding).
    for (const slot of team) {
        assert.equal(slot.name, 'Mewtwo');
    }
});

test('MF team falls back to a random grade-1 roll when player team is empty', () => {
    ST.sm = Object.assign({}, ST.sm, {
        team: [],
        active: true,
        settings: { enabledGens: [1,2,3,4,5,6,7,8,9] },
    });
    const team = roll(6);
    assert.equal(team.length, 6);
    // All entries should have valid names + builds.
    for (const slot of team) {
        assert.ok(slot && slot.name && typeof slot.name === 'string');
        assert.ok(slot.build);
    }
});

test('MF team respects partySize parameter (3, 4, 6)', () => {
    ST.sm = Object.assign({}, ST.sm, {
        team: [{ name: 'Gengar', build: { m: ['Shadow Ball'] } },
               { name: 'Lapras', build: { m: ['Surf'] } }],
        active: true,
        settings: { enabledGens: [1,2,3,4,5,6,7,8,9] },
    });
    assert.equal(roll(3).length, 3);
    assert.equal(roll(4).length, 4);
    assert.equal(roll(6).length, 6);
});

test('MF team forceCanon — player gen-disabled starter still appears', () => {
    // Player has a Gen-9 starter but only Gen 1 is toggled on. The mirror
    // logic should still field the Gen 9 mon (canon override). The legacy
    // random fallback would have respected the gen toggle.
    ST.sm = Object.assign({}, ST.sm, {
        team: [{ name: 'Quaquaval', build: { m: ['Tackle'] } }],
        active: true,
        settings: { enabledGens: [1] },
    });
    const team = roll(6);
    // Should still field Quaquaval — the canon player team overrides gens.
    assert.equal(team[0].name, 'Quaquaval');
});
