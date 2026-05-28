# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-28T12:24:14.511Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 34470 | function-decl |
| `save` | battle.html | 34409 | function-decl |
| `SAVE_KEY` | battle.html | 33439 | const-decl |
| `SAVE_VER` | battle.html | 33444 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29252 | const-decl |
| `enterBattleEvent` | battle.html | 44505 | function-decl |
| `proceedToNextBattle` | battle.html | 44008 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 34113 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 31932 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 34373 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 36209 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 36642 | function-decl |
| `makeBuild` | battle.html | 10373 | function-decl |
| `makeWildBuild` | battle.html | 46817 | function-decl |
| `makeDesignedBuild` | battle.html | 10342 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 35642 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 35826 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 35898 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 36024 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 35884 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11507 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 35126 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 35253 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11487 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 43174 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 32071 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 34235 | function-decl |
| `getRivalEncounterPhase` | battle.html | 32508 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 36835 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 40842 | function-decl |
| `renderCityActions` | battle.html | 40965 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 32052 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 43116 | function-decl |
| `_bossArcRollLegendary` | battle.html | 46229 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25499 | function-decl |
| `buildPokemon` | battle.html | 14142 | function-decl |
| `ensureMoveData` | battle.html | 9560 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 38899 | const-decl |
| `_showStoryTutorialScene` | battle.html | 39132 | function-decl |
| `playStoryTutorial` | battle.html | 39193 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 32747 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 32761 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 33081 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 33095 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 32904 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 41795 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 42808 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 45003 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 47828 | function-decl |
| `enterArtifactShop` | battle.html | 48079 | function-decl |

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
