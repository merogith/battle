import { after, before, it } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '@pkmn/sim';
import { loadEngine } from '../helpers/load-engine.js';
import { toShowdownSet } from '../differential/showdown-oracle.mjs';

let harness;
before(async () => { harness = await loadEngine(); });
after(() => harness?.teardown());

const attacker = { species: 'Jolteon', ability: 'Volt Absorb', moves: ['Sandstorm', 'Thunderbolt'] };
const defender = { species: 'Umbreon', ability: 'Synchronize', moves: ['Wish'] };
const replacement = { species: 'Machamp', ability: 'Guts', moves: ['Splash'] };

it('a direct KO processes the old turn before the opposing bench enters', async () => {
  const oracle = new Battle({
    formatid: 'gen9customgame', seed: [1, 2, 3, 4],
    p1: { name: 'P1', team: [toShowdownSet(attacker)] },
    p2: { name: 'P2', team: [defender, replacement].map(toShowdownSet) },
  });
  oracle.makeChoices('team 1', 'team 12');
  oracle.makeChoices('move 1', 'move 1');
  const [target, bench] = oracle.sides[1].pokemon;
  target.hp = 1;
  bench.hp = Math.floor(bench.maxhp / 2);
  const oracleHp = bench.hp;
  oracle.makeChoices('move 2', 'move 1');
  assert.equal(oracle.requestState, 'switch');
  oracle.makeChoices('', 'switch 2');
  assert.equal(bench.hp, oracleHp, 'the replacement neither takes sand damage nor receives Wish');
  assert.ok(oracle.log.findIndex(line => line.includes('|faint|p2a: Umbreon')) <
    oracle.log.findLastIndex(line => line.includes('|upkeep')));
  assert.ok(oracle.log.findLastIndex(line => line.includes('|upkeep')) <
    oracle.log.findIndex(line => line.includes('|switch|p2a: Machamp')));

  const { engine, window, mkMon, logs, reset, seedRng } = harness;
  reset();
  seedRng(0);
  const p = mkMon(attacker);
  const f = mkMon(defender);
  const next = mkMon(replacement);
  Object.assign(engine.state, { playerParty: [p], foeParty: [f, next], pActive: p, fActive: f });
  engine.setForcedFoeMoveSlot(0);
  await window.playTurn(0, null);
  assert.equal(engine.state.fSide.wishTurns, 1, 'Wish must be pending at the next turn');
  f.currentHp = 1;
  next.currentHp = Math.floor(next.maxHp / 2);
  const legacyHp = next.currentHp;
  logs.length = 0;
  await window.playTurn(1, null);

  const out = logs.map(({ text }) => text);
  const faint = out.findIndex(text => text.includes('Umbreon fainted'));
  const upkeep = out.findIndex(text => text.includes('Jolteon took') && text.includes('sandstorm'));
  const sendOut = out.findIndex(text => text.includes('Foe sent out Machamp'));
  assert.ok(faint >= 0 && faint < upkeep && upkeep < sendOut, out.join('\n'));
  assert.equal(engine.state.fActive, next);
  assert.equal(next.currentHp, legacyHp);
  assert.equal(next.turnCount, 0);
  assert.equal(engine.state.fSide.wishTurns, 0);
});

it('a second KO during upkeep announces each faint once and finishes before manual replacement', async () => {
  const { engine, window, mkMon, logs, reset, seedRng } = harness;
  reset();
  seedRng(0);
  const p = mkMon({ ...attacker, moves: ['Thunderbolt'] });
  const f = mkMon({ ...defender, moves: ['Splash'] });
  const pNext = mkMon({ species: 'Chansey', moves: ['Splash'] });
  const fNext = mkMon(replacement);
  const playerHp = pNext.currentHp;
  const foeHp = fNext.currentHp;
  p.currentHp = f.currentHp = 1;
  Object.assign(engine.state, {
    playerParty: [p, pNext], foeParty: [f, fNext], pActive: p, fActive: f,
    weather: 'Sandstorm', weatherTurns: 3,
  });
  engine.setForcedFoeMoveSlot(0);

  await window.playTurn(0, null);

  const out = logs.map(({ text }) => text);
  for (const mon of [p, f]) {
    assert.equal(out.filter(text => text.includes(`${mon.name} fainted`)).length, 1, out.join('\n'));
  }
  assert.equal(engine.state.fActive, fNext);
  assert.equal(fNext.currentHp, foeHp);
  assert.equal(fNext.turnCount, 0);
  assert.equal(engine.state.residualPhaseComplete, true);
  assert.ok(!window.document.getElementById('modal-party').classList.contains('hidden'));

  await window.selectPartyMember(1, true);

  assert.equal(engine.state.pActive, pNext);
  assert.equal(pNext.currentHp, playerHp);
  assert.equal(pNext.turnCount, 0);
  assert.equal(engine.state.weatherTurns, 2);
  assert.equal(engine.state.isLocked, false);
});

it('simultaneous voluntary switches use outgoing effective Speed and reverse it under Trick Room', async () => {
  const lead = { species: 'Snorlax', ability: 'Immunity', moves: ['Splash'] };
  const rain = { species: 'Politoed', ability: 'Drizzle', moves: ['Splash'] };
  const fast = { ...attacker, moves: ['Splash'] };
  const sun = { species: 'Torkoal', ability: 'Drought', moves: ['Splash'] };
  const { engine, window, mkMon, logs, reset } = harness;
  for (const [trickRoom, boost, firstEntry, expectedWeather] of [
    [false, 0, 'Torkoal', 'Rain'],
    [true, 0, 'Politoed', 'Sun'],
    [false, 6, 'Politoed', 'Sun'],
  ]) {
    const oracle = new Battle({
      formatid: 'gen9customgame', seed: [1, 2, 3, 4],
      p1: { name: 'P1', team: [lead, rain].map(toShowdownSet) },
      p2: { name: 'P2', team: [fast, sun].map(toShowdownSet) },
    });
    oracle.makeChoices('team 12', 'team 12');
    const outgoing = oracle.sides[0].active[0];
    if (trickRoom) oracle.field.addPseudoWeather('trickroom', outgoing);
    if (boost) oracle.boost({ spe: boost }, outgoing);
    oracle.makeChoices('switch 2', 'switch 2');
    const firstSwitch = oracle.log.slice(oracle.log.indexOf('|turn|1') + 1).find(line => line.startsWith('|switch|'));
    assert.ok(firstSwitch?.includes(`: ${firstEntry}|`), oracle.log.join('\n'));
    assert.equal(oracle.field.weather, expectedWeather === 'Rain' ? 'raindance' : 'sunnyday');

    reset();
    const playerParty = [lead, rain].map(mkMon);
    const foeParty = [fast, sun].map(mkMon);
    playerParty[0].stages.spe = boost;
    Object.assign(engine.state, {
      mode: 'pvp', playerParty, foeParty, pActive: playerParty[0], fActive: foeParty[0],
      trickRoom: trickRoom ? 4 : 0,
    });
    await window.playTurn(null, 1);
    await window.playTurn(null, 1);

    const out = logs.map(({ text }) => text);
    assert.ok(out.find(text => text.includes('sent out'))?.endsWith(`${firstEntry}!`), out.join('\n'));
    assert.equal(engine.state.weather, expectedWeather);
  }
});
