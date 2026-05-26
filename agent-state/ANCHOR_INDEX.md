# Anchor Index — battle.html and siblings

> **Generated**: 2026-05-26T12:42:40.448Z
> **Source**: `node scripts/debug/anchor-map.mjs`
> **Companion**: `agent-state/CODEBASE_MAP.md` (human-authored prose, anchor table stale — use this file instead).

Line numbers below are accurate as of generation. They drift on every
insertion; agents should resolve via the `find-anchor` skill rather than
trusting these numbers verbatim.

## Run state

| Symbol | File | Line | Kind |
|---|---|---|---|
| `newStoryRun` | _not found_ | — | — |
| `load` | battle.html | 32473 | function-decl |
| `save` | battle.html | 32412 | function-decl |
| `SAVE_KEY` | battle.html | 31467 | const-decl |
| `SAVE_VER` | battle.html | 31472 | const-decl |

## Timeline

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_EVENTS_RAW` | battle.html | 29210 | const-decl |
| `enterBattleEvent` | battle.html | 42318 | function-decl |
| `proceedToNextBattle` | battle.html | 41825 | function-decl |

## Migrations

| Symbol | File | Line | Kind |
|---|---|---|---|
| `migrateStoryPreV15` | battle.html | 32123 | function-decl |

## Difficulty / coin

| Symbol | File | Line | Kind |
|---|---|---|---|
| `GYM_CITY_LEADER_EVENT` | battle.html | 29960 | const-decl |

## RNG

| Symbol | File | Line | Kind |
|---|---|---|---|
| `storyRngNext` | battle.html | 32376 | function-decl |
| `storyRngState` | _not found_ | — | — |

## Trainer rolling

| Symbol | File | Line | Kind |
|---|---|---|---|
| `rollTrainerTeam` | battle.html | 34183 | function-decl |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34591 | function-decl |
| `makeBuild` | battle.html | 10331 | function-decl |
| `makeWildBuild` | battle.html | 44619 | function-decl |
| `makeDesignedBuild` | battle.html | 10300 | function-decl |

## Story build tier

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_BUILD_TIER` | battle.html | 33616 | const-decl |
| `_storyBuildTierForEvent` | battle.html | 33800 | function-decl |
| `_storyDowngradeBuildForTier` | battle.html | 33872 | function-decl |
| `_applyStoryBuildPowerTier` | battle.html | 33998 | function-decl |
| `_storyBuildTierForProfessor` | battle.html | 33858 | function-decl |

## Mechanics unlock gate

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_withStoryPlayerGimmickGate` | battle.html | 11465 | function-decl |
| `_pbsStoryUsePlayerGimmickGate` | _not found_ | — | — |
| `_storyEnemyMechKeys` | battle.html | 33100 | function-decl |
| `_minGuaranteedMechsForEvent` | battle.html | 33227 | function-decl |
| `_mechForGimmickRoll` | battle.html | 11445 | function-decl |

## Mystery Figure / Professor

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterProfessor` | battle.html | 40991 | function-decl |
| `isPreLeagueLegendaryMysteryGate` | battle.html | 30099 | function-decl |

## Rival

| Symbol | File | Line | Kind |
|---|---|---|---|
| `setRivalStanding` | battle.html | 32238 | function-decl |
| `getRivalEncounterPhase` | battle.html | 30536 | function-decl |
| `pickStoryRivalSpriteFile` | battle.html | 34784 | function-decl |

## City hub

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterCity` | battle.html | 38683 | function-decl |
| `renderCityActions` | battle.html | 38805 | function-decl |
| `getCurrentCityDisplayName` | _not found_ | — | — |
| `shouldForceCityProfessor` | battle.html | 30080 | function-decl |

## Catch / PC / Safari / Boss

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_pickStarterPartner` | battle.html | 40933 | function-decl |
| `_bossArcRollLegendary` | battle.html | 44031 | function-decl |

## Damage formula

| Symbol | File | Line | Kind |
|---|---|---|---|
| `parseMoveEffects` | battle.html | 25457 | function-decl |
| `buildPokemon` | battle.html | 14100 | function-decl |
| `ensureMoveData` | battle.html | 9518 | function-decl |

## Tutorial scenes

| Symbol | File | Line | Kind |
|---|---|---|---|
| `STORY_TUTORIAL_SCENES` | battle.html | 36842 | const-decl |
| `_showStoryTutorialScene` | battle.html | 37075 | function-decl |
| `playStoryTutorial` | battle.html | 37136 | function-decl |

## Dialogue pools

| Symbol | File | Line | Kind |
|---|---|---|---|
| `TRAINER_QUOTES` | battle.html | 30775 | const-decl |
| `TRAINER_QUOTES_BY_NAME` | battle.html | 30789 | const-decl |
| `CITY_PROFESSOR_QUOTES` | battle.html | 31109 | const-decl |
| `CITY_GUIDE_QUOTES` | battle.html | 31123 | const-decl |
| `getTrainerQuoteForBattle` | battle.html | 30932 | function-decl |

## Retreat / game-over

| Symbol | File | Line | Kind |
|---|---|---|---|
| `_storyCalcRetreatGoldFee` | battle.html | 39626 | function-decl |
| `refreshStoryGameOverRetreatUI` | battle.html | 40634 | function-decl |
| `acceptRivalLossAndContinue` | battle.html | 42814 | function-decl |

## Tutor / EV trainer / Link / Colress

| Symbol | File | Line | Kind |
|---|---|---|---|
| `enterShop` | battle.html | 45618 | function-decl |
| `enterArtifactShop` | battle.html | 45858 | function-decl |

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
