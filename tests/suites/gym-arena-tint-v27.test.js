// P2c — story marquee arena tint. refreshBattleBg adds battle-tint-<type> to
// #screen-battle ONLY for story Gym Leader / Elite Four / Champion fights
// (type = the assigned trainer's primary type; "Mixed" league fights fall
// back to battle-tint-league), and strips it for everything else — routes,
// Quick Play / pve, PvP — so the shared stadium stays clean outside story
// marquee fights. CSS-only grade; bg_*.png art untouched.
//   node --test tests/suites/gym-arena-tint-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let E, W, ST, SER;
before(async () => {
  E = await loadEngine();
  W = E.window;
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
});

const rowIdx = (pred) => SER.findIndex(r => Array.isArray(r) && r[1] === 'Battle' && pred(String(r[2] || '')));
const tints = () => [...W.document.getElementById('screen-battle').classList].filter(c => c.startsWith('battle-tint-'));

function setStory(eventIndex, trainerType) {
  ST.sm = {
    active: true, eventIndex, badges: 3, team: [], settings: { enabledGens: [1] },
    currentTrainerData: trainerType ? { name: 'Tint Test', type: trainerType } : null,
  };
}

test('story gym leader battle tints the arena with the gym type', () => {
  const i = rowIdx(e => /^Gym Leader 1$/.test(e));
  assert.ok(i >= 0, 'timeline has Gym Leader 1');
  E.engine.state.mode = 'story';
  setStory(i, 'Rock');
  W.refreshBattleBg();
  assert.deepEqual(tints(), ['battle-tint-rock']);
});

test('dual-typed leader uses the primary type', () => {
  const i = rowIdx(e => /^Gym Leader/.test(e));
  E.engine.state.mode = 'story';
  setStory(i, 'Water/Ground');
  W.refreshBattleBg();
  assert.deepEqual(tints(), ['battle-tint-water']);
});

test('Champion with type "Mixed" falls back to the league tint', () => {
  const i = rowIdx(e => e === 'Champion');
  assert.ok(i >= 0, 'timeline has a Champion row');
  E.engine.state.mode = 'story';
  setStory(i, 'Mixed');
  W.refreshBattleBg();
  assert.deepEqual(tints(), ['battle-tint-league']);
});

test('story route battle strips any prior tint and stays clean', () => {
  // Leave a stale tint from the previous test, then render a route fight.
  const i = rowIdx(e => e === 'Basic Trainer');
  assert.ok(i >= 0, 'timeline has a Basic Trainer row');
  E.engine.state.mode = 'story';
  setStory(i, 'Rock');
  W.refreshBattleBg();
  assert.deepEqual(tints(), [], 'route fights are never tinted (stale tint stripped)');
});

test('non-story modes are never tinted, even on a gym row', () => {
  const i = rowIdx(e => /^Gym Leader/.test(e));
  setStory(i, 'Rock');
  for (const mode of ['pve', 'pvp', 'gauntlet']) {
    E.engine.state.mode = mode;
    // Plant a stale tint to prove the strip runs unconditionally.
    W.document.getElementById('screen-battle').classList.add('battle-tint-fire');
    W.refreshBattleBg();
    assert.deepEqual(tints(), [], `mode=${mode} stays clean`);
  }
});
