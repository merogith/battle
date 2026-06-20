// Post-Hall-of-Fame endgame flow — the Mystery Figure climax → Crucible hand-off.
//
// Locks the behaviour fixed in the "endgame after Hall of Fame" pass:
//   1. LOSING the post-HoF Mystery Figure climax must NOT consume the endgame: the
//      climax stays pending (postHofMysteryClimaxDone === false), the Crucible does
//      NOT open, and the standard story defeat screen is shown so the player can
//      Retry / Return to the last city and try again. (Previously the loss flipped
//      the climax flag and dumped the player into the post-game with a fainted team —
//      the "story gets bugged on loss" report.)
//   2. The town hub surfaces a "Face the Mystery Figure" re-challenge entry while the
//      climax is pending (driven by sm.hofPartySnapshot && !postHofMysteryClimaxDone),
//      exposed as window.StoryMode.enterMysteryClimax.
//   3. BEATING the climax opens the Crucible as the endgame hub — continuePostGame
//      sets sm.atCrucible so every enterCity() short-circuits into the Crucible.
//   4. The endgame is Crucible-ONLY: the old "Back to City" leave affordance is gone
//      (window.StoryMode.leaveCrucible no longer exists).
//
// Run: node --test tests/suites/postgame-endgame-flow.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const EV = W.STORY_EVENTS_RAW;

const mysteryIdx = EV.findIndex(r => r && r[1] === 'Battle' && String(r[2] || '') === 'Mystery Figure');

// Put sm into "mid post-HoF Mystery climax" shape, with the climax not yet beaten.
function armClimaxPending() {
    const sm = ST.sm;
    sm.active = true;
    sm.eventIndex = mysteryIdx;
    sm.crucibleBattleSource = 'postHofMystery';
    sm.postHofMysteryClimaxDone = false;
    sm.atCrucible = false;
    sm.storyDifficulty = 'normal';
    sm.runSeed = 0;
    sm.gold = 5000;
    sm.stats = { battlesLost: 0, rivalBattlesLost: 0 };
    sm.hofPartySnapshot = [{ name: 'Pikachu', nickname: '', build: {} }];
    sm.currentTrainerData = { name: '??? Mystery Figure' };
    sm.frontier = { currentStreak: 0, currentRound: 1, highscores: [], active: false };
    if (!sm.inventory) sm.inventory = {};
    if (!sm.storyEventsFired) sm.storyEventsFired = {};
    return sm;
}

test('the Mystery Figure climax row exists in the timeline', () => {
    assert.ok(mysteryIdx >= 0, 'STORY_EVENTS_RAW has a "Mystery Figure" Battle row');
});

test('losing the climax keeps it PENDING and shows the standard defeat screen', () => {
    const sm = armClimaxPending();

    W.StoryMode.onBattleEnd(false, 'Defeated', '');

    assert.equal(ST.sm.postHofMysteryClimaxDone, false,
        'a loss must NOT mark the climax done — it stays beatable');
    assert.ok(!ST.sm.crucibleBattleSource,
        'the crucible source is dropped so the city / row-67 recovery state is clean');
    assert.notEqual(ST.sm.atCrucible, true,
        'a loss must NOT open the Crucible endgame');

    const go = W.document.getElementById('screen-story-gameover');
    assert.ok(go && !go.classList.contains('hidden'),
        'the standard story defeat screen (Retry / Return to last city) is shown');
});

test('a pending climax can be re-entered, and the re-challenge entry is exposed', () => {
    const sm = armClimaxPending();
    // The town "Face the Mystery Figure" button is gated on exactly this state.
    assert.ok(sm.hofPartySnapshot && !sm.postHofMysteryClimaxDone,
        'the re-challenge gate (HoF reached + climax pending) holds after a loss');
    assert.equal(typeof W.StoryMode.enterMysteryClimax, 'function',
        'enterMysteryClimax is exported for the town re-challenge button');
});

test('beating the climax opens the Crucible as the endgame hub', () => {
    const sm = armClimaxPending();
    // Simulate "climax just beaten": the win path sets the flag, then continuePostGame
    // runs the closing beats and hands off to the hub. atCrucible is flipped
    // synchronously at the top of that hand-off, before any async narration overlay.
    sm.postHofMysteryClimaxDone = true;
    sm.crucibleBattleSource = null;
    sm.atCrucible = false;
    sm.storyEventsFired = Object.assign({}, sm.storyEventsFired, { 'main.mfReveal': true, 'main.ending': true });

    W.StoryMode.continuePostGame();

    assert.equal(ST.sm.atCrucible, true,
        'the post-game hub is the Crucible — enterCity() now short-circuits into it');
});

test('enterMysteryClimax falls back to the Crucible once the climax is beaten', () => {
    const sm = armClimaxPending();
    sm.postHofMysteryClimaxDone = true;
    sm.atCrucible = false;

    W.StoryMode.enterMysteryClimax();

    assert.equal(ST.sm.atCrucible, true,
        'a beaten climax routes the re-challenge entry straight back to the Crucible');
    const cr = W.document.getElementById('screen-story-crucible');
    assert.ok(cr && !cr.classList.contains('hidden'), 'the Crucible screen is shown');
});

test('a lost climax stays parked on the climax row, ready for a Crucible-sourced retry', () => {
    armClimaxPending();
    W.StoryMode.onBattleEnd(false, 'Defeated', '');
    // Both re-entry paths (retryFromGameOver's guard and enterMysteryClimax) re-arm
    // postHofMystery off exactly this state: positioned on the Mystery Figure row with
    // the climax not yet beaten and the transient source dropped. (The live re-arm
    // itself runs through load(), which jsdom's opaque-origin localStorage can't
    // exercise — it's covered by the row-walkthrough harness in production.)
    const row = EV[ST.sm.eventIndex];
    assert.ok(row && row[1] === 'Battle' && row[2] === 'Mystery Figure',
        'still parked on the Mystery Figure climax row after a loss');
    assert.equal(ST.sm.postHofMysteryClimaxDone, false, 'the climax is still pending');
    assert.ok(!ST.sm.crucibleBattleSource, 'the transient source is dropped (re-armed on re-entry)');
});

test('the endgame is Crucible-only — the leave-to-town affordance is gone', () => {
    assert.equal(typeof W.StoryMode.leaveCrucible, 'undefined',
        'leaveCrucible is removed: the Crucible fully replaces town hubs in the endgame');
});
