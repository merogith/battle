// PR-5: track-end rewards (Master Ball, Exp Share x6) + BOSS_CONFIGS registry.
// Run: node --test tests/suites/story-track-rewards-v22.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;

test('grantTrackEndReward returns null for non-matching beats', () => {
    assert.equal(ST.grantTrackEndReward(null), null);
    assert.equal(ST.grantTrackEndReward({ sceneKey: 'main.event1' }), null);
    assert.equal(ST.grantTrackEndReward({ sceneKey: 'villain.rocket.event1' }), null);
    assert.equal(ST.grantTrackEndReward({ sceneKey: 'extra.cubone.event1' }), null);
});

test('grantTrackEndReward grants Master Ball on any villain.X.boss', () => {
    ST.sm = Object.assign({}, ST.sm, { balls: { poke:0, great:0, ultra:0, master:0 } });
    const before = ST.sm.balls.master | 0;
    const result = ST.grantTrackEndReward({ sceneKey: 'villain.rocket.boss' });
    assert.deepEqual({ kind: result.kind, count: result.count }, { kind: 'masterball', count: 1 });
    assert.equal(ST.sm.balls.master | 0, before + 1);
});

test('grantTrackEndReward works for all 10 villain tracks', () => {
    const villains = ['rocket','magma','aqua','galactic','plasma','flare','skull','yell','macroCosmos','star'];
    for (const v of villains) {
        ST.sm = Object.assign({}, ST.sm, { balls: { poke:0, great:0, ultra:0, master:0 } });
        const result = ST.grantTrackEndReward({ sceneKey: `villain.${v}.boss` });
        assert.ok(result && result.kind === 'masterball', `failed for villain ${v}`);
        assert.equal(ST.sm.balls.master | 0, 1);
    }
});

test('grantTrackEndReward grants Exp Share Voucher x6 on any extra.X.raid', () => {
    ST.sm = Object.assign({}, ST.sm, { inventory: { expShareVoucher: 0 } });
    const result = ST.grantTrackEndReward({ sceneKey: 'extra.cubone.raid' });
    assert.equal(result.kind, 'expShareVoucher');
    assert.equal(result.count, 6);
    assert.equal(ST.sm.inventory.expShareVoucher | 0, 6);
});

test('grantTrackEndReward works for all 8 extra tracks', () => {
    const extras = ['cubone','yamask','hypno','phantump','mimikyu','drifloon','parasect','mewtwo'];
    for (const x of extras) {
        ST.sm = Object.assign({}, ST.sm, { inventory: { expShareVoucher: 0 } });
        const result = ST.grantTrackEndReward({ sceneKey: `extra.${x}.raid` });
        assert.ok(result && result.kind === 'expShareVoucher', `failed for extra ${x}`);
        assert.equal(ST.sm.inventory.expShareVoucher | 0, 6);
    }
});

test('grantTrackEndReward accumulates (multiple rewards stack)', () => {
    ST.sm = Object.assign({}, ST.sm, {
        balls: { poke:0, great:0, ultra:0, master:0 },
        inventory: { expShareVoucher: 0 },
    });
    ST.grantTrackEndReward({ sceneKey: 'villain.rocket.boss' });
    ST.grantTrackEndReward({ sceneKey: 'extra.cubone.raid' });
    assert.equal(ST.sm.balls.master, 1);
    assert.equal(ST.sm.inventory.expShareVoucher, 6);
});

test('grantTrackEndReward does NOT fire on mfBattle (apex tier owns its own reward)', () => {
    ST.sm = Object.assign({}, ST.sm, { balls: { poke:0, great:0, ultra:0, master:0 } });
    const result = ST.grantTrackEndReward({ sceneKey: 'main.mfBattle' });
    assert.equal(result, null);
    assert.equal(ST.sm.balls.master, 0);
});

test('grantTrackEndReward does NOT fire on mini-bosses or mini-raids', () => {
    ST.sm = Object.assign({}, ST.sm, {
        balls: { poke:0, great:0, ultra:0, master:0 },
        inventory: { expShareVoucher: 0 },
    });
    ST.grantTrackEndReward({ sceneKey: 'villain.rocket.miniBoss' });
    ST.grantTrackEndReward({ sceneKey: 'extra.cubone.miniRaid' });
    ST.grantTrackEndReward({ sceneKey: 'extra.cubone.miniRaid2' });
    assert.equal(ST.sm.balls.master, 0);
    assert.equal(ST.sm.inventory.expShareVoucher, 0);
});

test('BOSS_CONFIGS registered for all 10 villain bosses + 8 extra raids + mfBattle', () => {
    const cfgs = ST.BOSS_CONFIGS;
    const villains = ['rocket','magma','aqua','galactic','plasma','flare','skull','yell','macroCosmos','star'];
    const extras = ['cubone','yamask','hypno','phantump','mimikyu','drifloon','parasect','mewtwo'];
    for (const v of villains) {
        const key = `villain.${v}.boss`;
        assert.ok(cfgs[key], `BOSS_CONFIGS missing ${key}`);
        assert.ok(Array.isArray(cfgs[key].mechanics) && cfgs[key].mechanics.length > 0,
            `${key} missing mechanics`);
    }
    for (const x of extras) {
        const key = `extra.${x}.raid`;
        assert.ok(cfgs[key], `BOSS_CONFIGS missing ${key}`);
        assert.ok(Array.isArray(cfgs[key].mechanics) && cfgs[key].mechanics.length > 0,
            `${key} missing mechanics`);
    }
    assert.ok(cfgs['main.mfBattle'], 'BOSS_CONFIGS missing mfBattle');
});

test('BOSS_MECHANICS exposes hpThresholdPhase / immunityRound / fieldLock', () => {
    const m = ST.BOSS_MECHANICS;
    assert.equal(typeof m.hpThresholdPhase, 'function');
    assert.equal(typeof m.immunityRound, 'function');
    assert.equal(typeof m.fieldLock, 'function');
});

test('BOSS_MECHANICS records activations on a battle context', () => {
    const battle = {};
    ST.BOSS_MECHANICS.hpThresholdPhase(battle, 0.25, null, 'TEST BANNER');
    assert.ok(Array.isArray(battle._mechanics));
    assert.equal(battle._mechanics.length, 1);
    assert.equal(battle._mechanics[0].type, 'hpThresholdPhase');
    assert.equal(battle._mechanics[0].thresholdPct, 0.25);
    assert.equal(battle._mechanics[0].bannerText, 'TEST BANNER');
});

test('bossHpScaleForKind matches design (miniRaid=p-1, raid=p, else=1)', () => {
    assert.equal(ST.bossHpScaleForKind('miniRaid', 5), 4);
    assert.equal(ST.bossHpScaleForKind('miniRaid', 1), 1);  // clamped at min 1
    assert.equal(ST.bossHpScaleForKind('raid', 6), 6);
    assert.equal(ST.bossHpScaleForKind('boss', 6), 1);
    assert.equal(ST.bossHpScaleForKind('battle', 6), 1);
});
