import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Teams } from '@pkmn/sim';
import { chromium } from 'playwright';
/* global settings, state */
import { disguiseTeam, gigantamaxTeam, importedGen1Team, importedGen6Team, importedGen7Team, importedGen9Team, importedSixTeam, rainTeam, teraDanceTeam } from '../fixtures/competitive-teams.mjs';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5177/battle.html');
const pageUrl = new URL('competitive/index.html', base).href;
const out = process.env.BATTLE_COMPETITIVE_SHOTS;
if (out) await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const sizes = [
  { name: 'phone-portrait', width: 320, height: 568, touch: true },
  { name: 'phone-landscape', width: 844, height: 390, touch: true },
  { name: 'phone-short-landscape', width: 568, height: 260, touch: true },
  { name: 'tablet-portrait', width: 820, height: 1180, touch: true },
  { name: 'desktop', width: 1440, height: 900, touch: false },
];

async function atTurn(page, turn) {
  await page.waitForFunction(number => document.getElementById('turn').textContent === `Turn ${number}`, turn);
}

async function fromTitle(page, screenshot) {
  await page.goto(base.href, { waitUntil: 'domcontentloaded' });
  const installHint = page.locator('#pwa-hint-dismiss');
  if (await installHint.isVisible()) await installHint.click();
  const more = page.locator('#menu-more-play-summary');
  if (await more.count()) await more.click();
  const entry = page.getByRole('link', { name: /Competitive Arena/ });
  if (screenshot) {
    await entry.click({ trial: true });
    await page.screenshot({ path: join(out, screenshot), animations: 'disabled' });
  }
  await entry.click();
  await page.waitForURL(pageUrl);
  await page.getByRole('heading', { name: 'Competitive Arena' }).waitFor();
  assert.equal(await page.locator('#setup-player').isVisible(), false);
}

async function finishBattle(page) {
  for (let step = 0; step < 120 && !(await page.locator('#result').isVisible()); step++) {
    const replace = await page.locator('#actions').getAttribute('data-phase') === 'replace';
    const choice = page.locator(`${replace ? '#switches' : '#moves'} button:not(:disabled)`).first();
    await choice.click();
    await page.waitForFunction(() => !document.getElementById('actions').hasAttribute('aria-busy'));
  }
  await page.locator('#result').waitFor({ state: 'visible' });
  assert.equal(await page.getByText('Awaiting lead').count(), 0);
  assert.equal(await page.locator('#moves button, #switches button').count(), 0);
}

async function downloadReplay(page, suffix = '', format = 'gen9ou', teamSize = 3) {
  const [download] = await Promise.all([
    page.waitForEvent('download'), page.getByRole('button', { name: 'Download replay' }).click(),
  ]);
  const name = `arena-${format}-125${teamSize === 6 ? '-6v6' : ''}`;
  assert.equal(download.suggestedFilename(), `${name}.json`);
  const replay = JSON.parse(await readFile(await download.path(), 'utf8'));
  assert.equal(replay.format, format);
  assert.equal(replay.teamSize, teamSize);
  assert.ok(replay.inputLog.some(line => line.startsWith('>p2 move ')));
  if (out) await download.saveAs(join(out, `${name}${suffix}.json`));
  return replay;
}

async function openMoveDetails(page, touch = false) {
  const button = page.getByRole('button', { name: 'Move details' });
  if (touch) await button.tap();
  else await button.click();
  const guide = page.getByRole('dialog', { name: 'Move details' });
  await guide.waitFor();
  return guide;
}

function moveCard(guide, move) {
  return guide.locator('.move-guide-card').filter({ hasText: move });
}

async function closeMoveDetails(page, guide) {
  await page.keyboard.press('Escape');
  await guide.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#inspect-moves').evaluate(node => node === document.activeElement), true);
}

async function testTeamImport(page, context) {
  await page.getByLabel('Battle rules').selectOption('gen9ou');
  const importSection = page.getByText('Import your team', { exact: true });
  const teamBox = page.getByRole('textbox', { name: 'Showdown team export' });
  if (!(await teamBox.isVisible())) await importSection.click();
  await teamBox.fill(importedGen9Team.replace('- Thunderbolt', '- Spore'));
  await page.getByRole('button', { name: 'Start battle' }).click();
  const invalid = page.getByRole('alert').filter({ hasText: /Pikachu can't learn Spore/ });
  await invalid.waitFor();
  assert.match(await invalid.innerText(), /Gen 9 OU rules/);
  assert.equal(await teamBox.getAttribute('aria-invalid'), 'true');
  assert.match(await teamBox.getAttribute('aria-describedby'), /team-import-error/);
  assert.equal(await teamBox.evaluate(node => node === document.activeElement), true);
  assert.equal(await page.locator('#match').isVisible(), false);
  if (out) await page.screenshot({ path: join(out, 'import-rejected.png'), fullPage: true });

  await teamBox.fill(importedGen9Team);
  assert.equal(await teamBox.getAttribute('aria-invalid'), 'false');
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Pikachu.*Lead/ }).click();
  await atTurn(page, 1);
  await page.getByRole('button', { name: /Thunderbolt/ }).click();
  await atTurn(page, 2);
  assert.match(await page.locator('#battle-log').innerText(), /Pikachu used Thunderbolt!/);
  if (out) await page.screenshot({ path: join(out, 'imported-team-turn.png'), fullPage: true });
  await context.setOffline(true);
  await finishBattle(page);
  const replay = await downloadReplay(page, '-imported');
  const playerHeader = '>player p1 ';
  const player = JSON.parse(replay.inputLog.find(line => line.startsWith(playerHeader)).slice(playerHeader.length));
  const imported = Teams.unpack(player.team);
  assert.deepEqual(imported.map(member => member.species), ['Pikachu', 'Gholdengo', 'Dragapult']);
  assert.equal(imported[0].item, 'Light Ball');
  assert.deepEqual(imported[0].moves, ['Thunderbolt', 'Volt Switch', 'Surf', 'Grass Knot']);
  await context.setOffline(false);

  await page.getByRole('button', { name: 'New battle' }).click();
  await page.getByLabel('Battle rules').selectOption('gen6ou');
  await teamBox.fill(importedGen6Team);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Alakazam.*Lead/ }).click();
  await page.getByRole('checkbox', { name: 'Mega Evolve' }).check();
  const mega = await openMoveDetails(page);
  assert.match(await mega.innerText(), /Mega Evolution · Alakazam-Mega/);
  await closeMoveDetails(page, mega);
  await page.getByRole('button', { name: /Psychic/ }).click();
  await atTurn(page, 2);
  assert.match(await page.locator('#battle-log').innerText(), /Alakazam Mega Evolved into Alakazam-Mega!/);
  assert.equal(await page.locator('#player-active .combatant-name').innerText(), 'Alakazam-Mega');
  await page.getByRole('button', { name: 'Reset battle' }).click();

  await page.getByLabel('Battle rules').selectOption('gen7ou');
  await teamBox.fill(importedGen7Team);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Jolteon.*Lead/ }).click();
  await page.getByRole('checkbox', { name: 'Use Z-Move' }).check();
  assert.equal(await page.getByRole('button', { name: /Shadow Ball/ }).isDisabled(), true);
  const crystal = await openMoveDetails(page);
  assert.match(await moveCard(crystal, 'From Thunderbolt').innerText(), /Gigavolt Havoc[\s\S]*Electric[\s\S]*Special[\s\S]*Base power 175[\s\S]*No accuracy check/);
  assert.match(await moveCard(crystal, 'From Volt Switch').innerText(), /Base power 140/);
  if (out) await page.screenshot({ path: join(out, 'z-move-details.png') });
  await closeMoveDetails(page, crystal);
  await page.getByRole('button', { name: /Gigavolt Havoc.*Thunderbolt/ }).click();
  await page.getByText('Jolteon used Gigavolt Havoc!', { exact: true }).waitFor();

  await page.getByRole('button', { name: 'Reset battle' }).click();
  await page.getByLabel('Battle rules').selectOption('gen1ou');
  await teamBox.fill(importedGen1Team);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await atTurn(page, 1);
  const classic = await openMoveDetails(page);
  assert.match(await moveCard(classic, 'Hyper Beam').innerText(), /Physical[\s\S]*Base power 150[\s\S]*Accuracy 90%[\s\S]*can't move next turn if target or sub is not KOed/i);
  if (out) await page.screenshot({ path: join(out, 'gen1-move-details.png') });
  await closeMoveDetails(page, classic);

  await page.getByRole('button', { name: 'Reset battle' }).click();
  const [tauros, snorlax, starmie] = importedGen1Team.split('\n\n');
  await teamBox.fill([snorlax, tauros, starmie].join('\n\n'));
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /^Rest/ }).click();
  await atTurn(page, 2);
  const fight = page.getByRole('button', { name: /^Fight Continue the turn/ });
  assert.doesNotMatch(await fight.innerText(), /undefined|Variable power/);
  await fight.click();
  await atTurn(page, 3);

  await page.getByRole('button', { name: 'Reset battle' }).click();
  await page.getByLabel('Battle rules').selectOption('gen9ou');
  await teamBox.fill(teraDanceTeam);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Flare \(Oricorio\).*Lead/ }).click();
  await atTurn(page, 1);
  assert.match(await page.locator('#player-team').innerText(), /Flare \(Oricorio\)/);
  assert.match(await page.locator('#battle-log').innerText(), /Flare \(Oricorio\) entered the field\./);
  assert.match(await page.getByRole('button', { name: /Revelation Dance/ }).innerText(), /Fire/);
  await page.getByRole('checkbox', { name: 'Tera Electric' }).check();
  assert.match(await page.getByRole('button', { name: /Revelation Dance/ }).innerText(), /Electric/);
  const dance = await openMoveDetails(page);
  assert.match(await moveCard(dance, 'Revelation Dance').innerText(), /Electric[\s\S]*Base power 90[\s\S]*Accuracy 100%/);
  if (out) await page.screenshot({ path: join(out, 'tera-move-details.png') });
  await closeMoveDetails(page, dance);
  const move = page.getByRole('button', { name: /Revelation Dance/ });
  await move.click();
  await atTurn(page, 2);
  assert.match(await page.locator('#battle-log').innerText(), /Flare \(Oricorio\) Terastallized into Electric!/);
  assert.match(await move.innerText(), /Electric/);
  await move.click();
  await atTurn(page, 3);
  assert.equal(await page.locator('#opponent-active .combatant-name').innerText(), 'Slowking-Galar');
  assert.match(await page.locator('#battle-log').innerText(), /Slowking-Galar entered the field\./);
  if (out) await page.screenshot({ path: join(out, 'public-battle-identities.png') });

  await page.getByRole('button', { name: 'Reset battle' }).click();
  await teamBox.fill(disguiseTeam);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Lens \(Zoroark-Hisui\).*Lead/ }).click();
  await atTurn(page, 1);
  await page.getByText('Disguised as Dragapult', { exact: true }).waitFor();
  assert.match(await page.locator('#battle-log').innerText(), /Dragapult entered the field\./);
  if (out) await page.screenshot({ path: join(out, 'owned-illusion.png') });
  await page.getByRole('button', { name: /Hyper Voice/ }).click();
  await atTurn(page, 2);
  assert.equal(await page.getByText('Disguised as Dragapult', { exact: true }).isVisible(), false);
  await page.getByText('Lens (Zoroark-Hisui) was revealed.', { exact: true }).waitFor();
}

async function testWeatherPreview(page) {
  await page.getByRole('button', { name: 'Reset battle' }).click();
  await page.getByRole('textbox', { name: 'Showdown team export' }).fill(rainTeam);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Downpour \(Pelipper\).*Lead/ }).click();
  await atTurn(page, 1);
  assert.equal(await page.locator('#field-weather').innerText(), 'Rain');
  assert.equal(await page.locator('#match').getAttribute('data-weather'), 'rain');
  assert.match(await page.locator('#battle-log').innerText(), /Weather changed to Rain\./);
  const weatherBall = page.getByRole('button', { name: /Weather Ball/ });
  assert.equal(await weatherBall.locator('.move-button-type').innerText(), 'Water');
  assert.equal(await weatherBall.locator('.move-button-category').innerText(), 'Special');
  const guide = await openMoveDetails(page);
  assert.match(await guide.innerText(), /Current weather · Rain/);
  assert.match(await moveCard(guide, 'Weather Ball').innerText(), /Power 100 in rain[\s\S]*Base power 50/);
  assert.match(await moveCard(guide, 'Hurricane').innerText(), /No accuracy check in rain[\s\S]*Base accuracy 70%/);
  if (out) await page.screenshot({ path: join(out, 'rain-move-details.png') });
  await closeMoveDetails(page, guide);
  await weatherBall.click();
  await atTurn(page, 2);
  assert.match(await page.locator('#battle-log').innerText(), /Downpour \(Pelipper\) used Weather Ball!/);
}

async function testBattleStadium(page) {
  const format = 'gen8battlestadiumsingles';
  await page.getByRole('button', { name: 'Reset battle' }).click();
  await page.getByLabel('Battle rules').selectOption(format);
  await page.getByRole('textbox', { name: 'Showdown team export' }).clear();
  const teams = page.locator('#setup-teams > summary');
  await teams.click();
  await page.getByText(/Level 50 · Dynamax and Gigantamax available/).waitFor();
  await teams.click();
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Snorlax.*Lead/ }).click();
  await atTurn(page, 1);
  await page.getByRole('checkbox', { name: 'Dynamax', exact: true }).check();
  const guide = await openMoveDetails(page);
  assert.match(await moveCard(guide, 'Max Strike').innerText(), /Base power 130[\s\S]*No accuracy check/);
  if (out) await page.screenshot({ path: join(out, 'battle-stadium-max-guide.png') });
  await closeMoveDetails(page, guide);
  await page.getByRole('button', { name: /Max Strike.*Body Slam/ }).click();
  await atTurn(page, 2);
  assert.match(await page.locator('#battle-log').innerText(), /Snorlax Dynamaxed![\s\S]*Snorlax used Max Strike!/);
  if (out) await page.screenshot({ path: join(out, 'battle-stadium-dynamax.png') });
  for (const turn of [3, 4]) {
    await page.getByRole('button', { name: /Max Guard.*Rest/ }).click();
    await atTurn(page, turn);
  }
  await page.getByRole('button', { name: /Body Slam/ }).waitFor();
  assert.equal(await page.getByRole('checkbox', { name: 'Dynamax', exact: true }).isVisible(), false);
  await finishBattle(page);
  const replay = await downloadReplay(page, '', format);
  assert.ok(replay.inputLog.includes('>p1 move bodyslam dynamax'));

  await page.getByRole('button', { name: 'New battle' }).click();
  await page.getByRole('textbox', { name: 'Showdown team export' }).fill(gigantamaxTeam);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Snorlax.*Lead/ }).click();
  await page.getByRole('checkbox', { name: 'Gigantamax', exact: true }).check();
  await page.getByRole('button', { name: /G-Max Replenish/ }).click();
  await atTurn(page, 2);
  assert.match(await page.locator('#battle-log').innerText(), /Snorlax Gigantamaxed![\s\S]*Snorlax used G-Max Replenish!/);
  if (out) await page.screenshot({ path: join(out, 'battle-stadium-gigantamax.png') });
}

async function testSixOnSix(page) {
  const teamBox = page.getByRole('textbox', { name: 'Showdown team export' });
  const size = page.getByLabel('Team size', { exact: true });
  const rules = page.getByLabel('Battle rules');
  await page.getByRole('button', { name: 'Reset battle' }).click();
  assert.equal(await size.isVisible(), false, 'Battle Stadium keeps its three-member setup');
  await rules.selectOption('gen9ou');
  await teamBox.clear();
  assert.equal(await size.inputValue(), '3');
  await size.selectOption('6');
  await page.locator('#setup-teams > summary').click();
  assert.match(await page.locator('#setup-player').innerText(), /Primarina, Kingambit, Rillaboom/);
  assert.match(await page.locator('#setup-opponent').innerText(), /Iron Valiant, Ting-Lu, Cinderace/);
  if (out) await page.screenshot({ path: join(out, 'six-on-six-setup.png') });
  await rules.selectOption('gen8battlestadiumsingles');
  assert.equal(await size.isVisible(), false);
  assert.match(await page.locator('#setup-match-summary').innerText(), /3-on-3/);
  await rules.selectOption('gen9ou');
  assert.equal(await size.inputValue(), '6');

  await teamBox.fill(importedGen9Team);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('alert').filter({ hasText: /exactly six Pokémon/ }).waitFor();
  assert.equal(await teamBox.evaluate(node => node === document.activeElement), true);
  await teamBox.fill(importedSixTeam);
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('heading', { name: 'Choose your lead' }).waitFor();
  assert.equal(await page.locator('#player-team li').count(), 6);
  assert.equal(await page.locator('#opponent-team li').count(), 6);
  assert.equal(await page.locator('#switches button').count(), 6);
  if (out) await page.screenshot({ path: join(out, 'six-on-six-preview.png') });
  await page.getByRole('button', { name: /Rotor \(Rotom-Heat\).*Lead/ }).click();
  await atTurn(page, 1);
  assert.equal(await page.locator('#switches button').count(), 5);
  await page.getByRole('button', { name: /Thunderbolt/ }).click();
  await atTurn(page, 2);
  assert.match(await page.locator('#battle-log').innerText(), /Rotor \(Rotom-Heat\) used Thunderbolt!/);
  await finishBattle(page);
  const replay = await downloadReplay(page, '', 'gen9ou', 6);
  for (const side of ['p1', 'p2']) {
    const prefix = `>player ${side} `;
    const team = Teams.unpack(JSON.parse(replay.inputLog.find(line => line.startsWith(prefix)).slice(prefix.length)).team);
    assert.equal(team.length, 6);
  }
}

async function testAllOuFormats(page) {
  for (let generation = 1; generation <= 9; generation++) {
    const format = `gen${generation}ou`;
    for (const size of [3, 6]) {
      await page.getByLabel('Battle rules').selectOption(format);
      await page.getByLabel('Team size', { exact: true }).selectOption(String(size));
      await page.getByRole('button', { name: 'Start battle', exact: true }).click();
      if (generation >= 5) await page.locator('#switches button:enabled').first().click();
      await atTurn(page, 1);
      assert.equal(await page.locator('#player-team li').count(), size);
      assert.equal(await page.locator('#opponent-team li').count(), size);
      assert.match(await page.locator('#format-label').innerText(), new RegExp(`Gen ${generation} OU`));
      await page.locator('#moves button:enabled').first().click();
      await finishBattle(page);
      assert.ok(['win', 'loss', 'draw'].includes(await page.locator('#match').getAttribute('data-result')));
      const replay = await downloadReplay(page, '-matrix', format, size);
      for (const side of ['p1', 'p2']) {
        const prefix = `>player ${side} `;
        const team = Teams.unpack(JSON.parse(replay.inputLog.find(line => line.startsWith(prefix)).slice(prefix.length)).team);
        assert.equal(team.length, size);
      }
      await page.getByRole('button', { name: 'New battle', exact: true }).click();
      console.log(`${format} ${size}-on-${size}: opened, played to a verified result, and exported both teams in the replay`);
    }
  }
  await page.getByLabel('Team size', { exact: true }).selectOption('3');
}

try {
  for (const { name, width, height, touch } of sizes) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage();
    const pageErrors = [];
    const workers = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('worker', worker => workers.push(worker.url()));
    await page.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    await fromTitle(page, out && name === 'desktop' ? 'front-door.png' : null);
    if (out && name === 'desktop') await page.screenshot({ path: join(out, 'competitive-setup.png') });
    if (name === 'phone-portrait') {
      await page.getByText('Import your team', { exact: true }).click();
      await page.getByRole('textbox', { name: 'Showdown team export' }).fill(importedGen9Team);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (out) await page.screenshot({ path: join(out, 'phone-import.png'), fullPage: true });
      await page.getByRole('textbox', { name: 'Showdown team export' }).clear();
      await page.getByText('Import your team', { exact: true }).click();
    }
    await page.getByText('Play with a seed').click();
    await page.getByLabel('Battle seed', { exact: true }).fill('125');
    assert.deepEqual(workers, []);
    await page.getByRole('button', { name: 'Start battle' }).click();
    await page.getByRole('heading', { name: 'Choose your lead' }).waitFor();
    assert.equal(await page.locator('#battle-log').isVisible(), false);
    await page.getByText('Battle log', { exact: true }).click();
    assert.equal(workers.length, 1);
    assert.match(workers[0], /competitive\/showdown-worker\.js$/);
    await page.getByRole('button', { name: /Great Tusk.*Lead/ }).click();
    await atTurn(page, 1);
    assert.equal(await page.locator('#match').getAttribute('data-send-out'), 'true');
    assert.equal(await page.locator('.battlefield img').first().evaluate(image => getComputedStyle(image).animationName), 'none', 'reduced motion keeps the ready field still');
    const field = page.locator('.battlefield');
    const orientation = name === 'phone-portrait' ? 'portrait' : 'landscape';
    assert.ok((await field.evaluate(node => getComputedStyle(node).backgroundImage)).includes(`/battle/${orientation}/bg_neutral.webp`));
    const sprites = field.locator('img:not([hidden])');
    await sprites.nth(1).waitFor();
    const bounds = await field.boundingBox();
    const [opponent, player] = [await sprites.nth(0).boundingBox(), await sprites.nth(1).boundingBox()];
    assert.ok(player.x < opponent.x && player.y > opponent.y, 'the player and opponent have distinct near and far positions');
    for (const sprite of [opponent, player]) {
      assert.ok(sprite.x >= bounds.x && sprite.y >= bounds.y && sprite.x + sprite.width <= bounds.x + bounds.width && sprite.y + sprite.height <= bounds.y + bounds.height, 'sprites remain inside the battlefield');
    }
    if (name === 'phone-short-landscape') {
      await page.evaluate(() => scrollTo(0, 0));
      const reachable = await page.locator('#moves button, #switches button').evaluateAll(buttons => buttons.filter(button => {
        const { left, top, width, height } = button.getBoundingClientRect();
        return button.contains(document.elementFromPoint(left + width / 2, top + height / 2));
      }).length);
      assert.equal(reachable, 6, 'the short landscape view shows all four moves and both switches');
    }
    const guide = await openMoveDetails(page, touch);
    assert.match(await moveCard(guide, 'Headlong Rush').innerText(), /Base power 120[\s\S]*Accuracy 100%[\s\S]*lowers the user/i);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (out) await page.screenshot({ path: join(out, `${name}-move-details.png`) });
    await closeMoveDetails(page, guide);
    assert.match(await page.getByRole('button', { name: /Headlong Rush/ }).innerText(), /8\/8 PP/);
    await atTurn(page, 1);
    await page.getByRole('button', { name: /Headlong Rush/ }).click();
    await atTurn(page, 2);
    assert.ok((await page.locator('#battle-log').innerText()).includes('Corviknight was immune.'));
    let failBackSprite;
    if (name === 'tablet-portrait') {
      const pending = new Promise(resolve => { failBackSprite = resolve; });
      await page.route('**/sprites/gen5ani-back/gholdengo.gif', async route => {
        await pending;
        await route.abort();
      }, { times: 1 });
    }
    try {
      await page.getByRole('button', { name: /Gholdengo.*Switch/ }).click();
      await atTurn(page, 3);
      if (failBackSprite) {
        assert.equal(await page.locator('#player-active img').isVisible(), false, 'the previous species disappears while the incoming sprite loads');
        assert.equal(await page.locator('#player-active .sprite-placeholder').innerText(), 'Gholdengo');
      }
    } finally {
      failBackSprite?.();
    }
    assert.equal(await page.locator('#player-active .combatant-name').innerText(), 'Gholdengo');
    const playerSprite = page.locator('#player-active img');
    await playerSprite.waitFor();
    await playerSprite.evaluate(image => image.decode());
    if (failBackSprite) assert.match(await playerSprite.getAttribute('src'), /\/gen5ani\/gholdengo\.gif$/, 'the same-form front sprite covers a missing back sprite');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (out) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: join(out, `${name}.png`) });
    }
    await context.setOffline(true);
    await page.getByRole('checkbox', { name: 'Tera Steel' }).check();
    await page.getByRole('button', { name: /Make It Rain/ }).click();
    await atTurn(page, 4);
    assert.ok((await page.locator('#battle-log').innerText()).includes('Gholdengo Terastallized into Steel!'));
    assert.equal(await page.getByRole('checkbox', { name: 'Tera Steel' }).isVisible(), false);
    if (name === 'desktop') {
      await finishBattle(page);
      assert.equal(await page.locator('#player-active .combatant-name').innerText(), 'Team fainted');
      assert.equal(await page.locator('#request-heading').innerText(), 'Arena AI wins');
      assert.match(await page.locator('#result-text').innerText(), /\d+ turns? · Pokémon left: you 0, Arena AI [1-6]/);
      assert.equal(await page.getByRole('link', { name: 'Return to main menu' }).getAttribute('href'), '../');
      if (out) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: join(out, 'replay-result.png') });
      }
      await downloadReplay(page);
      await context.setOffline(false);
      await page.getByRole('button', { name: 'New battle' }).click();
      if (process.env.BATTLE_ARENA_COMPLETE_FORMATS === '1') await testAllOuFormats(page);
      else for (let gen = 1; gen <= 8; gen++) {
        await page.getByLabel('Battle rules').selectOption(`gen${gen}ou`);
        await page.getByRole('button', { name: 'Start battle' }).click();
        if (gen >= 5) await page.getByRole('button', { name: /Snorlax.*Lead/ }).click();
        await atTurn(page, 1);
        assert.match(await page.locator('#format-label').innerText(), new RegExp(`Gen ${gen} OU`));
        await page.getByRole('button', { name: /Body Slam/ }).click();
        await atTurn(page, 2);
        assert.ok((await page.locator('#battle-log').innerText()).includes('Snorlax used Body Slam!'));
        await page.getByRole('button', { name: 'Reset battle' }).click();
      }
      await testTeamImport(page, context);
      await testWeatherPreview(page);
      await testBattleStadium(page);
      await testSixOnSix(page);
      await page.getByRole('link', { name: '← Main menu' }).click();
      await page.waitForURL(new URL('./', base).href);
      console.log('desktop: completed-match replay and an accepted browser turn in Gen 1–9 OU passed');
      console.log('desktop: illegal team rejected, imported team battled and replayed offline, Mega Evolution and Z-Move passed');
      console.log('desktop: import focus, move inspection, historical move effects and public identity labels passed');
      console.log('desktop: Gen 8 Battle Stadium Dynamax/Gigantamax and completed replay passed');
      console.log('desktop: six-on-six choice, invalid size, sixth imported lead and complete replay passed');
    }
    assert.deepEqual(pageErrors, []);
    await context.close();
    console.log(`${name} ${width}×${height}: title navigation, lazy worker, lead, move, switch and offline Tera passed`);
  }

  if (process.env.BATTLE_TEST_OFFLINE === '1') {
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await context.newPage();
    const workerUrl = new URL('showdown-worker.js', pageUrl).href;
    const classicUrl = new URL('classic-simulation.js', pageUrl).href;
    await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#menu-offline-entry').click();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 120000 });
    await page.locator('#modal-settings').getByRole('button', { name: 'Close settings' }).click();
    assert.equal(await page.evaluate(async url => Boolean(await caches.match(url)), workerUrl), true,
      'the small Arena worker entry is part of the installed shell');
    await context.setOffline(true);
    const classicExports = await page.evaluate(async url => Object.keys(await import(url)), classicUrl);
    assert.ok(classicExports.length > 0, 'fresh offline shell can import the battle adapter');
    await page.evaluate(() => { settings.animations = false; });
    await page.locator('#menu-more-play-summary').click();
    await page.getByRole('button', { name: 'Quick Battle' }).click();
    await page.waitForFunction(() => state.battleEngine === 'showdown' && !state.isLocked && state.nativeRequests?.[0]?.phase === 'move');
    await page.locator('#screen-battle[data-battle-engine="showdown"] #command-menu [data-cmd="fight"]').click();
    await page.locator('#move-menu .battle-btn-move:enabled').first().click();
    const waitForOfflineTurn = () => page.waitForFunction(() => !state.isLocked &&
      (state.turnNumber > 0 || state.isOver || state.nativeRequests[0]?.phase === 'replace'));
    await waitForOfflineTurn();
    const party = page.locator('#modal-party');
    const reserves = await page.evaluate(() => state.playerParty.length - 1);
    for (let index = 0; index < reserves && await party.isVisible(); index++) {
      await party.getByRole('button', { name: 'Switch', exact: true }).and(party.locator('button:enabled')).first().click();
      await waitForOfflineTurn();
    }
    assert.ok(await page.evaluate(() => state.turnNumber > 0 || state.isOver));
    await fromTitle(page);
    await page.getByRole('button', { name: 'Start battle' }).click();
    await page.getByRole('heading', { name: 'Choose your lead' }).waitFor();
    await page.getByRole('button', { name: /Great Tusk.*Lead/ }).click();
    await atTurn(page, 1);
    await context.close();
    console.log('Installed game: cold offline Quick Battle and Arena turns passed without a media pack');
  }
} finally {
  await browser.close();
}
