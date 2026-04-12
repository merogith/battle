# Pokemon VGC Battle Simulator - Comprehensive Implementation Plan

> **Generated:** 2026-04-12 | **File:** battle.html (7934 lines) | **Format:** Singles 1v1 (VGC-style mechanics)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Overview](#2-current-architecture-overview)
3. [Phase 1: Critical Bug Fixes](#3-phase-1-critical-bug-fixes)
4. [Phase 2: Game Engine Completeness](#4-phase-2-game-engine-completeness)
5. [Phase 3: Build Generation & Data Integrity](#5-phase-3-build-generation--data-integrity)
6. [Phase 4: AI Improvements](#6-phase-4-ai-improvements)
7. [Phase 5: Game Flow & Gauntlet Fixes](#7-phase-5-game-flow--gauntlet-fixes)
8. [Phase 6: Code Structure & Quality](#8-phase-6-code-structure--quality)
9. [Phase 7: Visual & UX Polish](#9-phase-7-visual--ux-polish)
10. [Phase 8: Automated Testing Infrastructure](#10-phase-8-automated-testing-infrastructure)
11. [Appendix: Function Reference](#11-appendix-function-reference)

---

## 1. Executive Summary

### What Works Well
- Damage calculation formula is correct (Lv50 VGC formula)
- Type effectiveness chart is complete (Gen 9, 18 types)
- 40+ abilities implemented across on-switch, passive, and end-of-turn triggers
- Status conditions (BRN, PSN, TOX, PAR, SLP, FRZ) all functional with correct immunities
- Weather and terrain systems functional with correct modifiers
- Gimmick mechanics (Mega, Dynamax, Tera) implemented with Classic mode tracking
- Accuracy/evasion system works with stage modifiers and weather overrides
- Sleep has proper turn counting with Early Bird support
- Knock Off correctly removes items (with Sticky Hold / Mega Stone protection)
- Entry hazards (Stealth Rock, Spikes, Toxic Spikes, Sticky Web) present
- Draft and Gauntlet modes functional
- Stat stages with proper +-6 capping

### What Needs Fixing
- Several move mechanics are incomplete or incorrect
- Max Move secondary effects not implemented (Max Flare should set Sun, etc.)
- Some ability interactions missing or broken
- Build data has EV validation issues (214 builds exceed 510 total)
- AI makes suboptimal decisions in edge cases
- Gauntlet mode has UX issues (no final score on loss, draw handling unclear)
- No automated testing infrastructure
- Single 7934-line file needs structural improvements for maintainability

---

## 2. Current Architecture Overview

### File Structure
```
pokemon battle/
  battle.html          # 7934 lines - ALL game logic, UI, CSS
  index.html           # Landing/redirect page
  data/
    species.json       # Pokemon base stats, types, abilities (Gen 1-9)
    moves.json         # Move data by generation
    abilities.json     # Ability descriptions
    items.json         # Item data
    natures.json       # Nature stat modifiers
    builds.csv         # 16,743 pre-built Pokemon sets
    builds/            # Per-generation build JSON files (gen4-gen9)
  scripts/
    generate_builds.js # CSV generator from builds/*.json
  sprites/             # Animated sprites (gen5ani, gen5ani-shiny)
  test_battle.js       # Basic function existence tests
  test_battle2.js      # Transform/Super Fang/gauntlet reset tests
```

### Key Functions (battle.html line numbers)
| Function | Line | Purpose |
|----------|------|---------|
| `buildPokemon(name, build)` | 2598 | Constructs battle-ready Pokemon object |
| `initDraft(mode)` | 3135 | Starts draft for pve/pvp/gauntlet |
| `renderDraft()` | 3232 | Renders draft card grid |
| `selectDraft(item)` | 3270 | Handles draft pick |
| `startBattle()` | 3361 | Transitions draft -> battle |
| `updateUI()` | 3424 | Refreshes all battle visuals |
| `getBestMove(mon, foe)` | ~4100 | AI move selection |
| `aiEstimateDmg()` | ~4151 | AI damage estimation |
| `aiBestSwitch(bench, foe)` | 4178 | AI switch decision |
| `aiChooseGimmick(atk, def)` | 4193 | AI gimmick activation |
| `playTurn(pMoveIdx, pSwitchIdx)` | 4784 | Main turn execution |
| `getEffectiveSpeed(mon, weather)` | 5020 | Speed calc with modifiers |
| `performAction(isPlayer, move)` | 5034 | Single action resolution |
| `applyStatus(mon, status)` | 7438 | Status condition application |
| `endOfTurnEffects(mon, foe)` | 7540 | End-of-turn damage/healing |
| `canMove(mon, moveName)` | 6838 | Sleep/freeze/para/flinch checks |
| `checkFaints()` | 6474 | Win/loss/draw + forced switches |
| `applySwitchInAbilities(mon, foe)` | 6617 | On-switch ability triggers |
| `parseMoveEffects(atk, def, move)` | 6884 | Move secondary effects |
| `nextGauntletRound()` | 7893 | Gauntlet round advancement |

### State Object (line ~2556)
```javascript
state = {
  mode, draftTurn, score,
  p1Pool, p2Pool, p1Draft, p2Draft,
  playerParty, foeParty, pActive, fActive,
  isOver, isLocked, turnNumber,
  weather, weatherTurns, terrain, terrainTurns, trickRoom,
  pSide/fSide: { stealthRock, toxicSpikes, spikes, stickyWeb, reflect, lightScreen, auroraVeil, wishHp, wishTurns },
  usedMega/usedDyna/usedZ/usedTera (player + foe variants),
  currentPlayer, p1Action, p2Action
}
```

---

## 3. Phase 1: Critical Bug Fixes

### BUG-01: Protean/Libero Type Change Timing
**Location:** Line ~5926  
**Problem:** Protean changes the user's type to match the move type, but the flag `proteanUsed` may not properly prevent re-activation on subsequent turns after switching.  
**Fix:** Ensure `proteanUsed` is set to `true` BEFORE applying the type change, and reset it ONLY on switch-in (in `applySwitchInAbilities` or `buildPokemon` volatile reset). Verify it doesn't activate when Terastallized.  
**VGC Rule:** Gen 9: Protean/Libero only activate once per switch-in.

### BUG-02: Max Move Secondary Effects Missing  
**Location:** Damage calc section (~line 6061)  
**Problem:** When Dynamaxed, moves convert to Max Moves via `buildMaxMove()` (line 3039), but the secondary field effects are NOT applied. Max Flare should set Sun, Max Geyser sets Rain, Max Rockfall sets Sandstorm, Max Hailstorm sets Hail, Max Lightning sets Electric Terrain, Max Overgrowth sets Grassy Terrain, Max Mindstorm sets Psychic Terrain, Max Starfall sets Misty Terrain, etc.  
**Fix:** Add a `applyMaxMoveEffect(move, attacker, defender, isPlayer)` function after damage resolution that checks the Max Move name and applies the corresponding field effect (5 turns).  
**Full list of Max Move effects:**
| Max Move | Type | Effect |
|----------|------|--------|
| Max Flare | Fire | Sets Sun (5 turns) |
| Max Geyser | Water | Sets Rain (5 turns) |
| Max Rockfall | Rock | Sets Sandstorm (5 turns) |
| Max Hailstorm | Ice | Sets Hail (5 turns) |
| Max Lightning | Electric | Sets Electric Terrain |
| Max Overgrowth | Grass | Sets Grassy Terrain |
| Max Mindstorm | Psychic | Sets Psychic Terrain |
| Max Starfall | Fairy | Sets Misty Terrain |
| Max Airstream | Flying | +1 Speed (user) |
| Max Knuckle | Fighting | +1 Attack (user) |
| Max Ooze | Poison | +1 Sp.Atk (user) |
| Max Steelspike | Steel | +1 Defense (user) |
| Max Quake | Ground | +1 Sp.Def (user) |
| Max Wyrmwind | Dragon | -1 Attack (opponent) |
| Max Phantasm | Ghost | -1 Defense (opponent) |
| Max Darkness | Dark | -1 Sp.Def (opponent) |
| Max Strike | Normal | -1 Speed (opponent) |
| Max Guard | Status | Protect (already handled) |

### BUG-03: Volatile Conditions Not Cleared on Faint/Switch
**Location:** Switch logic in `playTurn` (~line 4869-4899)  
**Problem:** When a Pokemon faints or switches, volatile conditions (Leech Seed, Curse, confusion, Taunt, Encore, trapped, perish count) should be fully cleared. Verify all volatile fields are reset.  
**Fix:** Create a `clearVolatiles(mon)` helper function that resets ALL volatile fields:
```javascript
function clearVolatiles(mon) {
  mon.volatile = {
    sub: 0, protect: false, flinch: false, confused: 0, confusedTurns: 0,
    cursed: false, leechSeed: false, encore: null, encoreTurns: 0,
    taunt: 0, torment: false, disable: null, disableTurns: 0,
    trapped: false, yawn: 0, perishCount: 0, destinyBond: false,
    rolloutCount: 0, lockMove: null, lockTurns: 0,
    charging: null, bide: 0, bideDmg: 0, bideTurns: 0,
    lastPhysicalDmg: 0, lastSpecialDmg: 0,
    choiceLock: null, flashFireBoost: false, proteanUsed: false,
    slowStart: 0, stockpile: 0, magnetRise: 0,
    ingrain: false, aquaRing: false, substitute: 0
  };
}
```
Call this on switch-out AND on faint.

### BUG-04: Stat Changes Applied to Fainted Pokemon
**Location:** `parseMoveEffects` (line 6884) and after-KO ability triggers  
**Problem:** If a move KOs the opponent, secondary stat changes (e.g., from Ominous Wind, Ancient Power) may attempt to modify the fainted mon or error.  
**Fix:** Add `if (target.currentHp <= 0) return;` guard at the start of stat-change application blocks.

### BUG-05: Life Orb Recoil Missing
**Location:** Damage calc (~line 5935-5954)  
**Problem:** Life Orb applies the 1.3x damage boost but does NOT apply the 10% max HP recoil to the attacker.  
**Fix:** After damage application, if `attacker.item === "Life Orb"` and the move dealt damage and attacker doesn't have Magic Guard:
```javascript
if (attacker.item === "Life Orb" && damage > 0 && attacker.ability !== "Magic Guard" && attacker.ability !== "Sheer Force") {
    let recoil = Math.max(1, Math.floor(attacker.baseMaxHp / 10));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
    logMsg(`${attacker.name} lost some HP due to Life Orb!`, 'dmg');
}
```
Note: Sheer Force + Life Orb = no recoil (intended interaction).

### BUG-06: Recoil Moves Incomplete
**Location:** After damage application  
**Problem:** Recoil moves (Brave Bird, Flare Blitz, Wild Charge, Head Smash, Wood Hammer, Double-Edge, Take Down, Submission) should deal 1/3 or 1/4 recoil to the user. Verify each is handled.  
**Fix:** After damage is dealt, check if the move is in a recoil table:
```javascript
const recoilMoves = {
  "Brave Bird": 1/3, "Flare Blitz": 1/3, "Wild Charge": 1/4,
  "Head Smash": 1/2, "Wood Hammer": 1/3, "Double-Edge": 1/3,
  "Take Down": 1/4, "Submission": 1/4, "Volt Tackle": 1/3,
  "Head Charge": 1/4, "Wave Crash": 1/3
};
if (recoilMoves[move.name] && attacker.ability !== "Magic Guard" && attacker.ability !== "Rock Head") {
    let recoilDmg = Math.max(1, Math.floor(damage * recoilMoves[move.name]));
    attacker.currentHp = Math.max(0, attacker.currentHp - recoilDmg);
    logMsg(`${attacker.name} was hurt by recoil! (-${recoilDmg} HP)`, 'dmg');
}
```

### BUG-07: Burn Damage Rate
**Location:** `endOfTurnEffects` (line ~7540+)  
**Problem:** Verify burn deals 1/16 max HP per turn (Gen 7+ change from 1/8).  
**Fix:** Ensure burn damage is `Math.max(1, Math.floor(mon.baseMaxHp / 16))`.

### BUG-08: Toxic Escalating Damage
**Location:** `endOfTurnEffects`  
**Problem:** Toxic should deal N/16 max HP where N starts at 1 and increments each turn. Verify `statusTurns` is used correctly and resets on switch.  
**Fix:** Ensure: `let toxDmg = Math.max(1, Math.floor(mon.baseMaxHp * mon.statusTurns / 16));` and `statusTurns` is incremented BEFORE damage calculation. Reset `statusTurns = 0` on switch-out (not on switch-in).

### BUG-09: Grassy Terrain Healing
**Location:** `endOfTurnEffects`  
**Problem:** Grounded Pokemon should heal 1/16 max HP per turn on Grassy Terrain. Verify this is implemented.  
**Fix:** In `endOfTurnEffects`, after weather damage:
```javascript
if (state.terrain === "Grassy" && isGrounded(mon)) {
    let heal = Math.max(1, Math.floor(mon.baseMaxHp / 16));
    mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
    logMsg(`${mon.name} healed from the Grassy Terrain!`, 'heal');
}
```

### BUG-10: Paralysis Speed Reduction
**Location:** `getEffectiveSpeed` (line 5020)  
**Problem:** Paralysis should halve speed (Gen 7+: 0.5x). Verify it's `0.5` not `0.25` (Gen 1-6 was 0.25).  
**Fix:** `if (mon.status === "PAR") spe *= 0.5;`

---

## 4. Phase 2: Game Engine Completeness

### 2A. Move Mechanics to Implement/Fix

#### 2A-01: Two-Turn Moves (Solar Beam, Dig, Fly, etc.)
**Location:** Line 4843-4844  
**Current:** Basic `volatile.charging` flag exists.  
**Fix:**
- Turn 1: Set `volatile.charging = moveName`, skip damage, show "Mon is charging/digging/flying!"
- Turn 2: Force the move, clear charging flag, apply damage
- Power Herb: Skip charge turn, consume item
- Solar Beam: No charge in Sun/Harsh Sun
- Dig: Semi-invulnerable (immune to most moves, hit by Earthquake 2x)
- Fly: Semi-invulnerable (immune to most moves, hit by Thunder/Gust/Sky Uppercut)
- Phantom Force/Shadow Force: Semi-invulnerable, breaks Protect on hit
- Prevent move selection during charge turn (UI should show charge move grayed)

#### 2A-02: Protect and Protect-Like Moves
**Location:** Current protect logic  
**Fix:** Implement consecutive Protect failure rate:
```javascript
// Protect, Detect, King's Shield, Baneful Bunker, Spiky Shield, Obstruct
let protectChance = 1 / Math.pow(3, mon.volatile.consecutiveProtects || 0);
if (Math.random() < protectChance) {
    mon.volatile.protect = true;
    mon.volatile.consecutiveProtects = (mon.volatile.consecutiveProtects || 0) + 1;
} else {
    logMsg(`But it failed!`);
}
// Reset consecutiveProtects when using non-protect move
```
- King's Shield: -1 Atk to contact attackers
- Baneful Bunker: Poisons contact attackers
- Spiky Shield: 1/8 damage to contact attackers
- Obstruct: -2 Def to contact attackers

#### 2A-03: Weight-Based Moves
**Location:** Line 5845-5856  
**Verify/Fix:**
- Low Kick / Grass Knot: Power based on TARGET weight
- Heavy Slam / Heat Crash: Power based on weight RATIO (user/target)
- Autotomize: Halves user weight (track with volatile)

#### 2A-04: Gyro Ball & Electro Ball
**Location:** Lines 5845, 5851  
**Fix:**
- Gyro Ball: `basePower = Math.min(150, Math.floor(25 * targetSpeed / userSpeed))`
- Electro Ball: Power based on speed ratio (user/target): 1x=40, 2x=60, 3x=80, 4x=120, else=150

#### 2A-05: Fixed/Variable Damage Moves
**Verify these work correctly:**
- Seismic Toss / Night Shade: Deals damage = user's level (50 in VGC)
- Dragon Rage: Always 40 damage
- Sonic Boom: Always 20 damage
- Super Fang: Deals 50% of target's CURRENT HP
- Endeavor: Reduces target HP to user's HP (if user HP < target HP)
- Final Gambit: User faints, deals damage = user's current HP
- Counter: Returns 2x last physical damage received
- Mirror Coat: Returns 2x last special damage received
- Metal Burst: Returns 1.5x last damage received

#### 2A-06: Entry Hazard Application on Switch
**Location:** Verify in switch processing  
**Fix:** When a Pokemon switches in, apply hazards in this order:
1. Stealth Rock: Type-effective damage (1/8 base, modified by Rock effectiveness against the switching mon's types)
2. Spikes: 1/8 (1 layer), 1/6 (2 layers), 1/4 (3 layers) - Ground immune, Flying immune, Levitate immune
3. Toxic Spikes: 1 layer = Poison, 2 layers = Toxic. Poison-type Pokemon ABSORB and clear toxic spikes on entry. Flying/Levitate immune. Steel-type immune.
4. Sticky Web: -1 Speed. Flying/Levitate immune.
- Heavy-Duty Boots: Immune to ALL entry hazards
- Magic Guard: Immune to entry hazard DAMAGE (but still gets poisoned by Toxic Spikes, still gets Sticky Web speed drop)

#### 2A-07: Hazard Removal Moves
**Verify:**
- Rapid Spin: Removes all hazards from user's side, +1 Speed (Gen 8+)
- Defog: Removes all hazards from BOTH sides, removes terrain and weather screens, -1 evasion to target
- Court Change: Swaps hazards between sides

#### 2A-08: Screens (Reflect, Light Screen, Aurora Veil)
**Location:** `pSide`/`fSide` state  
**Verify/Fix:**
- Reflect: 5 turns (8 with Light Clay), halves Physical damage
- Light Screen: 5 turns (8 with Light Clay), halves Special damage
- Aurora Veil: 5 turns, halves both Physical AND Special. Only usable in Hail/Snow.
- Brick Break: Removes opponent's Reflect + Light Screen before dealing damage
- Screen Cleaner (ability): Removes all screens on both sides on switch-in

#### 2A-09: Critical Hit Mechanics
**Location:** Line ~5700  
**Verify:**
- Base crit rate: 1/24 (stage 0)
- +1 stage: moves with high crit ratio (Slash, Stone Edge, etc.) → 1/8
- +2 stages: Razor Claw / Scope Lens + high crit move → 1/2
- +3 stages: guaranteed crit
- Super Luck: +1 crit stage
- Sniper: Crit damage = 2.25x (vs normal 1.5x)
- Battle Armor / Shell Armor: Block crits
- On crit: Ignore attacker's negative Atk/SpA stages, ignore defender's positive Def/SpD stages

#### 2A-10: Substitute Interactions
**Location:** Line 5559-5562  
**Fix:** Substitute (25% max HP to create) should block:
- All damaging moves (damage goes to sub, excess lost)
- Status moves that target the opponent (Thunder Wave, Toxic, Will-O-Wisp)
- Stat-lowering moves (Intimidate on switch is blocked by Sub)
- Leech Seed
- NOT blocked: Sound moves (Boomburst, Bug Buzz, Hyper Voice), Infiltrator ability

### 2B. Abilities to Implement/Fix

#### 2B-01: Missing Commonly-Used Abilities
Implement or verify these abilities are handled:

**Defensive:**
- Multiscale: Halves damage at full HP
- Fur Coat: Doubles Defense stat
- Ice Scales: Halves Special damage taken
- Filter/Solid Rock/Prism Armor: Super-effective moves deal 0.75x damage
- Thick Fat: Halves Fire and Ice damage

**Offensive:**
- Tough Claws: 1.3x contact move damage
- Strong Jaw: 1.5x bite moves (Crunch, Fire Fang, etc.)
- Mega Launcher: 1.5x pulse moves (Aura Sphere, Dragon Pulse, etc.)
- Pixilate/Aerilate/Refrigerate/Galvanize: Normal moves become [type], +1.2x power

**Weather/Terrain:**
- Sand Force: 1.3x Rock/Ground/Steel in Sandstorm
- Ice Body: 1/16 heal in Hail

**On-Switch:**
- Screen Cleaner: Remove all screens on both sides
- Neutralizing Gas: Suppress all other abilities (partially implemented, verify)
- As One: Combines two abilities (Calyrex forms)

**Turn-Based:**
- Moody: Random +2 to one stat, -1 to another each turn
- Harvest: 50% chance to recover consumed berry (100% in Sun)
- Bad Dreams: 1/8 damage to sleeping opponents per turn

#### 2B-02: Ability-Move Interactions
- Prankster: Status moves get +1 priority but are blocked by Dark-type targets (verify Dark immunity)
- Bulletproof: Immune to ball/bomb moves (Shadow Ball, Sludge Bomb, Energy Ball, etc.)
- Soundproof: Immune to sound moves (Boomburst, Bug Buzz, Hyper Voice)
- Overcoat: Immune to powder moves (Spore, Sleep Powder) AND weather damage

### 2C. Items to Implement/Fix

#### 2C-01: Priority Items
- Focus Sash: Survives any hit at full HP with 1 HP (one-time, consumed)
- Weakness Policy: +2 Atk and SpA when hit super-effectively (consumed)
- Air Balloon: Immune to Ground moves, pops on any hit
- Safety Goggles: Immune to powder moves + weather damage
- Heavy-Duty Boots: Immune to entry hazards (verify implementation)
- Protective Pads: Contact effects don't trigger (Flame Body, Static, etc.)
- Eject Button: Force switch on hit (consumed)
- Red Card: Force opponent to switch on hit (consumed)

#### 2C-02: Damage-Modifying Items
- Expert Belt: 1.2x super-effective moves
- Metronome (item): Stacking 1.2x per consecutive same-move use (up to 2x)
- Razor Claw: +1 crit stage
- Scope Lens: +1 crit stage

#### 2C-03: Berry Triggers
- Sitrus Berry: Heal 25% when HP drops below 50% (consumed)
- Pinch berries (Figy, Wiki, Mago, Aguav, Iapapa): Heal 33% at <25% HP (consumed)
- Resist berries (Occa, Passho, etc.): Halve super-effective damage once (consumed)

---

## 5. Phase 3: Build Generation & Data Integrity

### 3A. EV Validation (CRITICAL)
**Problem:** 214 builds in builds.csv have EV totals exceeding 510.  
**Location:** `scripts/generate_builds.js`  
**Fix:**
1. Add EV sum validation in `generate_builds.js`:
```javascript
const evTotal = evs.reduce((sum, v) => sum + v, 0);
if (evTotal > 510) {
    console.warn(`INVALID EVs for ${name}: total=${evTotal}`);
    // Scale down proportionally to 510
    const scale = 510 / evTotal;
    evs = evs.map(v => Math.floor(v * scale));
}
// Also cap individual EVs at 252
evs = evs.map(v => Math.min(252, v));
```
2. Add validation in `buildPokemon()` (line 2598) as a runtime safety net.

### 3B. Pokemon Name Resolution
**Problem:** Build CSV uses display names ("Raichu-Alola") but species.json uses slugs ("raichualola").  
**Fix:** Verify the name-to-slug conversion function handles ALL form variants:
- Mega forms: "Alakazam-Mega" -> "alakazammega"
- Alolan/Galarian/Hisuian/Paldean forms: "Raichu-Alola" -> "raichualola"
- Special forms: "Rotom-Heat" -> "rotomheat", "Deoxys-Attack" -> "deoxysattack"
- Hyphenated names: "Ho-Oh" -> "hooh", "Porygon-Z" -> "porygonz"
- Spaces: "Tapu Koko" -> "tapukoko", "Mr. Mime" -> "mrmime"
- Apostrophes: "Farfetch'd" -> "farfetchd"

### 3C. Missing Species Data
**Problem:** Gen 2 has only Unown; Gen 4 has 6 entries; Gen 8 has 29 entries.  
**Impact:** Moderate - most builds reference Gen 9 species data which is complete (1515 entries).  
**Fix:** Since Gen 9 species.json contains ALL Pokemon with their current stats (including older gen Pokemon), ensure the lookup function searches Gen 9 data as fallback when older gen data is missing. The key lookup should be:
```javascript
function findSpecies(name) {
    let slug = toSlug(name);
    // Search Gen 9 first (most complete), then other gens
    for (let gen of [9, 8, 7, 6, 5, 4, 3, 2, 1]) {
        if (speciesData[gen] && speciesData[gen][slug]) return speciesData[gen][slug];
    }
    return null;
}
```

### 3D. Item Clause Enforcement
**VGC Rule:** No duplicate items on the same team.  
**Location:** Draft selection and build generation  
**Fix:** During draft, track selected items and prevent duplicates. In AI team building, ensure no two mons share the same item.

### 3E. Species Clause Enforcement
**VGC Rule:** No two Pokemon of the same National Dex number.  
**Location:** Draft selection  
**Fix:** Already partially implemented in gauntlet swap (line 7879). Extend to draft phase.

---

## 6. Phase 4: AI Improvements

### 4A. Move Selection Intelligence
**Location:** `getBestMove` function  
**Improvements:**

1. **KO Priority:** If AI can KO with a move, strongly prefer it over setup/status.
2. **Speed Awareness:** Check if AI outspeeds - if yes, prefer moves that KO; if no, prefer priority moves.
3. **Status Awareness:** Don't use status moves on already-statused targets. Don't Thunder Wave Electric types, Toxic Poison types, Will-O-Wisp Fire types.
4. **Protect Prediction:** If opponent just used Protect, don't predict another (consecutive protect rate drops).
5. **Type Immunity Awareness:** Never select Ground moves vs Flying/Levitate, never select Normal/Fighting vs Ghost (unless Scrappy).
6. **Substitute Awareness:** If opponent has a Sub, prefer multi-hit or high-power moves.
7. **Weather/Terrain Synergy:** Boost score for moves that benefit from current weather/terrain.

### 4B. Switch Decision Intelligence
**Location:** `aiBestSwitch` (line 4178) and `aiDecision`  
**Improvements:**

1. **Threat Assessment:** Switch when current mon can't damage opponent and opponent threatens KO.
2. **Type Advantage Switching:** Switch to a Pokemon that resists the opponent's STAB.
3. **Preserve Win Condition:** Don't switch out the mon that's needed to handle a specific opponent.
4. **HP Conservation:** Factor remaining HP into switch decisions more heavily.
5. **Entry Hazard Awareness:** Consider hazard damage when switching (especially Stealth Rock).

### 4C. Gimmick Usage Intelligence
**Location:** `aiChooseGimmick` (line 4193)  
**Improvements:**

1. **Dynamax Timing:** Dynamax when:
   - Current mon is the best Dynamax candidate on the team
   - Opponent is in KO range with Max Move but not with regular move
   - Need to survive a big hit (HP boost)
   - Max Move side effect is beneficial (weather/terrain setup)
2. **Tera Timing:** Tera when:
   - About to be hit super-effectively and Tera type resists
   - Tera STAB on a move would secure a KO
   - Offensive Tera type gives coverage
3. **Mega Timing:** Mega immediately (almost always beneficial).

### 4D. AI Difficulty Levels (Future Enhancement)
Consider adding difficulty settings:
- **Easy:** Random moves, no switching, no gimmicks
- **Normal:** Current AI behavior
- **Hard:** Optimal play, prediction, team-level thinking

---

## 7. Phase 5: Game Flow & Gauntlet Fixes

### 5A. Gauntlet Loss Screen
**Problem:** When the player loses in gauntlet, only a generic "GAME OVER" is shown without the final score.  
**Fix:** In `checkFaints()` (line ~6523), when gauntlet loss occurs:
```javascript
if (state.mode === 'gauntlet') {
    showEndScreen("GAUNTLET OVER!", `You cleared ${state.score} round${state.score !== 1 ? 's' : ''}!`, true);
} else {
    showEndScreen("GAME OVER", "You have no Pokemon left.");
}
```

### 5B. Gauntlet Draw Handling
**Problem:** On a draw, the game auto-advances with no feedback.  
**Fix:** Show a brief modal: "Draw! Both sides fainted. No score awarded. New opponent incoming..."
Allow 3 seconds before auto-advancing.

### 5C. Forced Switch After Faint
**Problem:** When a Pokemon faints mid-battle, verify the switch-in UI is properly shown and entry hazards + abilities apply.  
**Fix:** Ensure `checkFaints` properly:
1. Shows party selection modal for the side that lost a mon
2. Applies entry hazards to the incoming mon
3. Triggers switch-in abilities (Intimidate, weather setters, terrain setters)
4. AI auto-selects best available switch when AI's mon faints

### 5D. PvP Mode Turn Sequencing
**Location:** Line 4797-4806  
**Problem:** PvP mode shows "Player 2's turn" but doesn't properly hide Player 1's options or reveal Player 2's team info.  
**Fix:** Ensure proper information hiding during PvP:
- Don't show Player 1's moves/stats during Player 2's turn
- Both actions should be submitted before resolution
- Consider simultaneous action selection (both choose, then resolve)

### 5E. Return to Home State Cleanup
**Location:** `returnToHome()` (line 2721)  
**Fix:** Ensure ALL state is properly cleared:
- Kill any pending `setTimeout`/`setInterval` timers
- Clear battle log
- Reset all gimmick flags
- Clear drafted teams
- Remove any lingering animation classes

---

## 8. Phase 6: Code Structure & Quality

### 6A. Function Extraction
The 7934-line single file should have logical sections. While keeping it as a single file (per project design), add clear section markers and extract repeated logic into helper functions:

1. **Damage Calculation:** Extract into `calculateDamage(attacker, defender, move, state)` that returns `{damage, crit, effectiveness, messages}`.
2. **Type Effectiveness:** Already has `getMoveEffectiveness` - good.
3. **Stat Calculation:** Extract `calculateStat(baseStat, iv, ev, level, natureMod)`.
4. **Volatile Reset:** Extract `clearVolatiles(mon)` as described in BUG-03.
5. **Grounding Check:** Extract `isGrounded(mon)` - checks Flying type, Levitate, Air Balloon, Magnet Rise, Ingrain.

### 6B. Constants Organization
Move hardcoded values to named constants at the top of the script:
```javascript
const LEVEL = 50;
const MAX_EVS_PER_STAT = 252;
const MAX_EVS_TOTAL = 510;
const MAX_IVS = 31;
const MAX_STAGES = 6;
const CRIT_STAGES = [24, 8, 2, 1]; // denominators for crit chance
const BURN_DAMAGE_FRACTION = 16;
const TOXIC_BASE_FRACTION = 16;
const LEFTOVERS_HEAL_FRACTION = 16;
const GRASSY_TERRAIN_HEAL_FRACTION = 16;
const LIFE_ORB_RECOIL_FRACTION = 10;
```

### 6C. Error Handling
Add defensive checks in critical paths:
- `performAction`: Guard against null attacker/defender
- `parseMoveEffects`: Guard against fainted targets
- `endOfTurnEffects`: Guard against already-fainted mons
- `buildPokemon`: Handle missing species data gracefully

### 6D. Logging Improvements
- Add a `DEBUG` flag for verbose logging during development
- Log move damage details when DEBUG is on (base power, modifiers, effectiveness, final damage)
- Log AI decision reasoning when DEBUG is on
- Structure log messages with consistent categories: 'dmg', 'heal', 'status', 'info', 'weather', 'terrain'

---

## 9. Phase 7: Visual & UX Polish

### 7A. Battle UI Improvements
1. **Effectiveness Indicator:** Show "Super effective!", "Not very effective...", "It doesn't affect..." messages with color coding (green/orange/red)
2. **Critical Hit Flash:** Visual flash on critical hits
3. **HP Bar Color Transitions:** Smooth color transitions as HP changes (green > yellow > red)
4. **Type Badges:** Style type indicators with official Pokemon type colors
5. **Move PP Display:** Show remaining PP on move buttons during battle

### 7B. Draft UI Improvements
1. **Filter/Sort:** Add ability to sort draft pool by stat, type, or tier
2. **Search:** Add search bar in draft screen
3. **Type Filter:** Filter by Pokemon type
4. **Compare:** Side-by-side comparison of two Pokemon

### 7C. Gauntlet UI Improvements
1. **Score Display:** Persistent score counter during battle
2. **Round Counter:** "Round X" prominently displayed
3. **Team Health Overview:** Mini HP bars for all party members visible at a glance
4. **Streak Record:** Track and display best streak

### 7D. Animations
1. **Damage Shake:** Screen shake on big hits (>50% HP)
2. **Status Applied:** Visual indicator when status is applied
3. **Weather Overlay:** Subtle visual overlay for active weather
4. **Faint Animation:** Mon fading/falling animation on faint

---

## 10. Phase 8: Automated Testing Infrastructure

### 8A. Headless Battle Engine Test Script
Create `test_battle_engine.js` that can run battles without the DOM:

```javascript
// test_battle_engine.js
// Extracts game logic from battle.html and runs automated battles
// Usage: node test_battle_engine.js [--battles=100] [--verbose] [--log-file=results.json]

// Required capabilities:
// 1. Load all data files (species, moves, abilities, items, natures, builds)
// 2. Build Pokemon from builds.csv
// 3. Run battles with AI vs AI
// 4. Log every action, damage, effect, status change
// 5. Validate VGC rules at each step
// 6. Report inconsistencies
```

### 8B. Test Categories

#### Category 1: Data Integrity Tests
```
- All builds have EVs summing to <= 510
- All builds have individual EVs <= 252
- All builds reference valid species in species.json
- All builds reference valid moves in moves.json
- All builds reference valid abilities in abilities.json
- All builds reference valid items in items.json
- All builds reference valid natures in natures.json
- No duplicate items within auto-generated teams
- No duplicate species within auto-generated teams
```

#### Category 2: Damage Calculation Tests
```
- Physical damage uses Atk vs Def
- Special damage uses SpA vs SpD
- STAB applies 1.5x correctly
- Type effectiveness 2x/4x/0.5x/0.25x/0x
- Critical hit ignores stat drops
- Burn halves physical damage
- Weather modifiers apply (Sun: Fire 1.5x, Water 0.5x)
- Terrain modifiers apply (Electric Terrain: Electric 1.3x grounded)
- Life Orb 1.3x + recoil
- Choice Band 1.5x physical
- Reflect halves physical damage
```

#### Category 3: Status & Effect Tests
```
- Burn: 1/16 damage per turn, physical halved
- Poison: 1/8 damage per turn
- Toxic: Escalating damage (1/16, 2/16, 3/16...)
- Paralysis: 50% speed, 25% full paralysis
- Sleep: 1-3 turns, wakes up
- Freeze: 20% thaw chance per turn
- Confusion: 1-4 turns, 33% self-hit
- Fire type immune to burn
- Electric type immune to paralysis
- Poison/Steel type immune to poison
```

#### Category 4: Ability Tests
```
- Intimidate: -1 Atk on switch
- Levitate: Ground immunity
- Flash Fire: Fire immunity + boost
- Water Absorb/Volt Absorb: Absorb + heal
- Protean: Type change (once per switch)
- Huge Power: 2x Atk
- Multiscale: Half damage at full HP
- Speed Boost: +1 Spe end-of-turn
```

#### Category 5: Battle Flow Tests
```
- Faster mon moves first (same priority)
- Priority moves go first regardless of speed
- Trick Room reverses speed order
- Pursuit activates on switch
- Fainted mons can't act
- Forced switch after faint
- Entry hazards apply on switch
- Weather/terrain turn counters decrement
```

#### Category 6: Mass Battle Simulation
```
- Run 1000+ AI vs AI battles
- Track win rates per species/build
- Identify any infinite loops (battle exceeding 100 turns)
- Check for NaN/undefined damage values
- Verify HP never goes negative
- Verify HP never exceeds maxHp
- Check for moves with 0 PP being used
- Detect softlocks (game state stuck)
```

### 8C. Test Output Format
```json
{
  "testRun": "2026-04-12T10:00:00Z",
  "totalBattles": 1000,
  "completed": 997,
  "errors": 3,
  "avgTurns": 8.4,
  "maxTurns": 47,
  "infiniteLoops": 0,
  "winRateDistribution": { "team1": 52.1, "team2": 47.9 },
  "anomalies": [
    { "battle": 42, "turn": 5, "type": "negative_damage", "details": "..." },
    { "battle": 103, "turn": 12, "type": "hp_overflow", "details": "..." }
  ],
  "buildValidation": {
    "total": 16743,
    "valid": 16529,
    "invalidEvs": 214,
    "missingSpecies": 150,
    "missingMoves": 12
  }
}
```

### 8D. Regression Test Suite
After each fix, add a specific regression test:
```javascript
// Example regression tests
test("Knock Off removes item", () => {
    let attacker = buildPokemon("Weavile", build1);
    let defender = buildPokemon("Blissey", build2);
    defender.item = "Leftovers";
    performAction(true, knockOffMove);
    assert(defender.item === null);
    assert(defender.knockedOff === true);
});

test("Life Orb recoil applies", () => {
    let attacker = buildPokemon("Gengar", build);
    attacker.item = "Life Orb";
    let hpBefore = attacker.currentHp;
    performAction(true, shadowBallMove);
    let expectedRecoil = Math.floor(attacker.baseMaxHp / 10);
    assert(attacker.currentHp === hpBefore - expectedRecoil);
});
```

---

## 11. Appendix: Function Reference

### Damage Formula (VGC Lv50)
```
damage = floor(floor(floor(22 * basePower * (A/D)) / 50 + 2) * modifier)
modifier = crit * weather * STAB * effectiveness * item * ability * burn * screen * other * random(0.85-1.0)
```

### Stat Calculation (Lv50)
```
HP = floor((2*base + IV + floor(EV/4)) * 50/100) + 60
Other = floor((floor((2*base + IV + floor(EV/4)) * 50/100) + 5) * nature)
```

### Stage Multiplier
```
Positive: (2 + stage) / 2  →  +1=1.5, +2=2.0, +3=2.5, +4=3.0, +5=3.5, +6=4.0
Negative: 2 / (2 + |stage|) →  -1=0.67, -2=0.5, -3=0.4, -4=0.33, -5=0.29, -6=0.25
```

### Accuracy Formula
```
finalAcc = moveAcc * accMod * evaMod * stageMultiplier
stageMultiplier (acc): (3 + stage) / 3
stageMultiplier (eva): 3 / (3 + stage)
```

### Priority Brackets (High to Low)
```
+5: Helping Hand
+4: Max Guard, Protect (after Custap)
+3: Fake Out, Quick Guard, Wide Guard
+2: Extreme Speed, Feint, First Impression, Accelerock
+1: Aqua Jet, Bullet Punch, Ice Shard, Mach Punch, Shadow Sneak, Sucker Punch, Water Shuriken, Grassy Glide (in Grassy Terrain)
+1: Prankster status moves (blocked vs Dark)
 0: Most moves
-1: Vital Throw
-3: Focus Punch
-5: Trick Room (priority to USE, not to ACT under it)
-6: Dragon Tail, Circle Throw, Roar, Whirlwind
-7: Counter, Mirror Coat
```

### Type Chart Quick Reference
```
Immune: Normal→Ghost, Electric→Ground, Ground→Flying, Ghost→Normal, 
        Fighting→Ghost, Poison→Steel, Psychic→Dark, Dragon→Fairy
```

---

## Implementation Priority Order

1. **Phase 1** (Critical Bugs) - Fix game-breaking issues first
2. **Phase 8A** (Test Script) - Build testing infra to validate all future changes
3. **Phase 2A** (Move Mechanics) - Complete move implementation
4. **Phase 2B** (Abilities) - Implement missing abilities
5. **Phase 2C** (Items) - Implement missing item effects
6. **Phase 3** (Data Integrity) - Fix build data
7. **Phase 4** (AI) - Improve AI decision-making
8. **Phase 5** (Game Flow) - Fix gauntlet and flow issues
9. **Phase 6** (Code Quality) - Structural improvements
10. **Phase 7** (Visual) - UI polish

---

*This plan is designed for incremental implementation. Each phase can be developed and tested independently. The automated test infrastructure (Phase 8) should be built early to validate all subsequent changes.*
