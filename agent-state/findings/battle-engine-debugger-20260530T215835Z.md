---
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~22648
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 137c06055f1b
confidence: high
status: fixed-claude/pensive-tesla-GbCMy
---

**Title**: Future Sight / Doom Desire resolve one turn too early (set to 2 turns; spec & Showdown require a 2-turn delay = 3)

**Evidence**:
```js
// performAction, Future Sight / Doom Desire handler (~battle.html:22642)
if (move.name === "Future Sight" || move.name === "Doom Desire") {
    ...
    defender.volatile.futureSightTurns = 2;   // <-- off by one; must be 3
    defender.volatile.futureSightDmg = fsDmg;
    ...
}
// runWishHealing (~20866) decrements futureSightTurns once per EoT, strikes at 0:
//   if (mon.volatile.futureSightTurns > 0) { mon.volatile.futureSightTurns--; if (===0 && dmg>0) strike }
```

The counter is SET during the caster's move phase on turn N, then turn N's own end-of-turn (runWishHealing) immediately decrements it 2->1. Turn N+1's EoT decrements 1->0 and fires the strike. Net result: the hit lands at the end of turn N+1 (one turn after the cast), not turn N+2. This is the SAME class as the just-fixed sleep bug (commit a8a923f): a freshly-set counter is ticked the same turn, so the resolution lands one turn early.

This contradicts the project's own spec: `tests/reports/deviations.md` (Future Sight / Doom Desire) states "Damage is delayed 2 turns; first turn shows no HP change." It also contradicts Showdown (Future Sight: "two turns later, the target is attacked" — cast turn 1, strike end of turn 3).

**Repro** (deterministic, jsdom harness, seed 0; gitignored `scripts/debug/_repro/probe5.mjs`):
Player (Alakazam, faster) uses Future Sight on turn 1 vs Snorlax; both Splash thereafter.
```
After turn 1 EoT: FStimer=1  foeHp=400  (no strike)
After turn 2 EoT: FStimer=0  strikeDmg=96   <<< STRUCK at end of turn 2 = 1 turn after cast
```
Identical across two runs at the same seed (deterministic). Expected per spec: no HP change at end of turns 1 AND 2, strike at end of turn 3.

Contrast (proves the intended set value): Wish at `battle.html:26825` is `wishTurns = 2` with the comment "fires at end of NEXT turn" and the harness confirms it heals at end of turn N+1 — correct, because Wish IS a "next turn" effect. Future Sight is a "2 turns later" effect, so its set value must be one higher (3), exactly as Wish:2 :: FutureSight:3.

**Blast radius**: `futureSightTurns` is read/decremented only in `runWishHealing` (~20866) and gated in `performAction` (the "But it failed!" re-cast guard at ~22643) and HUD pills (17634, 18561). Changing the set value to 3 affects the strike turn only; no double-tick exists (verified: the counter is decremented in exactly one site, once per turn, not per-mon). Doom Desire shares this exact handler and is fixed by the same one-line change.

**Fix sketch**: Change `defender.volatile.futureSightTurns = 2;` to `= 3;` at ~22648. (Owner sign-off required — this is a status/mechanic timing change per CLAUDE.md approval rules.) No other code path sets this field.

**Verification**: Re-run `scripts/debug/_repro/probe5.mjs fs`; expect no strike at end of turns 1 and 2, strike at end of turn 3. Optionally fill the `Future Sight` / `Doom Desire` it.todo stubs in `tests/moves/by-category/status.test.js` to assert a 2-turn no-op window then a turn-3 strike.

