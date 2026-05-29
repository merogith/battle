# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-29T18:41:13.059Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 35298 | function-decl |
| `save` | battle.html | 35237 | function-decl |
| `SAVE_KEY` | battle.html | 34260 | const-decl |
| `SAVE_VER` | battle.html | 34265 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29939 | const-decl |
| `enterBattleEvent` | battle.html | 46744 | function-decl |
| `proceedToNextBattle` | battle.html | 46194 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34941 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 32625 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 35201 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 37265 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 37744 | function-decl |
| `makeBuild` | battle.html | 10893 | function-decl |
| `makeWildBuild` | battle.html | 49227 | function-decl |
| `makeDesignedBuild` | battle.html | 10862 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 36542 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 36763 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 36837 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36971 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 36823 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 12113 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 36055 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 36182 | function-decl |
| `_mechForGimmickRoll` | battle.html | 12093 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 45291 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32728 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 35063 | function-decl |
| `getRivalEncounterPhase` | battle.html | 33306 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 37973 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 42711 | function-decl |
| `renderCityActions` | battle.html | 42833 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32705 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 45233 | function-decl |
| `_bossArcRollLegendary` | battle.html | 48635 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 26187 | function-decl |
| `buildPokemon` | battle.html | 14729 | function-decl |
| `ensureMoveData` | battle.html | 10080 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 40226 | const-decl |
| `_showStoryTutorialScene` | battle.html | 40459 | function-decl |
| `playStoryTutorial` | battle.html | 40520 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 33545 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 33559 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33881 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33895 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 33702 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 43708 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 44925 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 47401 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 50285 | function-decl |
| `enterArtifactShop` | battle.html | 50541 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12438 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
