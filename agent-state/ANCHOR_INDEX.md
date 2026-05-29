# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-29T15:47:40.163Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 34948 | function-decl |
| `save` | battle.html | 34887 | function-decl |
| `SAVE_KEY` | battle.html | 33910 | const-decl |
| `SAVE_VER` | battle.html | 33915 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 30036 | const-decl |
| `enterBattleEvent` | battle.html | 46391 | function-decl |
| `proceedToNextBattle` | battle.html | 45841 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34591 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 32529 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 34851 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 36915 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 37394 | function-decl |
| `makeBuild` | battle.html | 10998 | function-decl |
| `makeWildBuild` | battle.html | 48833 | function-decl |
| `makeDesignedBuild` | battle.html | 10967 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 36192 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 36413 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 36487 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36621 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 36473 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 12131 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 35705 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 35832 | function-decl |
| `_mechForGimmickRoll` | battle.html | 12111 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 44941 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32632 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 34713 | function-decl |
| `getRivalEncounterPhase` | battle.html | 33135 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 37623 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 42361 | function-decl |
| `renderCityActions` | battle.html | 42483 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32609 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 44883 | function-decl |
| `_bossArcRollLegendary` | battle.html | 48251 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 26281 | function-decl |
| `buildPokemon` | battle.html | 14747 | function-decl |
| `ensureMoveData` | battle.html | 10055 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 39876 | const-decl |
| `_showStoryTutorialScene` | battle.html | 40109 | function-decl |
| `playStoryTutorial` | battle.html | 40170 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 10168 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 10169 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33566 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 10170 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 33387 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 43358 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 44575 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 47023 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 49885 | function-decl |
| `enterArtifactShop` | battle.html | 50141 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12456 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
