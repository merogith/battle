# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-29T13:45:57.088Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 35252 | function-decl |
| `save` | battle.html | 35191 | function-decl |
| `SAVE_KEY` | battle.html | 34214 | const-decl |
| `SAVE_VER` | battle.html | 34219 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29914 | const-decl |
| `enterBattleEvent` | battle.html | 46695 | function-decl |
| `proceedToNextBattle` | battle.html | 46145 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34895 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 32600 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 35155 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 37219 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 37698 | function-decl |
| `makeBuild` | battle.html | 10868 | function-decl |
| `makeWildBuild` | battle.html | 49166 | function-decl |
| `makeDesignedBuild` | battle.html | 10837 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 36496 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 36717 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 36791 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36925 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 36777 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 12088 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 36009 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 36136 | function-decl |
| `_mechForGimmickRoll` | battle.html | 12068 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 45245 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32703 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 35017 | function-decl |
| `getRivalEncounterPhase` | battle.html | 33281 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 37927 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 42665 | function-decl |
| `renderCityActions` | battle.html | 42787 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32680 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 45187 | function-decl |
| `_bossArcRollLegendary` | battle.html | 48574 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 26162 | function-decl |
| `buildPokemon` | battle.html | 14704 | function-decl |
| `ensureMoveData` | battle.html | 10055 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 40180 | const-decl |
| `_showStoryTutorialScene` | battle.html | 40413 | function-decl |
| `playStoryTutorial` | battle.html | 40474 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 33520 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 33534 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33856 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33870 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 33677 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 43662 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 44879 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 47342 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 50218 | function-decl |
| `enterArtifactShop` | battle.html | 50474 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12413 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
