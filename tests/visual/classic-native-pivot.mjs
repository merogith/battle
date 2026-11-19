/* global state, settings */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5177/battle.html');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
assert.equal(url.search + url.hash, '');
const out = process.env.BATTLE_PLAYTEST_OUT;
if (out) await mkdir(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true,
    reducedMotion: 'reduce', serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route =>
    new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => window.prepareGameData()), true);

  // Supply deterministic draft results, then use the same battle entry and
  // touch controls as a local match. A random draft cannot guarantee U-turn.
  await page.evaluate(async () => {
    settings.battleSpeed = 'instant';
    settings.animations = false;
    state.mode = 'pvp';
    state.p1Draft = [
      { name: 'Scizor', build: { a: 'Technician', m: ['U-turn'] } },
      { name: 'Pikachu', build: { a: 'Static', m: ['Thunderbolt'] } },
    ];
    state.p2Draft = [{ name: 'Blissey', build: { a: 'Natural Cure', m: ['Seismic Toss'] } }];
    await window.startBattle();
  });
  const screen = page.locator('#screen-battle[data-battle-engine="showdown"]');
  await screen.waitFor();
  assert.equal(await page.evaluate(() => state.battleEngine), 'showdown');
  const fight = screen.locator('#command-menu [data-cmd="fight"]');
  const chooseMove = async name => {
    await fight.tap();
    await screen.locator('#move-menu button:enabled').filter({ hasText: name }).first().tap();
  };
  const party = page.locator('#modal-party');
  const snapshot = () => page.evaluate(() => ({
    turn: state.turnNumber,
    active: state.pActive.name,
    scizorHp: state.playerParty[0].currentHp,
    pivotPp: state.playerParty[0].moves[0].pp,
    pikachuHp: state.playerParty[1].currentHp,
    tossPp: state.foeParty[0].moves[0].pp,
  }));
  const starting = await snapshot();
  await chooseMove('U-turn');
  await page.waitForFunction(() => state.currentPlayer === 2);
  await chooseMove('Seismic Toss');

  await party.waitFor();
  assert.match(await party.locator('#party-context-text').innerText(), /switching move|finish U-turn/i);
  assert.equal(await party.getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true);
  const during = await snapshot();
  assert.equal(during.active, 'Scizor');
  assert.equal(during.pivotPp, starting.pivotPp - 1);
  assert.equal(during.tossPp, starting.tossPp, 'the queued opposing move waits for the replacement');
  const switchButton = party.locator('.party-slot').filter({ hasText: 'Pikachu' }).getByRole('button', { name: 'Switch' });
  if (out) await page.screenshot({ path: join(out, 'showdown-u-turn-request.png') });
  await switchButton.tap();
  await party.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => state.pActive.name === 'Pikachu' && !state.isLocked && state.currentPlayer === 1);
  const after = await snapshot();
  assert.equal(after.turn, starting.turn + 1, 'replacement completes one turn');
  assert.equal(after.scizorHp, starting.scizorHp);
  assert.equal(after.tossPp, starting.tossPp - 1);
  assert.ok(after.pikachuHp < starting.pikachuHp, 'the incoming Pokémon takes the queued attack');
  const log = await screen.locator('#battle-log').innerText();
  assert.match(log, /Scizor used U-turn![\s\S]*Pikachu[\s\S]*Blissey used Seismic Toss!/);
  assert.equal((log.match(/Scizor used U-turn!/g) || []).length, 1, 'the log preserves each event once');
  assert.equal((log.match(/Blissey used Seismic Toss!/g) || []).length, 1);
  assert.deepEqual(errors, []);
  if (out) await page.screenshot({ path: join(out, 'showdown-u-turn-complete.png') });
  console.log('Native local PvP paused U-turn, accepted a touch switch, and resolved the queued attack within the same turn.');

  // Reproduce a KO on the same turn as a voluntary switch. The previous
  // lead remains the legal replacement while the native active slot is empty.
  await page.evaluate(async () => {
    state.mode = 'pve';
    state.p1Draft = [
      { name: 'Raikou', build: { a: 'Pressure', m: ['Thunderbolt'] } },
      { name: 'Raichu', build: { a: 'Static', m: ['Thunderbolt'] } },
    ];
    state.p2Draft = [{ name: 'Feraligatr', build: { a: 'Torrent', i: 'Life Orb', m: ['Earthquake'] } }];
    await window.startBattle();
  });
  await screen.waitFor();
  const quakePP = await page.evaluate(() => state.fActive.moves[0].pp);
  await screen.getByRole('button', { name: /Pokémon — switch a party member/ }).tap();
  const partySlot = name => party.locator('.party-slot').filter({ has: page.getByRole('img', { name, exact: true }) });
  await partySlot('Raichu').getByRole('button', { name: 'Switch' }).tap();
  await party.waitFor();
  assert.match(await party.locator('#party-context-text').innerText(), /fainted.*replacement for free/i);
  assert.equal(await party.getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true);
  assert.equal(await party.locator('.active-mon').count(), 0);
  assert.equal(await partySlot('Raichu').getByRole('button', { name: 'Switch' }).isDisabled(), true);
  const returnToRaikou = partySlot('Raikou').getByRole('button', { name: 'Switch' });
  assert.equal(await returnToRaikou.isEnabled(), true);
  if (out) await page.screenshot({ path: join(out, 'showdown-switch-in-ko-request.png') });
  await returnToRaikou.tap();
  await party.waitFor({ state: 'hidden' });
  await fight.waitFor();
  assert.deepEqual(await page.evaluate(() => [state.pActive.name, state.turnNumber, state.fActive.moves[0].pp]),
    ['Raikou', 1, quakePP - 1], 'the replacement adds no foe action');
  assert.match(await screen.locator('#battle-log').textContent(),
    /Raichu entered the field\.[\s\S]*Feraligatr used Earthquake![\s\S]*Raichu fainted\.[\s\S]*Raikou entered the field\./);
  assert.deepEqual(errors, []);
  if (out) await page.screenshot({ path: join(out, 'showdown-switch-in-ko-replaced.png') });
  console.log('A switch-in KO offers a correctly labeled replacement and returns the healthy lead without spending another turn.');

  await page.evaluate(async () => {
    state.mode = 'pvp';
    state.p1Draft = [{ name: 'Pikachu', build: { a: 'Static', teraType: 'Ghost', m: ['Thunderbolt'] } }];
    state.p2Draft = [{ name: 'Snorlax', build: { a: 'Immunity', gimmick: 'GMAXDYNAMAX', m: ['Body Slam'] } }];
    await window.startBattle();
  });
  await screen.waitFor();
  const beforeForms = await page.evaluate(() => [state.pActive.currentHp, state.fActive.maxHp]);
  const moves = screen.locator('#move-menu');
  await fight.tap();
  await moves.getByRole('button', { name: 'Use Terastallize to Ghost type', exact: true }).tap();
  await moves.locator('.battle-btn-move:enabled').filter({ hasText: 'Thunderbolt' }).tap();
  await page.waitForFunction(() => state.currentPlayer === 2);
  await fight.tap();
  await moves.getByRole('button', { name: 'Use Gigantamax', exact: true }).tap();
  await moves.locator('.battle-btn-move:enabled').filter({ hasText: 'G-Max Replenish' }).tap();
  await page.waitForFunction(() => state.turnNumber === 1 && !state.isLocked && state.currentPlayer === 1);
  const afterForms = await page.evaluate(() => ({
    playerTera: state.pActive.teraActivated, foeMax: state.fActive.dynamaxed,
    hp: state.pActive.currentHp, max: state.fActive.maxHp,
  }));
  assert.deepEqual(afterForms, { playerTera: true, foeMax: true, hp: beforeForms[0], max: beforeForms[1] * 2 });
  assert.match(await screen.locator('#battle-log').innerText(), /Snorlax used G-Max Replenish![\s\S]*Pikachu was immune/);
  assert.deepEqual(errors, []);
  if (out) await page.screenshot({ path: join(out, 'showdown-mixed-forms.png') });
  console.log('Native local PvP accepted Gigantamax and Terastallization in one battle, preserving the new immunity.');

  await page.evaluate(async () => {
    state.p1Draft = [
      { name: 'Blissey', build: { a: 'Natural Cure', m: ['Final Gambit'] } },
      { name: 'Pikachu', build: { a: 'Static', m: ['Thunderbolt'] } },
    ];
    state.p2Draft = [
      { name: 'Magikarp', build: { a: 'Swift Swim', m: ['Splash'] } },
      { name: 'Slowpoke', build: { a: 'Own Tempo', m: ['Splash'] } },
    ];
    await window.startBattle();
  });
  await screen.waitFor();
  await chooseMove('Final Gambit');
  await page.waitForFunction(() => state.currentPlayer === 2);
  await chooseMove('Splash');
  await party.waitFor();
  assert.deepEqual(await page.evaluate(() => [state.currentPlayer, state.pActive.fainted, state.fActive.fainted]), [1, true, true]);
  const availableReplacement = party.locator('.party-slot').getByRole('button', { name: 'Switch' }).filter({ visible: true });
  await party.locator('.party-slot').filter({ hasText: 'Pikachu' }).getByRole('button', { name: 'Switch' }).tap();
  await page.waitForFunction(() => state.currentPlayer === 2);
  await party.waitFor();
  await availableReplacement.and(party.locator('button:enabled')).tap();
  await party.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => state.currentPlayer === 1 && state.pActive.name === 'Pikachu' && !state.isLocked);
  const afterDoubleFaint = await page.evaluate(() => ({
    turn: state.turnNumber, player: state.pActive.currentHp, foe: state.fActive.currentHp,
  }));
  assert.equal(afterDoubleFaint.turn, 1);
  assert.ok(afterDoubleFaint.player > 0 && afterDoubleFaint.foe > 0);
  assert.deepEqual(errors, []);
  console.log('A simultaneous KO collected both hotseat replacement picks and finished one turn.');

  await page.evaluate(async () => {
    state.p1Draft = [{ name: 'Machamp', build: { a: 'No Guard', m: ['Low Kick', 'Thunderbolt'] } }];
    state.p2Draft = [
      { name: 'Zoroark-Hisui', build: { a: 'Illusion', m: ['Shadow Ball', 'Psychic'] } },
      { name: 'Snorlax', build: { a: 'Immunity', m: ['Splash'] } },
    ];
    await window.startBattle();
  });
  await screen.waitFor();
  assert.equal(await page.evaluate(() => state.fActive.name), 'Zoroark-Hisui');
  const foe = screen.locator('#foe-name');
  const foeTypes = screen.locator('#foe-types');
  const publicSummary = page.locator('#modal-game-alert');
  assert.equal(await foe.innerText(), 'Snorlax');
  assert.match(await foeTypes.innerText(), /^Normal$/i);
  await foe.tap();
  assert.match(await publicSummary.innerText(), /Snorlax · Normal · 100% HP/);
  assert.doesNotMatch(await publicSummary.innerText(), /Zoroark|Ghost|Illusion/);
  await publicSummary.getByRole('button', { name: 'OK', exact: true }).tap();
  await fight.tap();
  assert.match(await moves.locator('.battle-btn-move').filter({ hasText: 'Low Kick' }).getAttribute('aria-label'), /super effective/);
  await moves.locator('.battle-btn-move:enabled').filter({ hasText: 'Thunderbolt' }).tap();
  await page.waitForFunction(() => state.currentPlayer === 2);
  await chooseMove('Shadow Ball');
  await page.waitForFunction(() => state.turnNumber === 1 && !state.isLocked);
  assert.equal(await foe.innerText(), 'Zoroark-Hisui');
  assert.match(await foeTypes.innerText(), /Ghost/i);
  assert.deepEqual(errors, []);
  console.log('Illusion hid the true name, types, and summary until damage revealed the Pokémon.');
} finally {
  await browser.close();
}
