# BUILD DIVERSITY MASTER — adaptive, diverse, viable builds for wild & enemy Pokémon

> Design canon for the wild + enemy build-generation overhaul. Status: **DESIGN — pending
> maintainer sign-off before any Phase ships.** All balance numbers here are proposals the
> maintainer owns (see CLAUDE.md → Approval rules). Nothing in this doc has shipped except
> the wild nature/EV diversity already merged on `claude/wild-pokemon-build-diversity-vj631h`.

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

## 3. Current-state audit findings

> **[TO BE FILLED FROM THE INSTRUMENTED SWEEP]** — component-by-component (moves / ability / EV / IV /
> item / nature), every city C0→C7, hundreds of enemy mons + wild mons per stage, ranked by severity
> with cause + resolution. This section is the empirical evidence base for the phase plan below.

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

## 6. Phase plan

Each phase = its own diff + maintainer sign-off on the numbers + a deterministic guard test. Ordered by impact.

- **Phase 1 — Enemy move diversity (the gate split).** Split `_storyApplyMoveStageToBuild`; foes get the diverse-but-BP-capped path (coverage/setup/utility available at every city, power still curbed by BP cap + EV band). Player wild path unchanged. *Deliver: enemies stop being "4 STAB" from City 1.*
- **Phase 2 — Stage-adaptive generator + role-coherent teams.** Wire the learnset into the generator, parameterize it by city, raise foe reliance on it, and add per-slot role assignment. *Deliver: teams read as teams; builds fit the stage.*
- **Phase 3 — Wild philosophy tune.** Confirm stage-competitive wild EVs; move nature/ability toward randomised-legal (the headroom); keep wild moves legal-basic. *Deliver: fresh catches are usable but yours to optimise.*
- **Phase 4 — EV-redistribution trainer.** New NPC/UI. Early: redistribute your existing EV total (cost ~1000 G). Late (post EV-trainer unlock): raise EV total 0→max instantly. Lets the player re-tune EV training anytime. *Deliver: the training loop that makes wild EV spreads matter.*

## 7. Balance-knobs registry (all maintainer-owned)

| Knob | Where | Proposed default | Notes |
|---|---|---|---|
| Foe BP cap by city | `STORY_FOE_MOVE_BP_CAP_BY_CITY` | keep `[40,60,60,80,80,0]` | the "power" lever; unchanged |
| Foe utility-slot density by stage | new | 1 non-damaging slot early → 2 late | keeps early fights readable ("cleverer not harder") |
| Foe coverage-slot minimum | new | ≥1 non-STAB damaging where legal | kills the "4 STAB" feel |
| Team role spread | new | e.g. ≥3 distinct roles / 6 | "both roles + moves" |
| `csvBuildMix` / generator reliance | `settings.csvBuildMix` | raise generator share for foes | |
| CSV-attested move weight | new | bias, not hard filter | inherits Smogon vetting |
| Wild EV total by city | `STORY_EV_CITY_TOTAL` | keep (already stage-competitive) | |
| Wild nature randomness | `_wildPickNature` weights | more random per new wild philosophy | |
| Wild ability randomness | `makeWildBuild` ability roll | more random-legal | |
| EV-redistribution cost | new | ~1000 G early | |

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
