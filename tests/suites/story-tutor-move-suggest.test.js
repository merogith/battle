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

test('soft category preference: the PRIMARY STAB favors the bigger attacking stat', () => {
  // Fighting mono-type. The first/primary STAB pick should be Brick Break (Physical
  // 75) over Focus Blast (Special 120) for a physical mon — category is weighed
  // before power. Flip the stats and the special move leads. (A 2nd same-type STAB
  // may follow as a narrow-pool fallback; we only assert the PRIMARY here.)
  const pool = ['Brick Break', 'Focus Blast', 'Earthquake'];

  const physStab = stabMoves(ST.txMoveRecsByPurpose(pool, synthMon('Fighting', null, 150, 60), { m: [] }, NO_DATA));
  assert.equal(physStab[0], 'Brick Break', 'physical mon picks the physical STAB first');

  const specStab = stabMoves(ST.txMoveRecsByPurpose(pool, synthMon('Fighting', null, 60, 150), { m: [] }, NO_DATA));
  assert.equal(specStab[0], 'Focus Blast', 'special mon picks the special STAB first');
});

test('dual-type → two distinct-type STABs; mono-type → one STAB (deep pool, no fallback)', () => {
  // Pools with one move per type so there's always DISTINCT coverage to fill the
  // remaining slots — the narrow-pool 2nd-STAB fallback never triggers, so this
  // checks the primary composition cleanly.
  const dualPool = ['Fire Punch', 'Brave Bird', 'Earthquake', 'Thunder Punch', 'Ice Punch'];
  const dual = stabMoves(ST.txMoveRecsByPurpose(dualPool, synthMon('Fire', 'Flying', 150, 60), { m: [] }, NO_DATA));
  assert.equal(dual.length, 2, 'dual-type gets two STABs');
  assert.equal([...new Set(dual.map(typeOf))].sort().join('/'), 'Fire/Flying', 'one STAB per type');

  const monoPool = ['Flamethrower', 'Earthquake', 'Thunder Punch', 'Ice Punch', 'Brave Bird'];
  const mono = stabMoves(ST.txMoveRecsByPurpose(monoPool, synthMon('Fire', null, 150, 60), { m: [] }, NO_DATA));
  assert.equal(mono.length, 1, 'mono-type gets one STAB; distinct coverage fills the rest');
});

test('narrow-pool fallback: fills with a 2nd same-type STAB / status rather than leaving slots empty', () => {
  // Mono-Fighting with two same-type STABs + a Fighting status, NO coverage at all.
  // Distinct coverage is impossible, so the empty slots fill — a 2nd same-type STAB
  // is allowed (the user's "2 different power/accuracy STAB" idea), and a status
  // move takes a slot too. Never returns a single lonely pick.
  const pool = ['Close Combat', 'Brick Break', 'Bulk Up'];
  const recs = ST.txMoveRecsByPurpose(pool, synthMon('Fighting', null, 150, 60), { m: [] }, NO_DATA);
  assert.ok(recs.length >= 3, 'fills a viable set from a narrow same-type pool');
  assert.ok(recs.every((r) => r.move), 'every slot is a real move (no empty slots)');
  const dmg = recs.filter((r) => r.purpose !== 'Status').map((r) => r.move);
  assert.ok(dmg.includes('Close Combat') && dmg.includes('Brick Break'), 'a 2nd same-type STAB fills rather than dropping the slot');
  assert.ok(movesOf(recs).includes('Bulk Up'), 'the status move also takes a slot');
});

test('flex slot on zero-usage species: KNOWN-GOOD status earns the 4th slot; junk status does not (overhaul R5)', () => {
  // Zero-usage species used to tie-break to damage ALWAYS, so a fresh mon never
  // saw Swords Dance / recovery suggested. New rule: once three damaging picks
  // are in, a recognized-good status move (boost/recovery/support per the shared
  // heuristic) takes the flex slot on a no-data species.
  const withGoodStatus = ST.txMoveRecsByPurpose(
    ['Earthquake', 'Stone Edge', 'Iron Head', 'Poison Jab', 'Swords Dance'],
    synthMon('Ground', null, 150, 60), { m: [] }, NO_DATA);
  assert.ok(movesOf(withGoodStatus).includes('Swords Dance'),
    'Swords Dance (known-good boost) earns the 4th slot over a redundant 4th coverage move');
  assert.equal(withGoodStatus.filter((r) => catOf(r.move) !== 'Status').length, 3,
    'still three damaging picks');

  // Junk status control: an unrecognized status move never displaces coverage.
  const withJunkStatus = ST.txMoveRecsByPurpose(
    ['Earthquake', 'Stone Edge', 'Iron Head', 'Poison Jab', 'Sand Attack'],
    synthMon('Ground', null, 150, 60), { m: [] }, NO_DATA);
  assert.ok(!movesOf(withJunkStatus).includes('Sand Attack'), 'junk status is coverage-filled away');
  assert.ok(withJunkStatus.every((r) => catOf(r.move) !== 'Status'), 'all picks are damaging');

  // Status still fills when it is the only remaining option.
  const statusFills = ST.txMoveRecsByPurpose(
    ['Earthquake', 'Stone Edge', 'Iron Head', 'Swords Dance'],
    synthMon('Ground', null, 150, 60), { m: [] }, NO_DATA);
  assert.ok(movesOf(statusFills).includes('Swords Dance'), 'status takes the flex slot when no coverage remains');
});
