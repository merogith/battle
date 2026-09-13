# Comprehensive Differential Sweep

> Generated 2026-09-12 by `sweep-all.mjs`. Reference: **@pkmn/sim** (MIT). Subject: `battle.html` (headless). No game code changed — observe & diff only.

## Headline
- **Scenarios run:** 3070
- **High-confidence divergences:** 4 (across 4 entities)
- **Medium (status-presence) divergences:** 47
- **Inert probes (no signal — entity not engaged):** 3
- **Harness errors:** 0

## High-confidence divergences by shard (kind.family)

| Shard | Count |
|---|--:|
| `move.status` | 2 |
| `ability.ability-switchin` | 1 |
| `move.damaging` | 1 |

## High-confidence divergences (candidate findings)

| Entity | Kind | Family | Scenario | Detail |
|---|---|---|---|---|
| **Moody** | ability | ability-switchin | `abil-moody-switchin` | T1 p1a boost.atk: sd=0 ih=2 \| T1 p1a boost.spa: sd=2 ih=-1 \| T1 p1a boost.spe: sd=-1 ih=0 |
| **Frustration** | move | damaging | `move-frustration` | T1 p2a hp/damage: sd=265/267 (dmg~2) ih=176/267 (dmg~91) |
| **Acupressure** | move | status | `move-acupressure` | T1 p1a boost.def: sd=0 ih=2 \| T1 p1a boost.spd: sd=2 ih=0 |
| **Metronome** | move | status | `move-metronome` | T1 p2a hp/damage: sd=259/267 (dmg~8) ih=229/267 (dmg~38) |
