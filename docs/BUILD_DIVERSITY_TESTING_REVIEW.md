# Build Diversity — Testing Review

Verification record for the build-diversity overhaul (PR #364). Every result below
is from the **real generation pipeline** driven headlessly via `tests/helpers/load-engine.js`:
enemies through `rollTrainerTeam → storyGateFoeMovesByCity`, wilds through
`rollWildEncounter → storyFilterBuildMovesForCity`. Design canon: `BUILD_DIVERSITY_MASTER.md`.

## 1. Automated test suites

| Suite | Coverage | Result |
|---|---|---|
| Full `tests/suites/**` layer | whole game (story, battle, PvP, balance) | **1304 pass / 0 fail** |
| `story-enemy-build-diversity.test.js` (new) | EV≤508, legal forme abilities, no role-fighting natures, no pre-City-8 gimmick items, coverage/utility present | 5 pass |
| `story-wild-build-diversity.test.js` (extended) | nature pools, EV jitter/splash, distributor target, C7 cap, wild move variety, nature phase-in | 13 pass |
| `story-ev-redistribute.test.js` (new) | net-zero reshuffle, per-stat legal, single charge, no-op guards | 4 pass |
| `story-enemy-move-gate` / `story-move-ceiling` / `story-tutor-gate-integrity` (updated) | Phase-1 foe-gate contract (legal moves within BP cap; player gate unchanged) | pass |
| `city-hub-layout-v27.golden` (regenerated) | city-hub buttons — only additions were the reshuffle EV-Trainer button | pass |

Statistical suites (varied seeds + `Math.random` species) were re-run 3× to confirm non-flakiness.

## 2. Enemy builds — component sweep, every stage (final state)

264+ mons/city through the full pipeline. **All correctness metrics are 0 at every city.**

| City | only-STAB% | avg coverage | avg utility | max EV | >508 | illegal ability | role-fighting | pre-C8 gimmick item |
|---|---|---|---|---|---|---|---|---|
| C0 | 11% | 0.70 | 1.09 | 48 | 0 | 0 | 0 | 0 |
| C1 | 21% | 0.28 | 1.19 | 148 | 0 | 0 | 0 | 0 |
| C2 | 26% | 0.24 | 1.08 | 200 | 0 | 0 | 0 | 0 |
| C3 | 15% | 0.36 | 1.33 | 248 | 0 | 0 | 0 | 0 |
| C4 | 11% | 0.47 | 1.45 | 348 | 0 | 0 | 0 | 0 |
| C5 | 0% | 1.09 | 1.31 | 400 | 0 | 0 | 0 | 0 |
| C6 | 0% | 1.09 | 1.47 | 508 | 0 | 0 | 0 | 0 |
| C7 | 1% | 1.13 | 1.24 | 508 | 0 | 0 | 0 | 0 |

Reading: every stage carries ~1–1.5 utility (setup/status appear even at C0, 0-BP so they pass
the cap) and coverage ramps 0.24 → 1.13 as the per-city BP cap lifts — "diverse early, power
scales." Max EV never breaches 508. Zero illegal abilities / role-fighting natures / early
gimmick items across all stages.

## 3. Enemy team composition (role diversity)

60 teams/city, archetype-classified. `enforceRoleSpread` result:

| City | avg distinct roles / 6 | % monotone (≥5 same) | % teams with a wall |
|---|---|---|---|
| C2 | 4.92 | 0% | 75% |
| C3 | 4.40 | 0% | 68% |
| C4 | 4.63 | 0% | 72% |
| C5 | 4.53 | 0% | 72% |
| C6 | 4.75 | 0% | 82% |
| C7 | 4.62 | 0% | 65% |

Teams now span ~4.6 distinct roles out of 6, **0% are "6 of one role"** (was ~50–66%), and most
field a wall. Signature/counter locks are never disturbed; small early teams (<4) are skipped.

## 4. Wild builds — component sweep, every stage (final state)

500 rolls/city.

| City | held % | of which berry % | only-STAB % | neutral-nature % |
|---|---|---|---|---|
| C0 | 0% | — | 8% | 76% |
| C1 | 32% | 30% | 7% | 38% |
| C2 | 35% | 32% | 6% | 18% |
| C3 | 30% | 28% | 7% | 0% |
| C4 | 66% | 9% | 9% | 0% |
| C5 | 66% | 10% | 9% | 0% |
| C6 | 69% | 7% | 9% | 0% |
| C7 | 100% | 8% | 8% | 0% |

Reading: held items ramp smoothly (C0 none → C1–3 berries → C4–6 staples → C7 best) with no
cliff and no elite items before C7; natures phase in over C0–C2 (76% → 18% neutral) instead of
the old hard 100%→0% snap. Wild nature/EV diversity (per-species) is locked by the extended
wild guard suite.

## 5. Phase 4 — EV reshuffle invariants

Verified by `story-ev-redistribute.test.js`: total is preserved exactly (net-zero) after a
reshuffle; per-stat ≤252; gold charged once (1000G); 0-EV and insufficient-gold cases are safe
no-ops with no charge; odd (non-multiple-of-4) totals stay within one 4-EV step. Early access
(C3+) is reshuffle-only — it re-tunes battle-trained EVs, never adds them, so it can't shortcut
the training economy; full "buy any spread" stays gated to C7+/post-HoF/Frontier.

## 6. Wild nature/ability blend + generator augmentation

- **Nature blend** — post-neutral, ~30% of wild natures are fully random legal (all 25 surfaced across
  a sweep) and ~70% curated role-appropriate. The late-city neutral share (~5–8%) is the random
  slice occasionally rolling a neutral, by design. Locked by `story-wild-build-diversity` (blend +
  slot-1 ability assertions).
- **Ability** — regular slot-1 now appears ~half the time on slot-1-capable species (was ~0%); hidden
  stays late-gated.
- **Generator augmentation** — thin-CSV species (< 8 CSV moves) get their legal learnset folded in
  (Sunkern 5→65); well-covered species untouched (Garchomp/Blissey/Luvdisc unchanged). Guarded by
  `story-generator-augment.test.js` (index-poll + augment-thin / leave-covered).

## 7. Manual-verification note

The EV-Trainer reshuffle **UI** (Phase 4) has backend tests + a regenerated city-hub golden, but the
preset-card render itself was not driven in a live browser. A one-time visual pass of the EV-Trainer
screen at C3 (reshuffle-only) and C7 (full + reshuffle) is the remaining manual check before merge.
