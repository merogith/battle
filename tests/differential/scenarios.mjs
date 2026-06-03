// Scenario battery for the differential battle harness.
//
// Each scenario is engine-neutral: both oracles build the same teams and run the
// same scripted choices, then diff.mjs compares the traces.
//
// `expect`:
//   'diverge' = a known/suspected in-house bug (we WANT the oracle to catch it).
//   'match'   = a HIGH-confidence sanity/regression case that must agree (a
//               failure is a false positive or a real regression — a red build).
//   'probe'   = exploratory; any result is informational. Used to MAP the
//               divergence surface across mechanics without asserting pass/fail.
//
// `noMiss: true` marks a scenario whose damaging move always connects, so a
// "one side took 0 damage" gap is treated as an immunity/absorb divergence
// (high), not accuracy RNG (low).
//
// Move/ability/item legality is not validated by either engine (Showdown uses
// gen9customgame; in-house mkMon builds arbitrary sets), so scenarios may use
// off-learnset movesets to isolate a mechanic.

// ── chassis ──────────────────────────────────────────────────────────────────
const FAST_BOOSTER = (moves) => ({
  species: 'Jolteon', ability: 'Volt Absorb', moves,
  nature: 'Jolly', evs: { spe: 252, atk: 252 }, ivs: { spe: 31 },
});
const SLOW_WALL = (moves, ability = 'Thick Fat') => ({
  species: 'Snorlax', ability, moves,
  nature: 'Brave', evs: { hp: 252, spe: 0 }, ivs: { spe: 0 },
});
// A do-nothing target with a chosen species/ability/item, for clean 1-turn probes.
const passive = (species, ability, extra = {}) => ({
  species, ability, moves: ['Splash', 'Splash'], nature: 'Bold', evs: { hp: 252, def: 252 }, ...extra,
});
const threeTurns = ['move 1', 'move 1', 'move 1'];

// ── builders for the tabular sets ─────────────────────────────────────────────
const oneTurn = (extra) => ({ choices1: ['move 1'], choices2: ['move 1'], ...extra });
const immunity = (id, desc, t1, t2) => oneTurn({
  id, category: 'immunity / absorb', desc, expect: 'probe', noMiss: true, team1: [t1], team2: [t2],
});
const fixed = (id, desc, move, expectDmg, t2 = passive('Blissey', 'Natural Cure')) => oneTurn({
  id, category: 'fixed-damage', desc: `${desc} (expect ~${expectDmg} HP).`, expect: 'probe',
  team1: [{ species: 'Alakazam', ability: 'Synchronize', moves: [move, 'Splash'], nature: 'Modest', evs: { spa: 252 } }],
  team2: [t2],
});
const statMove = (id, move, stat, desc) => oneTurn({
  id, category: 'stat change', desc, expect: 'match',
  team1: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: [move, 'Quick Attack'], nature: 'Jolly', evs: { spe: 252 } }],
  team2: [SLOW_WALL(['Splash', 'Splash'])],
});
const statusMove = (id, move, status, desc, target = SLOW_WALL(['Splash', 'Splash']), expect = 'match') => oneTurn({
  id, category: 'status', desc, expect, guaranteedStatus: expect === 'match',
  team1: [{ species: 'Sableye', ability: 'Prankster', moves: [move, 'Quick Attack'], nature: 'Calm', evs: { hp: 252 } }],
  team2: [target],
});

export const SCENARIOS = [
  // ══ FIXED (was bug class #1): self-target move now applies vs a semi-invuln foe ══
  ...['Fly', 'Dig', 'Dive', 'Bounce', 'Phantom Force'].map((mv) => ({
    id: `seminvuln-selfboost-${mv.toLowerCase().replace(/\s+/g, '')}`,
    category: 'two-turn / semi-invulnerable',
    desc: `Booster uses Swords Dance while foe is mid-${mv}; the self-boost must still apply.`,
    note: 'FIXED finding #1: the invuln check now skips self/field status moves (battle.html, mirrors the Protect guard).',
    expect: 'match',
    team1: [FAST_BOOSTER(['Swords Dance', 'Quick Attack'])],
    team2: [SLOW_WALL([mv, 'Body Slam'])],
    choices1: threeTurns,
    choices2: threeTurns,
  })),

  // ══ Semi-invuln allow-lists & opponent-status (should MATCH) ══
  {
    id: 'seminvuln-gust-hits-fly',
    category: 'two-turn / allow-list',
    desc: 'Gust (in the allow-list) must hit — and double on — a foe mid-Fly.',
    expect: 'probe',
    team1: [{ species: 'Pelipper', ability: 'Keen Eye', moves: ['Gust', 'Quick Attack'], nature: 'Timid', evs: { spa: 252, spe: 252 }, ivs: { spe: 31 } }],
    team2: [SLOW_WALL(['Fly', 'Body Slam'])],
    choices1: threeTurns,
    choices2: threeTurns,
  },
  {
    id: 'seminvuln-twave-misses-fly',
    category: 'two-turn / opponent-status',
    desc: 'Thunder Wave (opponent-targeting status) must MISS a foe mid-Fly in both engines.',
    expect: 'match',
    team1: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Thunder Wave', 'Quick Attack'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Fly', 'Body Slam'])],
    choices1: ['move 1', 'move 1'],
    choices2: ['move 1', 'move 1'],
  },

  // ══ Stat-change moves (boosts are RNG-independent → MATCH) ══
  statMove('stat-growl-atk', 'Growl', 'atk', 'Growl lowers the foe Attack by 1.'),
  statMove('stat-leer-def', 'Leer', 'def', 'Leer lowers the foe Defense by 1.'),
  statMove('stat-scaryface-spe', 'Scary Face', 'spe', 'Scary Face lowers the foe Speed by 2.'),
  statMove('stat-charm-atk2', 'Charm', 'atk', 'Charm lowers the foe Attack by 2.'),

  // ══ Guaranteed status (MATCH) + status immunities (PROBE) ══
  statusMove('status-thunderwave-par', 'Thunder Wave', 'par', 'Thunder Wave paralyzes a non-immune foe.'),
  statusMove('status-willowisp-brn', 'Will-O-Wisp', 'brn', 'Will-O-Wisp burns a non-Fire foe.'),
  statusMove('status-toxic-tox', 'Toxic', 'tox', 'Toxic badly-poisons a non-Poison/Steel foe.'),
  statusMove('status-spore-slp', 'Spore', 'slp', 'Spore sleeps a non-Grass foe.'),
  statusMove('status-glare-par', 'Glare', 'par', 'Glare paralyzes a Normal foe.'),
  statusMove('status-willowisp-vs-fire', 'Will-O-Wisp', '', 'Will-O-Wisp must NOT burn a Fire-type.', passive('Charizard', 'Blaze'), 'probe'),
  statusMove('status-twave-vs-electric', 'Thunder Wave', '', 'Thunder Wave must NOT paralyze an Electric-type (Gen 6+).', passive('Jolteon', 'Volt Absorb'), 'probe'),
  statusMove('status-twave-vs-ground', 'Thunder Wave', '', 'Thunder Wave must NOT paralyze a Ground-type.', passive('Sandslash', 'Sand Veil'), 'probe'),

  // ══ Type / ability / item immunities → 0 damage (PROBE, noMiss) ══
  immunity('imm-eq-vs-flying', 'Earthquake vs a Flying-type', { species: 'Rhyperior', ability: 'Solid Rock', moves: ['Earthquake', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }, passive('Pidgeot', 'Keen Eye')),
  immunity('imm-eq-vs-levitate', 'Earthquake vs Levitate', { species: 'Rhyperior', ability: 'Solid Rock', moves: ['Earthquake', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }, passive('Bronzong', 'Levitate')),
  immunity('imm-eq-vs-airballoon', 'Earthquake vs an Air Balloon holder', { species: 'Rhyperior', ability: 'Solid Rock', moves: ['Earthquake', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }, passive('Snorlax', 'Thick Fat', { item: 'Air Balloon' })),
  immunity('imm-tbolt-vs-ground', 'Thunderbolt vs a Ground-type', { species: 'Jolteon', ability: 'Volt Absorb', moves: ['Thunderbolt', 'Splash'], nature: 'Modest', evs: { spa: 252 } }, passive('Sandslash', 'Sand Veil')),
  immunity('imm-tbolt-vs-voltabsorb', 'Thunderbolt vs Volt Absorb (absorb + heal)', { species: 'Raichu', ability: 'Static', moves: ['Thunderbolt', 'Splash'], nature: 'Modest', evs: { spa: 252 } }, passive('Lanturn', 'Volt Absorb')),
  immunity('imm-surf-vs-waterabsorb', 'Surf vs Water Absorb (absorb + heal)', { species: 'Vaporeon', ability: 'Hydration', moves: ['Surf', 'Splash'], nature: 'Modest', evs: { spa: 252 } }, passive('Gastrodon', 'Water Absorb')),
  immunity('imm-flamethrower-vs-flashfire', 'Flamethrower vs Flash Fire', { species: 'Charizard', ability: 'Blaze', moves: ['Flamethrower', 'Splash'], nature: 'Modest', evs: { spa: 252 } }, passive('Heatran', 'Flash Fire')),
  immunity('imm-gigadrain-vs-sapsipper', 'Giga Drain vs Sap Sipper', { species: 'Roserade', ability: 'Natural Cure', moves: ['Giga Drain', 'Splash'], nature: 'Modest', evs: { spa: 252 } }, passive('Azumarill', 'Sap Sipper')),
  immunity('imm-bodyslam-vs-ghost', 'Body Slam (Normal) vs a Ghost-type', { species: 'Snorlax', ability: 'Thick Fat', moves: ['Body Slam', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }, passive('Gengar', 'Cursed Body')),
  immunity('imm-aurasphere-vs-ghost', 'Aura Sphere (Fighting) vs a Ghost-type', { species: 'Lucario', ability: 'Inner Focus', moves: ['Aura Sphere', 'Splash'], nature: 'Modest', evs: { spa: 252 } }, passive('Gengar', 'Cursed Body')),

  // ══ Fixed-damage moves (deterministic → exact HP, PROBE) ══
  fixed('fixed-seismic-toss', 'Seismic Toss deals damage equal to user level', 'Seismic Toss', 50),
  fixed('fixed-night-shade', 'Night Shade deals damage equal to user level', 'Night Shade', 50),
  fixed('fixed-dragon-rage', 'Dragon Rage deals a flat 40', 'Dragon Rage', 40),
  fixed('fixed-sonic-boom', 'Sonic Boom deals a flat 20', 'Sonic Boom', 20),

  // ══ Protect / Substitute ══
  {
    id: 'protect-blocks-damage',
    category: 'protect',
    desc: 'Protect blocks a damaging move — defender takes 0.',
    expect: 'match', noMiss: true,
    team1: [{ species: 'Rhyperior', ability: 'Solid Rock', moves: ['Earthquake', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }],
    team2: [{ species: 'Skarmory', ability: 'Sturdy', moves: ['Protect', 'Splash'], nature: 'Impish', evs: { hp: 252, def: 252 } }],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'protect-blocks-status',
    category: 'protect',
    desc: 'Protect blocks Thunder Wave — no paralysis applied.',
    expect: 'probe',
    team1: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Thunder Wave', 'Quick Attack'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Protect', 'Splash'])],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'substitute-blocks-status',
    category: 'substitute',
    desc: 'A Substitute (set up first) blocks Thunder Wave — no paralysis.',
    expect: 'probe',
    team1: [{ species: 'Snorlax', ability: 'Thick Fat', moves: ['Thunder Wave', 'Splash'], nature: 'Brave', evs: { hp: 252 }, ivs: { spe: 0 } }],
    team2: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Substitute', 'Splash'], nature: 'Jolly', evs: { spe: 252 }, ivs: { spe: 31 } }],
    choices1: ['move 2', 'move 1'], // Splash, then Thunder Wave
    choices2: ['move 1', 'move 1'], // Substitute (faster), then Substitute
  },

  // ══ Ability-ignoring (Mold Breaker / Scrappy) → the move CONNECTS (PROBE, noMiss) ══
  {
    id: 'moldbreaker-ignores-levitate',
    category: 'ability-ignoring',
    desc: 'Mold Breaker lets Earthquake hit a Levitate holder (damage, not 0).',
    expect: 'probe', noMiss: true,
    team1: [{ species: 'Rhyperior', ability: 'Mold Breaker', moves: ['Earthquake', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }],
    team2: [passive('Bronzong', 'Levitate')],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'scrappy-hits-ghost',
    category: 'ability-ignoring',
    desc: 'Scrappy lets a Normal move hit a Ghost-type (damage, not 0).',
    expect: 'probe', noMiss: true,
    team1: [{ species: 'Kangaskhan', ability: 'Scrappy', moves: ['Body Slam', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }],
    team2: [passive('Gengar', 'Cursed Body')],
    choices1: ['move 1'], choices2: ['move 1'],
  },

  // ══ Survival floors (Sturdy / Focus Sash) — defender must NOT faint (PROBE) ══
  {
    id: 'sturdy-survives-ohko',
    category: 'survival',
    desc: 'Sturdy survives a would-be OHKO from full HP (defender not fainted).',
    expect: 'probe', noMiss: true,
    team1: [{ species: 'Machamp', ability: 'No Guard', item: 'Choice Band', moves: ['Brick Break', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }],
    team2: [{ species: 'Aron', ability: 'Sturdy', moves: ['Splash', 'Splash'], nature: 'Hardy' }],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'focussash-survives-ohko',
    category: 'survival',
    desc: 'Focus Sash survives a would-be OHKO from full HP (defender not fainted).',
    expect: 'probe', noMiss: true,
    team1: [{ species: 'Machamp', ability: 'No Guard', item: 'Choice Band', moves: ['Brick Break', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }],
    team2: [{ species: 'Aron', ability: 'Rock Head', item: 'Focus Sash', moves: ['Splash', 'Splash'], nature: 'Hardy' }],
    choices1: ['move 1'], choices2: ['move 1'],
  },

  // ══ Speed Boost: +1 Speed stage each end-of-turn ══
  {
    id: 'speed-boost-ramp',
    category: 'ability / end-of-turn',
    desc: 'Speed Boost grants +1 Speed at the end of each turn, starting turn 1 (+1/+2/+3).',
    note: 'FIXED finding #2: Speed Boost now keys off the turn-start active snapshot (not turnCount>0), so a LEAD boosts at the end of turn 1 — matching Showdown 1/2/3 (was 0/1/2).',
    expect: 'match',
    team1: [{ species: 'Yanmega', ability: 'Speed Boost', moves: ['Quick Attack', 'Splash'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: ['move 2', 'move 2', 'move 2'],
    choices2: threeTurns,
  },
  {
    id: 'speed-boost-switchin',
    category: 'ability / end-of-turn',
    desc: 'A Speed Boost mon SWITCHED IN on turn 1 must NOT boost on its entry turn, but must on the next (switch-in ≠ lead).',
    note: 'Switch-aware guard for finding #2: proves the turn-start snapshot distinguishes a mid-turn switch-in (no boost on entry) from a lead (boosts on turn 1).',
    expect: 'match',
    team1: [SLOW_WALL(['Splash', 'Splash']), { species: 'Yanmega', ability: 'Speed Boost', moves: ['Quick Attack', 'Splash'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: ['switch 2', 'move 2', 'move 2'],
    choices2: threeTurns,
  },

  // ══ Switch-in hooks (Intimidate / entry hazards) — PROBE ══
  {
    id: 'switchin-intimidate',
    category: 'switch-in ability',
    desc: 'Switching in an Intimidate Pokémon lowers the foe Attack by 1.',
    expect: 'probe',
    team1: [SLOW_WALL(['Splash', 'Splash']), { species: 'Gyarados', ability: 'Intimidate', moves: ['Splash', 'Splash'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: ['switch 2', 'move 1'],
    choices2: ['move 1', 'move 1'],
  },
  {
    id: 'hazard-stealth-rock-entry',
    category: 'entry hazard',
    desc: 'A Pokémon switched into Stealth Rock takes 1/8 max HP × type effectiveness (×4 vs Fire/Flying = 50%).',
    expect: 'probe',
    team1: [SLOW_WALL(['Splash', 'Splash']), { species: 'Charizard', ability: 'Blaze', moves: ['Splash', 'Splash'], nature: 'Timid', evs: { spe: 252 } }],
    team2: [{ species: 'Sableye', ability: 'Prankster', moves: ['Stealth Rock', 'Splash'], nature: 'Calm', evs: { hp: 252 } }],
    choices1: ['move 1', 'switch 2'],
    choices2: ['move 1', 'move 1'],
  },

  // ══ Priority / terrain / field interactions — PROBE ══
  {
    id: 'prankster-vs-dark',
    category: 'ability / priority',
    desc: 'A Prankster-boosted status move fails against a Dark-type (no paralysis).',
    expect: 'probe',
    team1: [{ species: 'Sableye', ability: 'Prankster', moves: ['Thunder Wave', 'Splash'], nature: 'Calm', evs: { hp: 252 } }],
    team2: [passive('Umbreon', 'Inner Focus')],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'psychic-terrain-blocks-priority',
    category: 'terrain / priority',
    desc: 'Psychic Terrain blocks a priority move aimed at a grounded target (0 damage).',
    expect: 'probe', noMiss: true,
    team1: [{ species: 'Lucario', ability: 'Inner Focus', moves: ['Quick Attack', 'Psychic Terrain'], nature: 'Jolly', evs: { atk: 252, spe: 252 } }],
    team2: [passive('Snorlax', 'Immunity')],
    choices1: ['move 2', 'move 1'], choices2: ['move 1', 'move 1'],
  },
  {
    id: 'gravity-grounds-flying',
    category: 'field / immunity',
    desc: 'Gravity grounds a Flying-type so Earthquake hits it (damage, not 0). Foe uses Defense Curl, not Splash, because Gravity disables Splash in Showdown (see note below).',
    note: 'Gravity GROUNDING works in both engines (EQ hits Pidgeot). Separately, the trace showed in-house does NOT disable Gravity-incompatible moves (Splash/Fly/Bounce/Jump Kick/Magnet Rise) — Showdown made the foe Struggle when its only move (Splash) was Gravity-locked. That corroborates catalogue finding #3 (Gravity does not restrict Fly).',
    expect: 'probe', noMiss: true,
    team1: [{ species: 'Rhyperior', ability: 'Solid Rock', moves: ['Earthquake', 'Gravity'], nature: 'Adamant', evs: { atk: 252 } }],
    team2: [{ species: 'Pidgeot', ability: 'Keen Eye', moves: ['Defense Curl', 'Defense Curl'], nature: 'Hardy' }],
    choices1: ['move 2', 'move 1'], choices2: ['move 1', 'move 1'],
  },
  {
    id: 'weakness-policy-se',
    category: 'item / boost',
    desc: 'Weakness Policy raises the holder Atk & SpA by 2 after a super-effective hit.',
    expect: 'probe', noMiss: true,
    team1: [{ species: 'Charizard', ability: 'Blaze', moves: ['Flamethrower', 'Splash'], nature: 'Modest', evs: { spa: 252 } }],
    team2: [{ species: 'Bronzong', ability: 'Levitate', item: 'Weakness Policy', moves: ['Splash', 'Splash'], nature: 'Sassy', evs: { hp: 252, spd: 252 } }],
    choices1: ['move 1'], choices2: ['move 1'],
  },

  // ══ Self-status items / weather residual — PROBE ══
  {
    id: 'flame-orb-self-burn',
    category: 'item / status',
    desc: 'Flame Orb burns its holder at the end of the turn.',
    expect: 'probe',
    team1: [{ species: 'Snorlax', ability: 'Thick Fat', item: 'Flame Orb', moves: ['Splash', 'Splash'], nature: 'Hardy' }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: ['move 1', 'move 1'], choices2: ['move 1', 'move 1'],
  },
  {
    id: 'toxic-orb-self-poison',
    category: 'item / status',
    desc: 'Toxic Orb badly-poisons its holder at the end of the turn.',
    expect: 'probe',
    team1: [{ species: 'Snorlax', ability: 'Thick Fat', item: 'Toxic Orb', moves: ['Splash', 'Splash'], nature: 'Hardy' }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: ['move 1', 'move 1'], choices2: ['move 1', 'move 1'],
  },
  {
    id: 'sand-chip',
    category: 'weather / residual',
    desc: 'Sandstorm chips non-Rock/Ground/Steel types 1/16 per turn.',
    expect: 'probe',
    team1: [{ species: 'Alakazam', ability: 'Synchronize', moves: ['Sandstorm', 'Splash'], nature: 'Modest', evs: { spa: 252 } }],
    team2: [passive('Snorlax', 'Thick Fat')],
    choices1: ['move 1', 'move 2', 'move 2'], choices2: threeTurns,
  },

  // ══ Move-execution order (opt-in checkOrder) — PROBE ══
  {
    id: 'speed-order-baseline',
    category: 'turn order',
    desc: 'Control: the faster Pokémon acts first when both use a normal-priority move.',
    expect: 'probe', checkOrder: true,
    team1: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Strength', 'Splash'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [{ species: 'Snorlax', ability: 'Thick Fat', moves: ['Strength', 'Splash'], nature: 'Brave', evs: { hp: 252 }, ivs: { spe: 0 } }],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'priority-quick-attack',
    category: 'turn order / priority',
    desc: 'A +1 priority move (Quick Attack) lets the SLOWER Pokémon act first.',
    expect: 'probe', checkOrder: true,
    team1: [{ species: 'Snorlax', ability: 'Thick Fat', moves: ['Quick Attack', 'Splash'], nature: 'Brave', evs: { hp: 252 }, ivs: { spe: 0 } }],
    team2: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Strength', 'Splash'], nature: 'Jolly', evs: { spe: 252 } }],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'trick-room-order',
    category: 'turn order / field',
    desc: 'Under Trick Room the SLOWER Pokémon acts first (turn 2 reverses).',
    expect: 'probe', checkOrder: true,
    team1: [{ species: 'Snorlax', ability: 'Thick Fat', moves: ['Trick Room', 'Strength'], nature: 'Brave', evs: { hp: 252 }, ivs: { spe: 0 } }],
    team2: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Splash', 'Strength'], nature: 'Jolly', evs: { spe: 252 } }],
    choices1: ['move 1', 'move 2'], choices2: ['move 1', 'move 2'],
  },

  // ══ Self-KO / fixed-fraction / priority-abilities — PROBE ══
  // NOTE: recharge (Hyper Beam), Outrage/Thrash lock, Encore, Disable, Choice-lock
  // and Sky Drop are NOT testable here — their enforcement lives in the input layer
  // (battle.html:19430-19441 auto-submits the lock), which the forced-move harness
  // path (playTurn with an explicit slot) bypasses. The engine DOES set the lock
  // (e.g. volatile.recharge=true after Hyper Beam); only the harness can't exercise it.
  {
    id: 'self-ko-explosion',
    category: 'move / self-KO',
    desc: 'Explosion makes the user faint.',
    expect: 'probe',
    team1: [{ species: 'Electrode', ability: 'Static', moves: ['Explosion', 'Splash'], nature: 'Jolly', evs: { atk: 252, spe: 252 } }],
    team2: [passive('Snorlax', 'Thick Fat')],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'super-fang-fraction',
    category: 'move / fixed-fraction',
    desc: 'Super Fang deals 50% of the target current HP (from full → ~half).',
    expect: 'probe', noMiss: true,
    team1: [{ species: 'Raticate', ability: 'Guts', moves: ['Super Fang', 'Splash'], nature: 'Jolly', evs: { atk: 252, spe: 252 } }],
    team2: [passive('Snorlax', 'Thick Fat')],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'gale-wings-priority',
    category: 'ability / priority',
    desc: 'Gale Wings gives Flying moves +1 priority (at full HP) — the slower user acts first.',
    expect: 'probe', checkOrder: true,
    team1: [{ species: 'Talonflame', ability: 'Gale Wings', moves: ['Acrobatics', 'Splash'], nature: 'Brave', evs: { atk: 252 }, ivs: { spe: 0 } }],
    team2: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Strength', 'Splash'], nature: 'Jolly', evs: { spe: 252 } }],
    choices1: ['move 1'], choices2: ['move 1'],
  },
  {
    id: 'triage-priority',
    category: 'ability / priority',
    desc: 'Triage gives draining/healing moves +3 priority — the slower user acts first.',
    expect: 'probe', checkOrder: true,
    team1: [{ species: 'Roserade', ability: 'Triage', moves: ['Giga Drain', 'Splash'], nature: 'Brave', evs: { spa: 252 }, ivs: { spe: 0 } }],
    team2: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Strength', 'Splash'], nature: 'Jolly', evs: { spe: 252 } }],
    choices1: ['move 1'], choices2: ['move 1'],
  },

  // ══ Sanity / regression (must MATCH) ══
  {
    id: 'sanity-swords-dance-normal',
    category: 'sanity',
    desc: 'Swords Dance x3 vs a passive foe — boosts must reach +2/+4/+6 in both engines.',
    expect: 'match',
    team1: [FAST_BOOSTER(['Swords Dance', 'Quick Attack'])],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: threeTurns,
    choices2: threeTurns,
  },
  {
    id: 'sanity-tackle-neutral-damage',
    category: 'sanity',
    desc: 'One Strength (no secondary) into a passive foe — damage must agree within the 85-100% roll band.',
    expect: 'match',
    team1: [{ species: 'Snorlax', ability: 'Thick Fat', moves: ['Strength', 'Splash'], nature: 'Adamant', evs: { atk: 252 } }],
    team2: [{ species: 'Blissey', ability: 'Natural Cure', moves: ['Splash', 'Splash'], nature: 'Calm', evs: { hp: 252 } }],
    choices1: ['move 1'],
    choices2: ['move 1'],
  },
  {
    id: 'sanity-super-effective-faint',
    category: 'sanity / type-chart',
    desc: 'A clearly super-effective hit must register comparable damage (and same faint outcome).',
    expect: 'match',
    team1: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Thunderbolt', 'Quick Attack'], nature: 'Modest', evs: { spa: 252, spe: 252 } }],
    team2: [{ species: 'Pelipper', ability: 'Drizzle', moves: ['Splash', 'Splash'], nature: 'Bold', evs: {} }],
    choices1: ['move 1'],
    choices2: ['move 1'],
  },

  // ══ Probes: other mechanics (informational) ══
  {
    id: 'gravity-blocks-fly',
    category: 'two-turn / precondition',
    desc: 'Under Gravity, Fly cannot be used — both engines now refuse it.',
    expect: 'probe',
    team1: [{ species: 'Sableye', ability: 'Prankster', moves: ['Gravity', 'Quick Attack'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Fly', 'Body Slam'])],
    choices1: ['move 1', 'move 2', 'move 2'],
    choices2: ['move 1', 'move 1', 'move 1'],
    note: 'FIXED finding #3: in-house now refuses Gravity-banned moves (battle.html gravity gate). Differential play can\'t cleanly assert it (Showdown rejects the illegal choice and substitutes a default), so the engine-level block is covered by a direct test in engine-fixes.test.js.',
  },
  {
    id: 'probe-freeze-dry-vs-water',
    category: 'type-chart',
    desc: 'Freeze-Dry is Ice that hits Water super-effectively (×2). A normal Ice calc would resist it (×0.5).',
    expect: 'probe',
    team1: [{ species: 'Glaceon', ability: 'Snow Cloak', moves: ['Freeze-Dry', 'Quick Attack'], nature: 'Modest', evs: { spa: 252, spe: 252 } }],
    team2: [passive('Vaporeon', 'Water Absorb')],
    choices1: ['move 1'],
    choices2: ['move 1'],
  },
  {
    id: 'probe-toxic-residual-ramp',
    category: 'status / residual',
    desc: 'Toxic deals 1/16, 2/16, 3/16 max HP (no roll). The residual ramp should match exactly.',
    expect: 'probe',
    guaranteedStatus: true,
    team1: [{ species: 'Sableye', ability: 'Prankster', moves: ['Toxic', 'Quick Attack'], nature: 'Calm', evs: { hp: 252 } }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: ['move 1', 'move 2', 'move 2'],
    choices2: threeTurns,
  },
  {
    id: 'probe-multi-hit-bullet-seed',
    category: 'multi-hit',
    desc: 'Bullet Seed hits 2-5 times (RNG); hit count differs across engines — expected.',
    expect: 'probe',
    team1: [{ species: 'Breloom', ability: 'Technician', moves: ['Bullet Seed', 'Quick Attack'], nature: 'Adamant', evs: { atk: 252, spe: 252 } }],
    team2: [passive('Blissey', 'Natural Cure')],
    choices1: ['move 1'],
    choices2: ['move 1'],
  },
];
