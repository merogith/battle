---
severity: P1
category: balance
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~42527
file: battle.html
agents: [story-mode-investigator]
fingerprint: a7a89682fc13
confidence: high
status: open
---

**Title**: Two Master Ball sources collide — villain-track boss (Road 7, pre-HoF) + post-HoF broker = 2 per run

**Evidence**:
```js
// _storyGrantTrackEndReward (live, fired from onBattleEnd victory hook @48130)
if (/^villain\.[a-zA-Z]+\.boss$/.test(sk)) {
    if (!sm.balls) sm.balls = { poke:0, great:0, ultra:0, master:0 };
    sm.balls.master = (sm.balls.master | 0) + 1;   // villain boss => +1 Master Ball
// AND continuePostGame @54865 (the §9 Caged-God path):
//   if (!sm.bossArc.available) { ...; sm.balls.master = (sm.balls.master | 0) + 1; }
```

**Repro**: Harness — `grantTrackEndReward({sceneKey:'villain.rocket.boss'})` then the `continuePostGame` `!bossArc.available` branch ⇒ `sm.balls.master === 2`. The villain boss beat resolves to road7 (array idxs 47–52), strictly PRE-HoF (HoF is array idx 65).

**Blast radius**: STORY_MODE_FLOW §6/§9 ("Master Ball ×1 from the boss arc", "1 per run") and the dex-100 milestone comment ("keeping the Master Ball uniquely tied to the Caged God arc") all assume exactly one Master Ball. A pre-HoF Master Ball also defeats §3's roaming-legendary design ("a Master Ball is the only guaranteed throw" — written assuming the player has none yet), letting the player guaranteed-catch a roaming sub-legendary mid-run, and leaves a spare for the Caged God.

**Fix sketch**: Decide the canon: either (a) the villain-boss reward should NOT be a Master Ball (use Ultra Balls / a trophy, like the dex-100 milestone deliberately does), or (b) the post-HoF broker grant should be conditional on `sm.balls.master === 0`. Option (a) preserves the boss-arc's "one Master Ball" identity; option (b) double-counts the villain boss as the source.

**Verification**: A full run that clears the villain track then enters the post-game should end with `sm.balls.master <= 1` (minus any spent).

---
severity: P2
category: refactor
anchor_symbol: _buildUnifiedStoryEvents
current_line_hint: ~42469
file: battle.html
agents: [story-mode-investigator]
fingerprint: 19a080eb1e8e
confidence: high
status: open
---

**Title**: Dormant "unified flow engine" is now triple-orphaned — live dispatch is a 3rd design that leapfrogged it

**Evidence**:
```js
// _buildUnifiedStoryEvents / _unifiedResolveRow + sm.flowSeen ledger:
//   referenced ONLY by window.__storyTest (lines 38082-38085). Never wired.
//   sm.flowSeen is NOT in sm defaults and no migration seeds it.
// LIVE dispatch instead: processNextEvent @43079 -> _tryFireRoadStoryBeats ->
//   _resolveActiveRoadBeats -> _playStoryBeatQueue, deduped via sm.storyEventsFired.
```

**Repro**: `grep -n "_unifiedResolveRow\|_flowMarkSeen" battle.html` → only declarations + the test-harness surface. `grep -c storyEventsFired` → 11 live hits (the real ledger).

**Blast radius**: The Wave-1 framing ("new unified engine waiting to replace legacy") is stale. Reality: the live path is the v22 3-track `storyEventsFired` dispatch — a THIRD design that postdates BOTH the legacy dispatch AND the unified scaffolding. The unified resolver only reproduces *legacy* road-dump/inject (proven identical for arr30/arr63 in harness), so anyone who "finishes the P2 swap" to it would silently REGRESS the 3-track villain/extra/boss-config features that only the live path knows about. ISSUE-077 understates this.

**Fix sketch**: Delete `_buildUnifiedStoryEvents`/`_unifiedResolveRow`/`_flowSeen`/`_flowMarkSeen` + their `__storyTest` handles + `sm.flowSeen`. They are dead and actively misleading. If a unification is still wanted, it must be built against the live 3-track resolver, not the legacy one.

**Verification**: After deletion, `npm run test:integration` story suites still pass (the unified engine has no live caller).

---
severity: P2
category: dx
anchor_symbol: _shouldFireCatchTutorialBeforeBattle
current_line_hint: ~46940
file: battle.html
agents: [story-mode-investigator]
fingerprint: 771f1e021e9c
confidence: high
status: open
---

**Title**: Catch-tutorial gate comment claims "starting kit gives 5 balls" — fresh-run kit is actually 0

**Evidence**:
```js
// Player must have at least one Poké Ball (starting kit gives 5,
// so this is just a safety net).
const balls = sm.balls || {};
const totalBalls = (balls.poke | 0) + (balls.great | 0) + ...;
if (totalBalls <= 0) return false;   // tutorial silently NO-OPs at 0 balls
```

**Repro**: Fresh-run init (`@39514`) sets `balls:{poke:0}`. The 5 balls come only from the mandatory City-0 Mart welcome scene (`firstMart.onContinue` ⇒ `_storyGrantBundle({pokeBall:5})`). The comment misattributes the source to the run kit.

**Blast radius**: The catch tutorial AND `catchThrow` (`@50940`, which hard-requires `sm.balls[k] > 0`) both depend entirely on the forced City-0 Mart gate (`_isFacilityRequiredHere(0,'mart')` ⇒ true) firing before the intro rival. Confirmed safe in normal flow (Mart precedes intro rival at array idx 1, and the welcome grant re-fires every run via per-run `sm.scenesShown`). But the latent coupling is undocumented at the gate: if the Mart force-gate were ever weakened or a variant/skip path bypassed it, the tutorial would silently no-op (0 actionable buttons, Run hidden in tutorialMode, no bossRetreat escape) — a screen with nothing to click.

**Fix sketch**: Either (a) seed `balls:{poke:5}` in fresh-run init (`@39514`) to match the v15-migration default and the spec §1/§10, making the kit self-sufficient and the comment true; or (b) fix the comment to state the 5 balls come from the mandatory first-Mart visit and add an assertion/guard that the catch screen never renders with 0 throwable balls in non-boss mode.

**Verification**: Set fresh sm to post-intro-rival row with `balls:{poke:0}` and confirm the catch screen is never reachable without a Run/exit affordance.

---
severity: P3
category: inconsistency
anchor_symbol: newStoryRun
current_line_hint: ~39514
file: battle.html
agents: [story-mode-investigator]
fingerprint: 62820f39b02f
confidence: high
status: open
---

**Title**: Fresh runs start with 0 Poké Balls; spec §1/§10 say 5 (only migrated saves get 5)

**Evidence**:
```js
balls: { poke: 0, great: 0, ultra: 0, master: 0 },   // fresh-run init @39514
// vs migrateStoryPreV15 @35260: sm.balls = { poke: 5, ... } (migrated saves only)
// vs spec §10 sm-defaults: balls: { poke: 5, ... }
```

**Repro**: Harness fresh `StoryMode.state.balls` ⇒ `{poke:0,...}`. v14-save round-trip ⇒ `{poke:5,...}`. Asymmetry between fresh and migrated.

**Blast radius**: Cosmetic/spec-drift today because the mandatory first-Mart grant covers it (see prior finding). Extends ISSUE-291 (which only covered the migration side) to the fresh-run side. The two ball-init paths disagree with each other and with the spec.

**Fix sketch**: If the design intent is "balls come from the Mart, not the kit" (which the firstMart scene implies), update spec §1/§10 and the v15 migration to `poke:0` for consistency. If the intent is "kit has 5", set fresh-run init to `poke:5`. Pick one.

**Verification**: Fresh and migrated `sm.balls.poke` agree, and match the spec.

---
severity: P3
category: inconsistency
anchor_symbol: _wildGradeWeightsForCity
current_line_hint: ~50174
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6fa4b2cf1847
confidence: high
status: open
---

**Title**: Wild grade keyed on CITY (STORY_WILD_GRADE_BY_CITY), not badges — spec §3/§15f say _WILD_GRADE_CURVE_BY_BADGES (which does not exist)

**Evidence**:
```js
const STORY_WILD_GRADE_BY_CITY = [ ... ];        // @50164
function _wildGradeWeightsForCity(city) { ... }   // @50174
// grep _WILD_GRADE_CURVE_BY_BADGES -> 0 hits in code (only in the doc)
```

**Repro**: Harness `wildGradeWeightsForCity(0..8)` ⇒ city0/1/2 pure g4, ramping to g2 leak at city6+. The function takes a **city index**, not badges.

**Blast radius**: STORY_MODE_FLOW §3 ("badge-keyed wild grade curve `_WILD_GRADE_CURVE_BY_BADGES`") and §15f (lists a per-badge G2-leak ramp) both name a badges-keyed symbol that doesn't exist. City and badges are near-1:1 in the main timeline, so the live behavior is close to intended — but the spec's named anchor is wrong and the keying axis differs (a player who deposits to PC / loses no badges still advances wild grade by city). Confirms ISSUE-105/ISSUE-223.

**Fix sketch**: Either rename the doc references to `STORY_WILD_GRADE_BY_CITY`/`_wildGradeWeightsForCity` and the "city-keyed" axis, or (if badges is the intended invariant per §12's "drop sm.team.length, use sm.badges") re-key the function on `sm.badges`. Maintainer owns the axis choice.

**Verification**: Doc anchor resolves via `symbol-index --lookup`; keying axis matches §12 intent.

---
severity: P2
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~34578
file: battle.html
agents: [story-mode-investigator]
fingerprint: e8bc3184fc4b
confidence: high
status: open
---

**Title**: SAVE_VER=23 but migration chain stops at PreV22 — no migrateStoryPreV23 step (v23 added wanderByEventIdx, back-filled unconditionally)

**Evidence**:
```js
// v23 (Wander Around) only ADDED sm.wanderByEventIdx ... so it intentionally
// has no migrateStoryPreV23 ... The chain's last versioned step is migrateStoryPreV22.
const SAVE_VER = 23;
// load(): last versioned migrate is `if (_loadedVer < 22) migrateStoryPreV22()`.
```

**Repro**: `grep migrateStoryPreV23 battle.html` → 0. `wanderByEventIdx` is seeded by an unconditional back-fill (`@35640`), so a v22 save loads clean — but the bump-without-step is undocumented in the version-gated chain itself.

**Blast radius**: Benign today (additive field, idempotent back-fill, round-trip verified clean v14→v23). But the pattern (bump SAVE_VER, rely on an unconditional back-fill instead of a gated step) recurs — see ISSUE-176 (v19→v20 cleanup), and the v20-cleanup that reads `d.version` directly (`@35670`). It makes the chain hard to audit: the gated ladder no longer tells the full story of what each version changed. The comment is the only record.

**Fix sketch**: Either add a no-op/documenting `if (_loadedVer < 23) { /* wanderByEventIdx back-filled below */ }` gate for symmetry, OR add a boot-time shadow-validation (ISSUE-140) that asserts every field in `sm` defaults is present after a synthetic round-trip from each historical version. Low priority; the round-trip is currently correct.

**Verification**: A v22 save loads to a v23 sm with `wanderByEventIdx` present and no field gaps.

---
severity: P3
category: refactor
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~33146
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5cb29622c552
confidence: high
status: open
---

**Title**: Mystery Figure rotating-cast scaffolding is now vestigial — collapsed to a single hard-locked identity "the_first"

**Evidence**:
```js
const MYSTERY_FIGURE_IDENTITIES = { the_first: { sprite:'Red', ... } }; // 1 entry
function _storyPickMysteryIdentity() { return 'the_first'; }           // always
function _storyEnsureMysteryIdentity() { if (sm.mysteryIdentity !== 'the_first') sm.mysteryIdentity = 'the_first'; ... }
```

**Repro**: Both functions are constant. The `sm.mysteryIdentity` save field, the picker, the rotation machinery, and the `'Cyrus'` fallback at `@43548` are all dead state around a single value.

**Blast radius**: Design churn. The v22 3-track collapse intentionally retired the 10-identity rotation (ISSUE-169 "Cyrus hardcode" and ISSUE-295 "rotating cast fixed" are now BOTH moot — there's deliberately one identity). No bug, but the leftover plumbing (per-run `mysteryIdentity` field, `_storyPickMysteryIdentity`, the `MYSTERY_FIGURE_IDENTITIES[sm.mysteryIdentity]` indirection) implies a rotation that no longer exists and will mislead the next reader. Flagging as the "one discovery per surprise."

**Fix sketch**: Either inline `the_first` and drop `sm.mysteryIdentity`/the picker, or (if a future rotation is planned) leave a one-line comment that the single-entry map is intentional and rotation is deferred. Currently neither is signposted at the call sites.

**Verification**: Reading the city-hub Mystery sprite path makes the single-identity intent obvious.

---
severity: P3
category: inconsistency
anchor_symbol: _playStoryBeatQueue
current_line_hint: ~42429
file: battle.html
agents: [story-mode-investigator]
fingerprint: bfb866b472f0
confidence: medium
status: open
---

**Title**: League-road narrative "clumping" — 6 story beats fire back-to-back before the Champion (the audit §4 flow bug, still unfixed in the live path)

**Evidence**:
```js
// _tryFireRoadStoryBeats -> _resolveActiveRoadBeats returns ALL unfired event
// beats for the road; _playStoryBeatQueue plays them sequentially with a
// Continue between each. Harness arr63 (league road):
//   LIVE-events = [main.event6, main.event7, main.event8, main.event9, main.mfReveal, main.ending]
```

**Repro**: Harness `resolveActiveRoadBeats('league')` ⇒ 6 event beats dumped at once. The unified-engine header comment itself lists "clumping" + "ending-before-climax" as audit §4 flow bugs that "land as one isolated edit to the resolver at P4" — but P4 was never done, and the live path (a different resolver) has the same clumping.

**Blast radius**: UX pacing only (6 consecutive Continue-prompt overlays on the final road), not a crash. The `.ending` auto-depends-on-`.boss` fix exists ONLY in the dormant unified resolver's `requires` metadata (`@42475`), which is never consulted by the live `_resolveActiveRoadBeats`. So the documented ending-before-climax guard is stranded in dead code.

**Fix sketch**: If the §4 fixes are still wanted, port the `requires`-style ordering + per-slot granularity into the LIVE `_resolveActiveRoadBeats`/`_playStoryBeatQueue`, not the dormant resolver. Otherwise document that road-level clumping is accepted.

**Verification**: Walking the final road shows beats paced across battles, or a single documented decision that clumping is intended.

---
severity: P3
category: bug
anchor_symbol: catchThrow
current_line_hint: ~50938
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7856b112bcd7
confidence: medium
status: open
---

**Title**: Catch tutorial relies on inventory balls — tutorial throw consumes a real Poké Ball, not special-cased free despite "on the house" copy

**Evidence**:
```js
} else {                                  // non-safari throw (incl. tutorialMode)
    if (_catchState.safariMode) return;
    if (!sm.balls || (sm.balls[ballKey] | 0) <= 0) return;   // requires + decrements
    sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;
}
// firstMart copy & tutorial copy both say the first throw is "on the house".
```

**Repro**: The tutorial sets `forcedCatchRate:1.0` but does NOT bypass the ball requirement/decrement. With 0 inventory balls every ball button renders `disabled` (`canThrow=have>0` @50796) and Run is hidden in tutorialMode (@50647) — no actionable control. (The gate `_shouldFireCatchTutorialBeforeBattle` no-ops at 0 balls, so this only bites if the gate is reached with balls=0 via a future bypass.)

**Blast radius**: Couples the tutorial's correctness to inventory state. Tutorial copy ("This first throw is on the house") implies a free throw, but it actually spends one of the player's 5 Mart balls. Minor: player ends the tutorial with 4 balls, not 5, despite the "on the house" framing.

**Fix sketch**: In tutorialMode (and only there), skip the `sm.balls` requirement+decrement so the scripted first throw is genuinely free, matching the copy — and so the screen can never present zero throwable buttons.

**Verification**: Complete the catch tutorial; confirm `sm.balls.poke` is unchanged at 5 afterward.

---
severity: P3
category: inconsistency
anchor_symbol: _showOrientationTipThenCity
current_line_hint: ~54880
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8bf7bfeb549b
confidence: medium
status: open
---

**Title**: Post-HoF orientation tip frames the Mystery Figure as un-fought, but row-67 climax already unmasked "The First" moments earlier

**Evidence**:
```js
'🚪 The Mystery Figure — the Crucible\'s Mystery button summons one final
 masked challenger. The mask doesn\'t come off until you win.'
// shown by continuePostGame AFTER the row-67 postHofMystery climax fight resolved.
```

**Repro**: `continuePostGame` routes through the row-67 Mystery Figure climax first (sets `postHofMysteryClimaxDone`), THEN — on the same call's fall-through — shows this tip telling the player to go fight the still-"masked" challenger via the Crucible. Confirms ISSUE-227 still present.

**Blast radius**: Narrative-consistency only. The player just beat and unmasked The First; the tip re-mystifies it ("the mask doesn't come off until you win"). The Crucible Mystery encore is a *rematch*, but the copy reads as a first encounter.

**Fix sketch**: Reword to frame the Crucible Mystery button as a rematch ("face The First again") once `postHofMysteryClimaxDone` is set.

**Verification**: Post-HoF tip wording acknowledges the climax already happened.

---
severity: P3
category: dx
anchor_symbol: migrateStoryPreV16
current_line_hint: ~35291
file: battle.html
agents: [story-mode-investigator]
fingerprint: bb39f6bc2e99
confidence: medium
status: open
---

**Title**: catchTutorialDone migration hard-codes `eventIndex > 1` instead of deriving the intro-rival array index

**Evidence**:
```js
function migrateStoryPreV16() {
    if (typeof sm.catchTutorialDone !== 'boolean') {
        sm.catchTutorialDone = (sm.eventIndex | 0) > 1;   // magic "1"
    }
}
```

**Repro**: The intro rival is at array idx 1 (verified in harness), so `> 1` is correct *today*. But `_shouldFireCatchTutorialBeforeBattle` derives the same boundary dynamically (`STORY_EVENTS_RAW.findIndex(... rowId===STORY_RIVAL_ROW_INTRO)`). The migration uses a literal; a timeline shift would desync them. Confirms ISSUE-292/293.

**Blast radius**: Latent. Any future insertion of a row before the intro rival shifts its array index past 1 and the v16 migration would wrongly mark `catchTutorialDone` for saves parked at the new pre-rival rows (or skip it). Only fires for `_loadedVer < 16` saves, so the live blast radius shrinks over time.

**Fix sketch**: Derive the boundary in the migration the same way the gate does: `const introIdx = STORY_EVENTS_RAW.findIndex(r => r && r[1]==='Battle' && (r[0]|0)===STORY_RIVAL_ROW_INTRO); sm.catchTutorialDone = (sm.eventIndex|0) > introIdx;`

**Verification**: Migration boundary matches `_shouldFireCatchTutorialBeforeBattle`'s computed introIdx.

---
severity: P3
category: inconsistency
anchor_symbol: STORY_RIVAL_ROW_INTRO
current_line_hint: ~33665
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8b2bced8d3b7
confidence: high
status: open
---

**Title**: Spec/mandate says timeline is "68 rows"; STORY_EVENTS_RAW has 67 (array idx 0–66), and rowId 68 is the intro Rival at array idx 1

**Evidence**:
```js
const STORY_RIVAL_ROW_INTRO = 68;   // a ROW ID, not an array index
// STORY_EVENTS_RAW.length === 67 (City rows + 49 Battle + 1 HoF), array idx 0..66.
// Mystery Figure = rowId 67 = array idx 66 (the last row).
```

**Repro**: Harness: `STORY_EVENTS_RAW.length === 67`; intro Rival (rowId 68) at array idx 1; Mystery Figure (rowId 67) at array idx 66. The agent mandate ("68 rows"), STORY_MODE_FLOW §1 ("67 rows / idx 0–66, unchanged" — itself self-inconsistent with the "68 rows" framing elsewhere), and ISSUE-185 all collide.

**Blast radius**: Documentation/anchor hygiene. Row IDs (`ev[0]`) are NOT array indices — `GYM_CITY_LEADER_EVENT`, the Mystery-Figure dispatch, and several migrations correctly key on array index via `findIndex`, but a reader conflating the two (e.g. the spec's "row 67 Mystery Figure" which is array idx 66) can mis-anchor. Confirms ISSUE-185.

**Fix sketch**: Standardize the docs on "67 timeline rows; row IDs are non-contiguous labels (intro Rival = id 68), array index ≠ row id". Update the mandate's "68 rows".

**Verification**: Spec row-count and the id-vs-index distinction match the harness numbers above.

---
severity: P3
category: dx
anchor_symbol: catchUnlocked
current_line_hint: ~35349
file: battle.html
agents: [story-mode-investigator]
fingerprint: a461bb932f94
confidence: high
status: open
---

**Title**: sm.catchUnlocked written by defaults + v15 migration + newStoryRun but read nowhere (live gate is sm.catchTutorialDone)

**Evidence**:
```js
catchUnlocked: false,                  // sm defaults @35349, newStoryRun @39516
if (typeof sm.catchUnlocked !== 'boolean') sm.catchUnlocked = false;  // v15 migrate
// grep: 0 reads. Spec §10 marks it RESERVED/LEGACY ("written but never read").
```

**Repro**: `grep -n catchUnlocked battle.html` → 3 writes, 0 branches. Confirms ISSUE-250.

**Blast radius**: None functional — it's documented dead state. Flagged so it isn't mistaken for a live gate; the catch/route gate is `sm.catchTutorialDone`. The spec already calls it out, so this is a "leave-it-or-delete-it" cleanup, not a bug.

**Fix sketch**: Optional — delete the field + its three writes, or keep per the spec's RESERVED note. No behavior change either way.

**Verification**: After removal, no reference remains and the catch flow (gated on `catchTutorialDone`) is unaffected.

---
severity: P3
category: dx
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~42546
file: battle.html
agents: [story-mode-investigator]
fingerprint: d683843c4c03
confidence: medium
status: open
---

**Title**: Extra-track raid EXP-Share reward + boss BOSS_MECHANICS are partly data-only — engine wiring deferred (mechanics are no-ops that only record)

**Evidence**:
```js
// BOSS_MECHANICS: "each mechanic is a no-op that records its activation —
//   the data is authoritative + ready to consume" (engine hooks "live in a polish PR").
// _storyGrantTrackEndReward extra raid: grants sm.inventory.expShareVoucher;
//   "the full grateful-NPC delivery scene is pasteur's to author (B33)".
```

**Repro**: `BOSS_CONFIGS`/`BOSS_MECHANICS` push entries onto `battle._mechanics` but the turn-loop hooks that consume them are stubbed (`_storyBossMechanicsTurnTick` exists but the activation is record-only). The villain/extra boss "phases" (surge/immunity/heal banners) are largely cosmetic until the polish PR lands.

**Blast radius**: The 3-track villain/extra bosses advertise escalating FAINT-count / HP-threshold phases (per BOSS_CONFIGS prose) but the mechanical effect is incomplete — players may see banners ("NO WITNESSES", "PRIMAL HEAT") without the corresponding stat/field change firing. This is in-scope story content (not Crucible/Frontier).

**Fix sketch**: Track which BOSS_CONFIGS effects are live vs telegraph-only; either finish the turn-loop wiring or downgrade the prose so banners that don't yet do anything aren't shown as mechanics.

**Verification**: A villain-boss fight at the faint thresholds shows the advertised stat/field effect, not just the banner.

---
severity: P3
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30629
file: battle.html
agents: [story-mode-investigator]
fingerprint: 562a9e06fc9e
confidence: medium
status: open
---

**Title**: STORY_MODE_FLOW §4 still specs the flat Safari weights g1:3/g2:22/g3:50/g4:25; live code is a badge curve (_SAFARI_GRADE_CURVE_BY_BADGES)

**Evidence**:
```js
const _SAFARI_GRADE_CURVE_BY_BADGES = {
  3: { g1:0, g2:5,  g3:60, g4:35 }, ... 8: { g1:5, g2:50, g3:40, g4:5 }
};
// STORY_MODE_FLOW §4: "SAFARI_GRADE_WEIGHTS g1:3 / g2:22 / g3:50 / g4:25"
```

**Repro**: §4 and §15g of the SAME spec disagree — §4 keeps the old flat table, §15g documents the badge curve that actually ships. The mandate's "verify weights g1:3/g2:22/g3:50/g4:25" matches the stale §4. Confirms ISSUE-223.

**Blast radius**: Doc-internal inconsistency. Live Safari is a badge curve (city4 = badges 3 = {g2:5,g3:60,g4:35}); a reader trusting §4 would mis-tune. Other Safari constants (MAX_ENCOUNTERS 6, BALLS_PER_SESSION 15, BALL_MULT 1.35, ENTRY_COST 10000) all match spec.

**Fix sketch**: Update §4's Safari-weights row to reference `_SAFARI_GRADE_CURVE_BY_BADGES` / point to §15g, or fold §15g's table into §4 so there's one source of truth.

**Verification**: §4 and §15g agree on the live Safari weights.

