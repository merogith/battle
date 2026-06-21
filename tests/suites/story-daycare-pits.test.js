// Integration test for the Daycare Inn (egg event) + Fight Club flows. Boots
// battle.html via the shared jsdom engine helper, sets up a mid-game story
// state, and drives the facilities through their real DOM (clicking rendered
// buttons) plus the exposed onBattleEnd interceptor.
//
// Design under test (post-rewrite):
//   • Daycare drop-off: parent is GONE for good; you receive a carryable EGG slot.
//   • Egg: occupies a party/PC slot, never battles, hatches in place after Gym 7.
//   • Fight Club (story, one-time): requires a full stable of 6 fighters; lock a
//     trio of 3, then a 5-round 3v3 gauntlet — each round the house fields six and
//     counter-picks its best three vs your trio. A full sweep gives +2 ALL stats
//     per round won (clamp +10) to the whole team, keeps everyone (NO release),
//     and closes the club. Lose+forfeit kills all three bracket fighters.
//   • Fight Club (endgame, post-Champion): gold only, no stat bonus, repeatable.
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

// The engine + DOM are shared across every test in this file, so strip any
// overlay a prior test left behind before each scenario (getElementById would
// otherwise return a stale overlay full of the previous test's mon ids).
function clearOverlays() {
  ['story-pits-overlay','story-pits-draft-overlay','story-pits-defeat-overlay',
   'story-daycare-overlay','story-daycare-scene','story-daycare-secret','story-daycare-idle',
   'story-hatch-scene','story-pits-win','story-pits-result','story-scene-overlay']
    .forEach(id => { const e = window.document.getElementById(id); if (e) e.remove(); });
}

// Six fighters so the Fight Club's full-stable gate is satisfied.
function setupStory() {
  clearOverlays();
  sm.active = true;
  sm.badges = 6;
  sm.gold = 10000;
  sm.eventIndex = 38; // a mid-game City row
  sm.team = freshTeam(['Garchomp', 'Gengar', 'Lapras', 'Snorlax', 'Gardevoir', 'Tyranitar']);
  sm.pcBox = [];
  sm.flags = sm.flags || {};
  // freeEggClaimed:true so enterDaycare skips the first-visit free-egg intro and
  // routes to the drop-off / secret / idle beats these tests exercise. The free-egg
  // first-visit flow has its own test below.
  sm.daycare = { unlocked: true, eggEventDone: false, freeEggClaimed: true };
  sm.scenesShown = {};
  sm.pits = {
    gym6Snapshot: { badges: 6, teamSummary: sm.team.map(t => ({ name: t.name, grade: 2, bst: 600 })), seed: 1, capturedAt: 0 },
    championSnapshot: null,
    winsThisVisit: 0, bestStreak: 0, payoutGold: 0,
    fightClubUnlocked: true, secretRevealed: true, storyClubDone: false,
  };
}

const doc = window.document;
const $ = (id) => doc.getElementById(id);
const flushTimers = () => new Promise(r => setTimeout(r, 450));

// Each round opens with a draft reveal (the house's six + its counter-picked
// three vs your locked trio). Click "send them in" to actually launch the fight.
function sendInTrio() {
  const draft = $('story-pits-draft-overlay');
  assert.ok(draft, 'round draft reveal renders before the fight');
  draft.querySelector('#pits-draft-go').click();
  return draft;
}

test('Daycare first visit: must-see intro + free Grade-3 egg, no sacrifice', () => {
  setupStory();
  sm.daycare.freeEggClaimed = false; // first visit
  sm.scenesShown = {};
  const fightersBefore = SM._countFighters();
  SM.enterDaycare();
  const intro = doc.querySelector('.story-tutorial-overlay');
  assert.ok(intro, 'the must-see Daycare intro tutorial renders on first visit');
  intro.querySelector('.story-tutorial-continue').click(); // onContinue grants the free egg
  const eggs = [...sm.team, ...sm.pcBox].filter(s => s && s.isEgg);
  assert.equal(eggs.length, 1, 'exactly one free egg is granted');
  assert.ok(eggs[0].eggSpecies, 'the free egg has a locked hatch species');
  const grade = window.__engine.getMonGrade(eggs[0].eggSpecies, window.__engine.getBST(eggs[0].eggSpecies));
  assert.equal(grade, 3, 'the free egg hatches a Grade-3 species');
  assert.equal(SM._countFighters(), fightersBefore, 'no party member was sacrificed for the free egg');
  assert.equal(sm.daycare.freeEggClaimed, true, 'freeEggClaimed flag is set so the gift is one-time');
});

test('Daycare drop-off: parent is gone for good and you receive a carryable egg', () => {
  setupStory();
  const before = sm.team.length;
  SM.enterDaycare();
  const ov = $('story-daycare-overlay');
  assert.ok(ov, 'daycare drop-off overlay renders');
  const dropBtns = ov.querySelectorAll('[data-daycare-drop]');
  assert.ok(dropBtns.length > 0, 'shows droppable mons');
  const snorlaxId = sm.team[3].id;
  const btn = Array.from(dropBtns).find(b => b.getAttribute('data-daycare-drop') === snorlaxId);
  assert.ok(btn, 'a droppable mon has a drop button');
  btn.click();
  // Parent removed and NOT replaced by a returning partner — replaced by an egg.
  assert.equal(sm.team.length, before, 'team size unchanged: parent out, egg in');
  assert.equal(sm.daycare.eggEventDone, true, 'egg event marked done (one-time)');
  const eggs = [...sm.team, ...sm.pcBox].filter(s => s && s.isEgg);
  assert.equal(eggs.length, 1, 'exactly one egg slot exists');
  assert.ok(eggs[0].eggSpecies, 'egg has a locked hatch species');
  const snorlaxStillHere = [...sm.team, ...sm.pcBox].some(s => s && !s.isEgg && s.name === 'Snorlax');
  assert.equal(snorlaxStillHere, false, 'the dropped-off Snorlax does NOT come back');
});

test('Daycare drop-off is one-time', () => {
  // continues from previous test: eggEventDone is true
  SM.enterDaycare();
  // With the egg done and badges<6-secret already satisfied (fightClubUnlocked true),
  // enterDaycare routes to the idle scene, not the drop-off picker.
  assert.ok(!$('story-daycare-overlay'), 'no second drop-off picker once the egg event is done');
});

test('Egg hatches at laid-city + 2, not before', async () => {
  setupStory(); // eventIndex=38 → a mid-game city (well past city 2)
  // An egg "laid" in a far-future city is never due (curCity < laidCity + 2).
  const future = SM._makeEggSlot('Pikachu', 999);
  sm.team.push(future);
  // _hatchEligibleEggs is async (1.6.1: it filters each hatchling's moveset to the city cap).
  assert.equal((await SM._hatchEligibleEggs()).length, 0, 'egg laid in a far city does not hatch yet');
  assert.equal(sm.team[sm.team.length - 1].isEgg, true, 'still an egg before laidCity+2');
  // An egg "laid" back at city 0 is due mid-game (curCity >= 0 + 2).
  const due = SM._makeEggSlot('Eevee', 0);
  sm.team.push(due);
  const hatched = await SM._hatchEligibleEggs();
  assert.ok(hatched.includes('Eevee'), 'egg laid back at city 0 hatches mid-game');
  assert.ok(!hatched.includes('Pikachu'), 'far-future egg has not hatched');
  const slot = sm.team.find(s => s.id === due.id);
  assert.ok(slot && !slot.isEgg, 'the due egg slot is now a real mon (isEgg cleared)');
  assert.ok(slot.build, 'hatchling has a build');
  assert.equal(slot.name, 'Eevee', 'hatchling species matches');
});

test('Egg counts as a slot but not as a fighter; can be deposited to PC', () => {
  setupStory();
  const egg = SM._makeEggSlot('Eevee', 6);
  sm.team.push(egg); // 6 fighters + 1 egg = 7 slots
  assert.equal(SM._countFighters(), 6, 'egg is not counted as a fighter');
  const before = sm.pcBox.length;
  SM.pcDeposit(egg.id);
  assert.equal(sm.pcBox.some(s => s.id === egg.id), true, 'egg can be sent to the PC');
  assert.equal(sm.pcBox.length, before + 1, 'PC gained the egg');
  assert.equal(sm.team.some(s => s.id === egg.id), false, 'egg left the party');
});

test('Fight Club requires a full stable of six fighters', () => {
  setupStory();
  sm.team = freshTeam(['Garchomp', 'Gengar', 'Lapras', 'Snorlax', 'Gardevoir']); // only 5
  SM.enterPits();
  assert.ok(!$('story-pits-overlay'), 'entry refused with fewer than six fighters');
  setupStory(); // back to 6
  SM.enterPits();
  assert.ok($('story-pits-overlay'), 'entry allowed with six fighters');
});

test('Fight Club story win: 5-round 3v3 sweep grants +10 all stats, gold, NO release, one-time', () => {
  setupStory();
  const goldBefore = sm.gold;
  const teamSizeBefore = sm.team.length;
  SM.enterPits();
  const pov = $('story-pits-overlay');
  assert.ok(pov, 'fight club overlay renders');
  assert.equal(pov.querySelectorAll('[data-pits-pick]').length, 6, 'lists all six fighters');
  const picks = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  for (const id of picks) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  const start = $('story-pits-overlay').querySelector('#pits-start-btn');
  assert.ok(start && !start.disabled, 'start enabled after 3 picks');
  start.click();
  assert.equal(sm.pits._enemyRoster.length, 5, 'rolled a 5-round gauntlet');
  // Round 1 opens with the draft reveal: the house's six + its counter-picked three.
  const draft = $('story-pits-draft-overlay');
  assert.ok(draft, 'round-1 draft reveal renders');
  assert.equal(draft.querySelectorAll('[role="list"]')[0].children.length, 6, 'house fields six');
  assert.equal(sm.pits._enemyRoster[0].picked.length, 3, 'house counter-picks exactly three');
  draft.querySelector('#pits-draft-go').click(); // send the trio in
  assert.equal(sm.pits._inBattle, true, 'marked in-battle after sending them in');

  for (let i = 0; i < 5; i++) SM.onBattleEnd(true, 'Fight Club win', '');
  assert.equal(sm.pits._inBattle, false, 'in-battle cleared after 5 wins');
  assert.ok(sm.gold > goldBefore, 'gold paid out');
  assert.equal(sm.team.length, teamSizeBefore, 'NO mons released — you keep all six');
  const allUp = sm.team.every(s => ['hp','atk','def','spa','spd','spe'].every(k => s.build.bonus[k] === 10));
  assert.ok(allUp, 'a full 5-round sweep grants +10 to every stat (+2 per round won)');
  assert.equal(sm.pits.storyClubDone, true, 'story club marked done');
  assert.equal(SM._pitsStoryAvailable(), false, 'one-time: story club no longer available');
});

test('Fight Club forfeit kills all three fighters (you do not leave whole)', async () => {
  setupStory();
  const ids = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  SM.enterPits();
  for (const id of ids) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  const totalBefore = sm.team.length + sm.pcBox.length;
  $('story-pits-overlay').querySelector('#pits-start-btn').click();
  sendInTrio();
  SM.onBattleEnd(false, 'Fight Club loss', '');
  await flushTimers();
  const dov = $('story-pits-defeat-overlay');
  assert.ok(dov, 'defeat overlay renders');
  const forfeit = dov.querySelector('#pits-defeat-forfeit');
  assert.ok(forfeit, 'crawl-home button present');
  forfeit.click();
  assert.equal(sm.team.length + sm.pcBox.length, totalBefore - 3, 'all three fighters died');
  const anyBracketLeft = [...sm.team, ...sm.pcBox].some(s => ids.includes(s.id));
  assert.equal(anyBracketLeft, false, 'none of the three survive (team or PC)');
  assert.equal(sm.pits._inBattle, false, 'club state cleared after forfeit');
  assert.equal(sm.pits.storyClubDone, false, 'a loss does NOT consume the one-time club');
});

test('Fight Club retry relaunches the same fight without killing anyone', async () => {
  setupStory();
  const ids = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  SM.enterPits();
  for (const id of ids) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  $('story-pits-overlay').querySelector('#pits-start-btn').click();
  sendInTrio();
  SM.onBattleEnd(false, 'Fight Club loss', '');
  await flushTimers();
  const dov = $('story-pits-defeat-overlay');
  const retry = dov.querySelector('#pits-defeat-retry');
  assert.ok(retry, 'step-back-in button present');
  retry.click();
  assert.equal(sm.pits._inBattle, true, 'retry re-armed the in-battle flag');
  assert.ok(sm.pits._activePickIds && sm.pits._activePickIds.length === 3, 'bracket picks preserved');
  assert.equal(sm.pcBox.length, 0, 'no deaths on retry');
});

test('Endgame Fight Club: gold only, no +1, repeatable', () => {
  setupStory();
  // Post-Champion endgame: championSnapshot present, story club already done.
  sm.pits.championSnapshot = { badges: 8, teamSummary: sm.team.map(t => ({ name: t.name, grade: 2, bst: 600 })), seed: 2, capturedAt: 0 };
  sm.pits.storyClubDone = true;
  assert.equal(SM._pitsIsEndgame(), true, 'endgame detected via championSnapshot');
  const goldBefore = sm.gold;
  // Capture the team's bonus baseline (should not change in endgame).
  const bonusBefore = sm.team.map(s => ({ ...s.build.bonus }));
  SM.enterPits();
  assert.ok($('story-pits-overlay'), 'endgame club is open');
  const picks = [sm.team[0].id, sm.team[1].id, sm.team[2].id];
  for (const id of picks) $('story-pits-overlay').querySelector(`[data-pits-pick="${id}"]`).click();
  $('story-pits-overlay').querySelector('#pits-start-btn').click();
  sendInTrio();
  for (let i = 0; i < 5; i++) SM.onBattleEnd(true, 'Fight Club win', '');
  assert.ok(sm.gold > goldBefore, 'endgame win pays gold');
  const noBuff = sm.team.every((s, i) => ['hp','atk','def','spa','spd','spe'].every(k => (s.build.bonus[k] | 0) === (bonusBefore[i][k] | 0)));
  assert.ok(noBuff, 'endgame win grants NO permanent stat bonus');
  assert.equal(SM._pitsIsEndgame(), true, 'endgame club stays open (repeatable)');
});

test('Daycare secret: going down the stairs unlocks the Fight Club', () => {
  setupStory();
  sm.daycare.eggEventDone = true;
  sm.pits.fightClubUnlocked = false;
  sm.pits.secretRevealed = false;
  sm.badges = 6;
  SM.enterDaycare();
  let ov = $('story-daycare-secret');
  assert.ok(ov, 'secret scene renders at 6 badges');
  ov.querySelector('[data-scene-opt="0"]').click();        // "Tell me"
  $('story-daycare-secret').querySelector('[data-scene-cont]').click(); // → That Night
  $('story-daycare-secret').querySelector('[data-scene-opt="0"]').click(); // "Go down the stairs"
  $('story-daycare-secret').querySelector('[data-scene-opt="0"]').click(); // "Step inside"
  assert.equal(sm.pits.fightClubUnlocked, true, 'Fight Club unlocked after stepping inside');
  assert.ok(!$('story-daycare-secret'), 'secret scene closed');
});

test('Daycare secret: walking away leaves it locked and re-offerable', () => {
  setupStory();
  sm.daycare.eggEventDone = true;
  sm.pits.fightClubUnlocked = false;
  sm.pits.secretRevealed = false;
  sm.badges = 6;
  SM.enterDaycare();
  $('story-daycare-secret').querySelector('[data-scene-opt="0"]').click();        // "Tell me"
  $('story-daycare-secret').querySelector('[data-scene-cont]').click();           // → That Night
  $('story-daycare-secret').querySelector('[data-scene-opt="1"]').click();        // "Walk away"
  assert.equal(sm.pits.fightClubUnlocked, false, 'walking away does NOT unlock');
  assert.ok(!$('story-daycare-secret'), 'scene closed');
  // Re-offerable: visiting again re-runs the secret.
  SM.enterDaycare();
  assert.ok($('story-daycare-secret'), 'secret is offered again on the next visit');
});
