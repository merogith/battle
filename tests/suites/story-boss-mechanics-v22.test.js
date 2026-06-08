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
        _bossPendingTelegraphs: [], _bossSurgeTurns: 0, _bossImmuneTurns: 0,
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
    assert.equal(state._bossPendingTelegraphs.length, 0, 'should not telegraph above threshold');

    // Turn 2, foe damaged to 20% HP — below threshold, queue telegraph.
    foe.currentHp = 20;
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraphs.length, 'should queue telegraph at threshold');
    assert.equal(state._bossPendingTelegraphs[0].type, 'hpThresholdPhase');
    assert.equal(state._bossPendingTelegraphs[0].banner, 'CALLED IN');
});

test('hpThresholdPhase activates surge on the NEXT turn (1-turn telegraph)', () => {
    const state = mkBossState([
        { type: 'hpThresholdPhase', at: 0.50, banner: 'INJECTION' }
    ]);
    const foe = mkFoe(100, 40);
    // Turn 1 — crosses 50%, queues telegraph.
    state.turnNumber = 1;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraphs.length);
    assert.equal(state._bossSurgeTurns | 0, 0);

    // Turn 2 — telegraph activates → boss-side surge for 3 turns.
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraphs.length, 0);
    // Surge engages THIS turn for 3 turns of +25% damage. The boss-side timer (on state,
    // so it survives a boss switch) is set after the pre-activation decrement, so it reads
    // 3 right after activation.
    assert.equal(state._bossSurgeTurns, 3);
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
    assert.equal(state._bossPendingTelegraphs.length, 0, 'should not re-telegraph an already-fired threshold');
});

test('immunityRound telegraphs at turn N-1 and activates on turn N', () => {
    const state = mkBossState([
        { type: 'immunityRound', everyN: 5, turns: 1, banner: 'PREPARING' }
    ]);
    const foe = mkFoe(100, 100);
    // Turn 4 (everyN-1=4 for everyN=5) — telegraph.
    state.turnNumber = 4;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraphs.length, 'should telegraph at turn 4 for everyN=5');
    assert.equal(state._bossPendingTelegraphs[0].type, 'immunityRound');

    // Turn 5 — activates, immunity engaged.
    state.turnNumber = 5;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraphs.length, 0);
    // Immunity is engaged for THIS turn's damage phase — the clamp checks > 0 — so the
    // boss-side timer (on state) reads 1 right after activation and decrements to 0 next
    // tick. (Was 0 under the same-tick off-by-one, so the clamp never fired.)
    assert.equal(state._bossImmuneTurns, 1);
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
    assert.equal(state._bossPendingTelegraphs.length, 0, 'no telegraph before 2 faints');

    // KO two of the boss's BENCH Pokémon → threshold reached (active mon excluded).
    state.foeParty[1].currentHp = 0;
    state.foeParty[2].currentHp = 0;
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraphs.length, 'telegraphs at 2 faints');
    assert.equal(state._bossPendingTelegraphs[0].type, 'faintPhase');
    assert.equal(state._bossPendingTelegraphs[0].effect, 'surge');

    // Next turn activates the boss-side surge.
    state.turnNumber = 3;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossSurgeTurns, 3);
});

test('heal phase effect restores foe HP on activation', () => {
    const state = mkBossState([
        { type: 'hpThresholdPhase', at: 0.50, effect: 'heal', magnitude: 0.25, banner: 'MEND' }
    ]);
    const foe = mkFoe(200, 80); // 40% HP — below the 50% threshold
    state.turnNumber = 1;
    ST.bossMechanicsTurnTick(state, foe);
    assert.ok(state._bossPendingTelegraphs.length, 'telegraphs the heal phase');
    assert.equal(state._bossPendingTelegraphs[0].effect, 'heal');
    const hpBefore = foe.currentHp;
    state.turnNumber = 2;
    ST.bossMechanicsTurnTick(state, foe); // activate
    assert.equal(foe.currentHp, Math.min(foe.maxHp, hpBefore + Math.floor(foe.maxHp * 0.25)));
    assert.ok(foe.currentHp > hpBefore, 'heal should raise HP');
});

test('telegraph queue keeps BOTH phases when two mechanics cross the same turn', () => {
    // mfBattle-style: HP-threshold surge + immunity every 5 turns. On turn 4 the immunity
    // telegraphs (everyN-1) AND the foe is already below 50%, so the HP phase also fires.
    // A single telegraph slot dropped one (and ate its fired-flag); the queue keeps both.
    const state = mkBossState([
        { type: 'hpThresholdPhase', at: 0.50, effect: 'surge', banner: 'THE FIRST' },
        { type: 'immunityRound', everyN: 5, turns: 1, banner: 'PAUSE' }
    ]);
    const foe = mkFoe(100, 40); // below 50%
    state.turnNumber = 4;
    ST.bossMechanicsTurnTick(state, foe);
    const types = state._bossPendingTelegraphs.map(t => t.type).sort().join(',');
    assert.equal(types, 'hpThresholdPhase,immunityRound', 'both phases queued, neither dropped');
    // Turn 5 — both activate (boss-side timers).
    state.turnNumber = 5;
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossSurgeTurns, 3, 'surge applied');
    assert.equal(state._bossImmuneTurns, 1, 'immunity applied');
});

test('solo raid boss scaling: _bossStatMult boosts stats; _bossHpScale multiplies HP only', () => {
    const mk = ST.makeBuild || W.makeBuild;
    const buildPokemon = W.buildPokemon;
    assert.equal(typeof buildPokemon, 'function', 'buildPokemon reachable on window');
    assert.equal(typeof mk, 'function', 'makeBuild reachable');
    const base = mk('Marowak');
    assert.ok(base, 'makeBuild returned a build');
    // Same base build, cloned — only the boss fields differ → clean comparison.
    const plainBuild = JSON.parse(JSON.stringify(base));
    const bossBuild = JSON.parse(JSON.stringify(base));
    bossBuild._bossStatMult = 1.3;  // legendary-tier all-stat boost
    bossBuild._bossHpScale = 5;     // raid scale (maxParty 6 - 1)
    const plain = buildPokemon('Marowak', plainBuild);
    const boss = buildPokemon('Marowak', bossBuild);
    // HP: ×1.3 (stat mult) then ×5 (HP scale), each floored, in that order.
    const expHp = Math.floor(Math.floor(plain.maxHp * 1.3) * 5);
    assert.equal(boss.maxHp, expHp, `boss HP should be floor(floor(${plain.maxHp}*1.3)*5)`);
    assert.equal(boss.currentHp, boss.maxHp, 'boss enters at full scaled HP');
    // Offensive stat: ×1.3 only (HP scale does not touch stats).
    assert.equal(boss.stats.atk, Math.max(1, Math.floor(plain.stats.atk * 1.3)), 'atk boosted by stat mult only');
});

test('extra raids are populated with escalating multi-phase HP configs', () => {
    const c = ST.BOSS_CONFIGS;
    const raid = c['extra.mewtwo.raid'];
    assert.ok(raid && raid.mechanics.length === 3, 'real raid has 3 HP phases');
    assert.equal(raid.mechanics.map(m => m.at).join(','), '0.75,0.5,0.25');
    assert.equal(raid.mechanics.map(m => m.effect).join(','), 'surge,heal,immunity');
    const mini = c['extra.mewtwo.miniRaid'];
    assert.ok(mini && mini.mechanics.length === 2, 'mini raid has 2 HP phases');
    assert.equal(mini.mechanics.map(m => m.at).join(','), '0.5,0.25');
    assert.equal(mini.mechanics.map(m => m.effect).join(','), 'surge,immunity');
});

// Road-5 miniRaid2 (evolved-form escalation). These 8 beats used to misfire: the
// roller regex /(raid|miniRaid)$/ rejected the trailing "2", so the beat fell
// through to a rolled trainer team instead of the lone evolved boss the prose names.
const EXTRA_ARCS = ['cubone', 'yamask', 'hypno', 'phantump', 'mimikyu', 'drifloon', 'parasect', 'mewtwo'];

test('every extra miniRaid2 has a mini-raid (50/25) phase config', () => {
    const c = ST.BOSS_CONFIGS;
    for (const arc of EXTRA_ARCS) {
        const cfg = c[`extra.${arc}.miniRaid2`];
        assert.ok(cfg && cfg.mechanics.length === 2, `${arc} miniRaid2 should have 2 HP phases`);
        assert.equal(cfg.mechanics.map(m => m.at).join(','), '0.5,0.25', `${arc} miniRaid2 at 50/25`);
        assert.equal(cfg.mechanics.map(m => m.effect).join(','), 'surge,immunity', `${arc} miniRaid2 surge→immunity`);
    }
});

test('miniRaid2 beats resolve to ONE evolved-form boss, not a trainer team', () => {
    // Every arc resolves to a single solo boss (length 1), not null/trainer-roll.
    for (const arc of EXTRA_ARCS) {
        const team = ST.rollExtraRaidBossTeam(`extra.${arc}.miniRaid2`);
        assert.ok(Array.isArray(team) && team.length === 1, `${arc} miniRaid2 = single solo boss`);
        assert.equal(team[0].build._bossStatMult, 1.3, `${arc} legendary-tier stat mult`);
        assert.ok(team[0].build._bossHpScale >= 1, `${arc} party-scaled HP applied`);
    }
    // Spot-check the evolved species the prose names.
    assert.equal(ST.rollExtraRaidBossTeam('extra.cubone.miniRaid2')[0].name, 'Marowak', 'cubone → Marowak');
    // yamask is the one arc whose evolved form differs from its base/climax species.
    assert.equal(ST.rollExtraRaidBossTeam('extra.yamask.miniRaid2')[0].name, 'Cofagrigus', 'yamask → Cofagrigus (not Yamask)');

    // Per-tier escalation: Road-4 base form → Road-5 evolved → Road-6 climax.
    assert.equal(ST.rollExtraRaidBossTeam('extra.cubone.miniRaid')[0].name, 'Cubone', 'road-4 = base Cubone');
    assert.equal(ST.rollExtraRaidBossTeam('extra.phantump.miniRaid')[0].name, 'Phantump', 'road-4 = base Phantump');
    assert.equal(ST.rollExtraRaidBossTeam('extra.drifloon.miniRaid')[0].name, 'Drifloon', 'road-4 = base Drifloon');
    assert.equal(ST.rollExtraRaidBossTeam('extra.parasect.miniRaid')[0].name, 'Paras', 'road-4 = base Paras');
    assert.equal(ST.rollExtraRaidBossTeam('extra.cubone.raid')[0].name, 'Marowak', 'road-6 climax = Marowak');
    // A non-combat extra beat must NOT resolve to a solo boss.
    assert.equal(ST.rollExtraRaidBossTeam('extra.cubone.event5'), null, 'event beats are not raids');
});

test('turn tick is a safe no-op when state has no boss mechanics', () => {
    const state = mkBossState([]);
    delete state._bossMechanics;
    const foe = mkFoe(100, 100);
    // Should not throw.
    ST.bossMechanicsTurnTick(state, foe);
    assert.equal(state._bossPendingTelegraphs.length, 0);
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
