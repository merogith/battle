# BUILD DIVERSITY MASTER — adaptive, diverse, viable builds for wild & enemy Pokémon

> Design canon for the wild + enemy build-generation overhaul. Status: **Phase 1 + the
> correctness/quality pass are IMPLEMENTED on `claude/wild-pokemon-build-diversity-vj631h`;
> Phases 2 & 4 are scoped follow-ups (§6).** All balance numbers here are maintainer-owned
> (see CLAUDE.md → Approval rules) — the values that shipped are sensible defaults, called
> out as tunable knobs (§7), for the maintainer to retune. See §3 for the audit evidence.

## 1. Vision (maintainer-locked decisions, 2026-07)

Captured directly from the design conversation:

| Axis | Decision |
|---|---|
| **Enemy team diversity** | **Both** role diversity across the team AND a viable move mix per mon (STAB + coverage + utility) — never "4 STAB". |
| **"Adaptive" means** | **Between internally-synergistic and just-varied**: teams read as coherent units (roles that support each other) AND feel fresh (no repeats). **Not** reading/countering the player's actual team. |
| **Stage curve** | **Diverse early, power scales.** Even City-1 enemies get coverage/utility/roles; what scales with progression is raw *power* (EVs / IVs / items / stats), not moveset richness. |
| **Early-game feel** | **Cleverer, not harder.** Early foes gain coverage/setup/utility but stay beatable via low EVs + a BP cap on move *power*. More tactical, not more punishing. |
| **Enemy build source** | **Generator-primary, learnset-palette, CSV-weighted, stage-parameterized** (see §4). Smogon CSV sets are fixed-power artifacts and are *not* stage-adaptive; the generator constructs to the stage. |
| **Wild philosophy** | **Stage-competitive EVs** (a fresh catch is usable *now*), but **randomised / sub-optimal nature + ability + basic-legal moves** as the player's headroom. Plus a new **EV-redistribution trainer** (early: reshuffle your existing EV total; late: 0→max). |

Guiding principle: the player earns power through **training** (EVs via battle/EV-trainer, better moves via tutors, better nature… well, nature is the raw-catch lottery). Enemies express difficulty through **power that scales**, while staying **interesting at every stage**.

## 2. Current-state architecture (as of this branch)

Three subsystems govern a build. Anchors are approximate (drift-tolerant — resolve symbols, don't trust line numbers).

### 2.1 The move gate is the real homogeniser — not the tier downgrade
For **story foes, `_storyDowngradeMovesForTier` is never called** (`_applyStoryBuildPowerTier` passes `skipMoveStrip:true` whenever `_foeCity >= 0`). The true authority is **`_storyGateFoeMovesByCity` → `_storyApplyMoveStageToBuild`** (~57546 / ~57495), driven by the tutor-stage clock `NPC_STAGE_CITY.tutor = [0,3,6]` and the per-city BP cap `STORY_FOE_MOVE_BP_CAP_BY_CITY = [40,60,60,80,80,0]`:

| City | Foe moves allowed | Effect |
|---|---|---|
| C0 | natural-only, ≤40 BP | basic attacks |
| C1–C2 | natural-only, ≤60 BP | basic attacks |
| C3–C4 | natural + *status* utility, ≤80 BP | first utility appears |
| C5 | natural-only, **no BP cap** | — |
| **C6+** | **ungated — full Smogon set** | full complexity |

**This is the inversion we must fix:** today move *complexity* is **locked early, unlocked late** — the opposite of "diverse early, power scales." The `allowed` pool is `learn.natural` (level-up/egg/transfer); *damaging* TM/tutor moves ("learnt") are withheld until Guru (C6). That is why a Grass/Poison mon shows no Poison coverage until C6 — its Poison move is a TM (learnt), category-gated out early. Backfill refills from natural moves, STAB-ranked, so dual-types collapse to primary-type STAB.

**Shared-authority hazard:** `_storyApplyMoveStageToBuild` is used by **foes AND player wild/caught/gift** builds (explicit warning comment at ~57505). Any foe-only change must be threaded through a flag; the wild path must keep today's catch-and-train gate.

### 2.2 The data corpus is rich and under-used
- **`data/builds.csv`** — 17,397 curated competitive sets; **92% of species have ≥2 sets**, and the multiple sets are already **role-diverse** (e.g. Garchomp ships an SD-sweeper, a Scarf revenge-killer, and a defensive hazard-setter as *separate* rows). ~95 species have only 1 set.
- **Archetype generator** — `makeDesignedBuild` (~12479) + `data/build-archetypes.json` (8 roles: all_out_attacker, coverage_attacker, setup_sweeper, bulky_attacker, status_attacker, stall_wall, hazard_setter, defensive_pivot) + `data/move-synergies.json` (Rest+Sleep Talk, Protect+Toxic co-occur). Picks a role → distributes slots (stab/cov/status/setup/rec/hazard) → synergy-scored fill. **Only invoked ~30% of the time** (`settings.csvBuildMix = 0.7`), and its output is **fenced to the CSV move-union** (`_designedCsvMovePool`), not the true learnset.
- **True learnsets exist offline** — `data/move-tags.json` per-species `n` (natural) / `l` (learnt) index buckets, + `@pkmn/dex` at runtime. Powers the Move Tutor and the move-ceiling clamp; **not wired into the generator.**
- **`data/moves.json`** — full per-move data (power/type/category/priority/boosts/sideCondition/selfSwitch/status) — enough to programmatically pick coverage + utility.

### 2.3 Teams have almost no composition logic
Every slot is an independent grade-weighted roll. `enforceRoleCoverage` / `enforceTypeBalance` (~18590) are **off unless `settings.smartDraftPool`** and only fix extremes (0 walls + ≥3 attackers → reroll one). Only the **Rival** adapts to the player's team. There is no per-slot role assignment and no "avoid 6 sweepers."

### 2.4 Wild (already shipped on this branch)
Nature pools (archetype-appropriate, head-weighted), EV-shape jitter + splash, the `_evSpillToTarget` distributor fix (hits the target total exactly), and a wild-only secondary-STAB move bias. Wild EV totals already track the city band. See `tests/suites/story-wild-build-diversity.test.js`.

## 3. Current-state audit findings (instrumented sweep, resolved)

An instrumented sweep drove the real pipeline — **264 enemy mons/city** (boss + filler,
`rollTrainerTeam` → `storyGateFoeMovesByCity`) and **700 wild mons/city**
(`rollWildEncounter` → catch filter), every city C0→C7, per component. It surfaced the
diversity gap **and several concrete correctness bugs**. All the correctness/quality issues
below are **fixed on this branch**; each has a guard in `tests/suites/story-enemy-build-diversity.test.js`
or `story-wild-build-diversity.test.js`.

| # | Sev | Finding | Cause | Resolution |
|---|---|---|---|---|
| 3 | High | Enemy EV totals hit **512 (>508 legal cap)** at C4/C6 | `_distributeEVsToTotal`'s per-stat /4 rounding overshoots; the reconcile only fixed undershoot | `_evReconcileToTarget` now **trims overshoot** + fills undershoot → always legal ≤508 |
| 1 | High | Foes field **ZMOVE gimmicks + Z-crystals as early as C0** | (a) gimmick city-gate used `cityIndexFromEventIndex(rowId)` instead of `_cityIndexForStoryRow`; (b) CSV z-attack sets slip `forceGimmick` | Fixed the row-id resolution + a finalization guard that reverts any **pre-City-8 gimmick to STANDARD** and drops the stone |
| 2 | High | Wild items jump **nothing (C0-3) → elite (C4)** | hard cap step + no wild-tier filter | Ramp `C0 none · C1-3 berries · C4-6 staples · C7 best` + small seeded early-berry chance; elite items capped below C7 |
| 4 | Med | **Illegal alt-forme abilities** (Vulpix-Alola→Drought) ~1-2% | CSV ships base-forme ability; only *flagged* `_illegal`, then opt-restore re-applies it | Finalization guard: illegal ability → the forme's slot-0 legal ability |
| 5 | Med | **Role-fighting natures** incl. boss aces (Exeggutor Jolly) ~1-2% | nature not validated against orientation | `_natureFightsRole` (wall-aware) + swap to an archetype-appropriate nature |
| 6 | Med | Nature curve **discontinuities** (wild hard cliff C0-neutral→C1-positive) | binary city gate | Wild neutral-chance **ramps** C0 75% → C1 40% → C2 15% → C3+ 0. (Enemy `_storyNatureOptChance` C0-C1 neutrality is the **intended** soft tutorial — left as-is.) |
| 8 | Low | Shallow-movepool foes keep a **lone over-cap move** (Beldum) | degenerate fallback pushed only 1 move | Fill a full set of lowest-BP **legal** moves; battle-time BP clamp already caps effective power |
| 7 | Low | Wild movesets **one-dimensional** (34% only-STAB at C5) | catch-and-train gate (natural-only) + STAB-weighted ranker | **By design** — wild is deliberately less-optimal (player earns coverage/utility via tutors); the shipped secondary-STAB bias supplies type variety |
| — | — | Enemy C4/C6 EV mean above the city band | `diffStep` raises the EV band index for bosses | **Intended** difficulty shift (bosses out-total fillers), not a bug |

IVs were healthy across both (monotonic, tightly banded, enemy < wild per city as intended);
no per-stat >252; C7 endgame builds clean. The move BP gate holds for the vast majority.

The **headline diversity gap** (§2.1: enemy move complexity locked early, unlocked late) is
addressed by Phase 1 (the gate split) — enemies now carry coverage/setup/utility from City 1,
power still curbed by the BP cap + EV band.

## 4. The build-source decision (deep analysis)

**Why not pure CSV.** Smogon sets are artifacts of one fixed metagame — they assume max EVs, 31 IVs, best items, one power level. They are **subtractive only**: fitting a max-power Garchomp set into City 2 means *stripping* moves and *scaling down* EVs — exactly the destructive gate that flattened everything. A CSV set cannot be *asked* for "a City-2 bulky attacker, ≤60 BP moves, 120 EV budget."

**Why not naïve hybrid.** CSV-moves + generator-roles still inherits fixed-power CSV moves and the thin single-set problem (~95 species).

**Recommended — Generator-primary, learnset-palette, CSV-weighted, stage-parameterized:**
1. **Feed the generator the true learnset** (`data/move-tags.json`, already offline) instead of the CSV-union → works for *all* species, full legal palette.
2. **Parameterize by city** — pass the BP cap, EV budget, and role, so it *constructs* a stage-appropriate coherent set from first principles (this is the adaptivity).
3. **Weight move selection toward CSV-attested moves** — a move that appears in the species' curated sets scores higher, so the generator inherits Smogon's human vetting *as a bias* while staying free to pick legal, stage-fit moves.
4. **CSV demotes to** a synergy/quality reference, a fallback where learnsets are unavailable, and signature-ace flavor.

Net: builds are *constructed to the stage* (coherent + vetted + adaptive + universal) instead of one build forced through a shredder.

**Quality guardrails for generated sets** (mitigate the loss of human vetting): STAB present, no duplicate-type coverage, ≤1 setup slot early, utility density scales, synergy score floor, and a differential check against the CSV sets for a sample of species.

## 5. Architecture — four levers

1. **Stage-adaptive generator** (§4). The generator becomes the primary foe build source, learnset-fed and city-parameterized.
2. **Split the move gate.** `_storyApplyMoveStageToBuild` gains a `role`/`side` parameter. Foes get a **diversity-preserving, BP-capped** path: keep the per-city BP cap (power) but **allow move categories** (coverage/setup/status/hazard) so "diverse early" holds. Player wild/caught/gift keep today's natural-only catch-and-train gate.
3. **Team role composition.** Assign each of the 6 slots a distinct archetype (weighted so a team spans roles — e.g. a wall, a pivot, 2–3 attackers, a setup threat), then generate each mon to its assigned role + the city's stage params. This is the "both roles + moves" deliverable.
4. **Synergy + freshness.** Use the generator's `move-synergies.json` scoring for internal coherence, and the existing cross-encounter dedup + per-roll RNG variety for freshness. No player-team-reading.

## 6. Phase plan & status

- **Phase 1 — Enemy move diversity (the gate split). ✅ SHIPPED.** `foeMode` on `_storyApplyMoveStageToBuild` opens the full legal movepool for foes (coverage/setup/utility survive the category gate), power still curbed by the per-city BP cap + EV band. Player wild path byte-identical. Enemies stop being "4 STAB" from City 1.
- **Correctness & quality pass (audit #1-#6, #8). ✅ SHIPPED.** EV≤508 reconcile, legal forme abilities, role-coherent natures, pre-City-8 gimmick/item cleanup, wild item ramp, wild nature phase-in, shallow-movepool fallback. See §3 + the two guard suites.
- **Phase 3 — Wild philosophy. ✅ SHIPPED.** Wild EVs track the city band (stage-competitive); nature phases in over C0-C2; ability keeps a mild slot-0 bias with late hidden-ability chance; moves stay legal-basic (the earn-via-tutor headroom). The secondary-STAB bias supplies type variety.
- **Phase 2 (roles) — role-coherent foe teams. ✅ SHIPPED.** `enforceRoleSpread` caps any single archetype at ~half the team and re-rolls over-represented unlocked slots toward absent roles (wall / hazard lead / setup / the other attacking category). Teams span ~4.6 distinct roles/6, 0% monotone. smartDraftPool-gated, story-foe-only, locks respected.
- **Phase 4 — EV-redistribution trainer. ✅ SHIPPED.** Net-zero "reshuffle" re-points a mon's existing EV total into a role shape for 1000 G (reuses `_distributeEVsToTotal`); full "buy any spread" stays 5000 G. EV Trainer now debuts at **City 3 in reshuffle-only mode** (`_evTrainerIsFullMode` gates full mode to C7+/post-HoF/Frontier) — economy-safe because reshuffle never adds EVs.
- **Phase 2b — generator learnset augmentation (targeted). ✅ SHIPPED.** `_designedCsvMovePool` folds the legal learnset (natural + learnt, from `window.MOVE_TAG_INDEX`) into the pool **only for thin-CSV species** (union < 8) so single-set / LC mons get a buildable second role; well-covered species are untouched (Sunkern 5→65; Garchomp/Blissey unchanged). Best-effort (no-op until the async index loads).
- **Wild nature/ability (blend).** ✅ Nature: ~70% curated role-appropriate + ~30% fully random legal (raw-catch feel; Nature Rater is the fix path). Ability: random among the species' regular slots (0/1), hidden still late-gated.

This PR lands **all phases** (moves, correctness, wild diversity + philosophy, roles, EV trainer, generator).
Full verification record: `BUILD_DIVERSITY_TESTING_REVIEW.md`.

## 7. Balance-knobs registry (all maintainer-owned)

| Knob | Where | Shipped value | Notes |
|---|---|---|---|
| Foe BP cap by city | `STORY_FOE_MOVE_BP_CAP_BY_CITY` | `[40,60,60,80,80,0]` | the "power" lever; unchanged |
| Foe move gate (legal pool) | `_storyApplyMoveStageToBuild` `foeMode` | full legal pool + BP cap | coverage/setup/utility survive early |
| Team role spread | `enforceRoleSpread` (cap ⌈N/2⌉, ≥3 distinct) | on (smartDraftPool) | "both roles + moves" |
| Wild EV total by city | `STORY_EV_CITY_TOTAL` | `[[0,50]…[508,508]]` | stage-competitive; unchanged |
| Wild nature phase-in | `makeWildBuild` neutral-chance | C0 .75 · C1 .40 · C2 .15 · C3+ 0 | smooths the cliff |
| Wild item ramp | `makeWildBuild` `_wildItemCap` + berry chance | C0 none · C1-3 berries (25%) · C4-6 staples · C7 best | smooths the cliff |
| Wild ability | `makeWildBuild` ability roll | slot-0 bias; hidden C6+ @35% | mild-random-legal |
| EV reshuffle cost | `EV_REDISTRIBUTE_COST` | 1000 G | net-zero re-tune |
| EV full-optimize cost | `EVTRAINER_COST` | 5000 G | unchanged |
| EV Trainer debut / full-mode gate | `FACILITY_DEBUT_CITY.evtrainer` / `_evTrainerIsFullMode` | C3 reshuffle-only · C7+ full | economy-safe early access |
| Enemy EV distributor | `_evReconcileToTarget` | trims overshoot + fills undershoot | always legal ≤508 |

## 8. Testing strategy

- Extend `tests/suites/story-wild-build-diversity.test.js` and add an **enemy** counterpart (`story-enemy-build-diversity.test.js`): per-city assertions on move composition (coverage/utility present, "only-STAB" rate below a ceiling), role-appropriate natures, EV band adherence, item-tier gating, ability legality, and team role spread.
- A **stage-sweep harness** (the audit script, promoted) as a repeatable snapshot across C0→C7 for both wild and enemy.
- Re-run the full `suites` layer (1297+ tests) after each phase — the move gate + distributor are shared, so trainer/player/balance suites are the regression net.
- Deterministic replay: all new randomness routes through the seeded story RNG.

## 9. Risks & mitigations

- **Shared move gate touches the player.** → thread a foe-only flag; leave the wild/gift path byte-identical. Guard with the existing wild move-cap tests.
- **"Diverse early" raises early difficulty.** → keep the BP cap + low EV band; cap utility density early; "cleverer not harder" is a *tactics* increase, not a *damage* increase. Validate with a difficulty spot-check.
- **Generated sets less vetted than Smogon.** → CSV-attested move weighting + quality guardrails + differential sampling.
- **Story saves / balance sensitivity.** → phased, each with sign-off; no save-schema change expected (builds are regenerated, not persisted for foes; wild builds already persist through the shipped path).

## 10. Open decisions (to resolve before Phase 2)

- Exact utility-slot density curve (how much setup/status is "cleverer not harder" vs annoying early).
- Whether to raise `csvBuildMix` globally or only for foes.
- Whether the EV-redistribution trainer is an existing-NPC extension or a new facility, and its unlock city.
- Whether wild ability should be *fully* random-legal or keep a mild slot-0 bias.
