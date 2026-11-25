// Hidden Power mentor + Move Tutor integration (2026-06). The Diviner (a one-time
// road scene on the approach to City 3) sets sm.hiddenPowerUnlocked and grants a
// one-time sm.hiddenPowerChoosePending token. Once unlocked, the Move Tutor can
// teach bare "Hidden Power" to ANY Pokémon; on teach it projects to that mon's
// hpType, either its natural element or the type chosen with the one-time favor.
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
    eng.sm.hpChooseGranted = false;
    sc.onContinue();
    assert.equal(eng.sm.hiddenPowerUnlocked, true, 'unlock flag set');
    assert.equal(eng.sm.hiddenPowerChoosePending, true, 'one-time choose token granted');
    eng.sm.hiddenPowerChoosePending = false;
    sc.onContinue();
    assert.equal(eng.sm.hiddenPowerChoosePending, false, 'seeing the Diviner again cannot reissue a spent favor');
});

test('"Hidden Power" is priced at a normal tutor tier, never the 5,000G Awakened default', async () => {
    // The tag is legitimately per-species (Pikachu learns it naturally → 1,000G;
    // Garchomp by TM → 2,500G). The only bug was the bare-HP fallthrough landing on
    // 'awakened' (5,000G + Guru-lock) for a species whose dex omits it; that is pinned
    // to at most 'learnt'. Warm the cache first, exactly as the tutor does.
    await eng._tutorGetStagedMovePoolAsync('Pikachu', []);
    const tag = eng._moveTagForSpecies('Pikachu', 'Hidden Power');
    assert.ok(tag === 'natural' || tag === 'learnt', `bare HP priced natural/learnt (got ${tag})`);
    assert.notEqual(tag, 'awakened', 'never the Awakened 5,000G default');
    assert.equal(eng._moveCostForStage('natural'), 1000, 'natural tier costs 1000G');
    assert.equal(eng._moveCostForStage('learnt'), 2500, 'learnt tier costs 2500G');
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
    // Collapsed to exactly ONE entry — no learnset/usage "Hidden Power <type>" variants.
    const hpVariants = [...unlocked].filter(m => /^Hidden Power/.test(m));
    assert.deepEqual(hpVariants, ['Hidden Power'], 'a single unified Hidden Power, no typed variants');
});

test('teaching Hidden Power projects to the mon\'s hpType and consumes the token', () => {
    const mon = { name: 'Snorlax', build: { m: ['Body Slam', 'Rest'], n: 'Careful', hpType: 'Fire',
        evs: { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 }, ivs: { hp:31,atk:31,def:31,spa:31,spd:31,spe:31 } } };
    eng.sm.hiddenPowerChoosePending = false;
    mon.build.m.push('Hidden Power');
    eng.resolveHiddenPowerForBuild(mon.build, mon.name);
    assert.ok(mon.build.m.includes('Hidden Power Fire'), 'bare HP projected to the mon\'s type');
    assert.ok(!mon.build.m.includes('Hidden Power'), 'no bare Hidden Power left in the loadout');

    const mon2 = { name: 'Gengar', build: { m: ['Shadow Ball', 'Hidden Power'], n: 'Timid' } };
    eng.sm.hiddenPowerChoosePending = true;
    eng._hpTutorApply(mon2, { type: 'Ice', spendFavor: true });
    assert.equal(mon2.build.hpType, 'Ice', 'chosen type applied');
    assert.equal(mon2.build.m[1], 'Hidden Power Ice');
    assert.equal(eng.sm.hiddenPowerChoosePending, false, 'token consumed on a successful teach');
});

test('gold and Heart Scale lessons commit the previewed type only when confirmed', async t => {
    const w = E.window;
    const story = w.StoryMode;
    const sm = eng.sm;
    const partner = { name: 'Eevee', build: { m: ['Tackle'], n: 'Hardy' } };
    const second = { name: 'Gengar', build: { m: ['Shadow Ball'], n: 'Timid', hpType: 'Steel' } };
    const natural = eng.resolveHiddenPowerForBuild({ ...partner.build }, partner.name);
    Object.assign(sm, {
        active: true, gold: 10000, hiddenPowerUnlocked: true, hiddenPowerChoosePending: true,
        hpChooseGranted: true, inventory: { heartScale: 1 }, team: [partner, second],
        eventIndex: w.__narrationTest.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === 'City7'),
    });
    const originalConfirm = w.showGameConfirm;
    t.after(() => { w.showGameConfirm = originalConfirm; });
    async function choose(selector) {
        for (let tryCount = 0; tryCount < 60; tryCount++) {
            const button = w.document.querySelector(`.story-hp-picker ${selector}`);
            if (button) { button.click(); return; }
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        assert.fail(`Hidden Power picker did not show ${selector}`);
    }
    w.showGameConfirm = async prompt => {
        assert.match(prompt, new RegExp(`Hidden Power \\(${natural}\\)`));
        return true;
    };
    const teach = story.tutorChangeMove(0, 1, 'Hidden Power');
    await choose('[data-hp-natural]');
    await teach;
    assert.equal(partner.build.m[1], `Hidden Power ${natural}`, 'legacy unassigned type matches the preview');
    assert.equal(sm.hiddenPowerChoosePending, true, 'natural lesson saves the favor for another partner');
    assert.equal(sm.gold, 7500);

    let accepted = false;
    w.showGameConfirm = async prompt => {
        assert.match(prompt, /1 Heart Scale to teach Hidden Power \(Fire\)/);
        return accepted;
    };
    const offer = () => story.tutorChangeMoveWithVoucher(1, 1, 'Hidden Power');
    const cancel = offer();
    await choose('[data-hp="Fire"]');
    await cancel;
    assert.equal(second.build.hpType, 'Steel');
    assert.equal(sm.hiddenPowerChoosePending, true);
    assert.equal(sm.inventory.heartScale, 1);
    accepted = true;
    const commit = offer();
    await choose('[data-hp="Fire"]');
    await commit;
    assert.equal(second.build.m[1], 'Hidden Power Fire');
    assert.equal(sm.hiddenPowerChoosePending, false);
    assert.equal(sm.inventory.heartScale, undefined);
    assert.equal(sm.gold, 7500);
});
