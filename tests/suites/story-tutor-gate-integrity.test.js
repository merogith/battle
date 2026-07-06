// Move-tutor overhaul — gate integrity (Q2b / Q3 / Q4 / gift parity).
//
// Q2b: Unleashed (tutor stage 1, C3–5) additionally unlocks Learnt STATUS moves —
//      the mid-game build unlock — for the PLAYER POOL and the FOE GATE from the
//      same shared rule (_storyIsStatusMoveName inside _storyApplyMoveStageToBuild /
//      _tutorGetStagedMovePoolAsync). Damaging Learnt moves still wait for Guru.
// Q3:  Evolution backfill obeys the current city's stage gate (kept moves never
//      stripped) — evolving pre-Guru must not mint Learnt/Awakened Smogon moves.
// Q4:  Post-game Crucible re-entries (sm.crucibleBattleSource) skip the historical
//      city move gate — a T4 GL1 rematch no longer fights with 40-BP Inner moves.
// Gift parity: the professor swap / send-to-PC paths call the same city filter as
//      the append path (defense-in-depth; the C8 legendary gate is Guru anyway).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

function primeStory(city) {
  ST.sm.active = true;
  ST.sm.runSeed = 1;
  ST.sm._strngState = null;
  if (!ST.sm.settings) ST.sm.settings = {};
  ST.sm.settings.enabledGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ST.sm.badges = Math.max(0, (city | 0) - 1);
  ST.sm.crucibleBattleSource = null;
  if (city != null) {
    let idx = 0;
    for (let ei = 0; ei <= 140; ei++) {
      let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
      if (c === city) { idx = ei; break; }
    }
    ST.sm.eventIndex = idx;
  }
}
function cityRowIdx(targetCity) {
  for (let ei = 0; ei <= 140; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === targetCity) { const row = ST.STORY_EVENTS_RAW && ST.STORY_EVENTS_RAW[ei]; return row ? (row[0] | 0) : ei; }
  }
  return 0;
}
const tag = (mon, m) => { try { return ST.moveTagForSpecies(mon, String(m).split('/')[0]); } catch (e) { return 'unknown'; } };
const bp = (m) => { const md = ST.ensureMoveData(String(m).split('/')[0]); return md ? (md.pow | 0) : 0; };
const isStatus = (m) => { const md = ST.ensureMoveData(String(m).split('/')[0]); return !!(md && md.cat === 'Status'); };

// Fixture sanity — Garchomp: Toxic/Protect are Learnt STATUS, Earthquake is Learnt
// damaging, Bulldoze is Natural 60. If the tag index shifts these, fix fixtures.
test('fixture sanity: Garchomp tags', async () => {
  await ST.tutorFetchLearnsetMoveNames('Garchomp');
  assert.equal(tag('Garchomp', 'Toxic'), 'learnt');
  assert.ok(isStatus('Toxic'));
  assert.equal(tag('Garchomp', 'Earthquake'), 'learnt');
  assert.ok(!isStatus('Earthquake'));
  assert.equal(tag('Garchomp', 'Bulldoze'), 'natural');
});

test('Q2b player pool: Unleashed offers Learnt STATUS moves, still no Learnt damage', async () => {
  primeStory(3); // tutor stage 1 (Unleashed), city BP cap 80
  const pool = await ST.tutorGetStagedMovePool('Garchomp', []);
  assert.ok(pool.includes('Toxic'), 'Toxic (Learnt status) teachable at Unleashed');
  assert.ok(pool.includes('Protect'), 'Protect (Learnt status) teachable at Unleashed');
  assert.ok(!pool.includes('Earthquake'), 'Earthquake (Learnt damaging) still Guru-locked');
  assert.ok(pool.includes('Bulldoze'), 'Natural moves unaffected');
});

test('Q2b player pool: Inner still excludes Learnt status (unlock is C3, not C0)', async () => {
  primeStory(0);
  const pool = await ST.tutorGetStagedMovePool('Garchomp', []);
  assert.ok(!pool.includes('Toxic'), 'Toxic locked at Inner');
  assert.ok(!pool.includes('Protect'), 'Protect locked at Inner');
});

test('foe gate: foes keep legal moves at C3; over-cap damage stripped', async () => {
  // Build-diversity overhaul: foes keep the full LEGAL pool subject only to the
  // per-city BP cap (no player-style category gate). At C3 (cap 80): Toxic (status)
  // and Dragon Claw (80) survive; Earthquake (100) is stripped as over-cap.
  primeStory(3);
  const team = [{ name: 'Garchomp', build: { m: ['Toxic', 'Bulldoze', 'Earthquake', 'Dragon Claw'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(3));
  assert.ok(team[0].build.m.includes('Toxic'), 'foe keeps legal status Toxic at C3');
  assert.ok(!team[0].build.m.includes('Earthquake'), 'foe loses Earthquake (100 BP) — over the C3 cap (80)');
});

test('foe gate: at Inner (C0) foes keep legal status but strip over-cap damage (Phase 1)', async () => {
  // Phase 1 (build-diversity): the foe gate is BP-capped, not category-gated — Toxic
  // (legal, 0-BP status) survives even at Inner; Bulldoze (60 BP) exceeds the C0 cap
  // (40) and is stripped. (The PLAYER gate still withholds Learnt status until C3 —
  // see the player-pool tests above; the two models diverge here by design.)
  primeStory(0);
  const team = [{ name: 'Garchomp', build: { m: ['Toxic', 'Bulldoze'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(0));
  assert.ok(team[0].build.m.includes('Toxic'), 'foe keeps legal status Toxic at C0 (Phase 1)');
  assert.ok(!team[0].build.m.includes('Bulldoze'), 'Bulldoze (60 BP) stripped over the C0 cap (40)');
});

test('Q4 crucible: an off-timeline Crucible battle skips the historical city gate', async () => {
  primeStory(9);
  ST.sm.crucibleBattleSource = 'rematch';
  const team = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Fire Blast'] } }];
  await ST.storyGateFoeMovesByCity(team, cityRowIdx(1)); // GL1-era row
  assert.deepEqual(team[0].build.m, ['Outrage', 'Earthquake', 'Stone Edge', 'Fire Blast'],
    'full post-game moveset survives a GL1 rematch re-entry');
  ST.sm.crucibleBattleSource = null;
  const team2 = [{ name: 'Garchomp', build: { m: ['Outrage', 'Earthquake', 'Stone Edge', 'Fire Blast'] } }];
  await ST.storyGateFoeMovesByCity(team2, cityRowIdx(1));
  assert.notDeepEqual(team2[0].build.m, ['Outrage', 'Earthquake', 'Stone Edge', 'Fire Blast'],
    'control: the same row IS gated on the normal timeline');
});

test('gift parity guard: swap and send-to-PC paths call the shared city filter', () => {
  const swapSrc = String(w.StoryMode._mysteryDoSwap || '');
  const pcSrc = String(w.StoryMode._mysterySendToPc || '');
  assert.ok(swapSrc.includes('_storyFilterBuildMovesForCity'), '_mysteryDoSwap filters the gift build');
  assert.ok(pcSrc.includes('_storyFilterBuildMovesForCity'), '_mysterySendToPc filters the gift build');
});

test('Q3 evolution: pre-Guru backfill obeys the stage gate; kept moves are never stripped', async () => {
  primeStory(3); // Unleashed, cap 80
  await ST.tutorFetchLearnsetMoveNames('Garchomp');
  // Outrage (Natural 120) is over the C3 cap — an equipped move the gate would
  // normally refuse. It must SURVIVE evolution (kept-moves invariant), while
  // every backfilled move obeys the stage rules.
  ST.sm.team = [{ name: 'Gabite', id: 'm_evotest1', build: { m: ['Outrage'], n: 'Jolly', a: 'Rough Skin' } }];
  const ok = await w.__story.applyEvolution('m_evotest1', 'Garchomp');
  assert.equal(ok, true, 'evolution applied');
  const evolved = ST.sm.team[0];
  assert.equal(evolved.name, 'Garchomp');
  const moves = (evolved.build.m || []).map((m) => String(m).split('/')[0]);
  assert.ok(moves.includes('Outrage'), 'kept move survives even though it is over-stage');
  for (const m of moves) {
    if (m === 'Outrage') continue; // the protected carry
    const t = tag('Garchomp', m);
    const okByStage = (t === 'natural' && (isStatus(m) || bp(m) <= 80))
      || (t === 'learnt' && isStatus(m))
      || t === 'unknown';
    assert.ok(okByStage, `backfilled "${m}" (tag ${t}, ${bp(m)} BP) obeys the Unleashed gate`);
  }
});
