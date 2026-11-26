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
  let releasePikachu;
  const pendingPikachu = new Promise(resolve => { releasePikachu = resolve; });
  await page.route(/\/sprites\/gen5ani-back(?:-shiny)?\/pikachu\.gif$/, async route => {
    await pendingPikachu;
    await route.continue();
  });
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
  const playerSprite = screen.locator('#player-sprite');
  const foeSprite = screen.locator('#foe-sprite');
  await playerSprite.waitFor();
  await foeSprite.waitFor();
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

  try {
    await party.waitFor();
  } catch (error) {
    const stateAtFailure = await page.evaluate(() => ({
      currentPlayer: state.currentPlayer, locked: state.isLocked, over: state.isOver,
      requests: state.nativeRequests?.map(request => request?.phase), log: document.getElementById('battle-log').textContent,
    }));
    throw new Error(`U-turn did not open replacement. ${JSON.stringify(stateAtFailure)} ${errors.join(' ')}`, { cause: error });
  }
  assert.match(await party.locator('#party-context-text').innerText(), /switching move|finish U-turn/i);
  assert.equal(await party.getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true);
  const during = await snapshot();
  assert.equal(during.active, 'Scizor');
  assert.equal(during.pivotPp, starting.pivotPp - 1);
  assert.equal(during.tossPp, starting.tossPp, 'the queued opposing move waits for the replacement');
  const switchButton = party.locator('.party-slot').filter({ hasText: 'Pikachu' }).getByRole('button', { name: 'Switch' });
  if (out) await page.screenshot({ path: join(out, 'showdown-u-turn-request.png') });
  await playerSprite.evaluate(sprite => {
    sprite.classList.add('anim-hit-flash', 'anim-hit-shake', 'tera-crystal-on', 'sprite-airborne');
    sprite.animate([{ opacity: 0.4 }, { opacity: 0.8 }], { duration: 60000, id: 'outgoing-effect' });
    const container = sprite.parentElement;
    container.querySelector('.status-icon').style.display = 'block';
    for (const className of ['sub-overlay', 'protect-overlay', 'battle-stat-arrow']) {
      const overlay = document.createElement('div');
      overlay.className = className;
      container.append(overlay);
    }
  });
  await switchButton.tap();
  await party.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => state.pActive.name === 'Pikachu' && !state.isLocked && state.currentPlayer === 1);
  const after = await snapshot();
  assert.equal(after.turn, starting.turn + 1, 'replacement completes one turn');
  assert.equal(after.scizorHp, starting.scizorHp);
  assert.equal(after.tossPp, starting.tossPp - 1);
  assert.ok(after.pikachuHp < starting.pikachuHp, 'the incoming Pokémon takes the queued attack');
  assert.equal(await playerSprite.getAttribute('alt'), 'Pikachu');
  assert.equal(await playerSprite.isVisible(), false, 'a slow replacement must never show the outgoing sprite');
  assert.equal(await playerSprite.evaluate(sprite =>
    sprite.matches('.anim-hit-flash, .anim-hit-shake, .tera-crystal-on, .sprite-airborne')), false, 'outgoing visual effects are cleared');
  assert.deepEqual(await playerSprite.evaluate(sprite => ({
    loading: getComputedStyle(sprite.parentElement, '::before').content,
    overlays: sprite.parentElement.querySelectorAll('.sub-overlay, .protect-overlay, .battle-stat-arrow').length,
    status: sprite.parentElement.querySelector('.status-icon').style.display,
    staleAnimation: sprite.getAnimations().some(animation => animation.id === 'outgoing-effect'),
  })), { loading: '""', overlays: 0, status: 'none', staleAnimation: false });
  releasePikachu();
  await playerSprite.waitFor();
  assert.match(await playerSprite.evaluate(sprite => sprite.currentSrc), /\/pikachu\.gif$/);
  assert.equal(await playerSprite.evaluate(sprite => getComputedStyle(sprite.parentElement, '::before').content), 'none');
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
    const engineUrl = new URL('competitive/classic-simulation.js', document.baseURI).href;
    const simulation = await import(engineUrl);
    window.__classicSimulationModule = new Promise(resolve => {
      window.releaseSpriteTestBattle = () => resolve(simulation);
    });
    state.mode = 'pve';
    state.p1Draft = [
      { name: 'Raikou', build: { a: 'Pressure', m: ['Thunderbolt'] } },
      { name: 'Raichu', build: { a: 'Static', m: ['Thunderbolt'] } },
    ];
    state.p2Draft = [{ name: 'Feraligatr', build: { a: 'Torrent', i: 'Life Orb', m: ['Earthquake'] } }];
    window.spriteTestBattle = window.startBattle();
  });
  assert.equal(await page.locator('#player-sprite').isVisible(), false);
  assert.equal(await page.locator('#foe-sprite').isVisible(), false);
  const preparing = await page.evaluate(() => ({
    active: document.getElementById('screen-battle').classList.contains('battle-preparing'),
    hud: getComputedStyle(document.getElementById('player-stat-box')).display,
  }));
  assert.deepEqual(preparing, { active: true, hud: 'none' }, 'the previous battle’s HUD must stay hidden during setup');
  await page.evaluate(async () => {
    window.releaseSpriteTestBattle();
    await window.spriteTestBattle;
    delete window.__classicSimulationModule;
  });
  await screen.waitFor();
  await playerSprite.waitFor();
  assert.match(await playerSprite.evaluate(sprite => sprite.currentSrc), /\/raikou\.gif$/);
  const quakePP = await page.evaluate(() => state.fActive.moves[0].pp);
  await screen.getByRole('button', { name: /Pokémon — switch a party member/ }).tap();
  const partySlot = name => party.locator('.party-slot').filter({ has: page.getByRole('img', { name, exact: true }) });
  await partySlot('Raichu').getByRole('button', { name: 'Switch' }).tap();
  await party.waitFor();
  assert.match(await party.locator('#party-context-text').innerText(), /fainted.*replacement for free/i);
  assert.equal(await party.getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true);
  assert.equal(await party.locator('.active-mon').count(), 0);
  assert.equal(await partySlot('Raichu').getByRole('button', { name: 'Switch' }).isDisabled(), true);
  assert.equal(await playerSprite.isVisible(), false, 'the KO leaves the field empty until a replacement is chosen');
  const returnToRaikou = partySlot('Raikou').getByRole('button', { name: 'Switch' });
  assert.equal(await returnToRaikou.isEnabled(), true);
  if (out) await page.screenshot({ path: join(out, 'showdown-switch-in-ko-request.png') });
  await returnToRaikou.tap();
  await party.waitFor({ state: 'hidden' });
  await fight.waitFor();
  await playerSprite.waitFor();
  assert.match(await playerSprite.evaluate(sprite => sprite.currentSrc), /\/raikou\.gif$/);
  assert.deepEqual(await page.evaluate(() => [state.pActive.name, state.turnNumber, state.fActive.moves[0].pp]),
    ['Raikou', 1, quakePP - 1], 'the replacement adds no foe action');
  assert.match(await screen.locator('#battle-log').textContent(),
    /Raichu entered the field\.[\s\S]*Feraligatr used Earthquake![\s\S]*Raichu fainted\.[\s\S]*Raikou entered the field\./);
  assert.deepEqual(errors, []);
  if (out) await page.screenshot({ path: join(out, 'showdown-switch-in-ko-replaced.png') });
  console.log('A switch-in KO offers a correctly labeled replacement and returns the healthy lead without spending another turn.');

  await page.evaluate(async () => {
    state.mode = 'pvp';
    state.p1Draft = [{ name: 'Pikachu', build: { a: 'Static', teraType: 'Ghost', m: ['Charge'] } }];
    state.p2Draft = [{ name: 'Snorlax', build: { a: 'Immunity', gimmick: 'GMAXDYNAMAX', m: ['Body Slam'] } }];
    await window.startBattle();
  });
  await screen.waitFor();
  const beforeForms = await page.evaluate(() => [state.pActive.currentHp, state.fActive.maxHp]);
  const moves = screen.locator('#move-menu');
  await fight.tap();
  await moves.getByRole('button', { name: 'Use Terastallize to Ghost type', exact: true }).tap();
  await moves.locator('.battle-btn-move:enabled').filter({ hasText: 'Charge' }).tap();
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
  assert.equal(await playerSprite.isVisible(), false);
  assert.equal(await foeSprite.isVisible(), false);
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
  await playerSprite.waitFor();
  await foeSprite.waitFor();
  assert.deepEqual(errors, []);
  console.log('A simultaneous KO collected both hotseat replacement picks and finished one turn.');

  await page.evaluate(async () => {
    state.p1Draft = [{ name: 'Machamp', build: { a: 'No Guard', m: ['Low Kick', 'Thunderbolt'] } }];
    state.p2Draft = [
      { name: 'Zoroark-Hisui', build: { a: 'Illusion', _isShiny: false, m: ['Shadow Ball', 'Psychic'] } },
      { name: 'Snorlax', build: { a: 'Immunity', _isShiny: false, m: ['Splash'] } },
    ];
    await window.startBattle();
  });
  await screen.waitFor();
  assert.equal(await page.evaluate(() => state.fActive.name), 'Zoroark-Hisui');
  const foe = screen.locator('#foe-name');
  const foeTypes = screen.locator('#foe-types');
  const publicSummary = page.locator('#modal-game-alert');
  assert.equal(await foe.innerText(), 'Snorlax');
  await foeSprite.waitFor();
  assert.match(await foeSprite.evaluate(sprite => sprite.currentSrc), /\/snorlax\.gif$/);
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
  await foeSprite.waitFor();
  assert.match(await foeSprite.evaluate(sprite => sprite.currentSrc), /\/zoroark-hisui\.gif$/);
  assert.match(await foeTypes.innerText(), /Ghost/i);
  assert.deepEqual(errors, []);
  console.log('Illusion hid the true sprite, name, types, and summary until damage revealed the Pokémon.');

  await page.route(/\/sprites\/gen5ani-back\/meowth-galar\.gif$/, route => route.abort());
  await page.evaluate(async () => {
    window.__testHarness = true;
    state.mode = 'pve';
    state.p1Draft = [
      { name: 'Scizor', build: { a: 'Technician', m: ['Bullet Punch'] } },
      { name: 'Meowth-Galar', build: { a: 'Pickup', m: ['Iron Head'] } },
    ];
    state.p2Draft = [{ name: 'Blissey', build: { a: 'Natural Cure', m: ['Seismic Toss'] } }];
    await window.startBattle();
  });
  const classicField = page.locator('#screen-battle[data-battle-engine="classic"]');
  const classicSprite = classicField.locator('#player-sprite');
  await classicSprite.waitFor();
  await page.evaluate(async () => {
    state.pActive.currentHp = 0;
    await window.checkFaints();
  });
  await party.waitFor();
  assert.equal(await classicSprite.isVisible(), false, 'the compatibility engine hides a faint even with animations off');
  await partySlot('Meowth-Galar').getByRole('button', { name: 'Switch' }).tap();
  await classicSprite.waitFor();
  assert.match(await classicSprite.evaluate(sprite => sprite.currentSrc), /\/gen5ani\/meowth-galar\.gif$/);
  assert.deepEqual(errors, []);
  console.log('The compatibility battle hid its fainted sprite and displayed exact regional front art after a failed back sprite request.');
} finally {
  await browser.close();
}
