// Move Tutor "✨ Suggest a balanced set" — popularity-first recommender.
//
// Redesign contract (_txMoveRecsByPurpose):
//   • Composition follows typing: dual-type → 2 STAB + 1 Coverage + 1 flex;
//     mono-type → 1 STAB + 2 Coverage + 1 flex.
//   • Every damaging pick is a DISTINCT type (no two STAB/coverage moves share a
//     type — the point of two STABs on a dual-type).
//   • Each slot takes the highest Smogon usage % (most-picked) for the species.
//   • Physical/Special is a SOFT tiebreak toward the bigger attacking stat: a
//     STAB type is never dropped just because its popular move is the "wrong"
//     category; usage leads, category only breaks a usage tie.
//   • The flex 4th slot becomes Status only when the species runs status MORE
//     than the next coverage would add; otherwise it coverage-fills.
//
// Category + coverage-fill are exercised with a SYNTHETIC mon and a species name
// that carries no usage data, so every move scores usage 0 — the comparator then
// falls through to the deterministic category → power → alphabetical chain, which
// makes these assertions robust to Smogon-data refreshes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

const moveData = (m) => { try { return ST.ensureMoveData(m) || {}; } catch (e) { return {}; } };
const typeOf = (m) => moveData(m).type;
const catOf = (m) => moveData(m).cat;
// Synthetic mon: _txMonStats reads mon.stats.{atk,spa,…}; the recommender reads
// mon.type1/type2. No real species needed.
const synthMon = (type1, type2, atk, spa) => ({
  type1, type2: type2 || null,
  stats: { atk, def: 80, spa, spd: 80, spe: 90 }, maxHp: 300,
});
const NO_DATA = 'ZzSynthTestSpecies'; // not in csvBuilds → usage() === 0 for every move

const purposesOf = (recs) => recs.map((r) => r.purpose);
const movesOf = (recs) => recs.map((r) => r.move);
const stabMoves = (recs) => recs.filter((r) => r.purpose === 'STAB').map((r) => r.move);
const coverageMoves = (recs) => recs.filter((r) => r.purpose === 'Coverage').map((r) => r.move);

test('move-data preconditions hold (guards against data drift)', () => {
  assert.equal(catOf('Brick Break'), 'Physical');
  assert.equal(catOf('Focus Blast'), 'Special');
  assert.equal(typeOf('Brick Break'), 'Fighting');
  assert.equal(typeOf('Focus Blast'), 'Fighting');
  assert.equal(catOf('Swords Dance'), 'Status');
  assert.equal(typeOf('Earthquake'), 'Ground');
});

test('every damaging pick is a distinct type; STAB matches the mon, coverage does not (real Garchomp)', () => {
  const mon = ST.buildPokemon('Garchomp', { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin' });
  let pool = [];
  try { pool = (ST.tutorGetPoolForMon('Garchomp').moves) || []; } catch (e) {}
  if (!pool.length) pool = ['Earthquake', 'Outrage', 'Stone Edge', 'Fire Fang', 'Swords Dance', 'Iron Head'];
  const recs = ST.txMoveRecsByPurpose(pool, mon, { m: [] }, 'Garchomp');

  assert.ok(recs.length >= 2 && recs.length <= 4, 'returns 2–4 picks');
  assert.equal(new Set(movesOf(recs)).size, recs.length, 'no duplicate moves');

  const monTypes = new Set([mon.type1, mon.type2].filter(Boolean));
  const dmgTypes = recs.filter((r) => r.purpose !== 'Status').map((r) => typeOf(r.move));
  assert.equal(new Set(dmgTypes).size, dmgTypes.length, 'damaging picks have DISTINCT types');
  for (const m of stabMoves(recs)) assert.ok(monTypes.has(typeOf(m)), `${m} is a STAB type`);
  for (const m of coverageMoves(recs)) assert.ok(!monTypes.has(typeOf(m)), `${m} is off-STAB coverage`);
  assert.ok(stabMoves(recs).length <= 2, 'at most 2 STAB picks');
});

test('soft category preference: usage-tied STAB favors the bigger attacking stat', () => {
  // Fighting mono-type. Physical mon should take Brick Break (Physical 75) over
  // Focus Blast (Special 120) even though Focus Blast hits harder — category is
  // weighed before power. Flip the stats and the special move wins.
  const pool = ['Brick Break', 'Focus Blast', 'Earthquake'];

  const physStab = stabMoves(ST.txMoveRecsByPurpose(pool, synthMon('Fighting', null, 150, 60), { m: [] }, NO_DATA));
  assert.equal(physStab.length, 1, 'one STAB on a mono-type');
  assert.equal(physStab[0], 'Brick Break', 'physical mon picks the physical STAB');

  const specialRecs = ST.txMoveRecsByPurpose(pool, synthMon('Fighting', null, 60, 150), { m: [] }, NO_DATA);
  assert.equal(stabMoves(specialRecs)[0], 'Focus Blast', 'special mon picks the special STAB');

  // The off-category same-type move (Focus Blast for the physical mon) must NOT
  // resurface as coverage — that would double the Fighting type.
  const physical = ST.txMoveRecsByPurpose(pool, synthMon('Fighting', null, 150, 60), { m: [] }, NO_DATA);
  const physTypes = physical.filter((r) => r.purpose !== 'Status').map((r) => typeOf(r.move));
  assert.equal(new Set(physTypes).size, physTypes.length, 'no doubled type from backfill');
  assert.ok(!movesOf(physical).includes('Focus Blast'), 'second Fighting move is not added as coverage');
});

test('dual-type → two distinct-type STABs; mono-type → one STAB', () => {
  const pool = ['Fire Punch', 'Flamethrower', 'Brave Bird', 'Air Slash', 'Earthquake'];

  const dual = ST.txMoveRecsByPurpose(pool, synthMon('Fire', 'Flying', 150, 60), { m: [] }, NO_DATA);
  const dualStab = stabMoves(dual);
  assert.equal(dualStab.length, 2, 'dual-type gets two STABs');
  const dualStabTypes = [...new Set(dualStab.map(typeOf))].sort().join('/');
  assert.equal(dualStabTypes, 'Fire/Flying', 'one STAB per type');

  const mono = ST.txMoveRecsByPurpose(pool, synthMon('Fire', null, 150, 60), { m: [] }, NO_DATA);
  assert.equal(stabMoves(mono).length, 1, 'mono-type gets one STAB');
});

test('flex slot coverage-fills when status is not more popular, but shows status when it is the only option', () => {
  // With a spare distinct-type coverage move available and zero usage everywhere,
  // the tie goes to coverage — a pure attacker gets no unused status move.
  const withSpareCoverage = ST.txMoveRecsByPurpose(
    ['Earthquake', 'Stone Edge', 'Iron Head', 'Poison Jab', 'Swords Dance'],
    synthMon('Ground', null, 150, 60), { m: [] }, NO_DATA);
  assert.ok(!purposesOf(withSpareCoverage).includes('Status'), 'status is coverage-filled away on a tie');
  assert.ok(withSpareCoverage.every((r) => catOf(r.move) !== 'Status'), 'all picks are damaging');

  // Remove the spare coverage: now the only 4th option is the status move, so it
  // takes the flex slot.
  const statusFills = ST.txMoveRecsByPurpose(
    ['Earthquake', 'Stone Edge', 'Iron Head', 'Swords Dance'],
    synthMon('Ground', null, 150, 60), { m: [] }, NO_DATA);
  assert.ok(movesOf(statusFills).includes('Swords Dance'), 'status takes the flex slot when no coverage remains');
});
