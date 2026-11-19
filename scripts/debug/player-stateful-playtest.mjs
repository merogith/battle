// J25 browser state model. Only checkpoint construction writes game state directly.
// PORT=5304 node scripts/dev-server.cjs
// BATTLE_TEST_URL=http://127.0.0.1:5304/dist/battle.html node scripts/debug/player-stateful-playtest.mjs
// Limit BATTLE_STATEFUL_SEEDS and BATTLE_STATEFUL_COMMANDS to replay a failing prefix.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5304/dist/battle.html');
assert.ok(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
  'Use a loopback server serving the release bundle');
assert.equal(url.search, '', 'Supply the normal packaged launch URL');
const out = resolve(process.env.BATTLE_PLAYTEST_OUT || 'agent-state/playthrough/final-loop/stateful');
const stages = [
  { name: 'early', row: 6, city: 1, badges: 1, gold: 12000, roster: ['Charmander', 'Pikachu', 'Rattata'] },
  { name: 'middle', row: 32, city: 5, badges: 5, gold: 60000, roster: ['Charizard', 'Vulpix', 'Azumarill', 'Golem', 'Machamp', 'Pidgeot'] },
  { name: 'late', row: 47, city: 7, badges: 7, gold: 50000, roster: ['Charizard', 'Vulpix', 'Lucario', 'Gyarados', 'Magnezone', 'Alakazam'] },
];
const seeds = (process.env.BATTLE_STATEFUL_SEEDS || Array.from({ length: 20 }, (_, index) => index + 101).join(','))
  .split(',').map(Number);
const commandsPerRun = Number(process.env.BATTLE_STATEFUL_COMMANDS || 30);
const concurrency = Number(process.env.BATTLE_STATEFUL_WORKERS || 2);
assert.ok(seeds.length && new Set(seeds).size === seeds.length && seeds.every(seed => Number.isInteger(seed) && seed > 0 && seed < 2 ** 32));
assert.ok(Number.isInteger(commandsPerRun) && commandsPerRun > 0);
assert.ok(Number.isInteger(concurrency) && concurrency > 0);
await mkdir(out, { recursive: true });
const releaseUrl = new URL('release.json', url);
const readRelease = async () => {
  const response = await fetch(releaseUrl);
  assert.equal(response.status, 200, 'Release manifest required');
  return response.json();
};
const release = await readRelease();
if (process.env.BATTLE_STATEFUL_RELEASE) {
  assert.equal(release.version, process.env.BATTLE_STATEFUL_RELEASE, 'Unexpected release package');
}
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const reports = [];

function generator(seed) {
  let state = Math.imul(seed, 2654435761) >>> 0;
  return count => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor(state * count / 2 ** 32);
  };
}

const readPrice = text => Number((String(text).match(/([\d,]+)\s*G\b/i)?.[1] || '').replaceAll(',', ''));
const amounts = object => Object.fromEntries(Object.entries(object || {}).filter(([, value]) => value));
const roster = run => [...run.team, ...run.pcBox];
const slots = run => Object.fromEntries(roster(run).map(slot => [slot.id, slot]));
const cap = run => Math.min(6, 2 + run.badges);
const counter = (run, type, key) => run[type]?.[key] || 0;

function savedRoster(team) {
  // Loading adds missing zero bonuses to newly caught builds. Compare effective
  // bonuses so an absent zero and an explicitly stored zero are equivalent.
  return team.map(slot => slot.build ? {
    ...slot, build: { ...slot.build, bonus: amounts(slot.build.bonus) },
  } : slot);
}

function ledger(run) {
  return {
    eventIndex: run.eventIndex,
    gold: run.gold,
    badges: run.badges,
    balls: amounts(run.balls),
    inventory: amounts(run.inventory),
    team: savedRoster(run.team),
    pcBox: savedRoster(run.pcBox),
    freeSafariUsed: Boolean(run.safari?.freeEntryUsed),
    safari: run.safari?.session || null,
    catchRecovery: run.catchRecovery || null,
  };
}

function assertValid(run) {
  assert.ok(run && Number.isInteger(run.gold) && run.gold >= 0, 'Gold must be a nonnegative integer');
  assert.ok(Number.isInteger(run.badges) && run.badges >= 0 && run.badges <= 8);
  for (const bag of [run.inventory, run.balls]) {
    assert.ok(Object.values(bag || {}).every(value => Number.isInteger(value) && value >= 0), 'Inventory cannot contain negative or invalid amounts');
  }
  assert.ok(run.team.length > 0 && run.team.length <= 6);
  assert.ok(run.team.some(slot => !slot.isEgg) && run.team.filter(slot => !slot.isEgg).length <= cap(run));
  assert.ok(run.pcBox.length <= 30);
  assert.equal(new Set(roster(run).map(slot => slot.id)).size, roster(run).length, 'Each partner ID must have exactly one owner');
  for (const slot of roster(run)) {
    assert.ok(slot.id && slot.name, 'Every partner needs an identity');
    if (!slot.isEgg) {
      const moves = slot.build?.m;
      assert.ok(Array.isArray(moves) && moves.length >= 1 && moves.length <= 4 && new Set(moves).size === moves.length,
        `Invalid moveset for ${slot.name}`);
    }
  }
}

function snapshot(run) {
  return {
    gold: run.gold, badges: run.badges, eventIndex: run.eventIndex, balls: run.balls,
    supplies: amounts(run.inventory),
    party: run.team.map(slot => `${slot.id}:${slot.name}`),
    pc: run.pcBox.map(slot => `${slot.id}:${slot.name}`),
    safari: run.safari?.session ? [run.safari.session.encountersUsed, run.safari.session.ballsLeft] : null,
  };
}

async function applyFixture(page, stage, seed) {
  const fixture = new URL(url);
  fixture.searchParams.set('testmega', '1');
  await page.goto(fixture.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.locator('#screen-story-city').waitFor({ timeout: 45000 });
  // The shipped debug URL seeds the underlying save structure. Supply a legal
  // point-in-time team and event before reopening through the ordinary UI.
  await page.evaluate(({ stage, seed }) => {
    const mode = window.StoryMode;
    const run = mode.state;
    const index = window.STORY_EVENTS_RAW.findIndex(row => row[0] === stage.row && row[1] === 'City');
    if (index < 0) throw new Error('Unknown fixture row');
    run.runSeed = seed;
    run._strngState = null;
    run.eventIndex = index;
    run.badges = stage.badges;
    run.gold = stage.gold;
    run.storyDifficulty = 'normal';
    run.gymCleared = Object.fromEntries(Array.from({ length: stage.badges }, (_, n) => [n + 1, true]));
    run.citiesArrived = Object.fromEntries(Array.from({ length: stage.city + 1 }, (_, n) => [n, true]));
    run.profUsed = Object.fromEntries(Array.from({ length: stage.city + 1 }, (_, n) => [n, true]));
    run.team = stage.roster.map((name, index) => ({ id: 'fixture-party-' + index, name, build: window.makeBuild(name) }));
    run.pcBox = [{ id: 'fixture-reserve', name: 'Geodude', build: window.makeBuild('Geodude') }];
    run.balls = { poke: 2, great: 1, ultra: 0, master: 0 };
    run.inventory = { potion: 2, fullRestore: 0, fireStone: 0 };
    run.unlockedGimmicks = stage.badges >= 6 ? ['mega', 'dmax', 'tera', 'z'] : [];
    run.catchTutorialDone = true;
    mode.upgrades.save();
  }, { stage, seed });
}

async function play(seed) {
  const stage = stages[(seed + 1) % stages.length];
  const pick = generator(seed);
  const viewport = seed % 2 ? { width: 390, height: 844 } : { width: 1280, height: 800 };
  const context = await browser.newContext({
    viewport, isMobile: seed % 2 === 1, hasTouch: seed % 2 === 1, reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  await context.route('**/*', route => {
    const target = new URL(route.request().url());
    return target.origin === url.origin || target.protocol === 'data:' ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5500);
  const report = { seed, stage: stage.name, startingRow: stage.row, release, viewport, status: 'passed', inputs: [], commands: [], errors: [] };
  reports.push(report);
  page.on('pageerror', error => report.errors.push(error.message));
  const city = page.locator('#screen-story-city');
  const facility = key => city.locator(`[data-action-key="${key}"]`);
  const screen = id => page.locator('#screen-story-' + id);
  const confirm = page.locator('#modal-game-confirm');
  const catchScreen = screen('catch');

  async function state() {
    return page.evaluate(() => ({
      live: window.StoryMode.state,
      saved: JSON.parse(localStorage.getItem('pbs_story_save')),
    }));
  }

  async function saveState() {
    return (await state()).saved;
  }

  async function click(target, label) {
    report.inputs.push(label);
    await target.click();
  }

  async function ready(target) {
    const overlay = page.locator([
      '.story-tutorial-overlay .story-tutorial-continue:visible',
      'button[data-narr-continue="1"]:visible',
      '#modal-game-alert:not(.hidden) button:visible',
    ].join(', ')).last();
    for (let attempt = 0; attempt < 65; attempt++) {
      if (await overlay.count()) {
        await click(overlay, 'Continue visible tutorial or alert');
      } else if (await target.isVisible()) {
        // A chained tutorial may mount on the following animation frame.
        await page.waitForTimeout(40);
        if (!await overlay.count()) return;
      } else {
        await page.waitForTimeout(60);
      }
    }
    throw new Error('Could not reach ' + target + ' · ' + (await page.locator('.screen:not(.hidden)').evaluateAll(nodes => nodes.map(node => node.id))).join(', '));
  }

  async function visit(key, target) {
    await ready(facility(key));
    await click(facility(key), 'Open ' + key);
    await ready(target);
  }

  async function back(target) {
    await click(target.locator('.story-shop-back-btn'), 'Back to town');
    await ready(city);
  }

  async function decide(label) {
    const action = confirm.getByRole('button', { name: label, exact: true });
    await action.waitFor({ state: 'visible' });
    const message = await confirm.locator('p').innerText();
    await click(action, label + ' confirmation');
    await confirm.waitFor({ state: 'hidden' });
    return message;
  }

  async function resume(target = city) {
    report.inputs.push('Reload ordinary game URL');
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
    const start = page.locator('.menu-btn-quickplay--story');
    await ready(start);
    await click(start, 'Story mode');
    await continueRun(target);
  }

  async function continueRun(target) {
    const control = page.locator('#story-continue-btn');
    await ready(control);
    await click(control, 'Continue Run');
    await ready(target);
  }

  async function saveQuit() {
    const quit = city.getByRole('button', { name: 'Save and quit to Story menu' });
    await ready(quit);
    await click(quit, 'Save & Quit');
    await continueRun(city);
  }

  async function mart(kind) {
    const card = screen('shop').locator(`[data-item-id="${kind}"]`);
    const buy = card.getByRole('button', { name: 'Buy', exact: true });
    const beforeVisit = await saveState();
    await visit('mart', card);
    const before = await saveState();
    const free = beforeVisit.scenesShown?.['tutorial-first-mart'] ? 0 : 5;
    assert.equal(counter(before, 'balls', 'poke'), counter(beforeVisit, 'balls', 'poke') + free, 'Mart welcome gift is granted once');
    const price = readPrice(await card.locator('.price').innerText());
    assert.ok(price > 0);
    if (await buy.isEnabled()) {
      await click(buy, 'Buy ' + kind);
      const after = await saveState();
      const type = kind === 'pokeBall' ? 'balls' : 'inventory';
      const item = kind === 'pokeBall' ? 'poke' : kind;
      assert.equal(after.gold, before.gold - price, 'Purchase must charge posted price once');
      assert.equal(counter(after, type, item), counter(before, type, item) + 1, 'Purchase must grant one unit');
    } else {
      assert.ok(before.gold < price, 'Affordable Mart item should be enabled');
    }
    await back(screen('shop'));
  }

  async function pc(direction) {
    const center = screen('pokemoncenter');
    const beforeVisit = await saveState();
    await visit('center', center.locator('.pc-card').first());
    const before = await saveState();
    const free = beforeVisit.scenesShown?.['tutorial-first-pokemon-center'] ? 0 : 1;
    assert.equal(counter(before, 'inventory', 'fullRestore'), counter(beforeVisit, 'inventory', 'fullRestore') + free, 'Center welcome gift is granted once');
    assert.equal(before.gold, beforeVisit.gold);
    const deposit = direction === 'deposit';
    const release = direction === 'release-cancel';
    const cards = center.locator(`.pc-card[data-pc-row="${deposit ? 'party' : 'pc'}"]:visible`);
    const label = deposit ? 'Deposit' : release ? 'Release' : 'Withdraw';
    const ids = await cards.evaluateAll(nodes => nodes.map(card => card.dataset.pcId));
    if (ids.length) {
      const id = ids[pick(ids.length)];
      const action = cards.and(center.locator(`[data-pc-id="${id}"]`)).getByRole('button', { name: label, exact: true });
      const shouldDisable = deposit ? before.team.length === 1 || before.pcBox.length >= 30
        : !release && before.team.length >= cap(before);
      assert.equal(await action.isDisabled(), shouldDisable, `${label} respects party/PC capacity`);
      if (!shouldDisable) {
        await click(action, `${label} ${id}`);
        if (release) {
          await decide('Cancel');
          assert.deepEqual(ledger(await saveState()), ledger(before), 'Cancel does not release a partner');
        } else {
          const after = await saveState();
          assert.equal(after.gold, before.gold);
          assert.deepEqual(slots(after), slots(before), 'Storage moves preserve the roster and builds');
          assert.ok((deposit ? after.pcBox : after.team).some(slot => slot.id === id));
          assert.ok(!(deposit ? after.team : after.pcBox).some(slot => slot.id === id));
        }
      }
    }
    await back(center);
    return { direction, choices: ids.length };
  }

  async function tutor(outcome) {
    const tutorScreen = screen('tutor');
    const partners = tutorScreen.locator('.story-tutor-mon-toggle:visible');
    await visit('tutor', partners.first());
    const index = pick(await partners.count());
    await click(partners.nth(index), 'Select Tutor partner ' + index);
    const offers = tutorScreen.locator('button.tx-card[data-card-kind="move"]:not([data-disabled="1"]):not([data-equipped="1"]):enabled:visible');
    const count = await offers.count();
    if (count === 0) {
      await back(tutorScreen);
      return { outcome: 'no-offer' };
    }
    const offer = offers.nth(pick(Math.min(count, 8)));
    const name = await offer.getAttribute('data-card-value');
    const before = await saveState();
    const id = before.team[index].id;
    await click(offer, 'Preview ' + name);
    const apply = tutorScreen.locator('.tx-confirm-bar-btn[data-action="move"]');
    await apply.waitFor({ state: 'visible' });
    const price = readPrice(await tutorScreen.locator('.tx-confirm-bar-text:visible').last().innerText());
    if (await apply.isEnabled()) {
      assert.ok(price > 0, 'Paid Tutor quote must have a price');
      await click(apply, 'Confirm Tutor preview');
      const question = await decide(outcome === 'teach' ? 'OK' : 'Cancel');
      assert.equal(readPrice(question), price, 'Tutor confirmation must preserve quote');
      const after = await saveState();
      if (outcome === 'teach') {
        assert.equal(after.gold, before.gold - price);
        assert.ok(after.team.find(slot => slot.id === id).build.m.includes(name), 'Confirmed legal move must be present');
      } else {
        assert.deepEqual(ledger(after), ledger(before), 'Cancel does not change funds, ownership or moves');
      }
    } else {
      outcome = 'unaffordable';
    }
    await back(tutorScreen);
    return { outcome, name };
  }

  async function stone() {
    const shop = screen('stone-shop');
    const card = shop.locator('.story-shop-card').filter({ has: page.getByRole('heading', { name: 'Fire Stone', exact: true }) });
    const buy = card.getByRole('button', { name: /Buy/ });
    await visit('stoneShop', card);
    const before = await saveState();
    if (await buy.isEnabled()) {
      const price = readPrice(await card.innerText());
      assert.ok(price > 0);
      await click(buy, 'Buy Fire Stone');
      const quote = await decide('OK');
      assert.equal(readPrice(quote), price);
      const after = await saveState();
      assert.equal(after.gold, before.gold - price);
      assert.equal(counter(after, 'inventory', 'fireStone'), counter(before, 'inventory', 'fireStone') + 1);
    }
    await back(shop);
  }

  async function evolve() {
    const lab = screen('evolab');
    const partner = lab.locator('.story-tutor-mon-toggle').filter({ hasText: 'Vulpix' });
    await visit('evolab', partner);
    await click(partner, 'Select Vulpix');
    const action = lab.locator('button[onclick*="evoLabEvolve("]').filter({ hasText: /Evolve/ });
    await ready(action);
    const before = await saveState();
    if (await action.isEnabled()) {
      const id = before.team.find(slot => slot.name === 'Vulpix').id;
      await click(action, 'Evolve Vulpix');
      const quote = await decide('OK');
      const price = readPrice(quote);
      assert.ok(price > 0);
      await page.waitForFunction(({ id, gold }) => {
        const run = JSON.parse(localStorage.getItem('pbs_story_save'));
        return run.gold === gold && run.team.some(slot => slot.id === id && slot.name === 'Ninetales');
      }, { id, gold: before.gold - price });
      const after = await saveState();
      assert.deepEqual(Object.keys(slots(after)).sort(), Object.keys(slots(before)).sort());
      assert.equal(counter(after, 'inventory', 'fireStone'), counter(before, 'inventory', 'fireStone') - 1);
      const owned = await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_meta'))?.pokedex?.Ninetales?.caught);
      assert.equal(owned, true, 'Evolution must index the acquired species');
    }
    await back(lab);
  }

  async function safari(mode) {
    const before = await saveState();
    await ready(facility('safari'));
    await click(facility('safari'), 'Open Safari Zone');
    if (before.safari?.freeEntryUsed) {
      const quote = await decide(mode === 'cancel' ? 'Cancel' : 'OK');
      assert.equal(readPrice(quote), 10000, 'Repeat admission price');
      if (mode === 'cancel') {
        assert.deepEqual(ledger(await saveState()), ledger(before));
        return { outcome: 'declined' };
      }
    }
    const throwBall = catchScreen.locator('.story-catch-ball');
    await ready(throwBall);
    const admitted = await saveState();
    assert.equal(admitted.gold, before.gold - (before.safari?.freeEntryUsed ? 10000 : 0));
    assert.equal(admitted.safari?.freeEntryUsed, true);
    if (mode === 'resume') {
      const previousEncounter = admitted.safari.session.encounter;
      await resume(catchScreen);
      await ready(throwBall);
      const resumed = await saveState();
      assert.equal(resumed.gold, admitted.gold, 'Safari resume must not charge a new ticket');
      assert.deepEqual(resumed.safari.session.encounter, previousEncounter, 'Safari resume must not reroll the encounter');
      assert.equal(resumed.safari.session.ballsLeft, admitted.safari.session.ballsLeft);
    }
    if (mode === 'throw' || mode === 'placement-reload') {
      assert.ok(await throwBall.isEnabled(), 'Initial Safari Ball should be available with storage space');
      await click(throwBall, 'Throw a Safari Ball');
      const toPc = catchScreen.getByRole('button', { name: /Send.*to PC/ });
      const continueCatch = catchScreen.locator('[data-catch-continue]');
      await ready(toPc.or(continueCatch).or(throwBall));
      await page.waitForFunction(() => !document.querySelector('#story-catch-body[aria-busy=true]'));
      if (await toPc.isVisible()) {
        if (mode === 'placement-reload') {
          await resume(catchScreen);
          await ready(toPc);
        }
        await click(toPc, 'Send the catch to PC');
      }
      const after = await saveState();
      assert.equal(after.safari.session.ballsLeft, admitted.safari.session.ballsLeft - 1, 'A throw spends exactly one Safari Ball');
      assert.deepEqual(amounts(after.balls), amounts(admitted.balls), 'Safari may not consume ordinary Balls');
      const found = roster(after).filter(slot => !slots(admitted)[slot.id]);
      assert.ok(found.length <= 1, 'One Safari throw can add at most one partner');
      if (found.length) {
        const owned = await page.evaluate(name => JSON.parse(localStorage.getItem('pbs_story_meta'))?.pokedex?.[name]?.caught, found[0].name);
        assert.equal(owned, true, 'Safari catch must index the acquired species');
      }
      if (await continueCatch.isVisible()) {
        await click(continueCatch, 'Continue from Safari result');
      }
      await ready(catchScreen.getByRole('button', { name: /Leave Safari/ }));
      await click(catchScreen.getByRole('button', { name: /Leave Safari/ }), 'Leave Safari');
      await ready(city);
      assert.equal((await saveState()).safari?.session, undefined);
      return { outcome: found.length ? 'caught' : 'miss', placedInPC: found.some(slot => after.pcBox.some(member => member.id === slot.id)) };
    }
    await click(catchScreen.getByRole('button', { name: /Leave Safari/ }), 'Leave Safari');
    await ready(city);
    assert.equal((await saveState()).safari?.session, undefined);
    return { outcome: 'left' };
  }

  function choose(run, counts) {
    const choices = ['mart-ball', 'mart-potion', 'pc-deposit', 'pc-withdraw', 'pc-release-cancel', 'tutor-teach', 'tutor-cancel', 'save-quit'];
    if ((counts.get('reload') || 0) < 2) choices.push('reload');
    if (stage.city >= 5 && run.team.some(slot => slot.name === 'Vulpix')) {
      choices.push(counter(run, 'inventory', 'fireStone') ? 'evolve' : 'stone');
    }
    if (stage.city === 5 && (!run.safari?.freeEntryUsed || run.gold >= 10000)) {
      choices.push('safari-throw', 'safari-placement-reload');
      if (!counts.has('safari-resume')) choices.push('safari-resume');
      if (run.safari?.freeEntryUsed) choices.push('safari-cancel');
    }
    choices.sort((a, b) => (counts.get(a) || 0) - (counts.get(b) || 0));
    return choices[pick(Math.min(choices.length, 5))];
  }

  try {
    report.fixture = 'Documented debug checkpoint only. All tested commands use ordinary UI.';
    assert.deepEqual(await readRelease(), release, 'The release changed before the seed started');
    await applyFixture(page, stage, seed);
    await saveQuit();
    const seeded = await saveState();
    const counts = new Map();
    for (let index = 0; index < commandsPerRun; index++) {
      const before = await saveState();
      assertValid(before);
      const name = choose(before, counts);
      counts.set(name, (counts.get(name) || 0) + 1);
      const record = { name, number: index + 1, before: snapshot(before), startInput: report.inputs.length };
      report.commands.push(record);
      if (name === 'mart-ball' || name === 'mart-potion') {
        await mart(name === 'mart-ball' ? 'pokeBall' : 'potion');
      } else if (name.startsWith('pc-')) {
        record.result = await pc(name.slice(3));
      } else if (name.startsWith('tutor-')) {
        record.result = await tutor(name.slice(6));
      } else if (name === 'stone') {
        await stone();
      } else if (name === 'evolve') {
        await evolve();
      } else if (name.startsWith('safari-')) {
        record.result = await safari(name.slice(7));
      } else if (name === 'reload' || name === 'save-quit') {
        await (name === 'reload' ? resume() : saveQuit());
        assert.deepEqual(ledger(await saveState()), ledger(before), 'Committed player state must survive reload');
      }
      const { live, saved } = await state();
      assertValid(saved);
      assert.deepEqual(ledger(live), ledger(saved), 'Every committed transaction must be persisted');
      assert.equal(saved.eventIndex, seeded.eventIndex, 'Side activities may not silently move the campaign');
      assert.equal(saved.badges, seeded.badges);
      await ready(city.locator('.story-city-objective'));
      record.after = snapshot(saved);
      record.inputCount = report.inputs.length - record.startInput;
    }
    assert.deepEqual(await readRelease(), release, 'The release changed during the seed');
    if (report.errors.length) throw new Error('Uncaught browser exceptions: ' + report.errors.join(' · '));
    console.log(`PASS seed ${seed} · ${stage.name} · ${report.commands.length} commands`);
  } catch (error) {
    report.status = 'failed';
    report.error = error.stack || String(error);
    report.finalState = await state().then(({ saved, live }) => ({ saved: saved && snapshot(saved), live: live && snapshot(live) }), () => null);
    await page.screenshot({ path: join(out, `seed-${seed}-failure.png`), animations: 'disabled', timeout: 5000 }).catch(() => {});
    console.error(`FAIL seed ${seed} · ${stage.name} · ${report.commands.at(-1)?.name || 'setup'} · ${error.message}`);
  } finally {
    await writeFile(join(out, `seed-${seed}.json`), JSON.stringify(report, null, 2) + '\n');
    await context.close();
  }
}

try {
  const remaining = [...seeds];
  await Promise.all(Array.from({ length: Math.min(concurrency, seeds.length) }, async () => {
    while (remaining.length) await play(remaining.shift());
  }));
} finally {
  await browser.close();
}
const summary = {
  release, commandsPerRun, seeds, samples: reports.length,
  passed: reports.filter(report => report.status === 'passed').length,
  failed: reports.filter(report => report.status !== 'passed').map(report => report.seed),
  completedCommands: reports.reduce((total, report) => total + report.commands.filter(command => command.after).length, 0),
  commands: Object.fromEntries([...new Set(reports.flatMap(report => report.commands.map(command => command.name)))].sort().map(name =>
    [name, reports.flatMap(report => report.commands).filter(command => command.name === name && command.after).length])),
};
await writeFile(join(out, 'report.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
process.exitCode = summary.failed.length ? 1 : 0;
