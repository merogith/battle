# Pokemon Battle Engine - Bug Fix & Implementation Plan

> **Created:** 2026-04-11
> **Engine:** `battle.html` (~7,340 lines, single-file client-side battle simulator)
> **Data:** `data/moves.json`, `data/abilities.json`, `data/items.json`, `data/baseStats.json`, `data/species.json`

---

## Table of Contents

1. [BUG-01: Super Fang & Variable Damage Moves](#bug-01-super-fang--variable-damage-moves)
2. [BUG-02: Perish Song & Delayed KO Moves](#bug-02-perish-song--delayed-ko-moves)
3. [BUG-03: Substitute Mechanic](#bug-03-substitute-mechanic)
4. [BUG-04: Disable & Move-Locking Status Moves](#bug-04-disable--move-locking-status-moves)
5. [BUG-05: Explosion & Self-KO Moves](#bug-05-explosion--self-ko-moves)
6. [BUG-06: Foul Play & Stat-Referencing Moves](#bug-06-foul-play--stat-referencing-moves)
7. [BUG-07: Gyro Ball & Speed-Based Damage Moves](#bug-07-gyro-ball--speed-based-damage-moves)
8. [BUG-08: Z-Crystal Assignment & Build Validation](#bug-08-z-crystal-assignment--build-validation)
9. [BUG-09: Z-Move Engine Overhaul](#bug-09-z-move-engine-overhaul)
10. [BUG-10: Rapid Spin & Hazard/Status Removal](#bug-10-rapid-spin--hazardstatus-removal)
11. [BUG-11: KO-Related Effect Resolution & Game Stalls](#bug-11-ko-related-effect-resolution--game-stalls)
12. [BUG-12: Gender Mechanic Implementation](#bug-12-gender-mechanic-implementation)
13. [BUG-13: Yawn & Delayed-Effect Moves](#bug-13-yawn--delayed-effect-moves)
14. [BUG-14: Max Move Power Scaling & Return/Frustration](#bug-14-max-move-power-scaling--returnfrustration)
15. [BUG-15: Duplicate Moves in Movesets](#bug-15-duplicate-moves-in-movesets)
16. [BUG-16: Assault Vest Validation](#bug-16-assault-vest-validation)
17. [BUG-17: Null Items in Builds & Draft Cards](#bug-17-null-items-in-builds--draft-cards)
18. [BUG-18: Psycho Shift & Status Transfer Moves](#bug-18-psycho-shift--status-transfer-moves)
19. [BUG-19: Stat-Based Damage Calculations (Body Press, etc.)](#bug-19-stat-based-damage-calculations-body-press-etc)
20. [BUG-20: Z-Move Summary Page Display](#bug-20-z-move-summary-page-display)
21. [BUG-21: Weather/Terrain Persistence After Ability-Mon KO](#bug-21-weatherterrain-persistence-after-ability-mon-ko)
22. [BUG-22: Priority Tooltips for Moves](#bug-22-priority-tooltips-for-moves)
23. [BUG-23: Arceus/Multitype & Forced Type Handling](#bug-23-arceusmultitype--forced-type-handling)
24. [BUG-24: Multi-Turn Move PP & Recharge Handling](#bug-24-multi-turn-move-pp--recharge-handling)
25. [BUG-25: Gauntlet State Reset - Ditto Transform & Knocked Items](#bug-25-gauntlet-state-reset---ditto-transform--knocked-items)

---

## BUG-01: Super Fang & Variable Damage Moves

**Priority:** High | **Category:** Damage Calculation

### Problem
Super Fang should deal damage equal to 50% of the target's **current HP**, not use standard damage formula. Other variable-damage moves may also be incorrectly calculated.

### Affected Moves
| Move | Correct Behavior |
|------|-----------------|
| Super Fang | 50% of target's current HP |
| Seismic Toss | Damage = user's level (always 50 in this engine) |
| Night Shade | Damage = user's level (always 50) |
| Dragon Rage | Always 40 HP fixed damage |
| Sonic Boom | Always 20 HP fixed damage |
| Endeavor | Reduces target HP to match user's current HP |
| Final Gambit | Deals damage = user's current HP, user faints |
| Nature's Madness | 50% of target's current HP |
| Guardian of Alola | 75% of target's current HP |
| Counter | 2x physical damage received this turn |
| Mirror Coat | 2x special damage received this turn |
| Metal Burst | 1.5x last damage received |
| Psywave | Random damage between 50-150% of user's level |

### Investigation Steps
1. Search `performAction` and `parseMoveEffects` for each move name
2. Check if damage bypasses standard formula in `calculateDamage` (lines ~5663-5810)
3. Verify Super Fang uses `defender.hp` not `defender.maxHp`
4. Check that these moves still interact correctly with: Substitute, Protect, type immunities (Normal on Ghost for Endeavor), Dynamax HP

### VGC Rules
- Super Fang/Nature's Madness deal exactly `floor(target.currentHP / 2)` damage
- They ARE affected by type immunities (Super Fang = Normal type, blocked by Ghost)
- They ARE affected by Protect (blocked entirely)
- They DO hit through Substitute (damage goes to sub HP)
- Dynamax: Super Fang uses Dynamaxed HP for calculation

### Files to Modify
- `battle.html`: `performAction()` (~line 4774), damage calculation section (~line 5663)

---

## BUG-02: Perish Song & Delayed KO Moves

**Priority:** High | **Category:** Status Effects / Turn Counting

### Problem
Perish Song appears to KO faster than it should. In VGC, Perish Song takes **3 full turns** after use before fainting (counter: 3 -> 2 -> 1 -> 0 = faint on 4th end-of-turn).

### Affected Moves & Mechanics
| Move/Effect | Correct Timer |
|-------------|--------------|
| Perish Song | 3 turns after use (count 3->2->1->0=KO) |
| Future Sight | Hits 2 turns later |
| Doom Desire | Hits 2 turns later |
| Wish | Heals at end of NEXT turn (2 turn delay) |

### Investigation Steps
1. Find Perish Song implementation in `parseMoveEffects` (~line 6453+)
2. Check `volatile.perish` or similar counter - verify initial value is 3
3. Check `endOfTurnEffects` (~line 6963) - verify countdown happens AFTER other end-of-turn effects
4. Check `clearVolatileOnSwitch` (~line 6312) - verify perish count is cleared on switch (it should be per VGC rules)
5. Verify Future Sight / Doom Desire delayed attack storage and execution timing

### VGC Rules
- Perish Song: Affects ALL Pokemon on field. Counter starts at 3. Decrements at end of each turn. KO at 0. Switching out resets counter.
- Switching out is the intended counterplay
- If both Pokemon faint to Perish Song on same turn, the player whose Pokemon was faster loses (speed determines who "faints first")

### Files to Modify
- `battle.html`: `parseMoveEffects()` (Perish Song init), `endOfTurnEffects()` (countdown logic), `checkFaints()` (simultaneous faint ordering)

---

## BUG-03: Substitute Mechanic

**Priority:** High | **Category:** Core Mechanic

### Problem
Substitute may not be correctly protecting against status conditions. Need comprehensive audit against VGC rules.

### Current Implementation (lines 6563-6567)
- Costs 1/4 max HP
- Creates sub with that HP value stored in `mon.volatile.sub`
- Sound moves bypass (line 5179-5188)
- Infiltrator bypasses (line 5756-5757)

### VGC Rules - What Substitute SHOULD Block
| Blocked | Not Blocked |
|---------|-------------|
| All damaging moves (absorbed by sub) | Sound-based moves (Hyper Voice, Bug Buzz, etc.) |
| Status moves targeting user (Thunder Wave, Toxic, Will-O-Wisp) | Self-targeting moves (Swords Dance, etc.) |
| Stat-lowering effects from moves (Intimidate on switch does NOT bypass) | Weather/terrain damage |
| Secondary effects of damaging moves (burn chance from Flamethrower) | Status from own moves (Rest, Curse ghost-type) |
| Leech Seed | Entry hazard damage |
| Yawn | Perish Song (sound-based, affects all) |
| Swagger/Flatter (status part) | Haze (resets all stats regardless) |
| Mean Look/Block (trapping) | Whirlwind/Roar (phazing) |

### What SHOULD Bypass Substitute
- Sound moves: Hyper Voice, Bug Buzz, Boomburst, Clanging Scales, Disarming Voice, Echoed Voice, Overdrive, Relic Song, Round, Snarl, Sparkling Aria, Uproar, etc.
- Infiltrator ability
- Transform (copies target even behind sub)

### Investigation Steps
1. Read Substitute creation logic (line 6563)
2. Trace all status application paths - verify `mon.volatile.sub > 0` check exists before applying status
3. Check `applyStatus()` (line 6869) for sub check
4. Check `parseMoveEffects()` for secondary effect sub checks
5. Verify Intimidate interaction (should be blocked by sub in Gen 8+ VGC)
6. Test: Thunder Wave, Toxic, Will-O-Wisp, Leech Seed, Yawn, Confuse Ray through substitute

### Files to Modify
- `battle.html`: `applyStatus()`, `parseMoveEffects()`, `changeStage()` (for Intimidate), all status move handlers

---

## BUG-04: Disable & Move-Locking Status Moves

**Priority:** Medium | **Category:** Status Moves

### Problem
Disable is not working. Need to investigate the implementation and similar move-restriction mechanics.

### Affected Moves
| Move | VGC Effect |
|------|-----------|
| Disable | Blocks target's last used move for 4 turns |
| Torment | Target cannot use same move twice in a row |
| Imprison | Opponents cannot use any move the user also knows |
| Heal Block | Target cannot use healing moves for 5 turns |
| Throat Chop | Target cannot use sound-based moves for 2 turns |
| Taunt | Target cannot use status moves for 3 turns (already implemented ~line 6606) |
| Encore | Forces target to repeat last move for 3 turns (already implemented ~line 6611) |

### Investigation Steps
1. Find Disable in `parseMoveEffects` (~line 6683-6688) - check if `volatile.disabled` is set correctly
2. Check move selection UI - does it grey out / prevent selection of disabled moves?
3. Check `playTurn` (~line 4524) - is there a check preventing use of disabled/tormented/imprisoned moves?
4. If Disable sets a move name, verify it matches exactly (case sensitivity, spaces)
5. Check if Disable clears on switch (it should per VGC rules)
6. Investigate Torment, Imprison, Heal Block, Throat Chop - are they implemented at all?

### VGC Rules
- Disable: Lasts 4 turns. Blocks specific move. Clears on switch. Fails if target hasn't used a move yet.
- Torment: Prevents consecutive use of same move. Clears on switch.
- Encore: 3 turns. If encored move runs out of PP, Encore ends and Struggle is used.
- Taunt: 3 turns. Status moves fail. Pokemon forced to use damaging moves or Struggle.

### Files to Modify
- `battle.html`: `parseMoveEffects()` (Disable handler), move selection logic in UI, `playTurn()` (move validation), `clearVolatileOnSwitch()`

---

## BUG-05: Explosion & Self-KO Moves

**Priority:** High | **Category:** Move Execution

### Problem
Explosion is not working. Self-Destruct needs checking too.

### Affected Moves
| Move | Power | Effect |
|------|-------|--------|
| Explosion | 250 | User faints, deals massive damage |
| Self-Destruct | 200 | User faints, deals damage |
| Misty Explosion | 100 (150 in Misty Terrain) | User faints, boosted in Misty Terrain |
| Memento | -- | User faints, target -2 Atk, -2 SpA |
| Healing Wish | -- | User faints, next switch-in fully healed |
| Lunar Dance | -- | User faints, next switch-in fully healed + PP restored |
| Final Gambit | -- | User faints, damage = user's HP |

### Investigation Steps
1. Search for "Explosion" and "Self-Destruct" in `performAction` and `parseMoveEffects`
2. Check if user fainting is processed AFTER damage is dealt (order matters)
3. Verify the move doesn't get blocked by something unexpected (Damp ability should block Explosion/Self-Destruct)
4. Check interaction with Protect (should be fully blocked)
5. Check interaction with Ghost types (Explosion is Normal-type, should not affect Ghost)
6. Check if `checkFaints()` handles the user fainting correctly after self-KO moves
7. Verify Dynamax interaction: Explosion/Self-Destruct CANNOT be used while Dynamaxed (Max Guard replaces)

### VGC Rules
- User faints immediately after move resolves
- If target also faints, the attacking player (who used Explosion) loses if it causes simultaneous KO and determines the match outcome
- Damp ability (on field) prevents Explosion/Self-Destruct from being used
- Ghost types are immune (Normal-type move)

### Files to Modify
- `battle.html`: `performAction()`, `parseMoveEffects()`, `checkFaints()`, possibly move selection (Damp check)

---

## BUG-06: Foul Play & Stat-Referencing Moves

**Priority:** High | **Category:** Damage Calculation

### Problem
Foul Play uses the **target's** Attack stat for damage calculation instead of the user's. Need to verify this and similar moves work correctly.

### Affected Moves
| Move | Stat Used | Notes |
|------|----------|-------|
| Foul Play | Target's Attack | Uses target's Atk + stat stages for damage, user's other stats |
| Body Press | User's Defense | Uses user's Def instead of Atk for physical damage |
| Psyshock / Psystrike / Secret Sword | User's SpA vs Target's Def | Special move that targets physical defense |
| Photon Geyser | Higher of user's Atk/SpA | Category changes based on higher stat |
| Shell Side Arm | Calculates both, uses better | Physical or Special depending on which deals more |

### Investigation Steps
1. Search for "Foul Play" in damage calculation (~line 5663-5810)
2. Check if there's special stat substitution logic
3. Verify Body Press uses `attacker.stats.def` instead of `attacker.stats.atk`
4. For all these moves: do stat stages (boosts/drops) apply to the substituted stat correctly?
   - Foul Play with +6 Atk target should deal massive damage
   - Body Press with +3 Def from Iron Defense should use boosted Def
5. Check Unaware interaction: Foul Play + Unaware should ignore target's Atk boosts

### VGC Rules
- Foul Play: `damage = formula(targetAtk * attackerLevel, targetDef, moveBP)` - uses target's raw Atk stat AND target's Atk stat stages
- Body Press: Uses user's Defense stat (including stat stage changes) in place of Attack
- Psyshock/Psystrike: Move is Special category but damage uses defender's physical Defense stat
- Stat stages ARE included unless Unaware is in play

### Files to Modify
- `battle.html`: Damage calculation function (~line 5663), stat selection logic

---

## BUG-07: Gyro Ball & Speed-Based Damage Moves

**Priority:** Medium | **Category:** Damage Calculation

### Problem
Gyro Ball may not calculate power correctly. Power formula: `min(150, floor(25 * targetSpeed / userSpeed))`.

### Affected Moves
| Move | Power Formula |
|------|--------------|
| Gyro Ball | `min(150, floor(25 * target.speed / user.speed))` |
| Electro Ball | Based on speed ratio (user faster = more power) |
| Grass Knot / Low Kick | Based on target's weight |
| Heavy Slam / Heat Crash | Based on weight ratio (user heavier = more power) |
| Stored Power | 20 + 20 per positive stat stage |
| Punishment | 60 + 20 per positive stat stage of target |
| Reversal / Flail | More power at lower HP |
| Eruption / Water Spout | `floor(150 * currentHP / maxHP)` |
| Crush Grip / Wring Out | Based on target's remaining HP% |
| Return | `floor(max(1, friendship * 2/5))` - typically 102 at max friendship |
| Frustration | `floor(max(1, (255 - friendship) * 2/5))` |

### Investigation Steps
1. Search for "Gyro Ball" in `performAction` or damage calculation
2. Check if speed stat used includes stat stages, paralysis halving, Choice Scarf, Trick Room (Trick Room does NOT change Gyro Ball calc - still uses raw speed values)
3. Verify Electro Ball power tiers: >=4x speed = 150BP, >=3x = 120, >=2x = 80, else 60
4. Check Return/Frustration - if friendship isn't tracked, these should use assumed max (Return = 102 BP)
5. Verify weight-based moves have weight data available

### VGC Rules
- Gyro Ball: Uses actual Speed stats including all modifiers (stat stages, items, abilities, paralysis) but NOT Trick Room
- Trick Room only reverses turn order, doesn't change Speed values
- These moves should all use their variable power in Max Move power calculation too

### Files to Modify
- `battle.html`: Power calculation section in `performAction()`, possibly need weight data from `baseStats.json` or `species.json`

---

## BUG-08: Z-Crystal Assignment & Build Validation

**Priority:** High | **Category:** Build System

### Problem
Pikanium Z says it replaces Volt Tackle but the build doesn't have Volt Tackle. Signature Z-Crystals are being assigned without validating the required move exists.

### Signature Z-Crystals & Required Moves
| Z-Crystal | Pokemon | Required Move |
|-----------|---------|--------------|
| Pikanium Z | Pikachu | Volt Tackle |
| Aloraichium Z | Alolan Raichu | Thunderbolt |
| Eevium Z | Eevee | Last Resort |
| Snorlium Z | Snorlax | Giga Impact |
| Mewnium Z | Mew | Psychic |
| Decidium Z | Decidueye | Spirit Shackle |
| Incinium Z | Incineroar | Darkest Lariat |
| Primarium Z | Primarina | Sparkling Aria |
| Tapunium Z | Tapus | Nature's Madness |
| Marshadium Z | Marshadow | Spectral Thief |
| Lycanium Z | Lycanroc | Stone Edge |
| Mimikium Z | Mimikyu | Play Rough |
| Kommonium Z | Kommo-o | Clanging Scales |
| Lunalium Z | Lunala/Necrozma-DW | Moongeist Beam |
| Solganium Z | Solgaleo/Necrozma-DM | Sunsteel Strike |
| Ultranecrozium Z | Ultra Necrozma | Photon Geyser |
| Pikashunium Z | Pikachu-Cap | Thunderbolt |

### Investigation Steps
1. Read `SIGNATURE_Z` and `SIGNATURE_Z_REQUIRED_MOVE` maps (~line 1960-1984)
2. In `assignGimmickToBuild` (~line 1953), check if required move injection works
3. Trace the flow: Does it check if the required move is in the moveset? Does it inject it if missing?
4. If it injects: which move does it replace? Is the replacement logic sound?
5. Check `validateGimmick` (~line 1991) - does Z validation check that the crystal matches a move?

### Fix Approach
1. In `assignGimmickToBuild`: Before assigning signature Z, check if required move exists in moveset
2. If not: either inject the required move (replacing weakest/least useful move) OR fall back to type-based Z-Crystal
3. In `validateGimmick`: Add check that signature Z has its required move

### Files to Modify
- `battle.html`: `assignGimmickToBuild()` (~line 1953), `validateGimmick()` (~line 1991), possibly `makeBuild()` (~line 1606)

---

## BUG-09: Z-Move Engine Overhaul

**Priority:** High | **Category:** Gimmick System

### Problem
Z-Move item and move assignment needs comprehensive review for competitive VGC accuracy and player fun.

### Issues to Address
1. **Type matching**: Z-Crystal type must match at least one damaging move's type
2. **Status Z-Moves**: Status moves + Z-Crystal = stat boost + original effect. Verify boost table completeness
3. **Z-Move power scaling**: Verify power table (lines 2628-2634) matches official VGC values
4. **Z-Move names**: Each type has specific Z-Move name (e.g., Inferno Overdrive for Fire)
5. **Z-Protect interaction**: Z-Moves should deal 25% damage through Protect
6. **One-per-battle**: Verify `state.usedZ` flag works correctly for both sides

### Z-Move Power Table (Official)
| Original BP | Z-Move BP |
|-------------|-----------|
| 0-55 | 100 |
| 60-65 | 120 |
| 70-75 | 140 |
| 80-85 | 160 |
| 90-95 | 175 |
| 100 | 180 |
| 110 | 185 |
| 120-125 | 190 |
| 130 | 195 |
| 140+ | 200 |

### Investigation Steps
1. Audit `buildZMove()` (~line 2792-2886) for correct power, names, types
2. Check Z-Status boost table completeness - every status move should have a Z-effect
3. Verify Z activation UI shows correct move names and descriptions
4. Check that Z-Move inherits the original move's type (not the crystal's type for signature Z's)
5. Test: Can player accidentally use Z on wrong move? Is UI clear?

### Files to Modify
- `battle.html`: `buildZMove()`, `assignGimmickToBuild()`, Z activation UI, tooltip rendering

---

## BUG-10: Rapid Spin & Hazard/Status Removal

**Priority:** Medium | **Category:** Move Effects

### Problem
Unclear if Rapid Spin removes Taunt, Encore, Leech Seed, etc. Need to match VGC mechanics exactly.

### Rapid Spin VGC Effects (Gen 8+)
- Removes from user's side: Stealth Rock, Spikes, Toxic Spikes, Sticky Web
- Removes from user: Leech Seed, Bind/Wrap/partial trapping
- Grants user: +1 Speed (Gen 8+)
- Does NOT remove: Taunt, Encore, Disable, or any other volatile status

### Related Hazard Removal Moves
| Move | Removes | Side |
|------|---------|------|
| Rapid Spin | Entry hazards + Leech Seed + trapping on user | User's side |
| Defog | ALL entry hazards on BOTH sides + screens on target's side | Both sides |
| Court Change | Swaps all entry hazards between sides | Both sides |
| Mortal Spin | Same as Rapid Spin + poisons all opponents | User's side |
| Tidy Up | Removes all entry hazards + substitutes from both sides | Both sides |

### Investigation Steps
1. Search for "Rapid Spin" in `parseMoveEffects`
2. Verify it only removes what it should (hazards + leech seed + trapping)
3. Check Defog implementation - should remove hazards from BOTH sides
4. Check if Gen 8+ Speed boost is applied for Rapid Spin
5. Verify Ghost types block Rapid Spin (it's Normal-type, should miss Ghost)

### Files to Modify
- `battle.html`: `parseMoveEffects()` (Rapid Spin handler, Defog handler)

---

## BUG-11: KO-Related Effect Resolution & Game Stalls

**Priority:** Critical | **Category:** Core Game Loop

### Problem
Multiple issues when Pokemon are KO'd:
1. U-turn fails to switch when it KOs the enemy
2. Whirlwind + Spikes causing double KO leads to game stuck state
3. Dynamax animation persisting after KO
4. General: post-KO effect resolution (abilities, items, moves) is fragile

### Known Scenarios
| Scenario | Expected | Actual |
|----------|----------|--------|
| U-turn KOs enemy | Attacker switches out, defender sends in next | Switch fails |
| Spikes x3 + Whirlwind on both sides | Forced switches, hazard damage | Both die, game stuck |
| Dynamax mon KO'd | Revert to normal sprite/size | Dynamax animation persists |
| Contact ability triggers on KO | Should still trigger (e.g., Rough Skin) | Unknown |
| Destiny Bond + KO | Both faint | Unknown |

### Investigation Steps
1. Read `checkFaints()` (~line 6058-6180) thoroughly - understand faint ordering
2. In U-turn/Volt Switch handler: check if switch logic runs AFTER KO check
3. Check Whirlwind/Roar: what happens if forced switch-in faints to hazards?
4. In `deactivateDynamax()` (~line 2737): check if it's called on KO
5. Search for all `mon.hp <= 0` checks - are they consistently handled?
6. Check: does the game properly handle "no Pokemon left to switch in" scenarios?

### Root Cause Analysis Needed
The core issue is likely that effect resolution after KO doesn't have a consistent pipeline:
1. Move deals damage -> 2. Check KO -> 3. Apply post-move effects -> 4. Handle switches
If step 2 KOs but step 3 still runs (or step 4 runs before step 2), bugs occur.

### Fix Approach
Implement a robust post-action resolution order:
1. Deal damage
2. Check if defender fainted -> if yes, mark as fainted, trigger Destiny Bond, Aftermath
3. Check if attacker fainted (recoil, Life Orb, self-KO) -> mark as fainted
4. If attacker alive AND move has switch effect (U-turn, Volt Switch, Flip Turn) -> execute switch
5. If defender fainted -> prompt for replacement
6. Deactivate Dynamax on any fainted Pokemon
7. Check win/loss conditions

### Files to Modify
- `battle.html`: `performAction()`, `checkFaints()`, `playTurn()`, `deactivateDynamax()`, switch handlers

---

## BUG-12: Gender Mechanic Implementation

**Priority:** Medium | **Category:** New Feature

### Problem
No gender mechanic exists. Needed for Rivalry, Attract, Cute Charm, and gender-specific interactions.

### Affected Mechanics
| Mechanic | Gender Effect |
|----------|--------------|
| Rivalry (ability) | +25% damage to same gender, -25% to opposite gender, neutral if genderless |
| Attract (move) | Target can't attack 50% of the time. Only works on opposite gender |
| Cute Charm (ability) | 30% chance to infatuate on contact. Only opposite gender |
| Captivate (move) | -2 SpA. Only works on opposite gender |

### Implementation Plan
1. **Gender Assignment**: When a Pokemon is built (`buildPokemon` ~line 2520):
   - Check species data for gender ratio (some are always male, always female, or genderless)
   - If species has gender ratio: 50/50 coin flip for male/female
   - Genderless Pokemon: Assign `null` gender
   - Store as `mon.gender = "M" | "F" | null`
2. **Persistence**: Gender must persist across gauntlet rounds
   - Store gender in base build data
   - Restore on `nextGauntletRound()` rebuild
3. **Attract implementation**: Add `volatile.infatuated` flag, 50% chance to skip turn
4. **Rivalry implementation**: In damage calc, apply 1.25x or 0.75x multiplier based on gender match
5. **UI**: Optionally show gender icon on Pokemon info (small M/F symbol)

### VGC Rules
- Gender ratios are per-species (from `species.json` or `baseStats.json`)
- Genderless Pokemon cannot be attracted or attract
- Oblivious ability blocks Attract and Intimidate

### Files to Modify
- `battle.html`: `buildPokemon()`, `performAction()` (damage calc for Rivalry), `parseMoveEffects()` (Attract/Captivate), `endOfTurnEffects()`, UI rendering
- `data/species.json` or `data/baseStats.json`: Verify gender ratio data exists

---

## BUG-13: Yawn & Delayed-Effect Moves

**Priority:** High | **Category:** Turn Counting

### Problem
Yawn instantly puts target to sleep instead of waiting 1 turn.

### Delayed-Effect Moves to Audit
| Move/Effect | Timing | Current Behavior |
|-------------|--------|-----------------|
| Yawn | Sleep at END of NEXT turn | Instant sleep (BUG) |
| Perish Song | KO after 3 turns | May be too fast (see BUG-02) |
| Future Sight | Hits 2 turns later | Unknown |
| Doom Desire | Hits 2 turns later | Unknown |
| Wish | Heals end of next turn | Seems working (lines 6621-6627) |
| Ingrain | Heals 1/16 per turn | Unknown |
| Aqua Ring | Heals 1/16 per turn | Unknown |
| Curse (Ghost) | -1/4 HP per turn | Unknown |
| Nightmare | -1/4 HP per turn while asleep | Unknown |
| Leech Seed | -1/8 HP per turn, heals user | Implemented |

### Investigation Steps
1. Search for "Yawn" in `parseMoveEffects`
2. Check if there's a `volatile.yawn` counter that counts down
3. Correct implementation: Turn 1 = Yawn applied (`volatile.yawnTurns = 1`), End of Turn 2 = fall asleep
4. Check if Yawn is blocked by: already having a status, Substitute, Electric Terrain (prevents sleep), Vital Spirit/Insomnia, Safeguard
5. Audit all delayed effects to verify correct turn counting

### VGC Rules
- Yawn: Target becomes drowsy. At end of the NEXT turn, target falls asleep (unless switched out, already statused, or in Electric/Misty Terrain)
- Electric Terrain: Prevents sleep for grounded Pokemon
- Misty Terrain: Prevents all status for grounded Pokemon
- If target switches out after being Yawned, effect is lost

### Files to Modify
- `battle.html`: `parseMoveEffects()` (Yawn handler), `endOfTurnEffects()` (Yawn countdown + sleep application)

---

## BUG-14: Max Move Power Scaling & Return/Frustration

**Priority:** High | **Category:** Dynamax System

### Problem
Multiple Max Move issues:
1. Max Steelspike doing 0 damage
2. Max Knuckle showing different tooltips in different places
3. Return (and similar variable-power moves) has 0 base power in data, causing Max Move to use wrong power tier
4. General Max Move power scaling may be buggy

### Root Cause Analysis
Return's base power in `moves.json` is likely 0 or undefined because it depends on friendship (not stored). When converting to Max Move, `buildMaxMove()` (~line 2887) reads the base power and maps to Max Move power tier. 0 BP maps to 0 damage (status move tier).

### Max Move Power Table (Official)
| Original BP | Max Move BP |
|-------------|------------|
| 0 (Status) | 0 (Max Guard) |
| 1-40 | 90 |
| 41-50 | 100 |
| 51-60 | 110 |
| 61-70 | 120 |
| 71-80 | 130 |
| 81-90 | 130 |
| 91-100 | 130 |
| 101-110 | 140 |
| 111-120 | 140 |
| 121-130 | 140 |
| 131-140 | 150 |
| 141+ | 150 |

**Note:** Fighting and Poison Max Moves use a DIFFERENT table with generally lower values.

### Variable-Power Moves Needing Fixed BP for Max Conversion
| Move | Assumed BP for Max |
|------|-------------------|
| Return | 102 (max friendship) |
| Frustration | 102 (min friendship) |
| Gyro Ball | 150 (cap) |
| Electro Ball | 130 (assume fast) |
| Flail / Reversal | 200 (low HP) |
| Eruption / Water Spout | 150 (full HP) |
| Grass Knot / Low Kick | 120 (assume heavy target) |
| Heavy Slam / Heat Crash | 120 (assume heavier user) |
| Stored Power / Power Trip | 160 (assume some boosts) |

### Fix Approach
**Option A (Recommended - VGC Accurate):** For variable-power moves, use the move's assumed/max BP for Max Move conversion. Return = 102 BP -> Max Strike 130 BP.

**Option B (Simple Fallback):** Set all variable-power physical/special moves to 130 BP baseline for Max Move conversion.

### Investigation Steps
1. Read `buildMaxMove()` (~line 2887-3003) - check power table used
2. Check Max Steelspike specifically - is it a naming issue or damage issue?
3. Check tooltip rendering for Max Knuckle - find all tooltip generation code
4. Check how Return's BP is resolved before Max conversion
5. Verify all Max Move secondary effects (stat changes, weather, terrain) work

### Files to Modify
- `battle.html`: `buildMaxMove()`, `performAction()` (variable power resolution), tooltip rendering code

---

## BUG-15: Duplicate Moves in Movesets

**Priority:** Low | **Category:** Build System

### Problem
Some Pokemon have 2 copies of the same move in their moveset.

### Investigation Steps
1. Check `makeBuild()` (~line 1606) - is there deduplication logic?
2. Check CSV/JSON build data - are duplicates in the source data?
3. Check move injection logic (weather setter, Z-required move, Tera Blast) - could it inject a move that already exists?

### Fix
Add deduplication in `buildPokemon()` or `makeBuild()`:
```javascript
// After move assignment, deduplicate
const seen = new Set();
build.m = build.m.map(m => {
    if (seen.has(m)) return null; // or pick alternative move
    seen.add(m);
    return m;
});
```

### Files to Modify
- `battle.html`: `makeBuild()`, `buildPokemon()`

---

## BUG-16: Assault Vest Validation

**Priority:** Low | **Category:** Items

### Problem
Need to verify Assault Vest works correctly.

### VGC Rules
- +50% Special Defense
- Cannot use status moves (only damaging moves allowed)
- If all 4 moves are status, Pokemon is forced to use Struggle

### Investigation Steps
1. Search for "Assault Vest" in damage calc and move selection
2. Verify SpD boost is applied (+50%, or 1.5x multiplier to SpD stat)
3. Verify status moves are blocked in move selection UI
4. Check if AI correctly handles Assault Vest (doesn't try to use status moves)
5. Verify Assault Vest doesn't prevent Max Guard (Max Guard is a status-type Max Move - in VGC it IS allowed with Assault Vest during Dynamax)

### Files to Modify
- `battle.html`: Damage calculation (SpD check), move selection logic, AI move selection

---

## BUG-17: Null Items in Builds & Draft Cards

**Priority:** Medium | **Category:** Build System / UI

### Problem
Some Pokemon show `null` as their item in draft cards, but then use an actual item (e.g., Sitrus Berry) in battle. The item display and item assignment are desynchronized.

### Investigation Steps
1. Check `makeBuild()` - trace item assignment from CSV/JSON data
2. Check if any code path sets `build.i = null` or fails to assign
3. Check `buildPokemon()` (~line 2520) - how item is read from build
4. Check draft card rendering - how item is displayed (does it read from build or from mon object?)
5. Check for race conditions: is the build modified after draft card rendering?
6. Look for cases where item is conditionally assigned (gimmick sanitization at lines 1654-1659 might null out items)

### Potential Causes
1. Gimmick sanitization removing item but not replacing with Leftovers
2. CSV/JSON data having empty item field
3. Item field being overwritten during gimmick assignment
4. Draft card reading stale build data

### Files to Modify
- `battle.html`: `makeBuild()`, `buildPokemon()`, draft card rendering, gimmick sanitization

---

## BUG-18: Psycho Shift & Status Transfer Moves

**Priority:** Low | **Category:** Move Effects

### Problem
Psycho Shift may not be working correctly.

### VGC Rules
- Transfers user's status condition to target
- User is cured after transfer
- Fails if target already has a status or is immune to the status
- Fails if user has no status condition

### Related Status-Transferring Mechanics
| Move/Ability | Effect |
|-------------|--------|
| Psycho Shift | Transfers user's status to target |
| Synchronize (ability) | When statused, inflicts same status on attacker |
| Rest + Sleep Talk | Self-inflicted sleep + use moves while asleep |

### Investigation Steps
1. Search for "Psycho Shift" in `parseMoveEffects`
2. Verify it checks: user has status, target has no status, target isn't immune
3. Verify it transfers the exact status (BRN/PSN/PAR/SLP/FRZ/TOX)
4. Verify user is cured after successful transfer
5. Check Synchronize ability implementation

### Files to Modify
- `battle.html`: `parseMoveEffects()` (Psycho Shift handler)

---

## BUG-19: Stat-Based Damage Calculations (Body Press, etc.)

**Priority:** High | **Category:** Damage Calculation

### Problem
Need to verify that stat-based damage moves correctly include/exclude stat stage boosts. Example: Steelix using Iron Defense x3 then Body Press should use the boosted Defense stat.

### Stat Stage Multiplier Table
| Stage | Multiplier |
|-------|-----------|
| -6 | 2/8 = 0.25 |
| -5 | 2/7 = 0.286 |
| -4 | 2/6 = 0.333 |
| -3 | 2/5 = 0.4 |
| -2 | 2/4 = 0.5 |
| -1 | 2/3 = 0.667 |
| 0 | 1.0 |
| +1 | 3/2 = 1.5 |
| +2 | 4/2 = 2.0 |
| +3 | 5/2 = 2.5 |
| +4 | 6/2 = 3.0 |
| +5 | 7/2 = 3.5 |
| +6 | 8/2 = 4.0 |

### Investigation Steps
1. In damage calc (~line 5663): how are stat stages applied? Is there a `getEffectiveStat(mon, statName)` function?
2. For Body Press: does it read `mon.stages.def` and apply to the attack value?
3. For Foul Play: does it read `defender.stages.atk` and apply correctly?
4. Verify stat stage formula: `stat * max(2, 2 + stage) / max(2, 2 - stage)`
5. Check interactions with Unaware (ignores stat stages)
6. Check interactions with Critical Hits (ignores negative stages on attacker, positive stages on defender)

### Files to Modify
- `battle.html`: Damage calculation function, stat retrieval logic

---

## BUG-20: Z-Move Summary Page Display

**Priority:** Medium | **Category:** UI

### Problem
Summary page shows incorrect Z-Move information:
1. Not all Z-Moves properly displayed
2. Non-Z-Moves sometimes appear as Z-Moves
3. Upgraded Z-Attack descriptions don't show in move descriptions
4. Z-Move effects may not even be fully implemented in battle

### Investigation Steps
1. Find summary page rendering code (likely near end-of-battle / gauntlet UI)
2. Check how moves are displayed - does it read from `mon.moves` (which may have been temporarily converted to Z-Moves)?
3. Check if Z-Move descriptions are stored anywhere
4. Verify: after Z-Move use, does the move revert to original in `mon.moves`?
5. Check if summary reads live battle state or base build data

### Fix Approach
- Summary should always show BASE moves, not temporary Z/Max transformed versions
- If showing Z-Move info: display as "Move Name -> Z-Move Name (Z-Power: X)"
- Ensure Z-Move descriptions include the Z-effect for status moves

### Files to Modify
- `battle.html`: Summary/post-battle UI rendering, move display logic

---

## BUG-21: Weather/Terrain Persistence After Ability-Mon KO

**Priority:** High | **Category:** Weather/Terrain System

### Problem
Primordial Sea (Heavy Rain) didn't end when the Pokemon with the ability was KO'd. Same issue likely affects Desolate Land (Harsh Sun) and Delta Stream.

### VGC Rules for Ability-Based Weather/Terrain
| Ability | Effect | Duration | Ends When |
|---------|--------|----------|-----------|
| Drizzle | Rain | 5 turns (or 8 with Damp Rock) | Timer expires |
| Drought | Sun | 5 turns (or 8 with Heat Rock) | Timer expires |
| Sand Stream | Sandstorm | 5 turns (or 8 with Smooth Rock) | Timer expires |
| Snow Warning | Hail/Snow | 5 turns (or 8 with Icy Rock) | Timer expires |
| Primordial Sea | Heavy Rain | Indefinite | User switches out or faints |
| Desolate Land | Harsh Sun | Indefinite | User switches out or faints |
| Delta Stream | Strong Winds | Indefinite | User switches out or faints |
| Electric Surge | Electric Terrain | 5 turns | Timer expires |
| Grassy Surge | Grassy Terrain | 5 turns | Timer expires |
| Psychic Surge | Psychic Terrain | 5 turns | Timer expires |
| Misty Surge | Misty Terrain | 5 turns | Timer expires |

### Investigation Steps
1. Search for "Primordial Sea", "Desolate Land", "Delta Stream" in ability handlers
2. Check `checkFaints()` - does it check if the fainted mon had a persistent weather ability?
3. Check switch-out logic - does it end weather when the ability-holder leaves?
4. Check if weather is tracked with its source (which mon/ability set it)
5. Verify regular weather (Drizzle, Drought) correctly uses 5-turn timer

### Fix Approach
Track weather source: `state.weatherSource = { isPlayer: bool, monIndex: int, ability: string }`
On KO or switch: check if active weather's source matches the departing Pokemon -> if yes, clear weather.

### Files to Modify
- `battle.html`: Weather setting code, `checkFaints()`, switch handling, `endOfTurnEffects()`

---

## BUG-22: Priority Tooltips for Moves

**Priority:** Low | **Category:** UI Enhancement

### Problem
Move tooltips don't show priority information. Players should see if a move is +1, +2, -1, etc. priority.

### Implementation Plan
1. Read move priority from `movesDB` (field: `pri`)
2. In tooltip rendering: append priority badge
   - `+2`: "Priority +2" (Extreme Speed)
   - `+1`: "Priority +1" (Quick Attack, Aqua Jet)
   - `0`: Don't show (default)
   - `-1`: "Priority -1" (Vital Throw)
   - `-6`: "Priority -6" (Trick Room, normally -7 in some gens)
   - `-7`: "Moves last" (Trick Room)

### Priority Reference
| Priority | Example Moves |
|----------|--------------|
| +5 | Helping Hand |
| +4 | Protect, Detect, King's Shield |
| +3 | Fake Out, Quick Guard |
| +2 | Extreme Speed, First Impression |
| +1 | Aqua Jet, Bullet Punch, Ice Shard, Mach Punch, Quick Attack, Shadow Sneak, Sucker Punch, Water Shuriken |
| 0 | Most moves |
| -1 | Vital Throw |
| -3 | Focus Punch |
| -5 | After You |
| -6 | Whirlwind, Roar, Dragon Tail, Circle Throw |
| -7 | Trick Room |

### Files to Modify
- `battle.html`: Tooltip rendering function (find where move tooltips are generated)

---

## BUG-23: Arceus/Multitype & Forced Type Handling

**Priority:** Medium | **Category:** Type System / Build System

### Problem
Arceus-Dark ended up with a Fire Z-Crystal. The build system doesn't correctly handle Pokemon whose types are tied to their items/abilities (Multitype, RKS System, etc.).

### Affected Pokemon & Mechanics
| Pokemon | Ability | Type Determined By |
|---------|---------|-------------------|
| Arceus | Multitype | Held Plate item |
| Silvally | RKS System | Held Memory item |
| Genesect | Download | Held Drive item (move type, not Pokemon type) |
| Ogerpon | Embody Aspect | Held Mask item |

### Type-Locked Moves
| Move | Expected Behavior |
|------|------------------|
| Judgment (Arceus) | Always matches Arceus's type (from Plate) |
| Multi-Attack (Silvally) | Always matches Silvally's type (from Memory) |
| Tera Blast | Matches Tera type when Terastallized |
| Techno Blast (Genesect) | Matches Drive type |
| Hidden Power | Type based on IVs (deprecated Gen 9) |

### Problem Analysis
When the build system assigns a Z-Crystal to Arceus-Dark, it replaces the Dread Plate with a Z-Crystal. This changes Arceus's type (Multitype reads the held item). But the game still shows Arceus-Dark sprite and expects Dark-type Judgment.

### Fix Approach
1. **Secret type lock**: When a form-specific Pokemon is generated (Arceus-Dark, Silvally-Water, etc.), lock their type internally regardless of item
2. **Judgment/Multi-Attack always match locked type**: Override move type to match the Pokemon's form type
3. **Allow Z-Crystal/Tera on these Pokemon**: The gimmick item replaces the plate/memory, but the type lock persists
4. **This creates fun OP scenarios**: Arceus-Dark with Z-Crystal gets Dark Judgment STAB + Z-Move power

### Implementation
```javascript
// In buildPokemon or performAction:
if (mon.ability === "Multitype" && mon.name.includes("Arceus-")) {
    mon.lockedType = mon.name.split("-")[1]; // "Dark", "Fire", etc.
}
// In move execution for Judgment:
if (move.name === "Judgment" && attacker.lockedType) {
    move.type = attacker.lockedType;
}
```

### Files to Modify
- `battle.html`: `buildPokemon()`, `performAction()` (Judgment/Multi-Attack type override), `makeBuild()` (allow gimmick items on Multitype mons)

---

## BUG-24: Multi-Turn Move PP & Recharge Handling

**Priority:** High | **Category:** Move Mechanics

### Problem
Multi-turn moves (Bounce, Fly, Outrage, Hyper Beam, etc.) have issues:
1. PP consumed on every turn instead of just the first
2. Recharge moves (Hyper Beam, Giga Impact) show Struggle instead of "recharging" state
3. Frenzy Plant shows Struggle then says "need to recharge" - works but inconsistently with VGC

### Multi-Turn Move Categories

**Charge Moves (2 turns: charge -> attack)**
| Move | Turn 1 | Turn 2 |
|------|--------|--------|
| Fly, Bounce, Dig, Dive | Semi-invulnerable | Attack |
| Solar Beam, Solar Blade | Charge (skip in Sun) | Attack |
| Phantom Force, Shadow Force | Semi-invulnerable | Attack |
| Sky Attack, Skull Bash | Charge | Attack |
| Meteor Beam | Charge (+1 SpA) | Attack |
| Geomancy | Charge (+2 SpA/SpD/Spe) | -- (status) |
| Electro Shot | Charge (+1 SpA, skip in Rain) | Attack |

**Recharge Moves (attack -> recharge)**
| Move | Turn 1 | Turn 2 |
|------|--------|--------|
| Hyper Beam, Giga Impact | Attack | Cannot move (recharge) |
| Blast Burn, Frenzy Plant, Hydro Cannon | Attack | Cannot move (recharge) |
| Prismatic Laser, Meteor Assault | Attack | Cannot move (recharge) |
| Rock Wrecker, Roar of Time | Attack | Cannot move (recharge) |

**Locking Moves (2-3 turns locked, confusion after)**
| Move | Duration | After |
|------|----------|-------|
| Outrage, Petal Dance, Thrash | 2-3 turns | Confusion |
| Raging Fury | 2-3 turns | Confusion |
| Uproar | 3 turns | No confusion, prevents sleep |
| Rollout, Ice Ball | 5 turns | Power doubles each turn |

### VGC Rules
- **PP**: Only consumed on first use. Subsequent turns of multi-turn moves do NOT consume PP
- **Charge moves**: Player selects move on Turn 1. Turn 2 auto-executes (no move selection needed)
- **Recharge moves**: Turn 2 is forced "recharging" (no move selection). NOT Struggle.
- **Locking moves**: Player selects on Turn 1. Subsequent turns auto-repeat (no selection). Random 2-3 turn duration decided on first use. After locking ends, confusion applied (except Uproar)
- **Interruption**: If the Pokemon faints or is forced to switch during a multi-turn move, the sequence ends

### Investigation Steps
1. Check charge move logic (~line 5035-5069) - verify PP deduction
2. Check recharge logic (~line 5028-5033) - verify "recharging" state vs Struggle
3. Check locking move logic (~line 4894-4900, 6717-6760) - verify PP and continuation
4. Check PP deduction point in `performAction` - should only happen on initial use
5. Verify interruption handling (faint during charge, switch during lock)

### Files to Modify
- `battle.html`: `performAction()` (PP deduction), charge/recharge/lock handlers, move selection UI (grey out during locked/recharge turns)

---

## BUG-25: Gauntlet State Reset - Ditto Transform & Knocked Items

**Priority:** Medium | **Category:** Gauntlet Mode

### Problem
After a gauntlet round:
1. Ditto's transformed state persists in draft cards (should show original Ditto)
2. Knocked-off items don't reappear in draft cards
3. Any battle-modified state should be fully reset for next round display

### Current Reset Logic (~line 7299-7337)
- Rebuilds Pokemon from base build data
- Resets HP, PP, volatile status, gimmicks, field effects
- But draft card rendering may read from stale state

### Investigation Steps
1. Check `nextGauntletRound()` - does it rebuild from original base data or from modified mon?
2. Check Ditto Transform: does it modify the base build or just volatile state?
3. Check Knock Off: does it permanently remove `mon.item` or just set a `volatile.knockedOff` flag?
4. Check draft card rendering: does it read `mon.item` or `build.i`?
5. Verify Mega Evolution reverts (Mega Stone should reappear)

### VGC Rules (for state reset between matches)
- Everything resets between matches: HP, PP, items, status, stats, form changes
- Ditto reverts to Ditto
- Knocked-off items return
- Mega Stones return
- Consumed berries return

### Fix Approach
Ensure `nextGauntletRound()` rebuilds each Pokemon completely from the stored base build:
```javascript
// Store original builds separately
state.playerBaseBuilds[i] = deepCopy(originalBuild);
// On round reset, rebuild from base
playerMons[i] = buildPokemon(baseName, deepCopy(state.playerBaseBuilds[i]));
```

### Files to Modify
- `battle.html`: `nextGauntletRound()`, draft card rendering, build storage

---

## Implementation Priority Order

### Phase 1 - Critical (Game-Breaking Bugs)
1. **BUG-11**: KO effect resolution & game stalls
2. **BUG-05**: Explosion & self-KO moves not working
3. **BUG-04**: Disable not working
4. **BUG-13**: Yawn instant sleep (wrong turn count)
5. **BUG-21**: Weather persistence after ability-mon KO

### Phase 2 - High Priority (Incorrect Mechanics)
6. **BUG-01**: Super Fang & variable damage moves
7. **BUG-02**: Perish Song timing
8. **BUG-03**: Substitute protection audit
9. **BUG-06**: Foul Play & stat-referencing moves
10. **BUG-14**: Max Move power scaling
11. **BUG-24**: Multi-turn move PP & recharge
12. **BUG-08**: Z-Crystal build validation
13. **BUG-19**: Stat-based damage with boosts

### Phase 3 - Medium Priority (Improvements)
14. **BUG-09**: Z-Move engine overhaul
15. **BUG-17**: Null items in builds
16. **BUG-23**: Arceus/Multitype type handling
17. **BUG-25**: Gauntlet state reset
18. **BUG-12**: Gender mechanic
19. **BUG-07**: Gyro Ball & speed-based moves
20. **BUG-20**: Z-Move summary page

### Phase 4 - Low Priority (Polish)
21. **BUG-22**: Priority tooltips
22. **BUG-10**: Rapid Spin removal scope
23. **BUG-15**: Duplicate moves
24. **BUG-16**: Assault Vest validation
25. **BUG-18**: Psycho Shift

---

## Testing Strategy

For each fix, test the following scenarios:
1. **Normal case**: Does the move/mechanic work as expected?
2. **Substitute interaction**: Does it correctly interact with Substitute?
3. **Protect interaction**: Is it blocked by Protect/Detect?
4. **KO interaction**: What happens if this causes/coincides with a KO?
5. **Dynamax interaction**: Does it work during Dynamax? With Max HP?
6. **AI handling**: Does the AI correctly use/respond to this mechanic?
7. **Gauntlet reset**: Does state properly reset between rounds?
