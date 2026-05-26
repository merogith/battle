# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-26T17:33:29.130Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32500 | function-decl |
| `save` | battle.html | 32439 | function-decl |
| `SAVE_KEY` | battle.html | 31494 | const-decl |
| `SAVE_VER` | battle.html | 31499 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29237 | const-decl |
| `enterBattleEvent` | battle.html | 42353 | function-decl |
| `proceedToNextBattle` | battle.html | 41860 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32150 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29987 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32403 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34210 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34618 | function-decl |
| `makeBuild` | battle.html | 10358 | function-decl |
| `makeWildBuild` | battle.html | 44663 | function-decl |
| `makeDesignedBuild` | battle.html | 10327 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33643 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33827 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33899 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34025 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33885 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11492 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33127 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33254 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11472 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41026 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30126 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32265 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30563 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34811 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38710 | function-decl |
| `renderCityActions` | battle.html | 38832 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30107 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 40968 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44075 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25484 | function-decl |
| `buildPokemon` | battle.html | 14127 | function-decl |
| `ensureMoveData` | battle.html | 9545 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36869 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37102 | function-decl |
| `playStoryTutorial` | battle.html | 37163 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30802 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30816 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31136 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31150 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30959 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39655 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40668 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42849 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45662 | function-decl |
| `enterArtifactShop` | battle.html | 45913 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11817 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
