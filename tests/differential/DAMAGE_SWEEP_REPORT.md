# Damage-Modifier Sweep Report

> Generated 2026-06-02 by `tests/differential/damage-sweep.mjs` (12 seeds/engine).
> Each row runs one attacker+move into a passive wall in BOTH engines across many
> seeds, then compares the damage **ranges**. Overlapping ranges = the multiplier
> layer agrees; disjoint ranges = a real items/abilities/stat-calc divergence
> (roll variance removed). Reference: @pkmn/sim (MIT).

**Divergences found: 0/19**

| Probe | What it checks | In-house [min–max] | Showdown [min–max] | Verdict |
|---|---|---|---|---|
| `item-choice-band` | Choice Band ×1.5 (physical) | 8–10 (μ9) | 9–14 (μ10) | ✅ overlap |
| `item-choice-specs` | Choice Specs ×1.5 (special) | 59–69 (μ64) | 58–97 (μ66) | ✅ overlap |
| `item-life-orb` | Life Orb ×1.3 | 51–60 (μ56) | 51–83 (μ58) | ✅ overlap |
| `item-charcoal-type` | Charcoal ×1.2 (Fire) | 39–46 (μ43) | 39–64 (μ44) | ✅ overlap |
| `ability-huge-power` | Huge Power ×2 Attack | 6–7 (μ7) | 6–11 (μ7) | ✅ overlap |
| `ability-adaptability` | Adaptability STAB ×2 (vs ×1.5) | 64–105 (μ78) | 62–104 (μ73) | ✅ overlap |
| `ability-technician` | Technician ×1.5 (≤60 BP) | 28–32 (μ30) | 27–46 (μ31) | ✅ overlap |
| `def-thick-fat` | Thick Fat halves incoming Fire (defender) | 27–61 (μ33) | 27–43 (μ30) | ✅ overlap |
| `def-multiscale` | Multiscale halves at full HP (defender) | 19–21 (μ20) | 18–31 (μ21) | ✅ overlap |
| `weather-rain-water` | Rain ×1.5 on Water (Rain Dance → Surf) | 67–102 (μ74) | 69–114 (μ78) | ✅ overlap |
| `weather-sun-fire` | Sun ×1.5 on Fire (Sunny Day → Flamethrower) | 69–140 (μ84) | 69–114 (μ78) | ✅ overlap |
| `weather-sun-water-weak` | Sun ×0.5 on Water (Sunny Day → Surf) | 24–27 (μ26) | 22–37 (μ25) | ✅ overlap |
| `screen-reflect-phys` | Reflect halves physical | 23–83 (μ30) | 23–27 (μ25) | ✅ overlap |
| `screen-lightscreen-spec` | Light Screen halves special | 26–89 (μ33) | 26–87 (μ33) | ✅ overlap |
| `item-expert-belt-se` | Expert Belt ×1.2 on super-effective | 100–118 (μ109) | 101–166 (μ114) | ✅ overlap |
| `item-tinted-lens-resist` | Tinted Lens ×2 on a resisted hit | 100–172 (μ113) | 100–168 (μ113) | ✅ overlap |
| `ability-moldbreaker-vs-thickfat` | Mold Breaker ignores Thick Fat (full Fire damage) | 24–57 (μ31) | 24–39 (μ27) | ✅ overlap |
| `terrain-electric` | Electric Terrain ×1.3 on Electric | 52–59 (μ56) | 52–85 (μ59) | ✅ overlap |
| `terrain-grassy` | Grassy Terrain ×1.3 on Grass | 41–53 (μ47) | 42–84 (μ50) | ✅ overlap |

Ranges are HP damage to the defender. A correct multiplier yields overlapping
bands (both sample the 85-100% roll). "KO (invalid)" means the wall fainted in
some run, capping measured damage — pick a bulkier wall to re-measure.
