// Move-tutor overhaul — recommender quality (WS-C).
//
// Locks the approved scoring upgrades:
//   • Q8  — doubles/VGC builds are excluded from usage counting (mirrors the
//           roll-side allowDoublesBuilds policy), so doubles-only support moves
//           can't surface as "recommended" in a 1v1-singles game.
//   • R8  — ability→move synergy (Technician boosts ≤60 BP picks).
//   • Q6  — short-battle fit: 6v6 chip tools (Toxic & co) are down-weighted, so
//           only KNOWN-GOOD status (recovery/boost/support that clears the
//           heuristic bar after the fit factor) earns the zero-usage flex slot.
//   • R4  — sparse species get the ✨ Suggest panel (heuristic-driven) instead
//           of silent suppression.
//   • R1/R2 regression — a strongly physical mon's coverage picks stay on its
//           stronger attacking stat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const synthMon = (type1, type2, atk, spa) => ({
  type1, type2: type2 || null,
  stats: { atk, def: 80, spa, spd: 80, spe: 90 }, maxHp: 300,
});
const NO_DATA = 'ZzSynthTestSpecies';
const movesOf = (recs) => recs.map((r) => r.move);
const catOf = (m) => { try { return (ST.ensureMoveData(m) || {}).cat; } catch (e) { return null; } };

test('Q8: doubles-only builds no longer feed usage — Cresselia loses Helping Hand, keeps singles staples', () => {
  // data/builds.csv holds 11 Cresselia rows with Helping Hand — ALL doubles/VGC.
  // With the doubles filter, its usage must be absent while genuine singles
  // moves keep theirs. (If a future data refresh adds a singles Helping Hand
  // set, update this fixture — see the awk sweep in the PR description.)
  const pool = ST.txStarredPool('Cresselia');
  assert.ok(!pool.moves.pctOf.get('Helping Hand'), 'Helping Hand (doubles-only sets) has no usage');
  assert.ok((pool.moves.pctOf.get('Moonlight') || 0) > 10, 'Moonlight (singles staple) keeps its usage');
});

test('R8: Technician promotes a ≤60 BP coverage pick; without it raw power wins', () => {
  // Zero-usage synth → deterministic fallback chain, where power×fit decides.
  // Flying coverage on a physical mon: Aerial Ace 60 BP (×1.5 Technician = 90
  // effective) vs Drill Peck 80 BP.
  const pool = ['Close Combat', 'Aerial Ace', 'Drill Peck'];
  const withTech = ST.txMoveRecsByPurpose(pool, synthMon('Fighting', null, 150, 60), { m: [], a: 'Technician' }, NO_DATA);
  const flyingPickTech = movesOf(withTech).find((m) => ['Aerial Ace', 'Drill Peck'].includes(m));
  assert.equal(flyingPickTech, 'Aerial Ace', 'Technician: 60 BP × 1.5 beats 80 BP');
  const without = ST.txMoveRecsByPurpose(pool, synthMon('Fighting', null, 150, 60), { m: [], a: 'Sturdy' }, NO_DATA);
  const flyingPick = movesOf(without).find((m) => ['Aerial Ace', 'Drill Peck'].includes(m));
  assert.equal(flyingPick, 'Drill Peck', 'no Technician: raw 80 BP wins');
});

test('Q6+R5: Toxic (short-battle down-weighted) does not clear the flex bar; Recover does', () => {
  const mon = synthMon('Ground', null, 150, 60);
  // Toxic: support 70 × 0.75 short-battle = 52.5 → below the known-good bar (60)
  // → the spare coverage move keeps the 4th slot on a zero-usage species.
  const withToxic = ST.txMoveRecsByPurpose(
    ['Earthquake', 'Stone Edge', 'Iron Head', 'Poison Jab', 'Toxic'], mon, { m: [] }, NO_DATA);
  assert.ok(!movesOf(withToxic).includes('Toxic'), 'Toxic stays out (52.5 < 60 after short-battle fit)');
  // Recover: 90 × 1.0 → known-good, earns the flex slot.
  const withRecover = ST.txMoveRecsByPurpose(
    ['Earthquake', 'Stone Edge', 'Iron Head', 'Poison Jab', 'Recover'], mon, { m: [] }, NO_DATA);
  assert.ok(movesOf(withRecover).includes('Recover'), 'Recover earns the zero-usage flex slot');
});

test('R1/R2 regression: physical mon coverage stays physical when both categories offer the type', () => {
  const recs = ST.txMoveRecsByPurpose(
    ['Flare Blitz', 'Fire Blast', 'Icicle Crash', 'Ice Beam', 'Wild Charge', 'Thunderbolt'],
    synthMon('Fire', null, 150, 60), { m: [] }, NO_DATA);
  const picks = movesOf(recs);
  // For every TYPE with both a physical and a special option, the physical one
  // must be the chosen representative on a 150-Atk / 60-SpA mon. (The distinct-
  // type rule means slot 4 may still take a special leftover once the physical
  // options are exhausted — that's fine; the per-type CHOICE is what R1/R2 fix.)
  assert.ok(picks.includes('Flare Blitz') && !picks.slice(0, 3).includes('Fire Blast'), 'Fire → Flare Blitz over Fire Blast');
  assert.ok(picks.includes('Icicle Crash') && !picks.includes('Ice Beam'), 'Ice → Icicle Crash over Ice Beam');
  assert.ok(picks.includes('Wild Charge') && !picks.includes('Thunderbolt'), 'Electric → Wild Charge over Thunderbolt');
});

test('R4: sparse species still get the ✨ Suggest panel (heuristic fallback, honest caption)', async () => {
  const sparsePool = ST.txStarredPool('Kricketot');
  assert.equal(sparsePool.sparse, true, 'fixture: Kricketot is below the sparse threshold');
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 6; ST.sm.gold = 99999; ST.sm.inventory = ST.sm.inventory || {};
  let idx = 0;
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 7) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Kricketot', build: { m: ['Struggle Bug'], n: 'Jolly' } }];
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(doc);
  for (let i = 0; i < 30; i++) { await wait(40); if (doc.querySelector('.tx-grid')) break; }
  const sug = doc.querySelector('details.tx-suggest');
  assert.ok(sug, 'suggest panel renders for a sparse species (was silently suppressed)');
  assert.ok(sug.textContent.includes('no competitive usage data'),
    'caption is honest about the heuristic basis');
});
