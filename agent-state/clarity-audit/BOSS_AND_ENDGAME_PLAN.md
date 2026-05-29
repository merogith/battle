# Boss Mechanics Activation + Endgame Redesign — Plan

## BUILD PROGRESS (7 increments)
- [x] **1 — Foundation** (committed): exposed BOSS_CONFIGS/init/tick/banner on production
  API; fixed immunity off-by-one (decrement-before-activate); wired the +25% surge damage
  consumer. Boss mechanics now attach & fire for the first time. Tests green.
- [x] **2 — Effect pool** (committed): `_applyBossPhaseEffect` dispatcher (surge/heal/immunity),
  phases carry {effect,magnitude}, default 'surge' = backward compatible.
- [x] **3 — faintPhase** (committed): new trigger; escalates on cumulative `state.foeParty`
  KOs (every 2). Tests added (faintPhase + heal). 11/11 boss tests pass.
- [x] **5a — Villain configs** (committed): 10 full bosses → escalating faintPhase chains;
  10 mini-boss configs added; Magma/Aqua weather preserved.
- [ ] **4 — Solo-Pokémon raid path** (NEXT, biggest/riskiest): when beat kind ∈ {raid,miniRaid},
  substitute a SINGLE mapped species (extra.cubone→Marowak … extra.mewtwo→Mewtwo) instead of
  `rollTrainerTeam`; boost stats to legendary-tier; scale HP via corrected `_bossHpScaleForKind`
  (miniRaid×(maxParty−2), raid×(maxParty−1)) called with `_storyMaxPartySize()`. Intercept at
  the foe-build in `enterBattleEvent` (~46820+, the `rollTrainerTeam` call ~46900). Needs a
  REAL-battle verification, not just unit ticks. Species map lives in prose at STORY_SCENES 31722+.
- [ ] **5b — Extra configs**: after 4, give extra raids multi-phase HP thresholds (raid 75/50/25,
  miniRaid 50/25) with escalating effects; add `extra.*.miniRaid` configs.
- [ ] **6 — mfBattle + canon villains**: wire mfBattle mechanics via the `isMysteryFinal`
  dispatch (46789) since `mysteryBoss` is excluded from BOSS_CONFIGS injection; add
  BEAT_CANON_TRAINER entries Flare→Lysandre, MacroCosmos→Rose, Star→Penny (need TRAINER_DATA).
- [ ] **7 — Endgame**: Crucible sectioned layout + objective line; persistent guided Caged-God
  tracker (🔮 N/3 · next city); separate Mystery-Figure vs Caged-God naming.

---


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

## MAINTAINER DECISIONS (received 2026-05-29) → REFINED PHASE DESIGN

The maintainer replaced the simple A/B/C calls with a **phase-based framework**. Taxonomy:

- **Main story** battles → regular trainer fights, NO boss mechanics.
- **Villain story** → trainer-vs-trainer fights with **faint-count phases**. Each faction has
  `villain.<f>.miniBoss` (mini) + `villain.<f>.boss` (full). Mini starts plain, triggers a
  mechanic after X faints; full starts with one mechanic active, triggers a new one after X
  faints. Escalating difficulty, **only one mechanic active at a time**.
- **Extra story** → single legendary-tier **Pokémon bosses** with **HP-threshold phases**.
  Each mon has `extra.<m>.miniRaid` (mini) + `extra.<m>.raid` (real). Real = phases at
  **75% / 50% / 25%**; mini = **50% / 25%**. One mechanic per phase, escalating, one active.
- **Weather lock**: CONTESTABLE (player can override boss weather).
- **Caged God**: keep the 3-city lead hunt, fully GUIDED (persistent tracker + prompt).

### HP scaling for extra Pokémon bosses (correct the formula + actually call it)
- Maintainer spec: **miniRaid HP × (maxParty − 2)**, **raid HP × (maxParty − 1)**, using the
  player's MAX party size (`_storyMaxPartySize()` = clamp(2+badges,2,6)), clamped ≥1.
- Current code (`_bossHpScaleForKind`, 42047) is miniRaid=(p−1)/raid=(p) AND is **never called**
  → fix the formula + wire it into the extra-raid battle setup. Villain trainer bosses are full
  teams → no single-target HP scaling.

### Phase engine (generalize the existing tick, 42106)
- Today each `hpThresholdPhase` fires the SAME `_bossSurgeTurns=3` (+25%). Generalize so each
  phase carries WHICH effect to activate (escalating). Multi-threshold already dedupes via
  `_bossMechanicsFired`.
- Add a new trigger type **`faintPhase`** for villain trainers: fires when the foe's cumulative
  faint count crosses X (need a foe-faint counter on stateRef). Full boss = phase 0 at battle
  start + a phase every X faints; mini = first phase after X faints.

### Two mechanic POOLS (maintainer's "simple must-have" + "best-fitting")
**Pool A — simple/must-have (ship FIRST to test flow, telegraphed, one-active):**
1. Offensive stat surge (+1 stage Atk or SpA) — gentlest, phase 1.
2. Speed surge (+Spe, boss outspeeds).
3. Heal (boss restores ~25% maxHP at the phase transition) — dramatic.
4. Damage surge (+25% outgoing for N turns) — the existing `_bossSurgeTurns`.
5. Immunity round (no damage for 1 turn, telegraphed) — scariest, final phase.
6. Weather/terrain set (contestable) — thematic openers (Magma=Sun, Aqua=Rain).

Proposed simplest escalation (all bosses, for flow test): P1 stat surge → P2 damage surge →
P3 immunity round (+ Magma/Aqua open with their weather). Magnitudes per maintainer:
extra real boss phases 75/50/25, mini 50/25; villain faint-phases TBD by team size.

**Pool B — best-fitting/thematic (LATER, per-boss):** the banners already hint these —
Galactic "DISTORTION" (Trick Room), Plasma "PRIORITY LOCK", Flare "THE WEAPON", etc.

### Roster (enumerated — confirmed against code)
**Villain (10× `villain.<f>.boss`, all Road 7, 6-mon trainer teams via canon roll):**
Rocket=Giovanni · Magma=Maxie · Aqua=Archie · Galactic=Cyrus · Plasma=Ghetsis · Skull=Guzma ·
Yell=Piers — **7 have canon trainers**. **Flare / MacroCosmos / Star have NO canon trainer**
(BEAT_CANON_TRAINER omits Lysandre/Rose/Penny) → they roll a random Elite Trainer. Each faction
also has a `villain.<f>.miniBoss` (no config today). **Working as intended** (trainer fights).

**Extra (8× `extra.<m>.raid`, Road 6) — ⚠ BIGGEST GAP vs intended design:**
cubone→Marowak · yamask→Yamask · hypno→Hypno · phantump→Trevenant · mimikyu→Mimikyu ·
drifloon→Drifblim · parasect→Parasect · mewtwo→Mewtwo. **These species exist ONLY in prose.**
The actual battle is an ordinary 6-mon `rollTrainerTeam` — NOT a single Pokémon, NOT stat-boosted,
NO HP scaling (`_bossHpScaleForKind` is dead). `kind:'raid'`/`'miniRaid'` is set in beat data but
unused. Delivering the maintainer's vision (solo legendary-tier mon, HP×(maxParty−1)/−2) requires
a NEW single-mon foe-substitution path that does not exist. Each mon also has `miniRaid`+`miniRaid2`
lead-ins (Road 4/5).

**`main.mfBattle` (post-HoF apex):** a **6-mon trainer** — a mirror of the player's HoF party +
buffed starter (`rollMysteryFigureFinalBossTeam`). Its declared mechanics (HP@0.50 + immunity)
are **ORPHANED**: `kind:'mysteryBoss'` is excluded from `_activeBattleBeatForCurrentRow` (41839),
so `_activeBeatBattleKey` never becomes `main.mfBattle` → BOSS_CONFIGS never attaches. To give it
mechanics, wire them through the `isMysteryFinal` dispatch (46789), not the BOSS_CONFIGS lookup.

**Confirmed distinct:** Mystery Figure ("The First", a trainer) ≠ Caged God / Subject Zero
(a single legendary wild in the post-game bossArc). Two different entities → endgame naming fix
should separate them, not merge.

### Party cap at the boss roads: maxParty = 6 at BOTH Road 6 (extra) and Road 7 (villain).
→ if wired: raid HP ×5, miniRaid ×4. Player also fields 6.

### OPEN PARAMS to confirm after roster lands
- Faint cadence X for villain bosses (every 1 vs every 2 faints) — depends on team sizes.
- Ship Pool A simplest-escalation first (maintainer said "simplest to test flow"), assign
  Pool B per-boss later — confirm.
- Recommend regardless: fix all 3 bugs, telegraph log lines, keep one-turn-ahead warnings.

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
