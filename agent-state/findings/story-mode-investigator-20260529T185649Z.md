---
severity: P1
category: bug
anchor_symbol: _crucibleBattleSetup
current_line_hint: ~47905
file: battle.html
agents: [story-mode-investigator]
fingerprint: 39dff38f7dce
confidence: high
status: wontfix-out-of-scope-crucible
---

**Title**: Crucible row constants are STORY_EVENTS_RAW *row-ids*, not array indices — `_crucibleBattleSetup` assigns them straight to `sm.eventIndex`

**Evidence**:
```js
const _CRUCIBLE_GYM_ROWS = [5, 11, 18, 24, 31, 38, 46, 53]; // "GL1..GL8 in STORY_EVENTS_RAW"
function _crucibleBattleSetup(targetEventIdx, source) {
    sm.crucibleBattleSource = source || 'rematch';
    sm.currentEnemyLock = null;
    sm.eventIndex = targetEventIdx | 0;   // <-- treated as ARRAY INDEX downstream
```
`sm.eventIndex` is an array index everywhere else (load clamps to `STORY_EVENTS_RAW.length-1`; `proceedToNextBattle` iterates `for(i=sm.eventIndex; i<length; i++)`). But the timeline row-ids diverge from positions after row 18: GL3 has `row[0]===18` at array index **17**; E1 has `row[0]===60` at index **59**. Other jump sites correctly convert (`STORY_EVENTS_RAW.findIndex(r => r[0] === 55)` at ~42140). `_crucibleBattleSetup` does not.

**Repro**: Post-HoF → enter Crucible → "Random Gym Rematch". When the random pick is `18` (intended Gym Leader 3), index 18 = the **City3 row** (not a Battle). `enterBattleEvent` warns "expected Battle row" and bounces to `enterCity()`. 1-in-8 of gym rematches silently fails.

**Blast radius**: All Crucible "Battles" buttons (Gym Rematch, League Run, Rival Rematch, Mystery Figure). Post-game only, but the entire Crucible battle column is affected.

**Fix sketch**: Either store array indices in the constants (`[5,11,17,24,31,38,46,53]`, league `[59,60,61,62,63]`, rival 64, mystery 66), or resolve at use time via `STORY_EVENTS_RAW.findIndex(r => r[0]===ROWID)`. The latter is drift-proof and matches the existing pattern.

**Verification**: From the Crucible, launch each of the 8 gym rematches + League Run + Rival + Mystery; confirm the foe role matches the button label and no fight bounces to the city.

---
severity: P1
category: bug
anchor_symbol: crucibleLeagueRun
current_line_hint: ~47921
file: battle.html
agents: [story-mode-investigator]
fingerprint: 347bfcbf535d
confidence: high
status: wontfix-out-of-scope-crucible
---

**Title**: Crucible League Run skips E1 and ends on the Rival — `_CRUCIBLE_LEAGUE_ROWS` are off-by-one row-ids

**Evidence**:
```js
const _CRUCIBLE_LEAGUE_ROWS = [60, 61, 62, 63, 64];   // "E1..E4 + Champion"
```
Resolved as array indices: idx60=E2, idx61=E3, idx62=E4, idx63=Champion, idx64=**League Rival**. So the run is E2→E3→E4→Champion→Rival — E1 is never fought and the run ends on an unintended Rival fight (which also sets `crucibleBattleSource='league'`, so `_handleCrucibleBattleEnd` reports "League Run cleared" after a rival fight).

**Repro**: Crucible → "League Run (E1 → Champion)". First foe is Elite 2, not Elite 1; final foe is the Rival.

**Blast radius**: Crucible League Run only (post-game).

**Fix sketch**: Use `[59,60,61,62,63]` (array indices for E1..Champion) or findIndex by row-id 60..64.

**Verification**: Run the League Run; confirm sequence E1→E2→E3→E4→Champion.

---
severity: P2
category: bug
anchor_symbol: crucibleRivalFight
current_line_hint: ~47920
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2a58bef716ae
confidence: high
status: wontfix-out-of-scope-crucible
---

**Title**: Crucible "Rival Rematch" targets the Hall of Fame row (array idx 65), not the league rival

**Evidence**:
```js
const STORY_LEAGUE_RIVAL_ROW = 65;
function crucibleRivalFight() { _crucibleBattleSetup(STORY_LEAGUE_RIVAL_ROW, 'rival'); }
```
Row-id 65 (league Rival) sits at array index **64**; index **65** is the `Hall of Fame` row. `_crucibleBattleSetup` sets `eventIndex=65`, `enterBattleEvent` sees a non-Battle row and bounces to `enterCity()`.

**Repro**: Crucible → "Rival Rematch" → drops back to the city instead of launching the rival fight.

**Blast radius**: Crucible Rival Rematch (post-game). Note `getRivalEncounterPhase` compares `storyRowIdx` against the SAME constant 65 but is fed the row-id (`ev[0]`) on the main path, so that consumer is correct — the bug is purely the `eventIndex` assignment path.

**Fix sketch**: `STORY_LEAGUE_RIVAL_ROW` is overloaded as both a row-id (correct for getRivalEncounterPhase) and an array index (wrong for _crucibleBattleSetup). Resolve the array index via findIndex inside crucibleRivalFight.

**Verification**: Crucible Rival Rematch launches a Rival battle.

---
severity: P2
category: bug
anchor_symbol: crucibleMysteryFight
current_line_hint: ~47919
file: battle.html
agents: [story-mode-investigator]
fingerprint: 963c0784871b
confidence: high
status: wontfix-out-of-scope-crucible
---

**Title**: Crucible "Mystery Figure" rematch uses out-of-bounds index 67 (array length is 67, max idx 66)

**Evidence**:
```js
const STORY_POST_HOF_MYSTERY_ROW = 67;
function crucibleMysteryFight() { _crucibleBattleSetup(STORY_POST_HOF_MYSTERY_ROW, 'mystery'); }
```
The Mystery Figure (row-id 67) is at array index **66**. STORY_EVENTS_RAW has 67 rows (indices 0..66). `_crucibleBattleSetup` sets `eventIndex=67`, `STORY_EVENTS_RAW[67]` is `undefined`, the `if(!ev)` guard fires and returns to `enterCrucible()` — the Mystery rematch never launches.

**Repro**: Crucible → "Mystery Figure" → returns to Crucible with no fight.

**Blast radius**: Crucible Mystery Figure rematch (post-game).

**Fix sketch**: Use array index 66, or findIndex by row-id 67.

**Verification**: Crucible Mystery Figure launches the masked challenger.

---
severity: P3
category: dx
anchor_symbol: showVictoryOverlay
current_line_hint: ~47154
file: battle.html
agents: []
fingerprint: e5f5ed16bbbe
confidence: medium
status: fixed-claude/gifted-fermat-yfnqq5
---

**Title**: Victory overlay auto-dismisses after 6s regardless of how much narrative it stacks — the biggest story beats can vanish before they're read

**Evidence**:
```js
const autoClose = setTimeout(dismiss, 6000);
```
The overlay can render four stacked beats at once: per-leader victory line + LEADER_BADGE_REFLECTIONS + per-variant victory card + the cap-unlock teach (gym wins), or the Champion base line + first-clear epilogue, or the Mystery Figure unmasking reveal + outro. All share one fixed 6000ms timer that calls `cb()` (advances the story) on expiry. A reader on the Champion/Mystery/Gym-3 reveal can have the screen yank itself away mid-sentence.

**Repro**: Win Gym Leader 1 on a fresh run (leader line + reflection + variant card + "🎓 party cap is now 3" teach). Don't touch anything. At 6s the overlay advances on its own.

**Blast radius**: Cosmetic/UX only — no state corruption (dismiss is idempotent). Affects the single most rewarding moments of the run.

**Fix sketch**: Scale the auto-close to content length (e.g. `Math.max(6000, 2500 + textChars*35)`), or drop the auto-close entirely for `gotBadge`/milestone overlays and require an explicit Continue (Enter/Esc/click already dismiss).

**Verification**: Long-text overlays stay up until dismissed or for a content-proportional duration.

---
severity: P3
category: data
anchor_symbol: _safariGradeWeightsForBadges
current_line_hint: ~47725
file: battle.html
agents: []
fingerprint: 407ccda7ec47
confidence: high
status: open
---

**Title**: Safari grade weights diverge from the canonical spec (`g1:3/g2:22/g3:50/g4:25`) — code is a badge-staged curve; spec is stale

**Evidence**:
```js
// "Pre-v19 was static {g1:3,g2:22,g3:50,g4:25}."
const _SAFARI_GRADE_CURVE_BY_BADGES = {
    3: { g1: 0, g2: 5,  g3: 60, g4: 35 },
    8: { g1: 5, g2: 50, g3: 40, g4: 5  }
};
```
The audit mandate / STORY_MODE_FLOW still cite the flat `3/22/50/25` weights and "6 encounters per run." Encounter count (`SAFARI_MAX_ENCOUNTERS = 6`) still matches, but the weights were intentionally replaced by a badge-staged curve in v19. This is spec drift, not a code bug — flagging so the canon doc gets reconciled (the in-code comment explicitly documents the intent).

**Repro**: N/A — diff the live constant against STORY_MODE_FLOW Safari section.

**Blast radius**: Documentation/spec only.

**Fix sketch**: Update STORY_MODE_FLOW.md (and any audit checklist) to describe the staged curve, or have maxwell confirm the staged curve is the intended canon and retire the flat-weight line.

**Verification**: Spec and `_SAFARI_GRADE_CURVE_BY_BADGES` agree.

---
severity: P3
category: inconsistency
anchor_symbol: getRivalEncounterPhase
current_line_hint: ~33135
file: battle.html
agents: []
fingerprint: e8cd41a9b1ad
confidence: medium
status: open
---

**Title**: Rival phase enum skips 1 (EARLY rival returns phase 2), leaving a dead phase-1 dialogue pool

**Evidence**:
```js
function getRivalEncounterPhase(storyRowIdx) {
    if (id === STORY_RIVAL_ROW_INTRO) return 0;
    if (id === STORY_RIVAL_ROW_EARLY) return 2;   // <- never 1
    if (id === STORY_RIVAL_ROW_MID)   return 3;
    if (id === STORY_RIVAL_ROW_LEAGUE) return 4;
```
The 4 canonical rival fights map to phases {0,2,3,4}. `pickRivalSecondaryIntroLine` and `RIVAL_PROGRESS_PRIMARY_QUOTES` both define a complete phase-1 line pool that is unreachable for any real rival fight (it only surfaces via the `pools[phase] || pools[1]` fallback default). Not a player-visible bug, but it means a written dialogue tier is dead and the phase numbering is non-obvious for future authors.

**Repro**: Grep callers of `getRivalEncounterPhase` — no path yields 1.

**Blast radius**: Dialogue authoring clarity; ~6 written lines unused.

**Fix sketch**: Either remap EARLY→1 (and shift MID→2, LEAGUE→3/4) for a contiguous enum, or document why the gap exists and fold the phase-1 pool into phase 2. Coordinate with pasteur (dialogue/phase owner).

**Verification**: Every defined phase pool is reachable, or the gap is documented.

---
severity: P3
category: refactor
anchor_symbol: renderCityActions
current_line_hint: ~42571
file: battle.html
agents: []
fingerprint: 3de6970b8557
confidence: high
status: open
---

**Title**: Dead `'Cyrus'` Mystery-Figure sprite fallbacks remain after the identity was collapsed to a single value ('the_first' / Red)

**Evidence**:
```js
// renderCityActions city-hub tease:
spriteTrainerArg = _mysteryFace && _mysteryFace.sprite ? _mysteryFace.sprite : 'Cyrus';
// enterProfessor legendary-gate sprite:
document.getElementById('story-prof-sprite').src = getTrainerSprite(... ? (_mysteryFace && _mysteryFace.sprite ? _mysteryFace.sprite : 'Cyrus') : ...);
```
`MYSTERY_FIGURE_IDENTITIES` now has exactly one entry (`the_first`, sprite 'Red'), and `_storyEnsureMysteryIdentity` always returns it. The `'Cyrus'` fallbacks can never fire — leftover from the retired 9-identity rotation. Harmless but misleading (a reader could think the MF can still be Cyrus).

**Repro**: `_mysteryFace.sprite` is always 'Red'; the `: 'Cyrus'` branch is unreachable.

**Blast radius**: None functional — code clarity only.

**Fix sketch**: Replace the `'Cyrus'` fallbacks with `'Red'` (or `MYSTERY_FIGURE_IDENTITIES.the_first.sprite`) so the dead-code reading isn't a wrong reading.

**Verification**: No `'Cyrus'` string remains in the Mystery-Figure sprite paths.

