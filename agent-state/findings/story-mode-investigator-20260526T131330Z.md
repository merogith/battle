---
severity: P2
category: bug
anchor_symbol: GYM_CITY_LEADER_EVENT
current_line_hint: ~39601
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6ff4d34cde7f
confidence: high
status: open
---

**Title**: City-3 display name always falls back to "City 3" — GYM_CITY_LEADER_EVENT returns an array index, but trainerAssignments is keyed by row ID

**Evidence**:
```js
// GYM_CITY_LEADER_EVENT stores the ARRAY INDEX i (line 29966: out[...] = i)
const leaderEvIdx = GYM_CITY_LEADER_EVENT[cityIdx];        // = 17 for Gym Leader 3
const leaderName = sm.trainerAssignments && sm.trainerAssignments[leaderEvIdx]; // keyed by ROW ID, not index!
return (leaderName && GYM_LEADER_CITY_NAMES[leaderName]) || ('City ' + cityIdx);
```

**Repro**: STORY_EVENTS_RAW is NOT index==id everywhere. Gym Leader 3 sits at array index 17 but its row ID is 18 (the v9 intro-rival insertion + a Rival re-order push later rows out of alignment). `sm.trainerAssignments` is written as `trainerAssignments[ev[0]]` (row ID, ~line 34842). So for City 3 the lookup returns `trainerAssignments[17]` = the Gym Trainer 1 (id 17 at index 16), whose name is NOT in GYM_LEADER_CITY_NAMES → the HUD and city header show literal "City 3" instead of the leader's themed town (e.g. "Celadon City"). Verified by enumerating the timeline: only GL3 mismatches (all other gyms coincidentally have index==id). Two call sites: `updateHUD` (~38770) and `getStoryDisplayTownNameForCityRow` (~39601).

**Blast radius**: HUD city label + city screen town name for City 3 specifically. Latent for ALL cities: any future timeline edit that shifts a gym leader's index off its row ID silently breaks that city's name. Same fragile pattern in 2 functions.

**Fix sketch**: GYM_CITY_LEADER_EVENT should map cityIdx → row ID (`out[...] = row[0]`), OR the two consumers should convert index→id via `STORY_EVENTS_RAW[leaderEvIdx][0]` before indexing trainerAssignments. The map name says "EVENT" (id-like) but stores an index — pick one convention and make GYM_CITY_LEADER_EVENT's only consumers agree.

**Verification**: After fix, `getStoryDisplayTownNameForCityRow` for the City3 row returns the assigned GL3 leader's town from GYM_LEADER_CITY_NAMES (not "City 3"). Add a boot assertion that for every cityIdx 1..8, `STORY_EVENTS_RAW[GYM_CITY_LEADER_EVENT[cityIdx]][2] === 'Gym Leader '+cityIdx`.

---
severity: P1
category: bug
anchor_symbol: catchThrow
current_line_hint: ~45155
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7856b112bcd7
confidence: high
status: fixed-main
---

**Title**: The unique Master Ball can be wasted on any wild — soft-locks the Caged God capture (only 1% catch rate without it)

**Evidence**:
```js
} else {
    if (_catchState.safariMode) return;
    if (!sm.balls || (sm.balls[ballKey] | 0) <= 0) return;
    sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;   // master ball decremented like any ball
}
```

**Repro**: The Master Ball is granted exactly once, at post-HoF boss-arc unlock (`sm.balls.master += 1`, ~line 48863) and is deliberately never re-granted (comment at ~41676: "keeping the Master Ball uniquely tied to the Caged God arc"; the 100-dex milestone substitutes a trophy bundle). But every regular catch encounter renders Master Ball as a throwable option (`['poke','great','ultra','master']`, ~line 45008) and `catchThrow` decrements it with no guard. After HoF the player can encounter wilds via the Crucible (`crucibleWildEncounter`) or a re-queued roaming legendary and burn the Master Ball there. The Caged God uses `forcedCatchRate: 0.01` (`bossEnterCage`, ~44160) — with the Master Ball gone, the boss is ~1% per non-Master throw, no guaranteed catch remains.

**Blast radius**: Caged God post-game arc (capture is the whole payoff — Subject Zero + a 10,000G/full-vitamin reward bundle). A player who wastes the ball before collecting the 3 city leads has no recovery path short of grinding 1% throws.

**Fix sketch**: Either (a) hide / disable the Master Ball button outside boss mode (it has no legitimate non-boss use given it's unique), or (b) keep it throwable but re-grant a replacement on cage-unlock if `sm.balls.master === 0`, or (c) make the boss catch fall back to guaranteed on first ball if no Master Ball is held. Option (a) matches the narrative ("saved for that one fight", ~line 10610).

**Verification**: Post-HoF, throw the Master Ball at a Crucible wild, then collect 3 leads and enter the cage — confirm the player can still catch Subject Zero (button present or auto-guaranteed).

---
severity: P3
category: inconsistency
anchor_symbol: rollMysteryFigureFinalBossTeam
current_line_hint: ~34631
file: battle.html
agents: [story-mode-investigator]
fingerprint: cb88ee48b37a
confidence: high
status: open
---

**Title**: Mystery Figure climax boss has ZERO gimmicks if the player disabled all 4 mechanics at run start — the "force all on" ctx is dead-coded

**Evidence**:
```js
const _mechCtx = { settings: { ...sm.settings, megaOn: true, dynaOn: true, teraOn: true, zOn: true } };
// ...but _applyEnemyGimmickDistribution → _storyEnemyMechKeys ANDs with sm.unlockedGimmicks:
//   if (S.megaOn && unlocked.has('mega')) k.push('mega');   ← unlocked is empty
return _applyStoryBuildPowerTier(_applyEnemyGimmickDistribution(picks, 'Mystery Figure', _mechCtx), 'Mystery Figure', null);
```

**Repro**: Start a run with all 4 mechanic checkboxes (Mega/Z/Dynamax/Tera) unchecked — all default checked but are user-toggleable, with no floor forcing at least one. `sm.unlockedGimmicks` then stays `[]` forever (it's filled from `sm.settings.*On`, ~line 42687). At the post-HoF Mystery Figure, `rollMysteryFigureFinalBossTeam` forces `megaOn:true` etc. in `_mechCtx`, but `_storyEnemyMechKeys` requires `unlockedGimmicks.has('mega')` too — so it returns `[]` and the climactic boss (which guarantees 6 gimmick mons via `_minGuaranteedMechsForEvent`) gets zero. Verified by emulating `_storyEnemyMechKeys` with forced ctx + empty unlocked → keys = [].

**Blast radius**: The intended climax difficulty spike is silently nullified for all-mechanics-off runs. Not a crash; the boss is just a standard G1 team. The comment "Final boss rolls from every unlocked mechanic" is misleading — the forced ctx settings never override the unlock gate.

**Fix sketch**: Either make the Mystery Figure's mech keys ignore `unlockedGimmicks` (the post-HoF boss is meant to transcend the player's run gates), or drop the dead `_mechCtx` setting-override and document that an all-off run yields a gimmickless climax by design.

**Verification**: All-mechanics-off run reaching the Mystery Figure — assert the boss team has ≥1 gimmick (if the intended behavior is "always gimmicked") or document the no-gimmick outcome.

---
severity: P3
category: dx
anchor_symbol: loadEngine
current_line_hint: ~48385
file: tests/helpers/load-engine.js
agents: [story-mode-investigator]
fingerprint: 05d7604f22a5
confidence: high
status: open
---

**Title**: Test-harness docs promise window.SAVE_VER / window.sm / window.newStoryRun but only StoryMode + __storyLoad are exposed

**Evidence**:
```
PROBE: win_sm=false, win_newStoryRun=undefined, win_SAVE_VER=undefined
Exposed instead: window.StoryMode (incl .state getter), window.STORY_EVENTS_RAW,
window.storyRngNext, window.__storyLoad, window.__STORY_SAVE_VER
```

**Repro**: `loadEngine()` then read `window.SAVE_VER` → undefined; `window.sm` → undefined; `window.newStoryRun` → undefined. The `inspect-save` skill, this agent's charter, and `run-engine-test` notes all instruct using `window.sm` / `window.SAVE_VER` / `window.newStoryRun`. The real surface is `window.StoryMode.state` (for sm), `window.__STORY_SAVE_VER` (for SAVE_VER), `window.__storyLoad` (for the load/migration entry). New runs go through `StoryMode.startNewRun`, not a `window.newStoryRun`.

**Blast radius**: Every save/story repro a future agent or maintainer writes against the documented names silently no-ops or early-returns (the existing story-flow tests defensively `if (!window.sm) return;` — they pass vacuously when the global is absent). Wastes investigation time.

**Fix sketch**: Either expose the documented aliases on `window` behind the `__testHarness` flag (`window.sm = sm` getter, `window.SAVE_VER = SAVE_VER`, `window.newStoryRun = startNewRun`), or update the skill docs + charter to the real names (`StoryMode.state`, `__STORY_SAVE_VER`, `__storyLoad`). The first is lower-friction for repro authors.

**Verification**: `loadEngine()` → `typeof window.SAVE_VER === 'number'` and `window.sm === window.StoryMode.state`.

---
severity: P3
category: inconsistency
anchor_symbol: _catchHandleSuccess
current_line_hint: ~45261
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4103af534a9a
confidence: medium
status: open
---

**Title**: Eggs occupy a party slot against the catch/withdraw cap but foe size matches only non-egg fighters — eggs silently shrink your catchable roster AND your opponent

**Evidence**:
```js
const maxParty = _storyMaxPartySize();
const partyFull = (sm.team || []).length >= maxParty;   // counts eggs
// vs foe sizing:
const partySize = _storyEnemyPartySize(event, _storyCountFighters() | 0, idx); // fighters only (excludes eggs)
```

**Repro**: After the Daycare egg event, a player carrying eggs (each `isEgg:true`) has them counted in `sm.team.length` for the catch "full" check (`_catchHandleSuccess`, `pcWithdraw` at ~44179) but EXCLUDED from `_storyCountFighters()` used for foe party sizing (~42399) and the proceed/empty checks. So a player with 1 fighter + 2 eggs at a 3-slot cap faces a 1-mon foe (correct-ish) yet cannot catch a new partner (party reads "3/3 full"), and the catch is forced to PC. The two cap interpretations disagree on what a "party slot" is.

**Blast radius**: Mid-game with daycare eggs. Mild — caught mons still land in PC and eggs hatch into the party — but the "you're full, sent to PC" message fires when the player effectively has open fighting slots, which reads as a bug to the player.

**Fix sketch**: Decide one definition of party occupancy. Likely: cap counts ALL slots (eggs included) consistently — then also size foes off `sm.team.length` for parity, OR exclude eggs from the catch-cap so eggs don't block catching. Align `_catchHandleSuccess`/`pcWithdraw` with `_storyEnemyPartySize`.

**Verification**: Carry 2 eggs + 1 fighter at cap 3; attempt a wild catch — confirm the catch-to-party vs catch-to-PC decision matches the intended egg-occupancy rule, and the foe size matches the same rule.

---
severity: P3
category: bug
anchor_symbol: startNewRun
current_line_hint: ~35714
file: battle.html
agents: [story-mode-investigator]
fingerprint: b61c4fb64fc9
confidence: medium
status: open
---

**Title**: Mystery Figure identity is rolled at run start before sm.active/runSeed are live — not reproducible under fixed debug seeds

**Evidence**:
```js
// inside the sm = { ... } object literal, evaluated BEFORE the assignment completes:
mysteryIdentity: _storyPickMysteryIdentity(),
// _storyPickMysteryIdentity uses bare Math.random() (lines ~30034/30042). The global
// Math.random monkeypatch (line ~32404) only seeds when the *current* sm.active &&
// sm.runSeed — but at literal-construction time sm still points at the prior/default state.
```

**Repro**: `startNewRun` builds the new `sm` literal with `mysteryIdentity: _storyPickMysteryIdentity()`. At that instant the module `sm` variable hasn't been reassigned, so the Math.random override (which gates on `sm.active && sm.runSeed != null`) reads the OLD state (default `active:false` on first run → native Math.random; or a stale prior run's seed). The Mystery identity is therefore NOT a function of the new run's seed. The debug seeds (`seedDebugMysteryLegendGate`, `seedDebugPostHofClimax`) pin runSeed for reproducible climax testing, but the masked-figure identity still varies. (Normal play is unaffected — seeds are auto-random per run now, so cross-run replay is moot.)

**Blast radius**: Reproducibility of the Mystery Figure climax under debug/test seeds only. No gameplay impact in normal runs. Prior audits flagged the bare-Math.random; the global monkeypatch added since covers most call sites but not this pre-assignment one.

**Fix sketch**: Roll `mysteryIdentity` AFTER the `sm = {...}` assignment and after `sm.active=true`/`runSeed` are set, OR pass the new runSeed explicitly into `_storyPickMysteryIdentity` and derive from it. Either makes the identity seed-deterministic.

**Verification**: Two `startNewRun` calls with the same forced runSeed produce the same `sm.mysteryIdentity`.

---
severity: P3
category: bug
anchor_symbol: load
current_line_hint: ~32544
file: battle.html
agents: [story-mode-investigator]
fingerprint: a523f2cc0e8d
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — full migrate chain v8→v21 round-trips pre-v15 saves without crash or party/PC/badge loss

**Evidence**:
```
PROBE6 (jsdom __storyLoad): from version {8,13,14,15,16,19} → all newVer=21, threw=null, ok=true,
team preserved (Pikachu,Charizard), PC preserved, badges/gold/balls intact, IVs backfilled to 31,
permBoosts refunded as vitamins (atk:2 → protein:2), v8 eventIndex correctly +1 shifted (10→11).
```

**Repro**: `window.__storyLoad()` with `{version:N,...}` for N in 8..19 (see PROBE6). Each `_loadedVer < K` gate fires in strict ascending order (v8,v9,v10,v11,v12,v13,v14,v15,v16,v17,v18,v19,v20,v21 — the prior P1 about v13/v14 ordering and the v14-skip-at-exactly-v13 are both resolved: v14 is its own `< 14` block). load() wraps each migration in try/catch, clamps eventIndex, validates/drops malformed currentEnemyLock, and on a hard parse failure backs up the raw blob to `pbs_story_save.broken.latest` (BUG-005) instead of silently overwriting.

**Blast radius**: None — this is a positive confirmation that Tier-1 save-migration completeness holds. Recorded so the orchestrator can close the migration concern.

**Fix sketch**: No fix needed. (The only adjacent gap is the v21 egg migration reinterpreting a pre-v21 badge-count as a city index — documented as the deliberate "City N ≈ Gym N" approximation; legacy eggs may hatch a touch earlier than the old Gym-7 gate, which is benign.)

**Verification**: `npm run test:integration` save-migration suite (now exercises real `__storyLoad`, not vacuous JSON round-trip).

---
severity: P3
category: balance
anchor_symbol: _storyBuildTierForEvent
current_line_hint: ~33847
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8909d73d953d
confidence: high
status: open
---

**Title**: Basic Trainer build-tier ladder collapses at Stage 2 — same tier as Gym Trainers despite the "one tier below" comment

**Evidence**:
```js
if (e === 'Basic Trainer') {
    // Route fodder sits one tier below the gym trainer of the same stage...
    if (b >= 5) return STORY_BUILD_TIER.NOVICE;   // GymTrainer here = COMPETENT → OK (one below)
    if (b >= 2) return STORY_BUILD_TIER.NOVICE;   // GymTrainer here = NOVICE   → EQUAL, not one below
    return STORY_BUILD_TIER.UNTRAINED;
}
```

**Repro**: At Stage 2 (badges 2–4), `_storyBuildTierForEvent('Gym Trainer 1', _, 2)` = NOVICE (T2) and `_storyBuildTierForEvent('Basic Trainer', _, 2)` = NOVICE (T2) — identical. The function's own comment promises a "wild trainer < gym staff < gym leader" ladder per stage, which holds at Stage 3 (Basic T2 < GymTrainer T3) but breaks at Stage 2 where both are T2. The two redundant Basic branches (`b>=5` and `b>=2` both NOVICE) suggest the `b>=2` line was meant to return UNTRAINED (one below the Stage-2 gym trainer's NOVICE).

**Blast radius**: Build-power curve for route/Basic trainers across the badges-2..4 mid-early game. Basic Trainers feel as tuned as gym staff in that window, flattening the intended difficulty texture. Purely a build-quality (EVs/nature/item) delta, not a crash.

**Fix sketch**: Change the Basic Trainer `b >= 2` branch to `return STORY_BUILD_TIER.UNTRAINED;` so the ladder is Basic(T1) < GymTrainer(T2) < Leader(T2 floor + ace) at Stage 2, matching Stage 3's relationship. Or, if the collapse is intentional, drop the redundant `b>=5` line and fix the comment.

**Verification**: `StoryMode.debugBuildTiers()` matrix — confirm Basic Trainer is strictly below Gym Trainer 1 at every badge count 2..7.

---
severity: P3
category: bug
anchor_symbol: proceedToNextBattle
current_line_hint: ~41826
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7a285290260d
confidence: low
status: open
---

**Title**: proceedToNextBattle guards on total team length, but the launch path guards on non-egg fighter count — an all-egg party advances eventIndex then bounces

**Evidence**:
```js
function proceedToNextBattle() {
    if (sm.team.length === 0) { ...return; }   // counts eggs
    // ...later sets sm.eventIndex = nextBattleIdx; save();
}
// vs the launch path:
if (_storyCountFighters() === 0) { window.showGameAlert('You have no Pokémon...'); enterCity(); return; } // excludes eggs
```

**Repro**: `proceedToNextBattle` passes its guard whenever `sm.team.length > 0` — including a party that is all eggs (0 fighters). It then advances `sm.eventIndex` to the next Battle row and saves BEFORE `enterBattleEvent`'s `_storyCountFighters() === 0` guard fires, bounces to city, and `eventIndex` is left on (or near) the battle row until the next city walk-back. Currently NOT reachable in normal play — `pcDeposit`/`pcSell`/`pcRelease` all block removing the last non-egg fighter (`_pcTeamHasOnlyOneMon` counts `!isEgg`), so a 0-fighter party can't form. Latent guard mismatch, not an exploit today.

**Blast radius**: None observed; defensive only. Becomes a real bounce/soft-lock if any future feature lets eggs fully occupy the party (e.g. multi-egg daycare, egg-only gifts).

**Fix sketch**: Make `proceedToNextBattle` use `_storyCountFighters() === 0` for parity with the launch guard, and don't advance `sm.eventIndex` before confirming a fightable party.

**Verification**: Force an all-egg `sm.team`, call `proceedToNextBattle` — confirm eventIndex is NOT advanced and the player is routed to the Professor/city without a stale battle index.

---
severity: P2
category: inconsistency
anchor_symbol: _renderFrontierHub
current_line_hint: ~43747
file: battle.html
agents: [story-mode-investigator]
fingerprint: eb2165a89001
confidence: high
status: open
---

**Title**: Battle Frontier hub displays stale, weaker foe-scaling numbers than what applyStoryLeagueFoeStatBoost actually applies

**Evidence**:
```js
// _renderFrontierHub (display):
const hpMult = Math.min(2.50, 1.35 + (round - 1) * 0.05);     // caps 2.50
const bulkMult = Math.min(1.80, 1.20 + (round - 1) * 0.03);   // caps 1.80
// applyStoryLeagueFoeStatBoost (actually applied, "accelerated ramp"):
const hpM   = Math.min(3.00, 1.50 + (round - 1) * 0.075);     // caps 3.00
const bulkM = Math.min(2.00, 1.25 + (round - 1) * 0.045);     // caps 2.00
```

**Repro**: Open the Battle Frontier hub. It prints "Round N foe stats: HP ×X, bulk/speed ×Y" using the OLD formula, and the intro tip says "+35% HP edge at the start". But `applyStoryLeagueFoeStatBoost` (the function startBattle actually runs on Frontier foes) uses the post-overhaul sharper curve. Computed deltas: round 1 displays HP ×1.35 / actual ×1.50; round 10 displays ×1.80 / actual ×2.18; round 21 displays ×2.35 / actual ×3.00. Bulk/speed likewise understated, and the display omits that speed scales too.

**Blast radius**: Player-facing difficulty information for the entire Frontier ladder. Players plan team investment off numbers that understate the real wall — every round is meaningfully harder than advertised. The "accelerated ramp" overhaul updated the apply-side but left two display sites (the per-round line ~43759 and the intro tip ~43738) on the pre-overhaul formula.

**Fix sketch**: Single-source the multipliers: have `_renderFrontierHub` read the same constants/formula as `applyStoryLeagueFoeStatBoost` (factor it into a shared `_frontierFoeMult(round)` helper) and update the intro-tip copy to "+50% HP edge at the start ... caps at +200% HP".

**Verification**: Hub round-N display equals the actual maxHp/stat multiplier applied to a Frontier foe at round N (compare displayed string vs `mon.maxHp` ratio post-boost).

---
severity: P2
category: bug
anchor_symbol: _storyEvoStageCapForRow
current_line_hint: ~33074
file: battle.html
agents: [story-mode-investigator]
fingerprint: 62b71f668975
confidence: high
status: open
---

**Title**: rollTrainerTeam's evo-stage cap uses cityIndexFromEventIndex on a ROW ID (not array index) — intro Rival gets cap 2 (fully evolved) instead of 0 (basics-only)

**Evidence**:
```js
function _storyEvoStageCapForRow(rowIdx) {
    if (rowIdx == null || !(sm && sm.active)) return 2;
    return _storyEvoStageCapForCity(cityIndexFromEventIndex(rowIdx)); // cityIndexFromEventIndex expects an ARRAY INDEX
}
// caller: rollTrainerTeam(..., event, idx) where idx = ev[0] = ROW ID (~line 42422)
// const _evoStageCap = _storyEvoStageCapForRow(storyRowIdx);  // storyRowIdx is a row ID
```

**Repro**: STORY_EVENTS_RAW row IDs are NOT array indices (intro Rival is array index 1 but row ID 68). `cityIndexFromEventIndex(ei)` walks `STORY_EVENTS_RAW[ei]` treating `ei` as an array index. `rollTrainerTeam` is called with `storyRowIdx = ev[0]` (row ID) and passes it through `_storyEvoStageCapForRow` → `cityIndexFromEventIndex(68)`, which (68 is past the 0–66 array) walks down to the last City row = City 9 → evo cap 2 (no restriction). The intro Rival therefore can field FULLY-EVOLVED Pokémon; the design intends City-0 basics-only (cap 0). Verified: `cityIndexFromEventIndex(68)=9, evoCap=2` vs correct `cityIndexFromEventIndex(1)=0, evoCap=0`. Three other rows also diverge (Basic Trainer idx14/id15, Rival idx19/id12, Elite Trainer idx57/id58). NOTE the SAME `storyRowIdx` is correctly a row ID for the sibling call `applyStoryProgressToGradeWeights` (which compares against row-ID constants STORY_GRADE_BIAS_ROW_*), so the fix belongs in `_storyEvoStageCapForRow`, not the caller.

**Blast radius**: Evo-stage cap for every trainer whose row ID ≠ array index — most visibly the intro Rival (the player's first fight) showing evolved forms it shouldn't. Mitigated for the intro Rival by its g4:100 gradeWeights (weak-BST pool), but the stage cap is still violated and the early-Rival case is exactly the one the code comment claims to protect ("only bites the early Rival").

**Fix sketch**: `_storyEvoStageCapForRow` should convert the row ID to an array index before calling `cityIndexFromEventIndex` — e.g. `const ai = STORY_EVENTS_RAW.findIndex(r => r && (r[0]|0) === (rowIdx|0)); return _storyEvoStageCapForCity(cityIndexFromEventIndex(ai));` — or accept an array index and have `rollTrainerTeam` pass the array index for the cap while keeping the row ID for the grade-bias call.

**Verification**: `rollTrainerTeam` for the intro Rival (row 68) yields only Stage-0 (unevolved) species; assert `_storyEvoStageCapForRow(68) === 0` after the fix.

