// Integration test for the v20 Daycare + Underground Pits flows. Boots
// battle.html via the shared jsdom engine helper, sets up a mid-game story
// state, and drives the new facilities through their real DOM (clicking the
// rendered buttons) plus the exposed onBattleEnd interceptor.
//
// Run: node --test tests/suites/story-daycare-pits.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const { window } = eng;
const SM = window.StoryMode;
const sm = SM.state;

// jsdom doesn't implement confirm/alert — stub so the forfeit confirm() returns true.
window.confirm = () => true;
window.alert = () => {};
window.showGameAlert = () => {};
window.showToast = () => {};

// Note: launchBattle / startBattle are script-scope declarations the StoryMode
// IIFE closes over, so they can't be stubbed from here. Instead we let the real
// (idle, non-auto-playing) battle setup run and drive resolution through the
// exposed onBattleEnd interceptor — the same pattern the story walkthrough uses.
function freshTeam(names) {
  return names.map((n, i) => ({
    name: n,
    id: 'mon_' + i + '_' + Math.random().toString(36).slice(2, 7),
    build: {
      m: ['Tackle', 'Tackle', 'Tackle', 'Tackle'],
      i: null, a: null, n: 'Hardy',
      ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
      evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
      bonus: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
      tired: 0,
    },
  }));
}

function setupStory() {
  sm.active = true;
  sm.badges = 6;
  sm.gold = 10000;
  sm.eventIndex = 38; // a mid-game City row
  sm.team = freshTeam(['Garchomp', 'Gengar', 'Lapras', 'Snorlax']);
  sm.pcBox = [];
  sm.flags = sm.flags || {};
  sm.daycare = { unlocked: true, state: 'idle', parentMonId: null, egg: null, endgame: false, parentSnapshot: null };
  sm.pits = {
    gym6Snapshot: { badges: 6, teamSummary: sm.team.map(t => ({ name: t.name, grade: 2, bst: 600 })), seed: 1, capturedAt: 0 },
    winsThisVisit: 0, bestStreak: 0, bondedMonIds: [], lastEnemyRoster: null, payoutGold: 0,
  };
}

const doc = window.document;
const $ = (id) => doc.getElementById(id);
const flushTimers = () => new Promise(r => setTimeout(r, 450));

test('Daycare: drop-off transitions to incubating and removes the parent', () => {
  setupStory();
  const before = sm.team.length;
  SM.enterDaycare();
  const ov = $('story-daycare-overlay');
  assert.ok(ov, 'daycare overlay renders');
  const dropBtns = ov.querySelectorAll('[data-daycare-drop]');
  assert.ok(dropBtns.length > 0, 'shows droppable mons');
  const snorlaxId = sm.team[3].id;
  const btn = Array.from(dropBtns).find(b => b.getAttribute('data-daycare-drop') === snorlaxId);
  assert.ok(btn, 'last party mon has a drop button');
  btn.click();
  assert.equal(sm.daycare.state, 'incubating', 'state → incubating');
  assert.ok(sm.daycare.egg && sm.daycare.egg.species, 'egg species locked at drop-off');
  assert.equal(sm.team.length, before - 1, 'parent removed from party');
  assert.equal(sm.daycare.parentSnapshot && sm.daycare.parentSnapshot.name, 'Snorlax', 'parent snapshot captured');
});

test('Daycare: no pickup before Gym 7, hatch returns parent + hatchling at Gym 7', () => {
  // continues from previous test's incubating state
  sm.badges = 6;
  SM.enterDaycare();
  let ov = $('story-daycare-overlay');
  assert.ok(!ov.querySelector('#daycare-pickup-btn'), 'no pickup button before Gym 7');
  ov.querySelector('#daycare-close-btn').click();

  sm.badges = 7;
  SM.enterDaycare();
  ov = $('story-daycare-overlay');
  const pickup = ov.querySelector('#daycare-pickup-btn');
  assert.ok(pickup, 'pickup button appears at Gym 7');
  const preHatch = sm.team.length + sm.pcBox.length;
  pickup.click();
  assert.equal(sm.daycare.state, 'idle', 'daycare resets to idle');
  assert.equal(sm.daycare.egg, null, 'egg cleared');
  assert.equal(sm.team.length + sm.pcBox.length, preHatch + 2, 'parent + hatchling both returned');
  assert.ok([...sm.team, ...sm.pcBox].some(s => s.name === 'Snorlax'), 'parent is back');
});

test('Pits: pick 3, win bracket → +1 all stats on whole team, gold, bonded', () => {
  setupStory();
  const goldBefore = sm.gold;
  SM.enterPits();
  let pov = $('story-pits-overlay');
  assert.ok(pov, 'pits overlay renders');
  assert.equal(pov.querySelectorAll('[data-pits-pick]').length, 4, 'lists 4 party mons');
  const picks = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  for (const id of picks) {
    $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  }
  const start = $('story-pits-overlay').querySelector('#pits-start-btn');
  assert.ok(start && !start.disabled, 'start enabled after 3 picks');
  start.click();
  assert.equal(sm.pits._inBattle, true, 'marked in-battle');
  assert.equal(sm.pits._enemyRoster.length, 3, 'rolled 3 enemy fights');

  for (let i = 0; i < 3; i++) SM.onBattleEnd(true, 'Pit win', '');
  assert.equal(sm.pits._inBattle, false, 'in-battle cleared after 3 wins');
  assert.ok(sm.gold > goldBefore, 'gold paid out');
  const allUp = sm.team.every(s => ['hp','atk','def','spa','spd','spe'].every(k => s.build.bonus[k] >= 1));
  assert.ok(allUp, 'every team member +1 all stats');
  assert.equal(sm.pits.bondedMonIds.length, 3, '3 bracket mons bonded');
});

test('Pits: bonded mons auto-release on city return', () => {
  // continues from the won bracket
  const before = sm.team.length;
  const bonded = sm.pits.bondedMonIds.length;
  assert.ok(bonded > 0, 'precondition: some bonded mons');
  SM.enterCity();
  assert.equal(sm.pits.bondedMonIds.length, 0, 'bonded list cleared on city return');
  assert.equal(sm.team.length, before - bonded, 'bonded mons removed from party');
});

test('Pits: forfeit kills exactly one bracket mon, two go to PC', async () => {
  setupStory();
  const ids = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  SM.enterPits();
  for (const id of ids) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  const totalBefore = sm.team.length + sm.pcBox.length;
  $('story-pits-overlay').querySelector('#pits-start-btn').click();
  SM.onBattleEnd(false, 'Pit loss', '');
  await flushTimers();
  const dov = $('story-pits-defeat-overlay');
  assert.ok(dov, 'defeat overlay renders');
  const forfeit = dov.querySelector('#pits-defeat-forfeit');
  assert.ok(forfeit, 'forfeit button present');
  forfeit.click();
  assert.equal(sm.team.length + sm.pcBox.length, totalBefore - 1, 'exactly one mon died');
  assert.ok(sm.pcBox.length >= 2, 'two survivors in PC');
  assert.equal(sm.pits._inBattle, false, 'pit state cleared after forfeit');
});

test('Pits: retry relaunches the same fight without killing anyone', async () => {
  setupStory();
  const ids = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  SM.enterPits();
  for (const id of ids) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  $('story-pits-overlay').querySelector('#pits-start-btn').click();
  SM.onBattleEnd(false, 'Pit loss', '');
  await flushTimers();
  const dov = $('story-pits-defeat-overlay');
  const retry = dov.querySelector('#pits-defeat-retry');
  assert.ok(retry, 'retry button present');
  retry.click();
  // Retry re-enters the bracket: in-battle flag re-armed, picks preserved, no deaths.
  assert.equal(sm.pits._inBattle, true, 'retry re-armed the in-battle flag');
  assert.ok(sm.pits._activePickIds && sm.pits._activePickIds.length === 3, 'bracket picks preserved');
  assert.equal(sm.pcBox.length, 0, 'no deaths on retry');
});
