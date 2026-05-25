# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-25T02:08:14.763Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 31963 | function-decl |
| `save` | battle.html | 31902 | function-decl |
| `SAVE_KEY` | battle.html | 31031 | const-decl |
| `SAVE_VER` | battle.html | 31036 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 28888 | const-decl |
| `enterBattleEvent` | battle.html | 40316 | function-decl |
| `proceedToNextBattle` | battle.html | 39812 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 31643 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29620 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 31866 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 33480 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 33764 | function-decl |
| `makeBuild` | battle.html | 10246 | function-decl |
| `makeWildBuild` | battle.html | 42395 | function-decl |
| `makeDesignedBuild` | battle.html | 10215 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 32922 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33106 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33178 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 33302 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33164 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11373 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 32476 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 32601 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11353 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 39154 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 29759 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 31751 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30185 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 33971 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 37882 | function-decl |
| `renderCityActions` | battle.html | 38007 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 29740 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 39096 | function-decl |
| `_bossArcRollLegendary` | battle.html | 41807 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25135 | function-decl |
| `buildPokemon` | battle.html | 13962 | function-decl |
| `ensureMoveData` | battle.html | 9432 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36026 | const-decl |
| `_showStoryTutorialScene` | battle.html | 36259 | function-decl |
| `playStoryTutorial` | battle.html | 36320 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30418 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30432 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 30674 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 30688 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30575 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 38762 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 38815 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 40746 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 43389 | function-decl |
| `enterArtifactShop` | battle.html | 43628 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11697 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
