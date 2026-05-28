# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T06:52:04.489Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32627 | function-decl |
| `save` | battle.html | 32566 | function-decl |
| `SAVE_KEY` | battle.html | 31611 | const-decl |
| `SAVE_VER` | battle.html | 31616 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29231 | const-decl |
| `enterBattleEvent` | battle.html | 42884 | function-decl |
| `proceedToNextBattle` | battle.html | 42346 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32273 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29987 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32530 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34474 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34896 | function-decl |
| `makeBuild` | battle.html | 10371 | function-decl |
| `makeWildBuild` | battle.html | 45221 | function-decl |
| `makeDesignedBuild` | battle.html | 10340 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33835 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 34019 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 34093 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 34219 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 34079 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11505 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33357 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33484 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11485 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 41479 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30130 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32392 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30678 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 35097 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 39134 | function-decl |
| `renderCityActions` | battle.html | 39257 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30107 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 41421 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44632 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25478 | function-decl |
| `buildPokemon` | battle.html | 14121 | function-decl |
| `ensureMoveData` | battle.html | 9558 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 37287 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37520 | function-decl |
| `playStoryTutorial` | battle.html | 37581 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30917 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30931 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31253 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31267 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 31074 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 40094 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 41113 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 43404 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 46261 | function-decl |
| `enterArtifactShop` | battle.html | 46512 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11830 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
