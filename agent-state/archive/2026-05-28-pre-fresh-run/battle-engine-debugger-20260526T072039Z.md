---
severity: P1
category: bug
anchor_symbol: getBestMove
current_line_hint: ~18952
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 844cf5ce029b
confidence: high
status: fixed-claude/ecstatic-gauss-RY5hA
---

**Title**: Choice-locked AI re-returns the locked move with zero immunity/wall check — spams 0-dmg moves forever

**Evidence**:
```js
if (attacker.volatile.choiceLock) {
    let lockedMove = validMoves.find(m => m.name === attacker.volatile.choiceLock);
    if (lockedMove) return lockedMove;          // <-- no abilityImmunity / eff===0 / "can't dent" check
    return { name: "Struggle", ... };
}
```
This branch sits ABOVE all scoring. The non-locked path correctly zeroes immune moves (`if (eff === 0 || abilityImmunity(...)) score = 0;` ~L19064), but a choice-locked mon never reaches scoring.

**Repro**: `node scripts/debug/_repro/issue1-immune-spam.mjs` — Choice-Specs Manectric locked into Thunderbolt vs a Lightning Rod holder. `getBestMove` returns Thunderbolt every turn (est dmg = 0). Robust under real `Math.random` (`issue1-robust.mjs`: distinct moves chosen = {Thunderbolt}). Also fires for a merely *resisted* locked move that can't break a wall (`issue1d-allzero.mjs`: Choice-Band Aqua Jet locked vs Ferrothorn, 19.9 dmg).

**Blast radius**: Every choice-item foe in story/PvE. Player exploit: bait the AI into clicking a Choice move, then switch in an immunity/wall — the AI is then locked into a useless move AND (see paired finding) cannot switch out. This is the most exploitable loop found.

**Fix sketch**: In the choice-lock branch, before returning `lockedMove`, check `abilityImmunity(lockedMove, defender, attacker) || getMoveEffectiveness(...) === 0`; if the locked move is immune/zeroed, prefer surrendering the matchup (allow `aiDecision` to switch — see paired finding) or fall through to Struggle only when truly stuck. At minimum, do not treat a 0-damage locked move as a valid attack.

**Verification**: Re-run `issue1-immune-spam.mjs`; case (b) must no longer report "keeps returning same immune move: true". Add an `ai-decision.test.js` case asserting a choice-locked-into-immune foe does not return the immune move.

---
severity: P1
category: bug
anchor_symbol: aiDecision
current_line_hint: ~19434
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 7413698eff37
confidence: high
status: fixed-claude/ecstatic-gauss-RY5hA
---

**Title**: aiDecision early-returns null on any choiceLock — AI cannot switch out of an immune/walled lock

**Evidence**:
```js
function aiDecision() {
    let attacker = state.fActive, defender = state.pActive;
    if (attacker.volatile.choiceLock) return null;   // <-- blocks ALL switches while choice-locked
    ...
```
Choice lock prevents changing *moves*, not switching Pokémon. This conflates the two: a choice-locked mon CAN legally switch, but the AI refuses to, so it is stranded re-using the locked move (paired with the getBestMove finding above).

**Repro**: `node scripts/debug/_repro/issue1-immune-spam.mjs` case (c): Choice-Specs Manectric locked into Thunderbolt vs Lightning Rod, with a Garchomp on the bench that would dominate the matchup. `aiDecision()` returns `null` (refuses to switch). `issue1-robust.mjs` confirms `aiDecision: null` while trapped.

**Blast radius**: Combines with finding 844cf5ce029b into a hard, inescapable loop the player triggers at will: switch an immunity/hard-wall into a choice-locked foe and it never threatens again. Whole-team-feed potential if the player keeps the wall healthy.

**Fix sketch**: Remove the blanket `choiceLock` early-return (or gate it): a choice-locked attacker should still be allowed to switch when its locked move is immune/zeroed or it is `willDieFirst`/hard-walled. Only true trapping (partialTrap, Arena Trap/Shadow Tag/Magnet Pull, ingrain — already handled just below) should force `null`.

**Verification**: Re-run case (c); with a strong bench it should return a switch index. Confirm `tests/property/priority-order` and existing ai-decision suites still pass (no regression in legitimate "don't switch, just attack" cases).

---
severity: P1
category: bug
anchor_symbol: getBestMove
current_line_hint: ~19233
file: battle.html
agents: [battle-engine-debugger]
fingerprint: c9f77d3582aa
confidence: high
status: fixed-claude/ecstatic-gauss-RY5hA
---

**Title**: AI spams setup move into an active phazer — `score *= 0.25` penalty loses to near-zero attack scores

**Evidence**:
```js
// Phazer / Haze / Unaware on the field or bench — setup will be undone or ignored.
if (defHasPhazer || defHasUnaware) score *= 0.25;   // multiplicative only
else if (benchHasPhazer) score *= 0.55;
```
When the AI's attacking moves do ~0 into the wall, 0.25 × (setup base ~80) still beats them. The Unaware case is saved elsewhere (it picks an attack), but the *phazer* case is not: the boost is real (so setup scores high) yet gets immediately Whirlwind/Roar'd away.

**Repro**: `node scripts/debug/_repro/issue3-trollfamily.mjs` (3b) and `issue3-deep.mjs`: Dragonite (Dragon Dance/Earthquake/Extreme Speed/Roost) vs Skarmory with Whirlwind. EQ est = 0 (Steel/Flying immune to Ground), Extreme Speed est = 10. AI clicks Dragon Dance for 4 straight turns (until +4 atk makes E-Speed win), robust across all RNG seeds incl. real `Math.random`. Each turn Skarmory phazes the boost away → net-zero loop.

**Blast radius**: Any setup sweeper the AI brings against a Whirlwind/Roar/Dragon Tail/Circle Throw user it can't dent. Player exploit: park a phazing wall; the AI burns turns boosting into the wind. Lower exploit ceiling than the choice-lock loop (needs a wall the AI can't hurt + an active phazer) but very reliable when it occurs.

**Fix sketch**: When `defHasPhazer` (active, not just bench) AND the AI cannot OHKO/2HKO, treat setup as near-worthless (hard cap, e.g. `score = Math.min(score, 5)`), not a 0.25 multiplier. Better: don't repeat-setup if the active foe carries a phazer and we already have ≥1 relevant boost.

**Verification**: Re-run 3b; Dragonite should pick its best available action (or switch) rather than Dragon Dance ≥3 turns running. The control case (Skarmory without Whirlwind) should still permit a DD when setup is genuinely safe.

---
severity: P2
category: inconsistency
anchor_symbol: getBestMove
current_line_hint: ~19064
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 607fa56cad8d
confidence: medium
status: open
---

**Title**: When every damaging move is immune (score 0), AI throws a 0-dmg attack instead of switching/using status

**Evidence**:
```js
if (eff === 0 || abilityImmunity(move, defender, attacker)) score = 0;   // all dmg moves -> 0
...
score += Math.random() * 6;                       // tiny tiebreak now decides among equal-0 moves
if (score > maxScore) { maxScore = score; bestMove = move; }
```
With a pure-attacking moveset where every move is type/ability-immune to the defender, all scores collapse to `0 + rand*6`. The AI returns whichever zero-damage move the tiebreak favors rather than recognizing the dead matchup.

**Repro**: `node scripts/debug/_repro/issue1d-allzero.mjs`: all-Fighting/Normal Hitmonchan vs Gengar (Ghost) — all four moves estimate 0, AI still returns a damaging move. (Distinct from finding 844cf… which is the choice-lock variant; this is the no-status, all-immune case.)

**Blast radius**: Narrow — requires a moveset with no status move and zero coverage against the active defender (uncommon outside contrived/mono builds). Mostly a quality issue: the AI "looks dumb" rather than getting exploited into a hard loop. Not reproducible as an infinite loop because the normal matchup usually has SOME nonzero move or a status move (which scores 12 and wins).

**Fix sketch**: When `maxOwnDmg === 0` (no move can damage the defender) and a bench exists, let `aiDecision` consider switching even outside the `willDieFirst || walled` triggers; or have `getBestMove` prefer the highest-utility status move over a guaranteed-0 attack.

**Verification**: Re-run `issue1d-allzero.mjs`; confirm the AI prefers a status move (if any) or that `aiDecision` switches when `maxOwnDmg === 0` and a viable bench mon exists.

