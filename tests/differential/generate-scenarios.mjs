// Comprehensive scenario GENERATOR for the differential battle harness.
//
// Where `scenarios.mjs` is a hand-authored battery (~35 builders → ~117 probes),
// this module ENUMERATES every move / ability / item from @pkmn/dex (Showdown's
// own gen-9 data — so every name is valid for the Showdown oracle) and emits one
// or more oracle-compatible scenarios per entity, plus a coverage map recording
// what kind of probe each entity got (or why it couldn't get one).
//
// It is the Stage-1 enumerator of the "Showdown-parity testing" methodology
// (tests/differential/METHODOLOGY.md). The runner `sweep-all.mjs` consumes the
// output; the triage agent classifies the resulting divergences.
//
// Two probe shapes are emitted (the `mode` field tells `sweep-all.mjs` which):
//   mode:'trace' — run once per engine, diff the per-turn trace (boosts / status /
//                  faint / damage-range / effectiveness). Used for moves and for
//                  switch-in / end-of-turn ability+item effects.
//   mode:'sweep' — run N seeds per engine, compare damage RANGES with the crit-proof
//                  min-skew (reused from damage-sweep.mjs). Used for the multiplier
//                  layer (offensive/defensive damage-mod abilities & items), where a
//                  single roll can't separate a 1.3× bug from the 85-100% band.
//
// @pkmn/dex / @pkmn/sim are MIT — Copyright (c) 2011-2026 Guangcong Luo and other
// contributors (Pokémon Showdown); Copyright (c) 2020-2026 pkmn contributors.

import { Dex } from '@pkmn/dex';

const gen = Dex.forGen(9);

// ── type effectiveness (from Dex damageTaken codes: 0=1×,1=2×,2=½×,3=0×) ───────
const CODE_TO_MULT = { 0: 1, 1: 2, 2: 0.5, 3: 0 };
function typeEff(attackingType, defenderTypes) {
  let mult = 1;
  for (const dt of defenderTypes) {
    const code = gen.types.get(dt)?.damageTaken?.[attackingType];
    mult *= CODE_TO_MULT[code] ?? 1;
  }
  return mult;
}

// ── chassis ────────────────────────────────────────────────────────────────────
// An inert ability with NO singles battle effect, so a MOVE / ITEM probe isolates
// the thing under test (the ability never adds its own modifier). It no-ops
// identically in both engines, so it can never itself create a divergence.
const INERT = 'Honey Gather';

// Universal attacker: Deoxys-Attack has 180 Atk AND 180 SpA, so one chassis drives
// both physical and special move probes with plenty of headroom for weak moves.
// (Its Psychic STAB is applied identically by both engines, so it cancels in the diff.)
const ATTACKER = (move, opts = {}) => ({
  species: 'Deoxys-Attack', ability: opts.ability || INERT, item: opts.item || null,
  moves: opts.moves || [move, 'Recover'],
  nature: 'Quirky', evs: { atk: 252, spa: 252, spe: 4 }, ivs: { atk: 31, spa: 31 },
});

// Bulky, benign, GROUNDED defenders covering all 18 types. We pick, per move type,
// the first pool member the move is NEUTRAL against (so the move both connects —
// not immune — and doesn't 4×-OHKO, which would mask the damage comparison).
const DEFENDER_POOL = ['snorlax', 'milotic', 'tangrowth', 'clefable', 'hippowdon']
  .map((id) => ({ species: gen.species.get(id).name, types: gen.species.get(id).types }));
function neutralDefenderFor(moveType) {
  const hit = DEFENDER_POOL.find((d) => typeEff(moveType, d.types) === 1);
  return (hit || DEFENDER_POOL[0]).species;
}
const passiveDef = (species, extra = {}) => ({
  species, ability: INERT, moves: ['Recover', 'Recover'],
  nature: 'Sassy', evs: { hp: 252, def: 128, spd: 128 }, ...extra,
});

// ── per-move classification → family / observability / route ────────────────────
// Names whose effect needs a battle context the forced-identical-choice harness
// can't fabricate in one turn (mirrors generate-move-tests.js NEEDS_MANUAL_SETUP).
const VARIABLE_POWER = new Set([
  'Magnitude', 'Crush Grip', 'Wring Out', 'Hard Press', 'Low Kick', 'Grass Knot',
  'Heat Crash', 'Heavy Slam', 'Electro Ball', 'Gyro Ball', 'Reversal', 'Flail',
  'Endeavor', 'Final Gambit', 'Punishment', 'Stored Power', 'Power Trip', 'Trump Card',
  'Fury Cutter', 'Echoed Voice', 'Rollout', 'Ice Ball', 'Beat Up', 'Present',
]);
const COUNTER_LIKE = new Set([
  'Counter', 'Mirror Coat', 'Metal Burst', 'Bide', 'Comeuppance',
]);

function classifyMove(m) {
  // banned / non-standard mechanics — available in-house is OK to differ (user + CLAUDE.md).
  if (m.isZ || m.isMax) return { route: 'banned-oos', reason: m.isZ ? 'Z-move' : 'Max move' };
  if (m.isNonstandard && m.isNonstandard !== 'Past') return { route: 'banned-oos', reason: m.isNonstandard };

  const t = m.target;
  // Doubles/ally/spread targets the singles harness can't drive cleanly.
  if (t === 'adjacentAlly' || t === 'allyTeam' || t === 'allySide' || t === 'allies') {
    return { route: 'untestable', reason: 'ally/doubles target' };
  }

  if (m.ohko) return { route: 'needs-targeted', family: 'ohko', reason: 'OHKO (30% acc; outcome is faint-or-nothing)' };
  if (m.flags?.charge) return { route: 'needs-targeted', family: 'charge', reason: 'two-turn charge move' };
  if (m.flags?.futuremove) return { route: 'needs-targeted', family: 'delayed', reason: 'delayed damage (2 turns)' };
  if (COUNTER_LIKE.has(m.name)) return { route: 'needs-targeted', family: 'counter', reason: 'needs an incoming hit' };
  if (VARIABLE_POWER.has(m.name)) return { route: 'needs-targeted', family: 'variable-power', reason: 'BP depends on prior state' };
  if (t === 'scripted') return { route: 'needs-targeted', family: 'counter', reason: 'scripted target' };

  // Fixed-damage → deterministic exact comparison.
  if (m.damage != null) return { route: 'probe', family: 'fixed-damage', mode: 'trace' };

  if (m.category === 'Status') return { route: 'probe', family: 'status', mode: 'trace' };
  return { route: 'probe', family: 'damaging', mode: 'trace' };
}

// What can the per-turn trace actually OBSERVE for this move in one turn?
// (boosts / status / faint / damage are captured; volatiles / side / weather /
// terrain / heal-from-full are NOT visible in a one-turn end-state snapshot.)
function moveObservability(m, family) {
  if (family === 'damaging' || family === 'fixed-damage') return 'damage';
  // status family:
  if (m.status) return 'status';
  if (m.boosts) return 'boosts';
  if (m.heal && m.target === 'self') return 'low'; // heal from full HP = 0 net change
  if (m.volatileStatus || m.sideCondition || m.weather || m.terrain) return 'low';
  return 'low';
}

// ── move scenario builders ───────────────────────────────────────────────────────
function moveScenario(m, cls) {
  const id = `move-${gen.moves.get(m.id).id}`;
  const base = {
    id, kind: 'move', entity: m.name, entityId: m.id, family: cls.family,
    route: cls.route, category: `move / ${cls.family}`,
    desc: `${m.name} (${m.category} ${m.type}${m.basePower ? ` ${m.basePower}BP` : ''}) vs a neutral foe.`,
    choices1: ['move 1'], choices2: ['move 1'],
  };

  if (cls.family === 'damaging') {
    const def = neutralDefenderFor(m.type);
    return {
      ...base, mode: 'trace', expect: 'probe', observability: 'damage',
      // accuracy === true means it can't miss → a 0 means immunity/absorb, not RNG.
      noMiss: m.accuracy === true || m.accuracy >= 100,
      team1: [ATTACKER(m.name)],
      team2: [passiveDef(def)],
    };
  }

  if (cls.family === 'fixed-damage') {
    // Fixed damage is deterministic and type-independent in magnitude → exact HP.
    return {
      ...base, mode: 'trace', expect: 'probe', observability: 'damage', noMiss: m.accuracy === true,
      team1: [ATTACKER(m.name)],
      team2: [passiveDef('Blissey')],
    };
  }

  // status family (boosts / status / volatile / field). Snorlax (Normal) is a safe
  // universal target: not type-immune to par/brn/tox/slp/frz and not Ghost-immune to
  // a Normal attacker's coverage. Self-target moves are observed on the attacker.
  return {
    ...base, mode: 'trace',
    expect: 'probe',
    observability: moveObservability(m, cls.family),
    guaranteedStatus: !!m.status,
    team1: [ATTACKER(m.name, { moves: [m.name, 'Recover'] })],
    team2: [passiveDef('Snorlax')],
  };
}

// ── ability scenarios ─────────────────────────────────────────────────────────────
// Universal probes that need no per-ability trigger:
//   1) sweep — holder DEFENDS a neutral physical hit  → defensive damage-mods
//   2) sweep — holder DEFENDS a neutral special hit   → defensive damage-mods
//   3) trace — holder LEADS                            → switch-in boosts (Intimidate,
//              Download, Dauntless Shield, Intrepid Sword) + end-of-turn (Speed Boost)
// Offensive / conditional abilities (Iron Fist needs a punch, etc.) are flagged
// `needs-targeted-probe` for the curated second batch.
function abilityScenarios(a) {
  if (a.isNonstandard && a.isNonstandard !== 'Past') {
    return { route: 'banned-oos', reason: a.isNonstandard, scenarios: [] };
  }
  const name = a.name;
  const aid = a.id;
  const scenarios = [];

  // Offensive damage-mod probe: holder ATTACKS with Body Slam (a contact move with a
  // 30% secondary), which triggers the common unconditional offensive abilities
  // (Huge/Pure Power, Tough Claws, Sheer Force, Guts-when-statused, …). Move-specific
  // offensive abilities (Iron Fist/Strong Jaw/Technician) need a targeted probe.
  scenarios.push({
    id: `abil-${aid}-atk`, kind: 'ability', entity: name, entityId: aid,
    family: 'ability-offensive', route: 'probe', mode: 'sweep', category: 'ability / offensive',
    desc: `${name} holder lands a neutral physical contact hit (offensive damage-mod check).`,
    attacker: { species: 'Snorlax', ability: name, nature: 'Adamant', evs: { atk: 252 } },
    move: 'Body Slam',
    defender: { species: 'Aggron', ability: INERT, nature: 'Impish', evs: { hp: 252, def: 252 } },
  });
  // Defensive damage-mod probes (physical + special), 12-seed range compare.
  scenarios.push({
    id: `abil-${aid}-def-phys`, kind: 'ability', entity: name, entityId: aid,
    family: 'ability-defensive', route: 'probe', mode: 'sweep', category: 'ability / defensive',
    desc: `${name} holder takes a neutral PHYSICAL hit (defensive damage-mod check).`,
    attacker: { species: 'Deoxys-Attack', ability: INERT, nature: 'Quirky', evs: { atk: 252 } },
    move: 'Body Slam',
    defender: { species: 'Snorlax', ability: name, nature: 'Sassy', evs: { hp: 252, def: 128, spd: 128 } },
  });
  scenarios.push({
    id: `abil-${aid}-def-spec`, kind: 'ability', entity: name, entityId: aid,
    family: 'ability-defensive', route: 'probe', mode: 'sweep', category: 'ability / defensive',
    desc: `${name} holder takes a neutral SPECIAL hit (defensive damage-mod check).`,
    attacker: { species: 'Deoxys-Attack', ability: INERT, nature: 'Quirky', evs: { spa: 252 } },
    move: 'Tri Attack',
    defender: { species: 'Snorlax', ability: name, nature: 'Sassy', evs: { hp: 252, def: 128, spd: 128 } },
  });
  // Switch-in / end-of-turn boost probe (holder leads vs a passive foe, 2 turns).
  scenarios.push({
    id: `abil-${aid}-switchin`, kind: 'ability', entity: name, entityId: aid,
    family: 'ability-switchin', route: 'probe', mode: 'trace', category: 'ability / switch-in',
    desc: `${name} holder leads vs a passive foe (switch-in + end-of-turn boost/status check).`,
    expect: 'probe', observability: 'boosts',
    team1: [{ species: 'Snorlax', ability: name, moves: ['Recover', 'Recover'], nature: 'Sassy', evs: { hp: 252 } }],
    team2: [passiveDef('Blissey')],
    choices1: ['move 1', 'move 1'], choices2: ['move 1', 'move 1'],
  });
  return { route: 'probe', scenarios };
}

// ── item scenarios ────────────────────────────────────────────────────────────────
// Universal probes:
//   1) sweep — holder ATTACKS with a neutral move → offensive damage-mod items
//              (Life Orb, Choice Band/Specs, Muscle Band, Wise Glasses, …)
//   2) trace — holder HOLDS through a turn        → end-of-turn items (Leftovers,
//              Black Sludge, Flame/Toxic Orb) + on-entry (Air Balloon) via hp/status
// Conditional items (type-boost gems, resist berries, Eviolite) flagged accordingly.
const ITEM_HARNESS_UNTESTABLE = new Set([
  'Eviolite', // engine NFE check reads getPssDex().species.evos, stubbed empty in jsdom
]);
function itemScenarios(it) {
  if (it.isNonstandard && it.isNonstandard !== 'Past') {
    return { route: 'banned-oos', reason: it.isNonstandard, scenarios: [] };
  }
  if (ITEM_HARNESS_UNTESTABLE.has(it.name)) {
    return { route: 'harness-untestable', reason: 'evolution-data-dependent (jsdom stubs @pkmn/dex)', scenarios: [] };
  }
  const name = it.name;
  const iid = it.id;
  const scenarios = [];

  // Offensive damage-mod probe (holder attacks a wall), 12-seed range compare.
  scenarios.push({
    id: `item-${iid}-atk`, kind: 'item', entity: name, entityId: iid,
    family: 'item-offensive', route: 'probe', mode: 'sweep', category: 'item / offensive',
    desc: `${name} holder lands a neutral physical hit (offensive damage-mod check).`,
    attacker: { species: 'Snorlax', ability: INERT, item: name, nature: 'Adamant', evs: { atk: 252 } },
    move: 'Body Slam',
    defender: { species: 'Aggron', ability: INERT, nature: 'Impish', evs: { hp: 252, def: 252 } },
  });
  // Hold-through-a-turn probe (end-of-turn / on-entry items via hp/status).
  scenarios.push({
    id: `item-${iid}-hold`, kind: 'item', entity: name, entityId: iid,
    family: 'item-hold', route: 'probe', mode: 'trace', category: 'item / hold',
    desc: `${name} held through two turns vs a passive foe (Leftovers/orb/balloon via hp/status).`,
    expect: 'probe', observability: 'hp/status',
    team1: [{ species: 'Snorlax', ability: INERT, item: name, moves: ['Recover', 'Recover'], nature: 'Sassy', evs: { hp: 252 } }],
    team2: [passiveDef('Blissey')],
    choices1: ['move 1', 'move 1'], choices2: ['move 1', 'move 1'],
  });
  return { route: 'probe', scenarios };
}

// ── public enumeration API ─────────────────────────────────────────────────────────
export function buildSuite(opts = {}) {
  const want = opts.kinds || ['move', 'ability', 'item'];
  const scenarios = [];
  const coverage = []; // one row per entity: { kind, entity, route, family, reason, nProbes }

  if (want.includes('move')) {
    for (const m of gen.moves.all()) {
      const cls = classifyMove(m);
      // banned/untestable AND needs-targeted are routed OUT of the auto-sweep: their
      // effect needs a battle context the one-turn forced-choice probe can't fabricate
      // (charge / OHKO / variable-power / counter / delayed). They go to the curated
      // backlog (COVERAGE_MAP + FIDELITY), not a misleading auto probe.
      if (cls.route === 'banned-oos' || cls.route === 'untestable' || cls.route === 'needs-targeted') {
        coverage.push({ kind: 'move', entity: m.name, route: cls.route, family: cls.family || '-', reason: cls.reason, nProbes: 0 });
        continue;
      }
      const scn = moveScenario(m, cls);
      scenarios.push(scn);
      coverage.push({ kind: 'move', entity: m.name, route: cls.route, family: cls.family, observability: scn.observability, reason: cls.reason || '', nProbes: 1 });
    }
  }

  if (want.includes('ability')) {
    for (const a of gen.abilities.all()) {
      const r = abilityScenarios(a);
      if (!r.scenarios.length) {
        coverage.push({ kind: 'ability', entity: a.name, route: r.route, family: '-', reason: r.reason || '', nProbes: 0 });
        continue;
      }
      scenarios.push(...r.scenarios);
      coverage.push({ kind: 'ability', entity: a.name, route: 'probe', family: 'ability', reason: '', nProbes: r.scenarios.length });
    }
  }

  if (want.includes('item')) {
    for (const it of gen.items.all()) {
      const r = itemScenarios(it);
      if (!r.scenarios.length) {
        coverage.push({ kind: 'item', entity: it.name, route: r.route, family: '-', reason: r.reason || '', nProbes: 0 });
        continue;
      }
      scenarios.push(...r.scenarios);
      coverage.push({ kind: 'item', entity: it.name, route: 'probe', family: 'item', reason: '', nProbes: r.scenarios.length });
    }
  }

  // Optional filters for sharded/iterative runs.
  let out = scenarios;
  if (opts.filter) out = out.filter((s) => s.id.includes(opts.filter) || s.entity?.toLowerCase().includes(opts.filter.toLowerCase()));
  if (opts.kind) out = out.filter((s) => s.kind === opts.kind);
  if (opts.shardTotal) out = out.filter((_, i) => i % opts.shardTotal === (opts.shardIndex || 0));
  if (opts.limit) out = out.slice(0, opts.limit);

  return { scenarios: out, coverage, stats: summarize(coverage, scenarios) };
}

function summarize(coverage, scenarios) {
  const by = (arr, key) => arr.reduce((a, r) => { const k = r[key] || '-'; a[k] = (a[k] || 0) + 1; return a; }, {});
  const perKind = {};
  for (const kind of ['move', 'ability', 'item']) {
    const rows = coverage.filter((r) => r.kind === kind);
    perKind[kind] = { total: rows.length, byRoute: by(rows, 'route'), byFamily: by(rows, 'family') };
  }
  return { entities: coverage.length, scenarios: scenarios.length, perKind, byMode: by(scenarios, 'mode') };
}

// ── CLI: write the manifest + coverage map ─────────────────────────────────────────
async function cli() {
  const { writeFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const __dirname = dirname(fileURLToPath(import.meta.url));

  const { scenarios, coverage, stats } = buildSuite();
  writeFileSync(join(__dirname, 'generated-scenarios.json'), JSON.stringify({ stats, scenarios }, null, 0));

  // coverage map (markdown)
  const date = new Date().toISOString().slice(0, 10);
  let md = `# Generated Coverage Map\n\n> ${date} · \`generate-scenarios.mjs\` · reference data: @pkmn/dex gen 9 (MIT).\n\n`;
  md += `**Entities enumerated:** ${stats.entities} · **scenarios emitted:** ${stats.scenarios} ` +
        `(trace ${stats.byMode.trace || 0} · sweep ${stats.byMode.sweep || 0})\n\n`;
  md += `## Per-kind routing\n\n| Kind | Total | Probed | needs-targeted | untestable | banned/oos | harness-untestable |\n|---|--:|--:|--:|--:|--:|--:|\n`;
  for (const kind of ['move', 'ability', 'item']) {
    const r = stats.perKind[kind].byRoute;
    md += `| ${kind} | ${stats.perKind[kind].total} | ${r.probe || 0} | ${r['needs-targeted'] || 0} | ${r.untestable || 0} | ${r['banned-oos'] || 0} | ${r['harness-untestable'] || 0} |\n`;
  }
  md += `\n## Move families\n\n| Family | Count |\n|---|--:|\n`;
  const moveFam = coverage.filter((r) => r.kind === 'move').reduce((a, r) => { a[r.family || '-'] = (a[r.family || '-'] || 0) + 1; return a; }, {});
  for (const [f, n] of Object.entries(moveFam).sort((a, b) => b[1] - a[1])) md += `| ${f} | ${n} |\n`;

  md += `\n## Entities NOT auto-probed (routed out)\n\nThese need a curated targeted probe or are out of scope; listed so coverage is honest.\n\n`;
  for (const route of ['needs-targeted', 'untestable', 'harness-untestable', 'banned-oos']) {
    const rows = coverage.filter((r) => r.route === route);
    if (!rows.length) continue;
    md += `\n### ${route} (${rows.length})\n`;
    for (const r of rows.slice(0, 80)) md += `- ${r.kind}: **${r.entity}**${r.reason ? ` — ${r.reason}` : ''}\n`;
    if (rows.length > 80) md += `- … (+${rows.length - 80} more)\n`;
  }

  writeFileSync(join(__dirname, 'COVERAGE_MAP.md'), md, 'utf8');
  process.stderr.write(`Enumerated ${stats.entities} entities → ${stats.scenarios} scenarios.\n`);
  process.stderr.write(`Wrote generated-scenarios.json + COVERAGE_MAP.md\n`);
  process.stderr.write(JSON.stringify(stats.perKind, null, 2) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) cli();
