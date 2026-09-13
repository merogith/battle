import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { Dex } from '@pkmn/dex';
import { loadEngine } from '../helpers/load-engine.js';

let E;
before(async () => { E = await loadEngine(); });
after(() => E.teardown());
beforeEach(() => E.reset());
const plain = value => JSON.parse(JSON.stringify(value));

test('every bundled fixed-gender species agrees with canonical metadata, including legacy saves', () => {
  for (const species of Dex.species.all()) {
    if (!species.gender || !E.engine.baseStats[species.name]) continue;
    const expected = species.gender === 'N' ? null : species.gender;
    for (const previous of [undefined, null, 'M', 'F']) {
      const mon = E.engine.buildPokemon(species.name, { m: ['Tackle'], a: 'None', _gender: previous });
      assert.equal(mon.gender, expected, species.name);
      assert.equal(mon.buildData._gender, expected);
    }
  }
});

test('mixed species preserve valid saved gender and retain canonical ratios', () => {
  for (const gender of ['M', 'F']) {
    const mon = E.engine.buildPokemon('Gothitelle', { m: ['Tackle'], _gender: gender });
    assert.equal(mon.gender, gender);
  }
  assert.equal(E.engine.baseStats.Gothitelle.genderRatio.M, 0.25);
  assert.equal(E.engine.baseStats.Eevee.genderRatio.M, 0.875);
});

test('Mega and Primal forms preserve all persistent modifiers without compounding', () => {
  const modifications = [
    {}, { _storyStatMult: 1.3 }, { expShareLevels: 3 },
    { bonus: { hp: 10, atk: 10, def: 10, spa: 10, spd: 10, spe: 10 } },
    { _storyStatMult: 1.2, expShareLevels: 3, bonus: { atk: 10 },
      _relationshipStatMult: { hp: 1.1, atk: 1.05, spe: 1.1 } },
    { _bossOffMult: 1.2, _bossBulkMult: 1.4, _bossSpeMult: 0.9, _bossHpScale: 3 },
  ];
  for (const [species, form, item] of [
    ['Charizard', 'Charizard-Mega-X', 'Charizardite X'],
    ['Groudon', 'Groudon-Primal', 'Red Orb'],
  ]) for (const extra of modifications) {
    const build = { m: ['Tackle'], n: 'Adamant', i: item, ...extra };
    const mon = E.engine.buildPokemon(species, plain(build));
    const expected = E.engine.buildPokemon(form, plain(build));
    const hp = mon.maxHp;
    mon.currentHp = Math.floor(hp / 2);
    E.engine.state.pActive = mon;
    E.engine.state.fActive = E.mkMon({ species: 'Snorlax', moves: ['Splash'] });
    E.engine.state.playerParty = [mon];
    E.engine.state.foeParty = [E.engine.state.fActive];
    E.window.activateMega(mon, true);
    assert.deepEqual(plain(mon.stats), plain(expected.stats), species + JSON.stringify(extra));
    assert.equal(mon.maxHp, hp, 'Mega/Primal preserves HP');
    assert.equal(mon.currentHp, Math.floor(hp / 2));
    E.window.activateMega(mon, true);
    assert.deepEqual(plain(mon.stats), plain(expected.stats), 'repeat activation does not compound');
  }
});

test('weather forms retain progression and never revive a fainted Pokémon', () => {
  const build = { m: ['Tackle'], n: 'Modest', expShareLevels: 3,
    _storyStatMult: 1.3, _relationshipStatMult: { hp: 1.1, spa: 1.05 } };
  const mon = E.engine.buildPokemon('Castform', plain(build));
  const initial = { hp: mon.maxHp, stats: plain(mon.stats) };
  mon.currentHp = 0;
  for (const name of ['Castform-Rainy', 'Castform-Sunny', 'Castform']) {
    assert.equal(E.window._setMonForm(mon, name, { proportionalHp: true }), true);
    assert.equal(mon.maxHp, initial.hp);
    assert.equal(mon.currentHp, 0);
    assert.deepEqual(plain(mon.stats), initial.stats);
  }
});
