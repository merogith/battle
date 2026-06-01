// Post-battle REWARD VISIBILITY — regression net for NOTIF-1 + REWARD-1.
// See docs/story-design/STORY_FLOW_AUDIT.md §8c/§8d. Story-beat battle rewards
// were granted but never shown: the tier reward's return value was discarded
// (REWARD-1), and the track-end reward (Master Ball / EXP Share) announced via
// a showGameAlert toast that the z-9999 victory overlay painted over (NOTIF-1,
// z-1200). The fix surfaces a `.msg` from each reward fn so onBattleEnd threads
// them onto the on-card `_victoryRewardLines`, and grants the track reward in
// `{ silent: true }` mode there so the occluded toast no longer fires.
//
// onBattleEnd / showVictoryOverlay aren't on the test surface and beats don't
// resolve under the fetch-stubbed harness, so these assert at the reward-fn
// boundary the onBattleEnd hook consumes.
//
// Run: node --test tests/suites/story-reward-visibility-v23.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const h = await loadEngine();
const { window } = h;
const T = window.__storyTest;
const sm = window.StoryMode.state;

function resetRewardState() {
    sm._trackRewardGranted = {};
    if (!sm.balls) sm.balls = { poke: 0, great: 0, ultra: 0, master: 0 };
    if (!sm.inventory || typeof sm.inventory !== 'object') sm.inventory = {};
}

test('REWARD-1: awardStoryBeatReward surfaces a display message (was a discarded array)', () => {
    resetRewardState();
    const res = T.awardStoryBeatReward({ sceneKey: 'villain.rocket.boss', kind: 'boss' });
    assert.ok(res && typeof res === 'object' && !Array.isArray(res), 'returns a result object, not a bare rolled-array');
    assert.ok(typeof res.msg === 'string' && res.msg.length > 0, 'has a non-empty .msg for the victory card');
    assert.match(res.msg, /\+/, 'the summary names at least one granted reward');
});

test('NOTIF-1: grantTrackEndReward(villain boss) returns the Master Ball card line', () => {
    resetRewardState();
    const res = T.grantTrackEndReward({ sceneKey: 'villain.rocket.boss' });
    assert.equal(res && res.kind, 'masterball');
    assert.match(res.msg, /MASTER BALL/);
});

test('NOTIF-1: grantTrackEndReward(extra raid) returns the EXP Share card line', () => {
    resetRewardState();
    const res = T.grantTrackEndReward({ sceneKey: 'extra.mewtwo.raid' });
    assert.equal(res && res.kind, 'expShareGift');
    assert.match(res.msg, /EXP SHARE/);
});

test('NOTIF-1: silent mode suppresses the occluded toast; non-silent still fires it', () => {
    let alerts = 0;
    const realAlert = window.showGameAlert;
    window.showGameAlert = () => { alerts++; };
    try {
        resetRewardState();
        T.grantTrackEndReward({ sceneKey: 'villain.rocket.boss' }); // default = non-silent
        assert.equal(alerts, 1, 'non-silent path fires the toast (legacy behavior, for non-overlay callers)');
        resetRewardState();
        const res = T.grantTrackEndReward({ sceneKey: 'villain.rocket.boss' }, { silent: true });
        assert.equal(alerts, 1, 'silent path adds NO toast — it would paint behind the victory card');
        assert.ok(res && res.msg, 'silent path still returns the message so the card can render it');
    } finally { window.showGameAlert = realAlert; }
});

test('track reward stays idempotent — a second grant for the same beat is a no-op', () => {
    resetRewardState();
    const beat = { sceneKey: 'villain.rocket.boss' };
    assert.ok(T.grantTrackEndReward(beat), 'first grant succeeds');
    assert.equal(T.grantTrackEndReward(beat), null, 'second grant returns null (no double Master Ball)');
});
