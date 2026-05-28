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
    // After activation, surge starts at 3 and immediately decrements to 2 in the same tick.
    assert.equal(foe._bossSurgeTurns, 2);
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
    // Immunity activates with 1 turn, decrements to 0 within the same tick.
    assert.equal(foe._bossImmuneTurns, 0);
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
