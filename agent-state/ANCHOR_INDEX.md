# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T08:08:48.568Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32864 | function-decl |
| `save` | battle.html | 32803 | function-decl |
| `SAVE_KEY` | battle.html | 31854 | const-decl |
| `SAVE_VER` | battle.html | 31859 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29597 | const-decl |
| `enterBattleEvent` | battle.html | 43025 | function-decl |
| `proceedToNextBattle` | battle.html | 42528 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32510 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 30347 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32767 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34600 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 35017 | function-decl |
| `makeBuild` | battle.html | 10712 | function-decl |
| `makeWildBuild` | battle.html | 45339 | function-decl |
| `makeDesignedBuild` | battle.html | 10681 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 34033 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 34217 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 34289 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34415 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 34275 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11846 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33517 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33644 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11826 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41696 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30486 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32629 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30923 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 35210 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 39166 | function-decl |
| `renderCityActions` | battle.html | 39289 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30467 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41638 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44748 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25844 | function-decl |
| `buildPokemon` | battle.html | 14481 | function-decl |
| `ensureMoveData` | battle.html | 9899 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 37324 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37557 | function-decl |
| `playStoryTutorial` | battle.html | 37618 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 31162 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 31176 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31496 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31510 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 31319 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 40119 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 41330 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 43523 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 46359 | function-decl |
| `enterArtifactShop` | battle.html | 46610 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12171 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
