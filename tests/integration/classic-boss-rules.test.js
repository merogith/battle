import assert from 'node:assert/strict';
import { test } from 'node:test';
import { State } from '@pkmn/sim';
import { attachClassicBossRules, classicBossView } from '../../scripts/competitive/classic-boss-rules.mjs';
import { describeBattleLog } from '../../scripts/competitive/classic-events.mjs';
import { createClassicBattle, restoreClassicBattle } from '../../scripts/competitive/classic-format.mjs';
import { attachClassicScenarioRules } from '../../scripts/competitive/classic-scenario-rules.mjs';

const mew = { species: 'Mew', level: 50, ability: 'Synchronize', moves: ['Seismic Toss', 'Thunder Wave', 'Splash'] };
const blissey = { species: 'Blissey', level: 100, ability: 'Natural Cure', moves: ['Splash'] };

function start(rules, { p1 = [mew], p2 = [blissey] } = {}) {
  const battle = createClassicBattle({
    seed: '1,2,3,4',
    p1: { name: 'P1', team: p1 },
    p2: { name: 'P2', team: p2 },
  }, rules);
  attachClassicScenarioRules(battle, rules);
  attachClassicBossRules(battle, rules);
  choose(battle, 'team 1', 'team 1');
  return battle;
}

function choose(battle, p1, p2 = 'move 1') {
  assert.equal(battle.choose('p1', p1), true, battle.p1.choice.error);
  assert.equal(battle.choose('p2', p2), true, battle.p2.choice.error);
}

function bossRules(...mechanics) {
  return { scenario: {}, boss: { mechanics } };
}

test('boss fields use the lead type and can be contested by standard moves', () => {
  const rules = bossRules({ type: 'fieldLock', value: 'auto', turns: 99, banner: 'PSYCHIC FIELD' });
  const battle = start(rules, {
    p1: [{ ...mew, moves: ['Electric Terrain'] }],
    p2: [{ ...blissey, species: 'Mewtwo', ability: 'Pressure' }],
  });
  assert.equal(battle.field.terrain, 'psychicterrain');
  assert.equal(battle.field.terrainState.duration, 99);
  assert.equal(classicBossView(battle).terrainLocked, true);
  choose(battle, 'move 1');
  assert.equal(battle.field.terrain, 'electricterrain');
});

test('prepared fields preserve Story artifact overrides and emit no duplicate field banner', () => {
  const rules = {
    scenario: { weather: { id: 'Snow', turns: 5 } },
    boss: {
      fieldPrepared: true,
      weatherLocked: true,
      mechanics: [{ type: 'fieldLock', kind: 'weather', value: 'Rain', banner: 'RAINFALL' }],
    },
  };
  const battle = start(rules);
  assert.equal(battle.field.weather, 'snowscape');
  assert.equal(battle.field.weatherState.duration, 5);
  assert.equal(classicBossView(battle).weatherLocked, true);
  assert.ok(!battle.log.some(line => line.startsWith('|boss-phase|field|')));
});

test('barriers queue a turn ahead and absorb fixed damage only up to their remaining HP', () => {
  const battle = start(bossRules({ type: 'faintPhase', afterFaints: 0, effect: 'shield', magnitude: 1 / 8, banner: 'ARMOR' }));
  const foe = battle.p2.active[0];
  choose(battle, 'move 1');
  assert.deepEqual(classicBossView(battle).pending, [{ banner: 'ARMOR', effect: 'shield' }]);
  const startHp = foe.hp;
  const shield = Math.floor(foe.maxhp / 8);
  choose(battle, 'move 1');
  assert.equal(foe.hp, startHp);
  assert.equal(classicBossView(battle).shieldHp, shield - 50);
  choose(battle, 'move 1');
  assert.equal(foe.hp, startHp - (100 - shield));
  assert.equal(classicBossView(battle).shieldHp, 0);
  const shatter = battle.log.find(line => line.includes('BARRIER SHATTERED'));
  const event = describeBattleLog(shatter, new Map(), battle.dex);
  assert.deepEqual(event.boss, { phase: 'shield', banner: 'BARRIER SHATTERED', effect: 'shield' });
});

test('each strike of a multi-hit attack spends the same finite barrier pool', () => {
  const p1 = [{ ...mew, moves: ['Double Kick', 'Splash'] }];
  const base = start(bossRules(), { p1 });
  const shielded = start(bossRules({ type: 'faintPhase', afterFaints: 0, effect: 'shield' }), { p1 });
  for (const battle of [base, shielded]) choose(battle, 'move 2');
  for (const battle of [base, shielded]) choose(battle, 'move 1');
  const foe = shielded.p2.active[0];
  const pool = Math.floor(foe.maxhp / 4);
  const damage = foe.maxhp - base.p2.active[0].hp;
  assert.equal(classicBossView(shielded).shieldHp, Math.max(0, pool - damage));
  assert.equal(foe.maxhp - foe.hp, Math.max(0, damage - pool));
  assert.equal(shielded.log.filter(line => line.startsWith('|boss-phase|shield|')).length, 2);
});

test('cadenced immunity blocks direct damage and still allows status moves', () => {
  const rules = bossRules({ type: 'immunityRound', everyN: 5, turns: 1, banner: 'PAUSE' });
  const damage = start(rules);
  const status = start(rules);
  for (const battle of [damage, status]) {
    for (let turn = 1; turn <= 4; turn++) choose(battle, 'move 3');
    assert.deepEqual(classicBossView(battle).pending, [{ banner: 'PAUSE', effect: 'immunity' }]);
  }
  choose(damage, 'move 1');
  assert.equal(damage.p2.active[0].hp, damage.p2.active[0].maxhp);
  assert.equal(classicBossView(damage).immuneTurns, 1);
  choose(damage, 'move 1');
  assert.equal(damage.p2.active[0].hp, damage.p2.active[0].maxhp - 50);
  choose(status, 'move 2');
  assert.equal(status.p2.active[0].status, 'par');
});

test('queued threshold healing fires once through snapshot restoration and through recrossing', () => {
  const rules = bossRules({ type: 'hpThresholdPhase', at: 0.95, effect: 'heal', magnitude: 1 / 4, banner: 'SECOND WIND' });
  const battle = start(rules);
  choose(battle, 'move 1');
  choose(battle, 'move 3');
  assert.deepEqual(classicBossView(battle).pending, [{ banner: 'SECOND WIND', effect: 'heal' }]);
  const resumed = restoreClassicBattle(JSON.parse(JSON.stringify(battle)));
  attachClassicScenarioRules(resumed, rules);
  attachClassicBossRules(resumed, rules);
  for (const copy of [battle, resumed]) {
    choose(copy, 'move 3');
    assert.equal(copy.p2.active[0].hp, copy.p2.active[0].maxhp);
    choose(copy, 'move 1');
    choose(copy, 'move 3');
    assert.equal(copy.log.filter(line => line.startsWith('|boss-phase|activate|SECOND WIND')).length, 1);
  }
  assert.deepEqual(State.normalize(resumed.toJSON()), State.normalize(battle.toJSON()));
});

test('regeneration consumes one turn at each upkeep and cannot refill past max HP', () => {
  const rules = bossRules({ type: 'faintPhase', afterFaints: 0, effect: 'regen', magnitude: { turns: 2, pct: 0.1 } });
  const battle = start(rules);
  choose(battle, 'move 1');
  choose(battle, 'move 1');
  const foe = battle.p2.active[0];
  const regen = Math.floor(foe.maxhp / 10);
  assert.equal(foe.hp, foe.maxhp - 100 + regen);
  assert.deepEqual(classicBossView(battle).regen, { turns: 1, pct: 0.1 });
  choose(battle, 'move 3');
  assert.equal(foe.hp, foe.maxhp);
  assert.equal(classicBossView(battle).regen, null);
});

test('cleanse removes poison, Leech Seed and partial trapping once on the activation turn', () => {
  const battle = start(bossRules({ type: 'faintPhase', afterFaints: 0, effect: 'cleanse' }));
  const foe = battle.p2.active[0];
  const source = battle.p1.active[0];
  foe.setStatus('tox', source);
  foe.addVolatile('leechseed', source);
  foe.addVolatile('partiallytrapped', source, battle.dex.moves.get('Wrap'));
  choose(battle, 'move 3');
  assert.equal(foe.status, 'tox');
  assert.ok(foe.volatiles.leechseed);
  assert.ok(foe.volatiles.partiallytrapped);
  choose(battle, 'move 3');
  assert.equal(foe.status, '');
  assert.ok(!foe.volatiles.leechseed);
  assert.ok(!foe.volatiles.partiallytrapped);
});

test('foe surge and same-type amplification compose before campaign damage modifiers', () => {
  const p2 = [{ ...blissey, species: 'Blastoise', ability: 'Torrent', level: 50, moves: ['Water Gun'] }];
  const base = start(bossRules(), { p2 });
  const raised = start(bossRules(
    { type: 'faintPhase', afterFaints: 0, effect: 'surge' },
    { type: 'hpThresholdPhase', at: 1, effect: 'stabBoost' },
  ), { p2 });
  for (const battle of [base, raised]) choose(battle, 'move 3');
  const hp = base.p1.active[0].hp;
  assert.equal(raised.p1.active[0].hp, hp);
  for (const battle of [base, raised]) choose(battle, 'move 3');
  const native = hp - base.p1.active[0].hp;
  assert.equal(hp - raised.p1.active[0].hp, Math.floor(Math.floor(native * 1.25) * 1.2));
});

test('a foe faint threshold queues the Ward for its replacement and reduces direct damage', () => {
  const teams = {
    p1: [{ ...mew, moves: ['Seismic Toss', 'Splash', 'Tackle'] }],
    p2: [{ ...blissey, species: 'Abra', ability: 'Inner Focus', level: 1 }, blissey],
  };
  const base = start(bossRules(), teams);
  const warded = start(bossRules({ type: 'faintPhase', afterFaints: 1, effect: 'ward', magnitude: 1, banner: 'WARD' }), teams);
  for (const battle of [base, warded]) {
    choose(battle, 'move 1');
    assert.equal(battle.p2.activeRequest.forceSwitch[0], true);
    assert.equal(battle.choose('p2', 'switch 2'), true);
    choose(battle, 'move 2');
  }
  assert.deepEqual(classicBossView(warded).pending, [{ banner: 'WARD', effect: 'ward' }]);
  for (const battle of [base, warded]) choose(battle, 'move 3');
  assert.equal(classicBossView(warded).wardTurns, 1);
  const nativeDamage = base.p2.active[0].maxhp - base.p2.active[0].hp;
  const reducedDamage = warded.p2.active[0].maxhp - warded.p2.active[0].hp;
  assert.equal(reducedDamage, Math.floor(nativeDamage * 0.75));
});

test('a boss with an unknown configured mechanic fails explicitly', () => {
  assert.throws(() => start(bossRules({ type: 'unknown', banner: 'MISSING' })), /Unsupported boss phase/);
});
