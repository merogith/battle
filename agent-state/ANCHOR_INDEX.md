# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-27T09:09:55.468Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32502 | function-decl |
| `save` | battle.html | 32441 | function-decl |
| `SAVE_KEY` | battle.html | 31492 | const-decl |
| `SAVE_VER` | battle.html | 31497 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29230 | const-decl |
| `enterBattleEvent` | battle.html | 42433 | function-decl |
| `proceedToNextBattle` | battle.html | 41936 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32148 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29981 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32405 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34257 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34687 | function-decl |
| `makeBuild` | battle.html | 10370 | function-decl |
| `makeWildBuild` | battle.html | 44747 | function-decl |
| `makeDesignedBuild` | battle.html | 10339 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33673 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33857 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33929 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34055 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33915 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11504 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33157 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33284 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11484 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41105 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30124 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32267 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30561 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34880 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38766 | function-decl |
| `renderCityActions` | battle.html | 38889 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30101 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41047 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44159 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25477 | function-decl |
| `buildPokemon` | battle.html | 14120 | function-decl |
| `ensureMoveData` | battle.html | 9557 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36924 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37157 | function-decl |
| `playStoryTutorial` | battle.html | 37218 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30800 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30814 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31134 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31148 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30957 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39726 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40739 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42931 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45758 | function-decl |
| `enterArtifactShop` | battle.html | 46009 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11829 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
