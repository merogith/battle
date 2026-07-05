---
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~25904
file: battle.html
agents: [battle-engine-debugger]
fingerprint: a0d5437a0dae
confidence: high
status: open
---

**Title**: Dynamax/Tera activate lazily inside performAction (on the user's action), not at the start of the action phase — slow gimmick users are hit on pre-gimmick HP/typing

**Evidence**:
Mega is correctly pre-resolved before the speed compare (`__runLockedPvPTurnResolution` ~24921-24941). But Dynamax and Terastallization are only applied inside `performAction` when the queued mon takes its own action (~25929-25936):
```js
} else if ((gimmickPending === 'DYNAMAX' || gimmickPending === 'GMAXDYNAMAX') && !attacker.dynamaxed) {
    activateDynamax(attacker, isPlayer);   // doubles maxHp HERE
    ...
} else if (gimmickPending === 'TERA' && !attacker.teraActivated) {
    activateTera(attacker, isPlayer);      // changes type HERE
```
In Showdown Gen 8/9 singles, Dynamax and Tera resolve in the start-of-turn activation phase BEFORE any move. If the gimmick user is slower, the opponent's move lands first — against un-doubled HP (Dynamax) or the old typing (Tera).

**Repro** (deterministic, jsdom harness):
- `scripts/debug/_repro/dynamax-timing.mjs`: slow Blissey (base maxHp 330) at 40 HP queues Dynamax; fast Pikachu Tackle (40 dmg). Log order: `Pikachu used Tackle! It dealt 40 damage!` -> `Blissey fainted!` — Blissey never Dynamaxes. Showdown: HP doubles first (40->370/660), survives to 327, then acts.
- `scripts/debug/_repro/tera-timing.mjs`: slow Snorlax (Normal) queues Tera Ghost; fast Snorlax Body Slam (Normal). Log: `used Body Slam! It dealt 76 damage! Snorlax was paralyzed! ... Terastallized into the Ghost type!`. Showdown: Tera Ghost first -> immune to Body Slam (0 dmg, no paralysis).

**Blast radius**: Any slower Dynamax/Tera user. Wrongful KOs (Dynamax buffer never applied), wrong type immunities/effectiveness and contact-status procs (Tera). Also makes Prankster-vs-Dark and type-based interactions read the pre-Tera type. Turn ORDER itself is unaffected (neither gimmick changes Speed; Max Guard +4 is already handled pre-order at ~24949-24951). Z-move activation is correctly move-bound and NOT affected.

**Fix sketch**: Resolve pending DYNAMAX/GMAX/TERA in the start-of-action-phase block alongside Mega (~24921-24941), faster-trainer announced first, before the speed/priority compare and before any performAction. Leave the in-performAction path only as a fallback for the one-side-switched branches. Z-move stays where it is.

**Verification**: Re-run both repro scripts; expect the "Dynamaxing/Terastallized" log to precede the opponent's move, Blissey to survive, and Body Slam to deal 0 damage with no paralysis.

---
severity: P3
category: bug
anchor_symbol: __runLockedPvPTurnResolution
current_line_hint: ~24962
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 8d2b9918f32a
confidence: medium
status: open
---

**Title**: Fractional-priority tiebreak hack can bleed across an integer bracket boundary (Custap +0.5 vs Lagging Tail -0.5, or stacked -0.5/-0.5)

**Evidence**:
Priority tiebreaks are encoded as fractional offsets on the integer `pri`:
```js
if (state.pActive.volatile.custapReady) { pPri += 0.5; ... }   // Custap +0.5
if (_pItemActiveQC && state.pActive.item === "Quick Claw" && _toRng() < 0.2) pPri += 0.4;
if (... "Lagging Tail" || "Full Incense") pPri -= 0.5;
if (state.pActive.ability === "Mycelium Might" && pMove.cat === "Status") pPri -= 0.5;
```
A bracket-K move with Custap (K+0.5) ties a bracket-(K+1) move with Lagging Tail (K+1-0.5 = K+0.5); the code then falls to the speed tiebreak (`fPri === pPri`) instead of always giving the higher integer bracket priority. Stacking Lagging Tail + Mycelium Might (-1.0) on a bracket-N status move collapses it to N-1.0, tying a plain bracket-(N-1) move. In Showdown these are strictly separate brackets — the higher-integer move always goes first regardless of the intra-bracket "move last" modifier.

**Repro**: Not run at runtime (extreme edge: requires two opposing rare items/abilities in adjacent brackets). Deterministic from the arithmetic above; boundary collision at ±0.5.

**Blast radius**: Rare competitive edge cases only (Custap pinch turn vs a Lagging-Tail foe using a +1 priority move; or Mycelium+Lagging-Tail stack). Common cases (Quick Claw +0.4, Stall -0.1) do NOT bleed.

**Fix sketch**: Keep the integer bracket as the primary sort key and apply the fractional/tiebreak modifiers only WITHIN an equal-integer-bracket comparison (two-level sort), rather than summing them into one comparable scalar.

**Verification**: Construct pri=1 Lagging-Tail user vs pri=0 Custap user; the pri=1 move must always resolve first.

