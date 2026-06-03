# Differential Divergence Report

> Generated 2026-06-03 by `tests/differential/run-report.mjs`.
> Reference: **@pkmn/sim** (MIT, the auto-synced Pokémon Showdown simulator) ·
> Subject: the in-house engine in `battle.html` (driven headless via the jsdom harness).
> This is **Stage 0** of the oracle-led plan (`docs/BATTLE_ENGINE_INVESTIGATION.md`): no game
> code changed — the harness only *observes* both engines and diffs them.

## Headline
- **Known bugs confirmed by the oracle:** 5/5
- **Sanity scenarios in agreement:** 14/14
- **False positives (high-confidence divergence on a should-match case):** 0 ✅
- **Probes flagging a divergence to investigate:** 1/41

Confidence: **high** = boosts / faint / winner (RNG-independent — real divergences) ·
**medium** = status presence (may be a chance-secondary) · **low** = raw HP beyond the roll band.

## 🔎 New divergences to investigate (1)
High-confidence disagreements on should-match / exploratory scenarios — candidate bugs beyond the known catalogue.

- **`speed-boost-ramp`** (ability / end-of-turn) — Speed Boost grants +1 Speed at the end of each turn (+1/+2/+3).
  - T1 p1a `boost.spe`: Showdown=`1` vs in-house=`0`
  - T2 p1a `boost.spe`: Showdown=`2` vs in-house=`1`
  - T3 p1a `boost.spe`: Showdown=`3` vs in-house=`2`

## Summary
| Scenario | Category | Expect | HIGH | med | low | Verdict |
|---|---|---|---:|---:|---:|---|
| `seminvuln-selfboost-fly` | two-turn / semi-invulnerable | diverge | 2 | 0 | 0 | ✅ bug caught |
| `seminvuln-selfboost-dig` | two-turn / semi-invulnerable | diverge | 2 | 0 | 0 | ✅ bug caught |
| `seminvuln-selfboost-dive` | two-turn / semi-invulnerable | diverge | 2 | 0 | 0 | ✅ bug caught |
| `seminvuln-selfboost-bounce` | two-turn / semi-invulnerable | diverge | 2 | 0 | 2 | ✅ bug caught |
| `seminvuln-selfboost-phantomforce` | two-turn / semi-invulnerable | diverge | 2 | 0 | 0 | ✅ bug caught |
| `seminvuln-gust-hits-fly` | two-turn / allow-list | probe | 0 | 0 | 0 | 🔍 no divergence |
| `seminvuln-twave-misses-fly` | two-turn / opponent-status | match | 0 | 0 | 0 | ✅ agrees |
| `stat-growl-atk` | stat change | match | 0 | 0 | 0 | ✅ agrees |
| `stat-leer-def` | stat change | match | 0 | 0 | 0 | ✅ agrees |
| `stat-scaryface-spe` | stat change | match | 0 | 0 | 0 | ✅ agrees |
| `stat-charm-atk2` | stat change | match | 0 | 0 | 0 | ✅ agrees |
| `status-thunderwave-par` | status | match | 0 | 0 | 0 | ✅ agrees |
| `status-willowisp-brn` | status | match | 0 | 0 | 0 | ✅ agrees |
| `status-toxic-tox` | status | match | 0 | 0 | 0 | ✅ agrees |
| `status-spore-slp` | status | match | 0 | 0 | 0 | ✅ agrees |
| `status-glare-par` | status | match | 0 | 0 | 0 | ✅ agrees |
| `status-willowisp-vs-fire` | status | probe | 0 | 0 | 0 | 🔍 no divergence |
| `status-twave-vs-electric` | status | probe | 0 | 0 | 0 | 🔍 no divergence |
| `status-twave-vs-ground` | status | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-eq-vs-flying` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-eq-vs-levitate` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-eq-vs-airballoon` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-tbolt-vs-ground` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-tbolt-vs-voltabsorb` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-surf-vs-waterabsorb` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-flamethrower-vs-flashfire` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-gigadrain-vs-sapsipper` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-bodyslam-vs-ghost` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `imm-aurasphere-vs-ghost` | immunity / absorb | probe | 0 | 0 | 0 | 🔍 no divergence |
| `fixed-seismic-toss` | fixed-damage | probe | 0 | 0 | 0 | 🔍 no divergence |
| `fixed-night-shade` | fixed-damage | probe | 0 | 0 | 0 | 🔍 no divergence |
| `fixed-dragon-rage` | fixed-damage | probe | 0 | 0 | 0 | 🔍 no divergence |
| `fixed-sonic-boom` | fixed-damage | probe | 0 | 0 | 0 | 🔍 no divergence |
| `protect-blocks-damage` | protect | match | 0 | 0 | 0 | ✅ agrees |
| `protect-blocks-status` | protect | probe | 0 | 0 | 0 | 🔍 no divergence |
| `substitute-blocks-status` | substitute | probe | 0 | 0 | 1 | 🔍 no divergence |
| `moldbreaker-ignores-levitate` | ability-ignoring | probe | 0 | 0 | 0 | 🔍 no divergence |
| `scrappy-hits-ghost` | ability-ignoring | probe | 0 | 1 | 0 | 🔍 no divergence |
| `sturdy-survives-ohko` | survival | probe | 0 | 0 | 0 | 🔍 no divergence |
| `focussash-survives-ohko` | survival | probe | 0 | 0 | 0 | 🔍 no divergence |
| `speed-boost-ramp` | ability / end-of-turn | probe | 3 | 0 | 0 | 🔍 divergence (investigate) |
| `switchin-intimidate` | switch-in ability | probe | 0 | 0 | 0 | 🔍 no divergence |
| `hazard-stealth-rock-entry` | entry hazard | probe | 0 | 0 | 0 | 🔍 no divergence |
| `prankster-vs-dark` | ability / priority | probe | 0 | 1 | 0 | 🔍 no divergence |
| `psychic-terrain-blocks-priority` | terrain / priority | probe | 0 | 0 | 0 | 🔍 no divergence |
| `gravity-grounds-flying` | field / immunity | probe | 0 | 0 | 0 | 🔍 no divergence |
| `weakness-policy-se` | item / boost | probe | 0 | 0 | 0 | 🔍 no divergence |
| `flame-orb-self-burn` | item / status | probe | 0 | 0 | 0 | 🔍 no divergence |
| `toxic-orb-self-poison` | item / status | probe | 0 | 0 | 0 | 🔍 no divergence |
| `sand-chip` | weather / residual | probe | 0 | 0 | 0 | 🔍 no divergence |
| `speed-order-baseline` | turn order | probe | 0 | 0 | 0 | 🔍 no divergence |
| `priority-quick-attack` | turn order / priority | probe | 0 | 0 | 0 | 🔍 no divergence |
| `trick-room-order` | turn order / field | probe | 0 | 0 | 0 | 🔍 no divergence |
| `sanity-swords-dance-normal` | sanity | match | 0 | 0 | 0 | ✅ agrees |
| `sanity-tackle-neutral-damage` | sanity | match | 0 | 0 | 0 | ✅ agrees |
| `sanity-super-effective-faint` | sanity / type-chart | match | 0 | 0 | 0 | ✅ agrees |
| `gravity-blocks-fly` | two-turn / precondition | probe | 0 | 0 | 4 | 🔍 no divergence |
| `probe-freeze-dry-vs-water` | type-chart | probe | 0 | 0 | 0 | 🔍 no divergence |
| `probe-toxic-residual-ramp` | status / residual | probe | 0 | 0 | 0 | 🔍 no divergence |
| `probe-multi-hit-bullet-seed` | multi-hit | probe | 0 | 0 | 0 | 🔍 no divergence |

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

### `seminvuln-gust-hits-fly` — 🔍 no divergence
Gust (in the allow-list) must hit — and double on — a foe mid-Fly.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 3
- No divergences.

### `seminvuln-twave-misses-fly` — ✅ agrees
Thunder Wave (opponent-targeting status) must MISS a foe mid-Fly in both engines.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 2
- No divergences.

### `stat-growl-atk` — ✅ agrees
Growl lowers the foe Attack by 1.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `stat-leer-def` — ✅ agrees
Leer lowers the foe Defense by 1.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `stat-scaryface-spe` — ✅ agrees
Scary Face lowers the foe Speed by 2.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `stat-charm-atk2` — ✅ agrees
Charm lowers the foe Attack by 2.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `status-thunderwave-par` — ✅ agrees
Thunder Wave paralyzes a non-immune foe.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `status-willowisp-brn` — ✅ agrees
Will-O-Wisp burns a non-Fire foe.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `status-toxic-tox` — ✅ agrees
Toxic badly-poisons a non-Poison/Steel foe.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `status-spore-slp` — ✅ agrees
Spore sleeps a non-Grass foe.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `status-glare-par` — ✅ agrees
Glare paralyzes a Normal foe.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `status-willowisp-vs-fire` — 🔍 no divergence
Will-O-Wisp must NOT burn a Fire-type.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `status-twave-vs-electric` — 🔍 no divergence
Thunder Wave must NOT paralyze an Electric-type (Gen 6+).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `status-twave-vs-ground` — 🔍 no divergence
Thunder Wave must NOT paralyze a Ground-type.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-eq-vs-flying` — 🔍 no divergence
Earthquake vs a Flying-type

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-eq-vs-levitate` — 🔍 no divergence
Earthquake vs Levitate

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-eq-vs-airballoon` — 🔍 no divergence
Earthquake vs an Air Balloon holder

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-tbolt-vs-ground` — 🔍 no divergence
Thunderbolt vs a Ground-type

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-tbolt-vs-voltabsorb` — 🔍 no divergence
Thunderbolt vs Volt Absorb (absorb + heal)

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-surf-vs-waterabsorb` — 🔍 no divergence
Surf vs Water Absorb (absorb + heal)

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-flamethrower-vs-flashfire` — 🔍 no divergence
Flamethrower vs Flash Fire

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-gigadrain-vs-sapsipper` — 🔍 no divergence
Giga Drain vs Sap Sipper

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-bodyslam-vs-ghost` — 🔍 no divergence
Body Slam (Normal) vs a Ghost-type

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `imm-aurasphere-vs-ghost` — 🔍 no divergence
Aura Sphere (Fighting) vs a Ghost-type

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `fixed-seismic-toss` — 🔍 no divergence
Seismic Toss deals damage equal to user level (expect ~50 HP).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `fixed-night-shade` — 🔍 no divergence
Night Shade deals damage equal to user level (expect ~50 HP).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `fixed-dragon-rage` — 🔍 no divergence
Dragon Rage deals a flat 40 (expect ~40 HP).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `fixed-sonic-boom` — 🔍 no divergence
Sonic Boom deals a flat 20 (expect ~20 HP).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `protect-blocks-damage` — ✅ agrees
Protect blocks a damaging move — defender takes 0.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `protect-blocks-status` — 🔍 no divergence
Protect blocks Thunder Wave — no paralysis applied.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `substitute-blocks-status` — 🔍 no divergence
A Substitute (set up first) blocks Thunder Wave — no paralysis.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 2

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 2 | p2a | hp/damage | `140/140 (dmg~0)` | `70/140 (dmg~70)` | low |

### `moldbreaker-ignores-levitate` — 🔍 no divergence
Mold Breaker lets Earthquake hit a Levitate holder (damage, not 0).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `scrappy-hits-ghost` — 🔍 no divergence
Scrappy lets a Normal move hit a Ghost-type (damage, not 0).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 1 | p2a | status | `par` | `(none)` | medium |

### `sturdy-survives-ohko` — 🔍 no divergence
Sturdy survives a would-be OHKO from full HP (defender not fainted).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `focussash-survives-ohko` — 🔍 no divergence
Focus Sash survives a would-be OHKO from full HP (defender not fainted).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `speed-boost-ramp` — 🔍 divergence (investigate)
Speed Boost grants +1 Speed at the end of each turn (+1/+2/+3).

- **Maps to:** CONFIRMED real divergence (not harness): battle.html:28706 gates Speed Boost on `turnCount > 0` ("after first turn"), and turnCount++ runs AFTER endOfTurnEffects (battle.html:21676 vs 21682), so a lead skips its end-of-turn-1 boost → in-house 0/1/2 vs Showdown 1/2/3.
- Winner: Showdown=`null` · in-house=`null` · turns compared: 3

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 1 | p1a | boost.spe | `1` | `0` | high |
| 2 | p1a | boost.spe | `2` | `1` | high |
| 3 | p1a | boost.spe | `3` | `2` | high |

### `switchin-intimidate` — 🔍 no divergence
Switching in an Intimidate Pokémon lowers the foe Attack by 1.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 2
- No divergences.

### `hazard-stealth-rock-entry` — 🔍 no divergence
A Pokémon switched into Stealth Rock takes 1/8 max HP × type effectiveness (×4 vs Fire/Flying = 50%).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 2
- No divergences.

### `prankster-vs-dark` — 🔍 no divergence
A Prankster-boosted status move fails against a Dark-type (no paralysis).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1

| Turn | Mon | Field | Showdown | In-house | Conf |
|---|---|---|---|---|---|
| 1 | p2a | status | `(none)` | `par` | medium |

### `psychic-terrain-blocks-priority` — 🔍 no divergence
Psychic Terrain blocks a priority move aimed at a grounded target (0 damage).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 2
- No divergences.

### `gravity-grounds-flying` — 🔍 no divergence
Gravity grounds a Flying-type so Earthquake hits it (damage, not 0). Foe uses Defense Curl, not Splash, because Gravity disables Splash in Showdown (see note below).

- **Note:** Gravity GROUNDING works in both engines (EQ hits Pidgeot). Separately, the trace showed in-house does NOT disable Gravity-incompatible moves (Splash/Fly/Bounce/Jump Kick/Magnet Rise) — Showdown made the foe Struggle when its only move (Splash) was Gravity-locked. That corroborates catalogue finding #3 (Gravity does not restrict Fly).
- Winner: Showdown=`null` · in-house=`null` · turns compared: 2
- No divergences.

### `weakness-policy-se` — 🔍 no divergence
Weakness Policy raises the holder Atk & SpA by 2 after a super-effective hit.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `flame-orb-self-burn` — 🔍 no divergence
Flame Orb burns its holder at the end of the turn.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 2
- No divergences.

### `toxic-orb-self-poison` — 🔍 no divergence
Toxic Orb badly-poisons its holder at the end of the turn.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 2
- No divergences.

### `sand-chip` — 🔍 no divergence
Sandstorm chips non-Rock/Ground/Steel types 1/16 per turn.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 3
- No divergences.

### `speed-order-baseline` — 🔍 no divergence
Control: the faster Pokémon acts first when both use a normal-priority move.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `priority-quick-attack` — 🔍 no divergence
A +1 priority move (Quick Attack) lets the SLOWER Pokémon act first.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `trick-room-order` — 🔍 no divergence
Under Trick Room the SLOWER Pokémon acts first (turn 2 reverses).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 2
- No divergences.

### `sanity-swords-dance-normal` — ✅ agrees
Swords Dance x3 vs a passive foe — boosts must reach +2/+4/+6 in both engines.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 3
- No divergences.

### `sanity-tackle-neutral-damage` — ✅ agrees
One Strength (no secondary) into a passive foe — damage must agree within the 85-100% roll band.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `sanity-super-effective-faint` — ✅ agrees
A clearly super-effective hit must register comparable damage (and same faint outcome).

- Winner: Showdown=`P1` · in-house=`P1` · turns compared: 1
- No divergences.

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
Freeze-Dry is Ice that hits Water super-effectively (×2). A normal Ice calc would resist it (×0.5).

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.

### `probe-toxic-residual-ramp` — 🔍 no divergence
Toxic deals 1/16, 2/16, 3/16 max HP (no roll). The residual ramp should match exactly.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 3
- No divergences.

### `probe-multi-hit-bullet-seed` — 🔍 no divergence
Bullet Seed hits 2-5 times (RNG); hit count differs across engines — expected.

- Winner: Showdown=`null` · in-house=`null` · turns compared: 1
- No divergences.
