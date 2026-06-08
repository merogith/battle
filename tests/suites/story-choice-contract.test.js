// Stream 2 §9.2 / §10 — choice-contract guard.
//
// The four choice "types" (FLAVOR / CONSEQUENCE / ILLUSION / NO-BLIND) all ride
// on ONE engine contract: at most one choice per scene; a choice persists
// (persistKey) and never forks which beat fires next; a later act reacts via
// branches.when:{key,eq}. Stream 2's §9.2 ask #4 to Stream 4 is "keep the choice
// contract byte-identical." This guard locks that shape on the live STORY_SCENES
// so the externalization / speaker-block work (Stream 4) can't drift it.
//
// Boots the engine (the schema is closure-internal; exposed via __narrationTest).
// Run: node --test tests/suites/story-choice-contract.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const S = eng.window.__narrationTest.STORY_SCENES;

// Keys that would mean "this pick changes which beat/battle fires next" — the one
// thing the schema forbids (choices are self-contained; the path never forks).
const FORK_KEYS = ['next', 'goto', 'jump', 'beat', 'fireBeat', 'fork', 'route'];
const hasForkKey = (o) => o && typeof o === 'object' && FORK_KEYS.some((k) => k in o);

test('every scene has at most one choice (across all its acts)', () => {
  for (const [k, sc] of Object.entries(S)) {
    if (!Array.isArray(sc.acts)) continue;
    const n = sc.acts.filter((a) => a && a.choice).length;
    assert.ok(n <= 1, `${k}: ${n} choices found — schema allows at most one per scene`);
  }
});

test('every choice has persistKey + well-formed options[label,value,reply]', () => {
  for (const [k, sc] of Object.entries(S)) {
    if (!Array.isArray(sc.acts)) continue;
    for (const act of sc.acts) {
      const ch = act && act.choice;
      if (!ch) continue;
      assert.equal(typeof ch.persistKey, 'string', `${k}: choice.persistKey must be a string`);
      assert.ok(ch.persistKey.length > 0, `${k}: choice.persistKey must be non-empty`);
      assert.ok(Array.isArray(ch.options) && ch.options.length >= 2,
        `${k}: choice.options must have >= 2 options`);
      assert.ok(!hasForkKey(ch), `${k}: choice must not carry a path-forking key`);
      for (const opt of ch.options) {
        assert.equal(typeof opt.label, 'string', `${k}: option.label must be a string`);
        assert.ok(opt.label.length > 0, `${k}: option.label must be non-empty`);
        assert.ok(opt.value !== undefined && opt.value !== '', `${k}: option.value must be set`);
        assert.ok(Array.isArray(opt.reply) && opt.reply.length >= 1,
          `${k}: option.reply must be a non-empty array (the self-contained consequence)`);
        opt.reply.forEach((l) => assert.equal(typeof l, 'string', `${k}: reply lines are strings`));
        assert.ok(!hasForkKey(opt), `${k}: option must not carry a path-forking key`);
      }
    }
  }
});

test('branches are when:{key,eq} entries with a single trailing default', () => {
  for (const [k, sc] of Object.entries(S)) {
    if (!Array.isArray(sc.acts)) continue;
    for (const act of sc.acts) {
      if (!act || !Array.isArray(act.branches)) continue;
      let defaults = 0;
      act.branches.forEach((b, i) => {
        assert.ok(Array.isArray(b.lines) && b.lines.length >= 1, `${k}: branch must have lines`);
        assert.ok(!hasForkKey(b), `${k}: branch must not carry a path-forking key`);
        if (b.when === undefined) {
          defaults++;
          assert.equal(i, act.branches.length - 1, `${k}: the when-less default branch must be last`);
        } else {
          assert.equal(typeof b.when.key, 'string', `${k}: branch.when.key must be a string`);
          assert.ok('eq' in b.when, `${k}: branch.when must carry an eq value`);
        }
      });
      assert.ok(defaults <= 1, `${k}: at most one when-less default branch`);
    }
  }
});

test('every persisted choice value is reachable by some branch OR is honest FLAVOR', () => {
  // Not every persistKey must be read back (FLAVOR is recorded-not-read by design),
  // but if a branch references a key, that key must be a real persistKey somewhere —
  // a `when` pointing at a non-existent key is a silently-dead branch.
  const persistKeys = new Set();
  for (const sc of Object.values(S)) {
    if (!Array.isArray(sc.acts)) continue;
    for (const act of sc.acts) if (act && act.choice) persistKeys.add(act.choice.persistKey);
  }
  for (const [k, sc] of Object.entries(S)) {
    if (!Array.isArray(sc.acts)) continue;
    for (const act of sc.acts) {
      if (!act || !Array.isArray(act.branches)) continue;
      for (const b of act.branches) {
        if (b.when && b.when.key) {
          assert.ok(persistKeys.has(b.when.key),
            `${k}: branch.when.key "${b.when.key}" matches no choice.persistKey (dead branch)`);
        }
      }
    }
  }
});
