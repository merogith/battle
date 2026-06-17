// Achievements overhaul (Collection update). The jsdom harness blocks
// localStorage, so the full read/write unlock flow is exercised in-browser.
// Here we lock down the pure, deterministic pieces:
//   1. the tier-threshold math (_storyAchRankFor) for the extended 5-rank
//      counters and the new "grind" achievements,
//   2. the monotype-party detector (_storyPartyMonotype),
//   3. catalog integrity, and
//   4. a source-level guard that every replay/grind achievement actually has an
//      unlock/bump hook in battle.html (so no trophy is defined-but-dead again).
// Run: node --test tests/suites/achievements-unlock.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const ST = eng.window.__storyTest;
const defs = ST.storyAchievements();
const byId = ST.storyAchievementsById();

test('extended count tiers + new grind tiers compute the right rank', () => {
  const rankOf = (id, progress) => ST.storyAchRankFor(byId[id], progress);
  // trainers_won is now 5-rank [20,100,500,1000,2500].
  assert.equal(rankOf('trainers_won', 0), 0);
  assert.equal(rankOf('trainers_won', 20), 1);
  assert.equal(rankOf('trainers_won', 1000), 4);
  assert.equal(rankOf('trainers_won', 2500), 5, 'top tier reachable');
  assert.equal(rankOf('trainers_won', 99999), 5, 'caps at the final rank');
  // New grind achievement gold_spent [50k,250k,1M,5M].
  assert.equal(rankOf('gold_spent', 49999), 0);
  assert.equal(rankOf('gold_spent', 50000), 1);
  assert.equal(rankOf('gold_spent', 5000000), 4);
  // frontier_rounds [10,25,50,100,250].
  assert.equal(rankOf('frontier_rounds', 9), 0);
  assert.equal(rankOf('frontier_rounds', 250), 5);
});

test('_storyPartyMonotype detects a shared type, allowing dual-types', () => {
  const mono = ST.storyPartyMonotype;
  // All-Water party (some dual Water/X) → "Water".
  assert.equal(mono([{ name: 'Gyarados' }, { name: 'Lapras' }, { name: 'Starmie' }]), 'Water');
  // Mixed types → null.
  assert.equal(mono([{ name: 'Gyarados' }, { name: 'Pikachu' }]), null);
  // Eggs are ignored; the remaining mons still count.
  assert.equal(mono([{ name: 'Gyarados', isEgg: true }, { name: 'Lapras' }]), 'Water');
  // Empty / junk → null.
  assert.equal(mono([]), null);
  assert.equal(mono(null), null);
});

test('catalog is well-formed: ids unique, grind/count tiers ascending', () => {
  const ids = new Set();
  for (const d of defs) {
    assert.ok(d.id && !ids.has(d.id), `duplicate or missing id: ${d.id}`);
    ids.add(d.id);
    assert.ok(['milestone', 'count', 'collection', 'replay', 'grind'].includes(d.cat), `${d.id} has a known category`);
    if (Array.isArray(d.ranks)) {
      for (let i = 1; i < d.ranks.length; i++) {
        assert.ok(d.ranks[i] > d.ranks[i - 1], `${d.id} ranks strictly ascending`);
      }
    }
  }
  // The new grind category exists and every entry is tiered.
  const grind = defs.filter(d => d.cat === 'grind');
  assert.ok(grind.length >= 5, 'grind category populated');
  assert.ok(grind.every(d => Array.isArray(d.ranks) && d.ranks.length >= 3), 'grind achievements are multi-tier');
});

test('every replay/grind achievement has a live unlock/bump hook in battle.html', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, '../../battle.html'), 'utf8');
  const hookable = defs.filter(d => d.cat === 'replay' || d.cat === 'grind');
  for (const d of hookable) {
    // The id must appear in a _storyAchievementUnlock('id') or
    // _storyAchievementBumpCount('id', ...) call somewhere in the source.
    const re = new RegExp(`_storyAchievement(?:Unlock|BumpCount)\\(\\s*['"]${d.id}['"]`);
    assert.match(src, re, `${d.id} (${d.cat}) must have an unlock/bump hook`);
  }
});
