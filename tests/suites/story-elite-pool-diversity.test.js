// Locks in the Elite-Four pool-diversity fix: the canonical-name pinning
// (STORY_LOCKED_ELITE_NAMES / assignTrainers "Pass 2.5") was removed so that ANY elite member can
// appear in ANY run, independent of the generation lock. Before the fix a default run always pinned
// E1=Lorelei, E2=Bruno, E4=Lance — only E3 varied. This suite asserts:
//   1. each E-slot surfaces most of its roster across seeds (no slot is pinned to one name);
//   2. appearance is gen-agnostic (an off-gen elite still candidates in a single-gen run);
//   3. run-wide dedup still excludes an already-used name from later picks;
//   4. end-to-end, the four league rows yield varying identities run-to-run.
//
// Run: node --test tests/suites/story-elite-pool-diversity.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__rivalTest;
const S = eng.window.__storyTest;
const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const base = (n) => E.baseTrainerName(n);

function prime() {
  E.sm.active = false;
  E.sm.storyDifficulty = 'normal';
  if (!E.sm.settings) E.sm.settings = {};
  E.sm.settings.enabledGens = GENS.slice();
}
prime();

// How many distinct E-slot members exist per role in the data — the diversity target keys off this.
const rosterCount = (role) => E.TRAINER_DATA.filter((t) => t.role === role).length;

test('no E-slot is pinned: each Elite Four slot surfaces most of its roster across seeds', () => {
  for (const role of ['E1', 'E2', 'E3', 'E4']) {
    const total = rosterCount(role);
    assert.ok(total >= 6, `${role} should have a deep enough roster to test (got ${total})`);
    const seen = new Set();
    for (let s = 0; s < 200; s++) {
      eng.seedRng(60000 + s);
      const t = E.selectTrainerForRole(role, GENS, new Set());
      if (t) seen.add(base(t.name));
    }
    // Pre-fix this would have been exactly 1 (always the locked name). Require broad coverage.
    assert.ok(
      seen.size >= total - 1,
      `${role} should surface nearly its whole roster across seeds (saw ${seen.size}/${total}: ${[...seen].join(', ')})`,
    );
  }
});

test('gen-independent appearance: an off-gen canonical elite still candidates in a single-gen run', () => {
  // Lorelei (E1, charGen 1), Bruno (E2, charGen 1) and Lance (E4, charGen 1) must all still be
  // reachable in a Gen-5-ONLY run — appearance is decoupled from the generation lock.
  const GEN5 = [5];
  const seen = (role, name, n = 400) => {
    for (let s = 0; s < n; s++) {
      eng.seedRng(61000 + s);
      const t = E.selectTrainerForRole(role, GEN5, new Set());
      if (t && t.name === name) return true;
    }
    return false;
  };
  assert.ok(seen('E1', 'Lorelei'), 'Lorelei (Gen 1) is an E1 candidate in a Gen-5-only run');
  assert.ok(seen('E2', 'Bruno'), 'Bruno (Gen 1) is an E2 candidate in a Gen-5-only run');
  assert.ok(seen('E4', 'Lance'), 'Lance (Gen 1) is an E4 candidate in a Gen-5-only run');
});

test('run-wide dedup: an already-used elite never fills a later E-slot', () => {
  // Spend an E1 pick, then confirm that name never reappears when rolling E1 with it marked used.
  eng.seedRng(62000);
  const first = E.selectTrainerForRole('E1', GENS, new Set());
  assert.ok(first, 'E1 returns a candidate');
  const used = new Set([base(first.name)]);
  for (let s = 0; s < 200; s++) {
    eng.seedRng(62000 + s);
    const t = E.selectTrainerForRole('E1', GENS, used);
    assert.notEqual(base(t.name), base(first.name), `used elite reappeared at seed ${62000 + s}`);
  }
});

test('end-to-end: the four league rows vary across runs (full assignTrainers + sim pipeline)', () => {
  const byRole = { E1: new Set(), E2: new Set(), E3: new Set(), E4: new Set(), Champion: new Set() };
  for (let s = 0; s < 30; s++) {
    const res = S.simulateStoryRunTeams({ seed: 70000 + s, enabledGens: GENS, difficulty: 'normal', partySize: 6 });
    assert.equal(res.error, null, `sim threw at seed ${70000 + s}: ${res.error}`);
    for (const r of res.rows) {
      if (byRole[r.eventName]) byRole[r.eventName].add(base(r.trainer));
    }
  }
  for (const role of ['E1', 'E2', 'E3', 'E4', 'Champion']) {
    assert.ok(
      byRole[role].size >= 3,
      `${role} should vary run-to-run (saw ${byRole[role].size} distinct: ${[...byRole[role]].join(', ')})`,
    );
  }
});
