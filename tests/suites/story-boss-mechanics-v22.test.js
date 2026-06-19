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

// ── 2026-06 redesign: new effect vocabulary, dynamic field, pools, raid rebalance ──

// Drive a hpThresholdPhase to activation: telegraph turn 1, activate turn 2.
function activatePhase(effect, magnitude, foe) {
    const state = mkBossState([{ type: 'hpThresholdPhase', at: 0.50, effect, magnitude, banner: 'X' }]);
    foe = foe || mkFoe(200, 80); // 40% HP — below the 50% threshold
    state.turnNumber = 1; ST.bossMechanicsTurnTick(state, foe); // telegraph
    state.turnNumber = 2; ST.bossMechanicsTurnTick(state, foe); // activate
    return { state, foe };
}

test('stabBoost effect sets the boss STAB-amp timer on activation', () => {
    const { state } = activatePhase('stabBoost');
    assert.equal(state._bossStabBoostTurns, 3, 'default 3-turn STAB amp');
    // Decrements one per subsequent tick (and survives the activation tick).
    state.turnNumber = 3; ST.bossMechanicsTurnTick(state, mkFoe(200, 80));
    assert.equal(state._bossStabBoostTurns, 2, 'decrements after the activation turn');
});

test('ward effect sets the boss damage-reduction timer on activation', () => {
    const { state } = activatePhase('ward');
    assert.equal(state._bossWardTurns, 3, 'default 3-turn ward');
    state.turnNumber = 3; ST.bossMechanicsTurnTick(state, mkFoe(200, 80));
    assert.equal(state._bossWardTurns, 2, 'ward decrements per turn');
});

test('shield effect builds a barrier pool = maxHp × BOSS_SHIELD_FRAC', () => {
    const knobs = ST.bossBalanceKnobs();
    const { state, foe } = activatePhase('shield');
    assert.equal(state._bossShieldHp, Math.floor(foe.maxHp * knobs.BOSS_SHIELD_FRAC), 'barrier pool sized off maxHp');
    assert.ok(state._bossShieldHp > 0);
});

test('regen effect arms a heal-per-turn window on activation', () => {
    const knobs = ST.bossBalanceKnobs();
    const { state } = activatePhase('regen');
    assert.ok(state._bossRegen && state._bossRegen.turns === knobs.BOSS_REGEN_TURNS, 'regen turns set');
    assert.equal(state._bossRegen.pct, knobs.BOSS_REGEN_PCT, 'regen pct set');
});

test('cleanse effect strips Toxic / Leech-Seed / trap off the boss (anti-cheese)', () => {
    const state = mkBossState([]);
    const foe = mkFoe(100, 100);
    foe.status = 'TOX'; foe.statusTurns = 4;
    foe.volatile = { leechSeed: true, partialTrap: 2, partialTrapSrc: 'Bind' };
    ST.applyBossPhaseEffect(state, foe, 'cleanse');
    assert.equal(foe.status, null, 'status cured');
    assert.equal(foe.volatile.leechSeed, false, 'leech seed removed');
    assert.equal(foe.volatile.partialTrap, 0, 'trap cleared');
});

test('fieldLock value:auto resolves the boss type → advantageous field', () => {
    // Psychic → Psychic Terrain (Mewtwo).
    let state = mkBossState([{ type: 'fieldLock', value: 'auto', turns: 99, banner: 'X' }]);
    state.fActive = { type1: 'Psychic' };
    ST.bossMechanicsBattleInit(state);
    assert.equal(state.terrain, 'Psychic', 'Psychic boss locks Psychic Terrain');
    // Fire → Sun.
    state = mkBossState([{ type: 'fieldLock', value: 'auto', turns: 99, banner: 'X' }]);
    state.fActive = { type1: 'Fire' };
    ST.bossMechanicsBattleInit(state);
    assert.equal(state.weather, 'Sun', 'Fire boss locks Sun');
    // Unmapped type → no lock (graceful).
    state = mkBossState([{ type: 'fieldLock', value: 'auto', turns: 99, banner: 'X' }]);
    state.fActive = { type1: 'Normal' };
    ST.bossMechanicsBattleInit(state);
    assert.equal(state.weather, null, 'Normal boss → no weather');
    assert.equal(state.terrain, null, 'Normal boss → no terrain');
});

test('effect pools: every authored boss effect is in its family pool (villain ≠ mystery)', () => {
    assert.equal(ST.bossEffectPoolViolations().length, 0, 'no boss config draws outside its family pool: ' + ST.bossEffectPoolViolations().join(', '));
    const pools = ST.BOSS_EFFECT_POOLS;
    const v = new Set(pools.villain), m = new Set(pools.mystery);
    const identical = v.size === m.size && [...v].every(x => m.has(x));
    assert.ok(!identical, 'villain and mystery pools must not be the identical set');
});

test('raid phase roller: deterministic per seed, draws from raid pool, keeps thresholds', () => {
    const pool = ST.BOSS_EFFECT_POOLS.raid;
    const mech = () => ([
        { type: 'hpThresholdPhase', at: 0.75, effect: 'surge', banner: 'X' },
        { type: 'hpThresholdPhase', at: 0.50, effect: 'heal', banner: 'X' },
        { type: 'hpThresholdPhase', at: 0.25, effect: 'immunity', banner: 'X' },
    ]);
    function seeded(seed) { let s = (seed >>> 0) ^ 0x9E3779B9; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
    const orig = W.storyRngNext;
    try {
        W.storyRngNext = seeded(12345);
        const a = ST.rollRaidPhaseEffects('extra.mewtwo.raid', mech());
        W.storyRngNext = seeded(12345);
        const b = ST.rollRaidPhaseEffects('extra.mewtwo.raid', mech());
        assert.equal(a.map(m => m.effect).join(','), b.map(m => m.effect).join(','), 'same seed → same effects');
        for (const m of a) assert.ok(pool.includes(m.effect), `rolled effect ${m.effect} is in the raid pool`);
        assert.equal(a.map(m => m.at).join(','), '0.75,0.5,0.25', 'thresholds (cadence) preserved');
    } finally { W.storyRngNext = orig; }
    // Non-raid beats pass through untouched.
    const passthru = ST.rollRaidPhaseEffects('villain.rocket.boss', [{ type: 'faintPhase', afterFaints: 0, effect: 'surge' }]);
    assert.equal(passthru[0].effect, 'surge', 'non-raid beat is not remapped');
});

test('raid stat split is bulky-not-fast: speed capped, bulk on def/HP, offense on atk', () => {
    const mk = ST.makeBuild || W.makeBuild;
    const buildPokemon = W.buildPokemon;
    const base = mk('Marowak');
    const plainBuild = JSON.parse(JSON.stringify(base));
    const bossBuild = JSON.parse(JSON.stringify(base));
    const knobs = ST.bossBalanceKnobs();
    bossBuild._bossOffMult = knobs.RAID_OFF_MULT;
    bossBuild._bossBulkMult = knobs.RAID_BULK_MULT;
    bossBuild._bossSpeMult = knobs.RAID_SPE_MULT;
    const plain = buildPokemon('Marowak', plainBuild);
    const boss = buildPokemon('Marowak', bossBuild);
    assert.equal(boss.stats.atk, Math.max(1, Math.floor(plain.stats.atk * knobs.RAID_OFF_MULT)), 'atk uses offense mult');
    assert.equal(boss.stats.def, Math.max(1, Math.floor(plain.stats.def * knobs.RAID_BULK_MULT)), 'def uses bulk mult');
    assert.equal(boss.maxHp, Math.floor(plain.maxHp * knobs.RAID_BULK_MULT), 'HP uses bulk mult');
    assert.ok(boss.stats.spe <= plain.stats.spe, 'speed not increased — no outspeed-OHKO');
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
