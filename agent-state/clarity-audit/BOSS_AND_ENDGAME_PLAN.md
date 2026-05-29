# Boss Mechanics Activation + Endgame Redesign — Plan

> 2026-05-29. Maintainer approved activating boss mechanics + wants a clean, simple,
> GameBoy-style endgame. This is the plan to decide/fix before implementing.
> All anchors verified against the working tree.

---

# PART 1 — Boss mechanics activation

## As-built: fully coded, structurally dead
`startBattle` (16832) + the locked turn-tick (20775) reach `window.StoryMode.{BOSS_CONFIGS,
bossMechanicsBattleInit, bossMechanicsTurnTick}` — but those exist **only** on the test-gated
`window.__storyTest` (37530+), never on the production `StoryMode` return (59564). So
`_cfg` is always undefined → mechanics never attach. All 19 bosses fight vanilla.

## The 4 mechanic types & their real status
| Type | Status |
|---|---|
| `fieldLock` weather | sets `state.weather` (works) but `_bossWeatherLocked` is **never read** → lock is cosmetic (Bug iii) |
| `fieldLock` terrain | **dead branch** — no BOSS_CONFIGS entry uses `kind:'terrain'` |
| `hpThresholdPhase` surge | banner fires, but `_bossSurgeTurns` has **zero damage consumer** → +25% does nothing (Bug ii) |
| `immunityRound` | clamp at 23879 is correct, but **off-by-one** zeroes `_bossImmuneTurns` before damage (Bug i); only `main.mfBattle` uses it |
| `telegraph`/`banner` | **fully works** (DOM flash + one-turn-ahead warning) |

## Activation checklist (engineering — no design call)
1. **Hookup**: add to production `StoryMode` return (59564): `get BOSS_CONFIGS()`,
   `bossMechanicsBattleInit:(s)=>_storyBossMechanicsBattleInit(s)`,
   `bossMechanicsTurnTick:(s,m)=>_storyBossMechanicsTurnTick(s,m)`. (`state` already there;
   `_activeBeatBattleKey` lifecycle at 46746/16835/47169 is correct.)
2. **Bug i (immunity off-by-one)**: move the decrement (42121-42122) ABOVE the
   pending-telegraph activation block so this turn's freshly-set `_bossImmuneTurns` survives
   to the damage clamp (23879).
3. **Bug ii (surge no-op)**: add at ~23671 (next to `_glassCannonPact`):
   `if (state._activeStoryBeatKey && attacker._bossSurgeTurns > 0) damage = Math.floor(damage * SURGE_MULT);`
4. **Bug iii (weather lock)**: per design decision D-Weather below — enforce or drop.
5. **Telegraph log line**: add a `logMsg` alongside each banner so immunity/surge is visible
   in the battle log (also makes it testable).
6. **Terrain dead branch**: leave inert or remove.
7. **Verify** under jsdom harness; migrate the boss tests to assert the production surface.

## Balance reality (drives the design questions)
- `_bossHpScaleForKind` (raid HP scaling, the "boss feels bulky" knob) is **never called** —
  villain/raid bosses currently have vanilla-trainer HP.
- Only the **Mystery Figure** (`main.mfBattle`) gets a league stat boost; it compounds:
  difficulty(≤1.30) + league(+0.35 hp) + optional Crucible-Hard(×1.30) + the new surge(+25%
  below **50%** HP) + a 1-in-5 immunity round → potential difficulty spike.
- Villain/extra raids (18 of 19) get surge at 25% HP but otherwise vanilla bulk.

## OPEN DESIGN DECISIONS (→ maintainer questions)
- **D-Bulk**: wire `_bossHpScaleForKind` for all bosses (real boss bulk) / mechanics-only
  (vanilla bulk) / final-boss-only.
- **D-Surge**: surge magnitude (+25% default / +40% / +15%).
- **D-Weather**: hard-lock boss weather (denies player weather counter-play) vs contestable.
- **D-Hunt** (endgame, below).
- Recommend regardless: telegraph log lines (clarity), fix all 3 bugs, keep one-turn-ahead warnings.

---

# PART 2 — Endgame redesign (clean / simple / GameBoy-style)

## As-built post-HoF flow
HoF → Continue → **Mystery Figure** battle (apex; themed "the Caged God / THE FIRST") → win →
Master Ball + `bossArc.available=true` + a one-time tip → dropped in last city → **Crucible**
(everything-hub) reachable from any city.

## The two confusions (root causes)
1. **The Crucible is a flat ~18-button menu** with no hierarchy/objective — battle (Frontier,
   Mystery replay, Rival/League/Gym rematch, Wild Encounter) + 13 facilities, all equal weight.
   Same over-choice problem fixed for city hubs, never applied here.
2. **The Caged God hunt is undiscoverable.** It's a real, implemented post-game legendary hunt:
   collect 3 leads (ledger/recording/key) from the **Pokémon Centers in Cities 2/5/8**, then
   "Enter the Cage" to fight **Subject Zero** and catch it with the Master Ball. But the only
   pointer is a one-time tip; then it lives in a sub-section of three *old* cities' Centers.
   No persistent objective → players (incl. the maintainer) never find it.
3. **Naming collision**: "Mystery Figure" (apex battle) vs "Caged God" vs "Subject Zero /
   Specimen 0001" for two different bosses, with the Mystery battle itself themed "Caged God."

## Recommended redesign (mirrors the city-hub clarity pattern the maintainer approved)
1. **Restructure the Crucible** into clear sections + one objective line:
   `▸ Challenge` (Battle Frontier ladder, League Run, Gym Rematch, Rival/Mystery rematch) ·
   `▸ Catch` (Wild, Safari) · `▸ Train` (tutors/EV/Colress/Stone Sage) ·
   `▸ Shop` (Mart/Dept/Relics/Game Corner) · `▸ Recover` (Center/PC).
2. **Persistent Caged-God tracker** as the post-HoF objective in the city hub AND the Crucible:
   `🔮 The Caged God — 1/3 leads · next: Pokémon Center, City 5` (until cleared), then the
   objective becomes free-roam: `▸ Endgame — train, catch, or climb the Battle Frontier`.
3. **Resolve naming**: keep "Mystery Figure" for the apex reveal; consistently call the bossArc
   "The Caged God" (drop "Subject Zero / Specimen 0001" from player-facing copy, or use it once
   as the captured species name only). Make the post-HoF orientation a clear two-step:
   *beat the Mystery Figure → then hunt the Caged God*.
4. Keep the **Battle Frontier** as the infinite-scaling challenge (surface best streak).

These are the clarity pattern already shipped for cities; safe to apply directly.

## OPEN DESIGN DECISION (→ maintainer question)
- **D-Hunt**: keep the 3-city lead hunt but make it guided (persistent tracker + which city
  next) — most content, GameBoy-postgame feel — vs simplify (collect leads from the Crucible,
  no backtracking) vs auto-point the objective at the first lead city right after the Mystery
  Figure.
