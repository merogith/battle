import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { State } from '@pkmn/sim';
import { ClassicSimulation, validateStoryBossProfile } from '../../scripts/competitive/classic-simulation.mjs';

const data = JSON.parse(readFileSync(new URL('../../data/story/boss-profiles.json', import.meta.url), 'utf8'));
const graveGuard = data['extra.cubone.raid'];
const move = slot => ({ kind: 'move', slot });
const built = (name, moveNames, overrides = {}) => ({
  name,
  stats: { atk: 90, def: 90, spa: 90, spd: 90, spe: 90 },
  currentHp: 150,
  maxHp: 150,
  moves: moveNames.map(name => ({ name, pp: 10, maxPp: 16 })),
  ...overrides,
});
const partner = built('Mew', ['Seismic Toss', 'Protect', 'Psychic']);
const foe = built('Blissey', ['Splash']);
const open = (profile, options = {}) => new ClassicSimulation({
  seed: 12,
  playerParty: [partner],
  foeParty: [foe],
  rules: { allowPass: true, ...(profile ? { boss: { profile } } : {}) },
  ...options,
});
const act = (session, player, opponent) => {
  session.choose('p1', typeof player === 'number' ? move(player) : player);
  const request = session.view().requests.p2;
  const scripted = session.plannedBossMove(request);
  return session.choose('p2', typeof opponent === 'number' ? move(opponent)
    : opponent || move(scripted?.slot ?? request.moves[0].slot));
};
const phaseLog = view => view.events.filter(event => event.boss?.id);
const normalizeSnapshot = session => {
  const snapshot = session.snapshot();
  // Showdown writes wall-clock protocol lines inside the nested battle state.
  State.normalize(snapshot.battle);
  return snapshot;
};

test('the catalog has a valid revision for every raid tier and selected climax', () => {
  assert.equal(Object.keys(data).length, 28);
  const trio = ['miniRaid', 'miniRaid2', 'raid'];
  for (const arc of ['cubone', 'yamask', 'hypno', 'phantump', 'mimikyu', 'drifloon', 'parasect', 'mewtwo']) {
    for (const tier of trio) {
      const key = `extra.${arc}.${tier}`;
      assert.equal(data[key].sceneKey, key);
      assert.equal(data[key].foeSlot, 0);
    }
  }
  for (const [sceneKey, profile] of Object.entries(data)) {
    assert.equal(profile.sceneKey, sceneKey);
    assert.doesNotThrow(() => validateStoryBossProfile(profile), sceneKey);
  }
  const frozenRevision = structuredClone(graveGuard);
  frozenRevision.revision = 2;
  assert.doesNotThrow(() => validateStoryBossProfile(frozenRevision));
  frozenRevision.phases[0].effect.completedTurns = -1;
  assert.throws(() => validateStoryBossProfile(frozenRevision), /Invalid Story boss phase/);
});

test('Grave Guard reads native category, protects 50 fixed damage at 25%, and expires after two full choices', () => {
  const session = open(graveGuard);
  act(session, 0);
  const announced = act(session, 0);
  assert.equal(announced.foe[0].hp, 50);
  assert.deepEqual(announced.boss.phases.map(item => [item.category, item.status, item.remainingTurns]),
    [['Physical', 'pending', 2]]);
  assert.match(phaseLog(announced).at(-1).text, /25% less damage from Physical/);
  const oneTurnLeft = act(session, 0);
  assert.equal(oneTurnLeft.foe[0].hp, 13);
  assert.deepEqual(oneTurnLeft.boss.phases.map(item => [item.status, item.remainingTurns]), [['active', 1]]);
  const expired = act(session, { kind: 'pass' });
  assert.equal(expired.foe[0].hp, 13, 'a bag-compatible pass incurs no new attack');
  assert.deepEqual(expired.boss.phases, []);
  assert.equal(phaseLog(expired).filter(event => event.boss.phase === 'expire').length, 1);
  const won = act(session, 0);
  assert.equal(won.winner, 'p1');
});

test('a nonmatching attack keeps native damage and a residual-only crossing telegraphs Physical', () => {
  const weak = built('Blissey', ['Splash'], { currentHp: 150, maxHp: 200 });
  const warded = open(graveGuard, { foeParty: [weak] });
  const ordinary = open(null, { foeParty: [weak] });
  assert.equal(act(warded, 0).boss.phases[0].category, 'Physical');
  act(ordinary, 0);
  assert.equal(act(warded, 2).foe[0].hp, act(ordinary, 2).foe[0].hp);
  const poisoned = open(graveGuard, {
    foeParty: [built('Blissey', ['Splash'], { currentHp: 90, maxHp: 160, status: 'PSN' })],
  });
  const crossing = act(poisoned, 1);
  assert.equal(crossing.foe[0].hp, 70);
  assert.equal(crossing.boss.phases[0].category, 'Physical');
});

test('a healed crossing and knockout do not grant Grave Guard', () => {
  const healed = open(graveGuard, {
    foeParty: [built('Blissey', ['Recover'], { currentHp: 120, maxHp: 160,
      stats: { atk: 90, def: 90, spa: 90, spd: 90, spe: 30 } })],
  });
  assert.equal(act(healed, 0).foe[0].hp, 150);
  assert.deepEqual(healed.view().boss.phases, []);
  const lethal = open(graveGuard, { foeParty: [built('Blissey', ['Splash'], { currentHp: 45, maxHp: 80 })] });
  const finish = act(lethal, 0);
  assert.equal(finish.winner, 'p1');
  assert.equal(phaseLog(finish).length, 0);
});

test('restored pending and active snapshots produce the same native result and one expiry', () => {
  const first = open(graveGuard, { foeParty: [built('Blissey', ['Splash'], { currentHp: 160, maxHp: 160 })] });
  act(first, 0);
  act(first, 0);
  const pending = ClassicSimulation.fromSnapshot(first.snapshot());
  for (const session of [first, pending]) act(session, 1);
  const active = ClassicSimulation.fromSnapshot(first.snapshot());
  for (const session of [first, pending, active]) {
    const result = act(session, 0);
    assert.equal(result.foe[0].hp, 23);
    assert.equal(phaseLog(result).filter(event => event.boss.phase === 'expire').length, 1);
    assert.equal(act(session, 0).winner, 'p1');
  }
  assert.deepEqual(normalizeSnapshot(first), normalizeSnapshot(active));
  assert.deepEqual(normalizeSnapshot(first), normalizeSnapshot(pending));
});

test('an actual pivot replacement waits for the native completed turn before counting an active guard', () => {
  const player = built('Scizor', ['U-turn', 'Seismic Toss'],
    { stats: { atk: 50, def: 90, spa: 90, spd: 90, spe: 220 } });
  const session = open(graveGuard, {
    playerParty: [player, partner],
    foeParty: [built('Blissey', ['Splash'], { currentHp: 105, maxHp: 180 })],
  });
  act(session, 1);
  assert.equal(session.view().boss.phases[0].status, 'pending');
  const switching = act(session, 0);
  assert.equal(switching.requests.p1.phase, 'replace');
  assert.equal(switching.boss.phases[0].remainingTurns, 2);
  const restored = ClassicSimulation.fromSnapshot(session.snapshot());
  for (const copy of [session, restored]) {
    const resumed = copy.choose('p1', { kind: 'switch', slot: 1 });
    assert.equal(resumed.boss.phases[0].remainingTurns, 1);
    assert.equal(resumed.turn, switching.turn + 1);
  }
  assert.deepEqual(normalizeSnapshot(restored), normalizeSnapshot(session));
});

test('Relic Guard is spent by one positive direct hit and neither a miss nor a fully absorbed hit grants it', () => {
  const session = open(data['extra.yamask.miniRaid'], {
    foeParty: [built('Blissey', ['Splash', 'Substitute'], { currentHp: 220, maxHp: 220 })],
  });
  act(session, 1, 1);
  act(session, 0);
  assert.deepEqual(session.view().boss.phases, []);
  act(session, 0);
  assert.deepEqual(session.view().boss.phases, []);
  assert.equal(act(session, 0).boss.phases[0].kind, 'nextHitWard');
  assert.equal(act(session, 0).foe[0].hp, 78);
  assert.deepEqual(session.view().boss.phases, []);
  assert.match(phaseLog(session.view()).at(-1).text, /ward is spent/);
});

test('Hypno advertises a real request slot and an actual attempt spends normal PP only once', () => {
  const session = open(data['extra.hypno.miniRaid'], {
    foeParty: [built('Hypno', ['Splash', 'Hypnosis'])],
  });
  const announced = act(session, 1, 0);
  assert.equal(announced.boss.phases[0].moveName, 'Hypnosis');
  assert.equal(session.plannedBossMove(announced.requests.p2)?.slot, 1);
  const attempted = act(session, 1);
  assert.equal(attempted.foe[0].moves[1].pp, 9);
  assert.ok(attempted.events.some(event => event.tag === 'move' &&
    event.side === 'p2' && event.detail === 'Hypnosis'));
  assert.equal(session.plannedBossMove(attempted.requests.p2), null);
  assert.equal(phaseLog(attempted).filter(event => event.boss.phase === 'telegraph').length, 1);
  const gated = open(data['extra.hypno.miniRaid'], { foeParty: [built('Hypno', ['Splash'])] });
  const unavailable = act(gated, 1);
  assert.equal(phaseLog(unavailable).at(-1).boss.phase, 'cue');
  assert.deepEqual(unavailable.boss.phases, []);
});

test('only Mimikyu’s real native Disguise break schedules its signature move', () => {
  const session = open(data['extra.mimikyu.raid'], {
    foeParty: [built('Mimikyu', ['Splash', 'Shadow Claw'], { ability: 'Disguise' })],
  });
  assert.deepEqual(act(session, 0).boss.phases, [], 'Ghost immunity does not break Disguise');
  const broken = act(session, 2);
  assert.equal(broken.foe[0].name, 'Mimikyu-Busted');
  assert.equal(broken.boss.phases[0].moveName, 'Shadow Claw');
  assert.equal(phaseLog(broken).filter(event => event.boss.id === 'costumeBreak').length, 1);
});

test('native rain is contestable and the authored attempt depends on the new active’s current request', () => {
  const session = open(data['villain.aqua.boss'], {
    playerParty: [built('Mew', ['Sunny Day', 'Seismic Toss', 'Protect'])],
    foeParty: [built('Pikachu', ['Splash'], { currentHp: 40, maxHp: 40 }), built('Sharpedo', ['Splash', 'Rain Dance'])],
  });
  assert.equal(session.view().field.weather, 'raindance');
  assert.equal(act(session, 0).field.weather, 'sunnyday');
  const replacing = act(session, 1);
  assert.equal(replacing.requests.p2.phase, 'replace');
  const announce = session.choose('p2', { kind: 'switch', slot: 1 });
  assert.equal(announce.boss.phases[0].moveName, 'Rain Dance');
  assert.equal(announce.boss.phases[0].ownerSlot, 1);
  const rain = act(session, 2);
  assert.equal(rain.field.weather, 'raindance');
  assert.equal(rain.foe[1].moves[1].pp, 9);
});

test('Leech Seed, Tailwind, and Spore keep their native conditions and immunities', () => {
  const seed = open(data['extra.phantump.miniRaid'], {
    playerParty: [built('Mew', ['Splash'])],
    foeParty: [built('Phantump', ['Splash', 'Leech Seed'])],
  });
  assert.equal(act(seed, 0, 0).boss.phases[0].moveName, 'Leech Seed');
  const rooted = act(seed, 0);
  assert.ok(rooted.player[0].hp < 150);
  assert.equal(rooted.foe[0].moves[1].pp, 9);

  const gust = open(data['extra.drifloon.miniRaid'], {
    foeParty: [built('Drifloon', ['Splash', 'Tailwind'])],
  });
  assert.equal(act(gust, 1, 0).boss.phases[0].moveName, 'Tailwind');
  assert.equal(act(gust, 1).sides.p2.tailwind, 3);
  for (const remaining of [2, 1, 0]) assert.equal(act(gust, { kind: 'pass' }).sides.p2.tailwind, remaining);

  const poison = open(data['extra.parasect.miniRaid'], {
    playerParty: [built('Bulbasaur', ['Splash'])],
    foeParty: [built('Paras', ['Splash', 'Spore'])],
  });
  assert.equal(act(poison, 0, 0).boss.phases[0].moveName, 'Spore');
  const attempted = act(poison, 0);
  assert.ok(!attempted.player[0].status);
  assert.equal(attempted.foe[0].moves[1].pp, 9);
  assert.equal(phaseLog(attempted).filter(event => event.boss.phase === 'telegraph').length, 1);
  assert.deepEqual(attempted.boss.phases, []);
});

test('Mewtwo’s initial attack and Calm Mind recovery each use and spend a real move slot', () => {
  const session = open(data['extra.mewtwo.raid'], {
    foeParty: [built('Mewtwo', ['Splash', 'Psystrike', 'Calm Mind'], { currentHp: 150, maxHp: 200 })],
  });
  assert.equal(act(session, 0, 0).boss.phases[0].moveName, 'Psystrike');
  const recovery = act(session, 1);
  assert.equal(recovery.boss.phases[0].moveName, 'Calm Mind');
  assert.equal(recovery.foe[0].moves[1].pp, 9);
  const prepared = act(session, 1);
  assert.equal(prepared.foe[0].moves[2].pp, 9);
  assert.equal(prepared.foe[0].stages.spa, 1);
  assert.deepEqual(prepared.boss.phases, []);
});

test('The First uses a visible native turn cadence with a legal recovery', () => {
  const session = open(data['main.mfBattle'], {
    playerParty: [built('Mew', ['Protect', 'Splash'])],
    foeParty: [built('Blissey', ['Growl', 'Tackle'])],
  });
  for (let turn = 1; turn < 4; turn++) assert.deepEqual(act(session, 1, 0).boss.phases, []);
  assert.equal(act(session, 1, 0).boss.phases[0].moveName, 'Tackle');
  const recovery = act(session, 0);
  assert.equal(recovery.boss.phases[0].moveName, 'Growl');
  assert.equal(recovery.boss.phases[0].id, 'theFirst.recovery');
  assert.deepEqual(act(session, 1).boss.phases, []);
  const plain = open(null);
  assert.equal(act(plain, 0).boss, null, 'normal mode gets no Story-only phase state');
});
