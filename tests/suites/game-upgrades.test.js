import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEngine } from '../helpers/load-engine.js';
let E, W, G, store, original, fail;
const clone = x => JSON.parse(JSON.stringify(x));
const slot = (id, name = 'Pikachu') => ({ id, name, build: { m: ['Thunderbolt','Quick Attack','Thunder Wave','Protect'], a: 'Static', n: 'Timid', i: 'None', evs: {hp:0,atk:0,def:0,spa:0,spd:0,spe:0} } });
before(async () => {
  E = await loadEngine(); W = E.window; original = clone(W.StoryMode.state);
  store = new Map();
  Object.defineProperty(W,'localStorage',{configurable:true,value:{
    getItem:k=>store.get(k) ?? null,
    setItem:(k,v)=>{if(fail?.(k,v))throw new Error('Quota exceeded');store.set(k,String(v));},
    removeItem:k=>store.delete(k),clear:()=>store.clear(),
  }});
  W.eval(readFileSync(new URL('../../data/story/adventure-progress.js',import.meta.url),'utf8'));
  W.eval(readFileSync(new URL('../../game-upgrades.js',import.meta.url),'utf8'));
  G = W.GameUpgrades;
});
after(()=>E.teardown());
beforeEach(()=>{
  E.reset(); G.close(); store.clear(); fail=null; W.__storyRestoreReady=false; W.__storyExternalSave=false; W.__storySaveError=null; G.saveResult(true);
  W.__storyTest.sm={...clone(original),active:true,eventIndex:0,badges:0,gold:10000,team:[slot('first')],pcBox:[slot('second','Eevee'),slot('third','Bulbasaur')]};
});

test('Notebook and practice are deterministic, keyboard-dismissable and preserve progress',()=>{
  const before=JSON.stringify(W.StoryMode.state);
  for(const tab of ['next','team','story','rules']) G.openNotebook(tab);
  G.openPractice();
  const buttons=[...W.document.querySelectorAll('.upgrade-dialog button')];
  buttons.find(b=>b.textContent==='It is four times effective').click();
  assert.match(W.document.querySelector('.upgrade-feedback').textContent,/Correct/);
  assert.equal(JSON.stringify(W.StoryMode.state),before);
  W.document.querySelector('.upgrade-overlay').dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(W.document.querySelector('.upgrade-dialog'),null);
});

test('the opening Rival defeat shows recovery choices for a solo party', () => {
  const story = W.__storyTest;
  story.sm.eventIndex = story.STORY_EVENTS_RAW.findIndex(row => row[0] === W.__storySim.STORY_RIVAL_ROW_INTRO);
  const defeat = W.document.getElementById('screen-story-gameover');
  defeat.classList.remove('hidden');
  try {
    G.openBattleReview();
    const recovery = W.document.querySelector('.upgrade-dialog').textContent;
    assert.match(recovery, /Retry faces the same rival team/);
    assert.match(recovery, /Return to Last City gives you time to prepare/);
    assert.match(recovery, /Continue the story.*keeps your gold/);
    G.openNotebook('team');
    const notebook = W.document.querySelector('.upgrade-dialog').textContent;
    assert.match(notebook, /You have one battle-ready partner/);
    assert.doesNotMatch(notebook, /No obvious structural gap|available partner can switch/);
  } finally {
    G.close();
    defeat.classList.add('hidden');
  }
});

test('battle review tells the player what happened in a resolved Showdown turn', () => {
  const state = W.__engine.state;
  const before = state.battleEvents;
  const defeat = W.document.getElementById('screen-story-gameover');
  const wasHidden = defeat.classList.contains('hidden');
  defeat.classList.remove('hidden');
  try {
    state.battleEvents = [
      { kind:'message', text:'Pikachu used Thunderbolt!', native:{ kind:'move', tag:'move', side:'p2', subject:'Pikachu' } },
      { kind:'message', text:'It was super effective.', native:{ kind:'effect', tag:'-supereffective', side:'p1', subject:'Squirtle' } },
      { kind:'message', text:'Squirtle dropped to 0% HP.', native:{ kind:'damage', tag:'-damage', side:'p1', subject:'Squirtle' } },
    ];
    G.openBattleReview();
    const body = W.document.querySelector('.upgrade-dialog').textContent;
    assert.match(body, /What happened/);
    assert.match(body, /Thunderbolt/);
    assert.match(body, /Squirtle dropped to 0% HP/);
    assert.match(body, /Squirtle took a super-effective hit/);
    assert.doesNotMatch(body, /after the first attack/);
  } finally {
    G.close();
    state.battleEvents = before;
    defeat.classList.toggle('hidden', wasHidden);
  }
});

test('opening defeat coaching uses public move details and restores the reported blocker', () => {
  const state = W.__engine.state;
  const story = W.StoryMode;
  const rows = W.__storyTest.STORY_EVENTS_RAW;
  const row = rows.findIndex(event => event[0] === 4);
  Object.assign(story.state, {
    eventIndex: row, runSeed: 119, difficulty: 'normal',
    team: [{ ...slot('sable', 'Sandshrew'), build: { m: ['Mud-Slap'], n: 'Hardy' } }],
  });
  state.mode = 'story';
  state.turnNumber = 1;
  state.battleEvents = [];
  const report = (tag, side, subject, detail, targetSide) => state.battleEvents.push({
    turn: 1, kind: 'message', text: 'Public test event',
    native: { kind: tag === 'move' ? 'move' : 'effect', tag, side, subject, detail, targetSide },
  });
  report('move', 'p1', 'Sandshrew', 'Mud-Slap', 'p2');
  assert.equal(G.observeBattle(state.battleEvents), null, 'a move alone discloses no immunity');
  report('-immune', 'p2', 'Bronzor', '[from] ability: Levitate');
  story.onBattleEnd(false, 'Defeat', '');
  let saved = JSON.parse(store.get('pbs_story_save'));
  assert.deepEqual(saved.storyDefeatObservation, {
    rowId: 4, observation: { kind: 'immune', subject: 'Bronzor', move: 'Mud-Slap', opponent: 'Bronzor', ability: 'Levitate' },
  });
  const coach = W.document.getElementById('story-defeat-coach');
  assert.match(coach.textContent, /Levitate blocked Mud-Slap/);
  assert.doesNotMatch(coach.textContent, /switch|voucher|G\b/);
  saved.storyRetryInventorySnapshot = { potion: 1 };
  store.set('pbs_story_save', JSON.stringify(saved));
  state.battleEvents = [];
  story.continueRun();
  assert.match(coach.textContent, /Levitate blocked Mud-Slap/);
  G.openBattleReview();
  assert.match(W.document.querySelector('.upgrade-dialog').textContent, /Levitate blocked Mud-Slap/);
  assert.doesNotMatch(W.document.querySelector('.upgrade-dialog').textContent, /after the first attack/);
  G.close();
});

test('opening Gym coaching ranks public obstacles and offers only a legal status or setup response', () => {
  const state = W.__engine.state;
  const story = W.StoryMode;
  const row = W.__storyTest.STORY_EVENTS_RAW.findIndex(event => event[2] === 'Gym Leader 1');
  Object.assign(story.state, {
    eventIndex: row, runSeed: 119, difficulty: 'normal', inventory: { fullHeal: 1 },
    team: [slot('partner')],
  });
  state.mode = 'story';
  state.battleEvents = [];
  const report = (tag, side, subject, detail, targetSide) => state.battleEvents.push({
    turn: 1, kind: 'message', text: 'Public test event',
    native: { kind: tag === 'move' ? 'move' : 'effect', tag, side, subject, detail, targetSide },
  });

  report('turn', null, '1');
  report('move', 'p2', 'Bronzor', 'Light Screen');
  assert.equal(G.observeBattle(state.battleEvents), null);
  report('-sidestart', 'p2', 'p2: Opponent', 'move: Light Screen');
  let fact = G.observeBattle(state.battleEvents);
  assert.equal(G.describeBattleObservation(fact), 'Light Screen went up on the opposing side.');
  assert.match(story.upgrades.defeatPreparation(fact), /consider Pikachu’s Quick Attack/);

  report('move', 'p2', 'Bronzor', 'Bulldoze', 'p1');
  report('-supereffective', 'p1', 'Pikachu');
  report('-boost', 'p2', 'Bronzor', 'def');
  assert.equal(G.observeBattle(state.battleEvents).kind, 'super-effective');

  report('turn', null, '2');
  report('-boost', 'p2', 'Bronzor', 'def');
  assert.equal(G.describeBattleObservation(G.observeBattle(state.battleEvents)), 'Bronzor raised its Defense.');
  report('-status', 'p1', 'Pikachu', 'par');
  report('-status', 'p2', 'Bronzor', 'slp');
  story.onBattleEnd(false, 'Defeat', '');
  const saved = JSON.parse(store.get('pbs_story_save'));
  assert.equal(saved.storyDefeatObservation.observation.kind, 'status');
  assert.equal(saved.storyDefeatObservation.observation.effect, 'par');
  const coach = W.document.getElementById('story-defeat-coach');
  assert.match(coach.textContent, /Pikachu was paralyzed.*use a Full Heal/);
  saved.storyRetryInventorySnapshot = { fullHeal: 1 };
  saved.settings = { ...saved.settings, noItemRun: true };
  store.set('pbs_story_save', JSON.stringify(saved));
  state.battleEvents = [];
  story.continueRun();
  assert.match(coach.textContent, /Pikachu was paralyzed.*check your partner’s status/);
  assert.doesNotMatch(coach.textContent, /use a Full Heal/);
});

test('save failures retain the success timestamp and expose recoverable in-memory progress',()=>{
  assert.equal(W.StoryMode.upgrades.save(),true);
  const saved=store.get('pbs_story_save'), timestamp=W.StoryMode.state._lastSave;
  W.StoryMode.state.gold=11111;
  fail=k=>k==='pbs_story_save';
  assert.equal(W.StoryMode.upgrades.save(),false);
  assert.equal(store.get('pbs_story_save'),saved);
  assert.equal(W.StoryMode.state._lastSave,timestamp);
  assert.ok(W.document.getElementById('upgrade-save-alert'));
  assert.equal(G.makeBackup().entries.pbs_story_save.gold,11111);
  fail=null; assert.equal(W.StoryMode.upgrades.save(),true);
  assert.equal(W.document.getElementById('upgrade-save-alert'),null);
});

test('a save from another tab cannot be silently overwritten by stale progress',()=>{
  W.StoryMode.upgrades.save();
  const fresh=JSON.parse(store.get('pbs_story_save'));fresh.gold=1234;
  store.set('pbs_story_save',JSON.stringify(fresh));
  W.dispatchEvent(new W.StorageEvent('storage',{key:'pbs_story_save',newValue:JSON.stringify(fresh)}));
  assert.equal(W.StoryMode.upgrades.save(),false);
  assert.equal(JSON.parse(store.get('pbs_story_save')).gold,1234);
  assert.ok(W.document.getElementById('upgrade-save-alert'));
});

test('an earlier backup from the same journey keeps its recorded chapter choices', () => {
  const progress = W.AdventureProgress;
  const runId = progress.createRunId();
  Object.assign(W.StoryMode.state, { adventureRunId: runId, runSeed: 17, storyChoices: {} });
  const backup = G.makeBackup();
  backup.entries.pbs_story_meta = { completedRuns: 0, adventureArchive: progress.normalize(null) };
  const savedChoices = { 'adventure.chapter-1': 'listen', 'adventure.secret.chapter-1': true };
  const recorded = progress.record(null, { runId, seed: 17, storyChoices: savedChoices }).archive;
  store.set('pbs_story_meta', JSON.stringify({ completedRuns: 1, adventureArchive: recorded }));
  assert.equal(G.restoreBackup(backup), true);
  assert.deepEqual(JSON.parse(store.get('pbs_story_save')).storyChoices, savedChoices);
  const restored = JSON.parse(store.get('pbs_story_meta'));
  assert.equal(restored.completedRuns, 0);
  assert.equal(restored.adventureArchive.runs[runId].choices['chapter-1'], 'listen');
});

test('a backup whose run ID collides across seeds retains each journey separately', () => {
  const progress = W.AdventureProgress;
  const id = progress.createRunId();
  const localChoices = { 'adventure.chapter-1': 'listen', 'adventure.secret.chapter-1': true };
  const incomingChoices = { 'adventure.chapter-2': 'act' };
  const records = (seed, storyChoices) => progress.record(null, { runId: id, seed, storyChoices }).archive;
  Object.assign(W.StoryMode.state, { adventureRunId: id, runSeed: 22, storyChoices: {}, gold: 4300 });
  const backup = G.makeBackup();
  backup.entries.pbs_story_meta = { adventureArchive: records(22, incomingChoices) };
  const local = records(21, localChoices);
  store.set('pbs_story_meta', JSON.stringify({ adventureArchive: local }));
  assert.equal(G.restoreBackup(backup), true);
  const saved = JSON.parse(store.get('pbs_story_save'));
  assert.notEqual(saved.adventureRunId, id);
  assert.deepEqual(saved.storyChoices, incomingChoices);
  assert.equal(saved.gold, 4300);
  const restored = JSON.parse(store.get('pbs_story_meta')).adventureArchive;
  assert.deepEqual(restored.runs[id], clone(local.runs[id]));
  assert.equal(restored.runs[saved.adventureRunId].seed, 22);
  assert.deepEqual(restored.runs[saved.adventureRunId].choices, { 'chapter-2': 'act' });
});

test('a newer save stays intact when an old runtime attempts to save before receiving a storage event', () => {
  const raw = JSON.stringify({ ...clone(W.StoryMode.state), version: W.__STORY_SAVE_VER + 1, gold: 4100 });
  store.set('pbs_story_save', raw);
  assert.equal(W.StoryMode.upgrades.save(), false);
  assert.equal(store.get('pbs_story_save'), raw);
  assert.match(W.__storySaveError, /newer game version/);
});

function defeatWithQuotaError() {
  const story = W.StoryMode;
  const run = story.state;
  const eventIndex = W.__storyTest.STORY_EVENTS_RAW.findIndex(row => row[0] === 1);
  Object.assign(run, {
    eventIndex,
    runSeed: 93,
    _strngState: 120,
    inventory: { potion: 1 },
    stats: { battlesLost: 0, rivalBattlesLost: 0 },
    currentEnemyLock: { eventIdx: eventIndex, team: [slot('previous-opponent', 'Geodude')] },
  });
  assert.equal(story.upgrades.save(), true);
  run.gold = 9400;
  run.inventory.potion = 2;
  run.currentEnemyLock.team = [slot('current-opponent', 'Eevee')];
  fail = key => key === 'pbs_story_save';
  story.onBattleEnd(false, 'Defeat', '');
  assert.equal(JSON.parse(store.get('pbs_story_save')).stats.battlesLost, 0);
  assert.equal(run.stats.battlesLost, 1);
  return { story, run };
}

test('retry preserves the live defeat after its save fails', () => {
  const { story, run } = defeatWithQuotaError();
  fail = null;
  story.retryFromGameOver();
  const recovered = JSON.parse(store.get('pbs_story_save'));
  assert.equal(story.state, run);
  assert.equal(recovered.gold, 9400);
  assert.equal(recovered.inventory.potion, 2);
  assert.equal(recovered.stats.battlesLost, 1);
  assert.equal(recovered.currentEnemyLock.team[0].name, 'Eevee');
});

test('retry keeps both sessions recoverable when another tab wrote a save', () => {
  const { story, run } = defeatWithQuotaError();
  const other = JSON.parse(store.get('pbs_story_save'));
  other.gold = 7575;
  const otherSave = JSON.stringify(other);
  store.set('pbs_story_save', otherSave);
  W.dispatchEvent(new W.StorageEvent('storage', { key: 'pbs_story_save', newValue: otherSave }));
  const previousAlert = W.showGameAlert;
  let message;
  W.showGameAlert = text => { message = text; };
  try {
    story.retryFromGameOver();
    assert.match(message, /Another tab changed the save/);
    assert.equal(story.state, run);
    assert.equal(run.gold, 9400);
    assert.equal(store.get('pbs_story_save'), otherSave);
  } finally {
    W.showGameAlert = previousAlert;
  }
});

function useBattlePotion() {
  const story = W.StoryMode;
  const active = E.engine.state.pActive;
  if (active.currentHp === active.maxHp) active.currentHp--;
  story.openBattleBag();
  const potion = W.document.querySelector('#story-bag-grid [aria-label^="Potion,"]');
  assert.ok(potion);
  potion.click();
  const originalPlayTurn = W.playTurn;
  W.playTurn = () => {};
  try {
    story.useBagItemOn(0);
  } finally {
    W.playTurn = originalPlayTurn;
  }
}

async function startHardTimelineBattle(rowId = 1) {
  const storyTest = W.__storyTest;
  const run = W.StoryMode.state;
  const eventIndex = storyTest.STORY_EVENTS_RAW.findIndex(row => row[0] === rowId);
  assert.ok(eventIndex > 0);
  Object.assign(run, {
    runSeed: 93,
    eventIndex,
    storyDifficulty: 'hard',
    inventory: { potion: 2 },
    currentEnemyLock: { eventIdx: eventIndex, team: [slot('foe', 'Eevee')] },
  });
  await storyTest.launchBattle(clone(run.currentEnemyLock.team), rowId);
  return run;
}

test('closing a timeline battle keeps the encounter and restores its bag without a retreat fee', async () => {
  const run = await startHardTimelineBattle();
  const openingRng = E.engine.state.storyBattleRng.cursor;
  useBattlePotion();
  const interrupted = store.get('pbs_story_save');
  const spent = JSON.parse(interrupted);
  assert.equal(spent.inventory.potion, 1);
  assert.equal(spent.storyBattleCheckpoint.inventory.potion, 2);

  W.dispatchEvent(new W.PageTransitionEvent('pagehide', { persisted: false }));
  const saved = JSON.parse(store.get('pbs_story_save'));
  assert.equal(saved.inventory.potion, 2);
  assert.equal(saved.gold, 10000);
  assert.equal(saved.eventIndex, run.eventIndex);
  assert.deepEqual(saved.currentEnemyLock, spent.currentEnemyLock);

  // A process kill can skip pagehide. Continue from the last actual
  // battle write, including the pre-fight checkpoint.
  store.set('pbs_story_save', interrupted);
  E.reset();
  W.__storyTest.sm = { ...clone(original), active: false };
  W.StoryMode.continueRun();
  const resumed = W.StoryMode.state;
  assert.equal(resumed.inventory.potion, 2);
  assert.equal(resumed.gold, 10000);
  assert.equal(resumed.eventIndex, run.eventIndex);
  assert.equal(resumed.currentEnemyLock.team[0].name, 'Eevee');
  await W.__storyTest.launchBattle(clone(resumed.currentEnemyLock.team), 1);
  assert.equal(E.engine.state.storyBattleRng.cursor, openingRng);
});

test('closing after a saved defeat retains the retry choice and does not charge retreat', async () => {
  const run = await startHardTimelineBattle();
  useBattlePotion();
  E.engine.state.isOver = true;
  W.StoryMode.onBattleEnd(false, 'Defeat', '');
  const before = JSON.parse(store.get('pbs_story_save'));
  assert.equal(before.inventory.potion, 1);
  assert.equal(before.storyRetryInventorySnapshot.potion, 2);
  W.dispatchEvent(new W.PageTransitionEvent('pagehide', { persisted: false }));
  const after = JSON.parse(store.get('pbs_story_save'));
  assert.equal(after.gold, before.gold);
  assert.equal(after.eventIndex, before.eventIndex);
  assert.deepEqual(after.currentEnemyLock, before.currentEnemyLock);

  E.reset();
  W.__storyTest.sm = { ...clone(original), active: false };
  W.StoryMode.continueRun();
  assert.equal(W.document.getElementById('screen-story-gameover').classList.contains('hidden'), false);
  assert.equal(W.StoryMode.state.eventIndex, run.eventIndex);
  assert.equal(W.StoryMode.state.stats.battlesLost, 1);
});

test('an explicit opening Rival retreat keeps its opponent lock', async () => {
  const run = await startHardTimelineBattle(W.__storySim.STORY_RIVAL_ROW_INTRO);
  const lock = clone(run.currentEnemyLock);
  W.StoryMode.retreatToLastPokemonCenter();
  assert.equal(run.eventIndex, 0);
  assert.deepEqual(run.currentEnemyLock, lock);
  assert.equal(run.gold, 5000);
});

test('retreating from the final Rival preserves the League resume point across reload', async () => {
  const rowId = W.__storySim.STORY_RIVAL_ROW_LEAGUE;
  const run = await startHardTimelineBattle(rowId);
  const rivalIndex = run.eventIndex;
  const lock = clone(run.currentEnemyLock);
  run.badges = 8;
  run.gold = 10201;
  useBattlePotion();
  E.engine.state.isOver = true;
  W.StoryMode.onBattleEnd(false, 'Defeat', '');
  const hint = W.document.getElementById('story-gameover-center-hint');
  assert.match(hint.textContent, /costs 5,200G/);
  assert.match(W.document.getElementById('story-gameover-btn-rival-concede').textContent, /Lose all gold/);

  W.StoryMode.retreatToLastPokemonCenter();
  assert.equal(W.__storyTest.STORY_EVENTS_RAW[run.eventIndex][2], 'City9');
  assert.equal(run.gold, 5001);
  assert.equal(run.inventory.potion, 2);
  assert.deepEqual(run.currentEnemyLock, lock);
  assert.equal(JSON.parse(store.get('pbs_story_save')).storyRetreatBattleRowId, rowId);

  E.reset();
  W.__storyTest.sm = { ...clone(original), active: false };
  W.StoryMode.continueRun();
  assert.match(W.document.getElementById('screen-story-city').textContent, /Resume the League against your Rival/);
  W.StoryMode.proceedToNextBattle();
  assert.equal(W.StoryMode.state.eventIndex, rivalIndex);
  assert.equal(W.StoryMode.state.storyRetreatBattleRowId, null);
  assert.equal(W.StoryMode.state.gold, 5001);
});

test('a legacy City 9 save can recover a final Rival retreat', () => {
  const rows = W.__storyTest.STORY_EVENTS_RAW;
  const run = W.StoryMode.state;
  Object.assign(run, {
    badges: 8,
    eventIndex: rows.findIndex(row => row[2] === 'City9'),
    currentTrainerData: { name: 'Rival' },
    pits: { championSnapshot: { badges: 8 } },
  });
  delete run.storyRetreatBattleRowId;
  assert.equal(W.StoryMode.upgrades.save(), true);

  W.StoryMode.continueRun();
  W.StoryMode.proceedToNextBattle();
  assert.equal(rows[W.StoryMode.state.eventIndex][0], W.__storySim.STORY_RIVAL_ROW_LEAGUE);
});

test('a legacy defeat without an opponent lock keeps its retry and refund', async () => {
  const run = await startHardTimelineBattle();
  useBattlePotion();
  E.engine.state.isOver = true;
  W.StoryMode.onBattleEnd(false, 'Defeat', '');
  delete run.currentEnemyLock;
  assert.equal(W.StoryMode.upgrades.save(), true);

  W.dispatchEvent(new W.PageTransitionEvent('pagehide', { persisted: false }));
  const pending = JSON.parse(store.get('pbs_story_save'));
  assert.equal(pending.eventIndex, run.eventIndex);
  assert.equal(pending.gold, 10000);
  assert.equal(pending.inventory.potion, 2);
  assert.equal(pending.storyRetryInventorySnapshot.potion, 2);

  E.reset();
  W.__storyTest.sm = { ...clone(original), active: false };
  W.StoryMode.continueRun();
  const defeat = W.document.getElementById('screen-story-gameover');
  assert.equal(defeat.classList.contains('hidden'), false);
  assert.equal(W.StoryMode.state.currentEnemyLock, null);
  W.StoryMode.retryFromGameOver();
  assert.equal(defeat.classList.contains('hidden'), true);
  assert.equal(W.StoryMode.state.eventIndex, run.eventIndex);
  assert.equal(W.StoryMode.state.gold, 10000);
  assert.equal(W.StoryMode.state.inventory.potion, 2);
  assert.equal(W.StoryMode.state.storyRetryInventorySnapshot, null);
});

test('a Daycare egg stays in the party through retreat, backup restore, and reload', async () => {
  const story = W.StoryMode;
  const run = await startHardTimelineBattle(W.__storySim.STORY_RIVAL_ROW_MID);
  const egg = story._makeEggSlot('Eevee', 6);
  run.badges = 6;
  run.team.push(egg);
  E.engine.state.isOver = true;
  story.onBattleEnd(false, 'Defeat', '');

  story.retreatToLastPokemonCenter();
  assert.equal(run.team.find(mon => mon.id === egg.id), egg);
  assert.deepEqual(JSON.parse(store.get('pbs_story_save')).team.find(mon => mon.id === egg.id), clone(egg));
  assert.equal(G.restoreBackup(G.makeBackup()), true);

  E.reset();
  W.__storyTest.sm = { ...clone(original), active: false };
  story.continueRun();
  const reloadedEgg = story.state.team.find(mon => mon.id === egg.id);
  assert.deepEqual(clone(reloadedEgg), clone(egg));
});

test('an explicit Hard retreat clears the battle checkpoint and charges the existing fee', async () => {
  const run = await startHardTimelineBattle();
  const battleRow = run.eventIndex;
  useBattlePotion();
  W.StoryMode.onBattleEnd(false, 'Defeat', '');
  assert.equal(JSON.parse(store.get('pbs_story_save')).storyBattleCheckpoint, null);
  W.StoryMode.retreatToLastPokemonCenter();
  assert.equal(run.inventory.potion, 2);
  assert.equal(run.gold, 5000);
  assert.ok(run.eventIndex < battleRow);
});

test('closing an unfinished Frontier battle refunds consumed items without moving the run', async () => {
  const story = W.StoryMode;
  const run = story.state;
  const hallOfFameIndex = W.__storyTest.STORY_EVENTS_RAW.findIndex(row => row[1] === 'Hall of Fame');
  assert.ok(hallOfFameIndex > 0);
  Object.assign(run, {
    badges: 8,
    eventIndex: hallOfFameIndex,
    atCrucible: true,
    storyDifficulty: 'hard',
    inventory: { potion: 2 },
    frontier: { active: true, currentRound: 1, highscores: [] },
  });
  story.enterFrontierHub();
  await story.frontierStartNext();
  assert.equal(story.upgrades.battleActive(), true);
  assert.equal(E.engine.state.mode, 'story');

  useBattlePotion();
  assert.equal(JSON.parse(store.get('pbs_story_save')).inventory.potion, 1);

  W.dispatchEvent(new W.PageTransitionEvent('pagehide', { persisted: true }));
  assert.equal(run.inventory.potion, 1);
  W.dispatchEvent(new W.PageTransitionEvent('pagehide', { persisted: false }));
  const saved = JSON.parse(store.get('pbs_story_save'));
  assert.equal(saved.inventory.potion, 2);
  assert.equal(saved.gold, 10000);
  assert.equal(saved.eventIndex, hallOfFameIndex);
});

test('complete backups include collection and settings but exclude connection tokens',()=>{
  store.set('pbs_story_meta',JSON.stringify({achievements:{test:1}}));
  store.set('pbs_settings',JSON.stringify({musicVolume:0.2}));
  store.set('online_host_token','private');
  const backup=G.makeBackup();
  assert.deepEqual(Object.keys(backup.entries).sort(),['pbs_settings','pbs_story_meta','pbs_story_save']);
  assert.equal(backup.entries.pbs_story_meta.achievements.test,1);
  assert.equal(JSON.stringify(backup).includes('private'),false);
  assert.doesNotThrow(()=>G.validateBackup(backup));
});

test('portable backups preserve save slots and omit the originating device download',()=>{
  const localDownload = {completed:true,profile:'compact',digest:'device-pack'};
  store.set('pbs_settings',JSON.stringify({musicVolume:0.2,offlineDownload:localDownload}));
  const slot=G.makeBackup(false);
  slot.entries.pbs_settings.offlineDownload=localDownload; // Slots written by older releases.
  store.set('pbs_slot_1',JSON.stringify(slot));
  const backup=G.makeBackup();
  assert.equal(backup.entries.pbs_slot_1.entries.pbs_story_save.team[0].name,'Pikachu');
  assert.equal(backup.entries.pbs_slot_1.entries.pbs_settings.offlineDownload,undefined);
  assert.equal(backup.entries.pbs_settings.offlineDownload,undefined);
  assert.equal(G.makeBackup(false).entries.pbs_slot_1,undefined);
  const receivingDownload={completed:true,profile:'full',digest:'receiving-pack'};
  store.clear();
  store.set('pbs_settings',JSON.stringify({musicVolume:0.7,offlineDownload:receivingDownload}));
  assert.equal(G.restoreBackup(backup),true);
  assert.deepEqual(JSON.parse(store.get('pbs_settings')),{musicVolume:0.2,offlineDownload:receivingDownload});
  assert.deepEqual(JSON.parse(store.get('pbs_slot_1')),JSON.parse(JSON.stringify(backup.entries.pbs_slot_1)));
  backup.entries.pbs_slot_1.entries.pbs_slot_2=slot;
  assert.throws(()=>G.validateBackup(backup),/unknown storage entries/);
});

test('collection and preferences can transfer before creating a Story run',()=>{
  W.__storyTest.sm.active=false;
  store.set('pbs_story_meta',JSON.stringify({achievements:{test:1}}));
  store.set('pbs_accessibility',JSON.stringify({readable:true}));
  const backup=G.makeBackup();
  assert.equal(backup.entries.pbs_story_save,undefined);
  store.clear();
  assert.equal(G.restoreBackup(backup),true);
  assert.equal(store.has('pbs_story_save'),false);
  assert.deepEqual(JSON.parse(store.get('pbs_accessibility')),{readable:true});
  assert.equal(JSON.parse(store.get('pbs_story_meta')).achievements.test,1);
});

test('invalid imports reject malformed progress, storage, moves and prototype keys',()=>{
  for(const change of [b=>b.entries.pbs_story_save.eventIndex=999,
    b=>b.entries.pbs_story_save.team[0].build.m=[42],b=>b.entries.pbs_story_save.pcBox={},
    b=>b.entries.pbs_settings=[],b=>b.entries.secret={},b=>b.entries.pbs_story_save.gold=-1]) {
    const backup=G.makeBackup();change(backup);assert.throws(()=>G.validateBackup(backup));
  }
  assert.throws(()=>G.validateBackup(JSON.parse('{"__proto__":{"polluted":true}}')));
  assert.equal({}.polluted,undefined);
});

test('partial import failure rolls every written key back',()=>{
  W.StoryMode.upgrades.save();store.set('pbs_settings','{"musicVolume":0.7}');
  const before=new Map(store), backup=G.makeBackup();backup.entries.pbs_story_save.gold=123;
  let failed=false;
  fail=k=>{if(k==='pbs_settings'&&!failed){failed=true;return true;}return false;};
  assert.throws(()=>G.restoreBackup(backup),/retained for recovery/);
  assert.deepEqual(store,before);
  assert.equal(W.__storyRestoreReady,false);
});

test('restore cannot replace an active battle or be overwritten by the previous in-memory run',()=>{
  const backup=G.makeBackup();backup.entries.pbs_story_save.gold=4321;
  Object.assign(E.engine.state,{pActive:{},fActive:{},isOver:false});
  assert.throws(()=>G.restoreBackup(backup),/Finish the battle/);
  E.engine.state.isOver=true;
  assert.equal(G.restoreBackup(backup),true);
  assert.equal(W.StoryMode.upgrades.save(),false);
  assert.equal(JSON.parse(store.get('pbs_story_save')).gold,4321);
  assert.equal(G.makeBackup().entries.pbs_story_save.gold,4321);
});

test('favorite protection works in both party and storage',async()=>{
  let prompts=0;W.showGameConfirm=async()=>{prompts++;return true;};W.showGameAlert=()=>{};
  assert.equal(W.StoryMode.upgrades.favorite('second'),true);
  await W.StoryMode.pcRelease('second'); await W.StoryMode.pcSell('second');
  assert.equal(prompts,0);assert.equal(W.StoryMode.state.pcBox.length,2);
  G.openNotebook('team');assert.match(W.document.querySelector('.upgrade-dialog').textContent,/Protect partners in storage/);
  assert.equal(W.StoryMode.upgrades.favorite('second'),false);
});

test('delayed release and duplicate sale confirmations resolve stable identities only',async()=>{
  const resolvers=[];W.showGameConfirm=()=>new Promise(r=>resolvers.push(r));
  const release=W.StoryMode.pcRelease('second');
  W.StoryMode.state.pcBox.reverse();resolvers.shift()(true);await release;
  assert.deepEqual(clone(W.StoryMode.state.pcBox.map(m=>m.id)),['third']);
  const first=W.StoryMode.pcSell('third'),second=W.StoryMode.pcSell('third');
  assert.equal(resolvers.length,1,'duplicate clicks leave the original confirmation open');
  resolvers.shift()(true);await first;
  const gold=W.StoryMode.state.gold;await second;
  assert.equal(W.StoryMode.state.gold,gold);assert.equal(W.StoryMode.state.pcBox.length,0);
});

test('early EV purchase and vitamin entry points do not bypass facility gates',async()=>{
  const state=W.StoryMode.state;state.inventory={vitamin:1};
  const before=JSON.stringify({gold:state.gold,team:state.team,inventory:state.inventory});
  await W.StoryMode.evTrainerApplyPreset(0,'physical-fast');
  await W.StoryMode.evTrainerApplyPresetWithVitamin(0,'physical-fast');
  assert.equal(JSON.stringify({gold:state.gold,team:state.team,inventory:state.inventory}),before);
});

test('untimed camp activities complete or cancel exactly once',()=>{
  const outcomes=[];G.campActivity({name:'Camp'},v=>outcomes.push(v));
  const button=[...W.document.querySelectorAll('.upgrade-dialog button')].find(b=>b.textContent==='Spend time together');
  button.click();button.click();assert.deepEqual(outcomes,[true]);
  G.campActivity({name:'Camp'},v=>outcomes.push(v));
  W.document.querySelector('.upgrade-overlay').dispatchEvent(new W.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.deepEqual(outcomes,[true,null]);assert.equal(W.document.querySelector('.upgrade-dialog'),null);
});

test('reduced motion overrides live effects without overwriting visual preferences', () => {
  const settings = W.StoryMode.upgrades.settings();
  const keys = ['animations', 'weatherAnimation', 'ambientParticles'];
  const initial = keys.map(key => settings[key]);
  [settings.animations, settings.weatherAnimation, settings.ambientParticles] = [true, false, true];
  G.openPreferences();
  const settingLabel = [...W.document.querySelectorAll('.upgrade-preference')].find(label => label.textContent === 'Reduce interface motion');
  const checkbox = settingLabel.querySelector('input');
  const setReduce = checked => {
    checkbox.checked = checked;
    checkbox.dispatchEvent(new W.Event('change'));
  };
  try {
    setReduce(true);
    assert.deepEqual(keys.map(key => settings[key]), [false, false, false]);
    W.StoryMode.upgrades.persistSettings();
    const stored = JSON.parse(store.get('pbs_settings'));
    assert.deepEqual(keys.map(key => stored[key]), [true, false, true]);
    setReduce(false);
    assert.deepEqual(keys.map(key => settings[key]), [true, false, true]);
  } finally {
    setReduce(false);
    keys.forEach((key, index) => { settings[key] = initial[index]; });
  }
});

test('interrupted import recovery runs before game settings and save hydration',()=>{
  const html=readFileSync(new URL('../../battle.html',import.meta.url),'utf8');
  assert.ok(html.indexOf('<script src="game-upgrades.js"')<html.indexOf("const _pbsEarly"));
  store.set('pbs_restore_pending',JSON.stringify({pbs_story_save:'{"gold":10}',pbs_settings:null}));
  store.set('pbs_story_save','{"gold":100}');store.set('pbs_settings','{}');
  W.eval(readFileSync(new URL('../../game-upgrades.js',import.meta.url),'utf8'));
  assert.equal(store.get('pbs_story_save'),'{"gold":10}');assert.equal(store.has('pbs_settings'),false);
  assert.equal(store.has('pbs_restore_pending'),false);
});
