// Verify the offline learnsets and shared city move tiers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

function cityRowIdx(targetCity) {
  // Return the ROW ID (ev[0]) of the target city's hub row — that is what
  // storyGateFoeMovesByCity expects (it resolves row id → city via
  // _cityIndexForStoryRow). Returning the bare array index mis-resolves cities
  // in the reordered mid-rival region (e.g. C3) to a lower stage.
  for (let ei = 0; ei <= 120; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === targetCity) { const row = ST.STORY_EVENTS_RAW && ST.STORY_EVENTS_RAW[ei]; return row ? (row[0] | 0) : ei; }
  }
  return 0;
}
// Resolve a city that sits at the given tutor stage (0/1/2), so tests don't hardcode
// city numbers against the NPC_STAGE_CITY.tutor thresholds (which the user tunes).
function cityAtTutorStage(stage) {
  for (let c = 0; c <= 12; c++) { if ((ST.npcStageForCity('tutor', c) | 0) === stage) return c; }
  return 0;
}
function primeStory() {
  ST.sm.active = true;
  ST.sm.runSeed = 1;
  ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 0;
}
const bp = (m) => { try { const md = ST.ensureMoveData ? ST.ensureMoveData(m) : (w.movesDB && w.movesDB[m]); return md ? (md.pow | 0) : 0; } catch (e) { return 0; } };

test('Phase 0: the precomputed move-tag index is loaded offline (no CDN)', () => {
  const idx = w.MOVE_TAG_INDEX || {};
  assert.ok(idx.species && Object.keys(idx.species).length > 1000, 'index has 1000+ species');
  assert.ok(Array.isArray(idx.moves) && idx.moves.length > 500, 'index has a move table');
});

test('Phase 0: classification is served from the index (deterministic)', async () => {
  primeStory();
  const learn = await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.ok(learn._fromIndex, 'Garchomp tags came from the precomputed index');
  assert.ok(learn.natural.length && learn.learnt.length, 'both buckets populated offline');
  assert.equal(ST.moveTagForSpecies('Garchomp', 'Earthquake'), 'learnt', 'Earthquake is a TM (Learnt)');
  assert.equal(ST.moveTagForSpecies('Garchomp', 'Outrage'), 'natural', 'Outrage is a level-up (Natural)');
});

test('towns unlock five tiers and a starter moves up one whole tier', () => {
  assert.deepEqual(Array.from({ length: 9 }, (_, city) => ST.storyMoveTierForCity(city)), [1, 2, 2, 3, 3, 4, 4, 5, 5]);
  for (let city = 0; city < 9; city++) {
    assert.equal(ST.storyMoveTierForCity(city, true), Math.min(5, ST.storyMoveTierForCity(city) + 1));
  }
  assert.deepEqual(Array.from({ length: 8 }, (_, city) => ST.storyMoveBpCapForCity(city)), [40, 60, 60, 80, 80, 100, 100, Infinity]);
});

test('impact ranks utility and conditional damage alongside base power', () => {
  const expected = {
    'Sand Attack': 1, Ember: 1, 'Quick Attack': 2, Growl: 1,
    'Swords Dance': 3, 'Stealth Rock': 3, 'U-turn': 3, 'Seismic Toss': 3,
    Roost: 3, 'Rain Dance': 3, 'Sticky Web': 4, Spore: 4, Return: 4, 'Shell Smash': 4,
    Magnitude: 4, 'Double Team': 4, 'Rage Fist': 5, Fissure: 5, 'Sheer Cold': 5,
  };
  for (const [move, tier] of Object.entries(expected)) assert.equal(ST.storyMoveImpactTier(move), tier, move);
});

test('City 5 unlocks Earthquake for both sides and keeps Outrage for the final tier', async () => {
  primeStory();
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(5));
  assert.ok(!team[0].build.m.includes('Outrage'));
  assert.ok(team[0].build.m.includes('Earthquake'));
  assert.ok(team[0].build.m.includes('Stone Edge'));
  assert.ok(team[0].build.m.includes('Dragon Claw'));
});

test('Phase 1: stage 2 (Guru) leaves moves untouched', async () => {
  primeStory();
  const team = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(2)));
  assert.deepEqual(team[0].build.m, ['Earthquake', 'Outrage', 'Stone Edge', 'Swords Dance']);
});

test('Phase 4: coherent downgrade keeps the build on-identity (STAB attacker)', async () => {
  primeStory();
  // Garchomp = Dragon/Ground, physical. A downgraded Inner build (BP cap + Learnt
  // stripped) should lead with its own STAB attacks (not generic filler / off-stat).
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Swords Dance'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(cityAtTutorStage(0)));
  const types = team[0].build.m.map(m => { const md = ST.ensureMoveData(m); return md ? md.type : '?'; });
  const stab = types.filter(t => t === 'Dragon' || t === 'Ground').length;
  assert.ok(stab >= 1, `coherent downgrade keeps ≥1 STAB move (got types ${types.join(',')})`);
  // No purely-special off-stat dump: at least one physical attack survives (Atk≥SpA mon).
  const cats = team[0].build.m.map(m => { const md = ST.ensureMoveData(m); return md ? md.cat : '?'; });
  assert.ok(cats.includes('Physical'), `physical attacker keeps a physical move (got ${cats.join(',')})`);
});

test('Phase 4: coherent ranker orders STAB damage above utility', async () => {
  primeStory();
  await ST.tutorFetchLearnsetMoveNames('Garchomp');
  const ranked = ST.storyCoherentMoveRanker(['Sandstorm', 'Dragon Claw', 'Sand Tomb'], 'Garchomp');
  assert.notEqual(ranked[0], 'Sandstorm', 'a STAB attack outranks a weather utility move');
});

test('E1: degenerate ceiling fallback never empties the set, picks lowest BP', async () => {
  primeStory();
  // Beldum at C0 (cap 40): its ONLY Natural move is Take Down (90 BP), above the cap.
  // With NO ≤cap option in the allowed pool, the fallback must still yield a move (the
  // lowest-BP one) — not crash or leave an empty moveset.
  const learn = await ST.tutorFetchLearnsetMoveNames('Beldum'); // warm _tutorLearnsetCache
  assert.ok(learn.natural.length, 'precondition: Beldum has ≥1 Natural move');
  const build = { m: ['Flash Cannon', 'Meteor Mash', 'Bullet Punch', 'Zen Headbutt'] };
  const changed = ST.storyApplyMoveStageToBuild(build, 'Beldum', 1);
  assert.equal(changed, true, 'build changed — all originals were off-ceiling');
  assert.ok(build.m.length >= 1, 'fallback always yields at least one move (never empty)');
  const minNatBp = Math.min(...learn.natural.map(bp));
  assert.equal(bp(build.m[0].split('/')[0]), minNatBp, 'fallback picks the lowest-BP Natural move');
});
