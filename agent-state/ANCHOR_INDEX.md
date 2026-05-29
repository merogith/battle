# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-29T19:04:36.381Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 35178 | function-decl |
| `save` | battle.html | 35117 | function-decl |
| `SAVE_KEY` | battle.html | 34140 | const-decl |
| `SAVE_VER` | battle.html | 34145 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29840 | const-decl |
| `enterBattleEvent` | battle.html | 46664 | function-decl |
| `proceedToNextBattle` | battle.html | 46114 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34821 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 32526 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 35081 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 37145 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 37632 | function-decl |
| `makeBuild` | battle.html | 10868 | function-decl |
| `makeWildBuild` | battle.html | 49116 | function-decl |
| `makeDesignedBuild` | battle.html | 10837 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 36422 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 36643 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 36717 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36851 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 36703 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 12002 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 35935 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 36062 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11982 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 45204 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32629 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 34943 | function-decl |
| `getRivalEncounterPhase` | battle.html | 33207 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 37861 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 42611 | function-decl |
| `renderCityActions` | battle.html | 42733 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32606 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 45146 | function-decl |
| `_bossArcRollLegendary` | battle.html | 48524 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 26085 | function-decl |
| `buildPokemon` | battle.html | 14618 | function-decl |
| `ensureMoveData` | battle.html | 10055 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 40117 | const-decl |
| `_showStoryTutorialScene` | battle.html | 40350 | function-decl |
| `playStoryTutorial` | battle.html | 40411 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 33446 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 33460 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33782 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33796 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 33603 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 43621 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 44838 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 47296 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 50174 | function-decl |
| `enterArtifactShop` | battle.html | 50430 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12327 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
