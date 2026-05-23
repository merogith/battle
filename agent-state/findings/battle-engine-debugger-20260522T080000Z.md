---
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~24232
file: battle.html
agents: [battle-engine-debugger]
fingerprint: ffc310969bdf
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `canMove` paralysis + confusion self-hit checks use bare `Math.random()` (RNG drift in story replays)

**Evidence**:
```js
// battle.html:24232 (PAR full-paralysis)
if (mon.status === "PAR" && Math.random() < 0.25) { logMsg(`${mon.name} is paralyzed!`, 'status'); return false; }
// battle.html:24257 (confusion self-hit)
else if (Math.random() < 0.3333) { /* confusion self-hit */ }
```

The sibling ice-thaw site at 24228 was already fixed (`const _thawRng = (sm && sm.active) ? storyRngNext : Math.random;`). Paralysis and confusion in the *same handler* were not updated.

**Repro**: In a story run with fixed `sm.runSeed`, save right before a PAR/confused mon's turn; reload twice. PAR full-para and confusion self-hit differ across loads because they consume native `Math.random()` instead of the seeded `_strngState` stream.

**Blast radius**: Every `canMove` call (twice per turn). All seeded replays. `story-replay.mjs` determinism is broken every time PAR/Confusion fires.

**Fix sketch**: Mirror the line-24228 pattern: `const _r = (sm && sm.active) ? storyRngNext : Math.random; if (mon.status === "PAR" && _r() < 0.25) ...` Same for line 24257.

**Verification**: Run `npm run debug:replay diff <seed>`; post-fix should be byte-identical across two replay invocations.

---
severity: P1
category: bug
anchor_symbol: applyStatus
current_line_hint: ~25882
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 07e77424454f
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Sleep duration roll uses bare `Math.random()` (RNG drift on every sleep proc)

**Evidence**:
```js
// battle.html:25882
if (status === "SLP") mon.sleepDuration = Math.floor(Math.random() * 3) + 1;
```

Duration determines wake-up turn count, checked every turn in `canMove` (line 24221). Diverges every sleep proc.

**Repro**: Save before a foe is put to sleep with a fixed seed; reload — sleep duration varies. Distribution confirmed correct (1–3 spread matches Showdown), but the value is non-deterministic across replays.

**Blast radius**: Every Sleep Powder / Spore / Hypnosis / Dark Void proc. Sleep Talk move selection (line 20077, also bare) compounds the drift.

**Fix sketch**: `const _r = (sm && sm.active) ? storyRngNext : Math.random; mon.sleepDuration = Math.floor(_r() * 3) + 1;` Apply same pattern to Sleep Talk move pick at line 20077.

**Verification**: Two story replays at the same seed produce identical wake-up timing.

---
severity: P1
category: bug
anchor_symbol: playTurn
current_line_hint: ~19353
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 22f3b567bfd3
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Turn-order priority breakers (Quick Claw, speed-tie, rampage duration) use bare `Math.random()`

**Evidence**:
```js
// battle.html:19353-19354 (Quick Claw 20% proc, both sides)
if (_pItemActiveQC && state.pActive.item === "Quick Claw" && Math.random() < 0.2) { pPri += 0.4; ... }
if (_fItemActiveQC && state.fActive.item === "Quick Claw" && Math.random() < 0.2) { fPri += 0.4; ... }
// battle.html:19368 (speed-tie tiebreak)
else if (fSpe === pSpe) pGoesFirst = Math.random() > 0.5;
// battle.html:19762 (rampage lock duration after Outrage / Petal Dance / Thrash)
attacker.volatile.lockTurns = 1 + Math.floor(Math.random() * 2);
```

Quick Claw + speed tie alone can flip an entire turn's order. Rampage duration affects fatigue confusion timing (fatigue site at 19772 IS gated, but the duration that triggers it isn't).

**Repro**: Two mons with identical Speed, both holding Quick Claw, both with rampage moves. Two replays of the same seed diverge on turn 1.

**Blast radius**: Turn-order tiebreaks influence every subsequent interaction in the turn. Full-team replays cascade out of sync within ~2 turns.

**Fix sketch**: Route all three sites through `const _r = (sm && sm.active) ? storyRngNext : Math.random;`.

**Verification**: `tests/property/priority-order.test.js` should still pass; new test: speed-tie with identical builds + same seed → consistent winner.

---
severity: P1
category: bug
anchor_symbol: parseMoveEffects-on-contact-abilities
current_line_hint: ~22461
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 436d3fa608c1
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Eight contact-triggered defender ability procs (Static / Poison Point / Flame Body / Cute Charm / Effect Spore / Toxic Chain / Cursed Body / Poison Touch) all use bare `Math.random()`

**Evidence**:
```js
// battle.html:22461-22485
if (defender.ability === "Static" && Math.random() < 0.3) applyStatus(attacker, "PAR");
if (defender.ability === "Poison Point" && Math.random() < 0.3) applyStatus(attacker, "PSN");
if (defender.ability === "Flame Body" && Math.random() < 0.3) applyStatus(attacker, "BRN");
if (defender.ability === "Cute Charm" && Math.random() < 0.3 ...) { ... }
// Effect Spore: let roll = Math.random() * 100;  (9/10/11 split)
if (attacker.ability === "Poison Touch" && Math.random() < 0.3) applyStatus(defender, "PSN");
// Toxic Chain at 22479, Cursed Body at 22485 — same pattern
```

Eight sites clustered under `if (isContactMove(move) && !hitSub && ...)`. Note: Cursed Body / Toxic Chain at lines 23049 / 23296-23362 already use the gated pattern; the 22485 site is the un-gated copy.

**Repro**: Trainer with Static Pikachu, player Tackles. Two seeded story replays differ on PAR proc.

**Blast radius**: All on-hit ability procs in story replays. Player UX: "I reloaded and got paralyzed this time."

**Fix sketch**: At the top of the contact-trigger block: `const _r = (sm && sm.active) ? storyRngNext : Math.random;` then replace the eight `Math.random()` calls.

**Verification**: Fixture battle (Tackle vs Static Pikachu × N turns); PAR-applied turn indices match across two replays at the same seed.

---
severity: P1
category: bug
anchor_symbol: parseMoveEffects-damage-core
current_line_hint: ~20742
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 160c710ca9f8
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Core damage roll, crit, and accuracy use bare `Math.random()` — the highest-impact drift sites

**Evidence**:
```js
// battle.html:20742 — accuracy check
if (!neverMiss && Math.random() * 100 > finalAcc) { ... }
// battle.html:21182 — critical hit roll
let crit = (!armorBlocksCrit && Math.random() < critRate) ? (attacker.ability === "Sniper" ? 2.25 : 1.5) : 1;
// battle.html:21676 — damage random factor 0.85-1.0
let rng = 0.85 + (Math.random() * 0.15);
```

These three fire on **every damaging move**. Sibling sites: 22094 (multi-hit per-strike accuracy), 21460 / 21456 (multi-hit count), 22151 / 22998 (self-effect chance), 22025 (random secondary), 22075 (Focus Band 10%).

**Repro**: Any seeded story battle, snapshot turn-1 damage of a vanilla attack, reload — the exact damage value differs because of the 0.85–1.00 roll.

**Blast radius**: Every damage interaction. Without this fix, no story replay can be byte-identical regardless of other fixes.

**Fix sketch**: Best architectural fix — install a mulberry32 patch on `Math.random` at story-run start, mirroring `tests/helpers/seeded-rng.js`'s `installMathRandom`. One ~10-line change covers all 262 bare sites in battle.html and converges test and production. Alternative: define a `_bRng()` helper near the top of `parseMoveEffects` and replace each call individually (higher diff, easier review).

**Verification**: `npm run debug:replay diff <seed>` produces byte-identical transcripts across two invocations.

---
severity: P3
category: inconsistency
anchor_symbol: parseMoveEffects-burn-modifier
current_line_hint: ~21827
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 67e4da6efcae
confidence: medium
status: wontfix-corner-case-common-path-matches-showdown-by-the-hp
---

**Title**: Burn applied as final-damage multiplier (`modifier *= 0.5`) instead of halving the attack stat pre-floor

**Evidence**:
```js
// battle.html:21827
if (attacker.status === "BRN" && move.cat === "Physical" && attacker.ability !== "Guts") modifier *= 0.5;
```

Showdown halves the *attack stat* before the damage formula's `floor()`. The engine instead halves the final modifier. Common-case empirical check (Tackle 34 → 17 = 0.500) matches Showdown to the HP, but corner cases (very low attack stats, certain ability + screen interactions) can deviate by ±1 HP.

**Repro**: Construct a scenario where `floor(atk/2) * other` differs from `floor((atk*other) * 0.5)` — e.g., attacker with very low atk (~10) and a fractional `other` multiplier from screens.

**Blast radius**: Low. May matter for OHKO calcs against bulky walls. Range-assertion tests pass; point-comparison tests against `@smogon/calc` could surface a delta.

**Fix sketch**: Either rewrite as `A *= 0.5` near attack-stat computation (~21260 region), OR document the deviation in `tests/reports/deviations.md`.

**Verification**: Add a focused test: low-atk burned attacker vs screened defender; damage matches Showdown's `@smogon/calc` to the HP.
