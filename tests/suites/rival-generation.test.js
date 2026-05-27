// Rival counter-team generation suite. Verifies the overhauled rival pipeline
// (battle.html rollTrainerTeam 'Rival' path + _rivalCounterPlan + intro starter
// mirror): the rival builds a team to COUNTER the player's live six, signatures
// appear only as occasional flavor cameos, and the sig pool is never mutated.
//
// Determinism: with sm.active === false the engine's team roll uses the seeded
// Math.random the harness installs, so seedRng(n) makes each roll reproducible.
//
// Run: npm run test:suites   (or: node --test tests/suites/rival-generation.test.js)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const LEAGUE_GW = { g1: 10, g2: 20, g3: 35, g4: 35 };

// Sigs deliberately chosen to share NO type with the counter types we assert on
// (Grass / Electric / Fire), so a "signature cameo" is always distinguishable
// from a "counter pick" in the resulting team.
const RIVAL_SIGS = ['Gengar', 'Alakazam', 'Crobat', 'Tyranitar', 'Gyarados', 'Snorlax'];

function makeRivalTrainer(sigs = RIVAL_SIGS) {
  return { name: 'TestRival', type: 'Mixed', sigs: sigs.slice(), pkmGens: GENS.slice() };
}

async function setup() {
  const eng = await loadEngine();
  const E = eng.window.__rivalTest;
  assert.ok(E && typeof E.rollTrainerTeam === 'function', 'rollTrainerTeam must be exposed on __rivalTest');
  assert.ok(typeof E.getRivalEncounterPhase === 'function', 'getRivalEncounterPhase must be exposed');
  assert.ok(typeof E._rivalBuildCounterTypePool === 'function', '_rivalBuildCounterTypePool must be exposed');
  return eng;
}

/** Configure sm as an inactive (deterministic-RNG) story run with the given player party. */
function primeStory(E, partyNames) {
  const sm = E.sm;
  sm.active = false; // -> rollTrainerTeam uses seeded Math.random
  sm.storyDifficulty = 'normal';
  sm.badges = 8;
  sm.eventIndex = 65;
  if (!sm.settings) sm.settings = {};
  sm.settings.enabledGens = GENS.slice();
  sm.team = partyNames.map((name) => ({ name, build: {} }));
  return sm;
}

function teamTypes(E, name) {
  const b = E.baseStats[name] || {};
  return [b.t1, b.t2].filter(Boolean);
}
function hasAnyType(E, name, types) {
  const t = teamTypes(E, name);
  return types.some((x) => t.includes(x));
}

// ---------------------------------------------------------------------------
// Unit tests — the plan helpers in isolation (no RNG, no engine roll).
// ---------------------------------------------------------------------------

test('_rivalBuildCounterTypePool: distinct counters, one best per mon, dual pick-one', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  const build = E._rivalBuildCounterTypePool;

  // A true monotype-Water party: only Grass / Electric are SE vs pure Water, so the
  // distinct pool is at most those two — the remaining slots random-fill downstream.
  E.sm.team = ['Squirtle', 'Wartortle', 'Blastoise', 'Vaporeon', 'Psyduck', 'Goldeen'].map((n) => ({ name: n, build: {} }));
  const water = build();
  assert.ok(water.length <= 2, `pure-Water party -> <=2 distinct counters, got [${water.join(', ')}]`);
  assert.ok(water.every((t) => ['Grass', 'Electric'].includes(t)), `Water counters are Grass/Electric: [${water.join(', ')}]`);
  assert.equal(new Set(water).size, water.length, 'pool types are distinct');

  // A type-diverse party yields several distinct counters, never repeating a type.
  E.sm.team = ['Charizard', 'Venusaur', 'Blastoise', 'Pikachu', 'Machamp', 'Gengar'].map((n) => ({ name: n, build: {} }));
  const diverse = build();
  assert.ok(diverse.length >= 3, `diverse party -> multiple distinct counters, got [${diverse.join(', ')}]`);
  assert.equal(new Set(diverse).size, diverse.length, 'all distinct (a type leaves the pool after use)');

  // dual-OK pick-one: a lone Gyarados (Water/Flying) is countered by Electric (4x) or
  // Rock (2x) — one distinct counter for the one mon.
  E.sm.team = [{ name: 'Gyarados', build: {} }];
  const gy = build();
  assert.equal(gy.length, 1, 'one mon -> one counter');
  assert.ok(['Electric', 'Rock'].includes(gy[0]), `Gyarados counter is Electric/Rock, got ${gy[0]}`);
});

test('_rivalIntroStarterCounterType: GB starter triangle, null for non-classical', async () => {
  const { window } = await setup();
  const f = window.__rivalTest._rivalIntroStarterCounterType;
  assert.equal(f('Bulbasaur'), 'Fire', 'Grass starter -> rival answers with Fire');
  assert.equal(f('Charmander'), 'Water', 'Fire starter -> Water');
  assert.equal(f('Squirtle'), 'Grass', 'Water starter -> Grass');
  assert.equal(f('Pikachu'), null, 'non-classical starter -> null (caller falls back to weighted type)');
});

// ---------------------------------------------------------------------------
// Generation tests — full rollTrainerTeam 'Rival' path under seeded RNG.
// ---------------------------------------------------------------------------

// Measures the average fraction of the rival's league team carrying STAB in `types`,
// plus how many teams carry at least one such mon, over `N` seeded rolls vs `party`.
function measureCoverage(eng, E, party, types, N, seedBase) {
  primeStory(E, party);
  const trainer = makeRivalTrainer();
  let totalFrac = 0;
  let teamsWithCoverage = 0;
  for (let s = 0; s < N; s++) {
    eng.seedRng(seedBase + s);
    const team = E.rollTrainerTeam(trainer, 6, LEAGUE_GW, GENS, 'Rival', E.STORY_RIVAL_ROW_LEAGUE);
    assert.equal(team.length, 6, 'league rival fields 6 mons');
    const hits = team.filter((m) => hasAnyType(E, m.name, types)).length;
    totalFrac += hits / team.length;
    if (hits >= 1) teamsWithCoverage++;
  }
  return { avgFrac: totalFrac / N, teamsWithCoverage, N };
}

test('counter dominance: the rival skews toward types that beat YOUR party (Water -> Grass/Electric)', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  const COUNTER = ['Grass', 'Electric']; // the only types super-effective vs pure Water

  // vs a Water monotype party — Grass/Electric coverage should be elevated.
  const water = measureCoverage(eng, E,
    ['Squirtle', 'Lapras', 'Vaporeon', 'Gyarados', 'Wartortle', 'Blastoise'], COUNTER, 60, 1000);
  // vs a Fire monotype party — Grass/Electric are NOT Fire counters, so coverage should drop.
  const fire = measureCoverage(eng, E,
    ['Charmander', 'Ninetales', 'Arcanine', 'Flareon', 'Magmar', 'Rapidash'], COUNTER, 60, 7000);

  assert.equal(water.teamsWithCoverage, water.N, 'every league rival team vs a Water party should carry >=1 Grass/Electric counter');
  // Pure-distinct: a Water party exposes ~2 distinct counters (Grass, Electric); the
  // remaining slots random-fill, so coverage sits lower than the old stack-the-counter
  // model but is still clearly elevated vs a party those types do not counter.
  assert.ok(water.avgFrac >= 0.28,
    `vs Water: avg Grass/Electric coverage ${(water.avgFrac * 100).toFixed(0)}% should be >= 28%`);
  assert.ok(water.avgFrac >= fire.avgFrac + 0.12,
    `counter logic must respond to the player's typing: Water ${(water.avgFrac * 100).toFixed(0)}% should clearly exceed Fire ${(fire.avgFrac * 100).toFixed(0)}%`);
});

test('intro starter mirror: vs Bulbasaur the intro rival overwhelmingly leads Fire', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  primeStory(E, ['Bulbasaur']);
  const trainer = makeRivalTrainer();

  let fire = 0;
  const N = 40;
  for (let s = 0; s < N; s++) {
    eng.seedRng(2000 + s);
    const team = E.rollTrainerTeam(trainer, 1, { g1: 30, g2: 40, g3: 20, g4: 10 }, GENS, 'Rival', E.STORY_RIVAL_ROW_INTRO);
    assert.equal(team.length, 1, 'intro rival fields a lone starter');
    if (hasAnyType(E, team[0].name, ['Fire'])) fire++;
  }
  assert.ok(fire / N >= 0.85, `intro rival was Fire ${fire}/${N} times — expected >= 85% (Grass starter triangle)`);
});

test('no duplicate species in a generated rival team', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  primeStory(E, ['Charizard', 'Pikachu', 'Machamp', 'Lapras', 'Snorlax', 'Dragonite']);
  const trainer = makeRivalTrainer();
  for (let s = 0; s < 200; s++) {
    eng.seedRng(3000 + s);
    const team = E.rollTrainerTeam(trainer, 6, LEAGUE_GW, GENS, 'Rival', E.STORY_RIVAL_ROW_LEAGUE);
    const names = team.map((m) => m.name);
    assert.equal(new Set(names).size, names.length, `duplicate species in rival team (seed ${3000 + s}): ${names.join(', ')}`);
  }
});

test('pure counter: signatures are never injected (only coincidental at most)', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  // The RIVAL_SIGS carry no Grass/Electric STAB, so vs a Water party none of them is a
  // valid counter pick — they can only appear as a rare random fallback, never as a
  // deliberate cameo. Expect ~zero across many rolls.
  primeStory(E, ['Squirtle', 'Lapras', 'Vaporeon', 'Gyarados', 'Wartortle', 'Blastoise']);
  const trainer = makeRivalTrainer();
  const sigSet = new Set(RIVAL_SIGS);

  let totalSigs = 0;
  const N = 200;
  for (let s = 0; s < N; s++) {
    eng.seedRng(4000 + s);
    const team = E.rollTrainerTeam(trainer, 6, LEAGUE_GW, GENS, 'Rival', E.STORY_RIVAL_ROW_LEAGUE);
    totalSigs += team.filter((m) => sigSet.has(m.name)).length;
  }
  const avgSigs = totalSigs / N;
  assert.ok(avgSigs < 0.5, `avg sig count ${avgSigs.toFixed(2)} should be < 0.5 (pure counter never injects signatures)`);
});

test('trainer.sigs array is not mutated by a team roll', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  primeStory(E, ['Squirtle', 'Lapras', 'Vaporeon', 'Gyarados', 'Wartortle', 'Blastoise']);
  const trainer = makeRivalTrainer();
  const before = trainer.sigs.slice();
  for (let s = 0; s < 50; s++) {
    eng.seedRng(5000 + s);
    E.rollTrainerTeam(trainer, 6, LEAGUE_GW, GENS, 'Rival', E.STORY_RIVAL_ROW_LEAGUE);
  }
  assert.deepEqual(trainer.sigs, before, 'rollTrainerTeam must not splice/mutate the trainer.sigs source array');
});

// ---------------------------------------------------------------------------
// Dialogue tests — pre-battle banner, darker league branch, aftermath voice.
// ---------------------------------------------------------------------------

test('B5: rival phase taglines map per phase', async () => {
  const { window } = await setup();
  const f = window.__rivalTest.rivalPhaseTagline;
  assert.equal(f(0), 'Starter Duel');
  assert.equal(f(2), 'First Rematch');
  assert.equal(f(3), 'On the Way Up');
  assert.equal(f(4), 'Title Match');
  assert.equal(f(null), 'Rematch');
});

test('B7: league rival intro turns dark only when the player is losing the rivalry', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  const sm = E.sm;
  sm.active = false;
  const SHADOW = ['reluctant names', 'close the door', 'stopped seeing a rival'];
  const hasShadow = (arr) => arr.some((l) => SHADOW.some((s) => l.includes(s)));
  function gather(phase, lossStreak, N) {
    sm.rivalConsecutiveLosses = lossStreak;
    sm.rivalConsecutiveWins = 0;
    sm.rivalLastWinner = lossStreak > 0 ? 'rival' : 'none';
    sm.rivalChampionClaimed = false;
    const out = new Set();
    for (let s = 0; s < N; s++) { eng.seedRng(9000 + s); out.add(E.pickRivalSecondaryIntroLine(phase, 8)); }
    return [...out];
  }
  assert.ok(hasShadow(gather(4, 2, 80)), 'phase-4 + 2 losses should be able to surface a shadow line');
  assert.ok(!hasShadow(gather(4, 0, 80)), 'phase-4 with no losses must never surface a shadow line');
  assert.ok(!hasShadow(gather(2, 3, 80)), 'shadow lines are league-only — phase 2 must never surface them');
});

test('B10: aftermath line is standing-aware (win, rival-champ loss, loss streak)', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  const sm = E.sm;
  sm.active = false;
  function gather(won, phase, configure, N) {
    configure(sm);
    const out = new Set();
    for (let s = 0; s < N; s++) { eng.seedRng(9500 + s); out.add(E.getRivalAftermathLine(won, phase)); }
    return [...out];
  }
  const winLeague = gather(true, 4, (s) => { s.rivalConsecutiveWins = 1; s.rivalConsecutiveLosses = 0; s.rivalChampionClaimed = false; }, 40);
  assert.ok(winLeague.some((l) => /Hall|crown|Champion/i.test(l)), 'league win line should reference the Hall/crown/Champion');

  const loseLeague = gather(false, 4, (s) => { s.rivalConsecutiveLosses = 1; s.rivalConsecutiveWins = 0; s.rivalChampionClaimed = true; }, 40);
  assert.ok(loseLeague.some((l) => /Champion|crown|door/i.test(l)), 'league loss (rival champ) line should reference the claim');

  const streak = gather(false, 3, (s) => { s.rivalConsecutiveLosses = 3; s.rivalConsecutiveWins = 0; s.rivalChampionClaimed = false; }, 60);
  assert.ok(streak.some((l) => /Three/i.test(l)), '3-loss streak should be able to surface the escalated cold line');

  for (const l of [...winLeague, ...loseLeague, ...streak]) {
    assert.ok(typeof l === 'string' && l.length > 0, 'every aftermath line is a non-empty string');
  }
});

test('D1: rival journal logs each encounter and renders without throwing', async () => {
  const eng = await setup();
  const E = eng.window.__rivalTest;
  const sm = E.sm;
  sm.active = false;
  sm.rivalEncounterLog = [];
  sm.rivalConsecutiveWins = 0;
  sm.rivalConsecutiveLosses = 0;
  sm.rivalChampionClaimed = false;
  sm.badges = 2;

  // Player wins the early rival (records the rival's team snapshot we pass in).
  E.setRivalStanding('player', E.STORY_RIVAL_ROW_EARLY, ['Gengar', 'Alakazam', 'Crobat']);
  // Player concedes the league rival (rival wins, claims Champion).
  sm.badges = 8;
  E.setRivalStanding('rival', E.STORY_RIVAL_ROW_LEAGUE, ['Tyranitar', 'Gyarados', 'Snorlax', 'Weavile', 'Magnezone', 'Feraligatr']);

  assert.equal(sm.rivalEncounterLog.length, 2, 'two encounters logged');
  const [first, second] = sm.rivalEncounterLog;
  assert.equal(first.won, true);
  assert.equal(first.phase, 2);
  assert.deepEqual(first.team, ['Gengar', 'Alakazam', 'Crobat']);
  assert.equal(first.badges, 2);
  assert.equal(second.won, false);
  assert.equal(second.phase, 4);
  assert.equal(second.team.length, 6);
  assert.equal(sm.rivalChampionClaimed, true, 'rival claimed the Champion title on the league concede');

  // A 'none' result must not append a log entry.
  E.setRivalStanding('none', E.STORY_RIVAL_ROW_MID, ['Pikachu']);
  assert.equal(sm.rivalEncounterLog.length, 2, "a 'none' standing logs nothing");

  // The journal renderer produces HTML referencing the record and a logged species.
  const html = E._pcRenderRivalJournalTab();
  assert.ok(typeof html === 'string' && html.length > 0, 'journal renders a non-empty string');
  assert.ok(/Gengar/.test(html), 'journal HTML lists a logged rival species');
  assert.ok(/WON|LOST/.test(html), 'journal HTML shows win/loss badges');
});
