// Staged-NPC capability ladders (city-anchored, tunable). Verifies the stage
// resolver + names, the Battle Dojo item-tier classifier, the Awakened-ability
// city gate, the Move-Tutor staged pool fallback, and that the city-screen chip
// tags advance with the arrived city (Move Tutor / Battle Dojo / Stone Sage).
//   node --test tests/suites/story-staged-npc.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const SER = ST.STORY_EVENTS_RAW;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 0,
    team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy' } }],
    settings: { enabledGens: GENS.slice() }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {}, inventory: {}, facilityIntros: {}, facilitiesSeen: {},
    profUsed: {},
  }, extra);
  return ST.sm;
}
setSm();

const cityRow = (c) => { for (let i = 0; i < SER.length; i++) { const r = SER[i]; if (Array.isArray(r) && r[1] === 'City' && r[2] === 'City' + c) return i; } return -1; };
const renderCity = (c) => { setSm(); return W.__renderCityActionsForTest(cityRow(c)); };

test('npcStageForCity: city-anchored thresholds (dojo 2/5/8, tutor 0/4, evolab 2/4)', () => {
  assert.equal(ST.npcStageForCity('dojo', 1), 0, 'pre-debut clamps to stage 0');
  assert.equal(ST.npcStageForCity('dojo', 2), 0);
  assert.equal(ST.npcStageForCity('dojo', 4), 0);
  assert.equal(ST.npcStageForCity('dojo', 5), 1);
  assert.equal(ST.npcStageForCity('dojo', 7), 1);
  assert.equal(ST.npcStageForCity('dojo', 8), 2);
  assert.equal(ST.npcStageForCity('tutor', 0), 0);
  assert.equal(ST.npcStageForCity('tutor', 3), 0);
  assert.equal(ST.npcStageForCity('tutor', 4), 1);
  assert.equal(ST.npcStageForCity('evolab', 2), 0);
  assert.equal(ST.npcStageForCity('evolab', 3), 0);
  assert.equal(ST.npcStageForCity('evolab', 4), 1);
});

test('npcStageName: locked labels per stage', () => {
  assert.equal(ST.npcStageName('dojo', 0), 'White Belt');
  assert.equal(ST.npcStageName('dojo', 1), 'Black Belt');
  assert.equal(ST.npcStageName('dojo', 2), 'Grandmaster');
  // Phase 4.2: Move Tutor is now 3-stage with renamed labels.
  assert.equal(ST.npcStageName('tutor', 0), 'Inner Strength');
  assert.equal(ST.npcStageName('tutor', 1), 'Expert');
  assert.equal(ST.npcStageName('tutor', 2), 'Guru');
  assert.equal(ST.npcStageName('evolab', 0), 'Awakening');
  assert.equal(ST.npcStageName('evolab', 1), 'Ascension');
  assert.equal(ST.npcStageName('dojo', 9), 'Grandmaster', 'over-cap stage clamps to last label');
});

test('dojoItemTier: berries=1, decent staples=2, meta power items=3', () => {
  assert.equal(ST.dojoItemTier('Lum Berry'), 1);
  assert.equal(ST.dojoItemTier('Sitrus Berry'), 1);
  assert.equal(ST.dojoItemTier('Leftovers'), 2);
  assert.equal(ST.dojoItemTier('Eviolite'), 2);
  assert.equal(ST.dojoItemTier('Charcoal'), 2);
  assert.equal(ST.dojoItemTier('Choice Band'), 3);
  assert.equal(ST.dojoItemTier('Life Orb'), 3);
  assert.equal(ST.dojoItemTier('Assault Vest'), 3);
});

test('Awakened picks are stage-independent (lock lives in the UI/handler, not the data)', () => {
  // Awakened abilities are now SHOWN-but-LOCKED below Grandmaster (like Hidden
  // abilities at White Belt), so _opAbilitiesForMon returns the same curated set
  // at every stage; the gate moved to the card + tutorChangeAbility. Assert the
  // count is identical across stages (robust whether or not op-abilities.json
  // loaded under the jsdom fetch stub — 0===0 holds either way).
  setSm({ eventIndex: cityRow(4) });   // White Belt
  assert.equal(ST.npcStage('dojo'), 0, 'C4 is dojo stage 0');
  const wb = ST.opAbilitiesForMon('Garchomp').length;
  setSm({ eventIndex: cityRow(6) });   // Black Belt
  assert.equal(ST.npcStage('dojo'), 1, 'C6 is dojo stage 1');
  const bb = ST.opAbilitiesForMon('Garchomp').length;
  setSm({ eventIndex: cityRow(8) });   // Grandmaster
  assert.equal(ST.npcStage('dojo'), 2, 'C8 is dojo stage 2');
  const gm = ST.opAbilitiesForMon('Garchomp').length;
  assert.equal(wb, bb, 'White Belt and Black Belt expose the same Awakened data');
  assert.equal(bb, gm, 'Black Belt and Grandmaster expose the same Awakened data');
});

test('dojoAbilityUnlockStage: basic=0 (slots 0/1), Hidden=1 (slot H), off-legal Smogon=2', () => {
  setSm({ eventIndex: cityRow(8) });
  // Garchomp legal slots: Sand Veil (0), Rough Skin (H).
  assert.equal(ST.dojoAbilityUnlockStage('Garchomp', 'Sand Veil'), 0, 'slot 0 = basic / White Belt');
  assert.equal(ST.dojoAbilityUnlockStage('Garchomp', 'Rough Skin'), 1, 'slot H = Hidden / Black Belt');
  // Off-legal Smogon picks (not in any legal slot) classify as Awakened.
  assert.equal(ST.dojoAbilityUnlockStage('Garchomp', 'Sword of Ruin'), 2, 'off-legal = Awakened / Grandmaster');
  assert.equal(ST.dojoAbilityUnlockStage('Garchomp', 'Adaptability'), 2, 'off-legal = Awakened / Grandmaster');
});

test('ability cost tiers track the unlock stage (basic 2000 / Hidden 3000 / Awakened 5000)', () => {
  setSm({ eventIndex: cityRow(8) });
  assert.equal(ST.abilityCostForMon('Garchomp', 'Sand Veil'), 2000, 'basic = 2000G');
  assert.equal(ST.abilityCostForMon('Garchomp', 'Rough Skin'), 3000, 'Hidden = 3000G');
  assert.equal(ST.abilityCostForMon('Garchomp', 'Sword of Ruin'), 5000, 'Awakened = 5000G');
});

test('staged move pool: never throws, never empties, keeps known moves (dex-stub fallback)', async () => {
  setSm({ eventIndex: cityRow(0) });   // Heart Scale stage, no voucher
  const pool = await ST.tutorGetStagedMovePool('Pikachu', ['Thunderbolt']);
  assert.ok(Array.isArray(pool) && pool.length > 0, 'returns a non-empty pool');
  // A Heart Scale in the bag must not break the call (it widens to the full pool).
  setSm({ eventIndex: cityRow(0), inventory: { heartScale: 1 } });
  const widened = await ST.tutorGetStagedMovePool('Pikachu', ['Thunderbolt']);
  assert.ok(Array.isArray(widened) && widened.length > 0, 'voucher path returns a pool');
});

test('stage-up beat: one-time free use, fires once, debut grants nothing', () => {
  const sm = setSm({ eventIndex: cityRow(0), inventory: {}, npcStageSeen: {} });
  ST.npcStageUpCheck('tutor');                 // C0 = Heart Scale tier (debut)
  assert.equal(sm.npcStageSeen.tutor, 0, 'debut stage recorded');
  assert.equal(sm.inventory.heartScale | 0, 0, 'no gift at the debut tier');
  sm.eventIndex = cityRow(4);                   // → TM Expert
  ST.npcStageUpCheck('tutor');
  assert.equal(sm.npcStageSeen.tutor, 1, 'TM Expert recorded');
  assert.equal(sm.inventory.heartScale | 0, 1, 'one Heart Scale granted at TM Expert');
  ST.npcStageUpCheck('tutor');                  // re-entry must not re-gift
  assert.equal(sm.inventory.heartScale | 0, 1, 'no double-grant on re-entry');
});

test('stage-up gifts: dojo (Black Belt / Grandmaster) and Stone Sage (Ascension)', () => {
  const sm = setSm({ eventIndex: cityRow(6), inventory: {}, npcStageSeen: {} });
  ST.npcStageUpCheck('dojo');                   // first dojo visit at C6 = Black Belt
  assert.equal(sm.npcStageSeen.dojo, 1);
  assert.equal(sm.inventory.abilityCapsule | 0, 1, 'Black Belt grants an Ability Capsule');
  sm.eventIndex = cityRow(8);                    // → Grandmaster
  ST.npcStageUpCheck('dojo');
  assert.equal(sm.npcStageSeen.dojo, 2);
  assert.equal(sm.inventory.abilityCapsule | 0, 2, 'Grandmaster adds another Capsule');
  assert.equal(sm.inventory.emblemHonor | 0, 1, 'Grandmaster grants an Emblem of Honor');

  const sm2 = setSm({ eventIndex: cityRow(4), inventory: {}, npcStageSeen: {} });
  ST.npcStageUpCheck('evolab');                  // C4 = Ascension (stage 1; evolab is [2,4])
  assert.equal(sm2.npcStageSeen.evolab, 1);
  assert.equal(sm2.inventory.stoneToken | 0, 1, 'Ascension grants a Stonewise Token');
});

test('city-screen chip tags advance with the arrived city', () => {
  // Phase 4.2: Move Tutor is 3-stage — Inner Strength (C0-C3) → Expert (C4-C6) → Guru (C7+).
  assert.ok(renderCity(0).includes('Move Tutor — Inner Strength'), 'C0 Move Tutor = Inner Strength');
  assert.ok(renderCity(4).includes('Move Tutor — Expert'), 'C4 Move Tutor = Expert');
  assert.ok(renderCity(7).includes('Move Tutor — Guru'), 'C7 Move Tutor = Guru');
  assert.ok(renderCity(4).includes('Battle Dojo — White Belt'), 'C4 Dojo = White Belt');
  assert.ok(renderCity(6).includes('Battle Dojo — Black Belt'), 'C6 Dojo = Black Belt');
  assert.ok(renderCity(8).includes('Battle Dojo — Grandmaster'), 'C8 Dojo = Grandmaster');
  assert.ok(renderCity(2).includes('Stone Sage — Awakening'), 'C2 Stone Sage = Awakening');
  assert.ok(renderCity(4).includes('Stone Sage — Ascension'), 'C4 Stone Sage = Ascension');
});
