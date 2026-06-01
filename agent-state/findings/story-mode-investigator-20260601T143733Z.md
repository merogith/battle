---
agent: story-mode-investigator
generated: 20260601T143733Z
scope: Story mode normal-difficulty flow-smoothness audit (verified against current battle.html)
---

# Findings — story-mode-investigator (20260601T143733Z)

---
severity: P2
category: bug
anchor_symbol: getStoryDisplayTownNameForCityRow
current_line_hint: 44238-44246 (also updateHUD 43275-43277)
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4becfea84542
confidence: high
domain: pasteur
status: open
---

**Title**: City-3 HUD/route name falls back to "City 3" — GYM_CITY_LEADER_EVENT array-index keys trainerAssignments (row-id keyed)

**Evidence**:
```js
// GYM_CITY_LEADER_EVENT (battle.html:32985) stores the ARRAY INDEX i:
if (m) out[parseInt(m[1], 10)] = i;            // City3 -> arrIdx 17
// getStoryDisplayTownNameForCityRow (44244) & updateHUD (43275) key by it:
const leaderEvIdx = GYM_CITY_LEADER_EVENT[cityIdx];        // 17
const leaderName  = sm.trainerAssignments[leaderEvIdx];    // BUT trainerAssignments is keyed by ROW-ID
// assignTrainers keys by row-id: sm.trainerAssignments[idx] where idx = ev[0]  (Gym Leader 3 row-id = 18)
```

**Repro**: jsdom harness — for City3 the GL3 leader lives at array index 17 but carries row-id 18 (the Rival row 12 is interleaved at arrIdx 18, shifting GL3). `GYM_CITY_LEADER_EVENT[3]=17`, but the GL3 name is stored under `trainerAssignments[18]`. `trainerAssignments[17]` is the *Gym Trainer 1* name, which is absent from `GYM_LEADER_CITY_NAMES`, so both `updateHUD` and `getStoryDisplayTownNameForCityRow` fall through to the generic `'City 3'`. Verified via boot script: for cities 1,2,4–8 arrIdx==rowId (coincidentally), so City 3 is the lone victim.

**Blast radius**: HUD city title at City 3, the "→ Set Out for <town>" route button label that names City-3's town, and any other `getStoryDisplayTownNameForCityRow` consumer. Cosmetic only — no progression impact. (Prior-audit ISSUE-132; re-verified STILL PRESENT in current code.)

**Fix sketch**: Either build `GYM_CITY_LEADER_EVENT` to store row-ids (`out[...] = row[0]`) so the `trainerAssignments` lookup matches, or convert the array-index to a row-id at the lookup site (`STORY_EVENTS_RAW[leaderEvIdx][0]`). One-line fix in two call sites.

---
severity: P2
category: bug
anchor_symbol: proceedToNextBattle
current_line_hint: 46744 (set), 43173 + 47559 (only releases)
file: battle.html
agents: [story-mode-investigator]
fingerprint: c69ad43dcc8c
confidence: medium
domain: engine
status: open
---

**Title**: `_storyBattleEntryBusy` can latch true on a cold-open / beat-scene continuation throw → soft-locks "Enter Gym / Continue Route"

**Evidence**:
```js
// proceedToNextBattle sets the guard (46744): _storyBattleEntryBusy = true;
// It is released in EXACTLY two places:
//   enterCity   (43173):   _storyBattleEntryBusy = false;
//   launchBattle(47559):   _storyBattleEntryBusy = false;
// The cold-open continuation swallows a throw WITHOUT releasing:
scene.run(ev, () => { if (tip) _storyRunSceneMark(tip);
    try { onPlayed && onPlayed(); }                       // onPlayed = enterBattleEvent(ev,..,true)
    catch (e) { console.error('[Story] cold-open onPlayed threw:', e); } });   // <-- flag stays true
// Same pattern in the beat-scene continuation (47357-47360).
```

**Repro**: Drive `proceedToNextBattle` into a Battle row whose cold-open/beat-scene continuation throws synchronously before reaching `launchBattle` (e.g. a corrupt trainer roll). The flag stays `true`; every later `proceedToNextBattle` hits `if (_storyBattleEntryBusy) { _storyWarnInteractionBusy(); return; }` and shows "Finish your current action first." — wedged until reload. (`showBattleIntro`/`showVictoryOverlay` callbacks already self-recover to a city, but the cold-open/beat-scene continuations do not.)

**Blast radius**: Any gym entry / route advance after the throw. Low probability (requires an exception on the cold-open/beat continuation path), but the failure mode is a hard progression wedge with no in-game recovery.

**Fix sketch**: Wrap the `proceedToNextBattle` body so the flag is released in a `finally`, OR add `_storyBattleEntryBusy = false;` to the catch blocks of `_runStoryColdOpen`'s `onPlayed` wrapper and `_playStoryBeatScene`'s continuation. Cheapest: have those two catch blocks route to `enterCity()` (which releases) on throw, mirroring the victory/intro overlays.

---
severity: P2
category: bug
anchor_symbol: catchThrow
current_line_hint: 50628-50630 (no boss-only guard); cage at 49400 forcedCatchRate 0.01
file: battle.html
agents: [story-mode-investigator]
fingerprint: 52588cec9516
confidence: high
domain: engine
status: open
note: post-HoF / boss-arc (Crucible-adjacent) — out of strict normal-Story scope, but explicitly in this agent's Tier-2 mandate
---

**Title**: Unique Master Ball is spendable on any regular wild → Caged God capture becomes a 1%-per-throw grind

**Evidence**:
```js
// catchThrow (50626-50630): no boss-only restriction on the master ball
} else {
    if (_catchState.safariMode) return;
    if (!sm.balls || (sm.balls[ballKey] | 0) <= 0) return;
    sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;     // ballKey 'master' decremented anywhere
}
// _CATCH_BALL_MULT['master'] === Infinity → guaranteed catch on ANY wild.
// bossEnterCage (49400): enterCatchEncounter(enc, ..., { boss:true, forcedCatchRate: 0.01 });
```

**Repro**: In any normal wild / roaming / Safari catch screen, throw the Master Ball — it is consumed and auto-catches. The Caged God (post-HoF) then sits at 1% per throw with no Master Ball left. (Prior-audit ISSUE-027/028; re-verified STILL PRESENT.)

**Blast radius**: Post-game Caged God arc capture pacing. Not a hard lock (1% will eventually land), but the "Master Ball is the intended answer" design is defeated by a single misclick on a route Pidgey.

**Fix sketch**: Gate Master-Ball selection — either hide/disable the Master Ball button in non-boss catch screens, OR add a confirm ("Use your only Master Ball on a wild <name>?") when `ballKey==='master' && !_catchState.bossMode`. Boss-arc throws keep it free.

---
severity: P2
category: inconsistency
anchor_symbol: isPreLeagueLegendaryMysteryGate
current_line_hint: 33088-33092; gate firing 43334-43338, 45838-45850
file: battle.html
agents: [story-mode-investigator]
fingerprint: 567292b036c3
confidence: high
domain: pasteur
status: open
---

**Title**: City-8 "Required" legendary handoff silently downgrades to a normal Professor gift when the party is below cap

**Evidence**:
```js
// The legendary-mystery branch requires BOTH the gate AND a full party:
_profMysteryMode = isFull;                                   // isFull = team.length >= cap(=6 post-G8)
_profLegendaryMysteryMode = _profMysteryMode && isPreLeagueLegendaryMysteryGate(cityIdx);
// renderCityActions: legendMysteryGate = swapMode && _legendaryGateHere; swapMode requires !hasTeamRoom.
```

**Repro**: Arrive at City 8 post-Gym-8 with a lean party (e.g. 4–5 mons, room under the cap of 6). The hub still labels the Professor button "Professor — New Team Member" (room=true path) and `enterProfessor` runs in NORMAL mode (`_profMysteryMode=false`), handing a regular 3-choice gift instead of the legendary. Route then unblocks via `profUsedHere`. The player walks Victory Road with NO legendary, despite the gate being framed as "Required" and "no challenger walks the final gate without a legendary in hand."

**Blast radius**: Narrative/consistency only — NOT a wedge (the run still completes). The "biggest decisions of the run" legendary gate is skippable by simply keeping a non-full party. (Prior-audit ISSUE-036; re-verified.)

**Fix sketch**: Decouple `_profLegendaryMysteryMode` from `isFull` at City 8 — when `isPreLeagueLegendaryMysteryGate(cityIdx)` is true, force legendary mode regardless of party fullness (offer the legendary into an open slot if there's room, else the swap flow). Or accept it as intentional and soften the "Required" copy.

---
severity: P3
category: dx
anchor_symbol: SAVE_VER
current_line_hint: 34369 (=23); migration chain ends at _loadedVer<22 (35596)
file: battle.html
agents: [story-mode-investigator]
fingerprint: 35442eebd3b2
confidence: high
domain: pasteur
status: open
---

**Title**: SAVE_VER=23 but migration chain stops at `_loadedVer < 22` — no migrateStoryPreV23, no boot shadow-validation

**Evidence**:
```js
const SAVE_VER = 23;                                  // battle.html:34369
// last migration in load(): if (_loadedVer < 22) { migrateStoryPreV22(); }   (35596)
// there is no migrateStoryPreV23 and no `if (_loadedVer < 23)` block.
```

**Repro**: `grep -n 'migrateStoryPreV23\|_loadedVer < 23' battle.html` → 0 hits. A v22 save loading into a v23 build passes the version guard, runs no v22→v23 migration, and is stamped v23. Harmless IF the v23 schema delta is roll-time-only (the build-power-tier `powerTier` field is computed, not stored), but the gap is undocumented and mirrors prior-audit ISSUE-169 (v20 bumped without a migration).

**Blast radius**: Migration chain completeness / future-proofing. No current crash (round-trip is clean — verified via story-flow + save-migration integration tests passing), but the next schema change at v23/24 risks landing on top of an unmigrated field silently.

**Fix sketch**: Either add a no-op `migrateStoryPreV23` with a comment explaining the v23 bump was field-free, or add the boot-time shadow-validation the prior audit recommended (ISSUE-134) that logs when SAVE_VER outpaces the highest migration. pasteur owns the schema bump rationale.

---
severity: P3
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: 30492 (array of 67 rows)
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8d651a30fcb3
confidence: high
domain: pasteur
status: open
---

**Title**: Timeline is 67 rows; STORY_MODE_FLOW.md (and this update's brief) still say "68 rows"

**Evidence**: jsdom harness reports `STORY_EVENTS_RAW.length === 67`. The canonical spec and the Wave-3 brief both cite "68 rows." Last row is `[67,'Battle','Mystery Figure',...]` (a row-ID of 67, but array index 66). The row-ID/array-index conflation is the same family as the City-3 bug above — easy to mis-cite a row by its ID and land on the wrong array slot.

**Repro**: boot harness, `console.log(STORY_EVENTS_RAW.length)` → 67. (Prior-audit ISSUE-178; re-verified.)

**Blast radius**: Spec/doc drift only. No runtime impact, but it propagates the "row 67 = array idx 67" mental model that bites derived maps (`GYM_CITY_LEADER_EVENT`).

**Fix sketch**: Doc edit in STORY_MODE_FLOW.md ("67 rows; final row-ID is 67 at array index 66"). pasteur owns the canon.

---
## CONFIRMED-FIXED (verified against current code — safe to close in ledger)

These prior-audit / ledger findings were re-checked against the current `battle.html` and are **closed by current guards/reworks**. Listed with the symbol/guard that fixes each.

- **ISSUE-031** (proceedToNextBattle re-entry stacks cold-open overlays → "After Badge One" wedge) — FIXED by `_storyBattleEntryBusy` guard (`proceedToNextBattle` 46743-46744; released in `enterCity` 43173 + `launchBattle` 47559). Re-entry while a scene is mid-flow is rejected. (See my P2 finding above for the residual error-path latch — that is a *new, narrower* gap, not this one.)
- **ISSUE-013** (player gimmick gate reads bare IIFE-private `sm` → always 0 unlocked) — FIXED. `_withStoryPlayerGimmickGate` (12347) now reads `window.StoryMode.state.unlockedGimmicks`; `_mechForGimmickRoll` (12327) honors the gate flag.
- **ISSUE-218** (`_storyEnemyMechKeys` could throw on missing `sm.settings`) — FIXED. `const S = (ctx && ctx.settings) || sm.settings || {};` (36260). Enemy mech gate also correctly filters by `sm.unlockedGimmicks` (36262-36267).
- **ISSUE-012 / ISSUE-098** (Master Ball track-end reward has no fire-once guard / re-call double-grants) — FIXED. `_storyGrantTrackEndReward` (42342) guards on `sm._trackRewardGranted[sk]` (42345-42346).
- **ISSUE-040 / ISSUE-133** (v14 trainer migration bundled under <13, skipped for v13 saves) — FIXED. `load()` has separate `if (_loadedVer < 13)` and `if (_loadedVer < 14)` blocks (35569-35574).
- **ISSUE-135** (pre-merge partial `unlockedGimmicks` not re-derived on load → Tera/Z withheld) — FIXED. `load()` re-derives `unlockedGimmicks` from the badge gate on every load (35481-35490).
- **ISSUE-162** (city-hub Mystery Figure sprite hard-coded to Cyrus) — FIXED. `renderCityActions` (43372-43375) uses `sm.mysteryIdentity` sprite ("was: hardcoded 'Cyrus'"). `_storyEnsureMysteryIdentity` always returns `the_first` (Red sprite); residual `'Cyrus'` strings are dead fallbacks.
- **ISSUE-177** (victory overlay no dialog role/focus/ESC) — FIXED. `showVictoryOverlay` (48035-48071) sets `role=dialog`, `aria-modal`, `aria-label`, `tabIndex`, ESC/Enter listener, `finished` re-entry guard, and a defensive `cb()` try/catch that recovers to city.
- **ISSUE-065** (showScreen no focus management) — FIXED. `showScreen` (54581-54594) sets tabindex + `el.focus({preventScroll:true})`.
- **Per-leader victory line** (was generic "You received a Gym Badge!") — FIXED. `showVictoryOverlay` threads `LEADER_VICTORY_LINES` / `LEADER_BADGE_REFLECTIONS` / `LEADER_BADGE_NAMES` / variant cards + per-Elite/Champion/Rival aftermath (48072-48178).
- **ISSUE-220 / ISSUE-198 / ISSUE-213** — re-confirmed clean: party-cap = `min(6,2+badges)` (`_storyMaxPartySize` 46422); PC-overflow at party-cap + 30/30 shows explicit message + swap path (`_catchHandleSuccess` 50736-50739); catch tutorial fires once via `sm.catchTutorialDone`, marked only on real catch (50798-50800).
- **"Hard pays ×0.92" coin asymmetry** — FIXED (maxwell). `storyDifficultyCoinMult` (32568) floors Hard at `1.00` ("floored at parity so the coin curve stops fighting the difficulty curve"). Normal = 1.30.
- **Rival adaptation `RIVAL_ATTACK_TYPE_DECAY` ÷30 too aggressive** — reworked away. `_rivalScoreAttackTypeVsParty` (36534) now scores `sum of m²` over SE matchups; the `RIVAL_ATTACK_TYPE_DECAY` constant no longer exists.
- **3-track double-fire risk** — clean. Event beats (`_resolveActiveRoadBeats`, `kind==='event'`) and battle beats (`_activeBattleBeatForCurrentRow`, inject-kinds) are cleanly partitioned; both dedup on `sm.storyEventsFired[sceneKey]`. `IntroQueue` (42781) drains sequentially with an idempotent `done()` and error-safe steps. Full 67-row timeline walk via `onBattleEnd` completes with no stalls or thrown exceptions.
- **ISSUE-116** (post-HoF save never gets Master Ball/boss arc if parked at city) — effectively closed. `_handleCrucibleBattleEnd` postHofMystery branch (49127-49134) sets `postHofMysteryClimaxDone` then synchronously calls `continuePostGame()`, which grants `bossArc.available` + Master Ball *before* moving eventIndex; the only theoretical gap is a tab-close between two synchronous `save()`s (unreachable).

## SCOPE NOTES
- Safari grade weights are a badge-keyed curve (`_SAFARI_GRADE_CURVE_BY_BADGES` 48642), NOT the flat g1:3/g2:22/g3:50/g4:25 in the spec — intentional per prior audit (ISSUE-209/210/211/212); spec is stale, code is correct-by-design.
- `PC_BOX_CAP = 30` (48219) vs spec's 10 (ISSUE-048) and stale help-text saying "ten slots" (ISSUE-147/153) — maxwell/pasteur-owned balance/copy, internally consistent at 30, not a flow bug.
