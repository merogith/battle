---
severity: P1
category: bug
anchor_symbol: enterBattleEvent
current_line_hint: ~42373
file: battle.html
agents: [story-mode-investigator]
fingerprint: be6f0b9ce8fd
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
---

**Title**: proceedToNextBattle re-entry stacks duplicate cold-open overlays, wedging progression (the "After Badge One" stuck state)

**Evidence**:
`enterBattleEvent` fires a cold-open via `_runStoryColdOpen(beat, ev, onDone)`. The scene's per-run dedupe (`sm.scenesShown[metaKey]`) is only marked when the player clicks **Continue** (in `_renderNarrativeOverlay`'s `dismiss` / `_runStoryColdOpen`'s onPlayed). There is NO re-entry guard: calling `proceedToNextBattle()` again while the overlay is up re-enters `enterBattleEvent` → re-fires the same cold-open → appends ANOTHER full-screen `z-index:9998` overlay. Reproduced in jsdom:
```
after 1st proceed: overlays 1 | scenesShown[cold-classic-gym1]: false
after 2nd proceed: overlays 2 | scenesShown[cold-classic-gym1]: false
after 3rd proceed: overlays 3 | text: "Continue →","Continue →","Continue →"
```
Clicking Continue dismisses only the topmost; the rest remain stacked.

**Repro**: `node scripts/debug/_repro/coldopen-reentry.mjs`. Real-browser confirmation: `agent-state/playtest/player/021-final.png` shows the run terminally stuck on the "After Badge One" (`classic_gym1`, row 7) cold-open after badge 1, matching the user's report. The autopilot's `classify` reads `cityScreen: scr('screen-story-city')` = true (the city is visible *under* the overlay), so its pump calls `proceedToNextBattle()` every tick → 270 ticks of stacking.

**Blast radius**: Every cold-open beat (rows 7/20/26/33/48/53/56/64 per variant), the intro-rival cold-open, the catch screen, and `showBattleIntro` share the no-guard pattern. Any double-tap of a route/gym button, or any code path that calls `proceedToNextBattle`/`enterBattleEvent` while a blocking overlay is live, stacks overlays.

**Fix sketch**: Add a module-level re-entry latch (e.g. `_storyNavBusy`) set at the top of `proceedToNextBattle`/`enterBattleEvent` and cleared when the battle launches or the player returns to a hub; bail early if already busy. Alternatively, `_runStoryColdOpen` could no-op when an overlay with the same metaKey is already in the DOM.

**Verification**: Re-run `coldopen-reentry.mjs`; overlay count must stay at 1 across repeated `proceedToNextBattle()` calls.

---
severity: P2
category: bug
anchor_symbol: load
current_line_hint: ~32503
file: battle.html
agents: [story-mode-investigator]
fingerprint: 920d7e405954
confidence: high
status: open
---

**Title**: Pre-merge saves with partial unlockedGimmicks are not re-derived on load — Tera/Z silently withheld until next milestone win

**Evidence**:
The mechanics-unlock change (commit c4d6d55) makes all four gimmicks unlock together at badges>=5 via `slotsUnlocked = badges < 5 ? 0 : 4` — but this recompute lives ONLY in the battle-victory handler (`enterBattleEvent`, ~42749). `load()` (~32503) and the migration chain (v15–v21) never re-derive `sm.unlockedGimmicks` from `sm.badges`. A save written by the OLD per-badge drip (e.g. badges 6 → `['mega','dmax']`) loads unchanged:
```
After load: version 21 badges 6 unlockedGimmicks: ["mega","dmax"]
EXPECTED (post-merge, badges>=5): all 4 [mega,dmax,tera,z]
```
`_storyEnemyMechKeys` and `_mechForGimmickRoll` both read `sm.unlockedGimmicks` live, so Tera/Z capability is withheld from both player builds and enemy foes until the player wins the next milestone fight (which finally runs the new recompute).

**Repro**: `node scripts/debug/_repro/unlock-migration.mjs` — loads a `version:18` save, badges 6, `unlockedGimmicks:['mega','dmax']`; observe it stays partial after load.

**Blast radius**: Any player with an in-progress save (badges>=5) that crosses the v1.2.3 merge. Self-heals after one milestone victory, so non-catastrophic, but the headline feature (all-four-at-Colress) is silently absent for 1+ battles.

**Fix sketch**: Add a load-time/migration re-derivation: after migrations, recompute `sm.unlockedGimmicks = order.slice(0, sm.badges < 5 ? 0 : 4)` using the same `megaOn/dynaOn/teraOn/zOn` order. A `migrateStoryPreV22` is the natural home (the unlock-semantics change deserves a SAVE_VER bump anyway).

**Verification**: Re-run the repro; `unlockedGimmicks` should be `['mega','dmax','tera','z']` after load.

---
severity: P3
category: inconsistency
anchor_symbol: _SAFARI_GRADE_CURVE_BY_BADGES
current_line_hint: ~43547
file: battle.html
agents: [story-mode-investigator]
fingerprint: a2bb5974a473
confidence: high
status: open
---

**Title**: Safari curve key [3] ("first unlock") is dead code — Safari actually unlocks at 4 badges, so first visit uses the harsher [4] curve

**Evidence**: The Safari Zone action first appears on the hub row labeled `City5` (STORY_EVENTS_RAW row 28). The player reaches that hub with 4 badges (Gym Leaders 1-4 are behind it). But `_SAFARI_GRADE_CURVE_BY_BADGES` and its comment assume the first visit is at 3 badges — key `3` is labeled "first unlock @ City 4" (g4:35, the gentlest) but is never reached in normal play; the first visit uses key `4` (g4:25). Verified via repro.

**Repro**: `node scripts/debug/_repro/safari-citybadge.mjs` prints "Safari Zone first appears at row index 28 ... Badges the player has when first reaching this hub: 4".

**Blast radius**: Cosmetic/balance only. The intended "gentle first visit" (35% G4) is never delivered. Separately, the in-game help text (battle.html ~10640 / ~10661) and the curve comment say "City 4" while the timeline labels the hub "City5" — a naming inconsistency worth reconciling.

**Fix sketch**: Either open Safari one hub earlier (badges 3), or relabel the curve so key `4` carries the gentle first-visit weights and drop the unreachable `3` entry. Reconcile the City4/City5 naming.

**Verification**: Confirm `_safariGradeWeightsForBadges()` returns the intended first-visit weights at the badge count the player actually has on entry (4).
---
severity: P3
category: bug
anchor_symbol: migrateStoryPreV15
current_line_hint: ~32155
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1839297b78a2
confidence: high
status: open
---

**Title**: Pre-v15 saves get 0 Poké Balls instead of the intended 5 — migrateStoryPreV15 balls default is shadowed by the default sm object

**Evidence**: `migrateStoryPreV15` (~32155) intends to seed old saves with a starting ball kit:
```js
if (!sm.balls || typeof sm.balls !== 'object') sm.balls = { poke: 5, great: 0, ultra: 0, master: 0 };
```
But the module-singleton `sm` is initialized with `balls: { poke: 0, great: 0, ultra: 0, master: 0 }` (~32242). `load()` does `Object.assign(sm, d)`; a pre-v15 save predates the catch system and has NO `balls` field, so `sm.balls` retains the default `{poke:0}` object. The migration's `if (!sm.balls...)` is therefore false and the `poke:5` branch never runs.

**Repro**: `node scripts/debug/_repro/balls-migration.mjs` → loads a `version:8` save with no `balls` field; result is `{poke:0,...}` not `{poke:5,...}`.

**Blast radius**: Narrow — only genuine pre-v15 saves (predating the v15 catch/PC/balls schema). They start the post-migration session unable to catch until they buy/earn balls. Recoverable, not a crash.

**Fix sketch**: In `migrateStoryPreV15`, explicitly seed `sm.balls.poke = Math.max(5, sm.balls.poke|0)` (or detect the pre-v15 marker — e.g. absence of `sm.catchUnlocked` in the raw save `d`) rather than relying on `!sm.balls`. The same default-shadowing pattern affects any migration that uses `if (!sm.X)` for a field the default `sm` already initializes.

**Verification**: Re-run the repro; `sm.balls.poke` should be 5 after migrating a pre-v15 save.
---
severity: P2
category: bug
anchor_symbol: migrateStoryPreV15
current_line_hint: ~32163
file: battle.html
agents: [story-mode-investigator]
fingerprint: 685e7677fbe1
confidence: high
status: open
---

**Title**: Pre-v15 post-HoF saves are forced back through the Mystery Figure climax — postHofMysteryClimaxDone migration shadowed by default boolean

**Evidence**: Same root cause as the balls-default bug. `migrateStoryPreV15` (~32163) intends to spare already-finished saves from re-running the post-HoF climax:
```js
if (typeof sm.postHofMysteryClimaxDone !== 'boolean') {
    sm.postHofMysteryClimaxDone = !!(sm.bossArc && sm.bossArc.available);
}
```
But the default `sm` initializes `postHofMysteryClimaxDone: false` (~32247) — already a boolean. After `Object.assign(sm, d)` with a pre-v15 save lacking the field, the `typeof !== 'boolean'` guard is false, so the boss-arc-aware default never runs. A pre-v15 post-HoF save (bossArc.available) loads with `postHofMysteryClimaxDone:false`.

**Repro**: `node scripts/debug/_repro/posthof-migration.mjs` → `version:14` save, `bossArc.available:true`, no `postHofMysteryClimaxDone` field → loads as `false` (migration intended `true`).

**Blast radius**: Pre-v15 players who already beat the Hall of Fame and unlocked the Caged God arc. On load they are routed back into the post-HoF Mystery Figure climax (`processNextEvent` row 67 recovery, ~38440) instead of the post-game. Disruptive but not a crash; the climax is winnable.

**Fix sketch**: Detect the missing field on the RAW save `d` (e.g. `!('postHofMysteryClimaxDone' in d)`) rather than `typeof sm.X`, since the default `sm` always supplies the field. Audit every `migrateStoryPreV*` guard of the form `if (typeof sm.X !== ...)` / `if (!sm.X)` against the default `sm` object (~32226) — `balls`, `postHofMysteryClimaxDone`, and any field the default pre-populates are subject to the same shadowing.

**Verification**: Re-run the repro; `postHofMysteryClimaxDone` should be `true` after migrating a pre-v15 post-HoF save.
---
severity: P2
category: dx
anchor_symbol: classify
current_line_hint: scripts/debug/autopilot-player.mjs ~83
file: scripts/debug/autopilot-player.mjs
agents: [story-mode-investigator]
fingerprint: 2d43487ea456
confidence: high
status: open
---

**Title**: autopilot-player classify() treats a cold-open as a city — pump fires city actions instead of dismissing the overlay, masking/causing the stuck-on-"After Badge One" report

**Evidence**: `classify()` (autopilot-player.mjs ~line 81-83) sets `cityScreen: scr('screen-story-city')` and `catchScreen: scr('screen-story-catch') && ...`. Story cold-opens (`_renderNarrativeOverlay`) are full-screen `z-index:9998` divs appended to `<body>` that do NOT hide the underlying `screen-story-city`. So when a cold-open is up, `classify` reports `cityScreen:true`, the pump (line 306-310) takes the city branch and calls `proceedToNextBattle()` / clicks "Leave City" — never the cold-open's "Continue →". Combined with the game-side re-entry bug (separate finding), each tick re-fires the cold-open and stacks another overlay. The 22:07 run sat at evt 7 for 270 ticks; `021-final.png` shows the "After Badge One" cold-open with an unclicked "Continue →".

**Repro**: `node scripts/debug/autopilot-player.mjs` (or inspect `agent-state/playtest/player/021-final.png` + `player-transcript.txt`: 270 ticks at evt=7).

**Blast radius**: Test tooling only — but it means the autopilot cannot validate any cold-open beat (rows 7/20/26/33/48/53/56/64) or the post-badge route flow, so real progression regressions in that band go undetected.

**Fix sketch**: In `classify`, detect a live narrative/cold-open overlay (`document.querySelector('body > div[style*="z-index:99"] button')` matching `Continue|→`) and expose it as a distinct `coldOpen:true` flag that the pump dismisses with `forceClick(page, 'Continue|→')` BEFORE the city branch. The game-side re-entry latch (separate finding) is the more durable fix.

**Verification**: Re-run the autopilot; it should clear the "After Badge One" cold-open and reach the next wild/trainer instead of stalling.
---
severity: P3
category: balance
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~29385
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8b9a943876e8
confidence: low
status: open
---

**Title**: Hard mode still earns less gold per fight than Normal (1.00 vs 1.30) despite facing 1.15x-stronger foes — residual difficulty/economy asymmetry

**Evidence**: The prior-audit "Hard pays x0.92" was fixed — `storyDifficultyCoinMult()` now floors Hard at parity (1.00) and Challenge at 1.10:
```js
if (diff === 'normal') return 1.30;
if (diff === 'hard')   return 1.00;   // "floored at parity"
if (diff === 'challenge') return 1.10;
```
But Normal still pays 1.30 while Hard pays 1.00, so a Hard player earns ~77% of Normal's gold rate. Meanwhile `applyFoeDifficultyScaling` gives Hard foes 1.15x stats (Challenge 1.30x) and Hard/Challenge also get extra bench Revives (~49210) — i.e. harder, longer fights for less income. This is an intentional design choice (the comment says so), so flagging as low-confidence.

**Repro**: Inspect `storyDifficultyCoinMult` (~29385) vs `applyFoeDifficultyScaling` (~14085).

**Blast radius**: Story economy on Hard/Challenge. Tighter gold means fewer shop heals / tutor rerolls during the hardest stretch — may compound the difficulty rather than purely rewarding it.

**Fix sketch**: Consider raising Hard to ~1.15-1.30 (reward proportional to foe-stat bump) if the intent is "harder = more loot," or leave as-is if "harder = scarcer economy" is the deliberate stance. Documented decision either way.

**Verification**: Playtest gold trajectory on Hard vs Normal across the front half; confirm the intended relative economy.
---
severity: P2
category: dx
anchor_symbol: safari-zone.test
current_line_hint: tests/integration/safari-zone.test.js ~10
file: tests/integration/safari-zone.test.js
agents: [story-mode-investigator]
fingerprint: c05411e4ccb3
confidence: high
status: open
---

**Title**: safari-zone integration test gives false confidence — asserts stale hard-coded weights and matches "1.25" anywhere in the spec doc

**Evidence**: Two hollow assertions:
```js
test('safari-zone: grade weights g1:3 / g2:22 / g3:50 / g4:25 sum to 100', () => {
  const weights = { g1: 3, g2: 22, g3: 50, g4: 25 };   // hard-coded LITERAL, not from engine
  assert.equal(sum, 100, ...);                          // only checks 3+22+50+25===100
});
test('safari-zone: catch math 1.25× multiplier is documented', () => {
  const matches = flow.match(/1\.25/g);                 // matches "1.25" ANYWHERE in 74KB spec
  assert.ok(matches && matches.length > 0, ...);
});
```
Neither reads the engine. The live weights are `_SAFARI_GRADE_CURVE_BY_BADGES` (badge-keyed; the static `{3,22,50,25}` is the deleted pre-v19 value). The live multiplier is `SAFARI_BALL_MULT = 1.35` and the spec confirms 1.35 — but the test asserts "1.25", which only passes because that substring appears on an UNRELATED Frontier line (STORY_MODE_FLOW.md ~735 "1.25 + 0.045/r"). The test would still pass if `SAFARI_BALL_MULT` were changed to any value.

**Repro**: `node --test tests/integration/safari-zone.test.js` (passes), then compare against `battle.html` `_SAFARI_GRADE_CURVE_BY_BADGES` (~43547) and `SAFARI_BALL_MULT` (~44314).

**Blast radius**: Test tooling. The safari weights/multiplier have no real regression coverage; the run-engine-test SKILL advertises this file as covering "weights" but it does not.

**Fix sketch**: Read the actual constants from the loaded engine (expose `_SAFARI_GRADE_CURVE_BY_BADGES` / `SAFARI_BALL_MULT` via the test harness or `window`) and assert the shipped values; tighten the multiplier check to read `SAFARI_BALL_MULT` rather than substring-matching the spec doc.

**Verification**: Mutate `SAFARI_BALL_MULT` to 1.40 in a scratch copy — the fixed test must fail.
---
severity: P2
category: dx
anchor_symbol: catch-system.test
current_line_hint: tests/integration/catch-system.test.js ~33
file: tests/integration/catch-system.test.js
agents: [story-mode-investigator]
fingerprint: abac743596bd
confidence: high
status: open
---

**Title**: catch-system integration test asserts a stale "PC cap of 10" and passes on an incidental substring — same hollow-test pattern as safari-zone

**Evidence**: 
```js
test('catch-system: PC cap of 10 is documented in STORY_MODE_FLOW.md', async () => {
  assert.match(flow, /cap\s+10|10\s+(slots|max|cap|mons)/i, 'spec must mention PC cap of 10');
});
```
The shipped constant is `PC_BOX_CAP = 30` (battle.html ~43126) and the spec documents **30** (STORY_MODE_FLOW.md: "cap 30 (raised from the original draft's 10...)"). The test still passes only because the regex matches the substring "10 cap" inside that historical-context sentence. The test title and intent ("PC cap of 10") are stale and the assertion provides no real coverage of `PC_BOX_CAP`. The run-engine-test SKILL advertises this file as covering "PC overflow at 10/10" — also stale.

**Repro**: `node --test tests/integration/catch-system.test.js` passes; `grep -oE "10\s+(slots|max|cap|mons)|cap\s+10" STORY_MODE_FLOW.md` returns "10 cap" (from prose documenting cap 30).

**Blast radius**: Test tooling — together with the safari-zone test, indicates a systemic pattern of integration tests substring-matching the 74KB spec doc rather than reading engine constants. No real regression coverage for PC cap or safari weights/multiplier.

**Fix sketch**: Assert against the actual `PC_BOX_CAP` constant (expose via harness/window) — e.g. `assert.equal(PC_BOX_CAP, 30)` and verify the 6/6 + 30/30 overflow message path. Update the SKILL's claim ("PC overflow at 10/10") to 30/30.

**Verification**: Change `PC_BOX_CAP` to 25 in a scratch copy — the fixed test must fail.
---
severity: P1
category: bug
anchor_symbol: catchThrow
current_line_hint: ~45205
file: battle.html
agents: [story-mode-investigator]
fingerprint: fde69214ddbf
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Unique Master Ball can be wasted on any non-boss wild (Crucible wild encounter), soft-locking the Caged God capture — VERIFIED still present post-merge

**Evidence**: Ledger ISSUE-013, re-verified against current code. After the post-HoF Mystery Figure climax, the player is handed the one and only Master Ball immediately (~48954: `sm.balls.master = (sm.balls.master|0) + 1`) and told to go collect the 3 cage leads. While holding it, the post-game `crucibleWildEncounter()` (~43781) opens a normal catch screen, and `catchThrow('master')` (~45205) has NO boss/uniqueness guard:
```js
if (!sm.balls || (sm.balls[ballKey] | 0) <= 0) return;
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;   // master decremented like any ball
...
const chance = mult === Infinity ? 1 : ...;          // master = guaranteed catch on ANY wild
```
The Caged God catch uses `forcedCatchRate: 0.01` (~44225) — designed around the Master Ball's guaranteed catch. With the Master Ball spent on a Crucible wild, the player faces a ~1% catch rate on the unique boss → effective soft-lock of the run's apex reward.

**Repro**: Post-HoF → receive Master Ball → open Crucible → "Wild Encounter" → throw Master Ball at the wild (succeeds, consumes it) → collect leads → "Enter the Cage" → 1% catch rate, no Master Ball.

**Blast radius**: Post-game Caged God arc — the headline post-HoF reward (Subject Zero / 10,000G + full vitamin bundle).

**Fix sketch**: Hide/disable the Master Ball in the catch UI unless `_catchState.bossMode`, or block `catchThrow('master')` when `!_catchState.bossMode`. Alternatively re-grant the Master Ball at cage-unlock so it cannot be permanently lost.

**Verification**: Throw the Master Ball at a Crucible wild; the throw should be rejected (ball not offered) outside boss mode, and `sm.balls.master` should still be 1 at cage entry.
---
severity: P3
category: inconsistency
anchor_symbol: proceedToNextBattle
current_line_hint: ~41881
file: battle.html
agents: [story-mode-investigator]
fingerprint: a1eccebec359
confidence: medium
status: open
---

**Title**: proceedToNextBattle "no Pokémon" guard counts eggs (team.length) while the fight launch counts only fighters — egg-only party advances then bounces

**Evidence**: `proceedToNextBattle` (~41881) gates on raw party length:
```js
if (sm.team.length === 0) { window.showGameAlert('You have no Pokémon. Visit the Professor first.'); return; }
```
But eggs occupy a party slot (`isEgg:true`) and cannot battle, and the rest of the codebase counts fighters via `_storyCountFighters()` (`team.filter(s => s && !s.isEgg).length`) — including the actual fight launch (~42457: `if (_storyCountFighters() === 0) { ...; enterCity(); return; }`). An egg-only party (team.length 1, fighters 0) passes the `proceedToNextBattle` guard, advances `sm.eventIndex` to the battle, fires the cold-open and route wilds, then is bounced back to the city by the `startFight` guard — and the eventIndex has already been advanced. (Combined with the cold-open re-entry bug, the bounce can stack overlays.)

**Repro**: Set a party to a single egg slot, call `StoryMode.proceedToNextBattle()` — it advances/bounces instead of warning up front. Egg-only is hard to reach via UI (deposit/daycare guard the last fighter via a DISABLED button, but `_daycareDropOff`'s handler ~40054 lacks the `lastInParty` re-check that `evoLabEvolve` and friends have), so this is defense-in-depth rather than a confirmed live path.

**Blast radius**: No-Pokémon edge handling; consistency of the fighter-count contract.

**Fix sketch**: Use `_storyCountFighters() === 0` in `proceedToNextBattle` (and add the `lastInParty` guard inside `_daycareDropOff` to match the disabled-button gate).

**Verification**: With an egg-only party, `proceedToNextBattle` should warn and NOT advance the eventIndex.
