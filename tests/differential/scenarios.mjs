// Scenario battery for the differential battle harness.
//
// Each scenario is engine-neutral: both oracles build the same teams and run the
// same scripted choices, then diff.mjs compares the traces.
//
// `expect`:  'diverge' = a known/suspected in-house bug (we WANT the oracle to
//            catch it); 'match' = a sanity/regression case that must agree
//            (proves the oracle's false-positive rate is low).
//
// Move/ability/item legality is not validated by either engine in this harness
// (Showdown uses gen9customgame; the in-house mkMon builds arbitrary sets), so
// scenarios may use off-learnset movesets to isolate a mechanic.

// Reusable chassis.
const FAST_BOOSTER = (moves) => ({
  species: 'Jolteon', ability: 'Volt Absorb', moves,
  nature: 'Jolly', evs: { spe: 252, atk: 252 }, ivs: { spe: 31 },
});
const SLOW_WALL = (moves, ability = 'Thick Fat') => ({
  species: 'Snorlax', ability, moves,
  nature: 'Brave', evs: { hp: 252, spe: 0 }, ivs: { spe: 0 },
});

const SD = 'move 1'; // Swords Dance in slot 1 for the booster
const CHARGE = 'move 1'; // charge move in slot 1 for the wall
const threeTurns = ['move 1', 'move 1', 'move 1'];

export const SCENARIOS = [
  // ── Bug class #1: self-target move "misses" while foe is semi-invulnerable ──
  ...['Fly', 'Dig', 'Dive', 'Bounce', 'Phantom Force'].map((mv) => ({
    id: `seminvuln-selfboost-${mv.toLowerCase().replace(/\s+/g, '')}`,
    category: 'two-turn / semi-invulnerable',
    desc: `Booster uses Swords Dance while foe is mid-${mv}; the self-boost must still apply.`,
    bug: 'catalogue #1 (battle.html:23087-23110, missing self-target guard)',
    expect: 'diverge',
    team1: [FAST_BOOSTER(['Swords Dance', 'Quick Attack'])],
    team2: [SLOW_WALL([mv, 'Body Slam'])],
    choices1: threeTurns, // Swords Dance x3
    choices2: threeTurns, // charge move cycle
  })),

  // ── Bug class #2: Gravity should prevent Fly/Bounce ──
  {
    id: 'gravity-blocks-fly',
    category: 'two-turn / precondition',
    desc: 'Under Gravity, Fly cannot be used; the in-house engine charges it anyway.',
    bug: 'catalogue #2 (battle.html:22611-22667, no Gravity gate)',
    expect: 'probe',
    team1: [{ species: 'Sableye', ability: 'Prankster', moves: ['Gravity', 'Quick Attack'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Fly', 'Body Slam'])],
    choices1: ['move 1', 'move 2', 'move 2'], // Gravity, then attack
    choices2: ['move 1', 'move 1', 'move 1'], // try Fly under Gravity
    note: 'Cross-engine choice handling differs (Showdown rejects Fly under Gravity → picks default); a legality bug like this needs a direct assertion test, not differential play.',
  },

  // ── Probes: exploratory checks across other mechanics (results informational) ──
  {
    id: 'probe-freeze-dry-vs-water',
    category: 'type-chart',
    desc: 'Freeze-Dry is Ice that hits Water super-effectively (×2). A normal Ice calc would resist it (×0.5) — a ×4 damage gap exposes the special case.',
    expect: 'probe',
    team1: [{ species: 'Glaceon', ability: 'Snow Cloak', moves: ['Freeze-Dry', 'Quick Attack'], nature: 'Modest', evs: { spa: 252, spe: 252 } }],
    team2: [{ species: 'Vaporeon', ability: 'Water Absorb', moves: ['Splash', 'Splash'], nature: 'Bold', evs: { hp: 252 } }],
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
    desc: 'Bullet Seed hits 2-5 times (RNG). Hit count differs across engines — expected; surfaced as a low-confidence HP gap.',
    expect: 'probe',
    team1: [{ species: 'Breloom', ability: 'Technician', moves: ['Bullet Seed', 'Quick Attack'], nature: 'Adamant', evs: { atk: 252, spe: 252 } }],
    team2: [{ species: 'Blissey', ability: 'Natural Cure', moves: ['Splash', 'Splash'], nature: 'Calm', evs: { hp: 252 } }],
    choices1: ['move 1'],
    choices2: ['move 1'],
  },

  // ── Sanity / regression: these MUST match ──
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
    id: 'sanity-thunder-wave-guaranteed',
    category: 'sanity / status',
    desc: 'Thunder Wave must paralyze a non-Electric, non-Ground foe in both engines.',
    expect: 'match',
    guaranteedStatus: true,
    team1: [{ species: 'Jolteon', ability: 'Volt Absorb', moves: ['Thunder Wave', 'Quick Attack'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
    choices1: ['move 1'],
    choices2: ['move 1'],
  },
  {
    id: 'sanity-willowisp-guaranteed',
    category: 'sanity / status',
    desc: 'Will-O-Wisp must burn a non-Fire foe in both engines.',
    expect: 'match',
    guaranteedStatus: true,
    team1: [{ species: 'Sableye', ability: 'Prankster', moves: ['Will-O-Wisp', 'Quick Attack'], nature: 'Jolly', evs: { spe: 252 } }],
    team2: [SLOW_WALL(['Splash', 'Splash'])],
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
];
