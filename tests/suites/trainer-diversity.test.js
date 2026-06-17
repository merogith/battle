// Regression tests for enemy-team DIVERSITY + sprite/type coherence:
//  1. _generateBasicTrainer matches its sprite/class to the rolled type (a Bug-typed
//     roll never lands a Swimmer sprite) — the gym-trainer path that inherits the
//     gym's preferredType is the headline case.
//  2. rollTrainerTeam honours the soft cross-encounter `avoidSpecies` nudge so a
//     one-type gym (leader + gym trainers) stops fielding the same handful of mons,
//     while staying deterministic on the seeded story stream.
//
// Reached through window.__storyTest, the harness-gated hook (window.__testHarness).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const E = await loadEngine();
const { window } = E;
const ST = window.__storyTest;
// _generateBasicTrainer is exposed on the rival-generation test surface.
const RT = window.__rivalTest;
const generateBasicTrainer = (...a) => RT.generateBasicTrainer(...a);

// Mirror of parseTrainerTypes (not on the test surface): split on / or , .
const parseTypes = (s) => String(s || '').split(/\s*[\/,]\s*/).map((t) => t.trim()).filter(Boolean);

function activeSeed(seed) {
  const sm = ST.sm;
  sm.active = true;
  sm.runSeed = seed >>> 0;
  sm._strngState = null;
  if (!sm.settings) sm.settings = {};
  sm.settings.enabledGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return sm;
}

const ALL_GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

test('generated trainer sprite/class matches the rolled (gym-inherited) type', () => {
  // The gym-trainer path passes the gym's type as preferredType; the sprite must
  // reflect it. These three types all have a dedicated Basic-Trainer class in the
  // data (Swimmer/Ace Diver, Bug Catcher, Beauty), so coherence is guaranteed —
  // it's only allowed to fail open when NO class of a type exists.
  const basics = ST.getTrainerData().filter((t) => t.role === 'Basic Trainer' && !t.tag);
  for (const want of ['Water', 'Bug', 'Fairy']) {
    let checked = 0;
    for (let i = 0; i < 12; i++) {
      activeSeed(7000 + i);
      const tr = generateBasicTrainer(3, want);
      const primary = parseTypes(tr.type)[0];
      assert.equal(primary, want, `primary type stays the gym type (${want}), got ${tr.type}`);
      // The chosen sprite/class must itself be a class whose own type covers `want`.
      const cls = basics.find(
        (b) => (b.spriteFile || b.name) === tr.spriteFile && parseTypes(b.type).includes(want)
      );
      assert.ok(cls, `sprite "${tr.spriteFile}" is an on-type ${want} class (got type ${tr.type})`);
      checked++;
    }
    assert.ok(checked > 0, `exercised the ${want} gym-trainer path`);
  }
});

test('generateBasicTrainer is deterministic on (runSeed, eventIdx)', () => {
  activeSeed(4242);
  const a = generateBasicTrainer(5, 'Water');
  activeSeed(4242);
  const b = generateBasicTrainer(5, 'Water');
  assert.deepEqual(
    { name: a.name, type: a.type, spriteFile: a.spriteFile },
    { name: b.name, type: b.type, spriteFile: b.spriteFile },
    'same seed + event reproduces the same generated trainer'
  );
});

// A no-signature, single-type trainer (gym-trainer fodder) with a large pool: every
// slot is a themed filler pick, so the avoid-set has full reach.
const waterFodder = () => ({ role: 'Basic Trainer', name: 'Swimmer', type: 'Water', sigs: [], pkmGens: ALL_GENS });
const BASIC_GW = { g1: 0, g2: 25, g3: 50, g4: 25 };

test('avoidSpecies nudges filler off species the rest of the gym already fielded', () => {
  const tr = waterFodder();
  let totalOverlap = 0;
  let rolls = 0;
  for (let i = 0; i < 20; i++) {
    activeSeed(8000 + i);
    const a = ST.rollTrainerTeam(tr, 4, BASIC_GW, ALL_GENS, 'Gym Trainer 1', 5).map((s) => s.name);
    const avoid = new Set(a);
    activeSeed(8000 + i); // SAME seed: isolates the effect of the avoid-set alone
    const b = ST.rollTrainerTeam(tr, 4, BASIC_GW, ALL_GENS, 'Gym Trainer 1', 5, avoid).map((s) => s.name);
    const overlap = b.filter((n) => avoid.has(n)).length;
    // Without the nudge, same seed reproduces team A exactly (overlap = 4). The nudge
    // must push the roster off those species; the Water pool is far larger than 4 mons.
    assert.ok(overlap < b.length, `avoid reduced overlap below full (${overlap}/${b.length}) seed ${8000 + i}`);
    totalOverlap += overlap;
    rolls++;
  }
  const avg = totalOverlap / rolls;
  assert.ok(avg <= 1, `avoid drives cross-encounter overlap near zero on a large pool (avg ${avg.toFixed(2)})`);
});

test('avoidSpecies is deterministic: same seed + same avoid-set => same team', () => {
  const tr = waterFodder();
  const avoid = new Set(['Lapras', 'Gyarados', 'Starmie']);
  const roll = () => {
    activeSeed(9090);
    return ST.rollTrainerTeam(tr, 4, BASIC_GW, ALL_GENS, 'Gym Trainer 1', 5, avoid).map((s) => s.name);
  };
  assert.deepEqual(roll(), roll(), 'avoid-set path stays reproducible on the story seed');
});

test('avoidSpecies never blocks: a pool smaller than the avoid-set still fields a full team', () => {
  // Gen-1 Ice is a famously thin type. Even if the avoid-set covers most of it, the
  // roll must fail open and still return a full party (soft nudge, never a hard filter).
  const iceFodder = { role: 'Basic Trainer', name: 'Skier', type: 'Ice', sigs: [], pkmGens: [1] };
  activeSeed(1234);
  const a = ST.rollTrainerTeam(iceFodder, 4, BASIC_GW, [1], 'Gym Trainer 1', 5).map((s) => s.name);
  const avoid = new Set(a); // pretend the whole gym already used these
  activeSeed(1234);
  const b = ST.rollTrainerTeam(iceFodder, 4, BASIC_GW, [1], 'Gym Trainer 1', 5, avoid);
  assert.equal(b.length, 4, 'still fields a full party even when avoid covers most of the pool');
  for (const s of b) assert.ok(s.name, 'every slot resolves to a species');
});

test('authored signatures are exempt from the avoid nudge (gym-leader aces stay)', () => {
  // A leader whose sigs are all in the avoid-set must still field them — the nudge
  // only touches filler, so the gym leader's identity is never diluted.
  const clair = ST.getTrainerData().find((t) => t.name === 'Clair' && t.role === 'Gym Leader 8');
  assert.ok(clair, 'Clair GL8 exists');
  const GL8_GW = { g1: 0, g2: 100, g3: 0, g4: 0 };
  const avoid = new Set(clair.sigs);
  let sawASig = false;
  for (let i = 0; i < 12 && !sawASig; i++) {
    activeSeed(5500 + i);
    const team = ST.rollTrainerTeam(clair, 6, GL8_GW, ALL_GENS, 'Gym Leader 8', 53, avoid).map((s) => s.name);
    if (team.some((n) => clair.sigs.includes(n))) sawASig = true;
  }
  assert.ok(sawASig, 'gym leader still fields signature aces despite them being in the avoid-set');
});
