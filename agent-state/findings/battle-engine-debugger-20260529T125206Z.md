---
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~26025
file: battle.html
agents: [battle-engine-debugger]
fingerprint: ae180cf0e424
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Sleep wakes & acts on the same turn (off-by-one): ~1/3 of sleeps cost the target 0 turns

**Evidence**:
```js
if (mon.status === "SLP") {
    mon.statusTurns++;                       // increment BEFORE the check
    let wakeThreshold = mon.sleepDuration || 2;
    if (mon.statusTurns >= wakeThreshold) { mon.status = null; ...; return true; } // wakes AND acts
```
`applyStatus` sets `mon.sleepDuration = Math.floor(Math.random()*3)+1` (range 1-3). With duration=1, the very first `canMove` call increments to 1, `1 >= 1` is true, the mon wakes and `return true` lets it act immediately — losing zero turns. For duration 2/3 it loses 1/2 turns. Showdown sleep always costs at least 1 lost turn (effective loss = duration), this engine loses `duration-1` (range 0-2).

**Repro**: `node scripts/debug/_repro/sleep.mjs` (seed Math.random to pin duration). Output:
`dur1 (r=0.0): {"dur":1,"turns":["WOKE+acted","awake-can-act"]}` — slept 0 turns.
`dur2 (r=0.4): {"turns":["slept(no action)","WOKE+acted",...]}` — slept 1 turn.

**Blast radius**: Every sleep-inducing move (Spore, Sleep Powder, Hypnosis, Sing, Lovely Kiss, Yawn, Rest). Spore/Hypnosis setup-fodder and stall lines are ~33% weaker than canon; Rest users wake a turn early. AI threat/setup math (getBestMove, aiThreatScore) assumes canonical sleep length.

**Fix sketch**: Either set `sleepDuration` to 2-4 (so effective loss is 1-3), or move the wake check so the mon cannot act on the turn it wakes when the counter first reaches the threshold (decrement-then-check with the act-on-wake semantics matching Showdown). Pick one and align with the HUD counter.

**Verification**: Re-run `scripts/debug/_repro/sleep.mjs`: duration=1 must show one `slept(no action)` before `WOKE+acted`. Add a node:test asserting a freshly-slept mon cannot act on its first turn.

---
severity: P2
category: balance
anchor_symbol: setConfusionDuration
current_line_hint: ~26817
file: battle.html
agents: [battle-engine-debugger]
fingerprint: b13dc1abcb62
confidence: medium
status: open
---

**Title**: Confusion duration is always 2-4 turns (engine uses floor(rng*3)+2), Showdown is 1-4

**Evidence**:
```js
defender.volatile.confusion = Math.floor(_confRng()*3)+2;   // 2,3,4 — never 1
```
Every confusion-set site (Confuse Ray ~26817, Swagger ~26983, Flatter ~26989, fatigue ~21405, secondary ~27368, G-Max ~24776/24840) uses `floor(rng*3)+2`. canMove decrements then checks, so the holder is exposed for 2-4 move attempts; canon is 1-4 (minimum one exposed attempt).

**Repro**: Confuse Ray a target repeatedly across seeds; observed confusion counter is always in {2,3,4}, never 1. Compare to Showdown's 1-4.

**Blast radius**: Confusion-based stall/disruption (Confuse Ray, Swagger, Flatter) is slightly stronger than canon (no 1-turn rolls). Affects balance, not correctness-breaking.

**Fix sketch**: Change to `Math.floor(rng*4)+1` (1-4) at all confusion-set sites to match Showdown, keeping the decrement-then-check loop.

**Verification**: Statistical check over many seeds that the rolled duration spans {1,2,3,4}.

---
severity: P2
category: bug
anchor_symbol: canMove
current_line_hint: ~26066
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 23079ed8b640
confidence: medium
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Confusion self-hit ignores the confused mon's Atk/Def stat-stage boosts

**Evidence**:
```js
let dmg = Math.floor((Math.floor(Math.floor(22 * 40 * (mon.stats.atk / mon.stats.def)) / 50) + 2));
```
Uses raw `mon.stats.atk` / `mon.stats.def` with no `getStageMult(mon.stages.atk/def)`. In Showdown the 40-BP typeless self-hit uses the confused Pokemon's current (boosted) Attack and Defense. A +6 Atk sweeper self-hits for far less than canon; a -Def mon self-hits for less than it should.

**Repro**: Swords Dance x3 a mon, confuse it, force self-hit (pin RNG < 0.3333). Self-hit damage matches the unboosted value, not the +6 Atk value.

**Blast radius**: Confusion damage on boosted/screened sweepers. Minor but a real divergence from canon damage.

**Fix sketch**: Multiply A and D by `getStageMult(mon.stages.atk)` and `getStageMult(mon.stages.def)` respectively in the self-hit damage line, mirroring the main damage block's stage handling.

**Verification**: Repro script comparing self-hit damage at +0 vs +6 Atk; the boosted case must be larger.

---
severity: P3
category: inconsistency
anchor_symbol: parseMoveEffects
current_line_hint: ~23640
file: battle.html
agents: [battle-engine-debugger]
fingerprint: b0a0252096e0
confidence: low
status: open
---

**Title**: Damage formula folds all modifiers into one multiply + single floor (no per-step pokeRound)

**Evidence**:
```js
let modifier = stab * typeEff * crit * rng * lifeOrb;   // ...then many more *= mods...
let damage = Math.floor((Math.floor(Math.floor(22 * basePower * (A / D)) / 50) + 2) * modifier);
```
Showdown applies STAB, type, crit, burn, item, and the 0.85-1.0 roll as discrete chained `pokeRound`/floor steps, re-flooring after each. This engine multiplies them together and floors once. Result drifts by ±1-2 HP versus Showdown in some matchups (documented as "COMPETITIVE FIX" so likely intentional). Immunity (typeEff===0) is correctly short-circuited to 0 at line 23631 before the `Math.max(1, ...)`, so the classic "immune -> 1 damage" bug is NOT present.

**Repro**: `node --test tests/suites/damage-formula.test.js` passes (tests accept ranges). Precise per-roll comparison vs Showdown calc would show occasional ±1.

**Blast radius**: Sub-HP-point damage drift; can shift a borderline OHKO/2HKO in rare cases. Low impact at Lv50 ranges.

**Fix sketch**: If exact Showdown parity is desired, re-floor after each modifier group (pokeRound). Otherwise document as an accepted deviation in tests/reports/deviations.md.

**Verification**: Cross-check a set of known Showdown damage rolls against engine output for borderline KOs.
