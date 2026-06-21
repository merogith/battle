// Hidden Power mentor + Move Tutor integration (2026-06). The Diviner (a one-time
// road scene on the approach to City 1) sets sm.hiddenPowerUnlocked and grants a
// one-time sm.hiddenPowerChoosePending token. Once unlocked, the Move Tutor can
// teach bare "Hidden Power" to ANY Pokémon; on teach it projects to that mon's
// hpType (chosen via a picker on the first lesson, assigned/random thereafter).
//
// These tests lock in: (1) the mentor scene exists and its onContinue flips the
// flags; (2) the staged tutor pool includes "Hidden Power" only when unlocked, and
// it is teachable (in the acceptance set) at City-1 stage; (3) "Hidden Power" is
// priced at the pinned accessible tier, not Awakened; (4) the teach helpers project
// a taught Hidden Power onto the mon's typed variant and consume the choose token.
// Run: node --test tests/suites/hidden-power-mentor.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const eng = E.window.__hpTest; // inner-scope test surface for HP mentor/tutor internals

test('the Diviner mentor scene exists and unlocks Hidden Power on continue', () => {
    const scenes = eng.STORY_TUTORIAL_SCENES;
    assert.ok(scenes && scenes.hiddenPowerMentor, 'hiddenPowerMentor scene defined');
    const sc = scenes.hiddenPowerMentor;
    assert.equal(sc.metaKey, 'tutorial-hidden-power-mentor', 'has its dedupe metaKey');
    assert.ok(Array.isArray(sc.lines) && sc.lines.length >= 1, 'has dialogue');
    eng.sm.hiddenPowerUnlocked = false;
    eng.sm.hiddenPowerChoosePending = false;
    sc.onContinue();
    assert.equal(eng.sm.hiddenPowerUnlocked, true, 'unlock flag set');
    assert.equal(eng.sm.hiddenPowerChoosePending, true, 'one-time choose token granted');
});

test('"Hidden Power" is priced at the accessible (natural) tier, not Awakened', () => {
    assert.equal(eng._moveTagForSpecies('Pikachu', 'Hidden Power'), 'natural', 'bare HP tagged natural');
    assert.equal(eng._moveTagForSpecies('Pikachu', 'Hidden Power Fire'), 'natural', 'typed HP tagged natural');
    assert.equal(eng._moveCostForStage('natural'), 1000, 'natural tier costs 1000G');
});

test('the mentor unlock adds Hidden Power to ANY species\' tutor pool', async () => {
    // Magikarp has no natural Hidden Power, so the unlock gate is what surfaces it —
    // demonstrating the "teachable to every Pokémon once unlocked" guarantee.
    eng.sm.hiddenPowerUnlocked = false;
    const locked = await eng._tutorGetStagedMovePoolAsync('Magikarp', ['Splash']);
    assert.ok(!locked.includes('Hidden Power'), 'absent while locked');

    eng.sm.hiddenPowerUnlocked = true;
    const unlocked = await eng._tutorGetStagedMovePoolAsync('Magikarp', ['Splash']);
    assert.ok(unlocked.includes('Hidden Power'), 'present (and teachable) once unlocked');
    assert.ok((unlocked.fullPool || unlocked).includes('Hidden Power'), 'in the full pool view');
});

test('teaching Hidden Power projects to the mon\'s hpType and consumes the token', () => {
    const mon = { name: 'Snorlax', build: { m: ['Body Slam', 'Rest'], n: 'Careful', hpType: 'Fire',
        evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 }, ivs: { hp:31,atk:31,def:31,spa:31,spd:31,spe:31 } } };
    eng.sm.hiddenPowerChoosePending = false;
    mon.build.m.push('Hidden Power');
    eng.resolveHiddenPowerForBuild(mon.build, mon.name);
    assert.ok(mon.build.m.includes('Hidden Power Fire'), 'bare HP projected to the mon\'s type');
    assert.ok(!mon.build.m.includes('Hidden Power'), 'no bare Hidden Power left in the loadout');

    const mon2 = { name: 'Gengar', build: { m: ['Shadow Ball'], n: 'Timid' } };
    eng.sm.hiddenPowerChoosePending = true;
    eng._hpTutorApply(mon2, 'Hidden Power', 'Ice');
    assert.equal(mon2.build.hpType, 'Ice', 'chosen type applied');
    assert.equal(eng.sm.hiddenPowerChoosePending, false, 'token consumed on a successful teach');
});
