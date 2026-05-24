# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-24T00:39:03.731Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32256 | function-decl |
| `save` | battle.html | 32195 | function-decl |
| `SAVE_KEY` | battle.html | 31274 | const-decl |
| `SAVE_VER` | battle.html | 31279 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29040 | const-decl |
| `enterBattleEvent` | battle.html | 41801 | function-decl |
| `proceedToNextBattle` | battle.html | 41297 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 31906 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29775 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32159 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 33898 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34275 | function-decl |
| `makeBuild` | battle.html | 10322 | function-decl |
| `makeWildBuild` | battle.html | 44086 | function-decl |
| `makeDesignedBuild` | battle.html | 10291 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33331 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33515 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33587 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 33713 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33573 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11449 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 32815 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 32942 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11429 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 40630 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 29914 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32021 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30343 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34468 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38379 | function-decl |
| `renderCityActions` | battle.html | 38504 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 29895 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 40572 | function-decl |
| `_bossArcRollLegendary` | battle.html | 43498 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25287 | function-decl |
| `buildPokemon` | battle.html | 14070 | function-decl |
| `ensureMoveData` | battle.html | 9509 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36523 | const-decl |
| `_showStoryTutorialScene` | battle.html | 36756 | function-decl |
| `playStoryTutorial` | battle.html | 36817 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30582 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30596 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 30916 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 30930 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30739 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39310 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40274 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42281 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45080 | function-decl |
| `enterArtifactShop` | battle.html | 45319 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11774 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
