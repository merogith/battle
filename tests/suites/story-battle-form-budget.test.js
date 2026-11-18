import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { loadEngine } from '../helpers/load-engine.js';

let harness, window, engine;

before(async () => {
  harness = await loadEngine();
  ({ window, engine } = harness);
});

after(() => harness?.teardown());

function draft(name, gimmick, options = {}) {
  return {
    name,
    build: {
      m: ['Splash', 'Amnesia', 'Protect', 'Rest'],
      n: 'Hardy',
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      gimmick,
      ...options,
    },
  };
}

async function start({ mode = 'story', classic = true, playerDraft, foeDraft } = {}) {
  harness.reset();
  engine.settings.classicMode = classic;
  engine.state.mode = mode;
  engine.state.p1Draft = playerDraft || [draft('Snorlax', 'TERA', { teraType: 'Ghost' }), draft('Chansey', 'DYNAMAX')];
  engine.state.p2Draft = foeDraft || [draft('Blissey', 'TERA', { teraType: 'Stellar' }), draft('Scizor', 'MEGA', { i: 'Scizorite' })];
  window.aiDecision = () => null;
  window.aiChooseGimmick = () => null;
  await window.startBattle();
  engine.state.fActive = engine.state.foeParty[0];
}

function queuePlayerForm(kind) {
  const state = engine.state;
  state.p1GimmickIntent = { kind, slot: state.playerParty.indexOf(state.pActive) };
}

async function switchBoth() {
  window.aiDecision = () => 1;
  await window.playTurn(null, 1);
  window.aiDecision = () => null;
}

test('Story Classic grants each side one activation and resets both budgets on retry', async () => {
  await start();
  const state = engine.state;
  window.aiChooseGimmick = engine.aiChooseGimmick;
  queuePlayerForm('TERA');
  await window.playTurn(0, null);
  assert.equal(state.pActive.teraActivated, true);
  assert.equal(state.fActive.teraActivated, true);

  await switchBoth();
  assert.equal(state.pActive.name, 'Chansey');
  assert.equal(state.fActive.name, 'Scizor');
  assert.equal(engine.aiChooseGimmick(state.fActive, state.pActive), null);
  window.showMoves();
  assert.equal(window.document.querySelector('#move-menu [data-gimmick="DYNAMAX"]'), null);

  queuePlayerForm('DYNAMAX');
  window.aiChooseGimmick = () => 'MEGA';
  await window.playTurn(0, null);
  assert.equal(state.pActive.dynamaxed, false);
  assert.equal(state.fActive.megaEvolved, false);

  window.aiDecision = () => 0;
  queuePlayerForm('DYNAMAX');
  await window.playTurn(0, null);
  assert.equal(state.fActive.name, 'Blissey');
  assert.equal(state.pActive.dynamaxed, false);

  await window.startBattle();
  state.fActive = state.foeParty[0];
  window.aiDecision = () => null;
  window.aiChooseGimmick = engine.aiChooseGimmick;
  queuePlayerForm('TERA');
  await window.playTurn(0, null);
  assert.equal(state.pActive.teraActivated, true);
  assert.equal(state.fActive.teraActivated, true);
});

test('only a successful Z-Move spends the Story Classic budget', async () => {
  await start({
    playerDraft: [draft('Snorlax', 'ZMOVE', { i: 'Firium Z', m: ['Tackle', 'Flamethrower', 'Protect', 'Rest'], teraType: 'Ghost' })],
    foeDraft: [draft('Blissey', 'STANDARD')],
  });
  queuePlayerForm('ZMOVE');
  await window.playTurn(0, null);
  assert.equal(engine.state.pActive.zMoveUsed, false);
  assert.equal(engine.state.usedZ, false);

  queuePlayerForm('ZMOVE');
  await window.playTurn(1, null);
  assert.equal(engine.state.pActive.zMoveUsed, true);
  assert.equal(engine.state.usedZ, true);

  queuePlayerForm('TERA');
  await window.playTurn(0, null);
  assert.equal(engine.state.pActive.teraActivated, false);
});

for (const [label, rules] of [
  ['Story Unlimited', { classic: false }],
  ['Quick Battle Classic', { mode: 'pve' }],
]) {
  test(`${label} still allows different forms on the same side`, async () => {
    await start(rules);
    queuePlayerForm('TERA');
    await window.playTurn(0, null);
    assert.equal(engine.state.pActive.teraActivated, true);
    await switchBoth();
    queuePlayerForm('DYNAMAX');
    await window.playTurn(0, null);
    assert.equal(engine.state.pActive.dynamaxed, true);
  });
}
