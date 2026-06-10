---
severity: P1
category: inconsistency
anchor_symbol: _earlyGameFoeStatMult
current_line_hint: ~14953
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 75cdcf609fdb
confidence: high
status: fixed-main
---

**Title**: Two early-game foe-softening systems STACK multiplicatively — C0 foe is 64% of base, not the documented ~80%

**Evidence**:
```js
// applyFoeDifficultyScaling (battle.html:15032): layer A
mult *= _earlyGameFoeStatMult();          // FOE_STAT_NERF_BY_CITY = [0.80,0.85,0.90]
// buildPokemon (battle.html:15163): layer B, applied independently to the SAME mon
if (build._storyStatMult ...) mon.stats[k] *= m;  // _STORY_FOE_STAT_BAND C0:-20% → ×0.80
// _STORY_FOE_STAT_BAND = [-20,-17,-13,-10,-7,-3,0,7,13,20]  (battle.html:33621)
```

**Repro**: `node -e` replicating both functions: at C0 a regular trainer = `0.80 (band) × 0.80 (nerf) = 0.64`; C1 = `0.83×0.85=0.705`; C2 = `0.87×0.90=0.783`. The intro rival (row 68) compounds its -25% narrative band with the C0 nerf: `0.75 × 0.80 = 0.60`. Both call sites fire unconditionally for every story battle (`applyFoeDifficultyScaling` via `state.foeParty.forEach` at startBattle:17217; `_storyStatMult` stamped at enterBattleEvent:47595 and consumed in buildPokemon). They are NOT mutually exclusive.

**Blast radius**: Cities 0-2 only (C3+ the legacy nerf is 1.0, so only the band applies). But that is the entire onboarding window — the foes the maintainer's "regular trainers slightly below the player" target is most sensitive to. Both the in-code comment (14931: "~20% at the start, 15% at City 1, 10% at City 2") and the `_STORY_FOE_STAT_BAND` comment (33618: "C0 the band is -20%") describe a SINGLE -20% layer; neither anticipates the other. Extends spec-drift's `FOE_STAT_NERF_BY_CITY` finding (fp 02e46f6ff336), which flagged only the docs-vs-code naming mismatch — not that the table double-applies on top of the per-event stat band.

**Fix sketch**: Decide the intended C0-C2 softening (balance number — user-owned), then collapse to ONE source: either fold `FOE_STAT_NERF_BY_CITY` into `_STORY_FOE_STAT_BAND`'s early entries (make the band itself -36%/-29%/-22% if that is intended) or gate `_earlyGameFoeStatMult` to return 1.0 once `_storyStatMult` is active. Aligns with STORY_OVERHAUL_PLAN §4 "delete the duplicate/conflicting tables".

**Verification**: A single multiplier function produces the C0-C2 softening; `grep` confirms the foe's per-stat scaling passes through exactly one city-keyed softening factor; the documented "~20% at C0" matches the realized value.

---
severity: P2
category: data
anchor_symbol: BEAT_CANON_TRAINER
current_line_hint: ~42431
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 2436e69a6d2e
confidence: high
status: open
---

**Title**: Team Yell villain track has no themed sprites — boss Piers falls back to generic Roughneck, mini-boss Marnie renders as Gladion

**Evidence**:
```js
'villain.yell.boss':      'Piers',     // TRAINER_DATA Piers = Gym Leader 7, no spriteFile
                                        //   → SPRITE_MAP['Piers']='Roughneck' (33582): generic class sprite
'villain.yell.miniBoss':  'Marnie',    // TRAINER_DATA Marnie row: spriteFile:'Gladion' (30111)
//   sprites/trainers/Piers.png  → MISSING ; Marnie shows Gladion.png (wrong character)
```

**Repro**: `BEAT_CANON_TRAINER` resolves both Spikemuth (`yell`) villain beats. Piers's TRAINER_DATA row (battle.html:30184) carries no `spriteFile`, so `_storyTrainerSprite` derives `Piers.png` → not present in `sprites/trainers/` → falls back through `SPRITE_MAP['Piers']='Roughneck'` (33582), a generic roughneck class sprite. Marnie's row (30111) hard-sets `spriteFile:'Gladion'`, so the Team Yell mini-boss renders as Gladion. `Cassiopeia.png` exists in sprites/trainers but is unused (Penny is the star.boss). Of all 10 villain tracks, only `yell` has neither a dedicated boss nor mini-boss sprite.

**Blast radius**: Requirement §2.4 ("a villain-arc battle must launch the themed villain trainer — correct sprite + signature"). The Team Yell run-line breaks both: the boss is a no-name Roughneck and the mini-boss wears a rival's (Gladion's) face. Signatures are correct (Piers→Obstagoon line; Marnie→Morpeko/Grimmsnarl), so only the sprite identity is wrong. Other 9 tracks resolve cleanly (verified: rocket/magma/aqua/galactic/plasma/flare/skull/macroCosmos/star all map to present sprites).

**Fix sketch**: Add `sprites/trainers/Piers.png` and `Marnie.png` (or point `villain.yell.*` at characters whose sprites exist), then set Piers's TRAINER_DATA row `spriteFile:'Piers'` and correct Marnie's `spriteFile:'Marnie'`. If Marnie's `spriteFile:'Gladion'` is intentional for her GYM-rival role, split the villain-track usage from the rival usage so the villain beat gets her own sprite.

**Verification**: `ls sprites/trainers/{Piers,Marnie}.png` succeeds; the `yell` boss/mini-boss battle intro shows Piers/Marnie, not Roughneck/Gladion.

---
severity: P2
category: inconsistency
anchor_symbol: _pickThemedTrainerForRole
current_line_hint: ~38599
file: battle.html
agents: [data-integrity-auditor]
fingerprint: a181ae1745b6
confidence: high
status: open
---

**Title**: Villain-arc regular battles share 7 generic `tag:'villain'` grunts — never themed to the run's actual track (3 tracks have no matching grunt at all)

**Evidence**:
```js
// All tag:'villain' rows in TRAINER_DATA (30095-30101) — 7 total:
Rocket Executive, Aqua Admin, Magma Admin, Galactic Commander,
Plasma Sage, Flare Scientist, Skull Boss
// _resolveThemeForBattleRow returns the SHARED tag 'villain' (STORY_THEMED_BATTLES rows 20/33/41/56),
// _pickThemedTrainerForRole filters `t.tag !== theme` → picks from the same 7 regardless of sm.tracks.villain.
```

**Repro**: A run rolls `sm.tracks.villain` from `VILLAIN_TRACKS` (10 entries incl. `yell`, `macroCosmos`, `star`). The four villain-themed regular slots (`STORY_THEMED_BATTLES = {20:'villain',33:'villain',41:'villain',56:'villain'}`) resolve via `_resolveThemeForBattleRow → 'villain'`, and `_pickThemedTrainerForRole('Basic Trainer', …, 'villain')` filters by `t.tag === 'villain'`. There is no per-track tag, so a Team Star / Macro Cosmos / Team Yell run gets Rocket/Aqua/Magma/Galactic/Plasma/Flare/Skull grunts in its scouting fights. Only the boss + mini-boss beats (via `BEAT_CANON_TRAINER`) are track-correct; the regular villain encounters are not. Three tracks (yell, macroCosmos, star) have NO `tag:'villain'` grunt archetype.

**Blast radius**: Requirement §2.4 wants themed villain trainers, "only if none fits, a random trainer from the appropriate pool." Here the regular villain battles ALWAYS use an off-track grunt — the "random fallback" is the default, not the exception. Narratively a "Team Star" arc fields Team Rocket/Aqua grunts mid-road. Does not crash; purely a theming/identity gap. Distinct from the BEAT_CANON_TRAINER sprite finding (which is about bosses).

**Fix sketch**: Either (a) tag villain grunts per track (e.g. `tag:'villain:star'`) and have `_resolveThemeForBattleRow` emit `'villain:'+sm.tracks.villain`, with `_pickThemedTrainerForRole` falling back to the generic `'villain'` pool when a track has no grunt; or (b) add the 3 missing grunt archetypes (Team Yell / Macro Cosmos / Team Star). Aligns with STORY_OVERHAUL_PLAN §4 "beat→trainer mapping is deterministic & themed … random-from-pool only as an explicit fallback".

**Verification**: For each of the 10 `VILLAIN_TRACKS`, the four villain-tagged regular rows resolve to a grunt whose flavor matches that track (or an explicit, logged generic fallback).

---
severity: P3
category: inconsistency
anchor_symbol: STORY_IV_TIER_RANGES
current_line_hint: ~33305
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 3c02d9edba9f
confidence: high
status: open
---

**Title**: THREE story IV tables coexist — `STORY_IV_TIER_RANGES` is fully dead; `STORY_IV_TIER_CENTER` is Frontier-only; only `STORY_IV_CITY_*` is the live story curve

**Evidence**:
```js
const STORY_IV_TIER_RANGES = Object.freeze({1:{min:0,max:15},...}); // 33305 — 0 readers
const STORY_IV_TIER_CENTER  = Object.freeze({1:8,2:16,3:23,4:28});  // 33315 — read only by _rollTieredIVs
const STORY_IV_CITY_TRAINER = Object.freeze([...]);                 // 33331 — the LIVE story table
// 37347: slot.build.ivs = (_foeCity < 0) ? _rollTieredIVs(...)   // Frontier ONLY
//                                         : _rollCityIVs('trainer', ...) // story
```

**Repro**: `grep -n STORY_IV_TIER_RANGES battle.html` → only the declaration (33305) + a comment (33314); zero readers. `grep -n _rollTieredIVs` → only call site is 37348, inside the `_foeCity < 0` (Frontier/generator) branch. In story mode (`_foeCity >= 0`) IVs come exclusively from `_rollCityIVs` reading `STORY_IV_CITY_TRAINER`/`STORY_IV_CITY_WILDPROF`. So the live STORY IV authority is the city tables, not the tier tables.

**Blast radius**: Tuning footgun (extends spec-drift fp on the dead IV table, which noted only `STORY_IV_TIER_RANGES` superseded by `STORY_IV_TIER_CENTER`). The fuller picture: a maintainer editing `STORY_IV_TIER_CENTER` to retune story difficulty changes NOTHING in story mode (it only affects post-HoF Frontier rematches); editing `STORY_IV_TIER_RANGES` changes nothing anywhere. The real story IV knob is `STORY_IV_CITY_TRAINER` + `_trainerDifficultyStep`.

**Fix sketch**: Delete `STORY_IV_TIER_RANGES` (dead). Relabel `STORY_IV_TIER_CENTER`/`_rollTieredIVs` as Frontier-only in name/comment, or fold Frontier into the city-band system. Document `STORY_IV_CITY_TRAINER` as the single story IV source-of-truth (STORY_OVERHAUL_PLAN §4 "ONE city-by-city build-staging config").

**Verification**: One IV table governs story foes; dead table removed; comments name which table each context (story vs Frontier) consumes.

---
severity: P3
category: bug
anchor_symbol: _storyBuildTierForEvent
current_line_hint: ~37106
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 1cf11434af3e
confidence: high
status: open
---

**Title**: `_storyBuildTierForEvent` Basic-Trainer branch has a dead `b>=5` arm — route fodder jumps T2→T4 at post-game with no T3 step (half-applied curve edit)

**Evidence**:
```js
if (e === 'Basic Trainer') {
    if (b >= 5) return STORY_BUILD_TIER.NOVICE;   // DEAD: collapses into the next line
    if (b >= 2) return STORY_BUILD_TIER.NOVICE;
    return STORY_BUILD_TIER.UNTRAINED;
}
```

**Repro**: The `b >= 5` arm returns the same `NOVICE` (T2) as the `b >= 2` arm — it is unreachable-equivalent dead code. Net effect: Basic Trainer = UNTRAINED (b<2), NOVICE (2≤b≤7), then TOURNAMENT (b≥8, via the early `if (b >= 8) return TOURNAMENT` short-circuit at 37062). So route trainers sit at T2 from badge 2 through badge 7, then leap to T4 post-game, skipping T3 (COMPETENT) entirely. The Rival branch (37068-37069) has the identical dead `b>=7`/`b>=5` → both COMPETENT pattern.

**Blast radius**: A half-finished curve edit — the `b >= 5` arm was clearly meant to step Basic Trainer up to a higher tier at Stage 3 but was left at NOVICE. Confirms STORY_OVERHAUL_PLAN §3's "redundant tier branches (half-applied curve edit)". Low live impact (T2 still gets city-scaled IV/EV + stat band, so the foe still climbs), but it is dead/misleading code that contradicts the comment's "wild trainer < gym staff < gym leader ladder".

**Fix sketch**: Either delete the dead `b >= 5` arm (if T2-through-Stage-3 is intended) or set it to COMPETENT (if route fodder should reach T3 at Stage 3 — balance number, user-owned). Same cleanup for the Rival branch's duplicate arm.

**Verification**: Each event-type branch has strictly increasing thresholds with distinct return values; no two consecutive arms return the same tier.

---
severity: P3
category: inconsistency
anchor_symbol: _storyBuildTierForEvent
current_line_hint: ~37095
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 1f391dcb0522
confidence: medium
status: open
---

**Title**: "wild < gym staff" ladder is violated — Basic Trainer and Gym Trainer 1 share the SAME tier at every badge count

**Evidence**:
```js
if (e === 'Gym Trainer 1' || e === 'Gym Trainer') {  // GT1
    if (b >= 2) return STORY_BUILD_TIER.NOVICE;
    return STORY_BUILD_TIER.UNTRAINED;
}                                                     // == Basic Trainer's effective curve
```

**Repro**: Tier table by badges (replicated): Basic Trainer = [1,1,2,2,2,2,2,2,4], Gym Trainer 1 = [1,1,2,2,2,2,2,2,4] — identical at every badge. The comment at 37103 promises route fodder "one tier below the gym trainer of the same stage", and 37096 says GT1 should make "a gym's front-room staff read as weaker than the back-room (GT2)". GT2 (T3 at b≥5) is correctly above, but GT1 == Basic Trainer for the whole run, so the intended 3-rung "wild < front-room gym staff < back-room gym staff" ladder is only 2 rungs.

**Blast radius**: Cosmetic/identity (build-tier sets EV-cap/item/ability polish in the Frontier path; in story the city curve dominates so the felt gap is small). But it contradicts the design comment and the maintainer's "regular trainers slightly below the player" intent where front-room gym staff are meant to read as a notch above route fodder. Pairs with the dead-branch finding above (same function).

**Fix sketch**: If GT1 should sit above Basic Trainer, give Basic Trainer a lower ceiling (e.g. cap at UNTRAINED longer) or GT1 a higher one — balance numbers, user-owned. Otherwise update the misleading comments to state GT1 == Basic Trainer by design and only GT2 is elevated.

**Verification**: For every badge count, `tier('Basic Trainer') <= tier('Gym Trainer 1') <= tier('Gym Trainer 2')` with at least one strict step, matching the comment.

