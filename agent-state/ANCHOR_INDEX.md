# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T22:17:27.081Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 35197 | function-decl |
| `save` | battle.html | 35136 | function-decl |
| `SAVE_KEY` | battle.html | 34159 | const-decl |
| `SAVE_VER` | battle.html | 34164 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29859 | const-decl |
| `enterBattleEvent` | battle.html | 46671 | function-decl |
| `proceedToNextBattle` | battle.html | 46121 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34840 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 32545 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 35100 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 37164 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 37643 | function-decl |
| `makeBuild` | battle.html | 10888 | function-decl |
| `makeWildBuild` | battle.html | 49123 | function-decl |
| `makeDesignedBuild` | battle.html | 10857 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 36441 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 36662 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 36736 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36870 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 36722 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 12022 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 35954 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 36081 | function-decl |
| `_mechForGimmickRoll` | battle.html | 12002 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 45221 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32648 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 34962 | function-decl |
| `getRivalEncounterPhase` | battle.html | 33226 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 37872 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 42610 | function-decl |
| `renderCityActions` | battle.html | 42732 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32625 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 45163 | function-decl |
| `_bossArcRollLegendary` | battle.html | 48531 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 26107 | function-decl |
| `buildPokemon` | battle.html | 14638 | function-decl |
| `ensureMoveData` | battle.html | 10075 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 40125 | const-decl |
| `_showStoryTutorialScene` | battle.html | 40358 | function-decl |
| `playStoryTutorial` | battle.html | 40419 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 33465 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 33479 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33801 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33815 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 33622 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 43638 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 44855 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 47303 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 50175 | function-decl |
| `enterArtifactShop` | battle.html | 50431 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12347 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
