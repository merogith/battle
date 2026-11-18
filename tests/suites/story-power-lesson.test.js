import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { loadEngine } from '../helpers/load-engine.js';

const harness = await loadEngine();
const { window: W } = harness;
const ST = W.__storyTest;
const document = W.document;
after(() => harness.teardown());

async function element(selector) {
  for (let attempt = 0; attempt < 75; attempt++) {
    const found = document.querySelector(selector);
    if (found) return found;
    await delay(20);
  }
  assert.fail(`Missing ${selector}`);
}

test('City 5 links one newly unlocked move to the favorite partner in the Tutor', async () => {
  const rows = ST.STORY_EVENTS_RAW;
  const city = number => rows.findIndex(row => row[1] === 'City' && row[2] === `City${number}`);
  const team = [
    { id: 'pikachu', name: 'Pikachu', build: { m: ['Thunder Shock'], n: 'Hardy', a: 'Static' } },
    { id: 'gyarados', name: 'Gyarados', nickname: 'Wake', favorite: true, build: { m: ['Tackle'], n: 'Hardy', a: 'Intimidate' } },
  ];
  ST.sm = {
    ...ST.sm, active: true, badges: 4, runSeed: 17, gold: 4500, team, pcBox: [],
    storyDifficulty: 'normal', settings: { enabledGens: [1] }, inventory: { heartScale: 1 },
    scenesShown: { 'tutorial-first-tutor': true }, facilityIntros: {}, trainerAssignments: {},
  };
  assert.doesNotMatch(W.__renderCityActionsForTest(city(4)), /^ERR:/);
  assert.equal(document.querySelector('#story-city-milestone').childElementCount, 0);
  assert.doesNotMatch(W.__renderCityActionsForTest(city(5)), /^ERR:/);
  const action = await element('#story-city-milestone button');
  const move = action.querySelector('strong').textContent.match(/^Teach Wake (.+)$/)?.[1];
  assert.ok(move, 'the favorite gets priority when it has a newly unlocked lesson');
  const power = Number(action.querySelector('small').textContent.match(/(\d+) power/)?.[1]);
  assert.ok(power > 80, 'at City 4 the move was above the usual cap');
  assert.match(action.querySelector('small').textContent, /1,000G or 1 Heart Scale/);

  action.click();
  const query = await element('#screen-story-tutor:not(.hidden) input[data-kind="moves"]');
  assert.equal(query.value, move);
  assert.match(document.querySelector('#story-tutor-team').textContent, /Wake|Gyarados/);
  assert.equal(ST.sm.gold, 4500, 'opening the lesson leaves the purchase to the player');
  assert.deepEqual(team[1].build.m, ['Tackle']);
  W.__renderCityActionsForTest(city(5));
  assert.equal(document.querySelector('#story-city-milestone').childElementCount, 0, 'opening the lesson acknowledges the city tip');
});
