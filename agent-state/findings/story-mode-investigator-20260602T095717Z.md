---
severity: P0
category: bug
anchor_symbol: renderCityActions
current_line_hint: ~43895
file: battle.html
agents: [story-mode-investigator]
fingerprint: f9a5c88627c5
confidence: high
status: open
---

**Title**: Post-HoF Crucible super-hub is unreachable — city button gated on dead bossArc state

**Evidence**:
```js
// renderCityActions, ~43895
if (sm.bossArc && sm.bossArc.available) {
    _push('recover', makeActionBtn('🧨 The Crucible','crucible','window.StoryMode.enterCrucible()','center', _facOpts('crucible', [{label:'Post-game',tone:'info'}])));
}
```

The Crucible city-hub button is the ONLY in-city entry point to the post-game super-hub (Crucible / Battle Frontier / Rival Rematch / League Run / Gym Rematch). Its visibility is gated on `sm.bossArc.available`. After the v24 boss-arc removal:
- `migrateStoryPreV24()` (~35118) `delete sm.bossArc` on load.
- `sm.bossArc.available` is initialized to `false` only inside `_bossArcEnsureState` (~49428) and is set to `false` again at ~43157 — it is **never** set to `true` anywhere in the file (`grep -n "bossArc.available\s*=" battle.html` → only `= false`).

So `sm.bossArc && sm.bossArc.available` is permanently falsy and the button never renders. `continuePostGame()` (~54729) drops the player back at `enterCity()` and shows an orientation tip explicitly promising "🧨 The Crucible — every facility you used on the road … with the endless Battle Frontier ladder waiting in the back" — but the button it promises is absent.

**Repro**: Finish a run → Hall of Fame → Continue (Post-Game) → win/lose the Mystery Figure climax → land in a city. No Crucible button appears in the recover section; the promised post-game is inaccessible. (Static proof: `grep -n "bossArc.available =" battle.html` shows only false assignments.)

**Blast radius**: Entire post-game (Crucible facilities, Battle Frontier ladder, Rival Rematch, League Run, Gym Rematch, Mystery Figure encore) becomes dead content. The orientation tip and the v24 spec (§9, §14b) both assume the Crucible is reachable from every visited city.

**Fix sketch**: Replace the `sm.bossArc && sm.bossArc.available` gate with a post-HoF predicate that survives v24 — e.g. `sm.postHofMysteryClimaxDone` (set true after the row-67 climax) or an all-gyms-cleared check. Boss-arc state should no longer gate any live feature.

**Verification**: After the climax, render a city and confirm the Crucible button exists with `onclick=enterCrucible()`; confirm `enterCrucible()` opens the hub.

---
severity: P2
category: inconsistency
anchor_symbol: helpText
current_line_hint: ~11355
file: battle.html
agents: [story-mode-investigator]
fingerprint: 98cc2054989a
confidence: high
status: open
---

**Title**: In-game Help "Catching" section still points players to the cut Caged God arc

**Evidence**:
```html
<!-- Help / Catching section, ~11355 -->
Wild routes between cities surface one wild Pokémon each. The Safari Zone in City 5 runs as a self-contained session with its own balls, Bait, and Rocks. The Caged God in the post-game needs the Master Ball — saved for that one fight.
```

The "Caged God in the post-game needs the Master Ball — saved for that one fight" line is stale content: the Caged God boss arc was permanently cut in v24 (STORY_MODE_FLOW.md §9 "❌ REMOVED (v24)"; `migrateStoryPreV24` strips its save state). The Master Ball is now the roaming-legendary reward (Road 7, pre-HoF), not a post-game cage. Players following this guidance will hoard their one Master Ball for a fight that never appears. The same help block (line 11366) also still names "Subject Zero" as unsellable, which is only reachable through the dead boss-mode catch path.

**Repro**: Open in-game Help → Catching section. The Caged God / Master Ball guidance is shown verbatim.

**Blast radius**: Player-facing onboarding text only; misdirects Master Ball usage and references a non-existent encounter.

**Fix sketch**: Rewrite the Catching help to describe the Master Ball as the roaming-legendary reward (pre-HoF) and drop the Caged God / Subject Zero references (or scope them behind a real feature). Also reconcile the "Safari Zone in City 5" wording with the spec's "City 4 — Wilderness town" if the canonical naming is City 4.

**Verification**: Help text no longer mentions Caged God; Master Ball guidance matches the roaming-legendary flow.

---
severity: P3
category: refactor
anchor_symbol: _bossArcRenderSection
current_line_hint: ~49490
file: battle.html
agents: [story-mode-investigator]
fingerprint: 54819c046cee
confidence: high
status: open
---

**Title**: Entire Caged God boss-arc subsystem is dead code after v24 removal

**Evidence**:
```js
function _bossArcRenderSection(hubMode) {
    _bossArcEnsureState();
    if (!sm.bossArc.available || sm.bossArc.cleared) return '';
```

The v24 cut removed the boss arc from the design (STORY_MODE_FLOW.md §9) and `migrateStoryPreV24` strips `sm.bossArc`, but the implementation is fully retained and wired into live render paths that can never activate: `_bossArcRenderSection` (called at ~48819 and ~49039), `_bossArcEnsureState`, `_bossArcCheckCageUnlock`, `_bossArcRollLegendary`, the `bossMode` branch of `_catchHandleSuccess` (~50953, grants "Subject Zero" + a 10,000G/vitamin bundle), and the 8 per-variant "Subject Zero is yours" epilogue strings (~32996). All are unreachable because `sm.bossArc.available` is never set true (see the related P0). This is large dead surface that confuses future audits and risks accidental reactivation.

**Repro**: `grep -n "bossArc\|Subject Zero\|caged" battle.html` shows ~30 live references; none are reachable in normal play.

**Blast radius**: Maintenance / audit clarity; carries an unreachable gold+item reward path that would be exploitable if the gate were ever re-truthed.

**Fix sketch**: Remove the boss-arc functions, the bossMode catch branch, the Subject Zero epilogues, and the render-call sites — or, if kept for a future feature, fence them behind an explicit `STORY_BOSS_ARC_ENABLED` flag defaulting false and annotate as parked.

**Verification**: `grep -c "bossArc" battle.html` drops to the migration-strip only; no render path references it.

---
severity: P3
category: data
anchor_symbol: caged_god
current_line_hint: ~34815
file: battle.html
agents: [story-mode-investigator]
fingerprint: 628362bfd5b2
confidence: high
status: open
---

**Title**: Achievements caged_god / r_caged_god are permanently unobtainable

**Evidence**:
```js
{ id: 'caged_god',      cat: 'milestone',  name: 'The Caged God',   desc: 'Capture Subject Zero in the post-game boss arc.', icon: '🔮' },
```

`caged_god` (~34815) and `r_caged_god` (~34845) are only unlocked inside the dead bossMode catch branch (`_storyAchievementUnlock('caged_god')` at ~50982). Since the boss arc was cut in v24 and is unreachable (see related P0/P3), these two achievements can never be earned, leaving permanent gaps in the achievement list and any 100% completion metric.

**Repro**: Inspect the achievements registry; the only unlock site is the unreachable bossMode path at ~50982.

**Blast radius**: Achievement completion UI / metrics; cosmetic but visible to completionists.

**Fix sketch**: Remove both achievement entries (and their unlock calls) alongside the boss-arc cleanup, or repurpose them to a live post-game milestone (e.g. roaming-legendary capture).

**Verification**: Achievement list no longer contains caged_god / r_caged_god, or they map to a reachable trigger.

