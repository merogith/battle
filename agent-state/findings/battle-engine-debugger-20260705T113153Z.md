---
severity: P2
category: bug
anchor_symbol: runWishHealing
current_line_hint: ~24465
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 8fa68fdc12d2
confidence: high
status: open
---

**Title**: Wish & Future Sight resolve BEFORE weather damage (residual-order inversion) — flips faint outcomes

**Evidence**: The turn resolver runs end-of-turn steps in this order (`__runLockedPvPTurnResolution`, ~25043-25046):
```js
_eotStep('volatileTimers', () => runVolatileTimers());
_eotStep('wishHealing',    () => runWishHealing());     // Wish heal + Future Sight/Doom Desire hit
_eotStep('residuals(speed order)', () => runResidualsBySpeed()); // <-- weather damage lives HERE (endOfTurnEffects ~32704-32722)
_eotStep('weather', () => tickWeather());               // only counts DOWN duration
```
Showdown residual order is weather (order 1) -> Future Sight (order 3) -> Wish (order 4). The engine inverts this: Wish healing and Future Sight damage both fire before sandstorm/hail chip. The mid-turn forced-switch path repeats the same order (`selectPartyMember`, ~24185-24188).

**Repro**: `scripts/debug/_repro/order.mjs` (Snorlax at exactly lethal sandstorm HP with a Wish landing this turn):
```
Snorlax's wish came true, restoring 117 HP!
Machamp took 10 damage from the sandstorm!
Snorlax took 14 damage from the sandstorm!
P.currentHp after EoT: 117/235 (started at 14 = lethal sandstorm dmg)
```
Engine: Wish heals first -> Snorlax SURVIVES. Showdown order: sandstorm KOs first, Wish is wasted on the fainted slot -> Snorlax FAINTS. Same inversion applies to Future Sight (damage lands before weather instead of after).

**Blast radius**: Any turn combining a landing Wish/Future Sight with residual weather (sand/hail) on a low-HP mon. Competitive singles endgames where a Wish is timed to out-heal chip. Purely cosmetic when no faint boundary is crossed (net HP is identical), but decides the KO when it is.

**Fix sketch**: Move the `runWishHealing()` call to AFTER weather damage. Cleanest is to split weather chip out of `endOfTurnEffects` into its own step ordered first, or hoist a weather-damage pass ahead of `runWishHealing()`; keep Future Sight and Wish between weather and item-heal.

**Verification**: Re-run `scripts/debug/_repro/order.mjs`; Snorlax should end at 0 HP (fainted). Confirm Future Sight lands after a sandstorm tick in a second variant.

---
severity: P3
category: inconsistency
anchor_symbol: endOfTurnEffects
current_line_hint: ~32638
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 77b860e8d12d
confidence: high
status: open
---

**Title**: endOfTurnEffects internal residual order deviates from Showdown at 4 points (log-order only, no faint change)

**Evidence**: Actual engine order inside `endOfTurnEffects` vs Showdown canon:
```
Speed Boost / Slow Start / Cud Chew   (~32652-32672)  <-- TOP, before weather (Showdown: near LAST)
weather chip                          (~32704)
Aqua Ring / Ingrain heal              (~32768)         <-- before Leftovers (Showdown: item-heal FIRST)
Leftovers / Black Sludge              (~32806)
Leech Seed                            (~32863)
PSN/BRN/TOX status                    (~32882)
Flame/Toxic Orb activation            (~32931)         <-- before Curse/Nightmare/trap (Showdown: order ~28, LAST)
Curse                                 (~32936)         <-- before Nightmare (Showdown: Nightmare FIRST)
Nightmare                             (~32950)
partial-trap                          (~32970)
Perish Song                           (~33118)
Bad Dreams                            (~33130)
Harvest                               (~33160)
```

**Repro**: Read-trace above; confirmed by `scripts/debug/_repro/headline.mjs` (Toxic Orb applies after status damage, correctly no self-tick). No behavioural repro because every listed swap is heal-vs-heal (capped at maxHp) or damage-vs-damage where the victim faints either way, or stat/counter-only (Speed Boost).

**Blast radius**: Battle-log presentation and message ordering only. Directly answers the maintainer's question on Speed Boost: placing it before weather does NOT change any KO/faint outcome — it is stat-only, applied after all actions, and `runResidualsBySpeed` fixes the two mons' processing order ONCE at ~32608 before any `endOfTurnEffects` call, so a Speed Boost applied mid-phase cannot reorder the current turn (next turn recomputes fresh). The one non-cosmetic edge is Cud Chew berry-replay (~32664): it can heal before weather chip, mirroring the Wish issue above in a much narrower case (Farigiraf + heal berry + lethal weather).

**Fix sketch**: If matching Showdown log order is desired, reorder to: weather -> future sight/wish -> Leftovers/Black Sludge -> Aqua Ring/Ingrain -> Leech Seed -> status -> Nightmare -> Curse -> partial-trap -> Bad Dreams -> orbs -> Harvest -> Speed Boost/Slow Start/Moody/Cud Chew. Balance-neutral; needs sign-off only for the Cud Chew-before-weather edge.

**Verification**: Snapshot a full-residual battle log before/after; assert only ordering changed and per-mon end HP is identical (except the Cud Chew lethal-weather edge).

---
severity: P3
category: inconsistency
anchor_symbol: checkFaints
current_line_hint: ~29398
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 4e88b561a2e2
confidence: medium
status: open
---

**Title**: Simultaneous end-of-turn double-KO: faint messages hardcoded foe-first, and replacements are not simultaneous/blind

**Evidence**: `checkFaints` double-KO branch (~29398-29523):
```js
logMsg(`${state.fActive.name} fainted!`, 'heal');   // ALWAYS foe first...
logMsg(`${state.pActive.name} fainted!`, 'dmg');    // ...then player, regardless of speed
...
let foeNext = _foeSurv.length ? (aiBestSwitch(_foeSurv, state.pActive) || _foeSurv[0]) : null; // AI picks vs the FAINTED player active (HP 0)
state.fActive = foeNext; ...                         // foe sent out first
state.currentPlayer = 1; window.openParty(true);     // THEN player chooses, already seeing foe's switch-in
```
Showdown resolves EoT residual (and thus the two faints) in speed order, and the two replacements are chosen simultaneously/blind.

**Repro**: Read-trace (both actives at 1 HP + BRN both faint in `runResidualsBySpeed`, then `tickWeather`, then `checkFaints` hits the double-KO branch). Not scripted through the DOM modal, but the branch is unconditional.

**Blast radius**: (1) Faint-message order is cosmetic but wrong when the slower mon is displayed first. (2) The foe AI counter-picks against a corpse (`state.pActive` is HP 0), and the human then picks with full knowledge of the foe's replacement — a small, player-favorable information asymmetry vs Showdown's blind simultaneous send-in. Only reachable on a true both-sides EoT double-KO with survivors on both benches.

**Fix sketch**: Emit the two faint logs in effective-speed order (reuse the `runResidualsBySpeed` speed compare). For blind replacement, defer applying the foe's switch-in until after the player's pick is queued (or pass a "blind" flag so `aiBestSwitch` doesn't read the fainted `pActive`). Low priority; flag for maintainer since it is player-favorable, not a soft-lock.

**Verification**: Force a both-burned 1-HP double-KO; assert faint-log order tracks speed and that `aiBestSwitch` is not handed a 0-HP `pActive`.

