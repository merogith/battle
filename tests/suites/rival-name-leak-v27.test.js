// Rival identity leak guard (P0.4) — §11.1: the rival is generic. The rolled
// canonical identity (Blue/Silver/Gladion/…) exists only for quote lookups
// and sprite selection; it must NEVER render to the player. Three surfaces
// leaked it: the city-hub "Next" objective label, the victory card's rival
// aftermath attribution, and the concede alert. All now route through
// _rivalDisplayName().
//   node --test tests/suites/rival-name-leak-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const ROLLED = 'Blue'; // the rolled identity we plant everywhere a leak could read it

let W, ST, SER;
before(async () => {
  ({ window: W } = await loadEngine());
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
  assert.ok(ST, 'story test surface exposed');
});

// All facility intros / professor visits marked done so the hub's objective
// precedence chain (START / NEW HERE tiers) falls through to the next-battle
// label — the surface under test.
const INTROS_ALL = { mart: 1, tutor: 1, nature: 1, evolab: 1, stoneShop: 1, link: 1, fanclub: 1, dept: 1, casino: 1, dojo: 1, evtrainer: 1, colress: 1, artifacts: 1, safari: 1, center: 1, relic: 1, bag: 1, party: 1 };

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 1, gold: 4500, runSeed: 12345,
    team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } } }],
    settings: { enabledGens: [1] }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {}, inventory: {},
    facilityIntros: { ...INTROS_ALL }, facilitiesSeen: { ...INTROS_ALL },
    profUsed: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true },
    npcStageSeen: { tutor: 9, evolab: 9, dojo: 9 }, gymCleared: {}, rivalEncounterLog: [],
  }, extra);
  return ST.sm;
}

const rivalRows = () => SER.map((r, i) => ({ r, i }))
  .filter(({ r }) => Array.isArray(r) && r[1] === 'Battle' && r[2] === 'Rival');

// ── City hub "Next" objective label ──────────────────────────────────────────
test('hub Next label says "Rival", never the rolled identity', () => {
  // Every (city row → its next battle is a Rival row) pair on the timeline.
  const nextBattleAfter = (i) => {
    for (let j = i + 1; j < SER.length; j++) {
      const r = SER[j];
      if (Array.isArray(r) && r[1] === 'Battle') return j;
    }
    return -1;
  };
  const pairs = [];
  for (let i = 0; i < SER.length; i++) {
    const r = SER[i];
    if (!Array.isArray(r) || r[1] !== 'City') continue;
    const nb = nextBattleAfter(i);
    if (nb >= 0 && SER[nb][2] === 'Rival') pairs.push({ city: i, rival: nb });
  }
  assert.ok(pairs.length > 0, 'timeline has at least one city → rival seam');

  let sawRivalLabel = false;
  for (const { city, rival } of pairs) {
    setSm({ eventIndex: city, trainerAssignments: { [SER[rival][0] | 0]: ROLLED } });
    W.__renderCityActionsForTest(city);
    const rail = (W.document.getElementById('story-city-tips') || {}).innerHTML || '';
    assert.ok(!rail.includes(ROLLED), `city@${city}: rolled identity must not render in the rail`);
    if (rail.includes('🏁')) {
      sawRivalLabel = true;
      assert.match(rail, /🏁 Rival/, `city@${city}: rival objective uses the generic label`);
    }
  }
  assert.ok(sawRivalLabel, 'at least one city rendered the rival objective label');
});

// ── Victory card rival aftermath ─────────────────────────────────────────────
test('victory card attributes the rival aftermath to "Rival"', () => {
  const { r, i } = rivalRows()[0];
  setSm({
    eventIndex: i,
    currentTrainerData: { name: ROLLED, role: 'Rival', type: 'Mixed' },
    trainerAssignments: { [r[0] | 0]: ROLLED },
  });
  W.__victoryInputArmMs = 0;
  ST.showVictoryOverlay('VICTORY!', 500, true, () => {}, 'Rival', r[0] | 0, []);

  const ov = W.document.querySelector('div[role="dialog"][aria-label="VICTORY!"]');
  assert.ok(ov, 'victory overlay rendered');
  assert.ok(!ov.innerHTML.includes(ROLLED), 'rolled identity must not render on the card');
  assert.match(ov.innerHTML, /Rival: "/, 'aftermath line attributed to the generic Rival');

  const cont = [...ov.querySelectorAll('button')].find(b => /Continue/.test(b.textContent || ''));
  if (cont) cont.click();
});

// ── Concede alert ────────────────────────────────────────────────────────────
test('concede alert attributes the rival line to "Rival"', () => {
  // Prefer a rival row directly followed by a City row so the post-concede
  // processNextEvent lands on the quiet city path.
  const rows = rivalRows();
  const pick = rows.find(({ i }) => Array.isArray(SER[i + 1]) && SER[i + 1][1] === 'City') || rows[0];
  setSm({
    eventIndex: pick.i,
    currentTrainerData: { name: ROLLED, role: 'Rival', type: 'Mixed' },
    trainerAssignments: { [pick.r[0] | 0]: ROLLED },
  });

  let alertMsg = '';
  const prevAlert = W.showGameAlert;
  W.showGameAlert = (m) => { alertMsg = String(m || ''); };
  try { W.StoryMode.acceptRivalLossAndContinue(); }
  catch (e) { /* downstream flow may need fuller state — the alert fires first */ }
  finally { W.showGameAlert = prevAlert; }

  assert.ok(alertMsg, 'concede alert fired');
  assert.ok(!alertMsg.includes(ROLLED), 'rolled identity must not appear in the concede alert');
  assert.match(alertMsg, /Rival: "/, 'rival line attributed to the generic Rival');
});
