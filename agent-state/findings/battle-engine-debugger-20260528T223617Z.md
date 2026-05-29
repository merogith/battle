---
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~23826
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 98ab942730c1
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Multi-hit moves skip the Shield Dust / Sheer Force / Covert Cloak / Substitute secondary gate

**Evidence**:
```js
// multi-hit path (numHits > 1) — parseMoveEffects called UNCONDITIONALLY:
await parseMoveEffects(attacker, defender, move, isPlayer); updateUI();
// vs single-hit path (~24690) which DOES gate it:
if (sheerForceActive) { /* skip */ }
else if (move.cat === "Status" || ((defender.ability !== "Shield Dust" && defender.item !== "Covert Cloak") && defender.volatile.sub <= 0)) {
    await parseMoveEffects(attacker, defender, move, isPlayer);
}
```

**Repro**: `node scripts/debug/_repro/secondary-multihit-gate.mjs` — Beedrill (Twineedle, multihit 2, 20% poison) vs Snorlax. With `Math.random` pinned to 0.10: a Shield Dust Snorlax is poisoned (canon: blocked), and a Sheer Force Beedrill still poisons (canon: secondary suppressed). Control (plain) poisons as expected.

**Blast radius**: Twineedle (20% poison) and Double Iron Bash (30% flinch) are the only standard multi-hit moves with chance-based secondaries; both bypass Shield Dust, Covert Cloak, Substitute, and Sheer Force suppression when fired through the `numHits > 1` branch. Twineedle is also in the Sheer Force boost list (~23386), so a Sheer Force user gets the +30% power AND keeps the poison — double-dipping.

**Fix sketch**: Wrap the multi-hit `parseMoveEffects` call (~23826) in the same Sheer Force / Shield Dust / Covert Cloak / sub guard used on the single-hit path at ~24690-24698; ideally factor that gate into one helper both paths call.

**Verification**: Re-run `scripts/debug/_repro/secondary-multihit-gate.mjs`; Shield Dust and Sheer Force cases must show `poisoned=false`. Add a `tests/moves/by-category` case for Twineedle vs Shield Dust.

---
severity: P1
category: bug
anchor_symbol: performAction
current_line_hint: ~23434
file: battle.html
agents: [battle-engine-debugger]
fingerprint: f2cfc21d6afc
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: Solar Beam bad-weather power halving is dead code — checks `"SolarBeam"` (no space) which never matches

**Evidence**:
```js
if (move.name === "SolarBeam" && w !== "Sun" && w !== "HarshSun") basePower = Math.floor(basePower * 0.5);
```

**Repro**: `node scripts/debug/_repro/solarbeam-weather.mjs` — Sceptile Solar Beam (Power Herb, max roll, no crit) vs 9999HP Mew: No-weather = 92 dmg, Rain = 92 dmg (identical → NOT halved; canon ≈ half). The move's display name in `movesDB` is `"Solar Beam"` (with a space); `grep -c '"SolarBeam"' battle.html` returns 1 (only this line) vs 3 for `"Solar Beam"`.

**Blast radius**: Solar Beam / Solar Blade deal full power in Rain, Sandstorm, Hail, and Snow instead of 50% — every adverse-weather matchup involving a Solar Beam user is mis-scored (and the AI's `aiEstimateDmg` likewise overrates it). Solar Blade is never checked at all, even with the typo fixed.

**Fix sketch**: Change the string to `"Solar Beam"` and add `"Solar Blade"` (e.g. `(move.name === "Solar Beam" || move.name === "Solar Blade")`). The charge-skip logic at ~21966 already uses the correct spaced names, so only this one branch is wrong.

**Verification**: Re-run `scripts/debug/_repro/solarbeam-weather.mjs`; Rain/Sandstorm damage must be ~50% of no-weather. Cross-check against a damage-formula test pinning weather=Rain.

---
severity: P2
category: bug
anchor_symbol: performAction
current_line_hint: ~23118
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 0fd8a87af215
confidence: high
status: fixed-claude/funny-clarke-EnGMv
---

**Title**: 2-5 multi-hit distribution is 33/33/17/17, not the modern 35/35/15/15

**Evidence**:
```js
const _roll25 = (mn, mx) => (mn === mx ? mn : [2, 2, 3, 3, 4, 5][Math.floor(Math.random() * 6)]);
```

**Repro**: `node scripts/debug/_repro/multihit-rolls.mjs` (Part A) — the array `[2,2,3,3,4,5]` over a uniform 1-of-6 pick yields 2:33.3% / 3:33.3% / 4:16.7% / 5:16.7%. Modern (Gen 5+) canon is 2:35% / 3:35% / 4:15% / 5:15%. Not listed in `tests/reports/deviations.md`.

**Blast radius**: Every 2-5 hit move without Skill Link / Loaded Dice (Bullet Seed, Rock Blast, Icicle Spear, Pin Missile, Tail Slap, Bone Rush, Scale Shot, etc.) lands 4-5 hits slightly too often and 2-3 hits slightly too rarely — a small but systematic damage-distribution skew vs Showdown.

**Fix sketch**: Replace the 6-slot array with the canonical weighted roll, e.g. pick a uniform `r` in [0,1) and map `<0.35→2, <0.70→3, <0.85→4, else→5` (35/35/15/15). Keep the Skill Link / Loaded Dice overrides unchanged.

**Verification**: Sample the new roll 200k times in the repro; bucket percentages must land within ~0.5% of 35/35/15/15.

---
severity: P2
category: bug
anchor_symbol: performAction
current_line_hint: ~23776
file: battle.html
agents: [battle-engine-debugger]
fingerprint: f229af11d3b5
confidence: high
status: open
---

**Title**: Multi-hit moves reuse one damage roll & one crit check for every hit (no per-hit independence)

**Evidence**:
```js
let rng = 0.85 + (Math.random() * 0.15);            // ~23349 — rolled ONCE
let crit = (... Math.random() < critRate) ? 1.5 : 1; // ~22844 — rolled ONCE
// in the per-hit loop every strike reuses the same `damage`:
let _hitDmg = (parentalBondActive && h === 1) ? Math.floor(damage * 0.25) : damage;
```

**Repro**: `node scripts/debug/_repro/multihit-rolls.mjs` (Part B) — Cloyster Icicle Spear (Skill Link → 5 hits) vs a 999HP wall deals 395 total = exactly 79.00 per hit; with live RNG every hit would still be identical because `rng` and `crit` are computed once above the loop.

**Blast radius**: In Showdown each hit of a multi-hit move rolls its own 0.85-1.0 spread and its own crit. Here all hits share one roll, so per-hit variance is zero and a multi-hit move can never crit on only some hits. Tightens the damage distribution and removes partial-crit outcomes; also means Focus Sash / Sturdy break correctly but Anger Point / per-hit crit interactions diverge.

**Fix sketch**: Move the `rng` spread and the `crit` roll inside the per-hit loop (recompute `damage` per strike), preserving Parental Bond's 0.25× second hit and Triple Axel/Kick BP escalation. Cache the static parts (basePower, A/D, modifier sans rng/crit) outside the loop for perf.

**Verification**: Repro should show per-hit damages varying across hits when RNG is unpinned; add a property test asserting a multi-hit move's total is NOT exactly `numHits * (single-hit damage)` over many trials.

---
severity: P2
category: bug
anchor_symbol: performAction
current_line_hint: ~22752
file: battle.html
agents: [battle-engine-debugger]
fingerprint: d2c978ecb9e7
confidence: medium
status: open
---

**Title**: OHKO moves use the generic accuracy gate — affected by evasion/accuracy stages, Compound Eyes, Gravity; no higher-level auto-fail

**Evidence**:
```js
// general acc gate (~22377) applies stages/Compound Eyes/Gravity to move.acc:
let finalAcc = neverMiss ? 999 : (move.acc * accMod * evaMod * getAccEvaMult(accStage) * micleMod);
// OHKO block (~22752) handles Sturdy/Sash/immunity but has NO level-diff accuracy and NO "target higher level → fail":
const _ohkoMoves = new Set(["Fissure","Horn Drill","Guillotine","Sheer Cold"]);
```

**Repro**: Scenario — Fissure (DB acc 30) vs a target with +2 evasion: engine multiplies 30 by the evasion modifier (canon: OHKO accuracy ignores evasion/accuracy stages entirely). A Compound Eyes user gets 30×1.3=39 (canon: 30). No path sets accuracy = `(userLevel − targetLevel) + 30` nor fails when the target out-levels the user.

**Blast radius**: Lower-impact in the Lv50 VGC mirror (level diff = 0, base 30%), but OHKO moves wrongly scale with evasion/accuracy boosts, Compound Eyes, Gravity (×5/3) and Micle Berry, and never auto-fail against a higher-level target — all of which diverge from canon and matter once levels differ (wild battles, story foes).

**Fix sketch**: Special-case OHKO moves before the generic acc gate: compute `acc = 30 + (attacker.level − defender.level)`, auto-fail if `defender.level > attacker.level`, and skip the evasion/accuracy-stage / Compound Eyes / Gravity / Micle modifiers for them. Sheer-Cold-vs-Ice and Sturdy/Sash handling already exist.

**Verification**: Add a test: Fissure vs a +6-evasion target still lands at 30% (not reduced); Fissure vs a higher-level target always fails.

