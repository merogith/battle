// Memorial — Fight Club lifetime counters + last-100 per side, plus the
// Collection tab. Enemy entries are recorded as the player sweeps each round
// (using the round's counter-picked three); player entries are recorded when
// a forfeited bracket kills the trio.
// Run: node --test tests/suites/story-fight-club-memorial.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const { window } = eng;
const SM = window.StoryMode;
const sm = SM.state;

window.confirm = () => true;
window.alert = () => {};
window.showGameAlert = () => {};
window.showToast = () => {};

function freshTeam(names) {
  return names.map((n, i) => ({
    name: n,
    id: 'mem_' + i + '_' + Math.random().toString(36).slice(2, 7),
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
function clearOverlays() {
  ['story-pits-overlay','story-pits-draft-overlay','story-pits-defeat-overlay',
   'story-hatch-scene','story-pits-win','story-pits-result','story-scene-overlay']
    .forEach(id => { const e = window.document.getElementById(id); if (e) e.remove(); });
}
function setupStory(nicks) {
  clearOverlays();
  sm.active = true;
  sm.badges = 6;
  sm.gold = 10000;
  sm.eventIndex = 38;
  const team = freshTeam(['Garchomp','Gengar','Lapras','Snorlax','Gardevoir','Tyranitar']);
  if (Array.isArray(nicks)) team.forEach((t, i) => { if (nicks[i]) t.nickname = nicks[i]; });
  sm.team = team;
  sm.pcBox = [];
  sm.flags = sm.flags || {};
  sm.daycare = { unlocked: true, eggEventDone: true };
  sm.pits = {
    gym6Snapshot: { badges: 6, teamSummary: sm.team.map(t => ({ name: t.name, grade: 2, bst: 600 })), seed: 1, capturedAt: 0 },
    championSnapshot: null,
    winsThisVisit: 0, bestStreak: 0, payoutGold: 0,
    fightClubUnlocked: true, secretRevealed: true, storyClubDone: false,
  };
  sm.memorial = null; // reset so each test starts clean
}

const doc = window.document;
const $ = (id) => doc.getElementById(id);
const flushTimers = () => new Promise(r => setTimeout(r, 450));

test('memorial defaults: empty lists, zero counters', () => {
  setupStory();
  SM.openCollection('memorial');
  assert.equal(sm.memorial.totalFallen, 0);
  assert.equal(sm.memorial.totalDefeated, 0);
  assert.equal(sm.memorial.fallen.length, 0);
  assert.equal(sm.memorial.defeated.length, 0);
  const body = doc.getElementById('collection-body');
  assert.ok(body && body.innerHTML.includes('Memorial'), 'memorial tab renders');
  assert.ok(body.innerHTML.includes("No one's fallen yet"), 'shows empty-state header note');
});

test('sweeping the bracket memorializes 3 enemies per round × 5 rounds = 15', () => {
  setupStory();
  SM.enterPits();
  const picks = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  for (const id of picks) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  $('story-pits-overlay').querySelector('#pits-start-btn').click();
  $('story-pits-draft-overlay').querySelector('#pits-draft-go').click();
  for (let i = 0; i < 5; i++) SM.onBattleEnd(true, 'win', '');
  assert.equal(sm.memorial.totalDefeated, 15, '3 per round × 5 rounds');
  assert.equal(sm.memorial.defeated.length, 15, 'all entries kept (under the 100 cap)');
  assert.equal(sm.memorial.totalFallen, 0, 'a clean sweep has no fallen of yours');
  const first = sm.memorial.defeated[0];
  assert.ok(first.nick && typeof first.nick === 'string', 'entry has a cute nick');
  assert.ok(first.flavor && typeof first.flavor === 'string', 'entry has a flavor line');
  assert.equal(first.ctx, 'Fight Club', 'entry tagged with the source');
  assert.ok(first.at > 0, 'entry timestamped');
  assert.ok(first.name && typeof first.name === 'string', 'entry knows the species (for sprite)');
});

test('forfeit memorializes your three; honors player nicknames, fills random for the unnamed', async () => {
  setupStory(['Champ', null, 'Pickles', null, null, null]); // 1st and 3rd have nicknames; 2nd does not
  const sentIds = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  SM.enterPits();
  for (const id of sentIds) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  $('story-pits-overlay').querySelector('#pits-start-btn').click();
  $('story-pits-draft-overlay').querySelector('#pits-draft-go').click();
  SM.onBattleEnd(false, 'loss', '');
  await flushTimers();
  $('story-pits-defeat-overlay').querySelector('#pits-defeat-forfeit').click();
  assert.equal(sm.memorial.totalFallen, 3, 'all three fighters memorialized');
  assert.equal(sm.memorial.fallen.length, 3);
  // unshift order = newest first; the LAST sent (Garchomp[0], Gengar[1], Lapras[2]) were pushed
  // in iteration order, so the head of the list is the last pushed = Lapras (nickname 'Pickles').
  const nicks = sm.memorial.fallen.map(e => e.nick);
  assert.ok(nicks.includes('Champ'), 'Garchomp kept its nickname');
  assert.ok(nicks.includes('Pickles'), 'Lapras kept its nickname');
  const gengarEntry = sm.memorial.fallen.find(e => e.name === 'Gengar');
  assert.ok(gengarEntry && gengarEntry.nick && gengarEntry.nick !== 'Gengar', 'unnamed mon gets a random nick');
});

test('list capped at 100; total counter keeps counting past the cap', () => {
  setupStory();
  // Hand-drive 120 enemy adds via the helper (exposed for tests).
  for (let i = 0; i < 120; i++) SM._memorialAddDefeated('Pidgey', 'Fight Club');
  assert.equal(sm.memorial.totalDefeated, 120, 'lifetime counter passes the cap');
  assert.equal(sm.memorial.defeated.length, 100, 'visible list capped at 100');
  // Same for fallen.
  for (let i = 0; i < 105; i++) SM._memorialAddFallen({ name:'Rattata', id:'r'+i }, 'Fight Club');
  assert.equal(sm.memorial.totalFallen, 105);
  assert.equal(sm.memorial.fallen.length, 100);
});

test('memorial tab renders counters and a row for each entry', () => {
  setupStory();
  SM._memorialAddDefeated('Magikarp', 'Fight Club');
  SM._memorialAddFallen({ name:'Eevee', nickname:'Doodle' }, 'Fight Club');
  SM.openCollection('memorial');
  const body = doc.getElementById('collection-body');
  const html = body.innerHTML;
  assert.ok(/Defeated/.test(html) && /Fallen/.test(html) && /Souls/.test(html), 'all three counter labels render');
  assert.ok(/Magikarp/.test(html), 'enemy species shown');
  assert.ok(/Doodle/.test(html), 'player-given nickname preserved in the row');
  // 2 entries → 2 listitem rows.
  assert.equal(body.querySelectorAll('[role="listitem"]').length, 2);
});
