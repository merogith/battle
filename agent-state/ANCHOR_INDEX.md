# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T07:28:22.854Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32521 | function-decl |
| `save` | battle.html | 32460 | function-decl |
| `SAVE_KEY` | battle.html | 31511 | const-decl |
| `SAVE_VER` | battle.html | 31516 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29254 | const-decl |
| `enterBattleEvent` | battle.html | 42673 | function-decl |
| `proceedToNextBattle` | battle.html | 42176 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32167 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 30004 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32424 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34245 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34662 | function-decl |
| `makeBuild` | battle.html | 10369 | function-decl |
| `makeWildBuild` | battle.html | 44985 | function-decl |
| `makeDesignedBuild` | battle.html | 10338 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33678 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33862 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33934 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34060 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33920 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11503 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33162 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33289 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11483 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41342 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30143 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32286 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30580 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34855 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38811 | function-decl |
| `renderCityActions` | battle.html | 38934 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30124 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41284 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44397 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25501 | function-decl |
| `buildPokemon` | battle.html | 14138 | function-decl |
| `ensureMoveData` | battle.html | 9556 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36969 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37202 | function-decl |
| `playStoryTutorial` | battle.html | 37263 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30819 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30833 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31153 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31167 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30976 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39764 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40976 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 43171 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45996 | function-decl |
| `enterArtifactShop` | battle.html | 46247 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11828 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
