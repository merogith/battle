---
severity: P1
category: bug
anchor_symbol: clearVolatileOnSwitch
current_line_hint: ~25703
file: battle.html
agents: [battle-engine-debugger]
fingerprint: a91c04d51751
confidence: high
status: open
---

**Title**: Toxic (badly-poison) counter `statusTurns` is not reset on switch-out

**Evidence**:
```js
function clearVolatileOnSwitch(mon) {
    if (mon.ability === "Natural Cure" && mon.status) { ... mon.statusTurns = 0; }
    mon.stages = {atk:0, ...};
    mon.volatile.confusion = 0;
    // ...clears every volatile, BUT never resets mon.statusTurns for a surviving TOX mon...
}   // statusTurns survives the switch -> toxic damage keeps escalating
```

**Repro**: `node scripts/debug/_repro/tox-reset.mjs` — TOX a Snorlax, tick 4 EoTs (counter→4, ~1/16…4/16), call `clearVolatileOnSwitch`, restore to full HP, tick one more EoT. Observed: `statusTurns` stays 4 across the switch and the first tick back in deals 5/16 (73 of 235 HP). Canonical Gen 2+: switching out resets the badly-poison counter, so the first tick after re-entry is 1/16.

**Blast radius**: Every TOX interaction with switching (story + PvP). A Toxic-stalling player/AI that pivots keeps the escalated counter, so a returning mon takes far more residual damage than canon — silently warps long-game stall math and any seeded replay comparison. Also affects Poison Heal/Toxic-counter readouts (`statusTurns` is shared).

**Fix sketch**: In `clearVolatileOnSwitch`, when the outgoing mon's status is "TOX", reset its escalation counter (`mon.statusTurns = 0`) so it restarts at 1/16 on re-entry. Leave SLP/other counters governed by their own handlers.

**Verification**: Re-run `tox-reset.mjs`; first EoT tick after `clearVolatileOnSwitch` must be 1/16 of maxHp. Add a status suite assertion: TOX → switch → switch back → first tick == floor(maxHp/16).

---
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~24084
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 69b6c1abe5f6
confidence: high
status: open
---

**Title**: Fire-type damaging moves do not thaw a frozen target (only flag-marked moves thaw)

**Evidence**:
```js
const _thawsTargetMoves = new Set(["Scald","Hydro Steam","Steam Eruption","Scorching Sands","Matcha Gotcha","Burning Jealousy"]);
const _movethaws = move.thawsTarget || (move.flags && (move.flags.defrost || move.flags.thawsTarget)) || _thawsTargetMoves.has(move.name);
if (_movethaws && defender.status === "FRZ" && defender.currentHp > 0 && !hitSub) { defender.status = null; ... }
// Flamethrower/Fire Blast/Ember/Fire Punch carry NO defrost flag -> never thaw the target
```

**Repro**: `node scripts/debug/_repro/frz-thaw3.mjs` — Charizard hits a frozen Snorlax with Flamethrower / Fire Blast / Fire Punch / Ember: damage lands but `defender.status` stays "FRZ". Control: Scald (Water + `defrost` flag) correctly thaws. Move-flag dump: `Flamethrower flags={protect,mirror,metronome}` (no defrost); only Flare Blitz/Sacred Fire/Scald carry `defrost`.

**Blast radius**: Every Fire-type attacker vs a frozen target (very common — freeze + Fire coverage). The frozen mon stays locked until its own 20% thaw roll, doubling the effective freeze duration the engine intends. Diverges from Showdown/Gen 2+ where ALL Fire-type damaging moves thaw the target.

**Fix sketch**: Extend the thaw-on-hit condition to also fire when `move.type === "Fire" && move.cat !== "Status"` (in addition to the existing flag/named-move set). Keep the `!hitSub` and `currentHp > 0` guards.

**Verification**: Re-run `frz-thaw3.mjs`; all Fire damaging moves must set `defender.status = null` with a "was thawed out" log. Non-Fire non-flagged moves must NOT thaw.

---
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~24276
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 6c062b4964cb
confidence: high
status: open
---

**Title**: HP-restore berry (Sitrus/Oran) eaten mid-hit suppresses Berserk / Wimp Out / Anger Shell HP-cross

**Evidence**:
```js
actualDamage = Math.min(defender.currentHp, damage); defender.currentHp -= actualDamage;
_checkBerriesAfterDamage(defender);          // <-- Sitrus heals currentHp back up HERE
// ...later...
if (defender.ability === "Berserk" && ... actualDamage > 0) {
    let _bkBefore = defender.currentHp + actualDamage;   // currentHp is post-heal -> over-counts
    if (_bkBefore > _bkHalf && defender.currentHp <= _bkHalf) { ... }  // false after heal
}
```

**Repro**: `node scripts/debug/_repro/berserk-sitrus3.mjs` (sets `state.magicRoom=0` to match production). Berserk Snorlax at 121/235 hit for 10 → 111 (47%). Without a berry: Berserk fires (SpA +1). Holding Sitrus: Sitrus heals to 169 (72%) at `_checkBerriesAfterDamage`, then `currentHp(169) <= half(117.5)` is false → Berserk does NOT fire (SpA stays 0).

**Blast radius**: All HP-threshold reactive triggers that reconstruct pre-hit HP via `currentHp + actualDamage`: Berserk, Anger Shell, Wimp Out, Emergency Exit, Shields Down, Power Construct. Any of those holding Sitrus/Oran/Berry Juice silently lose their effect when the same hit crosses 50%. Common on bulky Berserk/Wimp Out sets.

**Fix sketch**: Capture the post-damage HP before `_checkBerriesAfterDamage` runs (e.g. `const _hpAfterHit = defender.currentHp;`) and have the HP-cross checks compare against `_hpAfterHit` instead of live `currentHp`; or defer `_checkBerriesAfterDamage` until after the HP-cross reactive block (canon order: cross-triggered ability/berry resolve before the heal restores HP).

**Verification**: Re-run `berserk-sitrus3.mjs`; Berserk must fire (SpA 0→1) whether or not Sitrus is held. Add a status/item suite case for Wimp Out + Sitrus crossing 50%.

---
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~23835
file: battle.html
agents: [battle-engine-debugger]
fingerprint: c57e525b9f15
confidence: high
status: open
---

**Title**: Multi-hit contact moves skip all on-contact abilities/items (Rough Skin, Iron Barbs, Rocky Helmet, Static, etc.)

**Evidence**:
```js
if (numHits > 1) {
    // ...apply all hits, animations, Life Orb recoil, parseMoveEffects...
    return;            // <-- returns BEFORE the on-contact block at ~24145
}
// on-contact block (Static/Poison Point/Flame Body/Effect Spore/Rough Skin/Iron Barbs/Rocky Helmet/Gooey/Mummy/Cursed Body/King's Rock flinch) is single-hit-only
```

**Repro**: `node scripts/debug/_repro/multihit-contact.mjs` — Hitmonlee's Double Kick (2-hit contact) vs Iron Barbs Ferrothorn → attacker recoil = 0; vs Rocky Helmet holder → recoil = 0. Control: single-hit Brick Break vs Iron Barbs → recoil = 15 with the "hurt by Iron Barbs" log.

**Blast radius**: Every multi-hit contact move (Double Kick, Dual Wingbeat, Dual Chop, Triple Axel, Triple Kick, Arm Thrust, Tail Slap, Double Hit, Twineedle, Gear Grind, etc.) never triggers contact-recoil abilities (Rough Skin/Iron Barbs), Rocky Helmet, contact-status abilities (Static/Poison Point/Flame Body/Effect Spore/Cute Charm/Poison Touch), Gooey/Tangling Hair speed drop, Mummy, Cursed Body, or King's Rock/Razor Fang flinch. In canon these fire per contact hit. Big AI/eval and playthrough impact.

**Fix sketch**: Refactor the on-contact and on-hit reactive blocks (~24145–24410) into a helper invoked from BOTH the single-hit path and the multi-hit branch (ideally per landed hit for recoil items, once for status-chance abilities), rather than after the single-hit `return`. Guard with `attacker.currentHp > 0` between hits.

**Verification**: Re-run `multihit-contact.mjs`; Double Kick vs Iron Barbs / Rocky Helmet must apply contact recoil. Add property-test coverage that a multi-hit contact move triggers Rough Skin at least once.

---
severity: P2
category: bug
anchor_symbol: getEffectiveSpeed
current_line_hint: ~21374
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 2237f9cefc92
confidence: high
status: open
---

**Title**: Salac Berry grants a phantom 1.5x Speed while merely held at <=25% HP (not consumed)

**Evidence**:
```js
if (_spdItemActive && mon.item === "Salac Berry" && mon.currentHp <= mon.maxHp * 0.25) spe *= 1.5;
```

**Repro**: `node scripts/debug/_repro/salac-speed.mjs` — Jolteon base Speed 150. Drop to <=25% HP while still HOLDING an un-eaten Salac → `getEffectiveSpeed` returns 225 (1.5x) before any consumption. Worse, with Unnerve on the foe (which prevents Salac from ever being eaten) the holder still reads 225. The real effect (+1 Speed stage on EoT consumption) is already applied separately at `endOfTurnEffects` (~28207).

**Blast radius**: Turn order whenever a Salac holder is at <=25% HP before the EoT eat, and any case where consumption is suppressed (Unnerve, Embargo, Magic Room — `_spdItemActive` here doesn't even check Klutz/Unnerve). Salac is a treated as a passive held-item multiplier like Choice Scarf, which is incorrect; it should only ever act through the +1 stage it grants on being eaten.

**Fix sketch**: Delete the line — Salac's speed boost is the +1 stage applied on consumption (already handled in `endOfTurnEffects`). No held-item multiplier belongs in `getEffectiveSpeed`.

**Verification**: Re-run `salac-speed.mjs`; a <=25% HP Salac holder must read base Speed (150) until the EoT eat, after which the +1 stage (×1.5) applies and the item is gone.

