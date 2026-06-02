# consistency-auditor — story-mode overhaul deep audit (20260601T214047Z)

Read-only audit. Two passes (code-style + text-content), focused on old-vs-new
design conflicts in the story flow + balance code, and 3-variant dialogue
exhaustiveness. Scope note: Story mode (normal) is the only active scope per
CLAUDE.md; PvP / Quick Play / Frontier findings are tagged out-of-scope.

---
severity: P1
category: bug
anchor_symbol: enterCity
current_line_hint: ~43816
file: battle.html
agents: [consistency-auditor]
fingerprint: db1dd616e801
confidence: high
status: open
---

**Title**: Post-HoF Crucible hub button gated on dead `bossArc.available` — never renders

**Evidence**:
```js
// enterCity() — the ONLY city-action that surfaces the Crucible:
if (sm.bossArc && sm.bossArc.available) {
    _push('recover', makeActionBtn('🧨 The Crucible','crucible',
          'window.StoryMode.enterCrucible()','center', ...));
}
// But sm.bossArc.available is NEVER set true anywhere in battle.html
// (grep: only reads + one '= false' at ~43078 in a dev seeder).
// migrateStoryPreV24 deletes sm.bossArc entirely; _bossArcEnsureState
// re-creates it with { available:false }.
```

**Repro**: Finish Hall of Fame → `continuePostGame()` runs the row-67 Mystery climax, then drops to `enterCity()`. The orientation tip (~54687) promises "🧨 The Crucible — reaches from any city you've visited," but the button's gate (`bossArc.available`) is permanently false, so it never appears. The post-game super-hub is unreachable from the city action strip.

**Blast radius**: Entire post-game. Crucible = Battle Frontier ladder, League/rival/gym rematches, Mystery Figure rematch, all tutors/shops. All become unreachable from cities. (Internal back-buttons at ~9122/9128 only help once you're already inside.)

**Fix sketch**: Re-gate the Crucible button on the real post-game predicate (e.g. `sm.postHofMysteryClimaxDone` or a HoF-cleared flag), not the removed Caged-God `bossArc.available`. This is the canonical old-vs-new merge wound: the Crucible gate was wired to the Caged-God unlock flag, then the Caged-God arc was cut without re-homing the gate.

**Verification**: Boot a post-HoF save; confirm 🧨 The Crucible renders in every visited city's action strip.

---
severity: P2
category: refactor
anchor_symbol: _bossArcRenderSection
current_line_hint: ~49285
file: battle.html
agents: [consistency-auditor]
fingerprint: 19bef76fa998
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: ~250-line Caged God boss arc is dead code (unreachable) but still fully shipped

**Evidence**:
```js
function _bossArcRenderSection(hubMode) {
    _bossArcEnsureState();
    if (!sm.bossArc.available || sm.bossArc.cleared) return '';  // available is always false
    ...
}
// Live, never-callable: _bossArcRenderSection, bossEnterCage, bossCollectLead,
// bossAttack, bossRetreatToCity, _bossArcRollLegendary, _bossArcCheckCageUnlock,
// _BOSS_LEAD_FLAVOR, _BOSS_LEAD_FLAVOR_BY_VARIANT (8 variant blocks),
// _SUBJECT_ZERO_EPILOGUE_BY_VARIANT, _variantSubjectZeroEpilogue.
```

**Repro**: Same root cause as the P1 — `available` never true. The whole arc + its 8 per-variant flavor pools + the `Subject Zero` epilogue are authored, wired, and unreachable.

**Blast radius**: Maintenance confusion ("which post-game is live?"). CLAUDE.md says the Caged God arc "was just removed," but only the *save state* (migrateStoryPreV24) and the *trigger* were removed; the implementation, UI strings, achievements, and dialogue pools remain. This is precisely the "which one is live" ambiguity flagged as the top concern.

**Fix sketch**: Decide: either (a) delete the Caged-God island wholesale (arc fns, `_BOSS_LEAD_*`, Subject-Zero epilogue, achievements `caged_god`/`r_caged_god`, intro-screen copy at ~11337/11360), or (b) re-enable it by setting `bossArc.available` at HoF. Do NOT leave both the "cut" comments and the live code coexisting.

**Verification**: grep `bossArc|Caged God|Subject Zero` returns only intentional survivors after the decision.

---
severity: P2
category: inconsistency
anchor_symbol: STORY_ACHIEVEMENTS
current_line_hint: ~34767
file: battle.html
agents: [consistency-auditor]
fingerprint: 3c5313751854
confidence: high
status: open
---

**Title**: Achievements `caged_god` / `r_caged_god` are permanently unobtainable (dead arc)

**Evidence**:
```js
{ id: 'caged_god',   cat:'milestone', name:'The Caged God', desc:'Capture Subject Zero in the post-game boss arc.', icon:'🔮' },
{ id: 'r_caged_god', cat:'replay',    name:'Caged God',     desc:'Complete the Caged God post-game boss arc.',       icon:'🔮' },
// Only unlock site (~50903) is inside the unreachable bossEnterCage win path:
//   if (bossMode) { _storyAchievementUnlock('caged_god'); _storyAchievementUnlock('r_caged_god'); }
```

**Repro**: Open the achievements screen post-game — two 🔮 entries can never be completed because their only grant path is the dead Caged-God battle resolution.

**Blast radius**: 100%-completion players see permanently-locked achievements with no in-game path. Also the intro/help copy at ~11337 and ~11360 still describes the Caged God + Master Ball quest as a live feature.

**Fix sketch**: Remove both achievement rows (and the dangling help-screen Caged-God copy) if the arc stays cut, or restore the trigger if it's revived. Keep in sync with the P2 above.

**Verification**: Achievements list contains no unobtainable entries; help text matches shipped post-game.

---
severity: P2
category: inconsistency
anchor_symbol: storyHelpText
current_line_hint: ~11337
file: battle.html
agents: [consistency-auditor]
fingerprint: 58d0c67c14b0
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Help screen still advertises the cut Caged God / Subject Zero / Master-Ball quest

**Evidence**:
```html
<!-- Catching section (~11337) -->
... The Caged God in the post-game needs the Master Ball — saved for that one fight.
<!-- Pokémon Center (~11348) -->
... Your last party member and Subject Zero are not for sale.
<!-- Endgame section (~11360) -->
... The <b>Caged God</b> boss arc needs three corrupted-Center leads scattered through
the post-game, then the Master Ball.
```

**Repro**: Open the in-game Help/How-to-Play screen → Catching and Endgame sections describe a feature (Caged God boss arc + dedicated Master-Ball sink) that no longer fires (see the P1/P2 above). The Master Ball is now granted by the 3-track villain-boss victory and is just a normal guaranteed-catch ball; there is no "one fight" to save it for.

**Blast radius**: Player-facing onboarding text promises content that doesn't exist → player saves a Master Ball for a fight that never comes, and looks for a post-game boss they can't reach.

**Fix sketch**: Rewrite the Catching/Endgame help to drop the Caged God + "save the Master Ball" framing; describe the Master Ball as a villain-boss reward / general guaranteed catch. (If the arc is revived instead, leave it — but reconcile with the P1.)

**Verification**: Help text mentions no Caged God / dedicated Master-Ball fight unless the arc is live.

---
severity: P3
category: inconsistency
anchor_symbol: _CHAMPION_DIALOGUE_BY_VARIANT
current_line_hint: ~32848
file: battle.html
agents: [consistency-auditor]
fingerprint: 09cd7d1f62cd
confidence: medium
status: open
---

**Title**: Variant Champion / rival dialogue narratively routes player to the dead broker + cage

**Evidence**:
```js
// project_mewtwo Champion outro (~32848):
'Champion: "You won. ... Walk to the broker. They have the Master Ball. End it." ...'
// project_mewtwo post-HoF epilogue (~33000):
'"Subject 0001 is waiting in the cage. The Master Ball is on the road. Walk when you\'re ready."'
// Also: ~39758, ~41625 — "the broker has an address / the Master Ball you'll need is in their drawer."
```

**Repro**: Play the `project_mewtwo` / `hypnos_lullaby` / `lavender_frequency` variants to the Champion/post-HoF beats — the prose instructs the player to "walk to the broker" and enter "the cage," but the broker leads and cage are unreachable (Caged-God arc dead). The narrative thread dangles.

**Blast radius**: Narrative payoff of the variant arcs is broken — the dialogue sets up a destination (the cage) the player can never reach. These are tone-consistent, well-written lines pointing at cut content.

**Fix sketch**: Either restore the Caged-God arc (so the lines pay off) or soften the variant outros to not promise a literal broker/cage visit. Tied to the Caged-God decision above.

**Verification**: No live variant dialogue instructs the player to visit a broker/cage that doesn't exist.

---
severity: P3
category: refactor
anchor_symbol: STORY_IV_TIER_RANGES
current_line_hint: ~33305
file: battle.html
agents: [consistency-auditor]
fingerprint: 14dd0d6f939b
confidence: high
status: open
---

**Title**: `STORY_IV_TIER_RANGES` is dead — superseded by `STORY_IV_TIER_CENTER`, zero consumers

**Evidence**:
```js
const STORY_IV_TIER_RANGES = Object.freeze({
    1: { min: 0,  max: 15 }, 2: { min: 10, max: 22 },
    3: { min: 18, max: 28 }, 4: { min: 26, max: 31 }
});
// ...comment 2 lines below: "(Replaces the wide uniform STORY_IV_TIER_RANGES bands.)"
const STORY_IV_TIER_CENTER = Object.freeze({ 1: 8, 2: 16, 3: 23, 4: 28 });
// grep STORY_IV_TIER_RANGES → only the decl + the comment that supersedes it. No reads.
```

**Repro**: `grep -n STORY_IV_TIER_RANGES battle.html` → definition + one comment, no consumers. `_rollTieredIVs` reads `STORY_IV_TIER_CENTER` instead.

**Blast radius**: None functionally (dead). Confusion risk: a future tuner could edit the wrong (dead) IV table and see no effect — a known curve-tuning footgun. Two IV tables that look like they both drive enemy IVs but only one does.

**Fix sketch**: Delete `STORY_IV_TIER_RANGES` (behaviour-preserving dead-table removal, grep-verified) and fold its "aces get top quartile" doc note into the `STORY_IV_TIER_CENTER` comment if still relevant.

**Verification**: grep returns 0 hits; `_rollTieredIVs` unchanged; engine tests green.

---
severity: P3
category: refactor
anchor_symbol: _storyBuildTierForEvent
current_line_hint: ~37087
file: battle.html
agents: [consistency-auditor]
fingerprint: c5bc08173c0c
confidence: medium
status: open
---

**Title**: Redundant tier branches in `_storyBuildTierForEvent` (dead duplicate conditions)

**Evidence**:
```js
// Rival branch (~37087): both arms return COMPETENT — first test is dead.
if (b >= 7) return STORY_BUILD_TIER.COMPETENT;  // Stage 3 — T3, T4 via b>=8 above
if (b >= 5) return STORY_BUILD_TIER.COMPETENT;
// Basic Trainer branch (~37104): both arms return NOVICE — first test is dead.
if (b >= 5) return STORY_BUILD_TIER.NOVICE;
if (b >= 2) return STORY_BUILD_TIER.NOVICE;
```

**Repro**: Read the Rival and Basic-Trainer arms — consecutive `if` guards return the same tier, so the first guard never changes the outcome.

**Blast radius**: None behaviourally; signals an in-progress curve edit where a distinct tier was intended for one band but both ended equal. A tuner reading this can't tell if the duplication is intentional or a leftover from a half-applied change.

**Fix sketch**: Collapse each pair to one guard, OR set the intended distinct tier if the two bands were meant to differ (balance-number decision — maintainer-owned).

**Verification**: Branch logic is 1:1 after collapse; tier outputs unchanged for all (eventType, badges).

