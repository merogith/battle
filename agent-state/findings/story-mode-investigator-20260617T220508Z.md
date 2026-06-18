---
severity: P2
category: inconsistency
anchor_symbol: _earlyGameFoeStatMult
current_line_hint: ~38266
file: battle.html
agents: [story-mode-investigator]
fingerprint: 48812b28d717
confidence: high
status: open
---

**Title**: Early-game softening from FLOW §8/§15f (named constants) fully removed; replaced by unified per-city FOE_POWER_CURVE

**Evidence**:
```js
// STORY_MODE_FLOW.md §8 / §15f document PRE_GYM1_FOE_STAT_MULT=0.82,
// EARLY_GL_FOE_STAT_MULT=0.95, STAGE2_GL_FOE_STAT_MULT=0.97,
// _earlyGameFoeStatMult(), _isPreGym1NerfedBattle(), _stageGatedFoeStatMult().
// grep for ALL of these in battle.html → 0 hits. Replaced by:
const FOE_POWER_CURVE = Object.freeze([0.80,0.85,0.90,0.95,1.00,1.03,1.05,1.08,1.10,1.15]); // city 0..9
```

**Repro**: `grep -nE 'PRE_GYM1_FOE_STAT_MULT|EARLY_GL_FOE_STAT_MULT|_earlyGameFoeStatMult|_isPreGym1NerfedBattle|_stageGatedFoeStatMult' battle.html` → 0 hits.

**Blast radius**: Spec §8 implementation note still warns about the `window.STORY_EVENTS_RAW` re-export trap for a function that no longer exists. Anyone tuning early-game difficulty by the doc edits dead constants.

**Fix sketch**: Rewrite FLOW §8 and §15f anti-bricking tables to describe the live `FOE_POWER_CURVE` × `_foeDifficultyMult` model and delete the dead-constant warnings. The behavior change itself (no per-event GL softening; smooth city curve instead) is maintainer-owned — flag for sign-off, don't re-add.

**Verification**: After doc rewrite, every constant named in §8/§15f resolves to a live symbol.

---
severity: P1
category: dx
anchor_symbol: migrateStoryPreV15
current_line_hint: ~40654
file: battle.html
agents: [story-mode-investigator]
fingerprint: 61dc1db61b77
confidence: high
status: open
---

**Title**: The save-migration chain (most save-sensitive code) has no exercisable test path — only migratePreV22/26/27 are exposed

**Evidence**:
```js
// __storyTest exposes only: migratePreV22, migratePreV26, migratePreV27 (+ migrateStoryPreV25).
// migrateStoryPreV15 (grants starting balls, strips hardcore, assigns stable ids,
// derives postHofMysteryClimaxDone), V16, V17, V19, V20, V21, V24 have NO handle.
// The chain runs only inside load(), and load() early-returns in jsdom
// ("localStorage is not available for opaque origins"), so a pre-v15 round-trip
// is untestable in the harness.
```

**Repro**: In the jsdom harness, `window.__storyTest` lacks `migrateStoryPreV15`; stuffing a v14 save into localStorage throws on opaque origin, so `load()` never runs the chain.

**Blast radius**: A regression in any pre-v25 migration (e.g. v15 ball grant, hardcore→normal, id stamping) ships silently — CLAUDE.md flags saves as the single most sensitive area.

**Fix sketch**: Expose `migrateStoryPreV15..V24` on the `__storyTest` surface (mirroring V22/26/27) so a unit test can craft a synthetic old-shape `sm`, run the chain, and assert the post-conditions.

**Verification**: A new test crafts a v14 `sm`, calls the chain, asserts balls={poke:5,...}, difficulty='normal', team[].id set, no bossArc.

---
severity: P2
category: inconsistency
anchor_symbol: _foeDifficultyMult
current_line_hint: ~38294
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2c4f98469141
confidence: high
status: open
---

**Title**: Challenge foe stat mult is 1.40 in code but FLOW §8 table still says 1.30

**Evidence**:
```js
case 'challenge': return 1.40; // "Very Hard" — widened 1.30→1.40 (2026-06-15)
// STORY_MODE_FLOW.md §8: "| Challenge (Very Hard) | 1.30 | 1.10 |"
```

**Repro**: Compare `_foeDifficultyMult('challenge')` (1.40) with FLOW §8's stat-mult column (1.30).

**Blast radius**: Doc-vs-code balance drift; coin mult also moved (Hard floored to 1.00 vs §8 "1.00 (floored from 0.92)" which is consistent, but challenge coin is 1.10 in both — only the stat cell is stale).

**Fix sketch**: Update the §8 table Challenge stat cell to 1.40 (the in-code value is maintainer-ratified 2026-06-15).

**Verification**: §8 table matches `_foeDifficultyMult` for all five tiers.

---
severity: P3
category: inconsistency
anchor_symbol: _storyEnemyMechKeys
current_line_hint: ~41885
file: battle.html
agents: [story-mode-investigator]
fingerprint: e48cee00b68e
confidence: high
status: open
---

**Title**: _storyEnemyMechKeys header comment claims "GL7 onwards each newly unlocked mechanic enters the pool" but unlock is all-4-at-once at badges≥6

**Evidence**:
```js
// comment: "GL6 boss ... STANDARD only, and from GL7 onwards each newly unlocked
//  mechanic enters the enemy candidate pool."
// actual unlock site (onBattleEnd ~55194): const slotsUnlocked = badges < 6 ? 0 : 4;
//  → all four mechanics unlock together at Colress / City-6 clear, not dripped GL7+.
```

**Repro**: Read the comment at `_storyEnemyMechKeys` vs the `slotsUnlocked = badges<6?0:4` grant.

**Blast radius**: Documentation only — gate logic is correct (filters on `sm.unlockedGimmicks`). Matches ledger ISSUE-004 (docs still describe one-per-gym drip).

**Fix sketch**: Update the comment to "from the GL6/Colress clear, all four enabled mechanics unlock together and enter the enemy pool."

**Verification**: Comment matches the `badges < 6 ? 0 : 4` unlock rule.

---
severity: P3
category: inconsistency
anchor_symbol: SAVE_VER
current_line_hint: ~39874
file: battle.html
agents: [story-mode-investigator]
fingerprint: 20d45cb20dfa
confidence: high
status: open
---

**Title**: SAVE_VER is 27; STORY_MODE_FLOW pins it at 15/17 across §10/§17

**Evidence**:
```js
const SAVE_VER = 27;
// FLOW §10: "Bump SAVE_VER from 14 to 15." §17: "SAVE_VER bumped 16 → 17."
```

**Repro**: `grep -n 'const SAVE_VER' battle.html` → 27; FLOW §10/§17 cite 15/17.

**Blast radius**: Doc staleness only (matches ledger ISSUE-040). The migration chain itself is complete and correctly version-gated (`_loadedVer < N`).

**Fix sketch**: Add a "current SAVE_VER = 27" note near §10 and stop re-pinning specific numbers in milestone prose.

**Verification**: Doc references the live constant rather than a frozen value.

---
severity: P3
category: refactor
anchor_symbol: STORY_THEMED_BATTLES
current_line_hint: ~38319
file: battle.html
agents: [story-mode-investigator]
fingerprint: 15d76d8da1e7
confidence: medium
status: open
---

**Title**: STORY_THEMED_BATTLES is keyed by row-id and resolves correctly only because row-id≈array-index in the 7–58 band (fragile)

**Evidence**:
```js
// assignTrainers Pass 3: const [idx, type, event] = ev;  // idx = ev[0] = ROW ID
// const theme = _resolveThemeForBattleRow(idx);  // STORY_THEMED_BATTLES[idx]
// keys {7,14,20,26,33,34,41,42,48,49,56,58} are ROW IDS; they happen to equal
// array indices in this band, but the timeline diverges at ids 68/12/39/40.
```

**Repro**: Add/move a Rival-style out-of-order row in the 7–58 band; theme lookups silently mis-target.

**Blast radius**: Mid-game themed flavor (cursed/multitype/villain/eldritch). A timeline reorder would misalign themes with no error.

**Fix sketch**: Document the contract explicitly (keys are row-ids) at the table, and add a boot-time assert that every `STORY_THEMED_BATTLES` key matches a Battle row's `row[0]`.

**Verification**: Boot assertion passes; a deliberately-renumbered row trips it.

---
severity: P3
category: inconsistency
anchor_symbol: catchUnlocked
current_line_hint: n/a
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7bfd9b611d8f
confidence: high
status: open
---

**Title**: catchUnlocked field is fully gone (not written, not in sm defaults); FLOW §10 still documents it as a reserved/legacy field

**Evidence**:
```js
// grep catchUnlocked battle.html → 0 hits.
// FLOW §10: "catchUnlocked: false  // ⚠ RESERVED/LEGACY — written but never read"
// migrateStoryPreV15 no longer sets it (the spec'd line was dropped).
```

**Repro**: `grep -n catchUnlocked battle.html` → nothing.

**Blast radius**: Harmless (the live gate is `sm.catchTutorialDone`). Pure doc/schema drift; a forward-imported save from an even older build that reads `catchUnlocked` would get `undefined` (falsy), which is the intended default anyway.

**Fix sketch**: Remove the `catchUnlocked` row from FLOW §10's schema block.

**Verification**: §10 schema lists only live fields.

---
severity: P3
category: bug
anchor_symbol: _eggBuildFor
current_line_hint: ~49479
file: battle.html
agents: [story-mode-investigator]
fingerprint: 358b23b1c70f
confidence: medium
status: open
---

**Title**: _eggBuildFor has an ungated makeBuild fallback that would surface unlocked-mechanic gimmicks on a hatchling (dead today, latent)

**Evidence**:
```js
function _eggBuildFor(species) {
    let b = null;
    try {
        if (typeof makeWildBuild === 'function') b = makeWildBuild(species);  // gated
        else if (typeof makeBuild === 'function') b = makeBuild(species);     // UNGATED
    } catch (e) {...}
```

**Repro**: The `else` branch is unreachable (`makeWildBuild` always defined), but if `makeWildBuild` ever throws/returns null the catch is hit, not the else — so it is currently dead. Still a latent gate-leak if refactored.

**Blast radius**: Player-side gimmick gate integrity. Low — branch is presently unreachable.

**Fix sketch**: Wrap the fallback in `_withStoryPlayerGimmickGate(() => makeBuild(species))` to keep the gate invariant true on every player-mon path.

**Verification**: Every player-mon build site (egg, wild, prof, roaming, link-except-cable) routes through the gate or makeWildBuild.

---
severity: P3
category: bug
anchor_symbol: migrateStoryPreV16
current_line_hint: ~40690
file: battle.html
agents: [story-mode-investigator]
fingerprint: f815c8179eae
confidence: medium
status: open
---

**Title**: migrateStoryPreV16 marks catchTutorialDone for any pre-v16 save at eventIndex>1, dropping the tutorial for a save sitting on the first route battle

**Evidence**:
```js
function migrateStoryPreV16() {
    if (typeof sm.catchTutorialDone !== 'boolean') {
        sm.catchTutorialDone = (sm.eventIndex | 0) > 1;  // intro rival is array idx 1
    }
}
// A pre-v16 save at eventIndex===2 (about to fight the first Basic Trainer,
// never having seen the tutorial) gets marked done → tutorial never fires,
// 2nd party slot never auto-filled.
```

**Repro**: Pre-v16 save with eventIndex 2 and a 1-mon team → loads with catchTutorialDone=true, no tutorial.

**Blast radius**: One-time onboarding for the narrow set of pre-v16 saves paused exactly on the first post-rival route. Cosmetic (player can still catch normally).

**Fix sketch**: Acceptable as documented; if tightening, gate on `(sm.team||[]).length >= 2 || eventIndex > 1` so a lean-team pre-v16 save still gets the tutorial.

**Verification**: A v15 save at eventIndex 2 with 1 mon still fires the tutorial on next route.

---
severity: P3
category: inconsistency
anchor_symbol: FOE_POWER_CURVE
current_line_hint: ~38265
file: battle.html
agents: [story-mode-investigator]
fingerprint: 95312ca59a5b
confidence: high
status: open
---

**Title**: Foe stat curve keeps climbing post-Gym-4 (City7 1.08, City8 1.10); FLOW §8 says softening ends and foes sit at 1.00 from ≥3 badges

**Evidence**:
```js
const FOE_POWER_CURVE = [0.80,0.85,0.90,0.95,1.00,1.03,1.05,1.08,1.10,1.15]; // city 0..9
// FLOW §8: "| ≥ 3 badges | every fight | 1.00 — softening ends |"
```

**Repro**: `_storyEnemyStatMult('Gym Trainer 1', 7, ...)` → 1.08, not 1.00.

**Blast radius**: Doc-vs-code balance drift; the new model is a smooth city ramp rather than a flat 1.00 plateau. Maintainer-owned numbers.

**Fix sketch**: Update FLOW §8 to describe the city-indexed `FOE_POWER_CURVE` (0.80→1.15) instead of the flat-after-3-badges model.

**Verification**: §8 narrative matches the frozen curve array.

---
severity: P2
category: inconsistency
anchor_symbol: showVictoryOverlay
current_line_hint: ~55542
file: battle.html
agents: [story-mode-investigator]
fingerprint: 14bb789f2b16
confidence: high
status: open
---

**Title**: Per-leader victory flavor now exists, but 56 leaders lack TRAINER_QUOTES_BY_NAME/LEADER_VICTORY_LINES entries and fall to a generic "You received the <Badge>!" line

**Evidence**:
```js
const _leaderLookup = (LEADER_VICTORY_LINES[_trainerName] || LEADER_VICTORY_LINES[_baseTrainerName] || '');
const line = _leaderLookup ? `${speakerName}: ${_leaderLookup}` : `You received the ${_badgeName}!`;
// With GL union-pool (any leader can fill any slot), most leaders have no line.
```

**Repro**: Beat a gym whose assigned leader has no `LEADER_VICTORY_LINES` entry → generic badge line.

**Blast radius**: Fanservice/polish. Prior-audit "generic You received a Gym Badge!" is improved (now names the badge), but the per-leader voice is sparse. Overlaps ledger ISSUE-051.

**Fix sketch**: Extend `LEADER_VICTORY_LINES`/`LEADER_BADGE_REFLECTIONS` coverage toward the full 64-leader union pool, prioritizing the canonical 8.

**Verification**: Every leader that can fill a GL slot has at least a victory line.

---
severity: P2
category: data
anchor_symbol: _SAFARI_GRADE_CURVE_BY_BADGES
current_line_hint: ~56506
file: battle.html
agents: [story-mode-investigator]
fingerprint: eefd4056fd47
confidence: high
status: open
---

**Title**: Safari grade weights are a badge-keyed curve; FLOW §4 still specs the retired flat g1:3/g2:22/g3:50/g4:25

**Evidence**:
```js
const _SAFARI_GRADE_CURVE_BY_BADGES = {
  4:{g1:0,g2:5,g3:60,g4:35}, 5:{g1:0,g2:15,...}, ... 8:{g1:2,g2:45,g3:45,g4:8}
};
// FLOW §4: "SAFARI_GRADE_WEIGHTS g1:3 / g2:22 / g3:50 / g4:25"
```

**Repro**: Compare `_safariGradeWeightsForBadges()` output to FLOW §4. (§15g documents the curve correctly; §4 is stale.)

**Blast radius**: Doc drift only. Matches ledger ISSUE-065/066/067.

**Fix sketch**: Replace the §4 flat-weights line with a pointer to §15g's `_SAFARI_GRADE_CURVE_BY_BADGES` table.

**Verification**: §4 no longer cites static weights.

---
severity: P3
category: inconsistency
anchor_symbol: SAFARI_MAX_ENCOUNTERS
current_line_hint: ~56496
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5898780a2ef2
confidence: high
status: open
---

**Title**: Safari runs 10 encounters / 10 balls; FLOW one-screen summary §1 still says "up to 6 per run"

**Evidence**:
```js
const SAFARI_MAX_ENCOUNTERS = 10;  let SAFARI_BALLS_PER_SESSION = 10;
// FLOW §1: "Continuous random encounters up to 6 per run"
// (FLOW §4 detail table correctly says 10 — only the §1 summary lags.)
```

**Repro**: Compare `SAFARI_MAX_ENCOUNTERS` to FLOW §1 vs §4.

**Blast radius**: Doc inconsistency between §1 and §4 of the same spec.

**Fix sketch**: Change the §1 summary row from "6 per run" to "10 per run" to match §4 and code.

**Verification**: §1 and §4 agree on encounter count.

---
severity: P2
category: refactor
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~33037
file: battle.html
agents: [story-mode-investigator]
fingerprint: c9860c1bea48
confidence: high
status: open
---

**Title**: row[0] (row id) diverges from array index at 25 of 67 rows — a permanent footgun for any code mixing the two

**Evidence**:
```js
// row ids in order: 0,68,1,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,12,20,...,39,40,...,55,...
// 25 positions where row[0] !== arrayIndex (Rival rows 68/12/39 and the 40/55 shuffles).
// sm.eventIndex is an ARRAY INDEX; sm.trainerAssignments is keyed by ROW ID;
// GYM_CITY_LEADER_EVENT stores ARRAY INDICES; STORY_THEMED_BATTLES is keyed by ROW ID.
```

**Repro**: `node -e` over STORY_EVENTS_RAW shows 25 id≠index positions (see investigation log).

**Blast radius**: Catch-tutorial gate, theme resolution, leader-name resolution (49286 comment documents a past City-3 bug from exactly this), and any future timeline edit. Several call sites already carry defensive id↔index conversion comments.

**Fix sketch**: Add a boot-time `_STORY_ROWID_TO_IDX` map + a one-line invariant doc at the array head ("row[0] is a stable id, NOT the array index; eventIndex is the array index"). Consider deriving all id-keyed lookups through the map.

**Verification**: A documented helper exists; grep for raw `STORY_EVENTS_RAW[<rowid-var>]` indexing finds none.
