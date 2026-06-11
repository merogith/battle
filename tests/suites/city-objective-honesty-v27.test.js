// City objective honesty (P0.8) — the single objective line is derived from
// the SAME gate flags as the action grid, so the breadcrumb can never promise
// something the buttons don't deliver. This suite drives renderCityActions
// through the four load-bearing states and asserts rail ↔ grid agreement:
//   • start (City 0): professor objective ↔ professor-gated route button,
//   • pre-gym (gates clear): gym objective ↔ enabled gym button,
//   • swap mode (full party): swap objective ↔ swap button,
//   • camp-return revisit: "back to the road" objective ↔ the grid's only
//     forward action (the audit's one proven contradiction — the old label
//     scanned an already-cleared fight while the click warped to camp).
//   node --test tests/suites/city-objective-honesty-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let W, ST, SER;
before(async () => {
  ({ window: W } = await loadEngine());
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
});

const INTROS_ALL = { mart: 1, tutor: 1, nature: 1, evolab: 1, stoneShop: 1, link: 1, fanclub: 1, dept: 1, casino: 1, dojo: 1, evtrainer: 1, colress: 1, artifacts: 1, safari: 1, center: 1, relic: 1, bag: 1, party: 1 };

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 0, gold: 4500, runSeed: 7,
    team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } } }],
    settings: { enabledGens: [1] }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {}, inventory: {}, facilityIntros: {}, facilitiesSeen: {},
    profUsed: {}, npcStageSeen: {}, gymCleared: {}, rivalEncounterLog: [],
  }, extra);
  return ST.sm;
}

function render(eventIndex) {
  const grid = W.__renderCityActionsForTest(eventIndex);
  assert.ok(!String(grid).startsWith('ERR:'), `render failed: ${grid}`);
  const rail = (W.document.getElementById('story-city-tips') || {}).innerHTML || '';
  const objMatch = rail.match(/class="story-city-objective"[^>]*onclick="([^"]*)"[\s\S]*?obj-kicker">([^<]*)<[\s\S]*?obj-label">([^<]*)</);
  return { grid, rail, obj: objMatch ? { click: objMatch[1], kicker: objMatch[2], label: objMatch[3] } : null };
}

const cityRows = () => SER.map((r, i) => ({ r, i })).filter(({ r }) => Array.isArray(r) && r[1] === 'City');
const gymCityRow = () => cityRows().find(({ r }) => Array.isArray(r[5]) && r[5].includes('Gym Battle') && r[5].includes('Leave City'));

// ── Start state: professor gates both the objective and the route ────────────
test('City 0 start: professor objective agrees with the professor-gated route', () => {
  setSm({ team: [] });
  const { grid, obj } = render(0);
  assert.ok(obj, 'objective rendered');
  assert.equal(obj.kicker, 'START');
  assert.match(obj.label, /starter/i, 'objective points at the Lab');
  assert.match(obj.click, /enterProfessor/, 'objective clicks into the professor');
  // The grid agrees: route is locked behind the same professor visit.
  assert.match(grid, /Continue Route <span[^>]*>\(Visit Professor first\)/, 'route gated on the professor');
});

// ── Pre-gym state: gates clear → gym objective ↔ enabled gym button ──────────
test('gym city with gates clear: objective and gym button both go to the gym', () => {
  const g = gymCityRow();
  assert.ok(g, 'timeline has a gym city');
  const cityIdx = (() => { let n = 0; for (const { r, i } of cityRows()) { if (i === g.i) break; n++; } return n; })();
  setSm({
    badges: 3, eventIndex: g.i,
    facilityIntros: { ...INTROS_ALL }, facilitiesSeen: { ...INTROS_ALL },
    profUsed: { [cityIdx]: true, 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true },
    npcStageSeen: { tutor: 9, evolab: 9, dojo: 9 },
  });
  const { grid, obj } = render(g.i);
  assert.ok(obj, 'objective rendered');
  assert.match(obj.label, /Enter the Gym/, 'objective is the gym');
  assert.match(obj.click, /proceedToNextBattle/, 'objective click matches the gym button');
  assert.match(grid, /Enter the Gym/, 'gym button present');
  assert.ok(!/Enter the Gym <span[^>]*>\(Visit/.test(grid), 'gym button is NOT gated when the objective says to enter');
});

// ── Swap mode: full party + unused professor ─────────────────────────────────
test('full party: swap objective agrees with the swap button', () => {
  const six = Array.from({ length: 6 }, (_, k) => ({ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } }, id: 'm' + k }));
  // A later city (cap 6 at 4+ badges) whose professor is unused.
  const c = cityRows()[4];
  assert.ok(c, 'timeline has a 5th city');
  setSm({ badges: 8, team: six, eventIndex: c.i });
  const { grid, obj } = render(c.i);
  if (obj && /Swap a partner/.test(obj.label)) {
    assert.match(grid, /Professor — Swap a Team Member/, 'grid offers the same swap');
    assert.match(obj.click, /enterProfessor/);
  } else {
    // Professor not on this city's board — acceptable; the contract is only
    // "objective never promises a swap the grid doesn't offer".
    assert.ok(!/Swap a partner/.test((obj && obj.label) || ''), 'no phantom swap objective');
  }
});

// ── Camp-return revisit: the audit's proven contradiction ────────────────────
test('camp-return revisit: objective says back-to-the-road, never a stale fight', () => {
  const g = gymCityRow();
  const cityIdx = (() => { let n = 0; for (const { r, i } of cityRows()) { if (i === g.i) break; n++; } return n; })();
  setSm({
    badges: 3, eventIndex: g.i,
    campReturnPoint: { eventIndex: g.i + 3 },
    gymCleared: { [cityIdx]: true },
    facilityIntros: { ...INTROS_ALL }, facilitiesSeen: { ...INTROS_ALL },
    profUsed: { [cityIdx]: true, 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true },
    npcStageSeen: { tutor: 9, evolab: 9, dojo: 9 },
  });
  const { grid, obj } = render(g.i);
  assert.match(grid, /Back to the road/, 'grid shows the camp-return action');
  assert.ok(obj, 'objective rendered');
  assert.match(obj.label, /camp|road/i, 'objective points back to the road');
  assert.match(obj.click, /proceedToNextBattle/, 'objective click = the camp-return restore path');
  assert.ok(!/Route Trainer|Gym \d|Enter the Gym/.test(obj.label),
    'objective never labels a stale city-side fight');
});
