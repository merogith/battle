# Damage-Modifier Sweep Report

> Generated 2026-09-12 by `tests/differential/damage-sweep.mjs` (12 seeds/engine).
> Each row runs one attacker+move into a passive wall in BOTH engines across many
> seeds, then compares the damage **ranges**. Overlapping ranges = the multiplier
> layer agrees; disjoint ranges = a real items/abilities/stat-calc divergence
> (roll variance removed). Reference: @pkmn/sim (MIT).

**Unexpected divergences: 0/53** ✅

A row "diverges" only when ranges are disjoint AND the crit-proof min-skew confirms
it (so a stray crit can't mask a real multiplier gap). Rows tagged **known** are
documented engine findings, not surprises.

| Probe | What it checks | In-house [min–max] | Showdown [min–max] | Verdict |
|---|---|---|---|---|
| `item-choice-band` | Choice Band ×1.5 (physical) | 8–9 (μ9) | 9–14 (μ10) | ✅ overlap |
| `item-choice-specs` | Choice Specs ×1.5 (special) | 58–69 (μ64) | 58–97 (μ66) | ✅ overlap |
| `item-life-orb` | Life Orb ×1.3 | 51–60 (μ56) | 51–83 (μ58) | ✅ overlap |
| `item-charcoal-type` | Charcoal ×1.2 (Fire) | 40–65 (μ45) | 39–64 (μ44) | ✅ overlap |
| `ability-huge-power` | Huge Power ×2 Attack | 6–7 (μ7) | 6–11 (μ7) | ✅ overlap |
| `ability-adaptability` | Adaptability STAB ×2 (vs ×1.5) | 64–104 (μ77) | 62–104 (μ73) | ✅ overlap |
| `ability-technician` | Technician ×1.5 (≤60 BP) | 27–33 (μ30) | 27–46 (μ31) | ✅ overlap |
| `def-thick-fat` | Thick Fat halves incoming Fire (defender) | 26–44 (μ31) | 27–43 (μ30) | ✅ overlap |
| `def-multiscale` | Multiscale halves at full HP (defender) | 18–21 (μ20) | 18–31 (μ21) | ✅ overlap |
| `weather-rain-water` | Rain ×1.5 on Water (Rain Dance → Surf) | 67–75 (μ72) | 69–114 (μ78) | ✅ overlap |
| `weather-sun-fire` | Sun ×1.5 on Fire (Sunny Day → Flamethrower) | 67–95 (μ77) | 69–114 (μ78) | ✅ overlap |
| `weather-sun-water-weak` | Sun ×0.5 on Water (Sunny Day → Surf) | 24–28 (μ26) | 22–37 (μ25) | ✅ overlap |
| `screen-reflect-phys` | Reflect halves physical | 23–82 (μ30) | 23–27 (μ25) | ✅ overlap |
| `screen-lightscreen-spec` | Light Screen halves special | 26–89 (μ33) | 26–87 (μ33) | ✅ overlap |
| `item-expert-belt-se` | Expert Belt ×1.2 on super-effective | 101–121 (μ111) | 101–166 (μ114) | ✅ overlap |
| `item-tinted-lens-resist` | Tinted Lens ×2 on a resisted hit | 100–118 (μ109) | 100–168 (μ113) | ✅ overlap |
| `ability-moldbreaker-vs-thickfat` | Mold Breaker ignores Thick Fat (full Fire damage) | 24–42 (μ29) | 24–39 (μ27) | ✅ overlap |
| `terrain-electric` | Electric Terrain ×1.3 on Electric | 51–58 (μ55) | 52–85 (μ59) | ✅ overlap |
| `terrain-grassy` | Grassy Terrain ×1.3 on Grass | 41–50 (μ46) | 42–84 (μ50) | ✅ overlap |
| `ability-sheer-force` | Sheer Force ×1.3 (move with a secondary) | 49–82 (μ60) | 49–82 (μ56) | ✅ overlap |
| `ability-tough-claws` | Tough Claws ×1.3 (contact) | 59–69 (μ64) | 59–97 (μ66) | ✅ overlap |
| `ability-iron-fist` | Iron Fist ×1.2 (punch) | 199–325 (μ237) | 196–325 (μ221) | ✅ overlap |
| `ability-strong-jaw` | Strong Jaw ×1.5 (bite) | 100–118 (μ110) | 100–168 (μ114) | ✅ overlap |
| `ability-mega-launcher` | Mega Launcher ×1.5 (pulse) | 43–50 (μ47) | 43–71 (μ48) | ✅ overlap |
| `ability-reckless` | Reckless ×1.2 (recoil move) | 121–142 (μ133) | 121–201 (μ137) | ✅ overlap |
| `ability-neuroforce` | Neuroforce ×1.25 (super-effective) | 72–110 (μ81) | 72–87 (μ79) | ✅ overlap |
| `def-filter-se` | Filter ×0.75 on super-effective (defender) | 76–92 (μ84) | 76–127 (μ86) | ✅ overlap |
| `def-fur-coat` | Fur Coat halves physical (defender) | 31–36 (μ34) | 33–54 (μ37) | ✅ overlap |
| `def-ice-scales` | Ice Scales halves special (defender) | 30–35 (μ32) | 30–49 (μ34) | ✅ overlap |
| `def-heatproof` | Heatproof halves Fire (defender) | 26–36 (μ30) | 27–43 (μ30) | ✅ overlap |
| `def-fluffy-contact` | Fluffy halves contact (defender) | 31–36 (μ34) | 32–51 (μ36) | ✅ overlap |
| `def-dry-skin-fire` | Dry Skin ×1.25 Fire taken (defender) | 64–86 (μ73) | 64–108 (μ73) | ✅ overlap |
| `item-muscle-band` | Muscle Band ×1.1 (physical) | 69–80 (μ74) | 70–114 (μ79) | ✅ overlap |
| `item-wise-glasses` | Wise Glasses ×1.1 (special) | 57–67 (μ63) | 57–94 (μ64) | ✅ overlap |
| `item-occa-berry-se` | Occa Berry halves a super-effective Fire hit (defender) | 51–65 (μ57) | 51–85 (μ58) | ✅ overlap |
| `recoil-brave-bird` | Brave Bird recoil = 33% of damage dealt (attacker) | 119–119 (μ119) | 119–119 (μ119) | ✅ overlap |
| `recoil-life-orb` | Life Orb recoil = 10% max HP (attacker) | 13–13 (μ13) | 13–13 (μ13) | ✅ overlap |
| `contact-rough-skin` | Rough Skin chips the attacker 1/8 on contact (attacker) | 29–29 (μ29) | 29–29 (μ29) | ✅ overlap |
| `contact-rocky-helmet` | Rocky Helmet chips the attacker 1/6 on contact (attacker) | 39–39 (μ39) | 39–39 (μ39) | ✅ overlap |
| `ability-guts-burn` | Guts ×1.5 Atk when burned, ignoring the burn drop (Flame Orb) | 94–168 (μ110) | 94–142 (μ105) | ✅ overlap |
| `burn-halves-physical` | Burn halves physical damage (Flame Orb, no Guts) — expect overlap | 133–226 (μ149) | 135–224 (μ152) | ✅ overlap |
| `def-marvel-scale` | Marvel Scale ×1.5 Def when statused (paralysed first) | 38–64 (μ45) | 39–66 (μ46) | ✅ overlap |
| `knockoff-item-boost` | Knock Off ×1.5 when the target holds a removable item | 169–198 (μ186) | 169–282 (μ191) | ✅ overlap |
| `sand-spd-rock` | Sandstorm grants Rock-types ×1.5 SpD | 43–51 (μ47) | 43–72 (μ49) | ✅ overlap |
| `multihit-skill-link` | Skill Link → 5-hit multi-hit move (always max hits) | 89–112 (μ99) | 96–117 (μ103) | ✅ overlap |
| `facade-status` | Facade burned keeps ×2 (burn drop exempted) — finding #4 FIXED | 109–195 (μ127) | 109–165 (μ122) | ✅ overlap |
| `hex-status` | Hex ×2 vs a statused target (paralysed first) | 42–88 (μ78) | 42–90 (μ79) | ✅ overlap |
| `acrobatics-no-item` | Acrobatics ×2 when the user holds no item | 93–109 (μ102) | 93–154 (μ105) | ✅ overlap |
| `gyro-ball-slow` | Gyro Ball BP scales with the speed ratio (slow user) | 40–45 (μ43) | 42–69 (μ47) | ✅ overlap |
| `weather-ball-rain` | Weather Ball → Water + 100 BP in rain (Rain Dance → Weather Ball) | 67–75 (μ72) | 69–114 (μ78) | ✅ overlap |
| `stored-power-boosts` | Stored Power BP = 20 + 20×boosts (Calm Mind first) | 51–58 (μ55) | 52–85 (μ59) | ✅ overlap |
| `ability-analytic` | Analytic ×1.3 when the user moves last | 58–69 (μ64) | 58–97 (μ66) | ✅ overlap |
| `ability-stakeout-lead` | Stakeout does NOT ×2 a turn-1 lead — finding #2 FIXED | 47–55 (μ51) | 47–77 (μ53) | ✅ overlap |

Ranges are HP damage to the defender. A correct multiplier yields overlapping
bands (both sample the 85-100% roll). "KO (invalid)" means the wall fainted in
some run, capping measured damage — pick a bulkier wall to re-measure.
