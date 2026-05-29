---
severity: P2
category: bug
anchor_symbol: endOfTurnEffects
current_line_hint: ~28183
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 8f218d3586ac
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Leech Seed end-of-turn drain ignores Magic Guard (holder loses HP, seeder heals)

**Evidence**:
```js
// endOfTurnEffects — Leech Seed block sits OUTSIDE the status-damage Magic Guard gate
// (the `if (mon.ability !== "Magic Guard")` at the burn/poison block) and had no guard of its own:
if (mon.volatile.leechSeed) {            // <- no Magic Guard check (Curse/Salt Cure both have one)
    let drain = Math.max(1, Math.floor(mon.maxHp / 8));
    mon.currentHp -= Math.min(mon.currentHp, drain);
    if (foe.currentHp > 0) foe.currentHp += ...;   // seeder wrongly heals too
}
```
Magic Guard prevents all indirect damage, including Leech Seed (Bulbapedia). Curse (`mon.ability !== "Magic Guard"`)
and Salt Cure already guard correctly; Leech Seed and partial-trap did not.

**Repro**: `node scripts/debug/_repro/magicguard-residual.mjs` — a Magic Guard Clefable with `leechSeed` loses 0 HP and the foe heals 0 after the fix (Cute Charm control loses 1/8 and the foe heals).

**Blast radius**: Every Magic Guard mon (Clefable, Reuniclus, Sigilyph) that gets Leech-Seeded — it took chip it should be immune to, and fed the seeder HP. Affects stall/PvE longevity math and seeded replays.

**Fix sketch**: Add `&& mon.ability !== "Magic Guard"` to the Leech Seed condition so neither the drain nor the seeder heal occurs (the seed volatile still persists).

**Verification**: `magicguard-residual.mjs` shows Magic Guard loses 0 to Leech Seed; full suite 897 pass / 0 fail.

---
severity: P2
category: bug
anchor_symbol: endOfTurnEffects
current_line_hint: ~28217
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 8e643c7a0df7
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Partial-trap (Bind / Fire Spin / Whirlpool / Sand Tomb) end-of-turn damage ignores Magic Guard

**Evidence**:
```js
if (mon.volatile.partialTrap > 0 && !_stickyTrap) {
    mon.volatile.partialTrap--;
    if (story nullifier) { ... } else {
        let trapDmg = Math.max(1, Math.floor(mon.maxHp / 8));   // <- no Magic Guard check
        mon.currentHp -= Math.min(mon.currentHp, trapDmg);
    }
}
```
Magic Guard prevents partial-trap chip in canon, but the trap should still expire on schedule.

**Repro**: `node scripts/debug/_repro/magicguard-residual.mjs` — Magic Guard mon under Fire Spin loses 0 HP but its trap counter still ticks 3→2.

**Blast radius**: Any Magic Guard mon caught by a binding move. Lower frequency than Leech Seed but same class of bug.

**Fix sketch**: Branch the damage on `mon.ability === "Magic Guard"` (skip damage), keeping the counter decrement and the "was freed" message outside the damage branch so the trap still expires and reports correctly.

**Verification**: `magicguard-residual.mjs`; full suite 897 pass / 0 fail.

---
severity: P2
category: bug
anchor_symbol: playTurn
current_line_hint: ~21045
file: battle.html
agents: [battle-engine-debugger]
fingerprint: c4989fd4604d
confidence: high
status: open
---

**Title**: End-of-turn residuals always resolve player-active-first, not in Speed order

**Evidence**:
```js
// Both EoT call sites (the residual phase and the post-faint replacement path) hard-code player first:
endOfTurnEffects(state.pActive, state.fActive); endOfTurnEffects(state.fActive, state.pActive);
```
Canon resolves end-of-turn residuals in Speed order (faster mon's residuals first; reversed under Trick Room; speed ties random). The engine always processes the player's active first.

**Repro**: Static read of both call sites (~20282 and ~21045). With a faster foe, its weather/poison/Leech-Seed residual should resolve before the player's, but does not.

**Blast radius**: Mostly the rare case where both actives are at residual-faint range, or Leech Seed + a dying seeded mon — the order decides who faints first and whether the seeder gets its heal. Also any seeded-replay comparison vs Showdown.

**Fix sketch**: At both call sites, order the two `endOfTurnEffects` calls by `getEffectiveSpeed` (respecting Trick Room and a random tie-break), instead of always player-first. Keep the single post-loop `checkFaints`.

**Verification**: Construct a both-dying-from-residual scenario with a faster foe; assert the faster mon's residual log precedes the slower's and faint order matches Showdown.

---
severity: P3
category: bug
anchor_symbol: endOfTurnEffects
current_line_hint: ~28183
file: battle.html
agents: [battle-engine-debugger]
fingerprint: efa26d799b51
confidence: high
status: open
---

**Title**: Leech Seed drain is processed AFTER burn/poison/toxic damage (canon order is before)

**Evidence**:
```js
// Order in endOfTurnEffects: status damage (BRN/PSN/TOX) at ~28129, THEN Leech Seed at ~28183.
// Canonical Gen end-of-turn order: ... Ingrain → Leech Seed → Poison/Toxic → Burn → Curse → trap ...
```
Leech Seed (canon order ~9) should drain before Poison (~10) and Burn (~11); the engine has poison/burn first.

**Repro**: Static read of `endOfTurnEffects`. A seeded + poisoned mon at low HP: canon drains via Leech Seed first (seeder heals), then poison; the engine poisons first, so a mon that faints to poison never feeds the seeder.

**Blast radius**: Edge case — both effects on one low-HP mon. Decides whether the seeder gets its Leech Seed heal when the seeded mon is dying. Low frequency.

**Fix sketch**: Move the Leech Seed block above the status-damage block (after Aqua Ring / Ingrain, before BRN/PSN/TOX) to match canon residual order. Deferred here as a contained code-movement to avoid risk in the same pass as the higher-impact fixes.

**Verification**: Seeded + poisoned low-HP mon; assert Leech Seed log precedes the poison log and the seeder heals before the mon faints.
