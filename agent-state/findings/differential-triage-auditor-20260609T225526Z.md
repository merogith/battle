<!-- Triage of the comprehensive Showdown-parity sweep (tests/differential/sweep-all.mjs).
Shard summary: 26 high-confidence divergent entities → 2 real engine findings below;
the remainder are RNG (Acupressure/Metronome/Moody random-stat, multi-hit hit-count),
species-locked moves/abilities forced onto the wrong species (Aura Wheel/Hyperspace
Fury/Disguise/Tera Shell), or gen-mechanic edges (Snow=Hail) — recorded in
tests/differential/HARNESS_LIMITATIONS.md, not filed. -->
---
severity: P1
category: bug
anchor_symbol: parseMoveEffects
current_line_hint: ~27858
file: battle.html
agents: [differential-triage-auditor]
fingerprint: 444b0dea4920
confidence: high
status: open
---

**Title**: Data-driven boost block returns early, bypassing named-branch extra effects (Memento self-faint, Toxic Thread poison)

**Evidence**:
```js
// battle.html ~27827 — data-driven boosts for Status moves
if (move.cat === "Status" && move.boosts && typeof move.boosts === 'object') {
    ...
    for (const [stat, rawDelta] of Object.entries(move.boosts)) { ... changeStage(...); applied++; }
    if (applied > 0) return;            // <-- returns BEFORE the named branches below
}
// ...never reached for Memento / Toxic Thread:
// 28241: if (move.name === "Memento") { attacker.currentHp = 0; ... }   (self-faint)
// 28622: if (move.name === "Toxic Thread") { changeStage(...,'spe',-1); applyStatus(defender,"PSN"); }
```

**Repro**: `node tests/differential/sweep-all.mjs --filter memento --kind move --seeds 4` (also `--filter toxicthread`). Direct: Memento drops the foe −2 Atk/−2 SpA but the USER does not faint (log shows "ATK harshly fell", never "used Memento and fainted!"). Toxic Thread drops Speed but never poisons. Both vs Showdown which faints / poisons.

**Blast radius**: SYSTEMIC — any Status move carrying a `boosts` field in data AND a named branch for an additional effect loses that effect. Confirmed: Memento (self-faint), Toxic Thread (poison). Audit other moves of this shape.

**Fix sketch**: the `if (applied > 0) return;` at ~27858 must not short-circuit moves that have further named handling. Either run the named branches before the data-driven boost block, or gate the early return to pure stat-change moves (exclude names with extra effects).

**Verification**: `tests/differential/sweep-all.mjs --filter memento` → agree; re-run `npm run test:differential:all`; add a direct assertion (Memento faints user; Toxic Thread poisons).

---
severity: P2
category: bug
anchor_symbol: parseMoveEffects
current_line_hint: ~27300
file: battle.html
agents: [differential-triage-auditor]
fingerprint: 98c05652f3a8
confidence: high
status: open
---

**Title**: Precondition moves unimplemented — deal damage that should fail (Dream Eater, Thunderclap, Synchronoise)

**Evidence**:
```text
grep "Dream Eater"|"Thunderclap"|"Synchronoise" battle.html → 0 named branches.
With no handler they fall through to the vanilla damage path, so their fail-precondition is never checked:
  Dream Eater   → 97 dmg to an AWAKE foe   (should fail unless target asleep)
  Thunderclap   → 46 dmg to a non-attacker (should fail unless target is using an attack; Sucker-Punch rule)
  Synchronoise  → 117 dmg, no shared type  (should fail unless target shares a type with the user)
Showdown deals 0 in all three.
```

**Repro**: `node tests/differential/sweep-all.mjs --filter dreameater --kind move --seeds 4` (also thunderclap, synchronoise). Same bug class as the already-fixed Fly/Gravity preconditions.

**Blast radius**: each move deals damage when it should whiff. Low traffic (niche moves) but user-visible and exploitable. Synchronoise/Dream Eater are story-reachable.

**Fix sketch**: add a precondition guard before the damage path for each: Dream Eater (defender.status === 'SLP'), Thunderclap (target is selecting an attacking move this turn — mirror Sucker Punch), Synchronoise (attacker and defender share a type).

**Verification**: `tests/differential/sweep-all.mjs --filter dreameater|thunderclap|synchronoise` → all 0 dmg vs an awake/non-attacking/no-shared-type foe.

