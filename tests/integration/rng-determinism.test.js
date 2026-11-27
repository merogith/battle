import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installWritableStorage, loadEngine } from '../helpers/load-engine.js';

// Verifies the Math.random patch installed alongside storyRngNext routes
// every random call through the seeded LCG when sm.active && sm.runSeed != null.
// Without this patch, the engine had 262 bare Math.random sites that drifted
// story replays — confirmed by battle-engine-debugger (ISSUE-006,007,012,013,
// 014,015,018,024,032 in the ledger).

test('Math.random returns native value when no story run is active', async () => {
  const { window } = await loadEngine();
  // Ensure sm.active is not true
  if (window.sm) window.sm.active = false;
  const a = window.Math.random();
  const b = window.Math.random();
  assert.ok(typeof a === 'number' && a >= 0 && a < 1);
  assert.ok(typeof b === 'number' && b >= 0 && b < 1);
  // Two consecutive calls under the harness's mulberry32 should advance
  // (extremely unlikely to be equal — odds ~ 2^-32).
  assert.notEqual(a, b);
});

test('Math.random routes through storyRngNext when sm.active && sm.runSeed != null', async () => {
  const { window } = await loadEngine();
  if (!window.sm) {
    // Story-mode module not yet initialized in harness — skip.
    return;
  }
  // Set up a fake active story run
  window.sm.active = true;
  window.sm.runSeed = 12345;
  window.sm._strngState = null; // force re-init from runSeed

  const reseed = () => {
    window.sm._strngState = null;
    window.sm.runSeed = 12345;
  };

  reseed();
  const seqA = [];
  for (let i = 0; i < 8; i++) seqA.push(window.Math.random());

  reseed();
  const seqB = [];
  for (let i = 0; i < 8; i++) seqB.push(window.Math.random());

  assert.deepEqual(seqA, seqB, 'two seeded runs at the same seed must produce identical Math.random sequences');
});

test('Math.random sequence depends on runSeed (different seed → different sequence)', async () => {
  const { window } = await loadEngine();
  if (!window.sm) return;

  window.sm.active = true;

  window.sm.runSeed = 100;
  window.sm._strngState = null;
  const a = [];
  for (let i = 0; i < 6; i++) a.push(window.Math.random());

  window.sm.runSeed = 200;
  window.sm._strngState = null;
  const b = [];
  for (let i = 0; i < 6; i++) b.push(window.Math.random());

  assert.notDeepEqual(a, b, 'different seeds must produce different sequences');
});

test('Math.random falls back to native when sm.active=true but sm.runSeed=null (no infinite recursion)', async () => {
  const { window } = await loadEngine();
  if (!window.sm) return;
  window.sm.active = true;
  window.sm.runSeed = null;
  // Suppress the expected console.warn from storyRngNext's no-seed branch
  const origWarn = window.console.warn;
  window.console.warn = () => {};
  try {
    const v = window.Math.random();
    assert.ok(typeof v === 'number' && v >= 0 && v < 1, `expected number in [0,1), got ${v}`);
  } finally {
    window.console.warn = origWarn;
    window.sm.active = false;
  }
});

test('sm.active toggling restores native behavior cleanly', async () => {
  const { window } = await loadEngine();
  if (!window.sm) return;

  window.sm.active = true;
  window.sm.runSeed = 9999;
  window.sm._strngState = null;
  const seeded1 = window.Math.random();

  window.sm.active = false;
  const native1 = window.Math.random();
  const native2 = window.Math.random();

  window.sm.active = true;
  window.sm._strngState = null; // reset to same starting state
  window.sm.runSeed = 9999;
  const seeded2 = window.Math.random();

  assert.equal(seeded1, seeded2, 'same seed + reset state → same first roll, even after toggling active off and back on');
  assert.notEqual(native1, native2, 'native rolls between the seeded ones are non-deterministic (mulberry32 in harness, native in browser)');
});

test('starting a new adventure rolls the story tracks from its own seed', async () => {
  const { window, seedRng, nextFloat } = await loadEngine();
  installWritableStorage(window);
  const story = window.StoryMode;
  const storyTest = window.__storyTest;
  const previousRun = { ...storyTest.sm, active: true, runSeed: 314159, _strngState: 913 };
  storyTest.sm = previousRun;
  seedRng(90210);
  const expectedRunSeed = (nextFloat() * 0x100000000) | 0;
  seedRng(90210);

  const original = window.storyRngNext;
  const draws = [];
  window.storyRngNext = () => {
    const roll = original();
    draws.push({ seed: story.state.runSeed, roll });
    return roll;
  };
  try {
    story.startNewRun();
  } finally {
    window.storyRngNext = original;
  }

  assert.equal(story.state.runSeed, expectedRunSeed);
  assert.equal(previousRun._strngState, 913, 'starting a new story leaves the previous stream untouched');
  assert.deepEqual(draws.slice(0, 2).map(draw => draw.seed), [expectedRunSeed, expectedRunSeed]);
  assert.deepEqual(
    [story.state.tracks.villain, story.state.tracks.extra],
    [storyTest.VILLAIN_TRACKS[Math.floor(draws[0].roll * storyTest.VILLAIN_TRACKS.length)],
      storyTest.EXTRA_TRACKS[Math.floor(draws[1].roll * storyTest.EXTRA_TRACKS.length)]],
  );
});

test('a timeline rematch rewinds combat rolls without rewinding world or presentation randomness', async () => {
  const { window, engine, reset, logs } = await loadEngine();
  const testStory = window.__storyTest;
  const eventIndex = testStory.STORY_EVENTS_RAW.findIndex(row => row[0] === 1);
  const rowId = testStory.STORY_EVENTS_RAW[eventIndex][0];
  const makeSlot = (name, move) => ({
    name, build: { m: [move], n: 'Hardy', a: 'None', _isShiny: false },
  });
  const run = {
    ...testStory.sm,
    active: true,
    runSeed: 65432,
    _strngState: 775,
    eventIndex,
    inventory: {},
    team: [makeSlot('Pikachu', 'Thunderbolt')],
    stats: { battlesLost: 0, rivalBattlesLost: 0 },
  };
  testStory.sm = run;

  async function firstTurn(presentationDraws) {
    reset();
    const worldCursor = run._strngState;
    await testStory.launchBattle([makeSlot('Eevee', 'Tackle')], rowId);
    assert.equal(engine.state.mode, 'story');
    assert.equal(run._strngState, worldCursor, 'battle setup leaves the world stream alone');
    const cursor = engine.state.storyBattleRng.cursor;
    for (let i = 0; i < presentationDraws; i++) window.Math.random();
    assert.equal(engine.state.storyBattleRng.cursor, cursor, 'effects cannot consume the encounter stream');
    logs.length = 0;
    await window.playTurn(0, null);
    assert.equal(run._strngState, worldCursor, 'turn resolution leaves the world stream alone');
    return {
      hp: [engine.state.pActive.currentHp, engine.state.fActive.currentHp],
      pp: [engine.state.pActive.moves[0].pp, engine.state.fActive.moves[0].pp],
      cursor: engine.state.storyBattleRng.cursor,
      logs: logs.map(entry => entry.text),
    };
  }

  const first = await firstTurn(0);
  assert.ok(first.logs.length);
  window.StoryMode.onBattleEnd(false, 'Defeat', '');
  assert.equal(engine.state.storyBattleRng, null);
  for (let i = 0; i < 8; i++) window.storyRngNext();
  assert.notEqual(run._strngState, 775);
  assert.deepEqual(await firstTurn(80), first);
});
