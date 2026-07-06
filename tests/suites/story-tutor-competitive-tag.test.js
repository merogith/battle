// Competitive move tagging (Feature 2).
//
// Elite utility / singleton moves the old status table scored as filler (30) — Parting
// Shot, Teleport, Baton Pass, Shed Tail, Memento, Heal Bell… — now clear a class-based
// heuristic FLOOR so the recommender surfaces them, and carry a "★ Suitable" badge even
// at 0% Smogon usage. The floor never lowers an already-higher score (recovery/setup keep
// their weights). Data-driven via data/competitive-moves.json. Player-scorer only — foe
// rolls are untouched.
//
//   node --test tests/suites/story-tutor-competitive-tag.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

// A generic physical mon so the damaging branch never dominates the status picks.
const mon = { type1: 'Dark', type2: null, stats: { atk: 110, def: 80, spa: 60, spd: 80, spe: 100 }, maxHp: 300 };
const build = { m: [], n: 'Jolly', a: 'None' };
const H = (name) => w._txMoveHeuristic(name, mon, build, 'ZzSynthTestSpecies');
const tag = (name) => w._txCompetitiveTag(name);

test('data loaded: competitive-moves table is populated', () => {
  assert.ok(w.COMPETITIVE_MOVES && w.COMPETITIVE_MOVES.moves, 'table present');
  assert.ok(Object.keys(w.COMPETITIVE_MOVES.moves).length >= 30, 'has a real set of entries');
});

test('data integrity: every tagged move resolves in the move DB and its class has a floor', () => {
  // A typo'd move name or unknown class would make the badge + score floor silently
  // never fire — this guard fails loudly instead so future edits stay honest.
  const tbl = w.COMPETITIVE_MOVES.moves;
  const floors = w.COMPETITIVE_MOVES.classFloors || {};
  const badName = [], badClass = [];
  for (const [mv, e] of Object.entries(tbl)) {
    const md = ST.ensureMoveData(mv);
    if (!md || !md.type) badName.push(mv);
    if (!(e.class in floors)) badClass.push(`${mv}:${e.class}`);
  }
  assert.equal(badName.join(', '), '', 'all competitive-move names resolve in the DB');
  assert.equal(badClass.join(', '), '', 'every move class has a defined floor');
});

test('Parting Shot / Teleport / Baton Pass / Shed Tail escape the 30 filler floor', () => {
  // The class floor (72) is applied before the short-battle fit multiplier, which mildly
  // down-weights pivots for 1v1 story fights — but they still clear the 30 filler baseline
  // by a wide margin (a plain untagged status move ends up ~30).
  for (const m of ['Parting Shot', 'Teleport', 'Baton Pass', 'Shed Tail']) {
    const t = tag(m);
    assert.ok(t, `${m} is tagged`);
    assert.ok(H(m) >= 50, `${m} scores well above filler (got ${H(m)})`);
    assert.ok(H(m) > H('Splash'), `${m} outranks a true filler status move`);
  }
});

test('team-support & disruption utility (Heal Bell, Memento, Taunt) are surfaced, not filler', () => {
  for (const m of ['Heal Bell', 'Memento', 'Taunt', 'Encore']) {
    assert.ok(H(m) >= 70, `${m} scores as a real utility pick (got ${H(m)})`);
  }
});

test('the floor never LOWERS a higher score — recovery keeps its weight; untagged setup untouched', () => {
  // Recover is tagged 'recovery' (floor 90) and already scored 90 — the Math.max leaves it.
  // (A tiny short-battle fit may apply; assert it stays well above the pivot floor of 72.)
  assert.ok(H('Recover') >= 80, `Recover keeps a high recovery score (got ${H('Recover')})`);
  // Swords Dance is NOT in the competitive table → its 85 boost weight is untouched by the floor.
  assert.equal(tag('Swords Dance'), null, 'Swords Dance not in the table');
  assert.ok(H('Swords Dance') >= 80, `setup weight preserved (got ${H('Swords Dance')})`);
});

test('a plain non-utility Status move stays filler (no false positives)', () => {
  // Splash: no competitive value, not tagged → still the 30 floor (× any short-battle fit ≤ 1).
  assert.equal(tag('Splash'), null, 'Splash not tagged');
  assert.ok(H('Splash') <= 31, `Splash stays filler (got ${H('Splash')})`);
});

test('damaging pivots (U-turn) are tagged for the badge but still score on power', () => {
  const t = tag('U-turn');
  assert.ok(t && t.class === 'pivot', 'U-turn tagged as pivot');
  // U-turn is Physical 70 BP (off-STAB here) on a strong physical attacker → scores on
  // power, comfortably above a true filler status move.
  assert.ok(H('U-turn') >= 60, `U-turn scores on power (got ${H('U-turn')})`);
  assert.ok(H('U-turn') > H('Splash'), 'U-turn outranks filler');
});
