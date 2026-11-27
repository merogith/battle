import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const saveKey = 'pbs_story_save';
const metaKey = 'pbs_story_meta';
let window, story, fixture, storage, denySave, alerts;

before(async () => {
  ({ window } = await loadEngine());
  await window.__testReady;
  story = window.StoryMode;
  fixture = window.__storyTest;
});
after(() => window?.close());

function start() {
  storage = new Map();
  denySave = false;
  alerts = [];
  Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => {
      if (denySave && key === saveKey) throw new Error('Storage is read-only');
      storage.set(key, String(value));
    },
    removeItem: key => storage.delete(key),
  } });
  window.__storyExternalSave = false;
  window.__storyRestoreReady = false;
  window.showToast = () => {};
  window.showGameAlert = message => alerts.push(message);
  window.showGameConfirm = async () => true;
  const slot = (name, id, extra) => ({ name, id,
    build: { m: ['Tackle'], ivs: { hp: 21, atk: 31 } }, ...extra });
  fixture.sm = {
    active: true, runSeed: 1978, _strngState: 123, badges: 6, gold: 15000,
    eventIndex: fixture.STORY_EVENTS_RAW.findIndex(row => row[1] === 'City' && row[2] === 'City7'),
    team: [slot('Pidgey', 'evolve'), slot('Pikachu', 'keep', { favorite: true })],
    pcBox: [slot('Rattata', 'sell')],
    settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9], teraOn: true },
    balls: { poke: 3, master: 1 },
    inventory: { rareCandy: 1, mint: 1, vitamin: 1, wishingPiece: 1, linkDiscount50: 1 }, cityRerollsUsed: {}, flags: {},
    pokedex: { seen: [], caught: [] },
    storyDifficulty: 'normal', unlockedGimmicks: [], trainerAssignments: {},
  };
  assert.equal(story.upgrades.save(), true);
  return fixture.sm;
}

test('Fan Club commits the permanent IV and visit consent in a single save', async () => {
  const run = start();
  const before = storage.get(saveKey);
  let consent = 0;
  window.showGameConfirm = async () => { consent++; return true; };
  denySave = true;
  await story.removePermBoost('hp', 'team', 0);
  assert.equal(storage.get(saveKey), before);
  assert.equal(run.team[0].build.ivs.hp, 21);
  assert.equal(run.cityRerollsUsed.fanclubRemoveIvConfirmed, undefined);
  assert.equal(alerts.length, 0, 'failure never announces an IV drop');
  denySave = false;
  await story.removePermBoost('hp', 'team', 0);
  const saved = JSON.parse(storage.get(saveKey));
  assert.equal(saved.team[0].build.ivs.hp, 18);
  assert.equal(saved.cityRerollsUsed.fanclubRemoveIvConfirmed, 1);
  assert.equal(consent, 2, 'fresh consent after the previous write failed');
  assert.equal(alerts.length, 1);
});

test('Underground preserves Pokémon, Gold and confirmed sale on storage denial', async () => {
  const run = start();
  story.pcSwitchTab('underground');
  const protectedCard = window.document.querySelector('[data-pc-id="keep"]');
  assert.match(protectedCard.textContent, /Protected in the Notebook/);
  assert.equal(protectedCard.querySelectorAll('button[onclick*="pcSell"]').length, 0);
  story.pcSwitchTab('storage');
  const before = storage.get(saveKey);
  denySave = true;
  await story.pcSell('sell');
  assert.equal(run.gold, 15000);
  assert.equal(run.pcBox[0]?.id, 'sell');
  assert.equal(storage.get(saveKey), before);
  denySave = false;
  await story.pcSell('sell');
  assert.equal(run.pcBox.length, 0);
  assert.ok(run.gold > 15000);
  const sold = storage.get(saveKey);
  assert.equal(JSON.parse(sold).gold, run.gold);
  await story.pcSell('sell');
  assert.equal(storage.get(saveKey), sold, 'the same partner cannot be sold again');
});

test('A missing, rejected or canceled confirmation cannot sell the Master Ball', async () => {
  const run = start();
  const before = storage.get(saveKey);
  for (const consent of [undefined, async () => { throw new Error('Cannot open confirmation'); }, async () => false, async () => 'true']) {
    window.showGameConfirm = consent;
    await story.sellBall('master');
    assert.equal(run.balls.master, 1);
    assert.equal(storage.get(saveKey), before);
  }
  assert.equal(alerts.length, 2, 'only unavailable confirmation needs an explanation');
  window.showGameConfirm = async () => true;
  await story.sellBall('master');
  assert.equal(run.balls.master, 0);
  assert.ok(run.gold > 15000);
});

test('Evolution preview and rejected write preserve the seed, build, Dex and payment', async () => {
  const run = start();
  const before = storage.get(saveKey);
  const messages = [];
  window.showGameConfirm = async message => { messages.push(message); return false; };
  await story.evoLabEvolve('evolve', 'Pidgeotto');
  assert.match(messages[0], /Pidgey → Pidgeotto/);
  assert.equal(run._strngState, 123, 'flavor line is independent of the gameplay RNG');
  assert.equal(storage.get(saveKey), before);
  window.showGameConfirm = async () => true;
  denySave = true;
  await story.evoLabEvolve('evolve', 'Pidgeotto');
  await story.evoLabEvolveWithCandy('evolve', 'Pidgeotto');
  assert.equal(run._strngState, 123);
  assert.equal(run.gold, 15000);
  assert.equal(run.inventory.rareCandy, 1);
  assert.equal(run.team[0].name, 'Pidgey');
  assert.equal(run.pokedex.caught.length, 0);
  assert.equal(storage.get(metaKey), undefined);
  assert.equal(storage.get(saveKey), before);
  denySave = false;
  await story.evoLabEvolveWithCandy('evolve', 'Pidgeotto');
  const saved = JSON.parse(storage.get(saveKey));
  assert.equal(saved.team[0].name, 'Pidgeotto');
  assert.equal(saved.inventory.rareCandy, undefined);
  assert.equal(saved.gold, 15000);
  assert.ok(saved.pokedex.caught.includes('Pidgeotto'));
  assert.equal(JSON.parse(storage.get(metaKey)).pokedex.Pidgeotto.acquisition, 'evolution');
});

test('A denied trainer answer remains available and its retry settles once', () => {
  const run = start();
  const before = storage.get(saveKey);
  denySave = true;
  assert.equal(fixture.banterRecordExchange(12, 'negative', 'stoic'), null);
  assert.equal(run.banterStats, undefined);
  assert.equal(run.banterPersona, undefined);
  assert.equal(storage.get(saveKey), before);
  denySave = false;
  assert.equal(fixture.banterRecordExchange(12, 'negative', 'stoic'), 'neutral');
  assert.equal(fixture.banterRecordExchange(12, 'negative', 'negative'), 'neutral');
  const saved = JSON.parse(storage.get(saveKey));
  assert.equal(saved.banterStats.stoic, 1);
  assert.equal(saved.banterByRow[12].pick, 'stoic');
});

test('The featured counter waits for a durable offer and keeps it across visits', () => {
  const run = start();
  denySave = true;
  story.enterShop('dept');
  assert.ok(window.document.querySelector('[data-shop-stock-retry]'));
  assert.equal(window.document.querySelectorAll('.story-featured-section [data-item-id]').length, 0);
  assert.equal(run._strngState, 123);
  assert.equal(run.deptItemOffersByCity, undefined);
  denySave = false;
  window.document.querySelector('[data-shop-stock-retry]').click();
  const offers = JSON.parse(storage.get(saveKey)).deptItemOffersByCity;
  assert.ok(Object.values(offers).some(local => local.length === 3));
  assert.equal(window.document.querySelectorAll('.story-featured-section [data-item-id]').length, 3);
  const nextRng = run._strngState;
  story.enterShop('dept');
  assert.deepEqual(JSON.parse(storage.get(saveKey)).deptItemOffersByCity, offers);
  assert.equal(run._strngState, nextRng);
});

test('Late move list completion cannot replace caches owned by the current party', async () => {
  const run = start();
  const oldWarm = window.__storySim.warmPreparation();
  const current = start();
  assert.notEqual(run, current);
  current.team.splice(0, 1);
  const newWarm = window.__storySim.warmPreparation();
  assert.equal(await oldWarm, false);
  assert.equal(await newWarm, true);
  assert.equal(fixture.sm.team[0].name, 'Pikachu');
});

test('A paid lesson and voucher transactions update the build and payment together', async () => {
  const run = start();
  const first = run.team[0];
  const cases = [
    { title: 'gold lesson', action: () => story.tutorChangeNature(0, 'Bold'), field: 'n', value: 'Bold' },
    { title: 'mint', action: () => story.tutorChangeNatureWithVoucher(0, 'Adamant'), key: 'mint', field: 'n', value: 'Adamant' },
    { title: 'EV voucher', action: () => story.evTrainerApplyPresetWithVitamin(0, 'equal'), key: 'vitamin', field: 'evs',
      value: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 } },
    { title: 'Wishing Piece', action: () => story.colressApplyTera(0, 'Ghost', true), key: 'wishingPiece', field: 'teraType', value: 'Ghost' },
  ];
  for (const { title, action, key, field, value } of cases) {
    const snapshot = storage.get(saveKey);
    const build = first.build;
    const gold = run.gold;
    denySave = true;
    await action();
    assert.equal(storage.get(saveKey), snapshot, title);
    assert.equal(first.build, build, title);
    assert.equal(run.gold, gold, title);
    if (key) assert.equal(run.inventory[key], 1, title);
    denySave = false;
    await action();
    const saved = JSON.parse(storage.get(saveKey));
    assert.deepEqual(saved.team[0].build[field], value, title);
    if (key) {
      assert.equal(saved.inventory[key], undefined, title);
      assert.equal(saved.gold, gold, title);
    } else assert.ok(saved.gold < gold, title);
  }
});

test('Cable Link preserves the partner, discount and RNG until a swap is saved', async () => {
  const run = start();
  const originalPartner = run.team[0];
  const before = storage.get(saveKey);
  denySave = true;
  await story.linkReroll(0, { useVoucher: true });
  assert.equal(run.team[0], originalPartner);
  assert.equal(run.inventory.linkDiscount50, 1);
  assert.equal(run.gold, 15000);
  assert.equal(run._strngState, 123);
  assert.equal(run.cityRerollsUsed.r_0, undefined);
  assert.equal(storage.get(saveKey), before);
  denySave = false;
  await story.linkReroll(0, { useVoucher: true });
  const saved = JSON.parse(storage.get(saveKey));
  assert.notEqual(saved.team[0].name, originalPartner.name);
  assert.ok(saved.gold < 15000);
  assert.equal(saved.cityRerollsUsed.r_0, 1);
  assert.equal(saved.inventory.linkDiscount50, undefined);
  assert.ok(saved.pokedex.caught.includes(saved.team[0].name));
});

test('Cable Link prevents irreversible trades of protected partners and still allows rebuilds', async () => {
  const run = start();
  run.team[0].unsellable = true;
  // A legacy build can lack a resolved ability, gender and shiny marker.
  run.team[1].build.evs = { atk: 300 };
  let confirmationCount = 0;
  window.showGameConfirm = async () => { confirmationCount++; return true; };
  story.enterLink();
  for (const [idx, reason] of [[0, /Story-locked/], [1, /Protected in the Notebook/]]) {
    const card = () => window.document.querySelector(`#link-mon-${idx}`);
    card().querySelector('.story-tutor-mon-toggle').click();
    assert.match(card().textContent, reason);
    for (const action of ['linkReroll', 'linkUpgrade']) {
      const controls = [...card().querySelectorAll(`button[onclick*="${action}"]`)];
      assert.equal(controls.length, 2);
      assert.ok(controls.every(button => button.disabled), `${action} disables both payment paths`);
    }
    assert.equal(card().querySelector('button[onclick*="linkRebuild"]').disabled, false);
  }
  assert.equal(run._strngState, 123, 'opening facility previews does not use the Story RNG');
  assert.equal(run.team[1].build.evs.atk, 300, 'the preview clamps a detached EV spread');

  const before = storage.get(saveKey);
  for (const idx of [0, 1]) {
    await story.linkReroll(idx);
    await story.linkUpgrade(idx, { useVoucher: true });
  }
  assert.equal(confirmationCount, 0);
  assert.equal(run.gold, 15000);
  assert.equal(run.inventory.linkDiscount50, 1);
  assert.equal(run._strngState, 123);
  assert.equal(storage.get(saveKey), before);

  await story.linkRebuild(1);
  assert.equal(confirmationCount, 1);
  const rebuilt = JSON.parse(storage.get(saveKey)).team[1];
  assert.equal(rebuilt.id, 'keep');
  assert.equal(rebuilt.name, 'Pikachu');
  assert.equal(rebuilt.favorite, true);
});
