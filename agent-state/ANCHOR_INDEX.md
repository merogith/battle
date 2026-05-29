# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-29T17:32:35.733Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 35279 | function-decl |
| `save` | battle.html | 35218 | function-decl |
| `SAVE_KEY` | battle.html | 34241 | const-decl |
| `SAVE_VER` | battle.html | 34246 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29918 | const-decl |
| `enterBattleEvent` | battle.html | 46725 | function-decl |
| `proceedToNextBattle` | battle.html | 46175 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34922 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 32604 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 35182 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 37246 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 37725 | function-decl |
| `makeBuild` | battle.html | 10872 | function-decl |
| `makeWildBuild` | battle.html | 49198 | function-decl |
| `makeDesignedBuild` | battle.html | 10841 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 36523 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 36744 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 36818 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36952 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 36804 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 12092 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 36036 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 36163 | function-decl |
| `_mechForGimmickRoll` | battle.html | 12072 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 45272 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32707 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 35044 | function-decl |
| `getRivalEncounterPhase` | battle.html | 33285 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 37954 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 42692 | function-decl |
| `renderCityActions` | battle.html | 42814 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32684 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 45214 | function-decl |
| `_bossArcRollLegendary` | battle.html | 48606 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 26166 | function-decl |
| `buildPokemon` | battle.html | 14708 | function-decl |
| `ensureMoveData` | battle.html | 10059 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 40207 | const-decl |
| `_showStoryTutorialScene` | battle.html | 40440 | function-decl |
| `playStoryTutorial` | battle.html | 40501 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 33524 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 33538 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33860 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33874 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 33681 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 43689 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 44906 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 47372 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 50256 | function-decl |
| `enterArtifactShop` | battle.html | 50512 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 12417 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
