---
severity: P1
category: bug
anchor_symbol: startBattle
current_line_hint: ~16806
file: battle.html
agents: [story-mode-investigator]
fingerprint: 621cdb8220ed
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: `startBattle` reads bare `sm` (ReferenceError) → story boss/raid BOSS_CONFIGS mechanics never init

**Evidence**:
```js
// startBattle() is defined at ~16663, OUTSIDE the window.StoryMode IIFE (29302–59694)
// where `sm` is a closure local (declared ~34886). So this throws:
const _beatKey = sm && sm._activeBeatBattleKey;          // ReferenceError: sm is not defined
const _cfg = _beatKey && typeof BOSS_CONFIGS === 'object' && BOSS_CONFIGS[_beatKey];
// ... swallowed by:
} catch (e) { console.warn('[Story] BOSS_CONFIGS init failed:', e); }
```
There is no `window.sm =` assignment anywhere (only two defensive `window.sm` *reads* at ~13685/~18871, both of which see `undefined`). So the boss-mechanics init block is dead: field locks, HP-threshold phase changes, and immunity-round mechanics declared in `BOSS_CONFIGS` are never attached to story-beat boss / miniBoss / raid battles. `enterBattleEvent` (~46652) correctly stamps `sm._activeBeatBattleKey`, but `startBattle` can never read it.

**Repro**: `node scripts/debug/story-playthrough.mjs` — every battle logs `console.warning: [Story] BOSS_CONFIGS init failed: ReferenceError: sm is not defined at startBattle (battle.html:16806)`. Reach the Caged God / any villain boss beat: the boss fights as a vanilla mon with none of its scripted phase/field mechanics.

**Blast radius**: All 3-track boss/raid beats and the Caged God arc lose their signature mechanics. Normal trainer battles are unaffected (no `_activeBeatBattleKey`), so it degrades silently rather than crashing — which is why it shipped.

**Fix sketch**: Expose the story state to script-top scope (e.g. assign `window.sm = sm` inside the IIFE, or a `window.StoryMode._activeBeatKey()` accessor) and have `startBattle` read through that handle instead of bare `sm`.

**Verification**: Re-run `story-playthrough.mjs`; the warning disappears. Enter a boss beat and confirm `state._bossMechanics` is populated and `_storyBossMechanicsBattleInit` runs.

---
severity: P1
category: bug
anchor_symbol: GYM_CITY_LEADER_EVENT
current_line_hint: ~32514
file: battle.html
agents: [story-mode-investigator]
fingerprint: b46578ed397f
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: City-name lookup feeds an array index into a row-ID-keyed map → City 3 always shows "City 3"

**Evidence**:
```js
// GYM_CITY_LEADER_EVENT stores the ARRAY INDEX i:
for (let i = 0; i < STORY_EVENTS_RAW.length; i++) { ... out[gymNum] = i; }
// but trainerAssignments is keyed by ROW ID (row[0]) everywhere it's written (~37952, 37982).
// updateHUD (~42667) and getStoryDisplayTownNameForCityRow (~43552):
const leaderEvIdx = GYM_CITY_LEADER_EVENT[cityIdx];          // array index
const leaderName = sm.trainerAssignments && sm.trainerAssignments[leaderEvIdx]; // wrong key
cityName = (leaderName && GYM_LEADER_CITY_NAMES[leaderName]) || ('City ' + cityIdx);
```
For Gym Leader 3, arrayIndex=17 but rowId=18 (the City-3 Rival, row ID 12, sits at array index 18 and shifts everything after it). So `trainerAssignments[17]` resolves to the City-3 **Gym Trainer 1** (a generic trainer class name), which is never a key in `GYM_LEADER_CITY_NAMES` → falls through to the `'City 3'` fallback. Gyms 1,2,4-8 happen to have arrayIndex === rowId so they work by luck.

**Repro**: Start a run, reach City 3 (after Gym 2). HUD city label reads "City 3" instead of the themed leader-city name (Vermilion/etc.), while every other gym city shows its proper name.

**Blast radius**: HUD city label (`updateHUD`) and town-name display (`getStoryDisplayTownNameForCityRow`). Cosmetic but the exact eventIndex-vs-rowID keying class the spec warns about; any future timeline reorder that breaks arrayIndex===rowID for other gyms widens the breakage.

**Fix sketch**: Make `GYM_CITY_LEADER_EVENT` store the row ID (`out[gymNum] = STORY_EVENTS_RAW[i][0]`) so the two consumers' `trainerAssignments[...]` lookups key correctly; or change the two consumers to map array index → row id before lookup.

**Verification**: `node -e` parse confirms gym3 arrayIndex 17 ≠ rowId 18. After fix, City 3 HUD shows the leader-themed name. Add a boot assertion that every `GYM_CITY_LEADER_EVENT` value resolves to a `Gym Leader N` row.

---
severity: P1
category: bug
anchor_symbol: _catchHandleSuccess
current_line_hint: ~49754
file: battle.html
agents: [story-mode-investigator]
fingerprint: 56bafb53d258
confidence: medium
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Master Ball consumed but Caged God rejected when party 6/6 + PC 30/30 — unique ball lost, no refund

**Evidence**:
```js
// catchThrow consumes the ball BEFORE resolving outcome (~49647):
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;     // master decremented in bossMode
...
if (outcome === 'catch') { _catchHandleSuccess(enc, ballKey); return; }
// _catchHandleSuccess (~49754):
if (partyFull && pcFull) {
    _catchFinishWithMessage(`Your party (.../6) and PC (30/30) are full. Free a slot ... then try again.`);
    return;   // caught mon discarded; ball NOT refunded
}
```
The Master Ball can only be thrown in boss mode (locked otherwise) and is unique (1 per run). If the player reaches the Caged God with party at the badge cap (6) AND PC at 30/30, a successful Master Ball roll is rejected for lack of space and the ball is gone — the "try again" instruction is impossible because the unique ball is consumed.

**Repro**: Fill party to 6 and PC to 30 (active-catcher run), enter the Caged God, throw the Master Ball → message tells you to free a slot and retry, but `sm.balls.master` is now 0 and cannot be re-obtained.

**Blast radius**: Caged God boss arc capture (Subject Zero). The non-boss path is only a wasted regular ball (annoyance), but the boss path is a hard arc soft-lock of the marquee post-game reward.

**Fix sketch**: Move the `partyFull && pcFull` check BEFORE ball consumption (block the throw with the message while the ball is intact), or refund the ball when the success is rejected for space. For boss mode, prefer blocking the throw entirely until a slot exists.

**Verification**: Repro above no longer consumes the Master Ball; the player can free a slot and re-throw.

---
severity: P2
category: bug
anchor_symbol: catchThrow
current_line_hint: ~49647
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8a7d99b90173
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Regular ball consumed with no refund when a successful catch is rejected at party-full + PC-full

**Evidence**:
```js
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;   // ~49647, before outcome
...
if (partyFull && pcFull) { _catchFinishWithMessage('... Free a slot ... then try again.'); return; }
```

**Repro**: Party at cap and PC at 30/30, throw an Ultra Ball at a wild and roll a success — the message asks you to free a slot, but the Ultra Ball is gone.

**Blast radius**: Route / Safari / Crucible wild catches at full storage. Pure economy loss; no soft-lock for regular balls.

**Fix sketch**: Same as the boss-mode finding — gate the throw on free space (party-or-PC) before decrementing, or refund on rejection.

**Verification**: Catch screen disables / blocks throws when party AND PC are full, surfacing the "free a slot" message without spending a ball.

---
severity: P2
category: inconsistency
anchor_symbol: migrateStoryPreV22
current_line_hint: ~34660
file: battle.html
agents: [story-mode-investigator]
fingerprint: c40dff087d5b
confidence: medium
status: open
---

**Title**: v22 migration rolls fresh villain/extra tracks on mid-run saves → road-anchored intro beats silently never fire

**Evidence**:
```js
function migrateStoryPreV22() {
    if (!sm.tracks ...) sm.tracks = { main:'classic_v2', villain:null, extra:null };
    if (!sm.tracks.villain) sm.tracks.villain = _pickTrack(VILLAIN_TRACKS);
    if (!sm.tracks.extra)   sm.tracks.extra   = _pickTrack(EXTRA_TRACKS);
    if (!sm.storyEventsFired ...) sm.storyEventsFired = {};   // empty
}
```
The dispatcher (`_activeBattleBeatForCurrentRow`, ~41805) only fires beats whose `roadAnchor === currentRoad` and that are not in `storyEventsFired`. A v21 save migrated at, say, City 5 gets a brand-new villain track with an empty fired-ledger, but every beat anchored to roads 1–5 is behind the player and will never be reached — so the villain arc's intro/reveal beats are silently skipped and the track first surfaces mid-arc (or not at all). The migration comment calls this "acceptable — additive," but the player-facing result is an incoherent villain storyline on any migrated save.

**Repro**: Load a v21 save sitting at City 5+, advance — villain track beats anchored to earlier roads never play; the first villain beat the player sees is whatever is anchored to a future road.

**Blast radius**: Narrative coherence of the 3-track system for all pre-v22 saves (the majority of existing players at ship time).

**Fix sketch**: On migration of a mid-run save, either stamp all road-anchored beats for already-passed roads as fired (so the dispatcher doesn't expect them) AND surface a one-shot "the road ahead has changed" catch-up note, or pin villain/extra to null until the next fresh run.

**Verification**: Migrate a City-5 v21 save; confirm no orphaned villain reveal is expected and the arc reads coherently from the player's current road.

---
severity: P3
category: inconsistency
anchor_symbol: _shouldFireCatchTutorialBeforeBattle
current_line_hint: ~46048
file: battle.html
agents: [story-mode-investigator]
fingerprint: ba4c93ea58e7
confidence: medium
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Catch-tutorial ball gate counts the Master Ball, which can never be thrown outside boss mode

**Evidence**:
```js
const totalBalls = (balls.poke|0) + (balls.great|0) + (balls.ultra|0) + (balls.master|0);
if (totalBalls <= 0) return false;
```
The tutorial only requires "at least one ball," but counts the Master Ball — which is `masterLocked` and refused (`catchThrow` ~49641) anywhere but the Caged God. A player whose only ball is the Master Ball would have the tutorial fire with no throwable ball. Not reachable in normal flow (the v15 starter kit grants 5 Poké Balls and the Master Ball arrives post-HoF), but the gate is logically wrong.

**Repro**: Force `sm.balls = {poke:0,great:0,ultra:0,master:1}` pre-tutorial; tutorial fires but no ball can be thrown.

**Blast radius**: Catch tutorial only; latent.

**Fix sketch**: Exclude `master` from the tutorial's `totalBalls` (count only poke/great/ultra).

**Verification**: With only a Master Ball, the tutorial defers instead of firing.

---
severity: P3
category: bug
anchor_symbol: catchThrow
current_line_hint: ~49701
file: battle.html
agents: [story-mode-investigator]
fingerprint: 0681a2dce375
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Catch flee/wobble flavor messages use `Math.random()` instead of `storyRngNext()`, breaking seed determinism

**Evidence**:
```js
fleeMessage = fleeMsgs[Math.floor(Math.random() * fleeMsgs.length)];
...
_catchState.message = wobbleMsgs[Math.floor(Math.random() * wobbleMsgs.length)];
```
The catch/flee *outcome* correctly uses `storyRngNext()`, but the displayed flavor line is picked with bare `Math.random()`. Cosmetic only, but violates the "seed determines everything" contract for shared-seed / daily-seed replays.

**Repro**: Run the same seed twice through a missed catch; the flavor string differs between runs.

**Blast radius**: Catch screen text only; no mechanical drift.

**Fix sketch**: Route both message picks through `storyRngNext()` when `sm.active`.

**Verification**: Same seed produces identical catch-screen flavor text across runs.

---
severity: P1
category: bug
anchor_symbol: cityIndexFromEventIndex
current_line_hint: ~43528
file: battle.html
agents: [story-mode-investigator]
fingerprint: 527695359ad9
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: `cityIndexFromEventIndex` fed a ROW ID instead of array index → intro Rival (row 68) scales as City 9 (fully-evolved, hidden abilities, top items, T4)

**Evidence**:
```js
// cityIndexFromEventIndex walks STORY_EVENTS_RAW BY ARRAY INDEX:
function cityIndexFromEventIndex(ei) { for (let i = ei; i >= 0; i--) { const row = STORY_EVENTS_RAW[i]; ... } }
// But three foe-scaling consumers pass a ROW ID (ev[0]):
function _storyEvoStageCapForRow(rowIdx) { return _storyEvoStageCapForCity(cityIndexFromEventIndex(rowIdx)); } // ~35899
... _mechCity = cityIndexFromEventIndex(storyRowIdx);                                                          // ~36078
if (storyRowIdx != null && storyRowIdx >= 0 ...) _foeCity = cityIndexFromEventIndex(storyRowIdx);             // ~36854
// rollTrainerTeam / _applyStoryBuildPowerTier get storyRowIdx = ev[0] (ROW ID) from enterBattleEvent:
const [idx, type, event, ...] = ev;  rollTrainerTeam(trainer, partySize, gw, sg, event, idx);
```
The intro Rival is row ID **68**, but the array has only 68 entries (max index 67). `cityIndexFromEventIndex(68)` reads `STORY_EVENTS_RAW[68]` = undefined, then walks down to the deepest City → returns **City 9**. So for the intro Rival the evo-stage cap becomes "ALL stages" (fully evolved), `_foeCity >= 4` enables hidden abilities + the C7+ "best" held-item tier, and the power tier resolves at the top. The very first battle — a 1v1 starter duel meant to be gentle — sandbags a brand-new player. Any other row whose row ID ≠ array index (rows after the City-3 Rival insertion: IDs 12/39/40 are reordered) also resolves to the wrong city's caps.

**Repro**: `node scripts/debug/story-playthrough.mjs` and inspect the intro Rival's rolled team, or add a log to `_applyStoryBuildPowerTier` — `_foeCity` comes out 9 for row 68. The intro rival foe carries fully-evolved species with hidden abilities and tier-3 items.

**Blast radius**: Evo-stage cap, enemy mechanic-density city, and foe power tier (hidden abilities + held-item tier) for the intro Rival and any reordered row. This is the exact eventIndex-vs-rowID keying class flagged for this audit and the single most player-facing balance defect found.

**Fix sketch**: Convert row ID → array index before calling `cityIndexFromEventIndex` in the three foe-scaling consumers (e.g. `STORY_EVENTS_RAW.findIndex(r => (r[0]|0) === rowId)`), OR have these consumers take the array index directly. A boot assertion that `cityIndexFromEventIndex(arrayIdxOfIntroRival)` === 0 would catch regressions.

**Verification**: After fix, the intro Rival's evo cap = Basic only (City 0), `_foeCity` = 0 (no hidden abilities, no items), and the fight reads as the intended gentle 1v1.

---
severity: P2
category: balance
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~31904
file: battle.html
agents: [story-mode-investigator]
fingerprint: 87f7a13f57dd
confidence: high
status: wontfix-claude/focused-cori-sGNzn (intentional easy-mode economy assist; maintainer confirmed — Hard mult is explicitly floored, deliberate tuning)
---

**Title**: Coin multiplier inverts the difficulty curve — harder modes earn less gold against tougher foes

**Evidence**:
```js
function storyDifficultyCoinMult() {
    if (diff === 'normal')    return 1.30;
    if (diff === 'easy')      return 1.50;
    if (diff === 'veryeasy')  return 1.60;
    if (diff === 'hard')      return 1.00;   // +15% foe stats, LEAST coins above hard
    if (diff === 'challenge') return 1.10;   // +30% foe stats, still below normal
}
```
The prior audit's "Hard pays ×0.92" was floored to parity, but the curve still inverts: Very Easy earns 1.60× while Very Hard earns 1.10× — i.e. the easier you play (weaker foes via the 14580 stat mult: veryeasy 0.70 … challenge 1.30) the *more* gold you get, against the same fixed shop / Colress / Link prices. Hard/Challenge players face the toughest foes with the thinnest economy and no compensating reward.

**Repro**: Compare total gold earned on a Very Easy vs Very Hard run to the same city; Very Hard is ~30% poorer while fighting +30%-stat foes.

**Blast radius**: Whole-run economy on Hard/Challenge; affects shop access, Colress gimmick swaps, Link upgrades, Stone/EV training affordability.

**Fix sketch**: Flatten or invert the coin curve so harder modes pay >= 1.30× (e.g. hard 1.30, challenge 1.45), or fold the difficulty into a single reward+threat formula instead of two opposed knobs.

**Verification**: Re-tabulate per-difficulty cumulative gold at City 6; harder tiers should not earn less than Normal.

---
severity: P3
category: inconsistency
anchor_symbol: _storyEnemyPartySize
current_line_hint: ~45744
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5af7ce667724
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Comment claims foe sizing matches player team length, but code uses the badge curve

**Evidence**:
```js
// Comment (~45744): "Foe sizing matches player team length (see `_storyEnemyPartySize`)
//                     so the two stay locked together on the same progression clock."
// Actual _storyEnemyPartySize (~45720):
const badges = (sm && (sm.badges | 0)) || 0;
const badgeCurve = Math.min(6, 2 + badges);   // NOT player team length
return Math.max(floor, badgeCurve);
```
The function was deliberately changed (note at ~45708) to use the badge curve `min(6, 2+badges)` rather than player team length — which matches the canonical spec. But the adjacent comment block still says foe sizing tracks player team length, directly contradicting both the code and the pre-fix note a few lines above. A maintainer reading this will be misled about how non-catcher under-sizing works.

**Repro**: Read `battle.html` ~45708–45746; the two comments disagree on the foe-sizing rule.

**Blast radius**: Documentation only; no runtime impact. Risk is a future "fix" that re-introduces the under-sizing bug the note warns about.

**Fix sketch**: Update the ~45744 comment to state foe sizing follows the badge curve (player team length only matters for the intro Rival exception).

**Verification**: Comment matches `_storyEnemyPartySize` behavior.

---
severity: P3
category: dx
anchor_symbol: continueRun
current_line_hint: ~38992
file: battle.html
agents: [story-mode-investigator]
fingerprint: 89b458f3ac60
confidence: medium
status: fixed-claude/focused-cori-sGNzn
---

**Title**: A future-version save shows "Continue Run" but silently bounces to the menu with no explanation

**Evidence**:
```js
function hasSave() { return !!localStorage.getItem(SAVE_KEY); }   // presence only
function load() { ... if (!d || d.version < 2 || d.version > SAVE_VER) return false; ... }
function continueRun() { if (!load()) { showMenu(true); return; } ... }  // silent bounce
```
`hasSave()` (which gates the Continue Run button) only checks presence, but `load()` rejects any save whose `version > SAVE_VER`. So a save written by a newer build (e.g. after a deploy/rollback, or a shared save) shows the Continue button, and clicking it silently returns to the menu with no toast or alert — the player can't tell the run still exists.

**Repro**: Set `pbs_story_save` to a JSON with `version: 99`. The menu shows "Continue Run"; clicking it does nothing visible.

**Blast radius**: Menu UX on version downgrade / cross-build saves. No data loss (the save is not cleared), but the failure is invisible.

**Fix sketch**: When `load()` fails on a future version, surface a toast ("This save was made by a newer version") and/or hide the Continue button when the stored `version > SAVE_VER`.

**Verification**: Future-version save either hides Continue or shows an explanatory message.

---
severity: P2
category: bug
anchor_symbol: pcRelease
current_line_hint: ~48624
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4939480dbc5f
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: `pcRelease` lacks the `unsellable` guard `pcSell` has — the boss-arc capture (Subject Zero) can be permanently released

**Evidence**:
```js
async function pcSell(monId) { ...
    if (!slot || slot.unsellable === true || slot.isEgg) return;   // guards unsellable
}
async function pcRelease(monId) { ...
    if (!found || found.where !== 'pc') return;                    // NO unsellable guard
    const ok = await window.showGameConfirm('Release ' + name + '? ...');
    if (!ok) return;
    sm.pcBox.splice(found.index, 1);                               // gone forever
}
```
Subject Zero (the Caged God capture) is stamped `unsellable:true` and, when caught with a full party, is pushed to the PC (`_catchHandleSuccess` ~49778). `pcSell` refuses to sell it, but `pcRelease` will release it. The spec (STORY_MODE_FLOW.md §"Underground": "Unsellable: starter, current last party mon, the boss-arc capture") intends the capture to be permanent.

**Repro**: Catch the Caged God with a full party so it lands in the PC, open PC → Release on Subject Zero → confirm. It's gone, with no re-acquisition path.

**Blast radius**: PC release path; loses the unique post-game reward. Gated by a confirm dialog so not a silent loss, but the intended hard lock is absent.

**Fix sketch**: Add `if (found.slot && found.slot.unsellable === true) return;` (with a toast) to `pcRelease`, mirroring `pcSell`.

**Verification**: Releasing Subject Zero from the PC is blocked with a "story-locked" message.

---
severity: P3
category: inconsistency
anchor_symbol: _catchHandleSuccess
current_line_hint: ~49751
file: battle.html
agents: [story-mode-investigator]
fingerprint: c6add40f42ff
confidence: medium
status: wontfix-claude/focused-cori-sGNzn (eggs legitimately occupy party slots per mainline; foe-sizing correctly uses fighters; counting fighters for the cap would overflow physical slots)
---

**Title**: Party-cap "full" check counts eggs (`sm.team.length`) while foe-sizing / sell guards count only fighters

**Evidence**:
```js
// _catchHandleSuccess (~49751) and renderCityActions (~42717) — eggs count toward the cap:
const partyFull = (sm.team || []).length >= maxParty;
const hasTeamRoom = sm.team.length < _partyCap;
// but foe sizing and sell guards exclude eggs:
function _storyCountFighters() { return (sm.team || []).filter(s => s && !s.isEgg).length; }
```
A daycare egg occupies a party slot for the catch / Professor "team room" check, so a player at 2 badges (cap 4) holding 3 fighters + 1 egg is treated as "party full" — a caught mon is forced to the PC and the Professor button hides, even though the player can only field 3 fighters. Foe sizing (`_storyEnemyPartySize`) and the sell/daycare guards meanwhile use the fighter count, so the player faces a badge-curve-sized foe team they can't fully match.

**Repro**: Get an egg into the party (daycare), then catch / visit Professor while `fighters + eggs == cap` — the new partner is shunted to PC / the Professor disappears though a fightable slot is effectively open.

**Blast radius**: Catch destination and Professor visibility when an egg is carried; mild fairness/clarity issue, no soft-lock.

**Fix sketch**: Decide one rule — either count eggs toward the active cap everywhere (and size foes off `sm.team.length`), or exclude eggs from the cap check (use `_storyCountFighters()` in `_catchHandleSuccess` / `renderCityActions`).

**Verification**: With an egg in party at sub-cap fighter count, a catch fields normally and the Professor stays visible.

