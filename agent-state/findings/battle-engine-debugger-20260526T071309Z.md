---
severity: P1
category: balance
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~13993
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1ebee7303e60
confidence: high
status: open
---

**Title**: Difficulty tiers scale only enemy stats; AI policy is byte-identical at every tier — no rising *challenge*, just a rising stat-wall

**Evidence**:
```js
// applyFoeDifficultyScaling (13993) — the entire "difficulty" knob is a stat multiplier:
if (d === 'veryeasy') mult = 0.70; else if (d === 'easy') mult = 0.85;
else if (d === 'hard') mult = 1.15; else if (d === 'challenge') mult = 1.30; // "Very Hard"
mult *= _earlyGameFoeStatMult(); mult *= window._stageGatedFoeStatMult();
// ...then mon.maxHp/stats *= mult.  getBestMove (18835-19310) and aiDecision
// (19313-19389) contain ZERO reads of storyDifficulty / sm.badges / tier / skill.
```

**Repro**: `scripts/debug/_repro/real-ai-test.mjs` (uses a non-stubbing loader; the test harness at tests/helpers/load-engine.js:229 replaces getBestMove with a slot-0 stub, so the real policy must be exercised directly). Charizard vs Venusaur, same seed, veryeasy vs challenge: the **real getBestMove picks the identical move 100/100 seeds** (Flamethrower), while foe HP scales 1.85x and Atk 1.875x. Static grep: `awk 'NR>=18835&&NR<=19310' battle.html | grep -E 'difficulty|badges|tier|skill'` returns nothing.

**Blast radius**: Whole story curve VERY EASY->VERY HARD. The AI is already maximally competent at GL1 (type/KO/priority/switch/hazard/status-aware, considers the player's full party for hazards). "Higher difficulty" therefore = bigger numbers on the same brain. A Very Hard foe is a Very Easy foe with +85% HP/Atk, not a smarter opponent. This is the core gap vs the maintainer's "AI gets genuinely smarter at higher tiers" goal — quantified gap between low- and high-tier AI behavior is **zero**.

**Fix sketch**: Introduce an AI-competence axis gated on tier/badges (e.g., low tiers add larger random move jitter, disable switching/healing/setup heuristics, and ignore the player's bench; high tiers enable the full policy). Tie it to `storyDifficulty` and/or GL so behavior — not just stats — ramps.

**Verification**: Re-run real-ai-test.mjs after the change; assert the move/switch distribution diverges between veryeasy and challenge for matchups with a non-trivial best line.

---
severity: P2
category: balance
anchor_symbol: getBestMove
current_line_hint: ~19063
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1b994537ce76
confidence: high
status: open
---

**Title**: No sleep clause in story + AI scores Spore at 100 → up to 3-turn lock loops, amplified by high-tier stat bloat (fairness risk)

**Evidence**:
```js
// getBestMove sleep-move scoring (19063): Spore baseScore 100, others 75 — top priority.
else if (["Spore","Sleep Powder","Hypnosis","Lovely Kiss","Sing","Dark Void","Yawn"].includes(move.name)) {
    let baseScore = move.name === "Spore" ? 100 : 75;
// applyStatus (26902): sleepDuration = floor(Math.random()*3)+1  -> 1..3 turns, uniform.
// pre-move gate (25204-25211): wakes only when statusTurns >= sleepDuration. No sleep clause
// anywhere in story (only Electric-Terrain artifact blocks sleep). PAR gate (25218): 25% skip.
```

**Repro**: `scripts/debug/_repro/fairness-locks.mjs` (seeded, real RNG). Over sampled seeds: **3-turn sleeps occur 38.2%** of the time; worst paralysis full-para streak = **6 consecutive skips** in a 30-turn window; turn-1 "player full-para AND foe crit" co-occurs ~1.0% (matches theory). Mechanics are Showdown-faithful (so not a damage/RNG *bug*), but at `challenge` (1.30x foe stats) a turn-1 Spore from a competent AI hands a fast foe up to 3 free turns with no player counterplay (no sleep-turn reduction, no clause).

**Blast radius**: Any high-tier fight where the foe rolls a sleep/para move (Gengar/Amoonguss/Breloom archetypes the rival/league field). Compounds the P1 stat-wall: identical RNG variance hits harder when the foe is +85% bulkier/stronger.

**Fix sketch**: Consider a story sleep clause (or cap effective sleep at 1-2 turns at lower tiers), and/or down-weight the AI's turn-1 status-lock scoring on lower difficulties so lock loops are a high-tier threat rather than a flat one.

**Verification**: Seeded battle with a foe holding Spore + a sweeper; assert max consecutive player-skipped turns is bounded by the chosen clause/cap.

---
severity: P2
category: inconsistency
anchor_symbol: _stageGatedFoeStatMult
current_line_hint: ~13953
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 2f6b5645d86f
confidence: high
status: fixed-main
---

**Title**: Current enemy curve is lumpy, not rising — GL4=GL5 dead zone (foe mult 1.0) and a GL8 quad-cliff (T3->T4 + IV 18->26 + gimmicks 2->3)

**Evidence**:
```js
// _stageGatedFoeStatMult (13967): Gym n<6 -> 1.0, n>=6 -> 1.05, n>=8 -> 1.10.
const n = +gl[1]; if (n >= 8) return 1.10; if (n >= 6) return 1.05; return 1.0;
// _storyBuildTierForEvent (33550): GL n<3 T1, n 3-7 -> T2/T3, n>=8 -> TOURNAMENT(T4).
// STORY_IV_TIER_RANGES (30060): T2 {10,22}, T3 {18,28}, T4 {26,31}.
```

**Repro**: Cross-read of the three scaling functions vs docs/story-design/story-power-curve.csv. GL4 and GL5 are identical on every axis (T2, IV 10-22, mult 1.0) precisely when the player unlocks the EV Trainer/Dojo/Safari at C4 — a 2-city power inversion (player spikes, enemy flat). GL8 stacks five escalators in one fight (EV tier, IV floor, gimmick count, sub-trainer grade, legendary gate). Net trajectory today: VERY EASY (GL1-2) -> EASY (GL3) -> dips back toward VERY EASY (GL4-5) -> MEDIUM (GL6-7) -> HARD-spike (GL8) -> HARD (E4). This is assessed against the *current* engine state (not the planned retune).

**Blast radius**: Player-perceived difficulty trajectory across the whole story. The flat/dip-then-cliff shape is the opposite of the desired smooth very-easy->very-hard climb. (The REDESIGN_PLAN already proposes a retune; this finding documents the current shortfall, not the unimplemented plan.)

**Fix sketch**: As the plan's §8a notes — don't let the GL4-5 foe mult collapse to 1.0 (ramp ~1.0->1.03 + small GL5 IV bump), and spread the GL8 jump across GL6-7-8 (IV floor 18->22->26, GL7 partial-T4). Encoded in story-tunables.csv.

**Verification**: Recompute per-GL effective foe BST*mult and IV floor after tuning; assert monotonic non-decreasing across GL1..GL8 with no single-step jump > the chosen ceiling.

---
severity: P3
category: inconsistency
anchor_symbol: getDownStatusLabel
current_line_hint: ~17613
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1e8eb0a0eb0d
confidence: high
status: fixed-main
---

**Title**: Paralysis tooltip says "Speed quartered" but engine halves speed (0.5) — stale Gen 1-6 text vs Gen 7+ behavior

**Evidence**:
```js
// Tooltip (17613): PAR: 'Paralyzed — Speed quartered · 25% chance to skip turn'
// Help text (10633): "PAR — 25% chance to skip turn, halves Speed"  (contradicts itself)
// Engine (20553): if (mon.status === "PAR" && mon.ability !== "Quick Feet") spe *= 0.5;  // HALVES
```

**Repro**: Grep `status === "PAR"` — every speed application uses `* 0.5` (lines 20553, 22290-22297). The engine is correctly Gen 7+ (halve). Only the 17613 tooltip string says "quartered" (Gen 1-6). The 10633 help blurb already says "halves Speed", so the two UI strings disagree.

**Blast radius**: Cosmetic/trust only — no damage or turn-order impact. Players reading the pill tooltip will mis-estimate paralysis speed.

**Fix sketch**: Change the 17613 tooltip from "Speed quartered" to "Speed halved" to match the engine and the 10633 help text.

**Verification**: Grep confirms no remaining "quartered" PAR string; UI pill matches the help blurb.

