---
severity: P2
category: refactor
anchor_symbol: _buildUnifiedStoryEvents
current_line_hint: ~42440
file: battle.html
agents: [consistency-auditor]
fingerprint: f4639e9e207a
confidence: high
status: open
---

**Title**: Two parallel story-flow engines coexist — new "unified" engine built but never wired (P2/P3 never done)

**Evidence**:
```js
// UNIFIED STORY-FLOW ENGINE (single-engine refactor — P1 scaffolding).
// Built PARALLEL to the legacy dispatch (_resolveActiveRoadBeats + ...) and NOT
// yet wired into processNextEvent — P2 swaps the live path to it, P3 deletes the legacy.
// One registry + one resolver + one dedup ledger. P1 REPRODUCES the legacy dispatch exactly
```

**Repro**: `grep -nE '_buildUnifiedStoryEvents|_unifiedResolveRow|_flowSeen|_flowMarkSeen' battle.html` — all four new-engine fns are referenced ONLY from their definitions (~42457-42509) and the `__testHarness` export bag (~38082-38085). Zero live callers. The legacy dispatch (`_resolveActiveRoadBeats`, `_activeBattleBeatForCurrentRow`, `_tryFireRoadStoryBeats`) is still the only path `processNextEvent` runs.

**Blast radius**: This is the maintainer's "old code racing new code" concern in its purest form. Today it is NOT a runtime race (the unified engine is dormant/test-only), but it is the largest superseded-residue body in the file: a full second flow engine that deliberately "REPRODUCES the legacy dispatch exactly." The danger is divergence — any future flow-bug fix applied to one engine and not the other silently breaks the parity the test (`story-flow-engine-v23.test`) asserts. The four documented flow bugs (audit §4: clumping, ending-before-climax, story-battle-on-gym-approach, fragmented dedup) are pending in the new engine and unfixed in the live legacy one.

**Fix sketch**: Decide the refactor's fate. Either (a) finish the swap (P2 wire `_unifiedResolveRow` into `processNextEvent`, P3 delete the legacy dispatch + the 10 scattered shown-once maps) so there is one engine, or (b) if the swap is shelved, delete the dormant unified engine + its harness exports so two engines can't drift. Do not leave it half-migrated.

**Verification**: After (a): legacy dispatch fns return 0 grep hits and the v23 parity test still passes against the live path. After (b): `_buildUnifiedStoryEvents`/`_unifiedResolveRow`/`_flowSeen`/`_flowMarkSeen` return 0 grep hits.

---
severity: P3
category: refactor
anchor_symbol: build.tired
current_line_hint: ~35131
file: battle.html
agents: [consistency-auditor]
fingerprint: 67a1e4cfc010
confidence: high
status: open
---

**Title**: Dead `build.tired` fatigue field still written/backfilled at 5 sites, read in zero gameplay paths

**Evidence**:
```js
if (typeof slot.build.tired !== 'number') slot.build.tired = 0;     // ~35131
if (typeof slot.build.tired !== 'number') slot.build.tired = 0;     // ~35775
slot.build.tired = Math.max(0, Math.min(3, slot.build.tired | 0));  // ~35776
if (typeof b.tired !== 'number') b.tired = 0;                       // ~44611
if (typeof build.tired !== 'number') build.tired = 0;              // ~45025
```

**Repro**: `grep -nE '\.tired\b' battle.html | grep -viE 'retired'` → the 5 write/backfill sites above plus 2 comments (15203, 44501). A read-only grep (`grep -nE '\.tired' | grep -vE "= 0|typeof|//"`) returns NOTHING — the field is never consumed by any stat, damage, or display path. The fatigue system was cut ("Path D") and `_storyApplyTiredness` is an inert no-op (~44518) with zero callers.

**Blast radius**: Self-contained. Save-schema field (`SAVE_VER`-owned per CLAUDE.md sensitive areas), so deletion of the backfill must coordinate with the migration owner. No gameplay behavior depends on it.

**Fix sketch**: Drop the 5 `build.tired` backfill/clamp writes and the uncalled `_storyApplyTiredness` no-op. The field can stay tolerated-on-load (ignored) without being actively re-written. Coordinate the schema touch with the save-owner since it lives under the migration umbrella.

**Verification**: `grep -nE '\.tired\b' battle.html | grep -viE 'retired'` returns only tolerated-on-read references (or zero). Existing-save load test still passes.

---
severity: P3
category: refactor
anchor_symbol: _permBoostsRead
current_line_hint: ~33335
file: battle.html
agents: [consistency-auditor]
fingerprint: ab3e79af56a9
confidence: high
status: open
---

**Title**: Inert `_permBoostsRead`/`_permBoostTotal` stubs (+ window export) have zero callers — fully dead

**Evidence**:
```js
function _permBoostsRead(_mon) { return { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 }; }
function _permBoostTotal(_mon) { return 0; }
window._permBoostsRead = function(_buildObj) { return { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 }; };
```

**Repro**: `grep -nE '_permBoostsRead|_permBoostTotal' battle.html | grep -vE 'function _permBoost|window\._permBoost'` returns NOTHING — both stubs and the `window._permBoostsRead` export have zero call sites. The permBoost layer was retired (post-v19 vitamins lift IVs directly); the comment claims the stubs are "kept for safety" but nothing actually invokes them.

**Blast radius**: None — dead functions returning constant zeros, no callers. The legitimate part (the v19 migration that refunds leftover `permBoosts` as vitamins at ~35152-35161) is separate and should be retained.

**Fix sketch**: Delete `_permBoostsRead`, `_permBoostTotal`, and the `window._permBoostsRead` export. Leave the v19 refund migration intact.

**Verification**: `grep -nE '_permBoostsRead|_permBoostTotal' battle.html` returns 0 hits; engine test boot + a save-with-permBoosts load test still pass.

---
severity: P3
category: refactor
anchor_symbol: _pendingProfRoll
current_line_hint: ~45954
file: battle.html
agents: [consistency-auditor]
fingerprint: fe19faa27ad9
confidence: high
status: open
---

**Title**: `_pendingProfRoll` (singular) only ever assigned null — dead variable shadowing live `_pendingProfRolls`

**Evidence**:
```js
// (legacy _pendingProfRoll kept for safety)
let _pendingProfRoll    = null;        // ~45954 — declared
// only other refs: _pendingProfRoll = null;  (~45966, ~46405) — null-clears only
```

**Repro**: `grep -nE '_pendingProfRoll\b' battle.html | grep -vE '_pendingProfRolls'` → declaration + two null-assignments, never a meaningful write and never a read. The live, plural `_pendingProfRolls` (note the trailing s, ~45946) is the real session state; the singular is leftover and easy to confuse with it at a glance.

**Blast radius**: None. Removing it cannot change behavior (it is never read).

**Fix sketch**: Delete the `_pendingProfRoll` declaration and its two null-clears. Keep `_pendingProfRolls`.

**Verification**: `grep -nE '_pendingProfRoll\b' battle.html | grep -vE '_pendingProfRolls'` returns 0 hits; professor-roll flow test passes.

---
severity: P3
category: refactor
anchor_symbol: _tcRenderStorylineGrid
current_line_hint: ~38893
file: battle.html
agents: [consistency-auditor]
fingerprint: c4298b3df1c1
confidence: high
status: open
---

**Title**: Legacy storyline picker is dead UI — hidden DOM + uncalled renderer + unreachable card handlers, superseded by sm.tracks

**Evidence**:
```js
function _tcRenderStorylineGrid() {            // ~38893 — ZERO callers
  const grid = document.getElementById('story-create-storyline-grid');
  if (!grid) return; ...
}
// DOM: <section id="story-create-storyline-section" style="display:none;">  ~9549
// <h2>Storyline (legacy)</h2>  ~9550
```

**Repro**: `grep -nE '_tcRenderStorylineGrid' battle.html` → definition only, never called, so the hidden `#story-create-storyline-grid` is never populated. Therefore `trainerCreateSetStoryline` (only reachable via the never-rendered card `onclick`s) and `_tcSyncStorylineCards` (iterates 0 cards) are effectively unreachable too. The legacy `<select id="story-setting-storyline">` fallback in `_readStorylineFromUI` (~41209) references an element that does not exist in the DOM. NOTE (not a race): `_tcState.storyline` IS still consumed — `startNewRun` reads it via `_readStorylineFromUI()` at ~39517 — but it is force-set to the `'surprise_me'` sentinel at ~38824 and never changed (grid is dead), so every run deterministically rolls a random variant. That matches the documented v22 intent; there is no old+new both-fire path.

**Blast radius**: Run-setup UI only; out-of-scope PvP/Quick Play untouched. The `_tcState.storyline` shim itself is load-bearing (drives `_readStorylineFromUI`) and must stay until the surprise_me roll is re-sourced; only the picker UI is dead.

**Fix sketch**: Delete the `#story-create-storyline-section` block (~9549-9554), the unused `_tcRenderStorylineGrid`, `_tcSyncStorylineCards`, `trainerCreateSetStoryline` (+ its `window.StoryMode` export), the dead `.story-create-storyline-*` CSS (~2485-2515), and the dead `#story-setting-storyline` fallback branch in `_readStorylineFromUI`. Keep `_tcState.storyline`/`_readStorylineFromUI`/`_pickRandomStorylineVariant` (the live random-roll path). Verify nothing reads `_tcState.storyline` other than `_readStorylineFromUI` before cutting.

**Verification**: `grep -nE '_tcRenderStorylineGrid|trainerCreateSetStoryline|story-create-storyline' battle.html` returns 0 hits; new-run flow still rolls a storyline variant (story-playthrough harness boots and `sm.storyLine` is a valid variant id).

---
severity: P3
category: inconsistency
anchor_symbol: _applyStoryBuildPowerTier
current_line_hint: ~37316
file: battle.html
agents: [consistency-auditor]
fingerprint: d7ddd1ded7bb
confidence: high
status: open
---

**Title**: Dual story-vs-Frontier path in `_applyStoryBuildPowerTier` is mutually exclusive and safe — legacy branch is NOT removable (in-scope MF needs it)

**Evidence**:
```js
let _foeCity = -1;
if (storyRowIdx != null && storyRowIdx >= 0 && sm && sm.active) _foeCity = _cityIndexForStoryRow(storyRowIdx);
// city gate (new): _foeCity >= 0   → city EV/IV curve + opt gradient
// legacy tier path: _foeCity < 0   → _storyMaybeNudgeFoeEVs + _rollTieredIVs + full move-strip
if (_foeCity < 0) { _storyMaybeNudgeFoeEVs(...); } else { _distributeEVsToTotal(...); }
```

**Repro**: Read ~37316-37418. The new (city-gate) and legacy (tier) paths branch on `_foeCity` for EVs (37377), IVs (37393), nature/ability/move opt (37401), and the move-strip (37353 `skipMoveStrip: _foeCity >= 0`). The two are mutually exclusive per-slot; there is NO path where both apply to the same mon. `_cityIndexForStoryRow` returns -1 only when the row id is absent from `STORY_EVENTS_RAW` — never for an in-order, in-scope story row — so a real story foe cannot be silently diverted into the legacy branch.

**Blast radius**: This addresses the orchestrator's lead-4 hypothesis. Verdict: the legacy `_foeCity < 0` branch is NOT a candidate for removal even though the obvious consumer is out-of-scope Frontier. The IN-SCOPE post-HoF Mystery Figure deliberately routes through it (`_applyStoryBuildPowerTier(..., 'Mystery Figure', null)` at ~38222 → storyRowIdx null → _foeCity -1; also the rematch call at ~44992 passes -1). Deleting the legacy branch would regress the post-HoF MF build path.

**Fix sketch**: No removal. Optional clarity only: the comments repeatedly call `_foeCity < 0` "Frontier / generator," but it also covers the in-scope post-HoF MF — tighten the comments to say "Frontier / generator / post-HoF MF" so a future reader doesn't delete the branch as out-of-scope. No behavior change; no diff approval needed for a comment-only edit.

**Verification**: Confirm post-HoF MF battle still builds a team (story-playthrough harness through HoF); confirm `_cityIndexForStoryRow` returns a valid 0-8 index for every shipped gym/rival/E4 row.

---
severity: P2
category: refactor
anchor_symbol: story-gold-icon
current_line_hint: ~8914
file: battle.html
agents: [consistency-auditor]
fingerprint: f5f634f1db37
confidence: high
status: open
---

**Title**: Verbatim gold-HUD markup re-inlined 11× — the "re-inlined block 25 times" anti-pattern CLAUDE.md warns about

**Evidence**:
```html
<span class="story-gold-inline"><img class="story-gold-icon" src="icons/story-gold-coin.svg" alt="" width="21" height="16" decoding="async"> 0G</span>
```

**Repro**: `grep -c 'story-gold-icon' battle.html` → 19; the exact `story-gold-inline` + img prefix above appears 11× verbatim across the story HUD and every shop header (`story-hud-gold`, `story-shop-gold`, `story-artifact-shop-gold`, `story-stone-shop-gold`, `story-tutor-gold`, `story-colress-gold`, `story-evtrainer-gold`, `story-pc-gold`, `story-crucible-gold`, `story-link-gold`, `story-evolab-gold` — lines ~8914-9209). Each copy duplicates the icon path, dimensions, and decoding hint.

**Blast radius**: Story HUD + all shop screens (in-scope). A change to the coin icon, its size, or alt text today requires 11 synchronized edits; a missed one is a visual drift bug. This is exactly the "vibecode re-inlining" pattern CLAUDE.md's architecture prefs call out for elimination.

**Fix sketch**: Extract a single `storyGoldChip(elId)` HTML helper (or a small template constant) and emit it at each of the 11 sites. Behavior-preserving (identical markup), so this is a 1:1 refactor — needs direction approval but not diff-level sign-off per CLAUDE.md.

**Verification**: `grep -c 'story-gold-coin.svg' battle.html` drops from 11 inline copies to 1 source; all gold HUD/shop chips still render an icon + amount (screen-audit harness shows no layout regression).

