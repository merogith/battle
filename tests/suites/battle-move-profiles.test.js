import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import profiles from '../../battle-move-profiles.js';
import { auditMoveProfiles, motionSignature } from '../../scripts/audit-battle-move-profiles.mjs';

const movesByGen = JSON.parse(readFileSync(new URL('../../data/moves.json', import.meta.url), 'utf8'));
const moves = movesByGen[9];
const bosses = JSON.parse(readFileSync(new URL('../../data/story/boss-profiles.json', import.meta.url), 'utf8'));
const targets = {
  self: 'self', adjacentAlly: 'ally', adjacentAllyOrSelf: 'ally',
  allySide: 'ally-side', allies: 'ally-side', allyTeam: 'ally-side',
  foeSide: 'foe-side', allAdjacent: 'spread', allAdjacentFoes: 'spread', all: 'all',
};
const choices = {
  family: 'contact projectile beam wave field stance ward heal trap drain pivot status',
  target: 'self ally target ally-side foe-side spread all field',
  path: 'direct arc spiral zigzag fan orbit ground drop pulse',
  shape: 'orb ring slash shard spark bolt wave cone line seal petal note dust',
  pose: 'brace lunge snap rise focus sweep still',
  impact: 'thud cut burst ripple crack seal heal bind drain none',
};

test('every pinned canonical move, including historical and typed variants, has a valid local profile', () => {
  assert.deepEqual(new Set(profiles.ids()), new Set(Object.keys(moves)));
  for (const rawGen of Object.values(movesByGen)) {
    for (const id of Object.keys(rawGen)) assert.notEqual(profiles.get(id).source, 'fallback', id);
  }
  for (const [id, move] of Object.entries(moves)) {
    const profile = profiles.get(id);
    assert.equal(profile.id, id);
    assert.strictEqual(profiles.get(move.name), profile, move.name);
    assert.equal(profile.type, move.type);
    assert.equal(profile.category, move.category);
    assert.equal(profile.contact, Boolean(move.flags?.contact), move.name);
    const field = move.weather || move.terrain || move.pseudoWeather;
    assert.equal(profile.target, field ? 'field' : targets[move.target] || 'target', move.name);
    assert.equal(profile.behavior.multihit, Boolean(move.multihit || move.multiaccuracy), move.name);
    assert.equal(profile.behavior.charge, Boolean(move.flags?.charge), move.name);
    assert.equal(profile.behavior.recharge, Boolean(move.flags?.recharge), move.name);
    assert.equal(profile.behavior.delayed, Boolean(move.flags?.futuremove), move.name);
    assert.equal(profile.behavior.recoil, Boolean(move.recoil || move.hasCrashDamage), move.name);
    assert.equal(profile.behavior.pivot, Boolean(move.selfSwitch), move.name);
    assert.deepEqual(profiles.get(id, move), profile, 'packed move facts must reflect the raw Dex row for ' + id);
    assert.equal(profile.authored, profile.source === 'authored', move.name);
    for (const [key, values] of Object.entries(choices)) assert.ok(values.split(' ').includes(profile[key]), id + ' ' + key);
    assert.equal(profile.color.length, 2);
    assert.ok(profile.color.every(color => /^#[0-9a-f]{6}$/i.test(color)));
    assert.ok(Number.isInteger(profile.count) && profile.count >= 1 && profile.count <= 8);
    const timings = Object.values(profile.timing);
    assert.ok(timings.every(ms => Number.isInteger(ms) && ms > 0));
    assert.ok(timings.reduce((sum, ms) => sum + ms, 0) <= 1100);
  }
});

test('hand-authored moves are distinguishable without color and retain confirmed mechanic cues', () => {
  const pilots = profiles.authoredIds().map(id => profiles.get(id));
  assert.ok(pilots.length >= 64);
  assert.equal(new Set(pilots.map(profile => motionSignature(profile))).size, pilots.length, 'each authored choreography is distinct');
  assert.ok(pilots.every(profile => profile.authored));
  assert.equal(new Set(pilots.map(profile => profile.type)).size, 18, 'every type has an authored move');
  assert.deepEqual(new Set(pilots.map(profile => profile.target)), new Set(choices.target.split(' ')));
  assert.deepEqual(new Set(pilots.map(profile => profile.family)), new Set(choices.family.split(' ')));
  const move = name => profiles.get(name);
  assert.equal(move('Earthquake').contact, false);
  assert.equal(move('Earthquake').path, 'ground');
  assert.equal(move('Draining Kiss').category, 'Special');
  assert.equal(move('Draining Kiss').contact, true);
  assert.equal(move('Stealth Rock').target, 'foe-side');
  assert.equal(move('Helping Hand').target, 'ally');
  assert.equal(move('Protect').target, 'self');
  assert.equal(move('Protect').family, 'ward');
  assert.equal(move('Recover').family, 'heal');
  assert.equal(move('Thunderbolt').path, 'drop');
  assert.notEqual(move('Shadow Ball').path, move('Aura Sphere').path);
  assert.notEqual(move('Ember').family, move('Flamethrower').family);
  assert.equal(move('Solar Beam').behavior.charge, true);
  assert.equal(move('Hyper Beam').behavior.recharge, true);
  assert.equal(move('Bullet Seed').behavior.multihit, true);
  assert.equal(move('Future Sight').behavior.delayed, true);
  assert.equal(move('Haze').target, 'all');
  assert.equal(move('Tailwind').target, 'ally-side');
  assert.notEqual(move('Reflect').path, move('Light Screen').path);
  assert.notEqual(move('Water Gun').family, move('Bubble Beam').family);
  assert.notEqual(move('Giga Drain').contact, move('Drain Punch').contact);
  assert.equal(move('Volt Switch').behavior.pivot, true);
  for (const boss of Object.values(bosses)) {
    for (const { effect } of boss.phases) {
      for (const id of [...(effect.moves || []), ...(effect.followUp || [])]) {
        assert.ok(move(id).authored, boss.sceneKey + ' needs choreography for ' + id);
      }
    }
  }
});

test('generic profiles retain semantic silhouettes and the collision inventory stays reproducible', () => {
  const move = name => profiles.get(name);
  const pairs = [
    ['Sing', 'Sleep Powder'], ['Nasty Plot', 'Iron Defense'], ['Sunny Day', 'Sandstorm'],
    ['Hail', 'Snowscape'], ['G-Max Wildfire', 'G-Max Stonesurge'], ['Body Slam', 'Horn Attack'],
    ['Fire Punch', 'Ice Punch'], ['Lock-On', 'Skill Swap'],
  ];
  for (const [first, second] of pairs) {
    assert.notEqual(motionSignature(move(first), false), motionSignature(move(second), false), first + ' and ' + second);
  }
  assert.equal(move('Sing').shape, 'note');
  assert.equal(move('Sleep Powder').shape, 'dust');
  assert.equal(move('Focus Blast').family, 'projectile', 'the bullet flag wins over the old generic beam');
  assert.equal(move('Max Guard').family, 'ward');
  assert.equal(move('Max Guard').shape, 'seal');
  assert.equal(motionSignature(move('Hidden Power Ice')), motionSignature(move('Hidden Power Water')));
  const audit = auditMoveProfiles();
  assert.equal(audit.ids, Object.keys(moves).length);
  assert.deepEqual(audit.missing, []);
  assert.ok(audit.motionAndTiming.signatures >= 500);
  assert.ok(audit.motionOnly.signatures >= 390);
  assert.ok(audit.motionAndTiming.shared.every(group => group.variantsOfOneMove || group.count <= 15));
});

test('legacy UI metadata preserves omitted facts, and complete historical metadata can override flags', () => {
  const sunny = profiles.get('Sunny Day', { cat: 'Status', pow: 0, pri: 0, target: 'all', flags: { nonsky: 1, metronome: 1 } });
  assert.equal(sunny.family, 'field');
  assert.equal(sunny.target, 'field');
  const pivot = profiles.get('U-turn', { cat: 'Physical', pow: 70, target: 'normal', flags: { contact: 1, protect: 1 } });
  assert.equal(pivot.behavior.pivot, true);
  assert.equal(pivot.contact, true);
  const historic = profiles.get('Water Shuriken', { ...moves.watershuriken, category: 'Physical' });
  assert.equal(historic.category, 'Physical');
  assert.equal(historic.family, 'projectile');
  assert.equal(historic.contact, false);
  const variant = profiles.get('Shadow Ball', { ...moves.shadowball, flags: { contact: 1 }, target: 'allAdjacentFoes' });
  assert.equal(variant.contact, true);
  assert.equal(variant.target, 'spread');
  assert.equal(profiles.get('Shadow Ball').contact, false);
});

test('classic browser consumers receive the same registry and unknown moves get a safe fallback', () => {
  const window = {};
  const source = readFileSync(new URL('../../battle-move-profiles.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, { window });
  const browser = window.BattleMoveProfiles;
  assert.equal(browser.ids().length, profiles.ids().length);
  assert.equal(motionSignature(browser.get('Kings Shield')), motionSignature(profiles.get("King's Shield")));
  const fallback = browser.get('Uncatalogued Recovery', { category: 'Status', basePower: 0, target: 'self', flags: { heal: 1 } });
  assert.equal(fallback.source, 'fallback');
  assert.equal(fallback.family, 'heal');
  assert.equal(fallback.contact, false);
  assert.equal(fallback.target, 'self');
  assert.equal(browser.get('constructor').source, 'fallback');
});
