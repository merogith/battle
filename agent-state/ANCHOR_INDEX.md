# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-26T18:40:46.127Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32503 | function-decl |
| `save` | battle.html | 32442 | function-decl |
| `SAVE_KEY` | battle.html | 31497 | const-decl |
| `SAVE_VER` | battle.html | 31502 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29240 | const-decl |
| `enterBattleEvent` | battle.html | 42380 | function-decl |
| `proceedToNextBattle` | battle.html | 41887 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32153 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29990 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32406 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34213 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34630 | function-decl |
| `makeBuild` | battle.html | 10361 | function-decl |
| `makeWildBuild` | battle.html | 44690 | function-decl |
| `makeDesignedBuild` | battle.html | 10330 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33646 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33830 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33902 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34028 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33888 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11495 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33130 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33257 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11475 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41053 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30129 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32268 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30566 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34823 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38722 | function-decl |
| `renderCityActions` | battle.html | 38844 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30110 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 40995 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44102 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25487 | function-decl |
| `buildPokemon` | battle.html | 14130 | function-decl |
| `ensureMoveData` | battle.html | 9548 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36881 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37114 | function-decl |
| `playStoryTutorial` | battle.html | 37175 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30805 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30819 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31139 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31153 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30962 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39674 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40687 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42876 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45689 | function-decl |
| `enterArtifactShop` | battle.html | 45940 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11820 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
