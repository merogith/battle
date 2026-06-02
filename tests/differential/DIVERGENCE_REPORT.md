# Differential Divergence Report

> Generated 2026-06-02 by `tests/differential/run-report.mjs`.
> Reference: **@pkmn/sim** (MIT, the auto-synced Pokémon Showdown simulator) ·
> Subject: the in-house engine in `battle.html` (driven headless via the jsdom harness).
> This is **Stage 0** of the oracle-led plan (`docs/BATTLE_ENGINE_INVESTIGATION.md`): no game
> code changed — the harness only *observes* both engines and diffs them.

## Headline
- **Known bugs confirmed by the oracle:** 5/5
- **Sanity scenarios in agreement:** 5/5
- **False positives (high-confidence divergence on a should-match case):** 0 ✅
- **Probes flagging a divergence to investigate:** 0/4

Confidence: **high** = boosts / faint / winner (RNG-independent — real divergences) ·
**medium** = status presence (may be a chance-secondary) · **low** = raw HP beyond the roll band.

## Summary
| Scenario | Category | Expect | HIGH | med | low | Verdict |
|---|---|---|---:|---:|---:|---|
| `seminvuln-selfboost-fly` | two-turn / semi-invulnerable | diverge | 2 | 0 | 0 | ✅ bug caught |
| `seminvuln-selfboost-dig` | two-turn / semi-invulnerable | diverge | 2 | 0 | 0 | ✅ bug caught |
| `seminvuln-selfboost-dive` | two-turn / semi-invulnerable | diverge | 2 | 0 | 0 | ✅ bug caught |
| `seminvuln-selfboost-bounce` | two-turn / semi-invulnerable | diverge | 2 | 0 | 2 | ✅ bug caught |
| `seminvuln-selfboost-phantomforce` | two-turn / semi-invulnerable | diverge | 2 | 0 | 0 | ✅ bug caught |
| `gravity-blocks-fly` | two-turn / precondition | probe | 0 | 0 | 4 | 🔍 no divergence |
| `probe-freeze-dry-vs-water` | type-chart | probe | 0 | 0 | 0 | 🔍 no divergence |
| `probe-toxic-residual-ramp` | status / residual | probe | 0 | 0 | 0 | 🔍 no divergence |
| `probe-multi-hit-bullet-seed` | multi-hit | probe | 0 | 0 | 0 | 🔍 no divergence |
| `sanity-swords-dance-normal` | sanity | match | 0 | 0 | 0 | ✅ agrees |
| `sanity-tackle-neutral-damage` | sanity | match | 0 | 0 | 0 | ✅ agrees |
| `sanity-thunder-wave-guaranteed` | sanity / status | match | 0 | 0 | 0 | ✅ agrees |
| `sanity-willowisp-guaranteed` | sanity / status | match | 0 | 0 | 0 | ✅ agrees |
| `sanity-super-effective-faint` | sanity / type-chart | match | 0 | 0 | 0 | ✅ agrees |

## Details

### `seminvuln-selfboost-fly` — ✅ bug caught
Booster uses Swords Dance while foe is mid-Fly; the self-boost must still apply.

- **Maps to:** catalogue #1 (battle.html:23087-23110, missing self-target guard)
- Winner: Showdown=`null` · in-house=`null` · turns compared: 3

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 2 | p1a | boost.atk | `4` | `2` | high |
| 3 | p1a | boost.atk | `6` | `4` | high |

### `seminvuln-selfboost-dig` — ✅ bug caught
Booster uses Swords Dance while foe is mid-Dig; the self-boost must still apply.

- **Maps to:** catalogue #1 (battle.html:23087-23110, missing self-target guard)
- Winner: Showdown=`null` · in-house=`null` · turns compared: 3

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 2 | p1a | boost.atk | `4` | `2` | high |
| 3 | p1a | boost.atk | `6` | `4` | high |

### `seminvuln-selfboost-dive` — ✅ bug caught
Booster uses Swords Dance while foe is mid-Dive; the self-boost must still apply.

- **Maps to:** catalogue #1 (battle.html:23087-23110, missing self-target guard)
- Winner: Showdown=`null` · in-house=`null` · turns compared: 3

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 2 | p1a | boost.atk | `4` | `2` | high |
| 3 | p1a | boost.atk | `6` | `4` | high |

### `seminvuln-selfboost-bounce` — ✅ bug caught
Booster uses Swords Dance while foe is mid-Bounce; the self-boost must still apply.

- **Maps to:** catalogue #1 (battle.html:23087-23110, missing self-target guard)
- Winner: Showdown=`null` · in-house=`null` · turns compared: 3

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 2 | p1a | boost.atk | `4` | `2` | high |
| 2 | p1a | hp/damage | `140/140 (dmg~0)` | `111/140 (dmg~29)` | low |
| 3 | p1a | boost.atk | `6` | `4` | high |
| 3 | p1a | hp/damage | `140/140 (dmg~0)` | `111/140 (dmg~29)` | low |

### `seminvuln-selfboost-phantomforce` — ✅ bug caught
Booster uses Swords Dance while foe is mid-Phantom Force; the self-boost must still apply.

- **Maps to:** catalogue #1 (battle.html:23087-23110, missing self-target guard)
- Winner: Showdown=`null` · in-house=`null` · turns compared: 3

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 2 | p1a | boost.atk | `4` | `2` | high |
| 3 | p1a | boost.atk | `6` | `4` | high |

### `gravity-blocks-fly` — 🔍 no divergence
Under Gravity, Fly cannot be used; the in-house engine charges it anyway.

- **Maps to:** catalogue #2 (battle.html:22611-22667, no Gravity gate)
- **Note:** Cross-engine choice handling differs (Showdown rejects Fly under Gravity → picks default); a legality bug like this needs a direct assertion test, not differential play.
- Winner: Showdown=`null` · in-house=`null` · turns compared: 3

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 2 | p1a | hp/damage | `125/125 (dmg~0)` | `72/125 (dmg~53)` | low |
| 2 | p2a | hp/damage | `249/267 (dmg~18)` | `267/267 (dmg~0)` | low |
| 3 | p1a | hp/damage | `125/125 (dmg~0)` | `72/125 (dmg~53)` | low |
| 3 | p2a | hp/damage | `230/267 (dmg~37)` | `248/267 (dmg~19)` | low |

### `probe-freeze-dry-vs-water` — 🔍 no divergence
Freeze-Dry is Ice that hits Water super-effectively (×2). A normal Ice calc would resist it (×0.5) — a ×4 damage gap exposes the special case.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `probe-toxic-residual-ramp` — 🔍 no divergence
Toxic deals 1/16, 2/16, 3/16 max HP (no roll). The residual ramp should match exactly.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 3
- No divergences.

### `probe-multi-hit-bullet-seed` — 🔍 no divergence
Bullet Seed hits 2-5 times (RNG). Hit count differs across engines — expected; surfaced as a low-confidence HP gap.

- Winner: Showdown=`P1` · in-house=`P1` · turns compared: 1
- No divergences.

### `sanity-swords-dance-normal` — ✅ agrees
Swords Dance x3 vs a passive foe — boosts must reach +2/+4/+6 in both engines.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 3
- No divergences.

### `sanity-tackle-neutral-damage` — ✅ agrees
One Strength (no secondary) into a passive foe — damage must agree within the 85-100% roll band.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `sanity-thunder-wave-guaranteed` — ✅ agrees
Thunder Wave must paralyze a non-Electric, non-Ground foe in both engines.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `sanity-willowisp-guaranteed` — ✅ agrees
Will-O-Wisp must burn a non-Fire foe in both engines.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `sanity-super-effective-faint` — ✅ agrees
A clearly super-effective hit must register comparable damage (and same faint outcome).

- Winner: Showdown=`P1` · in-house=`P1` · turns compared: 1
- No divergences.
