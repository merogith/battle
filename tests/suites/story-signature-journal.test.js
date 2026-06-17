// Verifies the signature journal (Phase 3.6): the registry lists every gym
// leader / Elite Four / Champion / Elite Trainer with signatures, tracks which
// have been encountered, and which signature species actually appeared.
// Run: node --test tests/suites/story-signature-journal.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const E = eng.window.__rivalTest;
// The jsdom harness blocks localStorage (SecurityError), so we test the pure
// journal logic directly: _storyApplySigEncounter mutates a plain journal object,
// and _storyBuildSignatureRegistry accepts that object as an override. The
// localStorage-backed read/write wrappers are exercised in-browser.

test('only leader / E4 / champion / elite-trainer roles are journalled', () => {
  const ok = E.storyIsSignatureTrainerRole;
  assert.equal(ok('Gym Leader 3'), true);
  assert.equal(ok('E1'), true);
  assert.equal(ok('E4'), true);
  assert.equal(ok('Champion'), true);
  assert.equal(ok('Elite Trainer'), true);
  assert.equal(ok('Basic Trainer'), false);
  assert.equal(ok('Gym Trainer 1'), false);
  assert.equal(ok('Rival'), false);
});

test('registry lists signature trainers with per-sig gen + seen=false initially', () => {
  const reg = E.storyBuildSignatureRegistry({});
  assert.ok(reg.length > 0, 'registry is non-empty');
  for (const t of reg) {
    assert.ok(E.storyIsSignatureTrainerRole(t.role), `${t.name} is a signature role`);
    assert.ok(t.sigCount > 0, `${t.name} has signatures`);
    assert.ok(t.sigs.every((s) => typeof s.gen === 'number'), 'each sig carries a gen');
  }
  // Nothing recorded yet.
  assert.equal(reg.every((t) => !t.seen && t.seenCount === 0), true, 'all unseen before any encounter');
  // Sorted: leaders first, elite trainers last.
  const rank = (r) => /^Gym Leader/.test(r) ? 0 : /^E[1-4]$/.test(r) ? 1 : r === 'Champion' ? 2 : 3;
  for (let i = 1; i < reg.length; i++) assert.ok(rank(reg[i - 1].role) <= rank(reg[i].role), 'role-sorted');
});

test('recording an encounter marks the trainer + the sigs that actually appeared', () => {
  // Find a registry trainer with at least 2 sigs to test partial encounter.
  const target = E.storyBuildSignatureRegistry({}).find((t) => t.sigCount >= 2);
  assert.ok(target, 'have a multi-sig trainer');
  const shown = target.sigs[0].species; // pretend only the first sig appeared
  const trainer = { role: target.role, name: target.name, sigs: target.sigs.map((s) => s.species) };
  const journal = E.storyApplySigEncounter({}, trainer, [{ name: shown }]);

  const after = E.storyBuildSignatureRegistry(journal).find((t) => t.name === target.name);
  assert.equal(after.seen, true, 'trainer marked faced');
  assert.equal(after.seenCount, 1, 'exactly the one shown sig is marked seen');
  assert.equal(after.sigs.find((s) => s.species === shown).seen, true, 'shown sig seen');
  assert.equal(after.sigs.filter((s) => s.species !== shown).every((s) => !s.seen), true, 'others still locked');
});

test('E4 Lance and Champion Lance have distinct, non-duplicate rosters', () => {
  // Collection update: the two Lance entries previously shared a byte-identical
  // Dragonite×3 roster (a copy-paste). E4 Lance is now the gen-1 Kanto-authentic
  // ace line; Champion Lance keeps the HGSS Dragonite×3 team.
  const trainers = eng.window.__storyTest.getTrainerData();
  assert.ok(Array.isArray(trainers), 'TRAINER_DATA reachable');
  const e4 = trainers.find(t => t.role === 'E4' && t.name === 'Lance');
  const champ = trainers.find(t => t.role === 'Champion' && t.name === 'Lance');
  assert.ok(e4 && champ, 'both Lance entries exist');
  assert.notDeepEqual(e4.sigs, champ.sigs, 'the two Lance rosters now differ');
  assert.ok(e4.sigs.includes('Dragonair'), 'E4 Lance fields the gen-1 Dragonair line');
  // The merged journal registry unions both Lance variants under one base name.
  const lance = E.storyBuildSignatureRegistry({}).find(t => t.name === 'Lance');
  assert.ok(lance, 'Lance present in the registry');
  const species = lance.sigs.map(s => s.species);
  assert.ok(species.includes('Dragonair') && species.includes('Dragonite'), 'union of both rosters');
});

test('non-signature roles and empty teams are ignored by the recorder', () => {
  let journal = {};
  journal = E.storyApplySigEncounter(journal, { role: 'Basic Trainer', name: 'Hiker', sigs: ['Geodude'] }, [{ name: 'Geodude' }]);
  journal = E.storyApplySigEncounter(journal, { role: 'Gym Leader 1', name: 'Brock', sigs: [] }, [{ name: 'Onix' }]);
  assert.deepEqual(journal, {}, 'nothing recorded from a basic role or an empty sig list');
  const reg = E.storyBuildSignatureRegistry(journal);
  assert.equal(reg.every((t) => !t.seen), true, 'registry shows all unseen');
});
