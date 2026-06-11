// Story DESIGNED-build archetype engine (data-driven). makeDesignedBuild's 30% share now
// builds a coherent set from an archetype's move-slot distribution (stab/coverage/status/
// setup/recovery/hazard), synergy-scores the fill (Protect+Toxic, Rest+Sleep Talk…), and
// uses a stat-sensitive EV spread — instead of the old greedy top-4 + frozen 252/252.
// Tables live in data/build-archetypes.json + data/move-synergies.json. Non-story callers
// keep the legacy role-config path byte-for-byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const W = eng.window;
const ST = W.__storyTest;
const md = W.makeDesignedBuild;
const JSON_IDS = () => W.BUILD_ARCHETYPES.archetypes.map(a => a.id);

function activeStory(seed = 21) { ST.sm.active = true; ST.sm.runSeed = seed; ST.sm._strngState = null; }

test('archetype + synergy tables loaded from JSON', () => {
  assert.ok(W.BUILD_ARCHETYPES.archetypes.length >= 6, 'archetypes loaded');
  assert.ok(W.MOVE_SYNERGIES.pairs.length >= 10, 'synergy pairs loaded');
});

test('synergy bonus fires for known combos (moves + move/item)', () => {
  assert.ok(W._designedSynergyBonus('Protect', ['Toxic'], null) >= 40, 'Protect+Toxic');
  assert.ok(W._designedSynergyBonus('Sleep Talk', ['Rest'], null) >= 50, 'Rest+Sleep Talk');
  assert.ok(W._designedSynergyBonus('Hex', ['Will-O-Wisp'], null) >= 40, 'Will-O-Wisp+Hex');
  assert.equal(W._designedSynergyBonus('Protect', ['Earthquake'], null), 0, 'unrelated → no bonus');
  assert.ok(W._designedSynergyBonus('Facade', [], 'Flame Orb') >= 30, 'Facade+Flame Orb (move/item)');
});

test('story designed build: full coherent set, archetype-tagged, no Tackle/dupes', () => {
  activeStory();
  for (const name of ['Snorlax', 'Garchomp', 'Gengar', 'Skarmory', 'Blissey']) {
    let sawArchetype = false;
    for (let i = 0; i < 24; i++) {
      const b = md(name);
      if (!b) continue;
      assert.equal(b.m.length, 4, `${name}: 4 moves`);
      assert.equal(new Set(b.m).size, 4, `${name}: no duplicate move (${b.m.join('/')})`);
      assert.ok(!b.m.includes('Tackle'), `${name}: no literal Tackle (${b.m.join('/')})`);
      if (JSON_IDS().includes(b.archetype)) sawArchetype = true;
    }
    assert.ok(sawArchetype, `${name}: at least one build tagged with a JSON archetype id`);
  }
});

test('stat-sensitive spread: walls invest bulk, attackers invest offense+speed', () => {
  activeStory(7);
  const ratio = (name, pred, n = 36) => {
    let hit = 0, tot = 0;
    for (let i = 0; i < n; i++) { const b = md(name); if (!b) continue; tot++; if (pred(b.evs)) hit++; }
    return tot ? hit / tot : 0;
  };
  // Blissey is a textbook wall (huge HP/SpD, minimal offense) → bulk-invested, not max speed.
  assert.ok(ratio('Blissey', e => (e.hp | 0) >= 252 && (e.spe | 0) < 252) > 0.6, 'Blissey mostly bulk');
  // Garchomp is a fast attacker → max speed or max offense.
  assert.ok(ratio('Garchomp', e => (e.spe | 0) === 252 || (e.atk | 0) === 252) > 0.6, 'Garchomp mostly offense/speed');
});

test('non-story designed build uses the legacy role path (out-of-scope unchanged)', () => {
  ST.sm.active = false;
  const b = md('Snorlax');
  assert.ok(b, 'legacy build produced');
  assert.ok(!JSON_IDS().includes(b.archetype), `legacy archetype tag, not a JSON id (got ${b.archetype})`);
  ST.sm.active = true;
});
