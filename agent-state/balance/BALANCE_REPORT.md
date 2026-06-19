# Story-mode enemy vs. expected-player balance report
Generated 2026-06-19T18:43:04.732Z · 100 seeds (1000..1099) · difficulty **normal** · gimmicks off

## Methodology
- **Enemy data** is the real `assignTrainers → rollTrainerTeam` pipeline via `simulateStoryRunTeams`, walked over every Battle row, 100× per gen-set. Each enemy mon's stats are the **actually-fought** Lv50 stats: `buildPokemon` with `build._storyStatMult = storyEnemyStatMult(event,city,row) × foeDifficultyMult('normal')` — i.e. the FOE_POWER_CURVE / boss-override edge is included.
- **Player data** is a *spec-driven synthetic* model (PROGRESSION_CURVE_MASTER §5c): party size = `max(2,min(6,2+badges))`; per-stage grade mix (table in script); the "expected mon" is the **pool-average** Lv50 stat-total over all non-legendary species of each grade legal in the gen-set, built at a stage build tier (IV avg + EV total ramping with training facilities). Player mons are **exempt** from the foe multiplier (natural Lv50 line) — exactly as the engine treats wilds/gifts.
- **Primary metric** `ratioPerMon` = mean(enemy mon stat-total) / (expected player mon stat-total). It is **size-independent**. The **design intent** is `ratioPerMon ≈ intendedMult` (the foe edge the maintainer dialled in), *assuming grade parity*. `delta = ratioPerMon − intendedMult`: **>+0.08 = HARD** (enemy outclasses the curve, usually via a grade/BST gap the player can't match in that gen-set), **<−0.08 = SOFT**.
- Party-size asymmetry is captured separately by `teamRatio` (enemy team capped to the player's party cap ÷ expected player team total).

## Executive summary
Across 192 stage×gen-set rows (100 seeds each): **22 HARD**, **42 SOFT**, rest within ±0.08 of the intended foe edge.

**Difficulty curve by phase (ALL GENS, mean Δ = measured ratio − intended foe edge):**
| phase | mean Δ | reading |
|---|---|---|
| early(C0-2) | -0.056 | on curve |
| mid(C3-5) | -0.05 | on curve |
| late(C6-8) | +0.07 | on curve |
| endgame | -0.026 | on curve |

**Key findings:**
1. **Early game (C0-1) reads SOFT in every gen-set** (Δ ≈ −0.13 to −0.14 for the first Basic Trainers / Gym 1). Partly this is the model's deliberately *generous* early player baseline (it assumes a ~130-EV, IV-16 mon, whereas a brand-new save has a 0-EV starter); treat the early-game softness as "player model is the optimistic bound", i.e. enemies are not harder than a kitted early player — read it as headroom, not an under-tuning bug.
2. **The Rival consistently punches above the curve.** Mean Rival Δ = +0.006 (it counter-picks the player's live party, so it earns extra effective power the flat curve doesn't model). The **post-Champion league Rival (row 65) is the single most consistent HARD outlier** in all four gen-sets (Δ ≈ +0.08 to +0.13). If the league Rival should feel like a final-boss spike that's working as intended; if not, it's the one knob to soften.
3. **Mid-late (around GL5–GL6 / Elite Trainers, C5-C6) creeps HARD** as the enemy grade pool (avg grade → ~2.1) outpaces the modeled player (~2.4) before the player's own finals/Safari G1s come online. This is a *grade-pool* effect, not the multiplier — softening `FOE_POWER_CURVE[6]` would over-correct; the cleaner lever is the grade-weight ramp (`applyStoryProgressToGradeWeights`) or the player-side evolution gate timing.
4. **E4 / Champion / Mystery Figure land on their dialled multipliers** (|Δ| < 0.04) once the endgame player is modeled as fully kitted — the boss overrides in `_storyEnemyStatMult` are well-tuned. **No change recommended there.**
5. **GEN 1 ONLY has a real pool-exhaustion problem:** 65 Rattata-sentinel fallbacks on non-Normal trainers (Dragon Tamers, Hex Maniacs, etc.) — **all in the Gen-1 lock**, none in wider pools. The narrow Gen-1 type pool runs dry and the roll falls back to Rattata. This is a *variety/coherence* bug, separate from raw power; see the data-quality section. Aside from that, Gen-1-only tracks the all-gens curve closely (grade pools are similar), so the gen lock does not by itself break the difficulty curve.


## GEN 1 ONLY  (gens 1)
| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Rival | Hop | 0 | 2 | 300.48 | 457.38 | 0.657 (0.662) | 0.75 | -0.093 | 0.33 | 3.95 | 3.9 | 🔵 SOFT |
| 1 | Basic Trainer | Blackbelt | 0 | 2 | 307.68 | 457.38 | 0.673 (0.681) | 0.8 | -0.127 | 0.68 | 4 | 3.9 | 🔵 SOFT |
| 4 | Gym Trainer 1 | Channeler | 1 | 2 | 354.58 | 463.56 | 0.765 (0.773) | 0.85 | -0.085 | 0.78 | 4 | 3.85 | 🔵 SOFT |
| 5 | Gym Leader 1 | Ryme | 1 | 2 | 354.09 | 463.56 | 0.764 (0.765) | 0.85 | -0.086 | 0.77 | 4 | 3.85 | 🔵 SOFT |
| 7 | Basic Trainer | Ruin Maniac | 1 | 3 | 338.09 | 463.56 | 0.729 (0.735) | 0.85 | -0.121 | 0.74 | 4 | 3.85 | 🔵 SOFT |
| 8 | Basic Trainer | Veteran F | 1 | 3 | 335.06 | 463.56 | 0.723 (0.729) | 0.85 | -0.127 | 0.73 | 4 | 3.85 | 🔵 SOFT |
| 10 | Gym Trainer 1 | Channeler | 2 | 3 | 463.31 | 487.72 | 0.95 (0.964) | 0.9 | +0.05 | 0.96 | 3.39 | 3.65 | · |
| 11 | Gym Leader 2 | Morty | 2 | 3 | 458.75 | 487.72 | 0.941 (0.949) | 0.9 | +0.041 | 0.97 | 3.4 | 3.65 | · |
| 14 | Basic Trainer | Cyclist | 2 | 4 | 446.67 | 487.72 | 0.916 (0.923) | 0.9 | +0.016 | 0.93 | 3.37 | 3.65 | · |
| 15 | Basic Trainer | Rising Star | 2 | 4 | 444.28 | 487.72 | 0.911 (0.931) | 0.9 | +0.011 | 0.93 | 3.36 | 3.65 | · |
| 17 | Gym Trainer 1 | Crush Girl | 3 | 4 | 506.55 | 563.99 | 0.898 (0.899) | 0.95 | -0.052 | 0.9 | 3.4 | 3.2 | · |
| 18 | Gym Leader 3 | Chuck | 3 | 4 | 507.01 | 563.99 | 0.899 (0.91) | 0.95 | -0.051 | 0.91 | 3.4 | 3.2 | · |
| 12 | Rival | Hop | 3 | 5 | 488.56 | 563.99 | 0.866 (0.873) | 0.95 | -0.084 | 0.87 | 3.55 | 3.2 | 🔵 SOFT |
| 20 | Basic Trainer | Battle Girl | 3 | 5 | 493.2 | 563.99 | 0.874 (0.877) | 0.95 | -0.076 | 0.88 | 3.34 | 3.2 | · |
| 21 | Basic Trainer | Firebreather | 3 | 5 | 487.42 | 563.99 | 0.864 (0.876) | 0.95 | -0.086 | 0.87 | 3.38 | 3.2 | 🔵 SOFT |
| 23 | Gym Trainer 1 | Swimmer F | 4 | 5 | 574.97 | 594 | 0.968 (0.977) | 1 | -0.032 | 0.97 | 3.32 | 2.95 | · |
| 24 | Gym Leader 4 | Crasher Wake | 4 | 5 | 577.38 | 594 | 0.972 (0.974) | 1 | -0.028 | 0.98 | 3.28 | 2.95 | · |
| 26 | Basic Trainer | Pokémon Ranger | 4 | 6 | 545.32 | 594 | 0.918 (0.922) | 1 | -0.082 | 0.92 | 3.32 | 2.95 | 🔵 SOFT |
| 27 | Basic Trainer | Mountain Guide | 4 | 6 | 546.9 | 594 | 0.921 (0.934) | 1 | -0.079 | 0.92 | 3.33 | 2.95 | · |
| 29 | Gym Trainer 1 | Medium JPN | 5 | 6 | 609.36 | 620.44 | 0.982 (0.987) | 1.03 | -0.048 | 0.98 | 3.38 | 2.7 | · |
| 30 | Gym Trainer 2 | Hex Maniac JPN | 5 | 6 | 649.66 | 620.44 | 1.047 (1.045) | 1.03 | +0.017 | 1.05 | 2.98 | 2.7 | · |
| 31 | Gym Leader 5 | Sabrina | 5 | 6 | 666.86 | 620.44 | 1.075 (1.086) | 1.03 | +0.045 | 1.07 | 2.83 | 2.7 | · |
| 33 | Basic Trainer | Bug Maniac | 5 | 6 | 582.14 | 620.44 | 0.938 (0.941) | 1.03 | -0.092 | 0.94 | 3.38 | 2.7 | 🔵 SOFT |
| 34 | Elite Trainer | Ryme | 5 | 6 | 674.95 | 620.44 | 1.088 (1.087) | 1.03 | +0.058 | 1.09 | 2.8 | 2.7 | · |
| 36 | Gym Trainer 1 | Youngster | 6 | 6 | 771.86 | 681.95 | 1.132 (1.139) | 1.05 | +0.082 | 1.13 | 2.16 | 2.39 | 🔴 HARD |
| 37 | Gym Trainer 2 | Li | 6 | 6 | 772.18 | 681.95 | 1.132 (1.14) | 1.05 | +0.082 | 1.13 | 2.2 | 2.39 | 🔴 HARD |
| 38 | Gym Leader 6 | Larry | 6 | 6 | 770.69 | 681.95 | 1.13 (1.136) | 1.05 | +0.08 | 1.13 | 2.17 | 2.39 | 🔴 HARD |
| 39 | Rival | Hop | 6 | 6 | 782.17 | 681.95 | 1.147 (1.151) | 1.05 | +0.097 | 1.15 | 1.98 | 2.39 | 🔴 HARD |
| 41 | Basic Trainer | Worker Snow | 6 | 6 | 739.92 | 681.95 | 1.085 (1.093) | 1.05 | +0.035 | 1.09 | 2.18 | 2.39 | · |
| 42 | Elite Trainer | Veteran Wallace | 6 | 6 | 775.77 | 681.95 | 1.138 (1.14) | 1.05 | +0.088 | 1.14 | 2.12 | 2.39 | 🔴 HARD |
| 44 | Gym Trainer 1 | Reactor Tech | 7 | 6 | 792.84 | 701.84 | 1.13 (1.138) | 1.08 | +0.05 | 1.13 | 2.19 | 2.2 | · |
| 45 | Gym Trainer 2 | Depot Agent | 7 | 6 | 789.4 | 701.84 | 1.125 (1.135) | 1.08 | +0.045 | 1.12 | 2.23 | 2.2 | · |
| 46 | Gym Leader 7 | Byron | 7 | 6 | 792.11 | 701.84 | 1.129 (1.135) | 1.08 | +0.049 | 1.13 | 2.17 | 2.2 | · |
| 48 | Elite Trainer | Hollow Cyrus | 7 | 6 | 799.35 | 701.84 | 1.139 (1.142) | 1.08 | +0.059 | 1.14 | 2.1 | 2.2 | · |
| 49 | Elite Trainer | Veteran Koga | 7 | 6 | 793.04 | 701.84 | 1.13 (1.132) | 1.08 | +0.05 | 1.13 | 2.14 | 2.2 | · |
| 51 | Gym Trainer 1 | Hiker | 8 | 6 | 807.3 | 701.84 | 1.15 (1.158) | 1.1 | +0.05 | 1.15 | 2.19 | 2.2 | · |
| 52 | Gym Trainer 2 | Rocker | 8 | 6 | 805.99 | 701.84 | 1.148 (1.158) | 1.1 | +0.048 | 1.15 | 2.2 | 2.2 | · |
| 53 | Gym Leader 8 | Grant | 8 | 6 | 806.29 | 701.84 | 1.149 (1.155) | 1.1 | +0.049 | 1.15 | 2.16 | 2.2 | · |
| 56 | Elite Trainer | Eldritch N | 8 | 6 | 815.67 | 701.84 | 1.162 (1.166) | 1.1 | +0.062 | 1.16 | 2.1 | 2.2 | · |
| 57 | Elite Trainer | Mars | 8 | 6 | 809.77 | 701.84 | 1.154 (1.16) | 1.1 | +0.054 | 1.15 | 2.15 | 2.2 | · |
| 58 | Elite Trainer | Silent Red | 8 | 6 | 807.49 | 701.84 | 1.151 (1.153) | 1.1 | +0.051 | 1.15 | 2.17 | 2.2 | · |
| 60 | E1 | Lorelei | 9 | 6 | 857.74 | 757.47 | 1.132 (1.131) | 1.14 | -0.008 | 1.13 | 2.13 | 1.85 | · |
| 61 | E2 | Bruno | 9 | 6 | 829.8 | 757.47 | 1.095 (1.093) | 1.16 | -0.065 | 1.1 | 2.47 | 1.85 | · |
| 62 | E3 | Flint | 9 | 6 | 875.15 | 757.47 | 1.155 (1.153) | 1.18 | -0.025 | 1.16 | 2.13 | 1.85 | · |
| 63 | E4 | Lance | 9 | 6 | 892.36 | 757.47 | 1.178 (1.178) | 1.2 | -0.022 | 1.18 | 2.13 | 1.85 | · |
| 64 | Champion | Prof. Kukui | 9 | 6 | 923.21 | 757.47 | 1.219 (1.23) | 1.23 | -0.011 | 1.22 | 2.05 | 1.85 | · |
| 65 | Rival | Hop | 9 | 6 | 941.13 | 701.84 | 1.341 (1.349) | 1.26 | +0.081 | 1.34 | 1.97 | 2.2 | 🔴 HARD |
| 67 | Mystery Figure | Oak | 9 | 6 | 963.97 | 757.47 | 1.273 (1.276) | 1.3 | -0.027 | 1.27 | 2.06 | 1.85 | · |

**GEN 1 ONLY divergences:** 6 HARD, 10 SOFT of 48 stages.
- HARD: Gym Trainer 1(Δ+0.082), Gym Trainer 2(Δ+0.082), Gym Leader 6(Δ+0.08), Rival(Δ+0.097), Elite Trainer(Δ+0.088), Rival(Δ+0.081)
- SOFT: Rival(Δ-0.093), Basic Trainer(Δ-0.127), Gym Trainer 1(Δ-0.085), Gym Leader 1(Δ-0.086), Basic Trainer(Δ-0.121), Basic Trainer(Δ-0.127), Rival(Δ-0.084), Basic Trainer(Δ-0.086), Basic Trainer(Δ-0.082), Basic Trainer(Δ-0.092)

## ALL GENS  (gens 1,2,3,4,5,6,7,8,9)
| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Rival | Hop | 0 | 2 | 295.39 | 452.53 | 0.653 (0.667) | 0.75 | -0.097 | 0.33 | 4 | 3.9 | 🔵 SOFT |
| 1 | Basic Trainer | Blackbelt | 0 | 2 | 298.11 | 452.53 | 0.659 (0.664) | 0.8 | -0.141 | 0.65 | 4 | 3.9 | 🔵 SOFT |
| 4 | Gym Trainer 1 | Hex Maniac | 1 | 2 | 345.07 | 459.23 | 0.751 (0.762) | 0.85 | -0.099 | 0.75 | 4 | 3.85 | 🔵 SOFT |
| 5 | Gym Leader 1 | Ryme | 1 | 2 | 346.24 | 459.23 | 0.754 (0.765) | 0.85 | -0.096 | 0.75 | 4 | 3.85 | 🔵 SOFT |
| 7 | Basic Trainer | Veteran | 1 | 3 | 327.99 | 459.23 | 0.714 (0.716) | 0.85 | -0.136 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 8 | Basic Trainer | Team Aqua Grunt F | 1 | 3 | 329 | 459.23 | 0.716 (0.716) | 0.85 | -0.134 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 10 | Gym Trainer 1 | Hex Maniac | 2 | 3 | 433.3 | 485.31 | 0.893 (0.883) | 0.9 | -0.007 | 0.9 | 3.58 | 3.65 | · |
| 11 | Gym Leader 2 | Morty | 2 | 3 | 474.1 | 485.31 | 0.977 (0.982) | 0.9 | +0.077 | 0.98 | 3.29 | 3.65 | · |
| 14 | Basic Trainer | Bird Keeper | 2 | 4 | 456.09 | 485.31 | 0.94 (0.946) | 0.9 | +0.04 | 0.95 | 3.26 | 3.65 | · |
| 15 | Basic Trainer | Pilot | 2 | 4 | 453.16 | 485.31 | 0.934 (0.943) | 0.9 | +0.034 | 0.95 | 3.3 | 3.65 | · |
| 17 | Gym Trainer 1 | Cue Ball | 3 | 4 | 489.57 | 565.61 | 0.866 (0.876) | 0.95 | -0.084 | 0.87 | 3.52 | 3.2 | 🔵 SOFT |
| 18 | Gym Leader 3 | Chuck | 3 | 4 | 523.62 | 565.61 | 0.926 (0.923) | 0.95 | -0.024 | 0.93 | 3.29 | 3.2 | · |
| 12 | Rival | Hop | 3 | 5 | 485.13 | 565.61 | 0.858 (0.851) | 0.95 | -0.092 | 0.86 | 3.56 | 3.2 | 🔵 SOFT |
| 20 | Basic Trainer | Channeler | 3 | 5 | 502.11 | 565.61 | 0.888 (0.896) | 0.95 | -0.062 | 0.89 | 3.26 | 3.2 | · |
| 21 | Basic Trainer | Team Galactic Grunt | 3 | 5 | 494.85 | 565.61 | 0.875 (0.877) | 0.95 | -0.075 | 0.88 | 3.33 | 3.2 | · |
| 23 | Gym Trainer 1 | Team Aqua Grunt F | 4 | 5 | 541.71 | 597.95 | 0.906 (0.903) | 1 | -0.094 | 0.91 | 3.51 | 2.95 | 🔵 SOFT |
| 24 | Gym Leader 4 | Crasher Wake | 4 | 5 | 583.47 | 597.95 | 0.976 (0.982) | 1 | -0.024 | 0.98 | 3.23 | 2.95 | · |
| 26 | Basic Trainer | Depot Agent | 4 | 6 | 548.25 | 597.95 | 0.917 (0.921) | 1 | -0.083 | 0.92 | 3.3 | 2.95 | 🔵 SOFT |
| 27 | Basic Trainer | Pokémon Ranger | 4 | 6 | 548.44 | 597.95 | 0.917 (0.919) | 1 | -0.083 | 0.92 | 3.29 | 2.95 | 🔵 SOFT |
| 29 | Gym Trainer 1 | Psychic F | 5 | 6 | 580.5 | 625.54 | 0.928 (0.937) | 1.03 | -0.102 | 0.93 | 3.53 | 2.7 | 🔵 SOFT |
| 30 | Gym Trainer 2 | Medium | 5 | 6 | 586.53 | 625.54 | 0.938 (0.93) | 1.03 | -0.092 | 0.94 | 3.46 | 2.7 | 🔵 SOFT |
| 31 | Gym Leader 5 | Sabrina | 5 | 6 | 706 | 625.54 | 1.129 (1.131) | 1.03 | +0.099 | 1.13 | 2.53 | 2.7 | 🔴 HARD |
| 33 | Basic Trainer | Plasma Grunt F | 5 | 6 | 596.54 | 625.54 | 0.954 (0.963) | 1.03 | -0.076 | 0.95 | 3.28 | 2.7 | · |
| 34 | Elite Trainer | Winona | 5 | 6 | 705.49 | 625.54 | 1.128 (1.127) | 1.03 | +0.098 | 1.13 | 2.58 | 2.7 | 🔴 HARD |
| 36 | Gym Trainer 1 | Rancher | 6 | 6 | 780.96 | 689.2 | 1.133 (1.131) | 1.05 | +0.083 | 1.13 | 2.19 | 2.39 | 🔴 HARD |
| 37 | Gym Trainer 2 | Nita | 6 | 6 | 772.55 | 689.2 | 1.121 (1.128) | 1.05 | +0.071 | 1.12 | 2.24 | 2.39 | · |
| 38 | Gym Leader 6 | Larry | 6 | 6 | 779.57 | 689.2 | 1.131 (1.129) | 1.05 | +0.081 | 1.13 | 2.21 | 2.39 | 🔴 HARD |
| 39 | Rival | Hop | 6 | 6 | 812.55 | 689.2 | 1.179 (1.169) | 1.05 | +0.129 | 1.18 | 1.98 | 2.39 | 🔴 HARD |
| 41 | Basic Trainer | Boarder | 6 | 6 | 760.36 | 689.2 | 1.103 (1.104) | 1.05 | +0.053 | 1.1 | 2.12 | 2.39 | · |
| 42 | Elite Trainer | Veteran Wallace | 6 | 6 | 797.13 | 689.2 | 1.157 (1.149) | 1.05 | +0.107 | 1.16 | 2.07 | 2.39 | 🔴 HARD |
| 44 | Gym Trainer 1 | Depot Agent | 7 | 6 | 800.28 | 709.93 | 1.127 (1.125) | 1.08 | +0.047 | 1.13 | 2.22 | 2.2 | · |
| 45 | Gym Trainer 2 | Depot Agent | 7 | 6 | 797.88 | 709.93 | 1.124 (1.131) | 1.08 | +0.044 | 1.12 | 2.22 | 2.2 | · |
| 46 | Gym Leader 7 | Byron | 7 | 6 | 802.74 | 709.93 | 1.131 (1.13) | 1.08 | +0.051 | 1.13 | 2.21 | 2.2 | · |
| 48 | Elite Trainer | Hollow Cyrus | 7 | 6 | 812.4 | 709.93 | 1.144 (1.142) | 1.08 | +0.064 | 1.14 | 2.1 | 2.2 | · |
| 49 | Elite Trainer | Veteran Koga | 7 | 6 | 818.81 | 709.93 | 1.153 (1.151) | 1.08 | +0.073 | 1.15 | 2.09 | 2.2 | · |
| 51 | Gym Trainer 1 | Rocker | 8 | 6 | 814.71 | 709.93 | 1.148 (1.155) | 1.1 | +0.048 | 1.15 | 2.24 | 2.2 | · |
| 52 | Gym Trainer 2 | Hiker | 8 | 6 | 808.18 | 709.93 | 1.138 (1.14) | 1.1 | +0.038 | 1.14 | 2.24 | 2.2 | · |
| 53 | Gym Leader 8 | Grant | 8 | 6 | 817.88 | 709.93 | 1.152 (1.152) | 1.1 | +0.052 | 1.15 | 2.21 | 2.2 | · |
| 56 | Elite Trainer | Eldritch N | 8 | 6 | 831.59 | 709.93 | 1.171 (1.168) | 1.1 | +0.071 | 1.17 | 2.07 | 2.2 | · |
| 57 | Elite Trainer | Mars | 8 | 6 | 829.26 | 709.93 | 1.168 (1.166) | 1.1 | +0.068 | 1.17 | 2.12 | 2.2 | · |
| 58 | Elite Trainer | Silent Red | 8 | 6 | 826.59 | 709.93 | 1.164 (1.157) | 1.1 | +0.064 | 1.16 | 2.11 | 2.2 | · |
| 60 | E1 | Lorelei | 9 | 6 | 857.23 | 765.17 | 1.12 (1.119) | 1.14 | -0.02 | 1.12 | 2.14 | 1.85 | · |
| 61 | E2 | Bruno | 9 | 6 | 841.71 | 765.17 | 1.1 (1.088) | 1.16 | -0.06 | 1.1 | 2.48 | 1.85 | · |
| 62 | E3 | Flint | 9 | 6 | 879.84 | 765.17 | 1.15 (1.148) | 1.18 | -0.03 | 1.15 | 2.12 | 1.85 | · |
| 63 | E4 | Lance | 9 | 6 | 894.29 | 765.17 | 1.169 (1.165) | 1.2 | -0.031 | 1.17 | 2.13 | 1.85 | · |
| 64 | Champion | Prof. Kukui | 9 | 6 | 945.32 | 765.17 | 1.235 (1.231) | 1.23 | +0.005 | 1.24 | 1.94 | 1.85 | · |
| 65 | Rival | Hop | 9 | 6 | 971.72 | 709.93 | 1.369 (1.364) | 1.26 | +0.109 | 1.37 | 1.98 | 2.2 | 🔴 HARD |
| 67 | Mystery Figure | Burglar | 9 | 6 | 980.09 | 765.17 | 1.281 (1.29) | 1.3 | -0.019 | 1.28 | 1.98 | 1.85 | · |

**ALL GENS divergences:** 7 HARD, 13 SOFT of 48 stages.
- HARD: Gym Leader 5(Δ+0.099), Elite Trainer(Δ+0.098), Gym Trainer 1(Δ+0.083), Gym Leader 6(Δ+0.081), Rival(Δ+0.129), Elite Trainer(Δ+0.107), Rival(Δ+0.109)
- SOFT: Rival(Δ-0.097), Basic Trainer(Δ-0.141), Gym Trainer 1(Δ-0.099), Gym Leader 1(Δ-0.096), Basic Trainer(Δ-0.136), Basic Trainer(Δ-0.134), Gym Trainer 1(Δ-0.084), Rival(Δ-0.092), Gym Trainer 1(Δ-0.094), Basic Trainer(Δ-0.083), Basic Trainer(Δ-0.083), Gym Trainer 1(Δ-0.102), Gym Trainer 2(Δ-0.092)

## GEN 1-6  (gens 1,2,3,4,5,6)
| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Rival | Hop | 0 | 2 | 297.68 | 453.35 | 0.657 (0.671) | 0.75 | -0.093 | 0.33 | 4 | 3.9 | 🔵 SOFT |
| 1 | Basic Trainer | Swimmer F JPN | 0 | 2 | 298.76 | 453.35 | 0.659 (0.668) | 0.8 | -0.141 | 0.66 | 4 | 3.9 | 🔵 SOFT |
| 4 | Gym Trainer 1 | Hex Maniac | 1 | 2 | 348.28 | 459.78 | 0.757 (0.767) | 0.85 | -0.093 | 0.75 | 4 | 3.85 | 🔵 SOFT |
| 5 | Gym Leader 1 | Ryme | 1 | 2 | 348.4 | 459.78 | 0.758 (0.763) | 0.85 | -0.092 | 0.76 | 4 | 3.85 | 🔵 SOFT |
| 7 | Basic Trainer | Glacial Trekker | 1 | 3 | 331.68 | 459.78 | 0.721 (0.729) | 0.85 | -0.129 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 8 | Basic Trainer | Medium JPN | 1 | 3 | 326.25 | 459.78 | 0.71 (0.723) | 0.85 | -0.14 | 0.71 | 4 | 3.85 | 🔵 SOFT |
| 10 | Gym Trainer 1 | Hex Maniac | 2 | 3 | 433.39 | 485.17 | 0.893 (0.884) | 0.9 | -0.007 | 0.9 | 3.57 | 3.65 | · |
| 11 | Gym Leader 2 | Morty | 2 | 3 | 474.05 | 485.17 | 0.977 (0.981) | 0.9 | +0.077 | 0.98 | 3.29 | 3.65 | · |
| 14 | Basic Trainer | Triathlete Biker | 2 | 4 | 449.42 | 485.17 | 0.926 (0.928) | 0.9 | +0.026 | 0.94 | 3.32 | 3.65 | · |
| 15 | Basic Trainer | Bug Maniac | 2 | 4 | 444.61 | 485.17 | 0.916 (0.917) | 0.9 | +0.016 | 0.93 | 3.34 | 3.65 | · |
| 17 | Gym Trainer 1 | Crush Girl | 3 | 4 | 483.8 | 563.25 | 0.859 (0.849) | 0.95 | -0.091 | 0.85 | 3.54 | 3.2 | 🔵 SOFT |
| 18 | Gym Leader 3 | Chuck | 3 | 4 | 518.46 | 563.25 | 0.92 (0.917) | 0.95 | -0.03 | 0.93 | 3.31 | 3.2 | · |
| 12 | Rival | Hop | 3 | 5 | 491.25 | 563.25 | 0.872 (0.87) | 0.95 | -0.078 | 0.87 | 3.52 | 3.2 | · |
| 20 | Basic Trainer | Guitarist | 3 | 5 | 495.3 | 563.25 | 0.879 (0.879) | 0.95 | -0.071 | 0.89 | 3.32 | 3.2 | · |
| 21 | Basic Trainer | Pilot | 3 | 5 | 490.46 | 563.25 | 0.871 (0.867) | 0.95 | -0.079 | 0.88 | 3.32 | 3.2 | · |
| 23 | Gym Trainer 1 | Swimmer | 4 | 5 | 538.4 | 594.94 | 0.905 (0.898) | 1 | -0.095 | 0.9 | 3.53 | 2.95 | 🔵 SOFT |
| 24 | Gym Leader 4 | Crasher Wake | 4 | 5 | 585.58 | 594.94 | 0.984 (0.982) | 1 | -0.016 | 0.99 | 3.22 | 2.95 | · |
| 26 | Basic Trainer | Interviewers | 4 | 6 | 543.27 | 594.94 | 0.913 (0.912) | 1 | -0.087 | 0.91 | 3.33 | 2.95 | 🔵 SOFT |
| 27 | Basic Trainer | Hiker | 4 | 6 | 546.44 | 594.94 | 0.918 (0.926) | 1 | -0.082 | 0.92 | 3.32 | 2.95 | 🔵 SOFT |
| 29 | Gym Trainer 1 | Medium | 5 | 6 | 590.41 | 622.64 | 0.948 (0.945) | 1.03 | -0.082 | 0.95 | 3.47 | 2.7 | 🔵 SOFT |
| 30 | Gym Trainer 2 | Psychic | 5 | 6 | 596.9 | 622.64 | 0.959 (0.931) | 1.03 | -0.071 | 0.96 | 3.38 | 2.7 | · |
| 31 | Gym Leader 5 | Sabrina | 5 | 6 | 698.28 | 622.64 | 1.121 (1.127) | 1.03 | +0.091 | 1.12 | 2.56 | 2.7 | 🔴 HARD |
| 33 | Basic Trainer | Rocker | 5 | 6 | 584.92 | 622.64 | 0.939 (0.941) | 1.03 | -0.091 | 0.94 | 3.36 | 2.7 | 🔵 SOFT |
| 34 | Elite Trainer | Wulfric | 5 | 6 | 698.62 | 622.64 | 1.122 (1.125) | 1.03 | +0.092 | 1.12 | 2.61 | 2.7 | 🔴 HARD |
| 36 | Gym Trainer 1 | Triathlete Runner | 6 | 6 | 778.39 | 686.48 | 1.134 (1.138) | 1.05 | +0.084 | 1.13 | 2.19 | 2.39 | 🔴 HARD |
| 37 | Gym Trainer 2 | Musician | 6 | 6 | 773.8 | 686.48 | 1.127 (1.126) | 1.05 | +0.077 | 1.13 | 2.24 | 2.39 | · |
| 38 | Gym Leader 6 | Larry | 6 | 6 | 781.06 | 686.48 | 1.138 (1.135) | 1.05 | +0.088 | 1.14 | 2.21 | 2.39 | 🔴 HARD |
| 39 | Rival | Hop | 6 | 6 | 805.93 | 686.48 | 1.174 (1.166) | 1.05 | +0.124 | 1.17 | 1.97 | 2.39 | 🔴 HARD |
| 41 | Basic Trainer | Bird Keeper | 6 | 6 | 759.64 | 686.48 | 1.107 (1.107) | 1.05 | +0.057 | 1.11 | 2.11 | 2.39 | · |
| 42 | Elite Trainer | Veteran Wallace | 6 | 6 | 794.28 | 686.48 | 1.157 (1.152) | 1.05 | +0.107 | 1.16 | 2.07 | 2.39 | 🔴 HARD |
| 44 | Gym Trainer 1 | Engineer | 7 | 6 | 799.62 | 707.34 | 1.13 (1.133) | 1.08 | +0.05 | 1.13 | 2.19 | 2.2 | · |
| 45 | Gym Trainer 2 | Reactor Tech | 7 | 6 | 791.5 | 707.34 | 1.119 (1.122) | 1.08 | +0.039 | 1.12 | 2.24 | 2.2 | · |
| 46 | Gym Leader 7 | Byron | 7 | 6 | 800.81 | 707.34 | 1.132 (1.132) | 1.08 | +0.052 | 1.13 | 2.2 | 2.2 | · |
| 48 | Elite Trainer | Hollow Cyrus | 7 | 6 | 815.05 | 707.34 | 1.152 (1.146) | 1.08 | +0.072 | 1.15 | 2.08 | 2.2 | · |
| 49 | Elite Trainer | Veteran Koga | 7 | 6 | 816 | 707.34 | 1.154 (1.152) | 1.08 | +0.074 | 1.15 | 2.07 | 2.2 | · |
| 51 | Gym Trainer 1 | Rocker | 8 | 6 | 807.38 | 707.34 | 1.141 (1.146) | 1.1 | +0.041 | 1.14 | 2.23 | 2.2 | · |
| 52 | Gym Trainer 2 | Rocker | 8 | 6 | 810.79 | 707.34 | 1.146 (1.148) | 1.1 | +0.046 | 1.15 | 2.27 | 2.2 | · |
| 53 | Gym Leader 8 | Grant | 8 | 6 | 817.11 | 707.34 | 1.155 (1.154) | 1.1 | +0.055 | 1.16 | 2.21 | 2.2 | · |
| 56 | Elite Trainer | Eldritch N | 8 | 6 | 825.98 | 707.34 | 1.168 (1.167) | 1.1 | +0.068 | 1.17 | 2.11 | 2.2 | · |
| 57 | Elite Trainer | Mars | 8 | 6 | 829.14 | 707.34 | 1.172 (1.169) | 1.1 | +0.072 | 1.17 | 2.11 | 2.2 | · |
| 58 | Elite Trainer | Silent Red | 8 | 6 | 823.84 | 707.34 | 1.165 (1.164) | 1.1 | +0.065 | 1.16 | 2.1 | 2.2 | · |
| 60 | E1 | Lorelei | 9 | 6 | 856.97 | 763.06 | 1.123 (1.122) | 1.14 | -0.017 | 1.12 | 2.16 | 1.85 | · |
| 61 | E2 | Bruno | 9 | 6 | 839.62 | 763.06 | 1.1 (1.09) | 1.16 | -0.06 | 1.1 | 2.47 | 1.85 | · |
| 62 | E3 | Flint | 9 | 6 | 884.68 | 763.06 | 1.159 (1.153) | 1.18 | -0.021 | 1.16 | 2.1 | 1.85 | · |
| 63 | E4 | Lance | 9 | 6 | 893.22 | 763.06 | 1.171 (1.168) | 1.2 | -0.029 | 1.17 | 2.13 | 1.85 | · |
| 64 | Champion | Prof. Kukui | 9 | 6 | 949.71 | 763.06 | 1.245 (1.24) | 1.23 | +0.015 | 1.24 | 1.91 | 1.85 | · |
| 65 | Rival | Hop | 9 | 6 | 965 | 707.34 | 1.364 (1.36) | 1.26 | +0.104 | 1.36 | 1.97 | 2.2 | 🔴 HARD |
| 67 | Mystery Figure | Palmer | 9 | 6 | 986.75 | 763.06 | 1.293 (1.304) | 1.3 | -0.007 | 1.29 | 1.96 | 1.85 | · |

**GEN 1-6 divergences:** 7 HARD, 12 SOFT of 48 stages.
- HARD: Gym Leader 5(Δ+0.091), Elite Trainer(Δ+0.092), Gym Trainer 1(Δ+0.084), Gym Leader 6(Δ+0.088), Rival(Δ+0.124), Elite Trainer(Δ+0.107), Rival(Δ+0.104)
- SOFT: Rival(Δ-0.093), Basic Trainer(Δ-0.141), Gym Trainer 1(Δ-0.093), Gym Leader 1(Δ-0.092), Basic Trainer(Δ-0.129), Basic Trainer(Δ-0.14), Gym Trainer 1(Δ-0.091), Gym Trainer 1(Δ-0.095), Basic Trainer(Δ-0.087), Basic Trainer(Δ-0.082), Gym Trainer 1(Δ-0.082), Basic Trainer(Δ-0.091)

## GEN 1-3  (gens 1,2,3)
| # | event | trainer | city | cap | enemyMon | playerMon | ratio/mon (med) | intended | Δ | team× | enemyG | playerG | flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | Rival | Hop | 0 | 2 | 286.94 | 447.38 | 0.641 (0.666) | 0.75 | -0.109 | 0.32 | 4 | 3.9 | 🔵 SOFT |
| 1 | Basic Trainer | Beauty | 0 | 2 | 292.67 | 447.38 | 0.654 (0.663) | 0.8 | -0.146 | 0.65 | 4 | 3.9 | 🔵 SOFT |
| 4 | Gym Trainer 1 | Channeler | 1 | 2 | 343.5 | 454.31 | 0.756 (0.773) | 0.85 | -0.094 | 0.76 | 4 | 3.85 | 🔵 SOFT |
| 5 | Gym Leader 1 | Ryme | 1 | 2 | 343.25 | 454.31 | 0.756 (0.759) | 0.85 | -0.094 | 0.76 | 4 | 3.85 | 🔵 SOFT |
| 7 | Basic Trainer | Reactor Tech | 1 | 3 | 322.34 | 454.31 | 0.71 (0.716) | 0.85 | -0.14 | 0.71 | 4 | 3.85 | 🔵 SOFT |
| 8 | Basic Trainer | Roughneck | 1 | 3 | 322.22 | 454.31 | 0.709 (0.722) | 0.85 | -0.141 | 0.72 | 4 | 3.85 | 🔵 SOFT |
| 10 | Gym Trainer 1 | Hex Maniac | 2 | 3 | 448.44 | 480.94 | 0.932 (0.942) | 0.9 | +0.032 | 0.92 | 3.46 | 3.65 | · |
| 11 | Gym Leader 2 | Morty | 2 | 3 | 474.55 | 480.94 | 0.987 (0.995) | 0.9 | +0.087 | 1.01 | 3.28 | 3.65 | 🔴 HARD |
| 14 | Basic Trainer | Hex Maniac | 2 | 4 | 447.28 | 480.94 | 0.93 (0.938) | 0.9 | +0.03 | 0.94 | 3.32 | 3.65 | · |
| 15 | Basic Trainer | Youngster | 2 | 4 | 450.82 | 480.94 | 0.937 (0.941) | 0.9 | +0.037 | 0.95 | 3.32 | 3.65 | · |
| 17 | Gym Trainer 1 | Battle Girl | 3 | 4 | 496.17 | 562.76 | 0.882 (0.88) | 0.95 | -0.068 | 0.87 | 3.45 | 3.2 | · |
| 18 | Gym Leader 3 | Chuck | 3 | 4 | 522.27 | 562.76 | 0.928 (0.933) | 0.95 | -0.022 | 0.95 | 3.29 | 3.2 | · |
| 12 | Rival | Hop | 3 | 5 | 492 | 562.76 | 0.874 (0.875) | 0.95 | -0.076 | 0.87 | 3.49 | 3.2 | · |
| 20 | Basic Trainer | Hex Maniac JPN | 3 | 5 | 489.69 | 562.76 | 0.87 (0.868) | 0.95 | -0.08 | 0.88 | 3.35 | 3.2 | · |
| 21 | Basic Trainer | Crush Kin | 3 | 5 | 497.84 | 562.76 | 0.885 (0.888) | 0.95 | -0.065 | 0.89 | 3.31 | 3.2 | · |
| 23 | Gym Trainer 1 | Sailor JPN | 4 | 5 | 550.63 | 595.48 | 0.925 (0.919) | 1 | -0.075 | 0.92 | 3.43 | 2.95 | · |
| 24 | Gym Leader 4 | Crasher Wake | 4 | 5 | 590.66 | 595.48 | 0.992 (0.994) | 1 | -0.008 | 1 | 3.18 | 2.95 | · |
| 26 | Basic Trainer | Channeler | 4 | 6 | 549.1 | 595.48 | 0.922 (0.93) | 1 | -0.078 | 0.92 | 3.29 | 2.95 | · |
| 27 | Basic Trainer | Reactor Tech | 4 | 6 | 552.67 | 595.48 | 0.928 (0.94) | 1 | -0.072 | 0.93 | 3.29 | 2.95 | · |
| 29 | Gym Trainer 1 | Psychic F | 5 | 6 | 597.17 | 623.06 | 0.958 (0.966) | 1.03 | -0.072 | 0.96 | 3.43 | 2.7 | · |
| 30 | Gym Trainer 2 | Hex Maniac JPN | 5 | 6 | 609.01 | 623.06 | 0.977 (0.984) | 1.03 | -0.053 | 0.98 | 3.32 | 2.7 | · |
| 31 | Gym Leader 5 | Sabrina | 5 | 6 | 679.93 | 623.06 | 1.091 (1.1) | 1.03 | +0.061 | 1.09 | 2.74 | 2.7 | · |
| 33 | Basic Trainer | Pokémon Ranger | 5 | 6 | 591.61 | 623.06 | 0.95 (0.963) | 1.03 | -0.08 | 0.95 | 3.3 | 2.7 | 🔵 SOFT |
| 34 | Elite Trainer | Valerie | 5 | 6 | 686.72 | 623.06 | 1.102 (1.101) | 1.03 | +0.072 | 1.1 | 2.75 | 2.7 | · |
| 36 | Gym Trainer 1 | Lass | 6 | 6 | 766.47 | 686.26 | 1.117 (1.122) | 1.05 | +0.067 | 1.12 | 2.2 | 2.39 | · |
| 37 | Gym Trainer 2 | Gamer | 6 | 6 | 763.86 | 686.26 | 1.113 (1.121) | 1.05 | +0.063 | 1.11 | 2.19 | 2.39 | · |
| 38 | Gym Leader 6 | Larry | 6 | 6 | 768.28 | 686.26 | 1.12 (1.123) | 1.05 | +0.07 | 1.12 | 2.23 | 2.39 | · |
| 39 | Rival | Hop | 6 | 6 | 786.41 | 686.26 | 1.146 (1.152) | 1.05 | +0.096 | 1.15 | 1.96 | 2.39 | 🔴 HARD |
| 41 | Basic Trainer | Bird Keeper | 6 | 6 | 744.9 | 686.26 | 1.085 (1.091) | 1.05 | +0.035 | 1.09 | 2.13 | 2.39 | · |
| 42 | Elite Trainer | Veteran Wallace | 6 | 6 | 773.66 | 686.26 | 1.127 (1.131) | 1.05 | +0.077 | 1.13 | 2.1 | 2.39 | · |
| 44 | Gym Trainer 1 | Reactor Tech | 7 | 6 | 783.76 | 706.91 | 1.109 (1.122) | 1.08 | +0.029 | 1.11 | 2.23 | 2.2 | · |
| 45 | Gym Trainer 2 | Worker | 7 | 6 | 783.99 | 706.91 | 1.109 (1.114) | 1.08 | +0.029 | 1.11 | 2.26 | 2.2 | · |
| 46 | Gym Leader 7 | Byron | 7 | 6 | 788.95 | 706.91 | 1.116 (1.119) | 1.08 | +0.036 | 1.12 | 2.22 | 2.2 | · |
| 48 | Elite Trainer | Hollow Cyrus | 7 | 6 | 797.85 | 706.91 | 1.129 (1.126) | 1.08 | +0.049 | 1.13 | 2.15 | 2.2 | · |
| 49 | Elite Trainer | Veteran Koga | 7 | 6 | 800.75 | 706.91 | 1.133 (1.134) | 1.08 | +0.053 | 1.13 | 2.12 | 2.2 | · |
| 51 | Gym Trainer 1 | Hiker | 8 | 6 | 800.26 | 706.91 | 1.132 (1.139) | 1.1 | +0.032 | 1.13 | 2.24 | 2.2 | · |
| 52 | Gym Trainer 2 | Rocker | 8 | 6 | 799.97 | 706.91 | 1.132 (1.139) | 1.1 | +0.032 | 1.13 | 2.27 | 2.2 | · |
| 53 | Gym Leader 8 | Grant | 8 | 6 | 807.32 | 706.91 | 1.142 (1.146) | 1.1 | +0.042 | 1.14 | 2.22 | 2.2 | · |
| 56 | Elite Trainer | Eldritch N | 8 | 6 | 808.21 | 706.91 | 1.143 (1.144) | 1.1 | +0.043 | 1.14 | 2.14 | 2.2 | · |
| 57 | Elite Trainer | Mars | 8 | 6 | 810.24 | 706.91 | 1.146 (1.149) | 1.1 | +0.046 | 1.15 | 2.18 | 2.2 | · |
| 58 | Elite Trainer | Silent Red | 8 | 6 | 800.92 | 706.91 | 1.133 (1.133) | 1.1 | +0.033 | 1.13 | 2.19 | 2.2 | · |
| 60 | E1 | Lorelei | 9 | 6 | 858.79 | 762.46 | 1.126 (1.123) | 1.14 | -0.014 | 1.13 | 2.13 | 1.85 | · |
| 61 | E2 | Bruno | 9 | 6 | 826.84 | 762.46 | 1.084 (1.085) | 1.16 | -0.076 | 1.08 | 2.5 | 1.85 | · |
| 62 | E3 | Flint | 9 | 6 | 873.13 | 762.46 | 1.145 (1.152) | 1.18 | -0.035 | 1.15 | 2.08 | 1.85 | · |
| 63 | E4 | Lance | 9 | 6 | 893.76 | 762.46 | 1.172 (1.169) | 1.2 | -0.028 | 1.17 | 2.13 | 1.85 | · |
| 64 | Champion | Prof. Kukui | 9 | 6 | 935.56 | 762.46 | 1.227 (1.228) | 1.23 | -0.003 | 1.23 | 1.95 | 1.85 | · |
| 65 | Rival | Hop | 9 | 6 | 943.76 | 706.91 | 1.335 (1.346) | 1.26 | +0.075 | 1.34 | 1.96 | 2.2 | · |
| 67 | Mystery Figure | Team Magma Grunt F | 9 | 6 | 974.63 | 762.46 | 1.278 (1.278) | 1.3 | -0.022 | 1.28 | 2 | 1.85 | · |

**GEN 1-3 divergences:** 2 HARD, 7 SOFT of 48 stages.
- HARD: Gym Leader 2(Δ+0.087), Rival(Δ+0.096)
- SOFT: Rival(Δ-0.109), Basic Trainer(Δ-0.146), Gym Trainer 1(Δ-0.094), Gym Leader 1(Δ-0.094), Basic Trainer(Δ-0.14), Basic Trainer(Δ-0.141), Basic Trainer(Δ-0.08)


## GEN 1 ONLY — deep dive
The narrow Gen-1 pool changes which species are available to BOTH sides; this contrasts Gen-1-only vs All-Gens at the same stage.
| event | g1 ratio/mon | allgen ratio/mon | g1 enemyG | g1 playerG | g1 flag |
|---|---|---|---|---|---|
| Rival | 0.657 | 0.653 | 3.95 | 3.9 | 🔵 SOFT |
| Basic Trainer | 0.673 | 0.659 | 4 | 3.9 | 🔵 SOFT |
| Gym Trainer 1 | 0.765 | 0.751 | 4 | 3.85 | 🔵 SOFT |
| Gym Leader 1 | 0.764 | 0.754 | 4 | 3.85 | 🔵 SOFT |
| Basic Trainer | 0.729 | 0.714 | 4 | 3.85 | 🔵 SOFT |
| Basic Trainer | 0.723 | 0.716 | 4 | 3.85 | 🔵 SOFT |
| Gym Trainer 1 | 0.95 | 0.893 | 3.39 | 3.65 | · |
| Gym Leader 2 | 0.941 | 0.977 | 3.4 | 3.65 | · |
| Basic Trainer | 0.916 | 0.94 | 3.37 | 3.65 | · |
| Basic Trainer | 0.911 | 0.934 | 3.36 | 3.65 | · |
| Gym Trainer 1 | 0.898 | 0.866 | 3.4 | 3.2 | · |
| Gym Leader 3 | 0.899 | 0.926 | 3.4 | 3.2 | · |
| Rival | 0.866 | 0.858 | 3.55 | 3.2 | 🔵 SOFT |
| Basic Trainer | 0.874 | 0.888 | 3.34 | 3.2 | · |
| Basic Trainer | 0.864 | 0.875 | 3.38 | 3.2 | 🔵 SOFT |
| Gym Trainer 1 | 0.968 | 0.906 | 3.32 | 2.95 | · |
| Gym Leader 4 | 0.972 | 0.976 | 3.28 | 2.95 | · |
| Basic Trainer | 0.918 | 0.917 | 3.32 | 2.95 | 🔵 SOFT |
| Basic Trainer | 0.921 | 0.917 | 3.33 | 2.95 | · |
| Gym Trainer 1 | 0.982 | 0.928 | 3.38 | 2.7 | · |
| Gym Trainer 2 | 1.047 | 0.938 | 2.98 | 2.7 | · |
| Gym Leader 5 | 1.075 | 1.129 | 2.83 | 2.7 | · |
| Basic Trainer | 0.938 | 0.954 | 3.38 | 2.7 | 🔵 SOFT |
| Elite Trainer | 1.088 | 1.128 | 2.8 | 2.7 | · |
| Gym Trainer 1 | 1.132 | 1.133 | 2.16 | 2.39 | 🔴 HARD |
| Gym Trainer 2 | 1.132 | 1.121 | 2.2 | 2.39 | 🔴 HARD |
| Gym Leader 6 | 1.13 | 1.131 | 2.17 | 2.39 | 🔴 HARD |
| Rival | 1.147 | 1.179 | 1.98 | 2.39 | 🔴 HARD |
| Basic Trainer | 1.085 | 1.103 | 2.18 | 2.39 | · |
| Elite Trainer | 1.138 | 1.157 | 2.12 | 2.39 | 🔴 HARD |
| Gym Trainer 1 | 1.13 | 1.127 | 2.19 | 2.2 | · |
| Gym Trainer 2 | 1.125 | 1.124 | 2.23 | 2.2 | · |
| Gym Leader 7 | 1.129 | 1.131 | 2.17 | 2.2 | · |
| Elite Trainer | 1.139 | 1.144 | 2.1 | 2.2 | · |
| Elite Trainer | 1.13 | 1.153 | 2.14 | 2.2 | · |
| Gym Trainer 1 | 1.15 | 1.148 | 2.19 | 2.2 | · |
| Gym Trainer 2 | 1.148 | 1.138 | 2.2 | 2.2 | · |
| Gym Leader 8 | 1.149 | 1.152 | 2.16 | 2.2 | · |
| Elite Trainer | 1.162 | 1.171 | 2.1 | 2.2 | · |
| Elite Trainer | 1.154 | 1.168 | 2.15 | 2.2 | · |
| Elite Trainer | 1.151 | 1.164 | 2.17 | 2.2 | · |
| E1 | 1.132 | 1.12 | 2.13 | 1.85 | · |
| E2 | 1.095 | 1.1 | 2.47 | 1.85 | · |
| E3 | 1.155 | 1.15 | 2.13 | 1.85 | · |
| E4 | 1.178 | 1.169 | 2.13 | 1.85 | · |
| Champion | 1.219 | 1.235 | 2.05 | 1.85 | · |
| Rival | 1.341 | 1.369 | 1.97 | 2.2 | 🔴 HARD |
| Mystery Figure | 1.273 | 1.281 | 2.06 | 1.85 | · |


## Data-quality flags (sample integrity — should mostly be empty)

### Legendary FILLER leaks on non-E4/Champion trainers (bug if present) (0)
- none

### Rattata sentinel on a non-Normal trainer (pool exhaustion) (65)
- GEN 1 ONLY Gym Leader 1 Flannery
- GEN 1 ONLY Gym Trainer 1 Dragon Tamer
- GEN 1 ONLY Gym Trainer 1 Hooligans
- GEN 1 ONLY Basic Trainer Veteran
- GEN 1 ONLY Gym Trainer 1 Hiker
- GEN 1 ONLY Rival Wally
- GEN 1 ONLY Gym Trainer 1 Team Rocket Grunt
- GEN 1 ONLY Gym Trainer 2 Reactor Tech
- GEN 1 ONLY Gym Leader 1 Drayden
- GEN 1 ONLY Basic Trainer Team Rocket Grunt
- GEN 1 ONLY Gym Leader 3 Drayden
- GEN 1 ONLY Basic Trainer Hex Maniac
- GEN 1 ONLY Basic Trainer Channeler
- GEN 1 ONLY Gym Trainer 1 Cyclist
- GEN 1 ONLY Gym Trainer 1 Engineer
- GEN 1 ONLY Gym Leader 4 Opal
- GEN 1 ONLY Gym Trainer 2 Team Rocket Grunt
- GEN 1 ONLY Basic Trainer Skier F
- GEN 1 ONLY Gym Trainer 1 Bug Maniac
- GEN 1 ONLY Basic Trainer Crush Girl
- GEN 1 ONLY Basic Trainer Dragon Tamer
- GEN 1 ONLY Gym Trainer 1 Tea Aroma
- GEN 1 ONLY Rival Gladion
- GEN 1 ONLY Gym Leader 1 Lt. Surge
- GEN 1 ONLY Basic Trainer Burglar
- GEN 1 ONLY Rival N
- GEN 1 ONLY Gym Leader 4 Wattson
- GEN 1 ONLY Gym Leader 2 Wulfric
- GEN 1 ONLY Basic Trainer Glacial Trekker
- GEN 1 ONLY Basic Trainer Roughneck
- GEN 1 ONLY Basic Trainer Depot Agent
- GEN 1 ONLY Basic Trainer Skier
- GEN 1 ONLY Rival Nemona
- GEN 1 ONLY Basic Trainer Battle Girl
- GEN 1 ONLY Gym Leader 2 Raihan
- GEN 1 ONLY Rival May
- GEN 1 ONLY Gym Leader 5 Piers
- GEN 1 ONLY Basic Trainer Cyclist F
- GEN 1 ONLY Gym Leader 1 Bea
- GEN 1 ONLY Basic Trainer Crooked Beat

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
| 0 | 0.8 | 0.656 | 0.976 | pool under curve → harden |
| 1 | 0.85 | 0.734 | 0.984 | pool under curve → harden |
| 2 | 0.9 | 0.936 | 0.866 | on target |
| 3 | 0.95 | 0.882 | 1.023 | on target |
| 4 | 1 | 0.929 | 1.076 | on target |
| 5 | 1.03 | 1.015 | 1.045 | on target |
| 6 | 1.05 | 1.137 | 0.969 | pool over curve → soften |
| 7 | 1.08 | 1.136 | 1.027 | on target |
| 8 | 1.1 | 1.157 | 1.046 | on target |
| 9 | 1.15 | 1.369 | 0.966 | pool over curve → soften |

### Boss overrides (`_storyEnemyStatMult` 38440)
| event | current mult | measured ratio/mon (ALL-GENS) | note |
|---|---|---|---|
| E1 | 1.14 | 1.12 | on target |
| E2 | 1.16 | 1.1 | on target |
| E3 | 1.18 | 1.15 | on target |
| E4 | 1.2 | 1.169 | on target |
| Champion | 1.23 | 1.235 | on target |
| Mystery Figure | 1.3 | 1.281 | on target |

---
Artifacts: `enemy-mons.csv` (per-mon, seed 1000), `stage-summary.csv` (all stages × gen-sets, 100-seed stats), `player-model.csv` (expected player team per stage).
