# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T08:34:21.620Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32934 | function-decl |
| `save` | battle.html | 32873 | function-decl |
| `SAVE_KEY` | battle.html | 31923 | const-decl |
| `SAVE_VER` | battle.html | 31928 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29660 | const-decl |
| `enterBattleEvent` | battle.html | 43108 | function-decl |
| `proceedToNextBattle` | battle.html | 42611 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32579 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 30416 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32837 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34682 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 35101 | function-decl |
| `makeBuild` | battle.html | 10750 | function-decl |
| `makeWildBuild` | battle.html | 45422 | function-decl |
| `makeDesignedBuild` | battle.html | 10719 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 34115 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 34299 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 34371 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34497 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 34357 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11893 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33599 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33726 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11873 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41779 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30555 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32699 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30992 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 35294 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 39249 | function-decl |
| `renderCityActions` | battle.html | 39372 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30536 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41721 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44831 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25907 | function-decl |
| `buildPokemon` | battle.html | 14537 | function-decl |
| `ensureMoveData` | battle.html | 9937 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 37407 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37640 | function-decl |
| `playStoryTutorial` | battle.html | 37701 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 31231 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 31245 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31565 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31579 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 31388 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 40202 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 41413 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 43606 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 46442 | function-decl |
| `enterArtifactShop` | battle.html | 46693 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12218 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
