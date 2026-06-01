// Regression guards for the mid-2026 story-mode cleanup.
//
//  - Phase 1e: the dormant "unified story-flow engine" was removed (the live path
//    is the v22 3-track dispatch). It must not silently come back — a future
//    session re-adding it would re-introduce the exact "old code racing new"
//    hazard this cleanup eliminated.
//  - Phase 3c: applyArtifactBattleEffects must reset ALL relic battle-flags even
//    when the player holds no artifacts, so flags can't bleed across battles
//    (the init-inside-guard shape, same as the boss-mechanics bleed).
//
// Run: node --test tests/regression/story-cleanup-guards.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const T = W.__storyTest;

test('dormant unified flow engine stays removed (superseded by the v22 3-track dispatch)', () => {
    for (const gone of ['buildUnifiedStoryEvents', 'unifiedResolveRow', 'flowSeen', 'flowMarkSeen']) {
        assert.equal(typeof T[gone], 'undefined',
            `__storyTest.${gone} should be gone — the unified engine was removed in favour of the live 3-track path`);
    }
    // The LIVE dispatch + the villain track-end reward (the kept neighbours) are intact.
    assert.equal(typeof T.resolveActiveRoadBeats, 'function', 'live 3-track dispatch must remain');
    assert.equal(typeof T.grantTrackEndReward, 'function', 'villain/extra track-end reward must remain');
});

test('relic battle-flags reset with no artifacts held — no cross-battle bleed (3c)', () => {
    // Simulate a battle state still carrying every relic flag set by a prior battle.
    eng.engine.state = {
        _vampiricFangsActive: true, _berserkerSerumActive: true, _chaosAmuletActive: true,
        _stagnationCoreActive: true, _glassCannonPact: true, _reapersTollActive: true,
        _evioliteBlessing: true, _heavyGravityHazardMult: 1.5,
        _typeAmplifierType: 'Fire', _typeNullifierType: 'Water', _typeMagnetizerType: 'Grass',
    };
    // Player holds no relics this battle.
    T.sm.artifacts = [];
    T.sm.artifactsDisabled = [];

    W._storyApplyArtifacts();

    const st = eng.engine.state;
    for (const f of ['_vampiricFangsActive', '_berserkerSerumActive', '_chaosAmuletActive',
                     '_stagnationCoreActive', '_glassCannonPact', '_reapersTollActive', '_evioliteBlessing']) {
        assert.equal(st[f], false, `${f} must reset to false when no artifacts are held`);
    }
    assert.equal(st._heavyGravityHazardMult, 1, '_heavyGravityHazardMult must reset to 1');
    assert.equal(st._typeAmplifierType, null);
    assert.equal(st._typeNullifierType, null);
    assert.equal(st._typeMagnetizerType, null);
});

test('Master Ball is 1 per run — villain track grants one idempotently (post-HoF grant removed)', () => {
    // The post-HoF Caged God grant was removed (Phase 6a); the Master Ball now comes
    // solely from the villain track-end reward, for the roaming legendary.
    const sm = T.sm;
    sm.balls = { poke: 0, great: 0, ultra: 0, master: 0 };
    sm._trackRewardGranted = {};
    const beat = { sceneKey: 'villain.rocket.boss', kind: 'boss' };
    const r1 = T.grantTrackEndReward(beat, { silent: true });
    assert.equal(r1 && r1.kind, 'masterball', 'villain boss should grant a Master Ball');
    assert.equal(sm.balls.master, 1, 'exactly one Master Ball from the villain track');
    // Same sceneKey can never grant a second (idempotent via sm._trackRewardGranted).
    const r2 = T.grantTrackEndReward(beat, { silent: true });
    assert.equal(r2, null, 'a repeated villain boss reward must not re-grant');
    assert.equal(sm.balls.master, 1, 'still exactly one Master Ball — no duplicate');
});
