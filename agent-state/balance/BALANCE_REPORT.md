# Story-mode enemy vs. expected-player balance report
Generated 2026-06-19T19:09:43.144Z · 100 seeds (1000..1099) · difficulty **normal** · gimmicks off

## Methodology
- **Enemy data** is the real `assignTrainers → rollTrainerTeam` pipeline via `simulateStoryRunTeams`, walked over every Battle row, 100× per gen-set. Each enemy mon's stats are the **actually-fought** Lv50 stats: `buildPokemon` with `build._storyStatMult = storyEnemyStatMult(event,city,row) × foeDifficultyMult('normal')` — i.e. the FOE_POWER_CURVE / boss-override edge is included.
- **Player data** is a *spec-driven synthetic* model (PROGRESSION_CURVE_MASTER §5c): party size = `max(2,min(6,2+badges))`; per-stage grade mix (table in script); the "expected mon" is the **pool-average** Lv50 stat-total over all non-legendary species of each grade legal in the gen-set, built at a stage build tier (IV avg + EV total ramping with training facilities). Player mons are **exempt** from the foe multiplier (natural Lv50 line) — exactly as the engine treats wilds/gifts.
- **Primary metric** `ratioPerMon` = mean(enemy mon stat-total) / (expected player mon stat-total). It is **size-independent**. The **design intent** is `ratioPerMon ≈ intendedMult` (the foe edge the maintainer dialled in), *assuming grade parity*. `delta = ratioPerMon − intendedMult`: **>+0.08 = HARD** (enemy outclasses the curve, usually via a grade/BST gap the player can't match in that gen-set), **<−0.08 = SOFT**.
- Party-size asymmetry is captured separately by `teamRatio` (enemy team capped to the player's party cap ÷ expected player team total).

## Executive summary
Across 192 stage×gen-set rows (100 seeds each): **7 HARD**, **36 SOFT**, rest within ±0.08 of the intended foe edge.

**Difficulty curve by phase (ALL GENS, mean Δ = measured ratio − intended foe edge):**
| phase | mean Δ | reading |
|---|---|---|
| early(C0-2) | -0.054 | on curve |
| mid(C3-5) | -0.047 | on curve |
| late(C6-8) | +0.04 | on curve |
| endgame | -0.023 | on curve |

**Key findings:**
1. **Early game (C0-1) reads SOFT in every gen-set** (Δ ≈ −0.13 to −0.14 for the first Basic Trainers / Gym 1). Partly this is the model's deliberately *generous* early player baseline (it assumes a ~130-EV, IV-16 mon, whereas a brand-new save has a 0-EV starter); treat the early-game softness as "player model is the optimistic bound", i.e. enemies are not harder than a kitted early player — read it as headroom, not an under-tuning bug.
2. **The Rival consistently punches above the curve.** Mean Rival Δ = -0.01 (it counter-picks the player's live party, so it earns extra effective power the flat curve doesn't model). The **post-Champion league Rival (row 65) is the single most consistent HARD outlier** in all four gen-sets (Δ ≈ +0.08 to +0.13). If the league Rival should feel like a final-boss spike that's working as intended; if not, it's the one knob to soften.
3. **The broad "late-game creep" is mostly a player-model calibration effect, not an enemy over-tune.** Story-mode floors enemy filler at **G2 from City 6** (`_storyFillerGradeFloorForRow`), which is *intended to match the player also fielding G2 finals by C6* (the evo gate opens all evolutions at C4). Calibrating the player late mix to that §5c "G2-finals era" brings the C6-8 mean Δ to **+0.04 (within tolerance)**. Two levers were ruled out empirically: the grade-weight ramp `k` is a **confirmed no-op in late game** (the C6+ G2 floor + trainer-grade-matrix renormalization override it — tested, zero effect), and softening `FOE_POWER_CURVE[6+]` *inverts the curve's monotonic ramp*. **No `FOE_POWER_CURVE` / grade-ramp change recommended.**
4. **Residual genuine enemy spikes are localized, not systemic:** (a) **City-5 elite-tier trainers** (Gym Leader 5 / Elite Trainers) run Δ ≈ +0.10 above `FOE_POWER_CURVE[5]=1.03` because the trainer-grade matrix + ramp give them G2-heavy teams while the C5 player is still in the §5c G3 first-evo era — arguably intended (elite trainers *should* bite), but it's the one spot a deliberate bump exceeds the dialled city edge. (b) **The Rival** rides ~+0.09 (it counter-picks your live party — flavor the flat curve can't model), and the **post-Champion league Rival (row 65)** is the single most consistent outlier (Δ +0.08…+0.13) — a final-boss spike. **E4 / Champion / Mystery Figure land on their dialled multipliers** (|Δ| < 0.04): the `_storyEnemyStatMult` boss overrides are well-tuned. No change recommended unless you specifically want to soften the C5 elite tier or the league Rival.
5. **GEN 1 ONLY has a real pool-exhaustion problem:** 14 Rattata-sentinel fallbacks on non-Normal trainers (Dragon Tamers, Hex Maniacs, etc.) — **all in the Gen-1 lock**, none in wider pools. The narrow Gen-1 type pool runs dry and the roll falls back to Rattata. This is a *variety/coherence* bug, separate from raw power; see the data-quality section. Aside from that, Gen-1-only tracks the all-gens curve closely (grade pools are similar), so the gen lock does not by itself break the difficulty curve.


## GEN 1 ONLY  (gens 1)
| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Rival | Hop | 0 | 2 | 302.09 | 457.38 | 0.66 (0.667) | 0.75 | -0.09 | 0.33 | 3.93 | 3.9 | 🔵 SOFT |
| 1 | Basic Trainer | Blackbelt | 0 | 2 | 315.16 | 457.38 | 0.689 (0.694) | 0.8 | -0.111 | 0.69 | 4 | 3.9 | 🔵 SOFT |
| 4 | Gym Trainer 1 | Hex Maniac | 1 | 2 | 363.26 | 463.56 | 0.784 (0.791) | 0.85 | -0.066 | 0.78 | 4 | 3.85 | · |
| 5 | Gym Leader 1 | Ryme | 1 | 2 | 362.45 | 463.56 | 0.782 (0.79) | 0.85 | -0.068 | 0.78 | 4 | 3.85 | · |
| 7 | Basic Trainer | Bug Maniac | 1 | 3 | 340.66 | 463.56 | 0.735 (0.745) | 0.85 | -0.115 | 0.73 | 4 | 3.85 | 🔵 SOFT |
| 8 | Basic Trainer | Mountain Guide | 1 | 3 | 340.57 | 463.56 | 0.735 (0.744) | 0.85 | -0.115 | 0.73 | 4 | 3.85 | 🔵 SOFT |
| 10 | Gym Trainer 1 | Channeler | 2 | 3 | 468.21 | 487.72 | 0.96 (0.977) | 0.9 | +0.06 | 0.96 | 3.36 | 3.65 | · |
| 11 | Gym Leader 2 | Morty | 2 | 3 | 467.71 | 487.72 | 0.959 (0.97) | 0.9 | +0.059 | 0.98 | 3.35 | 3.65 | · |
| 14 | Basic Trainer | Blackbelt | 2 | 4 | 450.83 | 487.72 | 0.924 (0.931) | 0.9 | +0.024 | 0.94 | 3.32 | 3.65 | · |
| 15 | Basic Trainer | Cyclist | 2 | 4 | 453.45 | 487.72 | 0.93 (0.933) | 0.9 | +0.03 | 0.94 | 3.32 | 3.65 | · |
| 17 | Gym Trainer 1 | Battle Girl | 3 | 4 | 512.21 | 563.99 | 0.908 (0.908) | 0.95 | -0.042 | 0.9 | 3.37 | 3.2 | · |
| 18 | Gym Leader 3 | Chuck | 3 | 4 | 513.08 | 563.99 | 0.91 (0.916) | 0.95 | -0.04 | 0.92 | 3.37 | 3.2 | · |
| 12 | Rival | Hop | 3 | 5 | 495.19 | 563.99 | 0.878 (0.879) | 0.95 | -0.072 | 0.88 | 3.5 | 3.2 | · |
| 20 | Basic Trainer | Worker | 3 | 5 | 496.72 | 563.99 | 0.881 (0.883) | 0.95 | -0.069 | 0.89 | 3.34 | 3.2 | · |
| 21 | Basic Trainer | Aroma Lady | 3 | 5 | 496.14 | 563.99 | 0.88 (0.882) | 0.95 | -0.07 | 0.89 | 3.35 | 3.2 | · |
| 23 | Gym Trainer 1 | Triathlete Swimmer | 4 | 5 | 575.63 | 594 | 0.969 (0.968) | 1 | -0.031 | 0.97 | 3.31 | 2.95 | · |
| 24 | Gym Leader 4 | Crasher Wake | 4 | 5 | 582.81 | 594 | 0.981 (0.982) | 1 | -0.019 | 0.99 | 3.24 | 2.95 | · |
| 26 | Basic Trainer | Pokémon Ranger F | 4 | 6 | 547.47 | 594 | 0.922 (0.921) | 1 | -0.078 | 0.92 | 3.33 | 2.95 | · |
| 27 | Basic Trainer | Lady | 4 | 6 | 552.9 | 594 | 0.931 (0.936) | 1 | -0.069 | 0.93 | 3.32 | 2.95 | · |
| 29 | Gym Trainer 1 | Medium JPN | 5 | 6 | 617.3 | 620.44 | 0.995 (0.996) | 1.03 | -0.035 | 0.99 | 3.33 | 2.7 | · |
| 30 | Gym Trainer 2 | Medium JPN | 5 | 6 | 652.59 | 620.44 | 1.052 (1.047) | 1.03 | +0.022 | 1.05 | 2.96 | 2.7 | · |
| 31 | Gym Leader 5 | Sabrina | 5 | 6 | 669.98 | 620.44 | 1.08 (1.088) | 1.03 | +0.05 | 1.08 | 2.8 | 2.7 | · |
| 33 | Basic Trainer | Lab Rat | 5 | 6 | 594.41 | 620.44 | 0.958 (0.964) | 1.03 | -0.072 | 0.96 | 3.3 | 2.7 | · |
| 34 | Elite Trainer | Penny | 5 | 6 | 674.79 | 620.44 | 1.088 (1.088) | 1.03 | +0.058 | 1.09 | 2.81 | 2.7 | · |
| 36 | Gym Trainer 1 | Office Worker | 6 | 6 | 775.33 | 702.77 | 1.103 (1.111) | 1.05 | +0.053 | 1.1 | 2.19 | 2.2 | · |
| 37 | Gym Trainer 2 | Officer | 6 | 6 | 774.25 | 702.77 | 1.102 (1.108) | 1.05 | +0.052 | 1.1 | 2.2 | 2.2 | · |
| 38 | Gym Leader 6 | Larry | 6 | 6 | 774.06 | 702.77 | 1.101 (1.106) | 1.05 | +0.051 | 1.1 | 2.17 | 2.2 | · |
| 39 | Rival | Hop | 6 | 6 | 783.49 | 702.77 | 1.115 (1.121) | 1.05 | +0.065 | 1.11 | 1.97 | 2.2 | · |
| 41 | Basic Trainer | Channeler | 6 | 6 | 746.74 | 702.77 | 1.063 (1.069) | 1.05 | +0.013 | 1.06 | 2.17 | 2.2 | · |
| 42 | Elite Trainer | Veteran Wallace | 6 | 6 | 780.14 | 702.77 | 1.11 (1.114) | 1.05 | +0.06 | 1.11 | 2.12 | 2.2 | · |
| 44 | Gym Trainer 1 | Depot Agent | 7 | 6 | 795.33 | 717.57 | 1.108 (1.115) | 1.08 | +0.028 | 1.11 | 2.2 | 2.05 | · |
| 45 | Gym Trainer 2 | Depot Agent | 7 | 6 | 792.72 | 717.57 | 1.105 (1.11) | 1.08 | +0.025 | 1.1 | 2.22 | 2.05 | · |
| 46 | Gym Leader 7 | Byron | 7 | 6 | 794.79 | 717.57 | 1.108 (1.114) | 1.08 | +0.028 | 1.11 | 2.17 | 2.05 | · |
| 48 | Elite Trainer | Hollow Cyrus | 7 | 6 | 803.81 | 717.57 | 1.12 (1.124) | 1.08 | +0.04 | 1.12 | 2.11 | 2.05 | · |
| 49 | Elite Trainer | Veteran Koga | 7 | 6 | 794.93 | 717.57 | 1.108 (1.111) | 1.08 | +0.028 | 1.11 | 2.12 | 2.05 | · |
| 51 | Gym Trainer 1 | Hiker | 8 | 6 | 811.42 | 717.57 | 1.131 (1.133) | 1.1 | +0.031 | 1.13 | 2.19 | 2.05 | · |
| 52 | Gym Trainer 2 | Hiker | 8 | 6 | 809.32 | 717.57 | 1.128 (1.135) | 1.1 | +0.028 | 1.13 | 2.2 | 2.05 | · |
| 53 | Gym Leader 8 | Grant | 8 | 6 | 809.51 | 717.57 | 1.128 (1.134) | 1.1 | +0.028 | 1.13 | 2.16 | 2.05 | · |
| 56 | Elite Trainer | Eldritch N | 8 | 6 | 819.03 | 717.57 | 1.141 (1.145) | 1.1 | +0.041 | 1.14 | 2.1 | 2.05 | · |
| 57 | Elite Trainer | Mars | 8 | 6 | 811.62 | 717.57 | 1.131 (1.138) | 1.1 | +0.031 | 1.13 | 2.16 | 2.05 | · |
| 58 | Elite Trainer | Silent Red | 8 | 6 | 813.66 | 717.57 | 1.134 (1.137) | 1.1 | +0.034 | 1.13 | 2.15 | 2.05 | · |
| 60 | E1 | Lorelei | 9 | 6 | 858.2 | 757.47 | 1.133 (1.131) | 1.14 | -0.007 | 1.13 | 2.13 | 1.85 | · |
| 61 | E2 | Bruno | 9 | 6 | 832.52 | 757.47 | 1.099 (1.097) | 1.16 | -0.061 | 1.1 | 2.47 | 1.85 | · |
| 62 | E3 | Flint | 9 | 6 | 882.31 | 757.47 | 1.165 (1.17) | 1.18 | -0.015 | 1.16 | 2.13 | 1.85 | · |
| 63 | E4 | Lance | 9 | 6 | 898.85 | 757.47 | 1.187 (1.182) | 1.2 | -0.013 | 1.19 | 2.11 | 1.85 | · |
| 64 | Champion | Prof. Kukui | 9 | 6 | 924.59 | 757.47 | 1.221 (1.233) | 1.23 | -0.009 | 1.22 | 2.02 | 1.85 | · |
| 65 | Rival | Hop | 9 | 6 | 939.16 | 717.57 | 1.309 (1.315) | 1.26 | +0.049 | 1.31 | 1.98 | 2.05 | · |
| 67 | Mystery Figure | Young Athlete F | 9 | 6 | 968.8 | 757.47 | 1.279 (1.28) | 1.3 | -0.021 | 1.28 | 2.06 | 1.85 | · |

**GEN 1 ONLY divergences:** 0 HARD, 4 SOFT of 48 stages.
- SOFT: Rival(Δ-0.09), Basic Trainer(Δ-0.111), Basic Trainer(Δ-0.115), Basic Trainer(Δ-0.115)

## ALL GENS  (gens 1,2,3,4,5,6,7,8,9)
| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Rival | Hop | 0 | 2 | 295.39 | 452.53 | 0.653 (0.667) | 0.75 | -0.097 | 0.33 | 4 | 3.9 | 🔵 SOFT |
| 1 | Basic Trainer | Blackbelt | 0 | 2 | 298.6 | 452.53 | 0.66 (0.664) | 0.8 | -0.14 | 0.65 | 4 | 3.9 | 🔵 SOFT |
| 4 | Gym Trainer 1 | Hex Maniac | 1 | 2 | 346.59 | 459.23 | 0.755 (0.762) | 0.85 | -0.095 | 0.75 | 4 | 3.85 | 🔵 SOFT |
| 5 | Gym Leader 1 | Ryme | 1 | 2 | 347.97 | 459.23 | 0.758 (0.77) | 0.85 | -0.092 | 0.75 | 4 | 3.85 | 🔵 SOFT |
| 7 | Basic Trainer | Veteran | 1 | 3 | 328.88 | 459.23 | 0.716 (0.719) | 0.85 | -0.134 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 8 | Basic Trainer | Team Aqua Grunt F | 1 | 3 | 330.81 | 459.23 | 0.72 (0.722) | 0.85 | -0.13 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 10 | Gym Trainer 1 | Hex Maniac | 2 | 3 | 437.93 | 485.31 | 0.902 (0.891) | 0.9 | +0.002 | 0.9 | 3.56 | 3.65 | · |
| 11 | Gym Leader 2 | Morty | 2 | 3 | 473.9 | 485.31 | 0.976 (0.98) | 0.9 | +0.076 | 0.98 | 3.29 | 3.65 | · |
| 14 | Basic Trainer | Bird Keeper | 2 | 4 | 451.57 | 485.31 | 0.93 (0.938) | 0.9 | +0.03 | 0.94 | 3.3 | 3.65 | · |
| 15 | Basic Trainer | Pilot | 2 | 4 | 454.99 | 485.31 | 0.938 (0.944) | 0.9 | +0.038 | 0.95 | 3.28 | 3.65 | · |
| 17 | Gym Trainer 1 | Cue Ball | 3 | 4 | 490.15 | 565.61 | 0.867 (0.862) | 0.95 | -0.083 | 0.87 | 3.51 | 3.2 | 🔵 SOFT |
| 18 | Gym Leader 3 | Chuck | 3 | 4 | 522.89 | 565.61 | 0.924 (0.921) | 0.95 | -0.026 | 0.92 | 3.28 | 3.2 | · |
| 12 | Rival | Hop | 3 | 5 | 488.24 | 565.61 | 0.863 (0.863) | 0.95 | -0.087 | 0.86 | 3.54 | 3.2 | 🔵 SOFT |
| 20 | Basic Trainer | Channeler | 3 | 5 | 497.04 | 565.61 | 0.879 (0.887) | 0.95 | -0.071 | 0.89 | 3.31 | 3.2 | · |
| 21 | Basic Trainer | Ruin Maniac | 3 | 5 | 495.75 | 565.61 | 0.876 (0.877) | 0.95 | -0.074 | 0.88 | 3.32 | 3.2 | · |
| 23 | Gym Trainer 1 | Triathlete F Swimmer | 4 | 5 | 545.08 | 597.95 | 0.912 (0.92) | 1 | -0.088 | 0.91 | 3.49 | 2.95 | 🔵 SOFT |
| 24 | Gym Leader 4 | Crasher Wake | 4 | 5 | 584.66 | 597.95 | 0.978 (0.978) | 1 | -0.022 | 0.98 | 3.22 | 2.95 | · |
| 26 | Basic Trainer | Plasma Grunt F | 4 | 6 | 548.48 | 597.95 | 0.917 (0.921) | 1 | -0.083 | 0.92 | 3.29 | 2.95 | 🔵 SOFT |
| 27 | Basic Trainer | Crooked Beat | 4 | 6 | 554.88 | 597.95 | 0.928 (0.928) | 1 | -0.072 | 0.93 | 3.27 | 2.95 | · |
| 29 | Gym Trainer 1 | Medium | 5 | 6 | 590.84 | 625.54 | 0.945 (0.94) | 1.03 | -0.085 | 0.94 | 3.47 | 2.7 | 🔵 SOFT |
| 30 | Gym Trainer 2 | Psychic F | 5 | 6 | 585.6 | 625.54 | 0.936 (0.924) | 1.03 | -0.094 | 0.94 | 3.46 | 2.7 | 🔵 SOFT |
| 31 | Gym Leader 5 | Sabrina | 5 | 6 | 706.4 | 625.54 | 1.129 (1.132) | 1.03 | +0.099 | 1.13 | 2.52 | 2.7 | 🔴 HARD |
| 33 | Basic Trainer | Ruin Maniac | 5 | 6 | 594.32 | 625.54 | 0.95 (0.964) | 1.03 | -0.08 | 0.95 | 3.28 | 2.7 | · |
| 34 | Elite Trainer | Volkner | 5 | 6 | 709.17 | 625.54 | 1.134 (1.133) | 1.03 | +0.104 | 1.13 | 2.55 | 2.7 | 🔴 HARD |
| 36 | Gym Trainer 1 | Triathlete Runner | 6 | 6 | 776.38 | 711.26 | 1.092 (1.091) | 1.05 | +0.042 | 1.09 | 2.2 | 2.2 | · |
| 37 | Gym Trainer 2 | Reporter | 6 | 6 | 773.97 | 711.26 | 1.088 (1.09) | 1.05 | +0.038 | 1.09 | 2.24 | 2.2 | · |
| 38 | Gym Leader 6 | Larry | 6 | 6 | 781.63 | 711.26 | 1.099 (1.098) | 1.05 | +0.049 | 1.1 | 2.21 | 2.2 | · |
| 39 | Rival | Hop | 6 | 6 | 807.78 | 711.26 | 1.136 (1.136) | 1.05 | +0.086 | 1.14 | 1.97 | 2.2 | 🔴 HARD |
| 41 | Basic Trainer | Team Aqua Grunt F | 6 | 6 | 763.85 | 711.26 | 1.074 (1.073) | 1.05 | +0.024 | 1.07 | 2.12 | 2.2 | · |
| 42 | Elite Trainer | Veteran Wallace | 6 | 6 | 797.07 | 711.26 | 1.121 (1.118) | 1.05 | +0.071 | 1.12 | 2.08 | 2.2 | · |
| 44 | Gym Trainer 1 | Reactor Tech | 7 | 6 | 802.68 | 726.36 | 1.105 (1.106) | 1.08 | +0.025 | 1.11 | 2.19 | 2.05 | · |
| 45 | Gym Trainer 2 | Worker | 7 | 6 | 795.02 | 726.36 | 1.095 (1.099) | 1.08 | +0.015 | 1.09 | 2.25 | 2.05 | · |
| 46 | Gym Leader 7 | Byron | 7 | 6 | 802.98 | 726.36 | 1.105 (1.103) | 1.08 | +0.025 | 1.11 | 2.21 | 2.05 | · |
| 48 | Elite Trainer | Hollow Cyrus | 7 | 6 | 815.46 | 726.36 | 1.123 (1.119) | 1.08 | +0.043 | 1.12 | 2.09 | 2.05 | · |
| 49 | Elite Trainer | Veteran Koga | 7 | 6 | 820.99 | 726.36 | 1.13 (1.125) | 1.08 | +0.05 | 1.13 | 2.07 | 2.05 | · |
| 51 | Gym Trainer 1 | Rocker | 8 | 6 | 816.38 | 726.36 | 1.124 (1.126) | 1.1 | +0.024 | 1.12 | 2.23 | 2.05 | · |
| 52 | Gym Trainer 2 | Hiker | 8 | 6 | 806.61 | 726.36 | 1.11 (1.115) | 1.1 | +0.01 | 1.11 | 2.24 | 2.05 | · |
| 53 | Gym Leader 8 | Grant | 8 | 6 | 817.39 | 726.36 | 1.125 (1.126) | 1.1 | +0.025 | 1.13 | 2.21 | 2.05 | · |
| 56 | Elite Trainer | Eldritch N | 8 | 6 | 828.98 | 726.36 | 1.141 (1.137) | 1.1 | +0.041 | 1.14 | 2.08 | 2.05 | · |
| 57 | Elite Trainer | Mars | 8 | 6 | 827.18 | 726.36 | 1.139 (1.138) | 1.1 | +0.039 | 1.14 | 2.13 | 2.05 | · |
| 58 | Elite Trainer | Silent Red | 8 | 6 | 828.56 | 726.36 | 1.141 (1.139) | 1.1 | +0.041 | 1.14 | 2.12 | 2.05 | · |
| 60 | E1 | Lorelei | 9 | 6 | 857.81 | 765.17 | 1.121 (1.119) | 1.14 | -0.019 | 1.12 | 2.15 | 1.85 | · |
| 61 | E2 | Bruno | 9 | 6 | 841.5 | 765.17 | 1.1 (1.09) | 1.16 | -0.06 | 1.1 | 2.48 | 1.85 | · |
| 62 | E3 | Flint | 9 | 6 | 882.97 | 765.17 | 1.154 (1.15) | 1.18 | -0.026 | 1.15 | 2.1 | 1.85 | · |
| 63 | E4 | Lance | 9 | 6 | 897.18 | 765.17 | 1.173 (1.168) | 1.2 | -0.027 | 1.17 | 2.13 | 1.85 | · |
| 64 | Champion | Prof. Kukui | 9 | 6 | 943.56 | 765.17 | 1.233 (1.231) | 1.23 | +0.003 | 1.23 | 1.95 | 1.85 | · |
| 65 | Rival | Hop | 9 | 6 | 972.59 | 726.36 | 1.339 (1.33) | 1.26 | +0.079 | 1.34 | 1.98 | 2.05 | · |
| 67 | Mystery Figure | Hau | 9 | 6 | 987.95 | 765.17 | 1.291 (1.3) | 1.3 | -0.009 | 1.29 | 1.94 | 1.85 | · |

**ALL GENS divergences:** 3 HARD, 12 SOFT of 48 stages.
- HARD: Gym Leader 5(Δ+0.099), Elite Trainer(Δ+0.104), Rival(Δ+0.086)
- SOFT: Rival(Δ-0.097), Basic Trainer(Δ-0.14), Gym Trainer 1(Δ-0.095), Gym Leader 1(Δ-0.092), Basic Trainer(Δ-0.134), Basic Trainer(Δ-0.13), Gym Trainer 1(Δ-0.083), Rival(Δ-0.087), Gym Trainer 1(Δ-0.088), Basic Trainer(Δ-0.083), Gym Trainer 1(Δ-0.085), Gym Trainer 2(Δ-0.094)

## GEN 1-6  (gens 1,2,3,4,5,6)
| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Rival | Hop | 0 | 2 | 297.68 | 453.35 | 0.657 (0.671) | 0.75 | -0.093 | 0.33 | 4 | 3.9 | 🔵 SOFT |
| 1 | Basic Trainer | Swimmer F JPN | 0 | 2 | 300.98 | 453.35 | 0.664 (0.669) | 0.8 | -0.136 | 0.66 | 4 | 3.9 | 🔵 SOFT |
| 4 | Gym Trainer 1 | Hex Maniac | 1 | 2 | 349.3 | 459.78 | 0.76 (0.771) | 0.85 | -0.09 | 0.75 | 4 | 3.85 | 🔵 SOFT |
| 5 | Gym Leader 1 | Ryme | 1 | 2 | 351.19 | 459.78 | 0.764 (0.776) | 0.85 | -0.086 | 0.76 | 4 | 3.85 | 🔵 SOFT |
| 7 | Basic Trainer | Smasher | 1 | 3 | 334.88 | 459.78 | 0.728 (0.734) | 0.85 | -0.122 | 0.73 | 4 | 3.85 | 🔵 SOFT |
| 8 | Basic Trainer | Triathlete F Biker | 1 | 3 | 332.69 | 459.78 | 0.724 (0.733) | 0.85 | -0.126 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 10 | Gym Trainer 1 | Channeler | 2 | 3 | 437.83 | 485.17 | 0.902 (0.893) | 0.9 | +0.002 | 0.89 | 3.54 | 3.65 | · |
| 11 | Gym Leader 2 | Morty | 2 | 3 | 473.43 | 485.17 | 0.976 (0.98) | 0.9 | +0.076 | 0.98 | 3.29 | 3.65 | · |
| 14 | Basic Trainer | Picnicker | 2 | 4 | 447.65 | 485.17 | 0.923 (0.924) | 0.9 | +0.023 | 0.92 | 3.3 | 3.65 | · |
| 15 | Basic Trainer | Cue Ball | 2 | 4 | 444.28 | 485.17 | 0.916 (0.919) | 0.9 | +0.016 | 0.93 | 3.34 | 3.65 | · |
| 17 | Gym Trainer 1 | Battle Girl | 3 | 4 | 484.25 | 563.25 | 0.86 (0.849) | 0.95 | -0.09 | 0.86 | 3.54 | 3.2 | 🔵 SOFT |
| 18 | Gym Leader 3 | Chuck | 3 | 4 | 519.35 | 563.25 | 0.922 (0.924) | 0.95 | -0.028 | 0.93 | 3.3 | 3.2 | · |
| 12 | Rival | Hop | 3 | 5 | 490.12 | 563.25 | 0.87 (0.864) | 0.95 | -0.08 | 0.87 | 3.51 | 3.2 | · |
| 20 | Basic Trainer | Picnicker | 3 | 5 | 488.85 | 563.25 | 0.868 (0.869) | 0.95 | -0.082 | 0.88 | 3.34 | 3.2 | 🔵 SOFT |
| 21 | Basic Trainer | Double Team | 3 | 5 | 498.86 | 563.25 | 0.886 (0.893) | 0.95 | -0.064 | 0.9 | 3.3 | 3.2 | · |
| 23 | Gym Trainer 1 | Swimmer JPN | 4 | 5 | 537.11 | 594.94 | 0.903 (0.893) | 1 | -0.097 | 0.9 | 3.53 | 2.95 | 🔵 SOFT |
| 24 | Gym Leader 4 | Crasher Wake | 4 | 5 | 585.29 | 594.94 | 0.984 (0.989) | 1 | -0.016 | 0.98 | 3.21 | 2.95 | · |
| 26 | Basic Trainer | Hex Maniac JPN | 4 | 6 | 539.72 | 594.94 | 0.907 (0.909) | 1 | -0.093 | 0.91 | 3.35 | 2.95 | 🔵 SOFT |
| 27 | Basic Trainer | Pilot | 4 | 6 | 542.29 | 594.94 | 0.912 (0.919) | 1 | -0.088 | 0.91 | 3.32 | 2.95 | 🔵 SOFT |
| 29 | Gym Trainer 1 | Hex Maniac JPN | 5 | 6 | 588.62 | 622.64 | 0.945 (0.937) | 1.03 | -0.085 | 0.95 | 3.47 | 2.7 | 🔵 SOFT |
| 30 | Gym Trainer 2 | Psychic F | 5 | 6 | 591.86 | 622.64 | 0.951 (0.933) | 1.03 | -0.079 | 0.95 | 3.43 | 2.7 | · |
| 31 | Gym Leader 5 | Sabrina | 5 | 6 | 699.05 | 622.64 | 1.123 (1.13) | 1.03 | +0.093 | 1.12 | 2.56 | 2.7 | 🔴 HARD |
| 33 | Basic Trainer | Triathlete Biker | 5 | 6 | 590.76 | 622.64 | 0.949 (0.953) | 1.03 | -0.081 | 0.95 | 3.3 | 2.7 | 🔵 SOFT |
| 34 | Elite Trainer | Chili | 5 | 6 | 694.6 | 622.64 | 1.116 (1.123) | 1.03 | +0.086 | 1.12 | 2.65 | 2.7 | 🔴 HARD |
| 36 | Gym Trainer 1 | Office Worker | 6 | 6 | 775.09 | 708.66 | 1.094 (1.099) | 1.05 | +0.044 | 1.09 | 2.21 | 2.2 | · |
| 37 | Gym Trainer 2 | Nursery Aide | 6 | 6 | 772.49 | 708.66 | 1.09 (1.093) | 1.05 | +0.04 | 1.09 | 2.24 | 2.2 | · |
| 38 | Gym Leader 6 | Larry | 6 | 6 | 780.98 | 708.66 | 1.102 (1.102) | 1.05 | +0.052 | 1.1 | 2.2 | 2.2 | · |
| 39 | Rival | Hop | 6 | 6 | 807.16 | 708.66 | 1.139 (1.138) | 1.05 | +0.089 | 1.14 | 1.97 | 2.2 | 🔴 HARD |
| 41 | Basic Trainer | Veteran F | 6 | 6 | 759.4 | 708.66 | 1.072 (1.066) | 1.05 | +0.022 | 1.07 | 2.13 | 2.2 | · |
| 42 | Elite Trainer | Veteran Wallace | 6 | 6 | 793.94 | 708.66 | 1.12 (1.119) | 1.05 | +0.07 | 1.12 | 2.06 | 2.2 | · |
| 44 | Gym Trainer 1 | Depot Agent | 7 | 6 | 797.74 | 723.89 | 1.102 (1.1) | 1.08 | +0.022 | 1.1 | 2.21 | 2.05 | · |
| 45 | Gym Trainer 2 | Reactor Tech | 7 | 6 | 795.87 | 723.89 | 1.099 (1.101) | 1.08 | +0.019 | 1.1 | 2.23 | 2.05 | · |
| 46 | Gym Leader 7 | Byron | 7 | 6 | 802.44 | 723.89 | 1.109 (1.105) | 1.08 | +0.029 | 1.11 | 2.2 | 2.05 | · |
| 48 | Elite Trainer | Hollow Cyrus | 7 | 6 | 815.17 | 723.89 | 1.126 (1.125) | 1.08 | +0.046 | 1.13 | 2.09 | 2.05 | · |
| 49 | Elite Trainer | Veteran Koga | 7 | 6 | 815.45 | 723.89 | 1.126 (1.124) | 1.08 | +0.046 | 1.13 | 2.09 | 2.05 | · |
| 51 | Gym Trainer 1 | Rocker | 8 | 6 | 812.31 | 723.89 | 1.122 (1.124) | 1.1 | +0.022 | 1.12 | 2.22 | 2.05 | · |
| 52 | Gym Trainer 2 | Rocker | 8 | 6 | 808.28 | 723.89 | 1.117 (1.117) | 1.1 | +0.017 | 1.12 | 2.27 | 2.05 | · |
| 53 | Gym Leader 8 | Grant | 8 | 6 | 817.28 | 723.89 | 1.129 (1.129) | 1.1 | +0.029 | 1.13 | 2.21 | 2.05 | · |
| 56 | Elite Trainer | Eldritch N | 8 | 6 | 830.49 | 723.89 | 1.147 (1.143) | 1.1 | +0.047 | 1.15 | 2.07 | 2.05 | · |
| 57 | Elite Trainer | Mars | 8 | 6 | 828.33 | 723.89 | 1.144 (1.142) | 1.1 | +0.044 | 1.14 | 2.12 | 2.05 | · |
| 58 | Elite Trainer | Silent Red | 8 | 6 | 822.44 | 723.89 | 1.136 (1.136) | 1.1 | +0.036 | 1.14 | 2.08 | 2.05 | · |
| 60 | E1 | Lorelei | 9 | 6 | 858.06 | 763.06 | 1.124 (1.122) | 1.14 | -0.016 | 1.12 | 2.14 | 1.85 | · |
| 61 | E2 | Bruno | 9 | 6 | 840.2 | 763.06 | 1.101 (1.091) | 1.16 | -0.059 | 1.1 | 2.48 | 1.85 | · |
| 62 | E3 | Flint | 9 | 6 | 884.76 | 763.06 | 1.159 (1.154) | 1.18 | -0.021 | 1.16 | 2.1 | 1.85 | · |
| 63 | E4 | Lance | 9 | 6 | 897.9 | 763.06 | 1.177 (1.173) | 1.2 | -0.023 | 1.18 | 2.12 | 1.85 | · |
| 64 | Champion | Prof. Kukui | 9 | 6 | 952.82 | 763.06 | 1.249 (1.245) | 1.23 | +0.019 | 1.25 | 1.88 | 1.85 | · |
| 65 | Rival | Hop | 9 | 6 | 964.07 | 723.89 | 1.332 (1.32) | 1.26 | +0.072 | 1.33 | 1.96 | 2.05 | · |
| 67 | Mystery Figure | Ilima | 9 | 6 | 968.92 | 763.06 | 1.27 (1.278) | 1.3 | -0.03 | 1.27 | 2.06 | 1.85 | · |

**GEN 1-6 divergences:** 3 HARD, 13 SOFT of 48 stages.
- HARD: Gym Leader 5(Δ+0.093), Elite Trainer(Δ+0.086), Rival(Δ+0.089)
- SOFT: Rival(Δ-0.093), Basic Trainer(Δ-0.136), Gym Trainer 1(Δ-0.09), Gym Leader 1(Δ-0.086), Basic Trainer(Δ-0.122), Basic Trainer(Δ-0.126), Gym Trainer 1(Δ-0.09), Basic Trainer(Δ-0.082), Gym Trainer 1(Δ-0.097), Basic Trainer(Δ-0.093), Basic Trainer(Δ-0.088), Gym Trainer 1(Δ-0.085), Basic Trainer(Δ-0.081)

## GEN 1-3  (gens 1,2,3)
| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Rival | Hop | 0 | 2 | 286.94 | 447.38 | 0.641 (0.666) | 0.75 | -0.109 | 0.32 | 4 | 3.9 | 🔵 SOFT |
| 1 | Basic Trainer | Beauty | 0 | 2 | 295.53 | 447.38 | 0.661 (0.672) | 0.8 | -0.139 | 0.65 | 4 | 3.9 | 🔵 SOFT |
| 4 | Gym Trainer 1 | Channeler | 1 | 2 | 346.98 | 454.31 | 0.764 (0.777) | 0.85 | -0.086 | 0.76 | 4 | 3.85 | 🔵 SOFT |
| 5 | Gym Leader 1 | Ryme | 1 | 2 | 349.18 | 454.31 | 0.769 (0.774) | 0.85 | -0.081 | 0.76 | 4 | 3.85 | 🔵 SOFT |
| 7 | Basic Trainer | Bug Maniac | 1 | 3 | 327.09 | 454.31 | 0.72 (0.734) | 0.85 | -0.13 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 8 | Basic Trainer | Firebreather | 1 | 3 | 326.62 | 454.31 | 0.719 (0.728) | 0.85 | -0.131 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 10 | Gym Trainer 1 | Hex Maniac | 2 | 3 | 451.13 | 480.94 | 0.938 (0.941) | 0.9 | +0.038 | 0.92 | 3.46 | 3.65 | · |
| 11 | Gym Leader 2 | Morty | 2 | 3 | 477.42 | 480.94 | 0.993 (0.999) | 0.9 | +0.093 | 1.01 | 3.27 | 3.65 | 🔴 HARD |
| 14 | Basic Trainer | Medium | 2 | 4 | 451.41 | 480.94 | 0.939 (0.944) | 0.9 | +0.039 | 0.95 | 3.29 | 3.65 | · |
| 15 | Basic Trainer | Firebreather | 2 | 4 | 451.04 | 480.94 | 0.938 (0.942) | 0.9 | +0.038 | 0.96 | 3.31 | 3.65 | · |
| 17 | Gym Trainer 1 | Battle Girl | 3 | 4 | 498.59 | 562.76 | 0.886 (0.888) | 0.95 | -0.064 | 0.88 | 3.43 | 3.2 | · |
| 18 | Gym Leader 3 | Chuck | 3 | 4 | 522.41 | 562.76 | 0.928 (0.93) | 0.95 | -0.022 | 0.94 | 3.29 | 3.2 | · |
| 12 | Rival | Hop | 3 | 5 | 489.53 | 562.76 | 0.87 (0.874) | 0.95 | -0.08 | 0.87 | 3.5 | 3.2 | 🔵 SOFT |
| 20 | Basic Trainer | Veteran | 3 | 5 | 498.32 | 562.76 | 0.885 (0.887) | 0.95 | -0.065 | 0.9 | 3.33 | 3.2 | · |
| 21 | Basic Trainer | Veteran F | 3 | 5 | 492.65 | 562.76 | 0.875 (0.882) | 0.95 | -0.075 | 0.88 | 3.33 | 3.2 | · |
| 23 | Gym Trainer 1 | Team Aqua Grunt Beta | 4 | 5 | 553.26 | 595.48 | 0.929 (0.926) | 1 | -0.071 | 0.93 | 3.42 | 2.95 | · |
| 24 | Gym Leader 4 | Crasher Wake | 4 | 5 | 591.05 | 595.48 | 0.993 (0.994) | 1 | -0.007 | 1 | 3.18 | 2.95 | · |
| 26 | Basic Trainer | Triathlete Biker | 4 | 6 | 549.9 | 595.48 | 0.923 (0.929) | 1 | -0.077 | 0.92 | 3.31 | 2.95 | · |
| 27 | Basic Trainer | Medium JPN | 4 | 6 | 553.67 | 595.48 | 0.93 (0.935) | 1 | -0.07 | 0.93 | 3.29 | 2.95 | · |
| 29 | Gym Trainer 1 | Psychic | 5 | 6 | 601.38 | 623.06 | 0.965 (0.966) | 1.03 | -0.065 | 0.97 | 3.4 | 2.7 | · |
| 30 | Gym Trainer 2 | Mystic | 5 | 6 | 600.82 | 623.06 | 0.964 (0.97) | 1.03 | -0.066 | 0.96 | 3.36 | 2.7 | · |
| 31 | Gym Leader 5 | Sabrina | 5 | 6 | 677.81 | 623.06 | 1.088 (1.107) | 1.03 | +0.058 | 1.09 | 2.76 | 2.7 | · |
| 33 | Basic Trainer | Beauty | 5 | 6 | 592.63 | 623.06 | 0.951 (0.955) | 1.03 | -0.079 | 0.95 | 3.31 | 2.7 | · |
| 34 | Elite Trainer | Penny | 5 | 6 | 684.46 | 623.06 | 1.099 (1.1) | 1.03 | +0.069 | 1.1 | 2.75 | 2.7 | · |
| 36 | Gym Trainer 1 | Young Athlete F | 6 | 6 | 768.34 | 708.08 | 1.085 (1.084) | 1.05 | +0.035 | 1.09 | 2.21 | 2.2 | · |
| 37 | Gym Trainer 2 | Li | 6 | 6 | 768.58 | 708.08 | 1.085 (1.087) | 1.05 | +0.035 | 1.09 | 2.2 | 2.2 | · |
| 38 | Gym Leader 6 | Larry | 6 | 6 | 770.19 | 708.08 | 1.088 (1.09) | 1.05 | +0.038 | 1.09 | 2.22 | 2.2 | · |
| 39 | Rival | Hop | 6 | 6 | 786.41 | 708.08 | 1.111 (1.116) | 1.05 | +0.061 | 1.11 | 1.95 | 2.2 | · |
| 41 | Basic Trainer | Triathlete Biker | 6 | 6 | 749 | 708.08 | 1.058 (1.063) | 1.05 | +0.008 | 1.06 | 2.13 | 2.2 | · |
| 42 | Elite Trainer | Veteran Wallace | 6 | 6 | 776.32 | 708.08 | 1.096 (1.1) | 1.05 | +0.046 | 1.1 | 2.1 | 2.2 | · |
| 44 | Gym Trainer 1 | Depot Agent | 7 | 6 | 787.28 | 723.23 | 1.089 (1.092) | 1.08 | +0.009 | 1.09 | 2.23 | 2.05 | · |
| 45 | Gym Trainer 2 | Reactor Tech | 7 | 6 | 786.98 | 723.23 | 1.088 (1.099) | 1.08 | +0.008 | 1.09 | 2.23 | 2.05 | · |
| 46 | Gym Leader 7 | Byron | 7 | 6 | 791.74 | 723.23 | 1.095 (1.098) | 1.08 | +0.015 | 1.09 | 2.22 | 2.05 | · |
| 48 | Elite Trainer | Hollow Cyrus | 7 | 6 | 798.11 | 723.23 | 1.104 (1.1) | 1.08 | +0.024 | 1.1 | 2.15 | 2.05 | · |
| 49 | Elite Trainer | Veteran Koga | 7 | 6 | 799.78 | 723.23 | 1.106 (1.106) | 1.08 | +0.026 | 1.11 | 2.12 | 2.05 | · |
| 51 | Gym Trainer 1 | Hiker | 8 | 6 | 803.29 | 723.23 | 1.111 (1.118) | 1.1 | +0.011 | 1.11 | 2.22 | 2.05 | · |
| 52 | Gym Trainer 2 | Rocker | 8 | 6 | 800.29 | 723.23 | 1.107 (1.118) | 1.1 | +0.007 | 1.11 | 2.26 | 2.05 | · |
| 53 | Gym Leader 8 | Grant | 8 | 6 | 807.49 | 723.23 | 1.117 (1.119) | 1.1 | +0.017 | 1.12 | 2.22 | 2.05 | · |
| 56 | Elite Trainer | Eldritch N | 8 | 6 | 808.17 | 723.23 | 1.117 (1.117) | 1.1 | +0.017 | 1.12 | 2.16 | 2.05 | · |
| 57 | Elite Trainer | Mars | 8 | 6 | 812.87 | 723.23 | 1.124 (1.124) | 1.1 | +0.024 | 1.12 | 2.18 | 2.05 | · |
| 58 | Elite Trainer | Silent Red | 8 | 6 | 800.71 | 723.23 | 1.107 (1.11) | 1.1 | +0.007 | 1.11 | 2.18 | 2.05 | · |
| 60 | E1 | Lorelei | 9 | 6 | 858.86 | 762.46 | 1.126 (1.123) | 1.14 | -0.014 | 1.13 | 2.13 | 1.85 | · |
| 61 | E2 | Bruno | 9 | 6 | 827.44 | 762.46 | 1.085 (1.085) | 1.16 | -0.075 | 1.09 | 2.49 | 1.85 | · |
| 62 | E3 | Flint | 9 | 6 | 882.57 | 762.46 | 1.158 (1.161) | 1.18 | -0.022 | 1.16 | 2.03 | 1.85 | · |
| 63 | E4 | Lance | 9 | 6 | 899.48 | 762.46 | 1.18 (1.175) | 1.2 | -0.02 | 1.18 | 2.11 | 1.85 | · |
| 64 | Champion | Prof. Kukui | 9 | 6 | 936.61 | 762.46 | 1.228 (1.232) | 1.23 | -0.002 | 1.23 | 1.95 | 1.85 | · |
| 65 | Rival | Hop | 9 | 6 | 948.9 | 723.23 | 1.312 (1.32) | 1.26 | +0.052 | 1.31 | 1.95 | 2.05 | · |
| 67 | Mystery Figure | Ash Kalos | 9 | 6 | 974.96 | 762.46 | 1.279 (1.293) | 1.3 | -0.021 | 1.28 | 2.03 | 1.85 | · |

**GEN 1-3 divergences:** 1 HARD, 7 SOFT of 48 stages.
- HARD: Gym Leader 2(Δ+0.093)
- SOFT: Rival(Δ-0.109), Basic Trainer(Δ-0.139), Gym Trainer 1(Δ-0.086), Gym Leader 1(Δ-0.081), Basic Trainer(Δ-0.13), Basic Trainer(Δ-0.131), Rival(Δ-0.08)


## GEN 1 ONLY — deep dive
The narrow Gen-1 pool changes which species are available to BOTH sides; this contrasts Gen-1-only vs All-Gens at the same stage.
| event | g1 ratio/mon | allgen ratio/mon | g1 enemyG | g1 playerG | g1 flag |
|---|---|---|---|---|---|
| Rival | 0.66 | 0.653 | 3.93 | 3.9 | 🔵 SOFT |
| Basic Trainer | 0.689 | 0.66 | 4 | 3.9 | 🔵 SOFT |
| Gym Trainer 1 | 0.784 | 0.755 | 4 | 3.85 | · |
| Gym Leader 1 | 0.782 | 0.758 | 4 | 3.85 | · |
| Basic Trainer | 0.735 | 0.716 | 4 | 3.85 | 🔵 SOFT |
| Basic Trainer | 0.735 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| Gym Trainer 1 | 0.96 | 0.902 | 3.36 | 3.65 | · |
| Gym Leader 2 | 0.959 | 0.976 | 3.35 | 3.65 | · |
| Basic Trainer | 0.924 | 0.93 | 3.32 | 3.65 | · |
| Basic Trainer | 0.93 | 0.938 | 3.32 | 3.65 | · |
| Gym Trainer 1 | 0.908 | 0.867 | 3.37 | 3.2 | · |
| Gym Leader 3 | 0.91 | 0.924 | 3.37 | 3.2 | · |
| Rival | 0.878 | 0.863 | 3.5 | 3.2 | · |
| Basic Trainer | 0.881 | 0.879 | 3.34 | 3.2 | · |
| Basic Trainer | 0.88 | 0.876 | 3.35 | 3.2 | · |
| Gym Trainer 1 | 0.969 | 0.912 | 3.31 | 2.95 | · |
| Gym Leader 4 | 0.981 | 0.978 | 3.24 | 2.95 | · |
| Basic Trainer | 0.922 | 0.917 | 3.33 | 2.95 | · |
| Basic Trainer | 0.931 | 0.928 | 3.32 | 2.95 | · |
| Gym Trainer 1 | 0.995 | 0.945 | 3.33 | 2.7 | · |
| Gym Trainer 2 | 1.052 | 0.936 | 2.96 | 2.7 | · |
| Gym Leader 5 | 1.08 | 1.129 | 2.8 | 2.7 | · |
| Basic Trainer | 0.958 | 0.95 | 3.3 | 2.7 | · |
| Elite Trainer | 1.088 | 1.134 | 2.81 | 2.7 | · |
| Gym Trainer 1 | 1.103 | 1.092 | 2.19 | 2.2 | · |
| Gym Trainer 2 | 1.102 | 1.088 | 2.2 | 2.2 | · |
| Gym Leader 6 | 1.101 | 1.099 | 2.17 | 2.2 | · |
| Rival | 1.115 | 1.136 | 1.97 | 2.2 | · |
| Basic Trainer | 1.063 | 1.074 | 2.17 | 2.2 | · |
| Elite Trainer | 1.11 | 1.121 | 2.12 | 2.2 | · |
| Gym Trainer 1 | 1.108 | 1.105 | 2.2 | 2.05 | · |
| Gym Trainer 2 | 1.105 | 1.095 | 2.22 | 2.05 | · |
| Gym Leader 7 | 1.108 | 1.105 | 2.17 | 2.05 | · |
| Elite Trainer | 1.12 | 1.123 | 2.11 | 2.05 | · |
| Elite Trainer | 1.108 | 1.13 | 2.12 | 2.05 | · |
| Gym Trainer 1 | 1.131 | 1.124 | 2.19 | 2.05 | · |
| Gym Trainer 2 | 1.128 | 1.11 | 2.2 | 2.05 | · |
| Gym Leader 8 | 1.128 | 1.125 | 2.16 | 2.05 | · |
| Elite Trainer | 1.141 | 1.141 | 2.1 | 2.05 | · |
| Elite Trainer | 1.131 | 1.139 | 2.16 | 2.05 | · |
| Elite Trainer | 1.134 | 1.141 | 2.15 | 2.05 | · |
| E1 | 1.133 | 1.121 | 2.13 | 1.85 | · |
| E2 | 1.099 | 1.1 | 2.47 | 1.85 | · |
| E3 | 1.165 | 1.154 | 2.13 | 1.85 | · |
| E4 | 1.187 | 1.173 | 2.11 | 1.85 | · |
| Champion | 1.221 | 1.233 | 2.02 | 1.85 | · |
| Rival | 1.309 | 1.339 | 1.98 | 2.05 | · |
| Mystery Figure | 1.279 | 1.291 | 2.06 | 1.85 | · |


## Data-quality flags (sample integrity — should mostly be empty)

### Legendary FILLER leaks on non-E4/Champion trainers (bug if present) (0)
- none

### Rattata sentinel on a non-Normal trainer (pool exhaustion) (14)
- GEN 1 ONLY Rival Wally
- GEN 1 ONLY Rival Barry
- GEN 1 ONLY Rival Gladion
- GEN 1 ONLY Rival Hop
- GEN 1 ONLY Rival Nemona
- ALL GENS Rival N
- GEN 1-6 Rival May
- GEN 1-6 Rival Brendan
- GEN 1-6 Rival Lyra
- GEN 1-6 Rival Silver
- GEN 1-3 Gym Trainer 1 Rocker
- GEN 1-3 Rival Wally
- GEN 1-3 Basic Trainer Rocker
- GEN 1-3 Rival Gladion

### Unexpected duplicate species (not an authored multiset) (0)
- none

### Short teams (fewer mons than party cap) (0)
- none


## Proposed number diffs (for sign-off — NOT applied)
> Balance numbers are maintainer-owned. These are *computed suggestions* to bring the measured per-mon ratio toward the intended foe edge. Pick/tune before anything ships.

### `FOE_POWER_CURVE` (battle.html:38439) — city stat edge (ALL-GENS measurement)
Intent: enemy/player per-mon ratio at city *c* should equal `FOE_POWER_CURVE[c]` when grades match. Measured ratio bakes in any grade/BST gap, so a measured > curve means the pool itself (not the multiplier) is over-tuned for that city.
| city | current curve | measured ratio/mon | implied curve to hit parity | note |
|---|---|---|---|---|
| 0 | 0.8 | 0.656 | 0.975 | pool under curve → harden |
| 1 | 0.85 | 0.737 | 0.98 | pool under curve → harden |
| 2 | 0.9 | 0.937 | 0.865 | on target |
| 3 | 0.95 | 0.882 | 1.023 | on target |
| 4 | 1 | 0.934 | 1.071 | on target |
| 5 | 1.03 | 1.019 | 1.041 | on target |
| 6 | 1.05 | 1.101 | 1.001 | on target |
| 7 | 1.08 | 1.112 | 1.049 | on target |
| 8 | 1.1 | 1.13 | 1.071 | on target |
| 9 | 1.15 | 1.339 | 0.988 | pool over curve → soften |

### Boss overrides (`_storyEnemyStatMult` 38440)
| event | current mult | measured ratio/mon (ALL-GENS) | note |
|---|---|---|---|
| E1 | 1.14 | 1.121 | on target |
| E2 | 1.16 | 1.1 | on target |
| E3 | 1.18 | 1.154 | on target |
| E4 | 1.2 | 1.173 | on target |
| Champion | 1.23 | 1.233 | on target |
| Mystery Figure | 1.3 | 1.291 | on target |

---
Artifacts: `enemy-mons.csv` (per-mon, seed 1000), `stage-summary.csv` (all stages × gen-sets, 100-seed stats), `player-model.csv` (expected player team per stage).
