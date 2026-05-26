# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-26T09:19:48.101Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32447 | function-decl |
| `save` | battle.html | 32386 | function-decl |
| `SAVE_KEY` | battle.html | 31441 | const-decl |
| `SAVE_VER` | battle.html | 31446 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29210 | const-decl |
| `enterBattleEvent` | battle.html | 42258 | function-decl |
| `proceedToNextBattle` | battle.html | 41765 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32097 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29942 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32350 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34148 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34556 | function-decl |
| `makeBuild` | battle.html | 10331 | function-decl |
| `makeWildBuild` | battle.html | 44559 | function-decl |
| `makeDesignedBuild` | battle.html | 10300 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33581 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33765 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33837 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 33963 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33823 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11465 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33065 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33192 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11445 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 40940 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30081 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32212 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30510 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34749 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38648 | function-decl |
| `renderCityActions` | battle.html | 38770 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30062 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 40882 | function-decl |
| `_bossArcRollLegendary` | battle.html | 43971 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25457 | function-decl |
| `buildPokemon` | battle.html | 14100 | function-decl |
| `ensureMoveData` | battle.html | 9518 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36807 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37040 | function-decl |
| `playStoryTutorial` | battle.html | 37101 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30749 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30763 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31083 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31097 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30906 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39576 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40584 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42754 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45558 | function-decl |
| `enterArtifactShop` | battle.html | 45794 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11790 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
