---
severity: P1
category: bug
anchor_symbol: playTurn
current_line_hint: ~20127
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 7496103ecc97
confidence: high
status: open
---

**Title**: End-of-turn residual block is not try-wrapped — any throw masks as "Turn skipped" + skips residuals

**Evidence**:
```js
// playTurn inner try; NO per-call guard around these:
runVolatileTimers();
runWishHealing();
endOfTurnEffects(state.pActive, state.fActive); endOfTurnEffects(state.fActive, state.pActive);
tickWeather();
if (state.pActive.dynamaxed) { state.pActive.dynamaxTurns--; ... }   // throws if pActive null
state.residualPhaseComplete = true;          // never reached on throw
// ... only handler is catch(err) at 20154 -> logMsg("Turn skipped") + isLocked=false
```

**Repro**: Static: lines 20127-20151 sit between the inner `try{` (opens ~19990) and `catch(err)` at 20154 with no intervening try. If `endOfTurnEffects`/`tickWeather`/`runWishHealing` throws (e.g. on a mon with cleared `volatile`, or `state.pActive` null after a double-faint edge), control jumps to the catch: poison/burn/weather damage, Speed-Boost tick, Dynamax countdown, and `turnCount++` are all skipped, and the user only sees "[Error: … Turn skipped.]". `state.residualPhaseComplete` stays false, so the NEXT forced-switch may re-run residuals (double-tick). This is the same silent-failure class as the fixed `sm` bug.

**Blast radius**: All EoT effects (status/weather DoT, Leftovers, Wish, Speed Boost, Slow Start, Dynamax countdown). A recurring throw here is invisible except as periodic "Turn skipped".

**Fix sketch**: Wrap each EoT call (or the whole block) in its own try/catch that logs a distinct channel and still sets `residualPhaseComplete = true`, so one failing handler doesn't abort the rest of the turn and doesn't masquerade as a generic turn-skip.

**Verification**: Force `endOfTurnEffects` to throw (e.g. delete `state.pActive.volatile`) and assert subsequent residuals still run and `turnCount` increments.

---
severity: P1
category: bug
anchor_symbol: parseMoveEffects
current_line_hint: ~25902
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 37ef284799b0
confidence: high
status: fixed-main
---

**Title**: Secondary flinch/Stench write `defender.volatile.flinch` unguarded — throws if volatile missing (sibling _tryConfuse guards it)

**Evidence**:
```js
const _tryConfuse = () => { if (!defender.volatile) return; ... };   // GUARDED
...
if (_sec.volatileStatus === 'flinch') defender.volatile.flinch = true;   // 25902 UNGUARDED
...
if (attacker.ability === "Stench" && ... && !defender.volatile.flinch && Math.random()<0.1)  // 25918 UNGUARDED
    defender.volatile.flinch = true;
```

**Repro**: `scripts/debug/_repro/secondary-volatile.mjs` — build Snorlax, set `def.volatile = undefined`, call `parseMoveEffects(atk, def, AirSlash, true)`. Result: throws `Cannot set properties of undefined (setting 'flinch')`. The confusion path on the same loop returns cleanly because it guards `if (!defender.volatile) return`; the flinch path does not. A throw here is caught only by the playTurn turn-skip handler -> "Turn skipped" mid-move.

**Blast radius**: Every flinch secondary (Air Slash, Iron Head, fang moves, Rock Slide) and Stench. Triggered whenever a defender's `volatile` is transiently absent (some transform / forme-revert / freshly-spawned-mon paths).

**Fix sketch**: Guard the flinch writes the same way `_tryConfuse` guards: `if (defender.volatile) defender.volatile.flinch = true;` (and gate the Stench `!defender.volatile.flinch` read).

**Verification**: Re-run the repro after the guard; assert no throw and the move still resolves.

---
severity: P2
category: bug
anchor_symbol: applyStatus
current_line_hint: ~26773
file: battle.html
agents: [battle-engine-debugger]
fingerprint: b90b810adcdc
confidence: medium
status: fixed-main
---

**Title**: applyStatus dereferences `state.pActive.volatile.lockMove` / `state.fActive.volatile.lockMove` unconditionally (Uproar check) — throws if an active is null

**Evidence**:
```js
// Uproar prevents sleep for all mons on the field
if (status === "SLP" && (state.pActive.volatile.lockMove === "Uproar" || state.fActive.volatile.lockMove === "Uproar")) {
    logMsg(`Uproar prevents sleep!`, 'info'); return;
}
```

**Repro**: Reasoning — most preceding guards in applyStatus key off `mon`, but this single line reaches into BOTH actives. If `applyStatus` is ever invoked (e.g. Synchronize mirror at 26799, or a delayed status from a field effect) while one side's active is momentarily null (post-faint, pre-replacement), `state.fActive.volatile.lockMove` throws. Caught only by the playTurn turn-skip handler.

**Blast radius**: Any status application (sleep/para/poison/burn) routed through this function. Lower likelihood than the other two (actives are usually both present during a move), hence P2.

**Fix sketch**: `const pUp = state.pActive && state.pActive.volatile && state.pActive.volatile.lockMove === "Uproar"; const fUp = ...; if (status === "SLP" && (pUp || fUp)) {...}`.

**Verification**: Call applyStatus(mon,"SLP") with `state.fActive = null`; assert it does not throw.

---
severity: P3
category: inconsistency
anchor_symbol: selectPartyMember
current_line_hint: ~19373
file: battle.html
agents: [battle-engine-debugger]
fingerprint: d7d32448cfd3
confidence: high
status: open
---

**Title**: End-of-turn residual logic is duplicated verbatim in forced-switch path and main loop — divergence risk

**Evidence**:
```js
// selectPartyMember forced path (19373-19383) — duplicate of main loop (20128-20138):
runVolatileTimers(); runWishHealing();
endOfTurnEffects(state.pActive, state.fActive); endOfTurnEffects(state.fActive, state.pActive);
tickWeather();
if (state.pActive.dynamaxed) { state.pActive.dynamaxTurns--; ... }
```

**Repro**: Two byte-identical residual blocks (lines 19373-19383 and 20128-20138). The forced-switch copy IS wrapped by the try/catch at 19328-19422 (good — it recovers the lock), but any future fix to one block (e.g. adding the guards from the P1 findings) must be mirrored or behavior diverges between "switched-this-turn" and "stayed-in" turns. The forced-switch copy also still has the unguarded `state.pActive.dynamaxed` access, just with recovery.

**Blast radius**: Maintenance hazard; EoT semantics could silently differ after a forced switch vs a normal turn.

**Fix sketch**: Extract a single `runEndOfTurnResiduals()` helper called from both sites; apply the guards there once.

**Verification**: Diff EoT log output for a turn with vs without a mid-turn forced switch under the same seed.

---
severity: P3
category: inconsistency
anchor_symbol: storyAwareRng
current_line_hint: ~13853
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 2a0f0c7901bb
confidence: high
status: open
---

**Title**: Scope-leak audit (same class as fixed `sm` bug) — NEGATIVE: no other IIFE-internal symbol referenced bare from turn-loop scope

**Evidence**:
```text
# 864 IIFE-internal top-level decls (lines 28370-51840) extracted; each grepped for
# bare (non-window., non-typeof, non-declared) reference in lines <28370. Result:
# 0 call-form leaks, 0 token-form leaks. Only 2 hits, both inside an HTML <code> string at 8750.
# storyRngNext bare uses (33996,36623,37045,42955,42966,43263) are all >31724 (inside IIFE — in scope).
# makeBuild:10482 uses `typeof sm`/`typeof storyRngNext` guards (typeof never throws on undeclared) — safe.
# The global Math.random override at 31900 (routes to storyRngNext when sm.active && runSeed!=null)
# reads bare sm but is lexically inside the IIFE — in scope; guarded with typeof. Safe.
```

**Repro**: `awk` IIFE-symbol extraction + grep sweep over the pre-IIFE region (commands in session). No ReferenceError-class scope leak remains besides the already-fixed `sm` sites.

**Blast radius**: Confirms the lead's `storyAwareRng()` fix is comprehensive for the bare-`sm` turn-skip class. Filed for the ledger so future agents don't re-investigate.

**Fix sketch**: None needed. Recommend an ESLint `no-undef` pass scoped to the script-top region as a regression guard.

**Verification**: Re-run the symbol-leak sweep; expect 0 candidates.

