---
severity: P1
category: bug
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~41690
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1d05f5b87967
confidence: medium
status: fixed-main
---

**Title**: Villain-boss Master Ball grant has no fire-once guard; unique-ball guarantee can break

**Evidence**:
```js
if (/^villain\.[a-zA-Z]+\.boss$/.test(sk)) {
    if (!sm.balls) sm.balls = { poke:0, great:0, ultra:0, master:0 };
    sm.balls.master = (sm.balls.master | 0) + 1;   // no storyEventsFired / staticDrops guard
    try { save(); } catch (e) {}
    try { window.showGameAlert && window.showGameAlert('🎯 You found a MASTER BALL among the spoils.'); } catch (e) {}
```

**Repro**: `_storyGrantTrackEndReward(beat)` is invoked from two sites — the beat queue (`_playStoryBeatQueue`, ~41576) and the battle-injection victory hook (`onBattleEnd`, ~46888) — for the same `villain.*.boss` sceneKey. Neither caller dedupes the grant itself (only `sm.storyEventsFired[sk]` is set, and it is set AFTER the scene plays, and is not consulted inside the grant). A reload mid beat-queue, or both hooks firing for one boss, can add 2+ Master Balls.

**Blast radius**: Caged God boss arc — its entire challenge is "the Master Ball is the only guaranteed throw, saved for that one fight." A duplicate Master Ball lets the player burn one on a route wild (the locked-button toast at ~49437 is the only other safety net) and still cage the god, trivializing the post-game climax. Spec (STORY_MODE_FLOW.md) calls the Master Ball uniquely tracked.

**Fix sketch**: Gate the grant on a per-sceneKey once flag (e.g. `if (sm.staticDrops['mb_'+sk]) return; sm.staticDrops['mb_'+sk]=true;`) inside `_storyGrantTrackEndReward`, so neither call site nor a replay can double-grant.

**Verification**: Drive a villain-boss beat through both the beat-queue and the onBattleEnd hook in the jsdom harness; assert `sm.balls.master` increments by exactly 1.

---
severity: P2
category: dx
anchor_symbol: _pcRefresh
current_line_hint: ~47409
file: battle.html
agents: [story-mode-investigator]
fingerprint: 990f3a987dff
confidence: high
status: open
---

**Title**: PC deposit/withdraw/release resets scroll to top via full innerHTML rewrite

**Evidence**:
```js
const body = document.getElementById('story-pc-body');
if (!body) return;
if (_pcCurrentTab === 'storage') body.innerHTML = _pcRenderStorageTab();
else body.innerHTML = _pcRenderUndergroundTab();
_pcInstallRowClickHandler();
```

**Repro**: Fill the PC toward its 30-mon cap, scroll down, deposit/withdraw/release a mon near the bottom. `_pcRefresh` rebuilds `story-pc-body.innerHTML` wholesale, so the scroll position jumps back to top each action — the player must re-scroll for every subsequent operation on a long box.

**Blast radius**: PC Storage tab and Underground tab; worsens with box size. Pure UX (no state loss).

**Fix sketch**: Capture `body.scrollTop` before the innerHTML rewrite and restore it after (or render rows into a stable container and diff). 

**Verification**: Manual: deposit from a scrolled-down position; confirm the list stays put.

---
severity: P3
category: dx
anchor_symbol: catch-system.test.js
current_line_hint: ~33
file: tests/integration/catch-system.test.js
agents: [story-mode-investigator]
fingerprint: 179018114bb7
confidence: high
status: open
---

**Title**: Integration test asserts stale "PC cap of 10" and never checks the real PC_BOX_CAP=30

**Evidence**:
```js
test('catch-system: PC cap of 10 is documented in STORY_MODE_FLOW.md', async () => {
  const flow = fs.readFileSync('STORY_MODE_FLOW.md', 'utf8');
  assert.match(flow, /cap\s+10|10\s+(slots|max|cap|mons)/i, 'spec must mention PC cap of 10');
});
```

**Repro**: `node --test tests/integration/catch-system.test.js`. The test passes, but the spec and code both now say cap 30 (`PC_BOX_CAP = 30`, STORY_MODE_FLOW.md "cap 30"). The test only matches because the spec retains historical "draft's 10" prose; it never reads the actual `PC_BOX_CAP` constant. This is false confidence — the test would not catch a real cap regression.

**Blast radius**: Test suite trustworthiness only (no shipping behavior). 

**Fix sketch**: Rename and re-point the test to assert the live `PC_BOX_CAP` value (load engine, read the constant) equals 30, and that the spec mentions cap 30.

**Verification**: Mutate `PC_BOX_CAP` locally; the corrected test should fail.

---
severity: P3
category: refactor
anchor_symbol: story-pc-tab-journal-btn
current_line_hint: ~6659
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9d3afadf5180
confidence: high
status: open
---

**Title**: Dead CSS selector for a #story-pc-tab-journal-btn that has no markup or handler

**Evidence**:
```css
#story-pc-tab-storage-btn, #story-pc-tab-underground-btn, #story-pc-tab-journal-btn {
```

**Repro**: `grep -nE "story-pc-tab-journal" battle.html` → only the CSS rule (~6659). The PC screen markup (~9031-9032) has only Storage and Underground tab buttons; `_pcRefresh`'s `_tabBtns` map and `pcSwitchTab` handle only those two. The journal tab button never existed in the rendered DOM (the signature/rivalry journal lives in Collection instead).

**Blast radius**: None at runtime — orphan selector. Cleanup / clarity only.

**Fix sketch**: Drop `#story-pc-tab-journal-btn` from the selector list.

**Verification**: grep confirms no remaining reference.

---
severity: P3
category: dx
anchor_symbol: _catchRender
current_line_hint: ~49332
file: battle.html
agents: [story-mode-investigator]
fingerprint: 71a1ae0137d8
confidence: medium
status: open
---

**Title**: Regular wild encounter with zero balls shows greyed buttons but no "out of balls" message

**Evidence**:
```js
// boss-only escape hatch / message:
const bossRetreat = (_catchState.bossMode && _totalBalls <= 0) ? ` ... Out of Poké Balls ... ` : '';
// regular subText, no zero-ball callout:
: 'Catch chance is the species rate times the ball you throw.';
```

**Repro**: Trigger a route wild catch screen with `sm.balls` all zero (reachable: encounters auto-fire between battles regardless of stock). All four ball buttons render `disabled`/greyed with no explanation; only the floating Run button works. No softlock (Run exits), but the screen gives no hint why throwing is impossible. Boss mode gets a dedicated "Out of Poké Balls. Stock up and return." line; regular wild does not.

**Blast radius**: Wild catch screen UX. Mild player confusion, no data loss.

**Fix sketch**: When `_totalBalls <= 0` on a non-boss/non-safari catch, swap `subText` (or add a banner) to "Out of Poké Balls — buy more at the Poké Mart, then come back." 

**Verification**: Manual: enter a wild catch with 0 balls; confirm the message appears.

---
severity: P3
category: inconsistency
anchor_symbol: migrateStoryPreV16
current_line_hint: ~34629
file: battle.html
agents: [story-mode-investigator]
fingerprint: 310b762487af
confidence: low
status: open
---

**Title**: Catch-tutorial migration hard-codes intro-rival index (>1) instead of deriving it

**Evidence**:
```js
function migrateStoryPreV16() {
    if (typeof sm.catchTutorialDone !== 'boolean') {
        sm.catchTutorialDone = (sm.eventIndex | 0) > 1;   // magic 1 = intro-rival array index
    }
}
```

**Repro**: The runtime gate `_shouldFireCatchTutorialBeforeBattle` derives the intro-rival position dynamically (`introIdx = STORY_EVENTS_RAW.findIndex(... row[0]===STORY_RIVAL_ROW_INTRO)`, currently index 1) and skips when `eventIndex <= introIdx`. The migration instead hard-codes `> 1`. Today they agree (intro rival is `STORY_EVENTS_RAW[1]`), but the magic literal duplicates a value owned by the timeline; if a future timeline edit shifts the intro rival's array position, a migrating save could get `catchTutorialDone` mis-set (re-firing or skipping the tutorial).

**Blast radius**: Pre-v16 save round-trips only; cosmetic tutorial re-fire/skip. Save-schema territory (pasteur) — flag, don't edit.

**Fix sketch**: Derive the cutoff the same way the runtime gate does (`introIdx` via findIndex) rather than the literal `1`.

**Verification**: save-migration.test.js: round-trip a pre-v16 save sitting exactly at the rival row; assert `catchTutorialDone` matches the runtime gate's expectation.

