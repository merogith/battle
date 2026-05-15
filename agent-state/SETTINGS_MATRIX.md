# SETTINGS_MATRIX

Every toggle the game exposes (or that the audit framework expects), its enforcement point, and the positive/negative-test stubs needed.
Status legend: VERIFIED · UNVERIFIED · MISSING · BROKEN.

## Format / clauses

| Toggle | Default | Claims | Enforced at | Positive test | Negative test | Status | Notes |
|---|---|---|---|---|---|---|---|
| Sleep Clause | n/a | "Only one opposing mon may be put to sleep at a time" | **NOWHERE** | — | — | **MISSING** | Grep of `sleep.{0,3}clause` in battle.html returns zero hits. VGC violation. Finding-005. |
| Species Clause | always on | "No duplicate species per side" | `battle.html:9878` (`uniqEligible = [...new Set(eligible)]` dedups by name string) | Build a draft pool with `Charizard` twice in source; verify only one survives | Try `Charizard` + `Charizard-Mega` — should they both be allowed? Showdown: yes (different formes). Unclear behavior. | UNVERIFIED | Finding-006: forme handling not specified |
| Item Clause | always on (no toggle) | "No duplicate held items per side" | `enforceItemClause(pool)` @ `battle.html:9731`, applied to draft pools @ 9888–9889 and foe entries @ 21556 | Two pool entries with `Choice Band` → second is rerolled | Toggle off path: **no toggle exists**, so always on | UNVERIFIED (impl exists; test missing) | Finding-007: no user-facing on/off |
| Classic Mode (mega/Z/dyna/tera one-time-per-team) | ON | "Only one mega/Z/dyna/tera per team across the match" | `battle.html:12581–12584`, `:14267–14269`, `:15005–15018` | Enable; one mega used, second team member can't | Disable; second mega allowed | UNVERIFIED | classicMode is well-traced |

## Mechanic toggles

| Mega Evolution (`mechanics.mega`) | OFF | Enables mega items in draft | gimmick assignment @ 6806–6846 | Enable; team member has mega item → mega button appears | Disable; mega item present → no mega button | UNVERIFIED | settings.mechanics.mega |
| Z-Move (`mechanics.zmove`) | OFF | Enables Z crystals | same | same | same | UNVERIFIED | |
| Dynamax (`mechanics.dynamax`) | OFF | Enables Dynamax | same | same | same | UNVERIFIED | |
| Terastallization (`mechanics.tera`) | OFF | Enables Tera | same | same | same | UNVERIFIED | |

## Generation toggle (spec: species-only filter)

| `enabledGens[]` | [1..9] | Restricts available species | `getDraftPool` @ 5860, `pickStoryLegendaryFromGens` @ 22247 | gen 1 only → no Charmander-Mega-X | gen 1 only → modern type chart still active, modern moves on Charizard, modern Eviolite rule | UNVERIFIED | Phase 4 audit will sweep all consumers. **Suspect zero negative-test coverage.** |

## Story-mode toggles

| `storyDifficulty` | 'normal' | foe-stat scaling 0.70–1.30; hardcore→no heal | `applyFoeDifficultyScaling` @ 8910, hardcore branch @ 10901–10903 | Set hardcore → HP persists across battles | Set easy → HP fully restored | UNVERIFIED | |
| `catchMode` | OFF | Mart sells balls; wild encounters allow capture | per spec; partial in code | sets `inventory.pokeball/greatBall/...` | balls absent if off | UNVERIFIED — partial impl (Finding-008) | |
| `noItemRun` | OFF | Bag excludes battle items in battles | `isNoItemRunBattleBagExcluded` @ 22317 | Enable → bag empty in battle | Disable → bag populated | UNVERIFIED | |
| `classicMode` (story) | TRUE | Same one-time-gimmick rule applied in story | shared with format | shared | shared | UNVERIFIED | |
| Story `enabledGens[]` mirror | [1..9] | Mirrors draft-gen but for Story Mode | `storySettingsGens()` referenced @ 22249 | Set [1] in story; opponent teams gen-1 only | Set [1]; descriptions/calc still modern | UNVERIFIED | |

## Visual / audio toggles (cosmetic)

| `animations` | true | UI animations on | 7937 | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `weatherAnimation` | true | Weather VFX on | 7942 | | | UNVERIFIED |
| `terrainBackground` | true | Terrain bg on | 7949 | | | UNVERIFIED |
| `musicEnabled` | true | BGM on | settings modal | | | UNVERIFIED |
| `soundEnabled` | true | SFX on | settings modal | | | UNVERIFIED |
| `displayMode` | 'auto' | dark/light/auto | 4322–4390 | | | UNVERIFIED |
| `battleLogDock` | bool | dock the battle log | settings modal | | | UNVERIFIED |
| `randomWeather` | false | random weather at battle start | `rollRandomWeather` @ 10918 | | | UNVERIFIED |

## Pool / generation knobs

| `partySize` | 3 | 3/4/5/6 mons per team | pool sizing @ 9870+ | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `draftGrades[]` | [1,2,3,4] | Which grades go into pool | `getDraftPool` second arg | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `smartDraftPool` | true | Role-balance the pool | `enforceRoleCoverage` / `enforceTypeBalance` @ 9885–9887 | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `gauntletProgressiveDifficulty` | true | Foe scaling ramps in gauntlet | gauntlet code TBD | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `aiProfile` | 'balanced' | aggro/balanced/stall | `_pf` @ 13391 | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `storyBattleItems` | bool | bag UI in story battles | 4322–4390 | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| `pvpBattleItems` | bool | bag UI in PvP | 4322–4390 | UNVERIFIED | UNVERIFIED | UNVERIFIED |

## Eviolite Late-Evo (rule, not a toggle)

| Eviolite Late-Evo | always on | NFE-in-any-gen may hold Eviolite | Item-effect block `battle.html:8653–8689` + `:16161–16172` | Chansey in gen-1 pool → Eviolite gives +50% Def/SpD | Tauros (no evo any gen) holding Eviolite → no bonus | UNVERIFIED — **Phase 5 audit pending** | Implementation reads `build._fullEvolvedPath === false` (a build-metadata flag), not a live species-graph lookup. Risk: if `_fullEvolvedPath` is set wrong at build time the rule fails silently. See Finding-009. |

## Missing entirely

- **Sleep Clause** (Finding-005) — VGC mandatory.
- **Evasion Clause** (no clause limiting Double Team / Minimize) — should grep next session.
- **OHKO Clause** (Fissure / Sheer Cold / Horn Drill / Guillotine ban) — should grep next session.
- **Endless Battle Clause** (Recycle + Leppa loops) — should grep.
- **Moody Clause** (Showdown VGC) — should grep.
- **Hidden Ability toggle** — no such toggle in code. HA's are presumably always available or always not; verify which.
