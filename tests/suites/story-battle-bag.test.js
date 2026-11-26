import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';
import { ClassicChoiceError, ClassicSimulation } from '../../scripts/competitive/classic-simulation.mjs';

let harness;
before(async () => { harness = await loadEngine(); });
after(() => harness?.teardown());

function setup(ability = 'Overgrow') {
  const { engine, reset, mkMon, window } = harness;
  reset();
  window.__storyTest.sm = {
    active: true, eventIndex: 0, badges: 0, team: [], pcBox: [], gold: 4500,
    inventory: { fullHeal: 2, emergencyTeleporter: 2, evResetCharm: 1, sandOrb: 1 },
    settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  };
  const lead = mkMon({ species: 'Snorlax', ability: 'Immunity', moves: ['Splash'] });
  const bench = mkMon({ species: 'Pikachu', ability: 'Static', moves: ['Splash'] });
  const foe = mkMon({ species: 'Venusaur', ability, moves: ['Splash'] });
  Object.assign(engine.state, {
    mode: 'story', playerParty: [lead, bench], foeParty: [foe], pActive: lead, fActive: foe,
  });
  window.settings.storyBattleItems = true;
  engine.setForcedFoeMoveSlot(0);
  return { lead, bench, foe, inventory: window.__storyTest.sm.inventory, state: engine.state };
}

function selectItem(name) {
  const { window } = harness;
  window.StoryMode.openBattleBag();
  const item = [...window.document.querySelectorAll('#story-bag-grid .story-bag-item')]
    .find(element => element.querySelector('.name').textContent === name);
  assert.ok(item, name);
  item.click();
}

test('healthy Full Heal targets and the city-only EV Reset Charm cannot spend a battle turn', async () => {
  const { window } = harness;
  const { inventory, state, bench } = setup();
  selectItem('Full Heal');
  assert.doesNotMatch(window.document.getElementById('story-bag-grid').textContent, /EV Reset Charm/);
  window.StoryMode.openEvResetPicker();
  assert.equal(window.document.querySelector('#modal-story-bag h3').textContent, 'Battle Bag');
  const slots = window.document.querySelectorAll('#story-bag-targets .party-slot');
  assert.ok([...slots].every(slot => slot.getAttribute('aria-disabled') === 'true'));
  await window.StoryMode.useBagItemOn(0);
  assert.equal(inventory.fullHeal, 2);
  assert.equal(state.turnNumber, 0);

  bench.status = 'SLP';
  bench.statusTurns = 3;
  selectItem('Full Heal');
  assert.equal(window.document.querySelectorAll('#story-bag-targets .party-slot:not(:disabled)').length, 1);
  await window.StoryMode.useBagItemOn(1);
  assert.equal(inventory.fullHeal, 1);
  assert.equal(bench.status, null);
  assert.equal(bench.statusTurns, 0);
  assert.equal(state.turnNumber, 1);
});

test('legacy Teleporter spends one action and one item on a valid switch through multiple kinds of trap', async () => {
  const { window } = harness;
  for (const trap of ['Block', 'Ingrain', 'Shadow Tag']) {
    const { inventory, state, lead, bench } = setup(trap === 'Shadow Tag' ? trap : 'Overgrow');
    if (trap === 'Block') {
      lead.volatile.partialTrap = 999;
      lead.volatile.partialTrapSrc = trap;
    }
    if (trap === 'Ingrain') lead.volatile.ingrain = true;
    selectItem('Emergency Teleporter');
    const target = window.document.querySelector('#story-bag-targets .party-slot:not(:disabled)');
    assert.match(target?.getAttribute('aria-label') || '', /Switch to Pikachu/);
    await window.StoryMode.useBagItemOn(0);
    assert.equal(inventory.emergencyTeleporter, 2, 'invalid active target does not spend');
    await window.StoryMode.useBagItemOn(1);
    assert.equal(state.pActive, bench);
    assert.equal(state.turnNumber, 1);
    assert.equal(inventory.emergencyTeleporter, 1);
    assert.equal(state.storyTeleporterUsed, true);
    bench.volatile.ingrain = true;
    selectItem('Emergency Teleporter');
    assert.match(window.document.getElementById('story-bag-hint').textContent, /already used/);
    await window.StoryMode.useBagItemOn(0);
    assert.equal(inventory.emergencyTeleporter, 1);
    assert.equal(state.pActive, bench);
  }
});

test('Teleporter refuses an untrapped lead and respects recharge', async () => {
  const { window } = harness;
  const { inventory, state, lead } = setup();
  selectItem('Emergency Teleporter');
  assert.match(window.document.getElementById('story-bag-hint').textContent, /already switch/);
  lead.volatile.ingrain = true;
  lead.volatile.recharge = true;
  selectItem('Emergency Teleporter');
  assert.match(window.document.getElementById('story-bag-hint').textContent, /committed move/);
  await window.StoryMode.useBagItemOn(1);
  assert.equal(inventory.emergencyTeleporter, 2);
  assert.equal(state.turnNumber, 0);
});

test('Sand Orb starts sandstorm on the use turn, applying damage and counting that turn down', async () => {
  const { window } = harness;
  const { inventory, state, lead } = setup();
  const hp = lead.currentHp;
  selectItem('Sand Orb');
  for (let poll = 0; state.isLocked && poll < 100; poll++) {
    await new Promise(resolve => window.setTimeout(resolve, 10));
  }
  assert.equal(state.isLocked, false);
  assert.equal(state.weather, 'Sandstorm');
  assert.equal(state.weatherTurns, 4);
  assert.equal(lead.currentHp, hp - Math.floor(lead.maxHp / 16));
  assert.equal(inventory.sandOrb, undefined);
});

test('Showdown Story choice bypasses Block, Ingrain, and Shadow Tag once while retaining native switches', () => {
  const move = slot => ({ kind: 'move', slot });
  const teleport = slot => ({ kind: 'bag-teleport', slot });
  for (const trap of ['Block', 'Ingrain', 'Shadow Tag']) {
    const { lead, bench, foe } = setup(trap === 'Shadow Tag' ? trap : 'Overgrow');
    const { mkMon } = harness;
    const playerParty = [trap === 'Ingrain' ? mkMon({ species: 'Sceptile', ability: 'Overgrow', moves: ['Ingrain'] }) : lead, bench];
    const foeParty = [trap === 'Block' ? mkMon({ species: 'Blissey', ability: 'Natural Cure', moves: ['Block'] }) : foe];
    const simulator = new ClassicSimulation({ seed: 42, rules: { allowPass: true }, playerParty, foeParty });
    simulator.choose('p1', move(0));
    simulator.choose('p2', move(0));
    assert.equal(simulator.view().requests.p1.bagTeleporter, true, trap);
    assert.throws(() => simulator.choose('p1', { kind: 'switch', slot: 1 }), ClassicChoiceError, trap);
    assert.throws(() => simulator.choose('p1', teleport(0)), ClassicChoiceError, trap);
    simulator.choose('p1', teleport(1));
    const view = simulator.choose('p2', move(0));
    assert.equal(view.turn, 3, trap);
    assert.equal(view.player[1].active, true, trap);
    if (trap === 'Shadow Tag') {
      assert.throws(() => simulator.choose('p1', { kind: 'switch', slot: 0 }), ClassicChoiceError,
        'incoming Pokémon remains subject to the ability');
      const restored = ClassicSimulation.fromSnapshot(simulator.snapshot());
      assert.throws(() => restored.choose('p1', teleport(0)), ClassicChoiceError, 'one-use limit survives snapshots');
    }
  }
});
