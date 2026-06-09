// Catch tutorial fire-once — the party-FULL landing path must also stamp the flag.
//
// sm.catchTutorialDone gates the scripted catch tutorial ("Catching 101") so it
// fires exactly once per save. A successful catch lands in one of two places:
//   1. direct push  → _catchHandleSuccess (party has room) — marks the flag.
//   2. PC / swap     → _finalizeCatchPending (party full) — must ALSO mark it.
// Path (2) previously did NOT mark, so a tutorial catch resolved into a full
// party would leave the flag false and the tutorial would re-fire. These lock
// both placement paths stamping catchTutorialDone for a tutorialMode catch.
//
// Run: node --test tests/suites/story-catch-tutorial-fire-once.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window } = h;
const T = window.__storyTest;
const SM = window.StoryMode;

const mk = (name, i) => ({
    name, id: 'tut-' + i, nickname: null, isEgg: false, starter: false, unsellable: false,
    build: { m: ['Tackle'], n: 'Hardy', ivs: { hp:31,atk:31,def:31,spa:31,spd:31,spe:31 }, evs: {}, _isShiny: false },
});

// Stand up a tutorialMode catch screen with a FULL party (cap 2 at 0 badges) and
// an empty PC, so a guaranteed catch (forcedCatchRate 1.0) routes through the
// party-full swap prompt rather than the direct push.
function primeFullPartyTutorialCatch() {
    T.sm = Object.assign({}, T.sm, {
        active: true,
        badges: 0,                              // party cap = 2
        team: [mk('Bulbasaur', 0), mk('Charmander', 1)], // full
        pcBox: [],                              // PC has room → swap prompt, not "both full"
        balls: { poke: 5, great: 0, ultra: 0, master: 0 },
        catchTutorialDone: false,
        pokedex: { seen: [], caught: [] },
    });
    T.catchState = {
        encounter: { name: 'Pikachu', build: {} },
        onComplete: null, message: null, ended: false,
        bossMode: false, safariMode: false, tutorialMode: true,
        forcedCatchRate: 1.0, forcedFleeRate: 0, roamingLabel: null,
        bossHp: null, bossMaxHp: null,
    };
    T.catchRender(); // builds #story-catch-body so the swap prompt can mount
}

test('tutorial catch sent to PC (party full) stamps catchTutorialDone', async () => {
    primeFullPartyTutorialCatch();
    await SM.catchThrow('poke');                 // guaranteed catch → party full → swap prompt
    assert.equal(T.sm.catchTutorialDone, false, 'flag not stamped until the catch is actually placed');
    SM.catchResolveSendToPC();                   // "Send to PC"
    assert.equal(T.sm.catchTutorialDone, true, 'PC-landing path must mark the tutorial done');
    assert.ok((T.sm.pcBox || []).some(m => m && m.name === 'Pikachu'), 'caught mon is in the PC');
});

test('tutorial catch swapped into the party (party full) stamps catchTutorialDone', async () => {
    primeFullPartyTutorialCatch();
    await SM.catchThrow('poke');                 // guaranteed catch → party full → swap prompt
    SM.catchResolveSwap(0);                       // swap into slot 0; displaced mon → PC
    assert.equal(T.sm.catchTutorialDone, true, 'swap-into-party path must mark the tutorial done');
    assert.equal(T.sm.team[0] && T.sm.team[0].name, 'Pikachu', 'newcomer took the bench slot');
    assert.ok((T.sm.pcBox || []).some(m => m && m.name === 'Bulbasaur'), 'displaced teammate went to the PC');
});

test('a NON-tutorial party-full catch does not touch catchTutorialDone', async () => {
    primeFullPartyTutorialCatch();
    T.catchState.tutorialMode = false;           // ordinary wild, not the lesson
    T.sm.catchTutorialDone = false;
    await SM.catchThrow('poke');
    SM.catchResolveSendToPC();
    assert.equal(T.sm.catchTutorialDone, false, 'only a tutorialMode catch may stamp the flag');
});
