# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T11:51:20.155Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 33002 | function-decl |
| `save` | battle.html | 32941 | function-decl |
| `SAVE_KEY` | battle.html | 31986 | const-decl |
| `SAVE_VER` | battle.html | 31991 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29600 | const-decl |
| `enterBattleEvent` | battle.html | 43579 | function-decl |
| `proceedToNextBattle` | battle.html | 43041 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32648 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 30356 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32905 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34915 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 35339 | function-decl |
| `makeBuild` | battle.html | 10731 | function-decl |
| `makeWildBuild` | battle.html | 45919 | function-decl |
| `makeDesignedBuild` | battle.html | 10700 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 34231 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 34452 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 34526 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34660 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 34512 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11865 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33744 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33871 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11845 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 42176 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30499 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32767 | function-decl |
| `getRivalEncounterPhase` | battle.html | 31053 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 35540 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 39633 | function-decl |
| `renderCityActions` | battle.html | 39756 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30476 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 42118 | function-decl |
| `_bossArcRollLegendary` | battle.html | 45327 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25853 | function-decl |
| `buildPokemon` | battle.html | 14481 | function-decl |
| `ensureMoveData` | battle.html | 9918 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 37786 | const-decl |
| `_showStoryTutorialScene` | battle.html | 38019 | function-decl |
| `playStoryTutorial` | battle.html | 38080 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 31292 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 31306 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31628 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31642 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 31449 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 40593 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 41810 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 44099 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 46968 | function-decl |
| `enterArtifactShop` | battle.html | 47219 | function-decl |

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
