---
severity: P1
category: inconsistency
anchor_symbol: BOSS_CONFIGS
current_line_hint: ~41855
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 07232f72109f
confidence: high
status: fixed-main
---

**Title**: Three conflicting "canon" docs for the boss/endgame arc; code matches none cleanly

**Evidence**:
```
docs/STORY_EXPANSION_PLAN.md:7  "This doc supersedes the boss/legendary sections of STORY_MODE_FLOW.md
                                 and docs/STORY_NARRATIVE_VARIANTS.md where they conflict."
docs/STORY_EXPANSION_PLAN.md:88 "'Caged God' boss arc … Removed entirely. Boss content moves into expansions."
docs/STORY_EXPANSION_PLAN.md:20 (decision #1) "Boss aftermath — No catch — boss vanishes on KO."
```

**Repro**: Read STORY_MODE_FLOW.md §9 (Caged God = live, catch-only, 10x HP, post-HoF) vs docs/STORY_EXPANSION_PLAN.md §1.1/§0 (Caged God removed entirely, replaced by transformation-puzzle raids, no catch) vs docs/story-design/STORY_3TRACK_IMPL_PLAN.md PR-5 (faintPhase/hpThresholdPhase/immunityRound BOSS_CONFIGS). Then grep `sm.bossArc` in battle.html — the Caged God is still fully shipped.

**Blast radius**: Every future boss/endgame change has no single source of truth. An agent reading EXPANSION_PLAN would "remove" a live, shipped, reachable feature (`continuePostGame` Master-Ball gift, Subject Zero capture, `_bossArcRenderSection`). An agent reading FLOW §9 would miss that EXPANSION_PLAN claims to supersede it.

**Fix sketch**: Pick one canon. Either (a) mark STORY_EXPANSION_PLAN.md as "PLANNED / not yet built" at the top (its Phase A–H, incl. "Phase C — Caged God removal", are unimplemented), so its supersede-claim doesn't mislead; or (b) if the expansion model is the real direction, add a status banner to FLOW §9 + 3TRACK_IMPL_PLAN PR-5 pointing forward. The supersede sentence at line 7 is factually false relative to shipped code today.

**Verification**: After reconciliation, a reader of the chosen canon doc can predict the shipped boss flow without contradiction from the other two docs.

---
severity: P2
category: inconsistency
anchor_symbol: _bossArcRenderSection
current_line_hint: ~48539
file: battle.html
agents: [spec-drift-auditor]
fingerprint: e2a51b657ed3
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Caged God lead spec (§9 "visit Cities 2/5/8") contradicts shipped Crucible-hub collection; §14b omits the arc

**Evidence**:
```js
// battle.html ~48566 — Crucible hub-mode path (the fix)
if (hubMode && !allLeads) {
    // Crucible hub = the post-game Underground: the whole broker network is
    // reachable here, so any uncollected lead can be pulled …
    for (const k of ['ledger', 'recording', 'key']) { if (L[k]) continue; … bossCollectLead … }
} else if (localLeadKey && !L[localLeadKey]) { /* only fires at physical city 2/5/8 */ }
```

**Repro**: STORY_MODE_FLOW.md §9 (line 229) says the player "must visit three corrupted Pokémon Centers in any order." But `continuePostGame` (~53510) and `leaveCrucible` (~48079) both snap `sm.eventIndex` to `lastStoryCityEventIndexAtOrBefore()` — after Champion that's City 9. There is no post-game free travel to Cities 2/5/8, so the in-city `localLeadKey` path (~48576) is unreachable post-HoF. Leads are collectable ONLY via the Crucible `hubMode` path (line 48102) — a real fix the spec never documents.

**Blast radius**: A reader following FLOW §9 literally would conclude the Caged God is unreachable (it was, pre-fix). §14b's Crucible facilities list (FLOW lines 446–450) enumerates Battle Frontier/Mystery/Rival/League/Gym/Wild + facilities but never mentions the Caged God hunt, even though it now renders at the very top of the Crucible (`_renderCrucible`, line 48104, "Post-Game Quest").

**Fix sketch**: Update FLOW §9 to state leads are collected from the Crucible's "Post-Game Quest" block (the 3-city framing survives only as label flavor), and add a "Caged God — Post-Game Quest" line to the §14b Crucible screen inventory. Note that the in-city path is dead post-HoF.

**Verification**: Spec §9/§14b describe the Crucible as the lead-collection surface; the dead in-city branch is either removed or documented as pre-HoF-only.

---
severity: P2
category: inconsistency
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42021
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 92d44000abc0
confidence: high
status: fixed-main
---

**Title**: Shipped BOSS_CONFIGS uses surge/immunity/heal phases, not the EXPANSION_PLAN "multi-form transformation"

**Evidence**:
```js
// battle.html ~41861 — shipped villain boss
'villain.rocket.boss': { mechanics: [
  { type: 'faintPhase', afterFaints: 0, effect: 'surge', banner: 'CALLED IN' },
  { type: 'faintPhase', afterFaints: 2, effect: 'immunity', banner: 'NO WITNESSES' },
  { type: 'faintPhase', afterFaints: 4, effect: 'surge', banner: "BOSS'S ORDERS" } ] },
```

**Repro**: docs/STORY_EXPANSION_PLAN.md decisions #3/#11/#13/#15/#16 specify bosses morph type-pairing + ability + moveset + field layer at HP thresholds ("multi-form transformation puzzle"). The shipped engine (`_applyBossPhaseEffect`, ~42001) only does `surge` (+25% dmg 3 turns), `immunity` (N turns), `heal`, and `fieldLock` (weather/terrain). No type/ability/moveset morph exists. The implementation instead matches the OLDER docs/story-design/STORY_3TRACK_IMPL_PLAN.md PR-5 (line 501+), not EXPANSION_PLAN.

**Blast radius**: Boss "puzzle" win-feel that EXPANSION_PLAN sells (read the cue, pick the counter) is not what ships; bosses are stat/immunity walls. Anyone implementing EXPANSION_PLAN would rebuild the whole BOSS_CONFIGS schema.

**Fix sketch**: Decide which boss model is canon (see P1 fingerprint 07232f72109f). If the shipped surge/immunity model is intended, retire the transformation design in EXPANSION_PLAN §3; if transformation is the target, mark the current BOSS_CONFIGS as the v1 / interim implementation.

**Verification**: One doc describes the surge/immunity/fieldLock model that actually ships; no doc claims unimplemented per-phase type/ability morphing as current.

---
severity: P3
category: inconsistency
anchor_symbol: _bossHpScaleForKind
current_line_hint: ~41916
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 4a47d6fb73d4
confidence: high
status: open
---

**Title**: Raid HP scaling drifted off-by-one from 3TRACK_IMPL_PLAN (miniRaid p-2 / raid p-1 vs p-1 / p)

**Evidence**:
```js
// battle.html ~41916 (shipped)
function _bossHpScaleForKind(kind, partySize) {
    const p = Math.max(1, partySize | 0);
    if (kind === 'miniRaid') return Math.max(1, p - 2);
    if (kind === 'raid') return Math.max(1, p - 1);
    return 1;
}
```

**Repro**: docs/story-design/STORY_3TRACK_IMPL_PLAN.md line 523 specifies `miniRaid → baseHp*(partySize-1)`, `raid → baseHp*partySize`; its test (line 570) asserts "5-mon party vs Marowak mini-raid → HP × 4; vs raid → HP × 5." Shipped code yields ×3 (mini) and ×4 (raid) for a 5-mon party — one lower than spec on both.

**Blast radius**: Spec-anchored tests (`tests/suites/raid-hp-scaling.test.js`, named in the plan) would fail against shipped behavior. The code comment (~41912) documents the new intent, so this is a deliberate retune with a stale spec — low risk, doc-only.

**Fix sketch**: Update STORY_3TRACK_IMPL_PLAN.md line 523–524 + the test expectation (line 570) to the shipped `p-2 / p-1` formula, or confirm the retune and note the rationale in the plan.

**Verification**: Plan's HP formula and example match `_bossHpScaleForKind`.

---
severity: P2
category: inconsistency
anchor_symbol: catchUnlocked
current_line_hint: ~34662
file: battle.html
agents: [spec-drift-auditor]
fingerprint: d2e9f5d532b4
confidence: high
status: fixed-main
---

**Title**: `sm.settings.catchMode` toggle never implemented; catch shipped as always-on, 3 specs still gate on it

**Evidence**:
```
grep -c 'catchMode' battle.html        → 0  (no form, any namespace)
docs/STORY_FEATURES_INTEGRATION.md:29  "Sold at Poke Mart only when catchMode is on"
docs/STORY_FEATURES_INTEGRATION.md:39  "PC Box when catchMode or sm.pcBox.length > 0"
docs/STORY_MODE_DESIGN_DECISIONS.md:336 "(sm.settings.catchMode && hasCaughtOnce)"
docs/STORY_MODE_CATCH_INTEGRATION_RISK.md:181 "OR sm.settings.catchMode === true"
```

**Repro**: `grep -niE 'catchMode' battle.html` returns nothing. STORY_MODE_FLOW.md §10 (line 273) reveals the actual model: catch is gated by `sm.catchTutorialDone` (set after the intro rival) and is mandatory, not an opt-in toggle. `eventsOn` (STORY_FEATURES_INTEGRATION §8) is likewise absent from code (0 hits).

**Blast radius**: Three design docs describe a catch on/off setting that does not exist; a reader implementing the PC/Mart/wild gates per spec would branch on a never-defined flag (sloppy-mode hazard — would silently create a window global, always falsy). Catch being mandatory (no "classic no-catch run") is itself an undocumented design decision.

**Fix sketch**: Either (a) purge `catchMode`/`eventsOn` from the 3 specs and document "catch is always-on after the intro rival, gated by `catchTutorialDone`"; or (b) if an opt-out is desired, implement `sm.settings.catchMode` and wire the mart/PC/wild gates the specs already describe.

**Verification**: No spec references a `catchMode`/`eventsOn` flag that is absent from code; the always-on catch model is documented.

---
severity: P2
category: inconsistency
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~41752
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 17b27a222658
confidence: medium
status: fixed-claude/cagedgod-excision
---

**Title**: Master Ball granted by BOTH villain-boss victory and post-HoF Caged God, vs spec "1 per run"

**Evidence**:
```js
// battle.html ~41756 — villain track boss reward (fires mid-run, road 7)
if (/^villain\.[a-zA-Z]+\.boss$/.test(sk)) {
    sm.balls.master = (sm.balls.master | 0) + 1;  // +1 Master Ball
}
// battle.html ~53505 — post-HoF gift (continuePostGame)
sm.balls.master = (sm.balls.master | 0) + 1;       // +1 Master Ball
```

**Repro**: STORY_MODE_FLOW.md §6 (line 147) caps Master Ball at "1 per run" and lists its source as "Boss arc reward (Underground broker)" only. But the 3-track villain boss (always fires once per run, since `sm.tracks.villain` is always populated at run start, ~34508) grants a Master Ball at ~road 7, and `continuePostGame` grants another post-HoF. That is up to 2 Master Balls per run — and the first arrives long before the Caged God.

**Blast radius**: Economy/balance: the Caged God's intended "Master Ball is the obvious solution" tension (§9 catch step) is undercut if the player already pocketed one from the villain boss. The spec's "1 per run" invariant is violated. Possible double-spend.

**Fix sketch**: Reconcile the two grant paths against the §6 cap. Either gate the villain-boss Master Ball behind a per-run flag shared with the post-HoF grant, or update §6 to document the 3-track villain-boss source and the actual cap (2). Balance numbers are user-owned — flag for sign-off.

**Verification**: Total Master Balls obtainable in one run matches the documented cap.

---
severity: P3
category: dx
anchor_symbol: BOSS_MECHANICS
current_line_hint: ~41798
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 13c765d6e38e
confidence: high
status: open
---

**Title**: `BOSS_MECHANICS` stub object is dead (never called); its "engine wiring is a no-op" comment is now false

**Evidence**:
```js
// battle.html ~41792
// … Engine wiring … lives in a polish PR. For now, each
// mechanic is a no-op that records its activation …
const BOSS_MECHANICS = { hpThresholdPhase(battle,…){ battle._mechanics.push(…) }, … };
```

**Repro**: `grep -nE 'BOSS_MECHANICS\b' battle.html` → only the declaration (41798) + a `window.StoryMode` getter (37437). Its methods push to `battle._mechanics`, which is read nowhere. The live boss wiring is `_storyBossMechanicsBattleInit` / `_storyBossMechanicsTurnTick` / `_applyBossPhaseEffect` (the "polish PR" already landed). The stub's comment claims mechanics are still no-ops, which is misleading.

**Blast radius**: A future maintainer may try to "finish" the no-op stub, not realizing the real engine already ships elsewhere — wasted effort / duplicate wiring risk.

**Fix sketch**: Remove the `BOSS_MECHANICS` stub + its `window.StoryMode` getter (verified unused by grep), or replace its comment to point at the live `_storyBossMechanics*` functions.

**Verification**: `grep -nE 'BOSS_MECHANICS\b' battle.html` returns no call sites; no comment claims boss mechanics are unimplemented no-ops.

---
severity: P3
category: inconsistency
anchor_symbol: expShareVoucher
current_line_hint: ~38778
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 70fdae9ad188
confidence: high
status: fixed-main
---

**Title**: Exp Share Voucher item (3TRACK_IMPL_PLAN PR-5) never shipped; `sm.inventory.expShareVoucher` is dead init

**Evidence**:
```
docs/story-design/STORY_3TRACK_IMPL_PLAN.md:551 "function applyExpShareVoucher(monId, levels) { … mon.level += n … }"
battle.html:38778  expShareVoucher:0,   // init only — never read/written elsewhere
```

**Repro**: The plan (PR-5, lines 546–564, tests 572–573) specs an Exp Share Voucher wallet + Bag modal + `applyExpShareVoucher`. In code, `expShareVoucher` is initialized to 0 and never referenced again (`grep -n expShareVoucher battle.html` → one line). The extra-raid reward instead grants 6 random vitamins (`_storyGrantTrackEndReward`, ~41770), with an in-code comment explaining the flat-L100 game has no per-mon level system so the voucher couldn't land.

**Blast radius**: Doc describes a whole item + UI + 2 tests that don't exist; the dead save field is harmless but confuses schema readers.

**Fix sketch**: Update STORY_3TRACK_IMPL_PLAN.md PR-5 to record that the Exp Share Voucher was replaced by a 6-vitamin bundle (flat-L100 rationale), and either remove the dead `expShareVoucher:0` init or note it as reserved.

**Verification**: Plan reflects the shipped vitamin-bundle reward; no doc references an unbuilt `applyExpShareVoucher`.

---
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30097
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 0c17b73a170d
confidence: high
status: open
---

**Title**: Doc `battle.html:LINE` anchors stale — 18/50 references drifted (cluster)

**Evidence**:
```
STORY_MODE_FLOW.md:53   claims battle.html:21273 for STORY_EVENTS_RAW → now @30097
STORY_MODE_FLOW.md:225  claims battle.html:30702 for continuePostGame  → now @53475
STORY_MODE_FLOW.md:584  claims battle.html:34883 for makeWildBuild     → now @49108
STORY_NARRATIVE_VARIANTS.md:612 claims battle.html:30566 for STORY_BEATS → now @38912
STORY_MODE_CATCH_INTEGRATION_RISK.md:91 claims battle.html:21528 for POKEMART_ITEMS → now @10211
```

**Repro**: `node scripts/debug/spec-drift.mjs` → `tests/reports/spec-drift.md`. 18 of 50 inline `battle.html:LINE` references no longer point at the named symbol (battle.html has grown to ~4.05 MB / line refs predate that). The named symbols all still exist — only the line numbers rotted.

**Blast radius**: Low. Misleads anyone who jumps to a literal line; the `find-anchor` skill already resolves symbols, so this is a doc-hygiene nit, not a correctness bug. Notably FLOW §9 line 225 still cites `continuePostGame()` as `battle.html:30702` and §10 line 269 cites `battle.html:22191` for the `sm` defaults — both far off.

**Fix sketch**: Either strip the `:LINE` suffixes from doc references (keep symbol names only, since `find-anchor` resolves them) or run a one-time pass to refresh them. Prefer stripping — line numbers will rot again on the next insertion.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted references (or the docs no longer carry literal line numbers).

