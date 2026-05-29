// Regression: STORY_EVENTS_RAW row IDs (ev[0]) are NOT array indices. A reordered
// row (the City-3 Rival) shifts later rows so id !== index, and the intro Rival's
// row ID (68) sits past the array end.
//
// ISSUE-010: five foe-scaling consumers fed a ROW ID into cityIndexFromEventIndex
// (which walks by ARRAY INDEX). For the intro Rival, cityIndexFromEventIndex(68)
// fell through to the deepest city -> City 9, so the gentle 1v1 starter duel rolled
// fully-evolved foes with hidden abilities + top item/power tier. Fixed via
// cityIndexFromRowId (row id -> array index -> city).
// ISSUE-011: GYM_CITY_LEADER_EVENT stored the array index but is used as a
// trainerAssignments key (which is row-ID-keyed) -> City 3 showed "City 3". Fixed
// by storing the row ID.
// Run: node --test tests/suites/story-rowid-city-keying.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;
const RAW = ST.STORY_EVENTS_RAW;
const INTRO = ST.STORY_RIVAL_ROW_INTRO;

test('intro Rival row ID resolves to City 0, not the deepest city (ISSUE-010)', () => {
  assert.equal(INTRO, 68, 'intro Rival row ID is the known out-of-array value');
  const city = ST.cityIndexFromRowId(INTRO);
  assert.equal(city, 0, 'intro Rival (row 68) is a City-0 starter duel');
  assert.notEqual(city, 9, 'must NOT fall through to City 9');
});

test('row IDs are unique, so row-id path agrees with array-index path (ISSUE-010)', () => {
  for (let i = 0; i < RAW.length; i++) {
    const rowId = RAW[i] && RAW[i][0];
    if (rowId == null) continue;
    // findIndex returns the first index carrying this id; uniqueness => it is i,
    // which makes cityIndexFromRowId(rowId) === cityIndexFromEventIndex(i).
    assert.equal(
      RAW.findIndex(r => r && (r[0] | 0) === (rowId | 0)), i,
      `row id ${rowId} should be unique and canonical at array index ${i}`
    );
    assert.equal(ST.cityIndexFromRowId(rowId), ST.cityIndexFromEventIndex(i),
      `city for row ${rowId} (array idx ${i}) must match the array-index walk`);
  }
});

test('intro Rival evo-stage cap is basics-only when story is active (ISSUE-010)', () => {
  const prev = ST.sm;
  ST.sm = { active: true, badges: 0, settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] } };
  try {
    // 0 = basic-only; the bug produced 2 (fully evolved) via the City-9 fall-through.
    assert.equal(ST.storyEvoStageCapForRow(INTRO), 0, 'intro Rival capped to basic stage, not fully evolved');
  } finally {
    ST.sm = prev;
  }
});

test('GYM_CITY_LEADER_EVENT stores row IDs, not array indices (ISSUE-011)', () => {
  const GE = ST.GYM_CITY_LEADER_EVENT;
  assert.ok(GE && typeof GE === 'object', 'gym-city leader map exposed');
  for (let g = 1; g <= 8; g++) {
    const row = RAW.find(r => r && r[1] === 'Battle' && String(r[2]) === `Gym Leader ${g}`);
    assert.ok(row, `Gym Leader ${g} row present in STORY_EVENTS_RAW`);
    assert.equal(GE[g], row[0] | 0, `GYM_CITY_LEADER_EVENT[${g}] must be the row ID (${row[0]}), not the array index`);
  }
});
