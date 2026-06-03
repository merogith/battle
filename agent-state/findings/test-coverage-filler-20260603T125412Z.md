---
severity: P2
category: bug
anchor_symbol: Comeuppance
current_line_hint: ~23553
file: battle.html
agents: [test-coverage-filler]
fingerprint: d1fcc81fbdea
confidence: high
status: fixed-claude/inspiring-shannon-MP5aq
---

**Title**: Comeuppance reflects 0 damage in all cases (twin Metal Burst works)

**Resolution**: Routed Comeuppance through the working Metal Burst reflect path
(`battle.html:~23553`), which reads the user's own `attacker.volatile` taken-damage.
Confirmed on HEAD: 124 (phys) / 19 (spec) / 0 (no prior hit), identical to Metal
Burst. Regression test in `manual/prior-context.test.js`.

**Evidence**:
```js
// battle.html:23411 — the working reflect path reads attacker.volatile + deals damage, but omits Comeuppance:
if (move.name === "Metal Burst") {
    let lastDmg = Math.max(attacker.volatile.lastPhysicalDmg || 0, attacker.volatile.lastSpecialDmg || 0);
    ...
}
// battle.html:24379 — Comeuppance only reaches here, and reads defender.volatile (the target, who took no damage) -> "But it failed!"
if (move.name === "Metal Burst" || move.name === "Comeuppance") {
    let lastDmg = Math.max(defender.volatile.lastPhysicalDmg, defender.volatile.lastSpecialDmg);
```

**Repro**: jsdom harness — player Comeuppance vs foe Body Slam (user slower so it's hit first): 0 damage. Identical setup with Metal Burst: 124 damage. (tests/moves/by-category/_drafts/prior-context.test.js excludes Comeuppance for this reason.)

**Blast radius**: Comeuppance is non-functional. Out-of-practical-scope if no story foe/move pool uses it, but the move is dead either way.

**Fix sketch**: Add `|| move.name === "Comeuppance"` to the line-23412 condition (the path that correctly uses attacker.volatile.lastDmg), or fix the 24379 fallback to read attacker.volatile rather than defender.volatile.

**Verification**: Re-run the prior-context draft with a Comeuppance reflect assertion mirroring Metal Burst's (foeDmg > 0 vs physical/special, 0 with no prior hit).

---
severity: P2
category: bug
anchor_symbol: Crush Grip
current_line_hint: ~23887
file: battle.html
agents: [test-coverage-filler]
fingerprint: 052224dd33cd
confidence: high
status: fixed-claude/inspiring-shannon-MP5aq
---

**Title**: Crush Grip doesn't scale with target HP (constant ~2 dmg); siblings do

**Resolution**: Added `Crush Grip` to the Wring Out / Hard Press HP-scaling line
(`battle.html:~23887`, `120 * currentHp/maxHp`). Confirmed on HEAD: scales 281
(full HP) → 85 (30% HP) vs Blissey. Regression test in `manual/variable-damage.test.js`
(now asserted in the Wring Out / Hard Press scaling loop).

**Evidence**:
```js
// battle.html:23746 — HP-scaling power is set for Wring Out / Hard Press but NOT Crush Grip:
if ((move.name === "Wring Out" || move.name === "Hard Press") && !basePower) basePower = Math.max(1, Math.floor(120 * defender.currentHp / defender.maxHp));
// battle.html:24367 — comment wrongly claims all three are handled:
// Crush Grip / Wring Out / Hard Press: already set basePower above; no override needed
```

**Repro**: jsdom harness — Crush Grip vs full-HP Blissey and vs 30%-HP Blissey both deal ~2 (no scaling), while Wring Out scales 18→55 and Hard Press 57→187 across the same HP range.

**Blast radius**: Crush Grip is a near-zero-power move (the move-data basePower is 0 and never overridden), so it deals ~1–2 regardless of target HP.

**Fix sketch**: Add `"Crush Grip"` to the line-23746 condition so it receives the same `120 * currentHp/maxHp` power as Wring Out / Hard Press (or its real gen formula).

**Verification**: Crush Grip dmg vs 100%-HP target > dmg vs 30%-HP target (add to variable-damage draft, replacing the current "deals damage" placeholder).

---
severity: P3
category: bug
anchor_symbol: Upper Hand
current_line_hint: ~22368
file: battle.html
agents: [test-coverage-filler]
fingerprint: 0443b0ccfa4b
confidence: high
status: fixed-claude/inspiring-shannon-MP5aq
---

**Title**: Upper Hand / Shell Trap don't enforce their precondition gate

**Resolution**: Added both gates in the pre-move block (`battle.html:~22451`). Upper Hand
now fails unless the target's queued move is a priority attacking move (peeks
`state.p2Action`, like Sucker Punch); the move data already carried pri 3 + the flinch.
Shell Trap now fails unless the user took a physical hit this turn (`volatile.lastPhysicalDmg > 0`).
Verified: Upper Hand 110 vs Quick Attack / 0 vs Body Slam & Splash; Shell Trap 53 after a
physical hit / 0 vs special & none. Gate regression tests in `manual/prior-context.test.js`.

**Evidence**:
```text
grep -n "Upper Hand" battle.html   -> 0 hits (no special handling at all)
grep -n "Shell Trap" battle.html   -> only in _stBanned / _ccBanned / _instructBanned sets (no trap-trigger logic)
```

**Repro**: jsdom harness — Upper Hand deals ~110 whether the foe uses Quick Attack (priority) or Body Slam (non-priority); Shell Trap deals ~53 whether the foe uses Body Slam (physical) or Splash. Both should only succeed under their gate.

**Blast radius**: Both behave as generic damaging moves (over-permissive). Niche moves; low story impact. Upper Hand also lacks its priority and flinch effect.

**Fix sketch**: Gate Upper Hand on the target being queued to use a priority attacking move (else fail) + flinch; gate Shell Trap on the user having been hit by a physical move this turn (else fail). Low priority.

**Verification**: Upper Hand fails vs a non-priority move; Shell Trap fails vs a non-physical move (negative assertions in the prior-context draft).

