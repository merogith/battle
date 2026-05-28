# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T17:20:01.251Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 33083 | function-decl |
| `save` | battle.html | 33022 | function-decl |
| `SAVE_KEY` | battle.html | 32067 | const-decl |
| `SAVE_VER` | battle.html | 32072 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29657 | const-decl |
| `enterBattleEvent` | battle.html | 43792 | function-decl |
| `proceedToNextBattle` | battle.html | 43242 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32729 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 30413 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32986 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 35035 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 35467 | function-decl |
| `makeBuild` | battle.html | 10731 | function-decl |
| `makeWildBuild` | battle.html | 46142 | function-decl |
| `makeDesignedBuild` | battle.html | 10700 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 34312 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 34533 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 34607 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34741 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 34593 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11865 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33825 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33952 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11845 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 42342 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30556 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32848 | function-decl |
| `getRivalEncounterPhase` | battle.html | 31134 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 35668 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 39761 | function-decl |
| `renderCityActions` | battle.html | 39884 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30533 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 42284 | function-decl |
| `_bossArcRollLegendary` | battle.html | 45550 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25905 | function-decl |
| `buildPokemon` | battle.html | 14481 | function-decl |
| `ensureMoveData` | battle.html | 9918 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 37914 | const-decl |
| `_showStoryTutorialScene` | battle.html | 38147 | function-decl |
| `playStoryTutorial` | battle.html | 38208 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 31373 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 31387 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31709 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31723 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 31530 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 40759 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 41976 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 44322 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 47194 | function-decl |
| `enterArtifactShop` | battle.html | 47445 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12190 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
