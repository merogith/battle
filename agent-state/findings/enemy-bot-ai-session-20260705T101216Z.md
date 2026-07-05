---
severity: P1
category: bug
anchor_symbol: getBestMove
current_line_hint: ~23428
file: battle.html
agents: [enemy-bot-ai-session]
fingerprint: ecd0ce7d7e85
confidence: high
status: fixed-claude/enemy-bot-ai-optimization-i394cm
---

**Title**: AI scores conditional moves as unconditional — picks moves the engine then fails (Last Resort, Sucker Punch, Focus Punch, Dream Eater, Belch…)

**Evidence**:
```js
// getBestMove damaging branch (~23527): score = aiEstimateDmg(...) with NO precondition gate.
// Engine enforces (all fail with "But it failed!" / wasted foe turn):
//   Focus Punch ~25710 (took damage this turn)   Sucker Punch ~25720 / Thunderclap ~25755 /
//   Upper Hand ~25738 (target must attack)        Dream Eater ~25771 (target asleep)
//   Synchronoise ~25780 (shared type)             Shell Trap ~25794 (physical hit taken)
//   Belch ~25804 (berry eaten)                    Gigaton Hammer/Blood Moon ~25813 (no repeat)
//   Last Resort ~26043 (all other moves used)     Steel Roller ~26054 (terrain required)
//   Burn Up ~26059 / Double Shock ~26063 (user type)  Snore ~25654 (user asleep)
//   Counter ~28051 / Mirror Coat ~28055 (must take phys/spec damage this turn)
```

**Repro**: `node scripts/debug/_repro/ai-nuance-gaps.mjs` — Snorlax (Last Resort/Crunch/EQ/Body Slam, turn 1, empty `volatile.moveHistory`) picks **Last Resort**; the engine fails it. Worse: the engine records only the *failed* move into `moveHistory` (~26041), the other three stay unused, so on Very Hard (softmax T=0 argmax) the bot re-picks Last Resort **every turn until PP runs out** — a hard deadlock. Same run shows `aiEstimateDmg` valuing Dream Eater vs an awake target (43), Belch with no berry eaten (42), Counter as a flat unconditional 128 (via `_varPowerMoveBP["Counter"]=80`, ignoring both the took-physical-damage condition and the category of the player's likely move).

**Blast radius**: All bot modes (Story, Quick Battle, Gauntlet, PvP-vs-bot). Frequency in live build data (`data/builds.csv`): Sucker Punch **724** builds, Sleep Talk 350, Counter 132, Poltergeist 92, Mirror Coat 80, Focus Punch 63, Aurora Veil 44, Burn Up 4, Last Resort 2, Steel Roller 2. Sucker Punch/Focus Punch/Counter are the ones players see misplayed constantly; Last Resort/Belch/Dream Eater are rarer but produce total deadlocks. The lower the softmax temperature (harder difficulty), the MORE robotic the failure loop — the exact inverse of intent.

**Fix sketch**: Add an `aiMovePreconditionMult(attacker, defender, move)` helper mirroring the engine gates, applied in getBestMove's damaging branch: hard 0 for deterministic failures (Last Resort w/ incomplete history, Dream Eater vs awake, Belch w/o `volatile.belchReady`, Snore awake, Burn Up/Double Shock w/o type, Steel Roller w/o terrain, Synchronoise w/o shared type, Gigaton Hammer/Blood Moon after itself, Counter/Mirror Coat when the target has no live move of the countered category); probabilistic discount for prediction-dependent ones (Sucker Punch/Thunderclap/Upper Hand/Focus Punch/Shell Trap/Counter — scale by the share of the target's usable moves that satisfy the condition, floor ~0.2). All multiplier values are maintainer-owned balance numbers — propose defaults, get sign-off per CLAUDE.md.

**Verification**: Extend `tests/suites/ai-decision.test.js` with one deterministic case per gate (repro scenarios above are ready-made); re-run `node scripts/debug/_repro/ai-nuance-gaps.mjs` → 0 gaps.

---
severity: P1
category: bug
anchor_symbol: abilityImmunity
current_line_hint: ~22664
file: battle.html
agents: [enemy-bot-ai-session]
fingerprint: ffb290c2474a
confidence: high
status: fixed-claude/enemy-bot-ai-optimization-i394cm
---

**Title**: AI damage-immunity table drifted from engine — misses Earth Eater, Well-Baked Body, Wind Rider, Air Balloon, Magnet Rise/Telekinesis

**Evidence**:
```js
// abilityImmunity (~22664) knows: Lightning Rod/Volt Absorb/Motor Drive, Water Absorb/
// Storm Drain/Dry Skin, Flash Fire, Sap Sipper, Levitate, Bulletproof, Soundproof, Wonder Guard.
// Engine additionally blocks:
//   Earth Eater ~26879 (Ground → absorbed, target HEALS 25%)
//   Well-Baked Body ~26887 (Fire → absorbed, target gets +2 Def)
//   Wind Rider ~26893 (wind moves → absorbed, +1 Atk)
//   Air Balloon ~27891 (item: Ground immune; balloon does NOT pop on the blocked hit)
//   Magnet Rise / Telekinesis volatiles (Ground immune, cf. isGroundedMon ~30460)
```

**Repro**: `node scripts/debug/_repro/ai-nuance-gaps.mjs` — Garchomp vs Earth Eater Orthworm: `aiEstimateDmg(EQ)=126`, `getBestMove` picks **Earthquake**; engine absorbs it and heals the target 25% — the bot actively heals its opponent, and at T=0 it repeats forever (score never changes). Garchomp vs Air Balloon Heatran: `aiEstimateDmg(EQ)=326`, picks **Earthquake** for 0 damage; since a blocked Ground move never pops the balloon, this too loops indefinitely.

**Blast radius**: Every consumer of `abilityImmunity`/`aiEstimateDmg`: move scoring, `canKO`/`canGuaranteeKO`, `aiThreatScore` (the bot also OVER-estimates threat from player moves it is actually immune to — e.g. stays scared of an Earthquake its own Earth Eater absorbs), choice-lock wall detection, `aiBestSwitch` typing adjustment, switch-in prediction nudge, `aiChooseGimmick` Tera/Z KO checks.

**Fix sketch**: Extend `abilityImmunity` with the three absorb abilities (gated on `aiDefAbilityActive` like their engine counterparts, wind set mirrored from ~26892); add an item/volatile airborne check for Ground moves (Air Balloon honoring the engine's Magic Room/Embargo/Gravity gating, `volatile.magnetRise`/`telekinesis`) — `isGroundedMon` already encodes most of this and is the natural helper to reuse. Behavior-affecting: needs sign-off before commit.

**Verification**: New ai-decision tests: EQ vs Earth Eater / Air Balloon / Magnet Rise estimates 0 and is never picked over a live alternative; threat score from an Electric move vs own Volt Absorb already 0 (regression).

---
severity: P1
category: bug
anchor_symbol: aiAbilityBlocksMoveForAi
current_line_hint: ~23020
file: battle.html
agents: [enemy-bot-ai-session]
fingerprint: 6e93983e0799
confidence: high
status: fixed-claude/enemy-bot-ai-optimization-i394cm
---

**Title**: AI status-move blocking misses Good as Gold, the whole applyStatus immunity-ability table, and terrain/field blocks

**Evidence**:
```js
// aiAbilityBlocksMoveForAi (~23020) checks only: absorb abilities, Magic Bounce,
// Overcoat/Safety Goggles powder. Engine additionally blocks:
//   Good as Gold ~30751 (ALL foe-targeting status moves)
//   applyStatus table ~32412-32439: Misty Terrain (all status, grounded), Electric Terrain
//   (sleep, grounded), Insomnia/Vital Spirit/Sweet Veil (SLP), Immunity/Pastel Veil (PSN/TOX),
//   Limber (PAR), Water Veil/Thermal Exchange (BRN), Magma Armor (FRZ), Flower Veil (Grass),
//   Leaf Guard (sun), Uproar (SLP), Comatose/Shields Down (~30103), Safeguard, and
//   Grass-type powder immunity (engine powder block ~30762 — full block, but the AI's sleep
//   scoring (~23690) only applies a ×0.3 penalty AND wrongly applies it to non-powder
//   sleep moves like Hypnosis/Sing).
```

**Repro**: `node scripts/debug/_repro/ai-nuance-gaps.mjs` — Breloom picks **Spore into Insomnia Noctowl** (engine blocks; score stays ~100 every turn → argmax deadlock until Spore's PP is gone). Blissey picks **Will-O-Wisp into Good as Gold Gholdengo** (blocked). Not shown but same shape: Thunder Wave into Limber, Toxic into Immunity/Pastel Veil, any status into Misty Terrain.

**Blast radius**: Status-move half of getBestMove in all bot modes; stall-profile bots (`settings.aiProfile='stall'` boosts status scores ×1.12) degenerate hardest. Also `allImmune` switch logic (~24017) counts a live status move as "stall value is real" — a mon whose only status move is ability-blocked is treated as having a reason to stay in.

**Fix sketch**: Extend `aiAbilityBlocksMoveForAi` to (a) return true for Good as Gold + any non-self-targeting status move (mirror the engine's `_selfTargetMoves` allowance), (b) map status-inflicting moves to their status and consult a mirror of the applyStatus immunity table (abilities + terrain + Safeguard + Comatose/Shields Down), (c) treat Grass-type vs powder moves as a full block instead of the ×0.3 sleep-score penalty, and restrict that penalty to actual powder moves. Behavior-affecting: needs sign-off.

**Verification**: ai-decision tests: Spore vs Insomnia / Electric Terrain / Grass-type scores 0; WoW vs Good as Gold and vs Water Veil scores 0; Hypnosis vs Grass-type is NOT penalized as powder.

---
severity: P2
category: bug
anchor_symbol: getBestMove
current_line_hint: ~23519
file: battle.html
agents: [enemy-bot-ai-session]
fingerprint: 5253abacd5f7
confidence: high
status: fixed-claude/enemy-bot-ai-optimization-i394cm
---

**Title**: AI ignores priority blockers — Fake Out into Queenly Majesty/Dazzling/Armor Tail, priority into Psychic Terrain

**Evidence**:
```js
// Fake Out branch (~23519) checks only Inner Focus + Substitute:
//   if (defender.ability === "Inner Focus" || defHasSub) score = 0;
// Engine blocks ALL increased-priority moves vs Queenly Majesty/Dazzling/Armor Tail (~26748)
// and vs grounded targets under Psychic Terrain (~26755). The priority score multipliers
// (~23553-23557, up to ×3.0) are likewise granted for moves that cannot connect.
```

**Repro**: `node scripts/debug/_repro/ai-nuance-gaps.mjs` — Persian picks **Fake Out into Queenly Majesty** (blocked, wasted turn + wasted once-per-switch-in Fake Out window); 30%-HP Dragonite picks **Extreme Speed into Psychic Terrain** vs a grounded Indeedee it "KOs" (blocked).

**Blast radius**: All priority users vs Tsareena/Bruxish/Farigiraf lines and any Psychic-Terrain team; the KO-priority multipliers make blocked priority the argmax precisely in clutch endgame spots.

**Fix sketch**: Small helper `aiPriorityBlocked(attacker, defender, move)` mirroring the engine's effective-priority computation (~26742, incl. Gale Wings/Triage/Prankster) and its two block conditions; zero the Fake Out branch and skip the priority multipliers/score when blocked. Needs sign-off.

**Verification**: ai-decision tests: Fake Out never picked vs Dazzling-class; priority moves get no bonus and can't be the sole pick vs grounded target in Psychic Terrain.

---
severity: P2
category: bug
anchor_symbol: getBestMove
current_line_hint: ~23429
file: battle.html
agents: [enemy-bot-ai-session]
fingerprint: 1444980bfe73
confidence: high
status: fixed-claude/enemy-bot-ai-optimization-i394cm
---

**Title**: Sleeping bot never clicks Sleep Talk/Snore — wastes every sleep turn despite holding the counter-play

**Evidence**:
```js
// getBestMove has no awareness of attacker.status === "SLP". Sleep Talk (Status cat) falls
// into the default `else { score = 12; }` bucket (~23902); Snore scores as a weak 50 BP hit.
// Engine (~30674): while asleep ONLY Snore/Sleep Talk can act — anything else = "fast asleep".
```

**Repro**: `node scripts/debug/_repro/ai-nuance-gaps.mjs` — asleep Snorlax (Rest/Sleep Talk/Body Slam/Crunch) picks **Crunch**: turn silently lost. Rest+Sleep Talk is a shipped synergy in the bot's own build generator (see "synergy-scored move fill (Protect+Toxic, Rest+Sleep Talk…)" ~12459, 350 Sleep Talk builds in builds.csv) — the generator builds the set, the pilot can't fly it.

**Blast radius**: Every RestTalk/Comatose-style build the bot rolls; also makes the bot's own Rest (scored 0.8× of recovery, ~23711) strictly worse than intended since the follow-up turns are all dead.

**Fix sketch**: At the top of getBestMove: if `attacker.status === "SLP"` and the mon won't wake this turn, restrict scoring to Sleep Talk/Snore when either is usable (Sleep Talk scored by the expected value of its callable pool, Snore as its real damage); otherwise fall through. Needs sign-off.

**Verification**: ai-decision test: asleep mon with Sleep Talk picks Sleep Talk; asleep mon with neither behaves as today.

---
severity: P3
category: engine-fidelity
anchor_symbol: parseMoveEffects
current_line_hint: ~26043
file: battle.html
agents: [enemy-bot-ai-session]
fingerprint: ee024174f8a3
confidence: medium
status: fixed-claude/enemy-bot-ai-optimization-i394cm
---

**Title**: Poltergeist has no engine precondition — hits itemless targets (Showdown: fails without a held item)

**Evidence**:
```js
// grep 'Poltergeist' battle.html → 0 hits in parseMoveEffects/performAction gates.
// Every other spec-conditional move got a gate in the intelligent-einstein pass
// (Dream Eater/Thunderclap/Synchronoise etc.); Poltergeist (92 builds in builds.csv,
// 110 BP Ghost) was missed — it currently functions as an unconditional nuke for
// both sides. AI-side: once the gate exists, aiMovePreconditionMult must mirror it
// (0 when defender.item is null/knocked off).
```

**Repro**: Any battle: Poltergeist vs an itemless target deals full damage; on Showdown it fails. (Differential sweep `tests/differential/sweep-all.mjs` should also flag it under move.conditional.)

**Blast radius**: Engine fidelity + the same AI wasted-turn class as ecd0ce7d7e85 once the engine gate is added — fix both sides in the same change to avoid re-introducing the drift.

**Fix sketch**: Add the engine gate (fail when target has no held item, mirroring Knock Off's item checks ~22925 for un-removable items), then mirror in the AI precondition helper. Needs sign-off (move implementation change).

**Verification**: Differential triage bucket goes green for Poltergeist; ai-decision test that the bot skips Poltergeist vs itemless targets.
