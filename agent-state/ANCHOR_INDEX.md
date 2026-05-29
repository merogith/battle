# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-29T18:39:58.329Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 35171 | function-decl |
| `save` | battle.html | 35110 | function-decl |
| `SAVE_KEY` | battle.html | 34133 | const-decl |
| `SAVE_VER` | battle.html | 34138 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29833 | const-decl |
| `enterBattleEvent` | battle.html | 46643 | function-decl |
| `proceedToNextBattle` | battle.html | 46093 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34814 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 32519 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 35074 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 37138 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 37621 | function-decl |
| `makeBuild` | battle.html | 10868 | function-decl |
| `makeWildBuild` | battle.html | 49095 | function-decl |
| `makeDesignedBuild` | battle.html | 10837 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 36415 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 36636 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 36710 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36844 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 36696 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 12002 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 35928 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 36055 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11982 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 45193 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32622 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 34936 | function-decl |
| `getRivalEncounterPhase` | battle.html | 33200 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 37850 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 42600 | function-decl |
| `renderCityActions` | battle.html | 42722 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32599 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 45135 | function-decl |
| `_bossArcRollLegendary` | battle.html | 48503 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 26081 | function-decl |
| `buildPokemon` | battle.html | 14618 | function-decl |
| `ensureMoveData` | battle.html | 10055 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 40106 | const-decl |
| `_showStoryTutorialScene` | battle.html | 40339 | function-decl |
| `playStoryTutorial` | battle.html | 40400 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 33439 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 33453 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33775 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33789 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 33596 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 43610 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 44827 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 47275 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 50153 | function-decl |
| `enterArtifactShop` | battle.html | 50409 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12327 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
