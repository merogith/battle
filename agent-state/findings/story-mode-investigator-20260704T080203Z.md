---
severity: P1
category: bug
anchor_symbol: catchThrow
current_line_hint: ~60957
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8c00879fe027
confidence: high
status: fixed-claude/bug-performance-investigation-8snuw9
---

**Title**: Party+PC-full check runs AFTER ball spend + catch roll — ball burned, mon discarded, roaming legendary lost on a successful Master Ball throw

**Evidence**:
```js
// catchThrow (~60957): ball is consumed before any storage check
if (!sm.balls || (sm.balls[ballKey] | 0) <= 0) return;
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;
// ..._catchHandleSuccess (~61060): only NOW is storage checked
const partyFull = _storyPartyFullForCatch();
const pcFull = (sm.pcBox || []).length >= PC_BOX_CAP;
if (partyFull && pcFull) {
    _catchFinishWithMessage(`Your party (…/…) and PC (30/30) are full. Free a slot at the Pokémon Center, then try again.`);
```

**Repro**: jsdom harness — seed sm with 6 fighters + 30/30 PC + 1 Master Ball, run `StoryMode.crucibleWildEncounter()`, then `StoryMode.catchThrow('master')`. Observed: `sm.balls.master 1→0`, team 6 / PC 30 unchanged, catch body shows the "full… try again" message with only a Continue button (encounter ended by `_catchFinishWithMessage` → `ended=true`). Script: scratchpad `repro-catch-full.test.js` (passes, demonstrating the loss).

**Blast radius**: Every catch surface funnels through `_catchHandleSuccess` — route wilds, Wander, Crucible encore, and the roaming legendary. For the roaming legendary (forcedFleeRate 1.0, one-shot), a player at full storage loses the 1-per-run Master Ball AND the legendary permanently even though the throw *succeeded*. The message's "then try again" is false — the encounter is force-ended and route wilds don't re-fire (wildSeen already consumed). FLOW §3 says "capture fails with explicit modal" but never sanctions burning the ball.

**Fix sketch**: Check `partyFull && pcFull` at the top of `catchThrow` (before decrementing) and refuse the throw with the modal, leaving Run available; or refund the ball and keep the encounter open when the full-full branch is hit.

**Verification**: Re-run the repro — ball count must be unchanged (or refunded) and the encounter must remain open (Run still visible), roaming legendary included.

---
severity: P1
category: bug
anchor_symbol: _withEventSeededRng
current_line_hint: ~46489
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1ed4ca03a321
confidence: high
status: fixed-claude/bug-performance-investigation-8snuw9
---

**Title**: _withEventSeededRng swaps window.storyRngNext but the Math.random patch calls the LOCAL storyRngNext — seeded "static rolls" mix two streams

**Evidence**:
```js
// _withEventSeededRng swaps only the window binding:
const saved = window.storyRngNext;
window.storyRngNext = function () { …LCG(seed(eventIdx))… };
// but the global patch (~42864) closes over the IIFE-local fn:
Math.random = function () {
    if (…sm.active === true && sm.runSeed != null) return storyRngNext(); // ← local = MAIN persisted stream
    return _nativeMathRandom.call(Math);
};
```

**Repro**: jsdom — with an active seeded run, `__rivalTest.withEventSeededRng(7, () => window.storyRngNext())` returns the identical value on repeat calls (0.50222… twice), but `withEventSeededRng(7, () => Math.random())` returns different values (0.2462…, 0.4639…) and advances the persisted `sm._strngState`. Script: scratchpad `repro-seeded-rng.test.js` (passes).

**Blast radius**: Every `Math.random()` call site inside a seeded roll silently reads/drains the MAIN story stream instead of the per-event LCG: `_pickWildSpeciesRandom` (the route-wild species pick, wrapped at ~48405 under a comment claiming "refresh/flee/revisit reproduces the same encounter"), ~15 `Math.random` sites inside `makeBuild` (set pick, archetype pick), `rollGimmick`, and the Wander encounter rolls (spec comment says "All rolls are seeded … for deterministic replays"). Net effect: (a) per-event rolls are NOT a pure function of (runSeed, eventIdx) as the static-roll spec states — they depend on full run history; (b) each roll perturbs the persisted replay stream (same drift family as ISSUE-062/007 but a distinct mechanism). Trainer teams are rescued by `sm.currentEnemyLock` persistence; wild/wander encounters are not.

**Fix sketch**: Make the Math.random patch read `window.storyRngNext` (dynamic lookup) instead of the closed-over local, or have `_withEventSeededRng` also swap the local via an indirection (e.g. a module-level `_activeRng` both the patch and window read).

**Verification**: `withEventSeededRng(7, () => Math.random())` returns identical values across calls and leaves `sm._strngState` untouched; two `rollWildEncounter` calls under the same (runSeed, key) produce the same species.

---
severity: P3
category: inconsistency
anchor_symbol: rollWildEncounter
current_line_hint: ~60584
file: battle.html
agents: [story-mode-investigator]
fingerprint: d5cc81169459
confidence: high
status: open
---

**Title**: Three-way comment contradiction on wild-roll determinism — interrupt says seeded/static, roller says "pure RNG end-to-end", reality is the persisted main stream

**Evidence**:
```js
// wildRoute interrupt (~48399): "Static-roll spec: seed each route wild by (runSeed,
// battleIdx, which wild in the node) so refresh/flee/revisit reproduces the same encounter."
const enc = _withEventSeededRng(_wildSeedKey, () => rollWildEncounter(storySettingsGens()));
// rollWildEncounter (~60584): "Pure RNG end-to-end — no seed reuse so reloads and
// rematches each surface a different species."
```

**Repro**: Read the two comments; actual behavior (see the `_withEventSeededRng` finding) matches neither — the species pick consumes the seeded MAIN stream via the Math.random patch.

**Blast radius**: `_pickStarterPartner`'s header comment ("Uses Math.random (not seeded story RNG) so save-reload reroots the pick") is wrong for the same reason — Math.random IS the seeded stream during an active run. Any future contributor tuning wild determinism will be misled whichever comment they trust.

**Fix sketch**: After fixing the seeded-wrapper bug, pick ONE contract (seeded-static per the interrupt comment appears to be the newer intent), implement it, and delete the losing comments.

**Verification**: grep for "Pure RNG end-to-end" / "reroots the pick" → 0 stale hits after the rewrite.

---
severity: P2
category: bug
anchor_symbol: _storyEnemyPartySize
current_line_hint: ~54252
file: battle.html
agents: [story-mode-investigator]
fingerprint: 785c8b0b4820
confidence: high
status: open
---

**Title**: 'Victory Road' event branches (~10 functions) are all dead — no timeline row or synthesized event carries that name; VR rows run as plain 'Elite Trainer'

**Evidence**:
```js
// grep "=== 'Victory Road'" → 10 branches incl.:
_storyEnemyPartySize: /Victory Road/i.test(e) → always 6
_trainerTierForEvent:  if (e === 'Victory Road') return 0.50;   // vs Elite Trainer 0.08
_minGuaranteedMechsForEvent: if (e === 'Victory Road') return 3; // vs Elite Trainer 0
_storyBuildTierForEvent: 'Victory Road' → TOURNAMENT
_storyIllegalCountForEvent: 'Victory Road' → 2
// STORY_EVENTS_RAW rows 56-58 (the Victory Road stretch) are event 'Elite Trainer';
// nothing ever assigns event = 'Victory Road'.
```

**Repro**: `grep -n "= 'Victory Road'" battle.html` → only comparisons, zero assignments; rows 56–58 in `STORY_EVENTS_RAW` read `'Elite Trainer'`. `renderCityActions`' `actions.includes('Victory Road')` also never matches any City row's actions.

**Blast radius**: The intended Victory-Road treatment (50% per-mon mechanic tier, 3 guaranteed gimmick aces, 2 illegal-build slots, 0.70 sig probability) silently never applies — the pre-League stretch plays as ordinary Elite Trainers (~8% mech chance, 0 guaranteed, sig 0.55). Build tier/set-power mostly land right anyway via the `badges >= 8` short-circuits, so this is primarily a mechanics/flavor density loss on the run's penultimate beat, plus ~10 dead branches misleading every future balance pass.

**Fix sketch**: Either stamp the three rows between City 8 and City 9 with event `'Victory Road'` (and migrate `trainerAssignments` keys accordingly) or delete the dead branches and re-key the intended VR bonuses onto "Elite Trainer at badges 8, pre-HoF".

**Verification**: Roll rows 56–58 at 8 badges and confirm guaranteed mech count / mech chance match the chosen design; grep the dead comparisons → 0 or all reachable.

---
severity: P3
category: inconsistency
anchor_symbol: _minGuaranteedMechsForEvent
current_line_hint: ~44006
file: battle.html
agents: [story-mode-investigator]
fingerprint: e1fdf9d40fda
confidence: high
status: open
---

**Title**: GL6/GL7 guaranteed-mechanic rows are unreachable — the city<8 enemy-mech gate in _applyEnemyGimmickDistribution returns before they apply

**Evidence**:
```js
// _minGuaranteedMechsForEvent: GL8→3, GL7→2, GL6→1
if (n >= 8) return 3; if (n >= 7) return 2; if (n >= 6) return 1;
// _applyEnemyGimmickDistribution (~44035): main-timeline hard gate
if (storyRowIdx != null && sm && sm.active && !(ctx && ctx.settings)) {
    let _mechCity = cityIndexFromEventIndex(storyRowIdx);
    if (_mechCity >= 0 && _mechCity < 8) return team;   // GL6 (city 6), GL7 (city 7) → no mechs, ever
}
```

**Repro**: GL6 sits in city 6, GL7 in city 7 → both hit the `< 8` early return on the main timeline AND on Crucible gym rematches (which pass real rows). Only Frontier / forced-ctx (Mystery) bypass.

**Blast radius**: The GL6/GL7 min-guarantee rows are dead in every reachable path; `_storyEnemyMechKeys`' header ("all four enter the enemy candidate pool at once" at badges≥6) and this table both overstate when enemies actually field mechanics (city 8+ per Spec 1f). Distinct from ISSUE-090 (comment drift on the unlock clock) — this is a dead data table.

**Fix sketch**: Either delete the GL6/GL7 rows (city gate is the real rule) or key the gate to allow gym-leader rows their guarantee one city early if that's the intended showcase.

**Verification**: Roll GL6/GL7 teams at their timeline rows; assert 0 gimmicks (post-cleanup) or the intended guarantee (post-rekey).

---
severity: P3
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~41796
file: battle.html
agents: [story-mode-investigator]
fingerprint: 63f79008c160
confidence: high
status: open
---

**Title**: Stale migration-chain comments at the SAVE_VER block — "chain's last versioned step is v24" and "runs migrateStoryPreV8..PreV22" while the chain runs to v28

**Evidence**:
```js
// v24 removes the post-HoF "Caged God" boss arc — migrateStoryPreV24 strips
// the vestigial sm.bossArc state. The chain's last versioned step is v24.
…
const SAVE_VER = 28;
// Test hook: … (load() runs migrateStoryPreV8..PreV22 against a saved `version`).
```

**Repro**: `load()` at ~43025 runs the chain through `migrateStoryPreV28` (v25/v26/v27/v28 steps exist directly below the comment claiming v24 is last). Related nit: the catch-tutorial section header (~54530) still says "guaranteed-easy wild encounter (90% catch, no flee)" while the interrupt ships `forcedCatchRate: 1.0`.

**Blast radius**: The SAVE_VER block is the first thing any save-migration work reads; both stale sentences contradict the code three lines away, in the codebase's most save-sensitive region.

**Fix sketch**: Update the two comments (chain's last step = v28; hook exercises PreV8..PreV28) and the 90%→100% tutorial note.

**Verification**: Comments match `SAVE_VER` and the last `migrateStoryPreV*` in the chain.

---
severity: P3
category: refactor
anchor_symbol: usedTrainerNames
current_line_hint: ~46632
file: battle.html
agents: [story-mode-investigator]
fingerprint: 27ef6b1a0632
confidence: high
status: open
---

**Title**: sm.usedTrainerNames is a write-only save field — written by assignTrainers, reset by startNewRun, never read

**Evidence**:
```js
// only two references in the whole file:
46632:            sm.usedTrainerNames = [...usedBase];
47450:                profUsed:{}, usedTrainerNames:[], gymCleared:{}, …
```

**Repro**: `grep -n "usedTrainerNames" battle.html` → 2 hits, both writes. The array (one entry per assigned trainer) is serialized into `pbs_story_save` on every save() for nothing.

**Blast radius**: Pure save bloat + a misleading signal that trainer-uniqueness state persists (uniqueness is actually re-derived in `assignTrainers` from `sm.trainerAssignments`).

**Fix sketch**: Delete both writes; optionally strip the key in the next migration.

**Verification**: grep → 0 hits; save JSON no longer contains the key on a fresh run.

---
severity: P3
category: inconsistency
anchor_symbol: enterSafariZone
current_line_hint: ~59332
file: battle.html
agents: [story-mode-investigator]
fingerprint: a0fc081f0985
confidence: high
status: open
---

**Title**: Safari paid-entry confirm says "Unused balls are refunded at the gate" — balls are session-scoped and forfeited; exit copy and FLOW both say so

**Evidence**:
```js
ok = await window.showGameConfirm(`Enter the Safari Zone for ${SAFARI_ENTRY_COST…}G?\n\n${SAFARI_BALLS_PER_SESSION} Safari Balls, up to ${SAFARI_MAX_ENCOUNTERS} encounters. Unused balls are refunded at the gate; the entry fee is not.`);
// vs safariLeaveEarly(): 'The warden takes back any unused Safari Balls at the gate. House rules.'
// vs FLOW §4: "leftover Safari Balls are forfeited on exit."
```

**Repro**: Read the two strings; Safari Balls never enter `sm.balls` (session-only `_safariSession.ballsLeft`), so there is nothing to "refund".

**Blast radius**: A player reading the 10,000G confirm may believe unused balls convert to something; sets a false expectation at the run's biggest gold sink.

**Fix sketch**: Reword the confirm to "Unused balls are forfeited at the gate" (or "returned to the warden").

**Verification**: Copy agrees across confirm, exit message, and FLOW §4.

---
severity: P3
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~34178
file: battle.html
agents: [story-mode-investigator]
fingerprint: ab47b49b69e8
confidence: high
status: open
---

**Title**: FLOW §1/§2 pin the timeline at "67 rows / idx 0–66, unchanged" — shipped is 68 rows with row ids 0–68 (2 and 54 unused, intro rival id 68 at array idx 1)

**Evidence**:
```js
const STORY_EVENTS_RAW = [
  [0,'City','City0',…],
  [68,'Battle','Rival',…],   // intro rival, row id 68 at ARRAY idx 1
  [1,'Battle','Basic Trainer',…],
// total rows: 68; ids skip 2 and 54; ids 12/39 out of array order
```

**Repro**: Count rows at ~34178; compare STORY_MODE_FLOW.md §1 ("67 rows / idx 0–66, unchanged") and §2.

**Blast radius**: Adjacent to but distinct from ISSUE-057 (id-vs-index footgun) and the SAVE_VER doc drift — anyone auditing "the 67 rows" from the spec will mis-scope by one row and miss that the highest row id (68) is the FIRST battle.

**Fix sketch**: One-line spec correction in FLOW §1/§2 noting 68 rows, ids 0–68 with 2/54 unused and the intro-rival splice.

**Verification**: Spec row count matches `STORY_EVENTS_RAW.length`.

---
severity: P4
category: bug
anchor_symbol: _shouldFireCatchTutorialBeforeBattle
current_line_hint: ~54562
file: battle.html
agents: [story-mode-investigator]
fingerprint: 63c78fdf475e
confidence: high
status: open
---

**Title**: VERIFIED OK — catch-tutorial fire-once integrity holds across save/load, both catch landing paths, and the retry path

**Evidence**:
```js
// gate: if (!sm || sm.catchTutorialDone) return false;  (+ intro-rival ordering guard)
// done-mark ONLY on actual catch success, in BOTH landing sites:
// _catchHandleSuccess (~61094) and _finalizeCatchPending (~61159);
// retryFromGameOver replays with enterBattleEvent(ev, true) → interrupts skipped.
```

**Repro**: Code audit of the three sites; mid-tutorial reload leaves the flag false (tutorial re-fires with the partner still missing — intended per the in-code note).

**Blast radius**: None — recorded to close the Tier-1 audit item so later agents don't re-investigate.

**Fix sketch**: n/a.

**Verification**: n/a (already verified).

---
severity: P4
category: bug
anchor_symbol: _withStoryPlayerGimmickGate
current_line_hint: ~14154
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8012f8e358c4
confidence: high
status: open
---

**Title**: VERIFIED OK — every player-side acquisition path wraps makeBuild in the gimmick gate; Cable Link remains the sole documented exception

**Evidence**:
```js
// gated: makeWildBuild (60490), roaming-legendary prepare (48354), pending build
// (48354/49612), professor/mystery pick loop (53795), evolution (63822).
// ungated by maintainer decision 2026-05-25: _makePlayerLinkBuild (63159).
// enemy side filters via _storyEnemyMechKeys(unlockedGimmicks) + city<8 gate.
```

**Repro**: `grep -n "_withStoryPlayerGimmickGate" battle.html` — all player build factories wrapped; `_eggBuildFor` routes through `makeWildBuild` (gated; its raw fallback is latent-only, already ISSUE-074).

**Blast radius**: None — closes Tier-1 mandate item 2.

**Fix sketch**: n/a.

**Verification**: n/a.

---
severity: P4
category: bug
anchor_symbol: GYM_CITY_LEADER_EVENT
current_line_hint: ~38920
file: battle.html
agents: [story-mode-investigator]
fingerprint: da9a1c34d71e
confidence: high
status: open
---

**Title**: VERIFIED OK — GYM_CITY_LEADER_EVENT is now derived from STORY_EVENTS_RAW at boot; the prior hard-coded map fragility is resolved

**Evidence**:
```js
const GYM_CITY_LEADER_EVENT = (function buildGymCityLeaderMap() {
    const out = {};
    for (let i = 0; i < STORY_EVENTS_RAW.length; i++) { … out[gymN] = i; }
    return out;
})();
// consumer at ~51762 documents ARRAY-INDEX semantics and converts to row-id for
// trainerAssignments; _CRUCIBLE_BATTLE_IDX (~59426) mirrors the derive approach.
```

**Repro**: Read the IIFE + the two consumers.

**Blast radius**: None — closes Tier-1 mandate item 6 (prior-audit hard-code).

**Fix sketch**: n/a.

**Verification**: n/a.

---
severity: P4
category: balance
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~38697
file: battle.html
agents: [story-mode-investigator]
fingerprint: a91dbe6c7d91
confidence: high
status: open
---

**Title**: VERIFIED OK — Hard coin multiplier is now 1.00 (prior-audit ×0.92 punishment fixed); Challenge pays 0.90 as an intentional kaizo tax

**Evidence**:
```js
// Hard pays at parity (1.00) — no bonus, no penalty.
if (diff === 'hard') return 1.00;
// Very Hard (hardcore Kaizo) pays BELOW parity: a deliberate hardcore tax…
if (diff === 'challenge') return 0.90;
```

**Repro**: Read `storyDifficultyCoinMult`. FLOW §8's Challenge row (1.10) remains stale — already tracked as ISSUE-176; no new doc finding filed.

**Blast radius**: None — closes Tier-2 mandate item 14.

**Fix sketch**: n/a.

**Verification**: n/a.

---
severity: P4
category: bug
anchor_symbol: _storyMaxPartySize
current_line_hint: ~54283
file: battle.html
agents: [story-mode-investigator]
fingerprint: a8f81748d4b6
confidence: high
status: open
---

**Title**: VERIFIED OK — party-cap and foe-size curves both implement min(6, 2+badges) with the spec'd exceptions; PC overflow at cap produces the explicit modal

**Evidence**:
```js
function _storyMaxPartySize() { return Math.max(2, Math.min(6, 2 + badges)); }
// _storyEnemyPartySize: finales always 6; intro rival player-match; role-floor safety net.
// catch at cap → PC (or swap prompt); party+PC full → explicit modal (PC_BOX_CAP=30).
```

**Repro**: Code audit + passing tests/integration/story-flow.test.js + catch-system.test.js. (Note: the modal path has the ball-burn bug filed separately as the P1 `catchThrow` finding; the message and cap math themselves are correct.)

**Blast radius**: None — closes Tier-1 mandate items 3 and 5.

**Fix sketch**: n/a.

**Verification**: n/a.

---
severity: P3
category: bug
anchor_symbol: _storyQueueRoamingFromVictory
current_line_hint: ~54516
file: battle.html
agents: [story-mode-investigator]
fingerprint: b5fc5902b9a0
confidence: medium
status: open
---

**Title**: Post-Gym-8 roaming "Sightings report" alert opens beneath the victory overlay and is force-hidden unread by the overlay's Continue handler

**Evidence**:
```js
// onBattleEnd win path (~57944), BEFORE showVictoryOverlay renders:
try { _storyQueueRoamingFromVictory(en); } catch (e) {}
// → window.showGameAlert('📡 Sightings report: a wild X has been spotted… Bring the strongest ball you have.')
// victory-overlay Continue callback then runs:
document.querySelectorAll('.screen,.modal').forEach(el=>el.classList.add('hidden'));
// #modal-game-alert has class "modal" → hidden without ever being read.
```

**Repro**: Win Gym Leader 8 with the roaming slot unfired. The alert modal opens under the spotlight-tier victory card (the same NOTIF-1 z-order problem the reward toasts were migrated off of — see the in-code comment at ~57817), and the card's Continue hides every `.modal` including the unread alert.

**Blast radius**: The player loses the ONLY telegraph for the one-shot roaming legendary ("one chance, one throw… bring the strongest ball") right before a forcedFleeRate-1.0 encounter — they hit the sighting cinematic cold and may throw a Poké Ball at it. The encounter itself still fires (pending persists), so this is a lost heads-up, not a lost feature.

**Fix sketch**: Thread the sighting line into `_victoryRewardLines` (the on-card mechanism built for exactly this) instead of calling showGameAlert from the win path.

**Verification**: GL8 victory card shows the sightings line; no orphaned hidden `#modal-game-alert` after Continue.

---
severity: P3
category: bug
anchor_symbol: _renderPartySwapPrompt
current_line_hint: ~61103
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8470c4f6cd77
confidence: high
status: open
---

**Title**: A successful catch parked at the "bench at capacity" swap prompt lives only in module-local _pendingCaught — reload/close loses the mon (ball already spent)

**Evidence**:
```js
// Holds the just-caught mon while the player picks "send to PC" or
// "swap with party slot N". Cleared on resolution.
let _pendingCaught = null;           // module-local, never serialized
// _catchHandleSuccess: partyFull && !pcFull → _pendingCaught = caught; _renderPartySwapPrompt(caught); return;
```

**Repro**: Catch a wild while at party cap with PC room → swap prompt renders. Close/reload the tab at the prompt: `_storyAutosaveOnClose` persists `sm` (which contains neither the mon nor the pending state) and warps to the last city. The caught mon, the spent ball, and (if roaming) the once-per-run legendary are gone; the Pokédex "caught" mark is also skipped since it only lands in `_finalizeCatchPending`.

**Blast radius**: Any at-cap catch (common from mid-game — cap 4-6 with active catching), Safari catches at cap, and the roaming legendary at cap. Same one-way-loss family as the P1 `catchThrow` full-full finding but on the party-full/PC-free branch.

**Fix sketch**: Commit the catch to `sm.pcBox` immediately in `_catchHandleSuccess` and make the swap prompt a rearrangement UI (move from PC into a chosen slot), so no state ever exists only in a module-local.

**Verification**: Reload at the swap prompt → the mon is in the PC and dex-marked; no resource loss.

