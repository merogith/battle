# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T13:09:48.722Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 34431 | function-decl |
| `save` | battle.html | 34370 | function-decl |
| `SAVE_KEY` | battle.html | 33399 | const-decl |
| `SAVE_VER` | battle.html | 33404 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29252 | const-decl |
| `enterBattleEvent` | battle.html | 44708 | function-decl |
| `proceedToNextBattle` | battle.html | 44211 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34074 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 31932 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 34334 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 36170 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 36621 | function-decl |
| `makeBuild` | battle.html | 10373 | function-decl |
| `makeWildBuild` | battle.html | 47033 | function-decl |
| `makeDesignedBuild` | battle.html | 10342 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 35603 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 35787 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 35859 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 35985 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 35845 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11507 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 35087 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 35214 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11487 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 43377 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32031 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 34196 | function-decl |
| `getRivalEncounterPhase` | battle.html | 32468 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 36814 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 41045 | function-decl |
| `renderCityActions` | battle.html | 41168 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32012 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 43319 | function-decl |
| `_bossArcRollLegendary` | battle.html | 46445 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25499 | function-decl |
| `buildPokemon` | battle.html | 14142 | function-decl |
| `ensureMoveData` | battle.html | 9560 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 38879 | const-decl |
| `_showStoryTutorialScene` | battle.html | 39112 | function-decl |
| `playStoryTutorial` | battle.html | 39173 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 32707 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 32721 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33041 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33055 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 32864 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 41998 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 43011 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 45219 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 48044 | function-decl |
| `enterArtifactShop` | battle.html | 48300 | function-decl |

## Test harness

| Symbol | File | Line | Kind |
|---|---|---|---|
| `__testHarness` | _not found_ | — | — |
| `__engine` | _not found_ | — | — |
| `__testReady` | _not found_ | — | — |
| `sleep` | battle.html | 11832 | const-decl |

---

**Resolved**: 51 / 58 known anchors

**Missing anchors** likely indicate one of:
- Symbol was renamed (search adjacent symbols in the section above for context)
- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)
- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)
