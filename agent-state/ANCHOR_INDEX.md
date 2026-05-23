# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-23T23:35:48.853Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32174 | function-decl |
| `save` | battle.html | 32113 | function-decl |
| `SAVE_KEY` | battle.html | 31192 | const-decl |
| `SAVE_VER` | battle.html | 31197 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 28959 | const-decl |
| `enterBattleEvent` | battle.html | 41719 | function-decl |
| `proceedToNextBattle` | battle.html | 41215 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 31824 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29694 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32077 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 33816 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34193 | function-decl |
| `makeBuild` | battle.html | 10246 | function-decl |
| `makeWildBuild` | battle.html | 44004 | function-decl |
| `makeDesignedBuild` | battle.html | 10215 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33249 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33433 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33505 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 33631 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33491 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11373 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 32733 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 32860 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11353 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 40548 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 29833 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 31939 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30262 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34386 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38297 | function-decl |
| `renderCityActions` | battle.html | 38422 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 29814 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 40490 | function-decl |
| `_bossArcRollLegendary` | battle.html | 43416 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25206 | function-decl |
| `buildPokemon` | battle.html | 13992 | function-decl |
| `ensureMoveData` | battle.html | 9433 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36441 | const-decl |
| `_showStoryTutorialScene` | battle.html | 36674 | function-decl |
| `playStoryTutorial` | battle.html | 36735 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30501 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30515 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 30835 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 30849 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30658 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39228 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40192 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42199 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 44998 | function-decl |
| `enterArtifactShop` | battle.html | 45237 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11698 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
