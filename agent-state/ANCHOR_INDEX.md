# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-23T23:07:07.899Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 31970 | function-decl |
| `save` | battle.html | 31909 | function-decl |
| `SAVE_KEY` | battle.html | 31038 | const-decl |
| `SAVE_VER` | battle.html | 31043 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 28895 | const-decl |
| `enterBattleEvent` | battle.html | 40323 | function-decl |
| `proceedToNextBattle` | battle.html | 39819 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 31650 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29627 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 31873 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 33487 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 33771 | function-decl |
| `makeBuild` | battle.html | 10244 | function-decl |
| `makeWildBuild` | battle.html | 42402 | function-decl |
| `makeDesignedBuild` | battle.html | 10213 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 32929 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33113 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33185 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 33309 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33171 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11371 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 32483 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 32608 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11351 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 39161 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 29766 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 31758 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30192 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 33978 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 37889 | function-decl |
| `renderCityActions` | battle.html | 38014 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 29747 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 39103 | function-decl |
| `_bossArcRollLegendary` | battle.html | 41814 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25142 | function-decl |
| `buildPokemon` | battle.html | 13969 | function-decl |
| `ensureMoveData` | battle.html | 9432 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36033 | const-decl |
| `_showStoryTutorialScene` | battle.html | 36266 | function-decl |
| `playStoryTutorial` | battle.html | 36327 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30425 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30439 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 30681 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 30695 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30582 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 38769 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 38822 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 40753 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 43396 | function-decl |
| `enterArtifactShop` | battle.html | 43635 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11696 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
