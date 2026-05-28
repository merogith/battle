# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T06:57:58.428Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32515 | function-decl |
| `save` | battle.html | 32454 | function-decl |
| `SAVE_KEY` | battle.html | 31505 | const-decl |
| `SAVE_VER` | battle.html | 31510 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29248 | const-decl |
| `enterBattleEvent` | battle.html | 42667 | function-decl |
| `proceedToNextBattle` | battle.html | 42170 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32161 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29998 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32418 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34239 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34656 | function-decl |
| `makeBuild` | battle.html | 10369 | function-decl |
| `makeWildBuild` | battle.html | 44979 | function-decl |
| `makeDesignedBuild` | battle.html | 10338 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33672 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33856 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33928 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34054 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33914 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11503 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33156 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33283 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11483 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41336 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30137 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32280 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30574 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34849 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38805 | function-decl |
| `renderCityActions` | battle.html | 38928 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30118 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41278 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44391 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25495 | function-decl |
| `buildPokemon` | battle.html | 14138 | function-decl |
| `ensureMoveData` | battle.html | 9556 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36963 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37196 | function-decl |
| `playStoryTutorial` | battle.html | 37257 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30813 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30827 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31147 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31161 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30970 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39758 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40970 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 43165 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45990 | function-decl |
| `enterArtifactShop` | battle.html | 46241 | function-decl |

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
