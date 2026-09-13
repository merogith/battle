# Spec Drift Report

> Generated: 2026-09-12T21:08:40.603Z
> Source: `node scripts/debug/spec-drift.mjs`

Resolves every `battle.html:LINE` reference in the design docs against
the current symbol index. A reference is "drifted" if the claimed line
no longer matches a symbol mentioned near the reference.

## STORY_MODE_FLOW.md

| Doc line | Claimed `battle.html:LINE` | Symbols hinted | Current location |
|---|---|---|---|
| 34 | 39874 ⚠️ | `migrateStoryPreV27` | migrateStoryPreV27@battle.html:45174 |
| 38 | 38265 ⚠️ | `FOE_POWER_CURVE` | FOE_POWER_CURVE@battle.html:42072 |
| 41 | 57505 ⚠️ | `STORY_WILD_GRADE_BY_CITY`, `_wildGradeWeightsForCity` | STORY_WILD_GRADE_BY_CITY@battle.html:63901<br>_wildGradeWeightsForCity@battle.html:63911 |
| 44 | 56506 ⚠️ | `_SAFARI_GRADE_CURVE_BY_BADGES` | _SAFARI_GRADE_CURVE_BY_BADGES@battle.html:62908 |
| 98 | 21273 ⚠️ | `STORY_EVENTS_RAW` | STORY_EVENTS_RAW@battle.html:36659 |
| 103 | 24593 | _(none)_ | _no known symbol_ |
| 167 | 28560 ⚠️ | `catchRate`, `getMonGrade` | getMonGrade@battle.html:18060 |
| 229 | 8999 | _(none)_ | _no known symbol_ |
| 263 | 24739 | _(none)_ | _no known symbol_ |
| 322 | 5407 | _(none)_ | _no known symbol_ |
| 348 | 22191 | _(none)_ | _no known symbol_ |
| 706 | 34883 ⚠️ | `makeWildBuild` | makeWildBuild@battle.html:64183 |
| 747 | 26648 | _(none)_ | _no known symbol_ |

## docs/PROGRESSION_CURVE_MASTER.md

| Doc line | Claimed `battle.html:LINE` | Symbols hinted | Current location |
|---|---|---|---|
| 72 | 14096 | _(none)_ | _no known symbol_ |
| 89 | 29001 ⚠️ | `STORY_EVENTS_RAW` | STORY_EVENTS_RAW@battle.html:36659 |
| 102 | 29008 ⚠️ | `STORY_EVENTS_RAW` | STORY_EVENTS_RAW@battle.html:36659 |
| 193 | 33298 ⚠️ | `STORY_BUILD_TIER` | STORY_BUILD_TIER@battle.html:47245 |
| 206 | 33482 ⚠️ | `_storyBuildTierForEvent` | _storyBuildTierForEvent@battle.html:47493 |
| 282 | 29085 ⚠️ | `FACILITY_DEBUT_CITY` | FACILITY_DEBUT_CITY@battle.html:36739 |
| 303 | 36581 | _(none)_ | _no known symbol_ |

## docs/EVOLUTION_FLOW_REBUILD.md

| Doc line | Claimed `battle.html:LINE` | Symbols hinted | Current location |
|---|---|---|---|
| 35 | 27975 ⚠️ | `STORY_EVENTS_RAW` | STORY_EVENTS_RAW@battle.html:36659 |
| 90 | 37361 ⚠️ | `VOUCHER_KEYS` | VOUCHER_KEYS@battle.html:57677 |
| 99 | 41364 | _(none)_ | _no known symbol_ |
| 109 | 28882 ⚠️ | `POKEMART_ITEMS` | POKEMART_ITEMS@battle.html:11819 |
| 148 | 7864 | _(none)_ | _no known symbol_ |
| 163 | 41063 | _(none)_ | _no known symbol_ |
| 165 | 36193 ⚠️ | `renderCityActions` | renderCityActions@battle.html:53743 |
| 184 | 42603 ⚠️ | `enterEvolutionLab`, `renderEvoLabTeam` | enterEvolutionLab@battle.html:67285<br>renderEvoLabTeam@battle.html:67492 |
| 246 | 42516 | _(none)_ | _no known symbol_ |
| 261 | 42941 ⚠️ | `evoLabEvolveWithCandy` | evoLabEvolveWithCandy@battle.html:67836 |
| 273 | 34791 ⚠️ | `STORY_TUTORIAL_SCENES` | STORY_TUTORIAL_SCENES@battle.html:50813 |
| 296 | 35846 | _(none)_ | _no known symbol_ |
| 308 | 34987 | _(none)_ | _no known symbol_ |
| 371 | 36165 | _(none)_ | _no known symbol_ |
| 391 | 36166 ⚠️ | `renderCityActions` | renderCityActions@battle.html:53743 |
| 504 | 36202 ⚠️ | `_withNew` | _withNew@battle.html:54168 |
| 657 | 35590 | _(none)_ | _no known symbol_ |

---

**Summary**: 21/37 `battle.html:LINE` references appear to have drifted.

Drift is expected as code grows; what matters is whether the *symbol* the doc references still exists.
Cluster the drifted refs into ONE finding ("Doc line anchors stale") with a representative sample.