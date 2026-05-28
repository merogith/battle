# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T21:50:47.361Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 35166 | function-decl |
| `save` | battle.html | 35105 | function-decl |
| `SAVE_KEY` | battle.html | 34128 | const-decl |
| `SAVE_VER` | battle.html | 34133 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29828 | const-decl |
| `enterBattleEvent` | battle.html | 46609 | function-decl |
| `proceedToNextBattle` | battle.html | 46059 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34809 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 32514 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 35069 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 37133 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 37612 | function-decl |
| `makeBuild` | battle.html | 10868 | function-decl |
| `makeWildBuild` | battle.html | 49061 | function-decl |
| `makeDesignedBuild` | battle.html | 10837 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 36410 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 36631 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 36705 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36839 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 36691 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 12002 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 35923 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 36050 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11982 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 45159 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32617 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 34931 | function-decl |
| `getRivalEncounterPhase` | battle.html | 33195 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 37841 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 42579 | function-decl |
| `renderCityActions` | battle.html | 42701 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32594 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 45101 | function-decl |
| `_bossArcRollLegendary` | battle.html | 48469 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 26076 | function-decl |
| `buildPokemon` | battle.html | 14618 | function-decl |
| `ensureMoveData` | battle.html | 10055 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 40094 | const-decl |
| `_showStoryTutorialScene` | battle.html | 40327 | function-decl |
| `playStoryTutorial` | battle.html | 40388 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 33434 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 33448 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33770 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33784 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 33591 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 43576 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 44793 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 47241 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 50113 | function-decl |
| `enterArtifactShop` | battle.html | 50369 | function-decl |

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
