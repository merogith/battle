// Unit test for the differential offline-sync planner (computeSyncPlan) in sw.js.
// A real service worker can't run under jsdom, so we extract the PURE diff function from the
// sw.js source and exercise it directly. It decides, given the new manifest files, the
// previously-applied {url:hash} map, and the URLs currently present in the cache, what to
// (re)fetch and what to delete — the core of "download only the differences".

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

function loadComputeSyncPlan() {
  const start = SW.indexOf('function computeSyncPlan');
  assert.ok(start >= 0, 'computeSyncPlan found in sw.js');
  let depth = 0, i = SW.indexOf('{', start);
  for (; i < SW.length; i++) {
    if (SW[i] === '{') depth++;
    else if (SW[i] === '}' && --depth === 0) break;
  }
  const src = SW.slice(start, i + 1);
  // Define in THIS realm (not a vm context) so returned arrays are deepEqual-comparable.
  return new Function(src + '\n; return computeSyncPlan;')();
}

const computeSyncPlan = loadComputeSyncPlan();
const F = (u, h, b = 1) => ({ u, h, b });
const setOf = (...u) => new Set(u);
const hashesOf = (...files) => Object.fromEntries(files.map((f) => [f.u, f.h]));

test('first run: nothing cached → fetch everything, remove nothing', () => {
  const files = [F('battle.html', 'a', 10), F('sprites/x.gif', 'b', 5)];
  const plan = computeSyncPlan(files, {}, setOf());
  assert.deepEqual(plan.toFetch.map((f) => f.u).sort(), ['battle.html', 'sprites/x.gif']);
  assert.deepEqual(plan.toRemove, []);
  assert.equal(plan.bytes, 15);
});

test('no change: same hashes and all present → no work', () => {
  const files = [F('battle.html', 'a'), F('sprites/x.gif', 'b')];
  const plan = computeSyncPlan(files, hashesOf(...files), setOf('battle.html', 'sprites/x.gif'));
  assert.equal(plan.toFetch.length, 0);
  assert.equal(plan.toRemove.length, 0);
  assert.equal(plan.bytes, 0);
});

test('changed file: only the changed hash is re-fetched', () => {
  const old = [F('battle.html', 'a'), F('sprites/x.gif', 'b')];
  const next = [F('battle.html', 'a2', 99), F('sprites/x.gif', 'b')];
  const plan = computeSyncPlan(next, hashesOf(...old), setOf('battle.html', 'sprites/x.gif'));
  assert.deepEqual(plan.toFetch.map((f) => f.u), ['battle.html']);
  assert.equal(plan.bytes, 99);
  assert.deepEqual(plan.toRemove, []);
});

test('new file: added to the manifest → fetched', () => {
  const old = [F('battle.html', 'a')];
  const next = [F('battle.html', 'a'), F('sprites/new.gif', 'n', 7)];
  const plan = computeSyncPlan(next, hashesOf(...old), setOf('battle.html'));
  assert.deepEqual(plan.toFetch.map((f) => f.u), ['sprites/new.gif']);
  assert.equal(plan.bytes, 7);
});

test('removed file: dropped from manifest → deleted', () => {
  const old = [F('battle.html', 'a'), F('sprites/gone.gif', 'g')];
  const next = [F('battle.html', 'a')];
  const plan = computeSyncPlan(next, hashesOf(...old), setOf('battle.html', 'sprites/gone.gif'));
  assert.equal(plan.toFetch.length, 0);
  assert.deepEqual(plan.toRemove, ['sprites/gone.gif']);
});

test('evicted but unchanged: re-fetched even though the hash matches', () => {
  const files = [F('battle.html', 'a'), F('sprites/x.gif', 'b', 4)];
  // hash unchanged, but the cache lost sprites/x.gif (quota eviction) → present omits it
  const plan = computeSyncPlan(files, hashesOf(...files), setOf('battle.html'));
  assert.deepEqual(plan.toFetch.map((f) => f.u), ['sprites/x.gif']);
  assert.equal(plan.bytes, 4);
});

test('stray cached url not in the manifest is removed (dedup with old map)', () => {
  const next = [F('battle.html', 'a')];
  const plan = computeSyncPlan(next, { 'battle.html': 'a', 'sprites/old.gif': 'o' }, setOf('battle.html', 'sprites/old.gif', 'sprites/stray.gif'));
  assert.equal(plan.toFetch.length, 0);
  assert.deepEqual(plan.toRemove.sort(), ['sprites/old.gif', 'sprites/stray.gif']);
});
