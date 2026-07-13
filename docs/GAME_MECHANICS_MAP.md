# Game Mechanics Map — concept → code

> **Purpose:** translate the words a human (or a prompt) naturally uses for a
> game system into the **actual symbols** in `battle.html`, so a session can jump
> to the right ~10 lines instead of grepping a common word and reading 500.
>
> **How to use it:** find your concept below, use the listed **symbols** as your
> search targets. Line numbers are a hint as of the date below and **drift on
> every edit** — resolve the live location with the `find-anchor` skill (`/anchor
> <symbol>`), never trust the number verbatim.
>
> **Line numbers current as of:** 2026-07-13. Regenerate `agent-state/ANCHOR_INDEX.md`
> (`node scripts/debug/anchor-map.mjs`) for the machine-checked subset.
>
> **How to keep it fresh:** when you add or rename a mechanic, add/adjust its row
> here in the same commit. If a symbol here resolves to `_not found_`, it was
> renamed or removed — fix the row, don't leave it stale.

---

## Legend

- **Symbols** = the function/const names to search for. These are what you should
  name in a prompt ("change `_storyFullHealPartySlots`…"), not the plain-English concept.
- **Gotcha** = the thing that bites you if you edit blind (inline logic, no central
  flag, seeded-RNG requirement, save-schema coupling).
- **Guarded by** = the test that will fail if you regress it. "(none)" means this
  system is **unprotected** — write the pin test *before* changing it.

---

## 1. Story pacing / beat timeline
_"how the story is paced", "beat order", "what happens between cities"_

- **Symbols:** `STORY_EVENTS_RAW` (~36431, the timeline data) · `enterBattleEvent`
  (~60514) · `proceedToNextBattle` (~57755) · `getStoryBeatForRow` (~50981) ·
  `cityIndexFromEventIndex` (~54658).
- **Gotcha:** beat ordering + the intro queue are **sensitive** — a wrong reorder
  can fire an event before its prerequisite (e.g. intro after gift). Per CLAUDE.md,
  ordering bugs must be flagged even though the maintainer owns the flow.
- **Docs:** `STORY_MODE_FLOW.md` §1–3, §13.
- **Guarded by:** story-sim replays under `agent-state/story-sim/`; treat any
  timeline edit as behavior-change → needs sign-off.

## 2. Auto-heal between fights
_"party heals between battles", "auto-heal pacing"_

- **Symbols:** `_storyFullHealPartySlots` (~54771). There is **no** `autoHeal`
  flag — the heal is this one function, called from ~a dozen sites (victory,
  retreat, mystery/rival-loss recovery, pit-bracket recovery).
- **Gotcha:** it is an unconditional **full** restore. There is no partial-heal /
  no-heal difficulty variant today; adding one means gating this call, not adding
  a number. Searching `heal` returns ~491 unrelated hits — always use the exact symbol.
- **Docs:** `STORY_MODE_FLOW.md` §8 (difficulty modes).
- **Guarded by:** (none — candidate pin test).

## 3. NPC unlocks / staged facilities
_"how NPCs unlock", "the dojo/tutor showing up later", "facility tiers"_

- **Symbols:** `NPC_STAGE_CITY` (~44954, the ladder) · `NPC_STAGE_NAMES` (~53998) ·
  `_npcStageName` (~69616) · `NPC_STAGE_INTRO` (~54438) · `NPC_STAGE_GIFT` (~69696)
  · `NPC_STAGE_SPRITE` (~69717).
- **Gotcha:** an NPC's stage is **derived from the current city**, not stored as an
  "unlocked" boolean — `NPC_STAGE_CITY.dojo = [1,4,6,8]` means the dojo's tag/tier
  advances at those cities. One-time tier-up gifts are de-duped via
  `sm.npcStageSeen`; shifting a ladder requires a resync migration (see the v28
  dojo note in `load`). So "unlock an NPC earlier" = edit the ladder **and** check
  the gift-refire guard.
- **Docs:** `STORY_MODE_FLOW.md` §15f ("NPC placement changes"), §15g.
- **Guarded by:** (none — candidate pin test).

## 4. Item / move tiers that unlock
_"items and moves have tiers that unlock", "what gear the foe/player can use yet"_

- **Enemy/player build power tier:** `STORY_BUILD_TIER` (~47017) ·
  `_storyBuildTierForEvent` (~47265) · `_storyDowngradeBuildForTier` (~47362) ·
  `_applyStoryBuildPowerTier` (~47501). This is what caps items/abilities on
  rolled teams by story stage.
- **Item tier table:** `ITEM_TIER` (~69660).
- **Move tutor staging:** `tutorStage` (~59002) · `TUTOR_COST_*` (~69542–69546) ·
  `TUTOR_UNIVERSAL_ITEMS` (~69826) · `TUTOR_VOUCHERS` (~73209).
- **Gotcha:** these are **balance numbers the maintainer owns** (CLAUDE.md Approval
  rules) — expose/extract them, let the maintainer pick values; don't retune casually.
- **Docs:** `docs/PROGRESSION_CURVE_MASTER.md`; `STORY_MODE_FLOW.md` §15d (Cable Link
  tier), §15g; `docs/MOVE_TUTOR_OVERHAUL_PLAN.md`.
- **Guarded by:** build-tier expectations in `tests/` (see BUILD_DIVERSITY docs).

## 5. EV system
_"EV caps", "assigning EVs", "EV presets/vitamins"_

- **Apply / edit:** `enterEVTrainer` (~76252) · `evTrainerApplyPreset` (~76871) ·
  `evTrainerApplyPresetWithVitamin` (~76939) · `evTrainerRedistribute` (~76905) ·
  `applyEvReset` (~68405).
- **Model / caps:** `EV_RULES` (~70819) · `EV_KEYS`/`EV_STAT_KEYS` · `EV_GAIN_ACTIVE`
  (~48813) · `STORY_EV_CITY_TOTAL` (~41543) + `_storyEvTotalForCity` — the per-city
  EV budget curve.
- **Gotcha:** `buildPokemon` tolerates a missing `build.evs`, but the per-battle
  grant + EV Reset assume a populated `evs` object (see the back-fill in `load`).
- **Docs:** `STORY_MODE_FLOW.md` §15b; `docs/BUILD_DIVERSITY_MASTER.md`.
- **Guarded by:** partial — see build-diversity tests.

## 6. IV system
_"IV rolls", "IV training", "why the foe has better IVs late"_

- **Symbols:** player + enemy IV rolls are **tier-scaled** (enemy IVs climb with
  the build tier). Vitamins: `PERM_BOOST_ITEMS` (~41413). Fan Club facility (IV
  training): `FanClub` (~50774) · `FanClubRoster` (~68254) · `FanClubOpenIdx`
  (~69799) · `fanClubIvColor` (~76279) · `fanClubGiftClaimed` (~54023).
- **Gotcha:** IVs are **owned balance numbers**; the enemy IV curve is intentionally
  tier-gated. Don't flatten it without sign-off.
- **Docs:** `STORY_MODE_FLOW.md` §15b ("Player IV rolls", "Enemy IV rolls
  (tier-scaled)", "Vitamins", "Pokémon Fan Club facility", "Save migration v18→v19").
- **Guarded by:** (verify against §15b; add pin test if you touch the curve).

## 7. Drops from enemy
_"what you get from beating a trainer", "EV yield", "loot"_

- **Symbols:** the primary "drop" is the **per-battle EV grant** — `grantBattleEVs`
  (~48812), governed by `EV_GAIN_ACTIVE` and the `STORY_EV_CITY_TOTAL` curve.
  Consumable/tutor drops are city-staged: `VITAMIN_LOOT_BY_CLASS`,
  `VOUCHER_DEBUT_CITY`, `TUTOR_VOUCHERS` (~73209).
- **Gotcha:** there is **no generic item-drop loot table** — "drops" = EV yield +
  staged vitamins/vouchers. Don't invent a loot-roll; extend the existing staged
  grants.
- **Docs:** `STORY_MODE_FLOW.md` §15b.
- **Guarded by:** (none — candidate pin test).

## 8. Wild Pokémon appearances
_"wild spawns", "route encounters", "what shows up to catch"_

- **Symbols:** `rollWildEncounter` (~64098) · `makeWildBuild` (~63955) ·
  `enterCatchEncounter` (~64126) · `buildEncounterStage` (~34864) · `encounterReveal`
  (~34882) · `crucibleWildEncounter` (~62925). Pools/curves: `WILD_GRADE_BY_CITY`
  (~51248) · `WILD_NATURE_POOL_WEIGHTS` (~63749).
- **Gotcha:** wild grade is **badge/city-capped** (strict G3 cap early — §15f);
  encounters must use `storyRngNext`, never `Math.random`, or replays desync.
- **Docs:** `STORY_MODE_FLOW.md` §3 (wild encounters), §4 (Safari), §5 (catch minigame),
  §15f ("Wild route encounters — strict G3 cap"), §15g ("Safari — badge-keyed curve").
- **Guarded by:** (verify against §3/§15f).

## 9. Camp logic
_"the camp between cities", "bond microgames", "rest hub"_

- **Symbols:** `enterCamp` (~59317) · `campPickMicrogame` (~59212) · `campAwardBond`
  (~59245) · `campBondGain` (~59242) · `campMasteredPaths` (~59199) · `campTitleFor`
  (~59210) · `campFavourite` (~59220) · `campBondFavoredPath` (~59231).
- **Gotcha:** microgame selection and bond gains are **seeded** (`storyRngNext`);
  "↩ Back to the road" restores a saved point and camp re-fires on resume — order-
  sensitive. Searching `camp` returns ~622 hits; use the exact `camp*` symbols.
- **Docs:** `STORY_MODE_FLOW.md` (camp sections).
- **Guarded by:** (none — candidate pin test).

## 10. Pre-fight conversations
_"the line a trainer says before a battle", "banter", "flavor before the fight"_

- **Symbols:** `getTrainerQuoteForBattle` (~42089, the dispatcher). Pools:
  `TRAINER_QUOTES` (~11765) · `TRAINER_QUOTES_BY_NAME` (~11766) · `CITY_PROFESSOR_QUOTES`
  (~42430) · `CITY_GUIDE_QUOTES` (~11767).
- **Gotcha:** these are **data pools** — architecture preference is to keep dialogue
  in `data/dialogue/*.json`, not inline. Add lines to the pool, not the dispatcher.
- **Docs / data:** `data/dialogue/`.
- **Guarded by:** text-content consistency auditor (diacritic Pokémon, tone, pool
  exhaustiveness) — `/story-audit`.

## 11. Story mode types / run variety
_"story types", "storylines", "why runs differ"_

- **Symbols:** `STORYLINE_VARIANTS` (~45699) — **classic-only** now (the 8-tone layer
  was cut 2026-06; see CLAUDE.md "TONE layer"). `_storyActiveVariant` (~51016) ·
  `_storyActiveVariantId` (~50556) · `getStoryBeatForRow` (~50981). Real run variety
  comes from the **3-track system**: `sm.tracks` (`.villain` / `.extra`), resolved via
  `_lastRoadArcForCity`.
- **Gotcha:** `sm.storyLine` is **forced to `classic`** on new runs and load. Do not
  revive tone variants without going through git history — a guard test locks this.
- **Docs:** CLAUDE.md ("8-storyline TONE layer — CUT").
- **Guarded by:** `tests/suites/story-tone-retirement.test.js`.

## 12. Trainer pools
_"what team a trainer rolls", "gym leader pool", "signature mons"_

- **Symbols:** `rollTrainerTeam` (~47870) · `rollMysteryFigureFinalBossTeam` (~48883).
  Build construction: `makeBuild` (~13082) · `makeDesignedBuild` (~12935) ·
  `makeWildBuild` (~63955). Power gating: `STORY_BUILD_TIER` (see §4).
- **Gotcha:** late-game uses a **signature grade ceiling + gym-leader union pool**
  with a **tag-gate** for basic-trainer slots and a **top-up** when a signature pool
  empties (§15g). Builds live in `data/builds/` + `data/builds.csv` — data-driven.
- **Docs:** `STORY_MODE_FLOW.md` §15f, §15g; `docs/BUILD_DIVERSITY_MASTER.md`.
- **Guarded by:** `data-integrity-auditor` (`/data-check`) + build-diversity tests.

## 13. Mechanics unlock gate (Mega/Dynamax/Tera/Z)
_"when the player/foe can use gimmicks"_

- **Symbols:** `_withStoryPlayerGimmickGate` (~14960) · `_mechForGimmickRoll` (~14940)
  · `_storyEnemyMechKeys` (~46474) · `_minGuaranteedMechsForEvent` (~46585). Activation:
  `activateMega`/`activateDynamax`/`activateTera`.
- **Gotcha:** player and enemy gates are **separate** — the enemy min-guarantee curve
  is tier/event-scaled (owned balance).
- **Docs:** `STORY_MODE_FLOW.md` §15e/§15f.
- **Guarded by:** (verify against curve docs).

---

## Cross-cutting invariants (apply to ALL of the above)

- **Seeded RNG only.** Anything user-visible uses `storyRngNext` (~45372), never
  `Math.random` — deterministic replays are part of the product.
- **Save schema is load-bearing.** `SAVE_KEY` (~44298) · `SAVE_VER` (~44315) ·
  `save` (~45431) · `load` (~45494) · `migrateStoryPreV15` (~45139) and siblings.
  Any change to stored shape needs a `migrateStoryPreV*` step + `SAVE_VER` bump, or
  you corrupt existing saves. Read `STORY_MODE_FLOW.md` §10 first.
- **Sloppy mode.** `battle.html` has no `'use strict'`. Populate module-level
  placeholders with `Object.assign(X, …)` / `X.push(…)`, never bare `X = …` (see
  CLAUDE.md "Sloppy-mode hazard").
- **Balance numbers are maintainer-owned.** EV caps, IV curves, build tiers, foe
  stat mults, ball %, drop amounts, tutor costs — expose them, don't pick values.
