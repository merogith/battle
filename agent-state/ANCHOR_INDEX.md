# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-24T00:15:27.227Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32341 | function-decl |
| `save` | battle.html | 32280 | function-decl |
| `SAVE_KEY` | battle.html | 31359 | const-decl |
| `SAVE_VER` | battle.html | 31364 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29126 | const-decl |
| `enterBattleEvent` | battle.html | 41886 | function-decl |
| `proceedToNextBattle` | battle.html | 41382 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 31991 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29861 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32244 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 33983 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34360 | function-decl |
| `makeBuild` | battle.html | 10292 | function-decl |
| `makeWildBuild` | battle.html | 44171 | function-decl |
| `makeDesignedBuild` | battle.html | 10261 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33416 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33600 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33672 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 33798 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33658 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11419 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 32900 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33027 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11399 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 40715 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30000 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32106 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30429 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34553 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38464 | function-decl |
| `renderCityActions` | battle.html | 38589 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 29981 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 40657 | function-decl |
| `_bossArcRollLegendary` | battle.html | 43583 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25373 | function-decl |
| `buildPokemon` | battle.html | 14038 | function-decl |
| `ensureMoveData` | battle.html | 9479 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36608 | const-decl |
| `_showStoryTutorialScene` | battle.html | 36841 | function-decl |
| `playStoryTutorial` | battle.html | 36902 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30668 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30682 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31002 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31016 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30825 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39395 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40359 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42366 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45165 | function-decl |
| `enterArtifactShop` | battle.html | 45404 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11744 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
