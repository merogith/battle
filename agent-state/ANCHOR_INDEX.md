# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-26T07:45:21.939Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32269 | function-decl |
| `save` | battle.html | 32208 | function-decl |
| `SAVE_KEY` | battle.html | 31280 | const-decl |
| `SAVE_VER` | battle.html | 31285 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29049 | const-decl |
| `enterBattleEvent` | battle.html | 41856 | function-decl |
| `proceedToNextBattle` | battle.html | 41363 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 31919 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29781 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32172 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 33915 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34292 | function-decl |
| `makeBuild` | battle.html | 10331 | function-decl |
| `makeWildBuild` | battle.html | 44145 | function-decl |
| `makeDesignedBuild` | battle.html | 10300 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33348 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33532 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33604 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 33730 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33590 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11458 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 32832 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 32959 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11438 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 40654 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 29920 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32034 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30349 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34485 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38382 | function-decl |
| `renderCityActions` | battle.html | 38504 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 29901 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 40596 | function-decl |
| `_bossArcRollLegendary` | battle.html | 43557 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25296 | function-decl |
| `buildPokemon` | battle.html | 14079 | function-decl |
| `ensureMoveData` | battle.html | 9518 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36541 | const-decl |
| `_showStoryTutorialScene` | battle.html | 36774 | function-decl |
| `playStoryTutorial` | battle.html | 36835 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30588 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30602 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 30922 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 30936 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30745 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39310 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40298 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42338 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45139 | function-decl |
| `enterArtifactShop` | battle.html | 45375 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11783 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
