# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-27T15:02:18.485Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32514 | function-decl |
| `save` | battle.html | 32453 | function-decl |
| `SAVE_KEY` | battle.html | 31504 | const-decl |
| `SAVE_VER` | battle.html | 31509 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29247 | const-decl |
| `enterBattleEvent` | battle.html | 42411 | function-decl |
| `proceedToNextBattle` | battle.html | 41914 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32160 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29997 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32417 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34238 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34655 | function-decl |
| `makeBuild` | battle.html | 10368 | function-decl |
| `makeWildBuild` | battle.html | 44723 | function-decl |
| `makeDesignedBuild` | battle.html | 10337 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33671 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33855 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33927 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34053 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33913 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11502 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33155 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33282 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11482 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41080 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30136 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32279 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30573 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34848 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38748 | function-decl |
| `renderCityActions` | battle.html | 38871 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30117 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41022 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44135 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25494 | function-decl |
| `buildPokemon` | battle.html | 14137 | function-decl |
| `ensureMoveData` | battle.html | 9555 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36906 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37139 | function-decl |
| `playStoryTutorial` | battle.html | 37200 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30812 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30826 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31146 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31160 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30969 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39701 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40714 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42909 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45734 | function-decl |
| `enterArtifactShop` | battle.html | 45985 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11827 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
