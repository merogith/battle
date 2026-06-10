# Comprehensive Differential Sweep

> Generated 2026-06-10 by `sweep-all.mjs`. Reference: **@pkmn/sim** (MIT). Subject: `battle.html` (headless). No game code changed — observe & diff only.

## Headline
- **Scenarios run:** 3070
- **High-confidence divergences:** 20 (across 14 entities)
- **Medium (status-presence) divergences:** 57
- **Inert probes (no signal — entity not engaged):** 3
- **Harness errors:** 0

## High-confidence divergences by shard (kind.family)

| Shard | Count |
|---|--:|
| `ability.ability-defensive` | 8 |
| `move.status` | 5 |
| `move.damaging` | 3 |
| `ability.ability-switchin` | 1 |
| `ability.ability-offensive` | 1 |
| `item.item-offensive` | 1 |
| `item.item-hold` | 1 |

## High-confidence divergences (candidate findings)

| Entity | Kind | Family | Scenario | Detail |
|---|---|---|---|---|
| **Parting Shot** | move | status | `move-partingshot` | T1 p2a boost.atk: sd=-1 ih=0 \| T1 p2a boost.spa: sd=-1 ih=0 |
| **Disguise** | ability | ability-defensive | `abil-disguise-def-spec` | disjoint/min-skew ih[33-49] sd[45-75] (×1.36) |
| **Sand Spit** | ability | ability-defensive | `abil-sandspit-def-spec` | disjoint/min-skew ih[45-65] sd[61-91] (×1.36) |
| **Aura Wheel** | move | damaging | `move-aurawheel` | T1 p2a hp/damage: sd=267/267 (dmg~0) ih=164/267 (dmg~103) |
| **Moody** | ability | ability-switchin | `abil-moody-switchin` | T1 p1a boost.atk: sd=0 ih=2 \| T1 p1a boost.spa: sd=2 ih=-1 \| T1 p1a boost.spe: sd=-1 ih=0 |
| **Decorate** | move | status | `move-decorate` | T1 p2a boost.atk: sd=2 ih=0 \| T1 p2a boost.spa: sd=2 ih=0 |
| **Snow Warning** | ability | ability-offensive | `abil-snowwarning-atk` | disjoint/min-skew ih[20-20] sd[9-14] (×2.22) |
| **Snow Warning** | ability | ability-defensive | `abil-snowwarning-def-phys` | disjoint/min-skew ih[90-103] sd[74-123] (×1.22) |
| **Tera Shell** | ability | ability-defensive | `abil-terashell-def-phys` | disjoint/min-skew ih[37-43] sd[74-123] (×2.00) |
| **Frustration** | move | damaging | `move-frustration` | T1 p2a hp/damage: sd=265/267 (dmg~2) ih=171/267 (dmg~96) |
| **Hyperspace Fury** | move | damaging | `move-hyperspacefury` | T1 p2a hp/damage: sd=267/267 (dmg~0) ih=173/267 (dmg~94) |
| **Metronome** | move | status | `move-metronome` | T1 p2a boost.spe: sd=0 ih=-1 \| T1 p2a hp/damage: sd=259/267 (dmg~8) ih=233/267 (dmg~34) |
| **Snow Warning** | ability | ability-defensive | `abil-snowwarning-def-spec` | disjoint/min-skew ih[61-81] sd[45-75] (×1.36) |
| **Tera Shell** | ability | ability-defensive | `abil-terashell-def-spec` | disjoint/min-skew ih[22-40] sd[45-75] (×2.05) |
| **Acupressure** | move | status | `move-acupressure` | T1 p1a boost.def: sd=0 ih=2 \| T1 p1a boost.spd: sd=2 ih=0 |
| **Berserk Gene** | item | item-offensive | `item-berserkgene-atk` | disjoint/min-skew ih[9-9] sd[0-19] (×∞) |
| **Captivate** | move | status | `move-captivate` | T1 p2a boost.spa: sd=0 ih=-2 |
| **Disguise** | ability | ability-defensive | `abil-disguise-def-phys` | disjoint/min-skew ih[33-33] sd[74-123] (×2.24) |
| **Sand Spit** | ability | ability-defensive | `abil-sandspit-def-phys` | disjoint/min-skew ih[74-87] sd[90-139] (×1.22) |
| **Berserk Gene** | item | item-hold | `item-berserkgene-hold` | T1 p1a boost.atk: sd=2 ih=0 \| T2 p1a boost.atk: sd=2 ih=0 |
