# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-22T16:55:49.438Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 30943 | function-decl |
| `save` | battle.html | 30882 | function-decl |
| `SAVE_KEY` | battle.html | 30037 | const-decl |
| `SAVE_VER` | battle.html | 30042 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 28011 | const-decl |
| `enterBattleEvent` | battle.html | 38091 | function-decl |
| `proceedToNextBattle` | battle.html | 37656 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 30638 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 28731 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 30856 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 32378 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 32662 | function-decl |
| `makeBuild` | battle.html | 9715 | function-decl |
| `makeWildBuild` | battle.html | 39999 | function-decl |
| `makeDesignedBuild` | battle.html | 9684 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 31857 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 32041 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 32113 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 32205 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 32099 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 10786 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 31411 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 31536 | function-decl |
| `_mechForGimmickRoll` | battle.html | 10766 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 36994 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 28870 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 30741 | function-decl |
| `getRivalEncounterPhase` | battle.html | 29259 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 32869 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 35904 | function-decl |
| `renderCityActions` | battle.html | 36017 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 28851 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 36936 | function-decl |
| `_bossArcRollLegendary` | battle.html | 39526 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 24311 | function-decl |
| `buildPokemon` | battle.html | 13320 | function-decl |
| `ensureMoveData` | battle.html | 9006 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 34873 | const-decl |
| `_showStoryTutorialScene` | battle.html | 35031 | function-decl |
| `playStoryTutorial` | battle.html | 35087 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 29482 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 29496 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 29721 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 29735 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 29639 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 36628 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 36681 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 38480 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 40980 | function-decl |
| `enterArtifactShop` | battle.html | 41198 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11131 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
