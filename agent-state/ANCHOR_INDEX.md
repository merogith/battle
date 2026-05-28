# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-27T23:00:56.155Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32523 | function-decl |
| `save` | battle.html | 32462 | function-decl |
| `SAVE_KEY` | battle.html | 31513 | const-decl |
| `SAVE_VER` | battle.html | 31518 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29256 | const-decl |
| `enterBattleEvent` | battle.html | 42422 | function-decl |
| `proceedToNextBattle` | battle.html | 41925 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32169 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 30006 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32426 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34247 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34666 | function-decl |
| `makeBuild` | battle.html | 10377 | function-decl |
| `makeWildBuild` | battle.html | 44734 | function-decl |
| `makeDesignedBuild` | battle.html | 10346 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33680 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33864 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33936 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34062 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33922 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11511 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33164 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33291 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11491 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41091 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30145 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32288 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30582 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34859 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38759 | function-decl |
| `renderCityActions` | battle.html | 38882 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30126 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41033 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44146 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25503 | function-decl |
| `buildPokemon` | battle.html | 14146 | function-decl |
| `ensureMoveData` | battle.html | 9564 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36917 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37150 | function-decl |
| `playStoryTutorial` | battle.html | 37211 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30821 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30835 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31155 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31169 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30978 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39712 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40725 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42920 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45745 | function-decl |
| `enterArtifactShop` | battle.html | 45996 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11836 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
