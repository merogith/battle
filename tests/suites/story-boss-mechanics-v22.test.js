// PR-A polish: BOSS_CONFIGS live wiring — battle init, turn tick, telegraph
// + immunity round + HP threshold phase, damage clamp. Verifies behavior in
// isolation (no full battle loop needed — direct state mutation + tick calls).
// Run: node --test tests/suites/story-boss-mechanics-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

function mkBossState(mechanics) {
    return {
        turnNumber: 0,
        weather: null, weatherTurns: 0,
        terrain: null, terrainTurns: 0,
        _activeStoryBeatKey: 'villain.rocket.boss',
        _bossMechanics: mechanics.slice(),
        _bossMechanicsFired: {},
        _bossPendingTelegraph: null,
    };
}
function mkFoe(maxHp, currentHp) {
    return { name: 'Giovanni-Test', currentHp, maxHp, _bossSurgeTurns: 0, _bossImmuneTurns: 0 };
}

test('battleInit applies fieldLock weather at turn 0', () => {
    const state = mkBossState([
        { type: 'fieldLock', kind: 'weather', value: 'Sun', turns: 99, banner: 'PRIMAL HEAT' }
    ]);
    ST.bossMechanicsBattleInit(state);
    assert.equal(state.weather, 'Sun');
    assert.equal(state.weatherTurns, 99);
    assert.equal(state._bossWeatherLocked, true);
});

test('battleInit applies fieldLock terrain', () => {
    const state = mkBossState([
        { type: 'fieldLock', kind: 'terrain', value: 'Psychic', turns: 99 }
    ]);
    ST.bossMechanicsBattleInit(state);
    assert.equal(state.terrain, 'Psychic');
    assert.equal(state.terrainTurns, 99);
});

test('hpThresholdPhase telegraphs at first turn the threshold is crossed', () => {
    const state = mkBossState([
        { type: 'hpThresholdPhase', at: 0.25, banner: 'CALLED IN' }
    ]);
    // Turn 1, foe at 50% HP — above threshold, no telegraph yet.
    state.turnNumber = 1;
    const foe = mkFoe(100, 50);
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraph, null, 'should not telegraph above threshold');

    // Turn 2, foe damaged to 20% HP — below threshold, queue telegraph.
    foe.currentHp = 20;
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraph, 'should queue telegraph at threshold');
    assert.equal(state._bossPendingTelegraph.type, 'hpThresholdPhase');
    assert.equal(state._bossPendingTelegraph.banner, 'CALLED IN');
});

test('hpThresholdPhase activates surge on the NEXT turn (1-turn telegraph)', () => {
    const state = mkBossState([
        { type: 'hpThresholdPhase', at: 0.50, banner: 'INJECTION' }
    ]);
    const foe = mkFoe(100, 40);
    // Turn 1 — crosses 50%, queues telegraph.
    state.turnNumber = 1;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraph);
    assert.equal(foe._bossSurgeTurns, 0);

    // Turn 2 — telegraph activates → foe gets surge for 3 turns.
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraph, null);
    // Surge engages THIS turn and lasts 3 turns of +25% damage. The timer is set
    // after the pre-activation decrement, so it reads 3 right after activation.
    // (Was 2 under the same-tick off-by-one this fix corrects.)
    assert.equal(foe._bossSurgeTurns, 3);
});

test('hpThresholdPhase only telegraphs once per threshold (does not refire)', () => {
    const state = mkBossState([
        { type: 'hpThresholdPhase', at: 0.50, banner: 'INJECTION' }
    ]);
    const foe = mkFoe(100, 40);
    // Turn 1 telegraph.
    state.turnNumber = 1;
    ST.bossMechanicsTurnTick(state, foe);
    // Turn 2 activation.
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe);
    // Turn 3 — foe still below 50%, should NOT re-telegraph.
    state.turnNumber = 3;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraph, null, 'should not re-telegraph an already-fired threshold');
});

test('immunityRound telegraphs at turn N-1 and activates on turn N', () => {
    const state = mkBossState([
        { type: 'immunityRound', everyN: 5, turns: 1, banner: 'PREPARING' }
    ]);
    const foe = mkFoe(100, 100);
    // Turn 4 (everyN-1=4 for everyN=5) — telegraph.
    state.turnNumber = 4;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraph, 'should telegraph at turn 4 for everyN=5');
    assert.equal(state._bossPendingTelegraph.type, 'immunityRound');

    // Turn 5 — activates, immunity engaged.
    state.turnNumber = 5;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraph, null);
    // Immunity is engaged for THIS turn's damage phase — the clamp checks > 0 — so it
    // reads 1 right after activation and decrements to 0 on the next tick. (Was 0 under
    // the same-tick off-by-one, which meant the immunity clamp never actually fired.)
    assert.equal(foe._bossImmuneTurns, 1);
});

test('faintPhase telegraphs when the boss team faints reach the threshold', () => {
    const state = mkBossState([
        { type: 'faintPhase', afterFaints: 2, effect: 'surge', banner: 'CORNERED' }
    ]);
    const foe = mkFoe(100, 100);
    state.foeParty = [foe, mkFoe(100, 100), mkFoe(100, 100), mkFoe(100, 100), mkFoe(100, 100), mkFoe(100, 100)];
    // Turn 1 — nobody fainted yet, no phase.
    state.turnNumber = 1;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraph, null, 'no telegraph before 2 faints');

    // KO two of the boss's Pokémon → threshold reached.
    state.foeParty[1].currentHp = 0;
    state.foeParty[2].currentHp = 0;
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraph, 'telegraphs at 2 faints');
    assert.equal(state._bossPendingTelegraph.type, 'faintPhase');
    assert.equal(state._bossPendingTelegraph.effect, 'surge');

    // Next turn activates the surge on the active foe.
    state.turnNumber = 3;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(foe._bossSurgeTurns, 3);
});

test('heal phase effect restores foe HP on activation', () => {
    const state = mkBossState([
        { type: 'hpThresholdPhase', at: 0.50, effect: 'heal', magnitude: 0.25, banner: 'MEND' }
    ]);
    const foe = mkFoe(200, 80); // 40% HP — below the 50% threshold
    state.turnNumber = 1;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraph, 'telegraphs the heal phase');
    assert.equal(state._bossPendingTelegraph.effect, 'heal');
    const hpBefore = foe.currentHp;
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe); // activate
    assert.equal(foe.currentHp, Math.min(foe.maxHp, hpBefore + Math.floor(foe.maxHp * 0.25)));
    assert.ok(foe.currentHp > hpBefore, 'heal should raise HP');
});

test('turn tick is a safe no-op when state has no boss mechanics', () => {
    const state = mkBossState([]);
    delete state._bossMechanics;
    const foe = mkFoe(100, 100);
    // Should not throw.
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraph, null);
});

test('BOSS_CONFIGS data ties into real beat sceneKeys', () => {
    const cfgs = ST.BOSS_CONFIGS;
    // Spot-check: villain.magma.boss has fieldLock(Sun) per its CSV phase note.
    const magma = cfgs['villain.magma.boss'];
    assert.ok(magma && Array.isArray(magma.mechanics));
    const hasFieldLock = magma.mechanics.some(m => m.type === 'fieldLock' && m.kind === 'weather' && m.value === 'Sun');
    assert.ok(hasFieldLock, 'magma boss should field-lock Sun');
    // villain.aqua.boss field-locks Rain.
    const aqua = cfgs['villain.aqua.boss'];
    const hasRain = aqua && aqua.mechanics.some(m => m.type === 'fieldLock' && m.value === 'Rain');
    assert.ok(hasRain, 'aqua boss should field-lock Rain');
});

test('showBossBanner creates and removes a DOM banner', async () => {
    ST.showBossBanner('TEST BANNER', '#ff0000');
    // The banner inserts immediately + fades; check existence then wait.
    const before = W.document.querySelectorAll('.story-boss-banner').length;
    assert.ok(before >= 1, 'banner element should be inserted');
    // Wait for the cleanup timer (>2200ms).
    await new Promise(r => setTimeout(r, 2400));
    const after = W.document.querySelectorAll('.story-boss-banner').length;
    assert.equal(after, 0, 'banner should be removed after timeout');
});
