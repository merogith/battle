# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T08:17:33.377Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32873 | function-decl |
| `save` | battle.html | 32812 | function-decl |
| `SAVE_KEY` | battle.html | 31863 | const-decl |
| `SAVE_VER` | battle.html | 31868 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29606 | const-decl |
| `enterBattleEvent` | battle.html | 43036 | function-decl |
| `proceedToNextBattle` | battle.html | 42539 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32519 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 30356 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32776 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34609 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 35028 | function-decl |
| `makeBuild` | battle.html | 10721 | function-decl |
| `makeWildBuild` | battle.html | 45350 | function-decl |
| `makeDesignedBuild` | battle.html | 10690 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 34042 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 34226 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 34298 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34424 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 34284 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11855 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33526 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33653 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11835 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41707 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30495 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32638 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30932 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 35221 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 39177 | function-decl |
| `renderCityActions` | battle.html | 39300 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30476 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41649 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44759 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25853 | function-decl |
| `buildPokemon` | battle.html | 14490 | function-decl |
| `ensureMoveData` | battle.html | 9908 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 37335 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37568 | function-decl |
| `playStoryTutorial` | battle.html | 37629 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 31171 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 31185 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31505 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31519 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 31328 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 40130 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 41341 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 43534 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 46370 | function-decl |
| `enterArtifactShop` | battle.html | 46621 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12180 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
