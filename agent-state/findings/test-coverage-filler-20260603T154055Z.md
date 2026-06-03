---
severity: P2
category: bug
anchor_symbol: Trick
current_line_hint: ~27635
file: battle.html
agents: [test-coverage-filler]
fingerprint: f5fbfd6fa9b5
confidence: high
status: fixed-main
---

**Title**: Trick / Switcheroo swap is one-directional — the user's item is destroyed

**Resolution**: No longer reproduces on HEAD (`battle.html:~27762` swaps both items
and clears choice locks). Re-verified via the jsdom harness on
claude/inspiring-shannon-MP5aq with the original pairs (Iron Ball/Oran Berry,
Oran/Lum) incl. a low-HP foe: Trick and Switcheroo each swap both items correctly.
Stale finding — fixed upstream.

**Evidence**:
```js
// battle.html:27635 — the swap line itself LOOKS correct:
let temp = attacker.item; attacker.item = defender.item; defender.item = temp;
// ...yet observed behavior is one-directional (likely a post-swap overwrite / reference issue).
```

**Repro**: jsdom harness, instrumented (pActive===a, fActive===d confirmed). Mew holding Iron Ball uses Trick on Snorlax holding Oran Berry:
BEFORE a.item=Iron Ball d.item=Oran Berry → AFTER a.item=Oran Berry d.item=Oran Berry.
The user receives the foe's item, but the foe keeps its own; the user's Iron Ball is gone. Reproduces for Switcheroo and across item pairs (Iron Ball/Oran, Oran/Lum).

**Blast radius**: A foe (or player) using Trick/Switcheroo loses its item for nothing and fails to saddle the target (e.g., a Choice/Iron Ball trickster does nothing to the opponent). Item economy bug.

**Fix sketch**: The literal swap at 27635 is correct, so trace what re-reads/overwrites `defender.item` after the handler returns (end-of-turn item normalization or an AI mon re-deriving its build item). Add a deterministic test asserting both sides swap.

**Verification**: After Trick, attacker.item === foe's old item AND defender.item === user's old item (see tests/moves/by-category/_drafts — Trick is currently deferred for this reason).

---
severity: P3
category: bug
anchor_symbol: Power Shift
current_line_hint: ~24000
file: battle.html
agents: [test-coverage-filler]
fingerprint: 1c0e0b5ce79f
confidence: medium
status: open
---

**Title**: Several status moves have no observable effect in the battle engine

**Evidence**:
```text
Confirmed no-op (state directly inspected, jsdom harness):
  Power Shift   — raw Atk/Def unchanged after use
  Corrosive Gas — foe's held item not removed
  Purify        — foe's status not cured (and no user heal)
  Venom Drench  — poisoned foe's Atk/SpA/Spe not lowered
  Ion Deluge    — ionDeluge flag stays false
  Crafty Shield — does not block an incoming status move (foe still paralyzes)
  Mat Block     — does not block an incoming damaging move (turn 1)
To verify (no effect under generic setup — may be doubles-only or precondition-gated):
  Nature Power, Copycat, Mirror Move, Parting Shot, Doodle, Electrify, Fairy Lock,
  Nightmare, Disable, Laser Focus
```

**Repro**: jsdom harness; each move used by Mew vs Snorlax (preconditions set where relevant — foe poisoned for Venom Drench, foe statused for Purify, foe priority/spread move for the guards). None produced their documented effect. These are left as it.todo in the move drafts.

**Blast radius**: Mostly niche moves; low story impact individually. Crafty Shield / Mat Block / Trick (separate finding) are the most likely to matter if a foe relies on them.

**Fix sketch**: Triage per move — confirm gap vs. doubles-only/precondition before implementing. The "confirmed" group is high-confidence dead; the "to verify" group needs a targeted repro (correct prior-move / ally context) to rule out a harness artifact.

**Verification**: Each listed move produces its effect in a deterministic repro, and the corresponding draft todo is filled.

