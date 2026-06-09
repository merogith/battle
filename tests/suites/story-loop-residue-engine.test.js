// Functional proof for the loop-residue mechanic (docs/story-research/08):
// the scene branch engine selects lines from the CROSS-RUN meta
// (pbs_story_meta.lastLoopChoice), so a previous run's remember/forget capstone
// surfaces in the next run's cold open. Boots battle.html via the jsdom harness
// and drives _resolveActLines (exposed as window.__narrationTest.resolveActLines).
//
// Run: node --test tests/suites/story-loop-residue-engine.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const NT = W.__narrationTest;

// jsdom serves battle.html from a file:// (opaque) origin, so window.localStorage
// throws — which is exactly why the engine wraps every readStoryMeta access in
// try/catch. Install an in-memory shim so the cross-run meta path is drivable.
const _store = new Map();
Object.defineProperty(W, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k) => (_store.has(k) ? _store.get(k) : null),
    setItem: (k, v) => { _store.set(k, String(v)); },
    removeItem: (k) => { _store.delete(k); },
    clear: () => { _store.clear(); },
  },
});

function setMeta(obj) {
  if (obj == null) W.localStorage.removeItem('pbs_story_meta');
  else W.localStorage.setItem('pbs_story_meta', JSON.stringify(obj));
}

// A minimal three-branch act mirroring event1's residue outro: remember / forget
// / when-less default (first-ever run).
const act = {
  branches: [
    { when: { meta: 'lastLoopChoice', eq: 'remember' }, lines: ['HEAVIER'] },
    { when: { meta: 'lastLoopChoice', eq: 'forget' },   lines: ['COLDER'] },
    { lines: ['FIRST_RUN'] },
  ],
};

test('meta branch resolves to the previous run\'s remember capstone', () => {
  setMeta({ lastLoopChoice: 'remember' });
  assert.deepEqual(NT.resolveActLines(act), ['HEAVIER']);
});

test('meta branch resolves to the previous run\'s forget capstone', () => {
  setMeta({ lastLoopChoice: 'forget' });
  assert.deepEqual(NT.resolveActLines(act), ['COLDER']);
});

test('no prior capstone (first-ever run) falls to the when-less default', () => {
  setMeta(null);
  assert.deepEqual(NT.resolveActLines(act), ['FIRST_RUN']);
  setMeta({ lastLoopChoice: '' });
  assert.deepEqual(NT.resolveActLines(act), ['FIRST_RUN']);
});

test('numeric meta (loop depth) supports gte for the degradation tier', () => {
  const depthAct = {
    branches: [
      { when: { meta: 'completedRuns', gte: 3 }, lines: ['WORN'] },
      { lines: ['FRESH'] },
    ],
  };
  setMeta({ completedRuns: 5 });
  assert.deepEqual(NT.resolveActLines(depthAct), ['WORN']);
  setMeta({ completedRuns: 1 });
  assert.deepEqual(NT.resolveActLines(depthAct), ['FRESH']);
});

test('the shipped main.event1 outro resolves residue from meta', () => {
  const ev1 = NT.STORY_SCENES['main.event1'];
  assert.ok(ev1 && Array.isArray(ev1.acts), 'main.event1 has acts');
  const outro = ev1.acts[ev1.acts.length - 1];
  assert.ok(Array.isArray(outro.branches), 'event1 last act is branch-driven');

  setMeta({ lastLoopChoice: 'remember' });
  const remembered = NT.resolveActLines(outro).join(' ');
  assert.match(remembered, /worn|weight|carry/i, 'remember residue reads heavier');

  setMeta({ lastLoopChoice: 'forget' });
  const forgot = NT.resolveActLines(outro).join(' ');
  assert.match(forgot, /clean|light|cold|bought/i, 'forget residue reads colder');

  setMeta(null);
  const firstRun = NT.resolveActLines(outro).join(' ');
  assert.match(firstRun, /someone you used to be/i, 'first run plants the past-you');

  // The three branches must be distinct text — proof the residue actually varies.
  assert.notEqual(remembered, forgot);
  assert.notEqual(remembered, firstRun);
});
