import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const baseStats = W.__rivalTest.baseStats;

function setup(gens, eventId, badges = 0) {
  const position = ST.STORY_EVENTS_RAW.findIndex(row => row[1] === 'Battle' && row[0] === eventId);
  ST.sm.active = true;
  ST.sm.settings = { enabledGens: gens, teraOn: true };
  ST.sm.eventIndex = position;
  ST.sm.badges = badges;
  ST.sm.runSeed = 253;
  ST.sm._strngState = null;
  ST.sm.crucibleBattleSource = null;
  return ST.STORY_EVENTS_RAW[position];
}

test('thin early themes fill the roster within both caps and the enabled generations', () => {
  const cases = [
    { gens: [1], id: 4, trainer: { type: 'Fairy', sigs: ['Clefairy'] }, size: 2 },
    { gens: [2], id: 5, trainer: { type: 'Steel', sigs: ['Skarmory'] }, size: 2 },
    { gens: [1], id: 10, trainer: { type: 'Fire', sigs: ['Flareon'] }, size: 3 },
    { gens: [1], id: 24, trainer: { type: 'Electric', sigs: ['Electabuzz'] }, size: 5 },
  ];
  for (const { gens, id, trainer, size } of cases) {
    const row = setup(gens, id);
    const team = ST.rollTrainerTeam(trainer, size, row[3], gens, row[2], id);
    assert.equal(team.length, size);
    for (const { name } of team) {
      assert.ok(gens.includes(baseStats[name].gen), `#${id} ${name}: enabled generation`);
      assert.ok(ST.storyEvoStageOf(name) <= ST.storyEvoStageCapForRow(id), `#${id} ${name}: early evolution limit`);
      assert.ok(W.__rivalTest.getMonGrade(name, W.__rivalTest.getBST(name)) >= ST.storyEnemyGradeCeilingForRow(id),
        `#${id} ${name}: early grade limit`);
    }
  }
});

test('an early Gym Leader rematch gets the endgame kit and move power', () => {
  const gens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const row = setup(gens, 5, 8);
  const trainer = { type: 'Rock', sigs: ['Onix', 'Geodude'] };
  const storyState = { mode: 'story' };
  assert.equal(W._storyBattleBpCap({}, false, storyState), 60);
  ST.sm.crucibleBattleSource = 'gym';
  const team = ST.rollTrainerTeam(trainer, 6, row[3], gens, row[2], row[0]);
  assert.equal(team.length, 6);
  assert.ok(team.some(slot => ST.storyEvoStageOf(slot.name) > 0));
  for (const { build } of team) {
    assert.equal(Object.values(build.evs).reduce((sum, value) => sum + value, 0), 508);
    assert.ok(Object.values(build.ivs).every(iv => iv === 31));
  }
  assert.equal(W._storyBattleBpCap({}, false, storyState), Infinity);
  assert.equal(W._storyBattleBpCap({}, true, storyState), Infinity);
  ST.sm.crucibleBattleSource = null;
});

test('the team preview uses badge-based sizes and leaves the live run untouched', () => {
  const gens = [1, 2];
  setup(gens, 5);
  const saved = ST.sm;
  saved.trainerAssignments = { 5: 'Brock' };
  saved.themedAssignments = { 45: 'veteran' };
  saved.runRivalSpriteFile = 'Red';
  saved.usedTrainerNames = ['Brock'];
  const original = JSON.stringify(saved);
  const opts = { seed: 7, enabledGens: gens, difficulty: 'hard', partySize: 1 };
  const all = ST.simulateStoryRunTeams(opts);
  const league = ST.simulateStoryRunTeams({ ...opts, filter: 'league' });
  assert.equal(all.error, null);
  assert.equal(league.error, null);
  const size = id => all.rows.find(row => row.eid === id).partySize;
  assert.equal(size(68), 1);
  assert.equal(size(5), 2);
  assert.equal(size(11), 3);
  assert.equal(size(53), 6);
  for (const row of league.rows) {
    const copy = all.rows.find(other => other.eid === row.eid);
    assert.equal(JSON.stringify(row.team), JSON.stringify(copy.team));
  }
  assert.equal(ST.sm, saved);
  assert.equal(JSON.stringify(saved), original);
});
