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
  // ══ Known bug class #1: self-target move "misses" while foe is semi-invuln ══
  ...['Fly', 'Dig', 'Dive', 'Bounce', 'Phantom Force'].map((mv) => ({
    id: `seminvuln-selfboost-${mv.toLowerCase().replace(/\s+/g, '')}`,
    category: 'two-turn / semi-invulnerable',
    desc: `Booster uses Swords Dance while foe is mid-${mv}; the self-boost must still apply.`,
    bug: 'catalogue #1 (battle.html:23087-23110, missing self-target guard)',
    expect: 'diverge',
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

  // ══ Speed Boost: +1 Speed stage each end-of-turn (PROBE) ══
  {
    id: 'speed-boost-ramp',
    category: 'ability / end-of-turn',
    desc: 'Speed Boost grants +1 Speed at the end of each turn (+1/+2/+3).',
    bug: 'CONFIRMED real divergence (not harness): battle.html:28706 gates Speed Boost on `turnCount > 0` ("after first turn"), and turnCount++ runs AFTER endOfTurnEffects (battle.html:21676 vs 21682), so a lead skips its end-of-turn-1 boost → in-house 0/1/2 vs Showdown 1/2/3.',
    expect: 'probe',
    team1: [{ species: 'Yanmega', ability: 'Speed Boost', moves: ['Quick Attack', 'Splash'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: ['move 2', 'move 2', 'move 2'],
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
    desc: 'Under Gravity, Fly cannot be used; the in-house engine charges it anyway.',
    bug: 'catalogue #2 (battle.html:22611-22667, no Gravity gate)',
    expect: 'probe',
    team1: [{ species: 'Sableye', ability: 'Prankster', moves: ['Gravity', 'Quick Attack'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Fly', 'Body Slam'])],
    choices1: ['move 1', 'move 2', 'move 2'],
    choices2: ['move 1', 'move 1', 'move 1'],
    note: 'Cross-engine choice handling differs (Showdown rejects Fly under Gravity → picks default); a legality bug like this needs a direct assertion test, not differential play.',
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
