---
severity: P1
category: bug
anchor_symbol: parseMoveEffects-damage-formula
current_line_hint: ~23640
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 6922faf9569e
confidence: high
status: open
---

**Title**: Damage formula divides un-truncated (fractional) A/D — Showdown floors atk/def stats first (±1 HP)

**Evidence**:
```js
// battle.html:23640 — A and D are never Math.floor()'d after stage/item/ability mults
let damage = Math.floor((Math.floor(Math.floor(22 * basePower * (A / D)) / 50) + 2) * modifier);
// A,D come from e.g. attacker.stats.atk * getStageMult(stage) (1.5 on +1) and Choice Band A*=1.5,
// Eviolite D*=1.5, Marvel Scale modifier*=2/3, etc. -> A,D routinely fractional (e.g. 85*1.5=127.5).
```

Showdown truncates the *modified* Attack and Defense to integers (`tr()`/pokeRound) before the
`atk/def` division. This engine keeps them fractional and floors only the product. For integer A/D the
two are identical (verified 0/5115), but whenever a stage boost (odd stat ×1.5) or item/ability mult makes
A or D fractional, the results diverge by ±1 HP in ~14% of cases (8655 reachable Lv50 combos enumerated).

**Repro**: `node scripts/debug/_repro/ad-diverge.mjs` — Pound (BP40, no STAB, neutral) with atk=41 at +1 stage (→61.5) vs def=40, roll pinned 0.99, no crit: **engine deals 28 HP, Showdown deals 27 HP** (engine over-damages because A stays 61.5 instead of flooring to 61). Confirmed against the live engine via the jsdom harness.

**Blast radius**: Every attack with a boosted/dropped stat, a Choice item, Eviolite, Assault Vest, Marvel Scale, Hustle, Huge Power on an odd base, etc. Affects OHKO/2HKO break-points and any future `@smogon/calc` point comparison. The damage-formula test suite mirrors the engine's own formula, so it cannot catch this; deviations.md does not document it.

**Fix sketch**: Truncate A and D to integers right before the formula: `A = Math.floor(A); D = Math.floor(D);` (or floor each modified stat as it is applied, mirroring Showdown's per-step `tr()`). Keep the existing `A/D`-first ordering — that part already matches Showdown for integer stats.

**Verification**: Re-run `scripts/debug/_repro/ad-diverge.mjs`; engine should now deal 27. Add a focused test: +1-stage odd-atk attacker vs integer-def defender, assert HP matches Showdown's floored-stat value.

---
severity: P1
category: bug
anchor_symbol: parseMoveEffects-damage-roll
current_line_hint: ~23349
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 36c4d7d6540c
confidence: high
status: open
---

**Title**: Damage roll is continuous `0.85+rand*0.15` — never reaches 100%, so max-roll damage is unreachable

**Evidence**:
```js
// battle.html:23349
let rng = 0.85 + (Math.random() * 0.15);
// damage = Math.floor((base+2) * modifier)  where modifier includes rng
```

Showdown uses 16 *discrete* integer factors (85,86,…,100)/100 applied to the running integer damage:
`damage = floor(damage * (100 - randomFactor)/100)`, randomFactor ∈ {0..15}. Because `Math.random()` is
`[0,1)`, this engine's roll maxes at `0.85+0.99…×0.15 < 1.0`, so `floor(base × <1.0)` is **always at least 1 below the true max-roll**. It also produces intermediate damage values Showdown can never produce (continuous vs 16-step ladder).

**Repro**: `node scripts/debug/_repro/roll-max.mjs` — neutral Pound, A=D (base 19). With `Math.random()` pinned to 0.999999, **engine deals 18; Showdown max-roll is 19.** The engine cannot deliver the 100% roll on any move. Runtime-confirmed via the harness. (This persists under the seeded mulberry32 install — it is independent of ISSUE-026's RNG seeding.)

**Blast radius**: Every damaging move's high end. A move that is a *guaranteed* OHKO/2HKO at max roll in Showdown may fail to KO here at the top of its range — directly affects break-point/KO-chance correctness and any range-vs-Showdown comparison.

**Fix sketch**: Replace the continuous roll with the canonical 16-step integer form: pick `f = 85 + floor(rand*16)` (0..15 → 85..100) and apply `damage = floor(damage * f / 100)` in the modifier pipeline. This makes 100% reachable and matches Showdown's discrete ladder.

**Verification**: Re-run `scripts/debug/_repro/roll-max.mjs`; max roll should now equal `base` (19). Property test: over many seeds the observed roll multipliers should be exactly the 16 values 0.85..1.00.

---
severity: P2
category: inconsistency
anchor_symbol: parseMoveEffects-modifier-pipeline
current_line_hint: ~23489
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 7b9556a99fb4
confidence: high
status: open
---

**Title**: All damage modifiers collapsed into one multiply + single floor — Showdown floors per modifier (multi-HP drift)

**Evidence**:
```js
// battle.html:23489 — STAB, type, crit, roll, life orb, screens, weather-sports … all into one number
let modifier = stab * typeEff * crit * rng * lifeOrb;
// … ~70 lines of  modifier *= X …
// battle.html:23640 — a single floor at the end
let damage = Math.floor((Math.floor(Math.floor(22 * basePower * (A / D)) / 50) + 2) * modifier);
```

Showdown's `modifyDamage` applies each modifier as its own `tr(damage * mod)` step in a fixed order
(crit → random → STAB → typeEff for *each* defending type separately → burn → other), flooring between
each. Collapsing them into one product and flooring once accumulates the truncation error, and the gap grows with the number/size of modifiers.

**Repro**: `node scripts/debug/_repro/pipeline3.mjs` — Charizard Flamethrower (Fire STAB ×1.5) vs Scizor (Bug/Steel = 4× super-effective), roll 0.85, no crit: **engine "It dealt 270 damage"** (matches its single-floor `floor(53×1.5×4×0.85)=270` exactly) **vs Showdown sequential-floor = 268 → +2 HP drift.** A wider enumeration shows STAB+4× cases drifting by up to ~6–7 HP at low base damage. (Sub-symptoms: the A/D and damage-roll findings are concrete instances of this same "floor late" philosophy.)

**Blast radius**: Every multi-modifier hit, especially STAB + super-effective and STAB + super-effective + crit/screens/items. Systematically over-states damage vs Showdown. Affects KO ranges across the board.

**Fix sketch**: Apply modifiers sequentially with a floor (Showdown's `tr`/pokeRound) between each step in canonical order, rather than `floor(base × combinedProduct)`. Largest behavioral correctness win of the three; can be staged after the A/D and roll fixes since those are cleaner.

**Verification**: `scripts/debug/_repro/pipeline3.mjs` should report 268. Build a small matrix of (STAB, typeEff, crit, roll) cases and assert each matches `@smogon/calc` to the HP.

---
severity: P2
category: bug
anchor_symbol: parseMoveEffects-effectiveCat-burn
current_line_hint: ~23500
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1c1d60204985
confidence: medium
status: open
---

**Title**: Burn halving & Ice Scales key off `move.cat`, not `_effectiveCat` — wrong for Photon Geyser / Shell Side Arm

**Evidence**:
```js
// battle.html:23500 — burn uses move.cat
if (attacker.status === "BRN" && move.cat === "Physical" && attacker.ability !== "Guts") modifier *= 0.5;
// battle.html:23511 — Ice Scales uses move.cat
if (_defAbilityActive && defender.ability === "Ice Scales" && move.cat === "Special") modifier *= 0.5;
// but A/D and Fur Coat/Marvel Scale/Ruin/screens all correctly use _effectiveCat (set for Photon Geyser/Shell Side Arm)
```

Photon Geyser, Shell Side Arm, and Light That Burns the Sky are base-category "Special" (verified in
data/moves.json gen9) but the engine recomputes `_effectiveCat` to "Physical" when the user's Atk wins.
A burned attacker firing Photon Geyser as a physical hit (`_effectiveCat="Physical"`, `move.cat="Special"`)
**escapes the burn penalty** (engine over-damages; Showdown halves). Conversely Ice Scales wrongly halves a
Shell Side Arm that resolves Physical (`move.cat="Special"`) — engine under-damages; Showdown would not halve.

**Repro**: Burned Necrozma using Photon Geyser (physical) into a neutral wall: engine deals full damage; Showdown applies the ½ burn cut. Scenario spec — attacker.status="BRN", move=Photon Geyser with Atk>SpA; compare dealt damage with vs without the status. (Narrow: only ~3 category-flipping moves exist.)

**Blast radius**: Limited to Photon Geyser / Shell Side Arm (and Ultra Necrozma's Z-move) interacting with Burn or Ice Scales. Real but low frequency.

**Fix sketch**: Change both predicates to `_effectiveCat` (which is already computed above the modifier block and is what every other category-gated modifier uses): `_effectiveCat === "Physical"` for burn, `_effectiveCat === "Special"` for Ice Scales.

**Verification**: Burned Photon-Geyser-physical hit takes the ½ cut; Shell-Side-Arm-physical is not halved by Ice Scales. Compare against Showdown for both arms.

