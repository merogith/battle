/* global state, settings */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
base.searchParams.set('testbattle', 'charge6');
const profiles = [
  { name: 'phone', touch: true, sizes: [[320, 568], [568, 320], [568, 260], [390, 844], [844, 390]] },
  { name: 'tablet', touch: true, sizes: [[820, 1180], [1180, 820], [1366, 1024]] },
  { name: 'desktop', touch: false, sizes: [[1600, 900], [1024, 600], [950, 1150]] },
];
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const out = process.env.BATTLE_MAIN_RES_SHOTS;
if (out) await mkdir(out, { recursive: true });

// The mobile viewport and its orientation media queries can settle on separate paints.
const viewportPainted = page => page.evaluate(() => new Promise(resolve =>
  requestAnimationFrame(() => requestAnimationFrame(resolve))));

const centerPoint = locator => locator.evaluate(element => {
  const { left, top, width, height } = element.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  return { x, y, hit: element.contains(document.elementFromPoint(x, y)) };
});

async function tapCenter(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const point = await centerPoint(locator);
  assert.ok(point.hit, `${await locator.getAttribute('aria-label')} must receive its center tap`);
  await page.touchscreen.tap(point.x, point.y);
}

async function measureField(page) {
  return page.locator('#battle-field').evaluate(field => {
    const rect = element => element.getBoundingClientRect().toJSON();
    const screen = field.closest('#screen-battle');
    return {
      field: rect(field),
      screen: rect(screen),
      controls: rect(screen.querySelector('.ui-bottom')),
      sprites: ['player', 'foe'].map(side => {
        const sprite = field.querySelector(`#${side}-sprite`);
        const shadow = field.querySelector(`.${side}-platform`);
        return { side, box: rect(sprite), shadow: rect(shadow), rendered: sprite.naturalWidth > 0 && getComputedStyle(sprite).visibility === 'visible' };
      }),
      panels: ['player', 'foe'].map(side => {
        const panel = screen.querySelector(`#${side}-stat-box`);
        const labels = ['.stat-box-name', '.stat-hp-text'].map(selector => {
          const label = panel.querySelector(selector);
          return { text: label.textContent, box: rect(label), clipped: label.scrollHeight > label.clientHeight + 2 || label.scrollWidth > label.clientWidth + 1 };
        });
        return { side, box: rect(panel), labels };
      }),
    };
  });
}

const EDGE_TOLERANCE = 1;
const fits = (box, frame) => box.width > 0 && box.height > 0 && box.left >= frame.left - EDGE_TOLERANCE &&
  box.right <= frame.right + EDGE_TOLERANCE && box.top >= frame.top - EDGE_TOLERANCE && box.bottom <= frame.bottom + EDGE_TOLERANCE;
const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > EDGE_TOLERANCE &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > EDGE_TOLERANCE;
const midpoint = box => box.left + box.width / 2;

function assertField(view, label) {
  assert.ok(fits(view.field, view.screen), `${label}: the illustrated field fits the battle screen`);
  assert.ok(fits(view.controls, view.screen), `${label}: the command dock fits the battle screen`);
  assert.ok(view.field.bottom <= view.controls.top + EDGE_TOLERANCE, `${label}: the command dock starts below the illustrated field`);
  for (const panel of view.panels) {
    assert.ok(fits(panel.box, view.screen), `${label}: ${panel.side} HUD fits the battle screen`);
    for (const stat of panel.labels) {
      assert.ok(stat.text.trim() && !stat.clipped && fits(stat.box, panel.box),
        `${label}: ${panel.side} HUD displays ${stat.text} in full ${JSON.stringify(stat.box)}`);
    }
  }
  for (const sprite of view.sprites) {
    assert.ok(sprite.rendered && fits(sprite.box, view.field), `${label}: ${sprite.side} sprite is loaded and inside the field ${JSON.stringify(sprite.box)}`);
    assert.ok(fits(sprite.shadow, view.field) && Math.abs(midpoint(sprite.box) - midpoint(sprite.shadow)) <= EDGE_TOLERANCE &&
      sprite.box.bottom >= sprite.shadow.top - EDGE_TOLERANCE && sprite.box.bottom <= sprite.shadow.bottom + EDGE_TOLERANCE,
      `${label}: ${sprite.side} contact shadow is aligned beneath the sprite`);
    for (const panel of view.panels) {
      assert.ok(!overlaps(sprite.box, panel.box), `${label}: ${sprite.side} sprite clears the ${panel.side} HUD ${JSON.stringify(panel.box)}`);
    }
  }
  const [player, foe] = view.sprites.map(sprite => sprite.box);
  assert.ok(!overlaps(player, foe), `${label}: both battler silhouettes have room`);
  assert.ok(midpoint(player) < midpoint(foe) && player.bottom > foe.bottom,
    `${label}: the player is staged near-left and the foe far-right`);
}

function assertFieldSteady(before, after, label) {
  for (const edge of ['left', 'right', 'top', 'bottom']) {
    assert.ok(Math.abs(before.field[edge] - after.field[edge]) <= EDGE_TOLERANCE,
      `${label}: opening Fight keeps the field’s ${edge} edge in place`);
  }
  assert.ok(Math.abs(before.controls.top - after.controls.top) <= EDGE_TOLERANCE,
    `${label}: opening Fight keeps the command dock in place`);
}

async function waitForBattleArt(page) {
  await page.waitForFunction(() => ['player', 'foe'].every(side => {
    const sprite = document.getElementById(`${side}-sprite`);
    return sprite?.complete && sprite.naturalWidth > 0 && getComputedStyle(sprite).visibility === 'visible';
  }));
}

async function clippedMoveText(page) {
  return page.locator('#move-menu :is(.move-tile-name, [title="PP"])').evaluateAll(elements => elements.filter(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const text = range.getBoundingClientRect();
    const tile = element.closest('.battle-btn-move').getBoundingClientRect();
    return text.left < tile.left - 1 || text.right > tile.right + 1 || text.top < tile.top - 1 || text.bottom > tile.bottom + 1 ||
      element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 2;
  }).map(element => element.textContent.trim()));
}

async function testTerrainArtwork(page, portrait) {
  const terrain = portrait ? 'Grassy' : 'Electric';
  const folder = portrait ? 'portrait' : 'landscape';
  const waitForScene = scene => page.waitForFunction(({ folder, scene }) => {
    const field = document.querySelector('#battle-field');
    return field?.dataset.scene === scene && getComputedStyle(field).backgroundImage.includes(`/${folder}/bg_${scene}.webp`);
  }, { folder, scene }, { timeout: 5000 });
  await page.evaluate(terrain => {
    settings.terrainBackground = true;
    state.terrain = terrain;
    state.terrainTurns = 5;
    window.refreshBattleBg();
  }, terrain);
  await waitForScene(terrain.toLowerCase());
  await page.evaluate(() => window.toggleTerrainBackground());
  await waitForScene('neutral');
  await page.evaluate(() => {
    state.terrain = null;
    state.terrainTurns = 0;
    window.toggleTerrainBackground();
  });
}

async function testCommandDialogs(page, touch) {
  const party = page.locator('#modal-party');
  const partyCommand = page.locator('#command-menu [data-cmd="party"]');
  if (touch) await tapCenter(page, partyCommand);
  else await page.keyboard.press('p');
  await party.waitFor({ state: 'visible' });
  assert.match(await party.locator('#party-context-text').innerText(), /Switching uses your action/);
  assert.equal(await party.locator('.party-slot').count(), 6);
  assert.equal(await party.locator('.active-mon').getByRole('button', { name: 'Switch', exact: true }).isDisabled(), true);
  await party.getByRole('button', { name: 'Cancel', exact: true }).click();
  await party.waitFor({ state: 'hidden' });

  const runCommand = page.locator('#command-menu [data-cmd="run"]');
  if (touch) await tapCenter(page, runCommand);
  else await page.keyboard.press('r');
  const confirm = page.getByRole('dialog', { name: /forfeits the battle/ });
  await confirm.waitFor({ state: 'visible' });
  await confirm.getByRole('button', { name: 'Cancel', exact: true }).click();
  await confirm.waitFor({ state: 'hidden' });
  assert.ok(await page.locator('#command-menu [data-cmd="fight"]').isEnabled(), 'cancelling a forfeit leaves the fight available');
}

async function compactMoveTaps() {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true,
    serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
  await page.goto(base.href, { waitUntil: 'domcontentloaded' });
  await page.locator('#command-menu [data-cmd="fight"]').waitFor();
  await page.evaluate(() => { window.__testHarness = true; });
  const moves = ['Outrage', 'Dig', 'Earthquake', 'Stone Edge'];

  try {
    for (const [width, height] of [[320, 568], [568, 260], [844, 390]]) {
      await page.setViewportSize({ width, height });
      await page.waitForFunction(({ width, height }) => {
        const screen = document.getElementById('screen-battle');
        const bounds = screen.getBoundingClientRect();
        return screen.dataset.battleLayout === (height > width ? 'stack' : 'arena') &&
          Math.round(bounds.width) === width && Math.round(bounds.height) === height;
      }, { width, height });
      await viewportPainted(page);
      for (const form of [false, true]) {
        for (const [slot, move] of moves.entries()) {
          await page.evaluate(async form => {
            await window.startCharge6TestBattle();
            state.pActive.buildData.gimmick = 'STANDARD';
            state.pActive.buildData.teraType = form ? 'Ground' : null;
          }, form);
          const checkField = slot === 0;
          if (checkField) await waitForBattleArt(page);
          const commandField = checkField ? await measureField(page) : null;
          await page.locator('#command-menu [data-cmd="fight"]').tap();
          const gutter = page.locator('#move-menu .move-menu-controls');
          assert.equal(await gutter.locator('.gimmick-btn').count(), Number(form));
          if (form) await gutter.locator('.gimmick-btn').tap();
          if (checkField) {
            const label = `${width}×${height}${form ? ' with Tera armed' : ''}`;
            assert.deepEqual(await clippedMoveText(page), [], `${label}: move names and PP fit their tiles`);
            const moveField = await measureField(page);
            assertField(commandField, `${label}, commands`);
            assertField(moveField, `${label}, moves`);
            assertFieldSteady(commandField, moveField, label);
          }
          if (out && slot === 0) await page.screenshot({ path: join(out, `battle-${width}x${height}-${form ? 'tera' : 'standard'}.png`) });
          const info = page.getByRole('button', { name: `${move} details`, exact: true });
          await tapCenter(page, info);
          const close = page.getByRole('button', { name: 'Close move details' });
          await close.tap();
          await close.waitFor({ state: 'hidden' });
          const tile = page.locator('#move-menu .battle-btn-move').nth(slot);
          assert.match(await tile.getAttribute('aria-label'), new RegExp(`^${move},`));
          await tapCenter(page, tile);
          try {
            await page.waitForFunction(({ move, form }) => {
              const log = document.querySelector('#battle-log').textContent;
              const awaitingReplacement = !document.querySelector('#modal-party').classList.contains('hidden');
              return log.includes(`Garchomp used ${move}!`) && (!form || log.includes('Garchomp Terastallized')) && (!state.isLocked || awaitingReplacement);
            }, { move, form }, { timeout: 8000 });
          } catch (error) {
            const log = await page.locator('#battle-log').innerText();
            throw new Error(`${width}×${height} ${move} ${form ? 'with Tera' : ''}\n${log}`, { cause: error });
          }
        }
        console.log(`phone ${width}×${height} (${form ? 'Tera armed' : 'no form'}): all four physical move and detail taps passed`);
      }
    }
  } finally {
    await context.close();
  }
}

try {
  for (const { name, touch, sizes } of profiles) {
    const [width, height] = sizes[0];
    const context = await browser.newContext({
      viewport: { width, height }, hasTouch: touch, isMobile: touch,
      serviceWorkers: 'block', reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route =>
      new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#command-menu').waitFor({ state: 'visible' });
    await waitForBattleArt(page);

    if (name === 'phone') {
      const backdrops = await page.evaluate(async () => {
        const scenes = ['neutral', 'electric', 'grassy', 'misty', 'psychic', 'road', 'raid'];
        const results = [];
        for (const layout of ['portrait', 'landscape']) {
          for (const scene of scenes) {
            const image = new Image();
            image.src = window.getBattleBgUrl(scene, layout).slice(5, -2);
            await image.decode();
            results.push({ layout, path: new URL(image.src).pathname, width: image.naturalWidth, height: image.naturalHeight });
          }
        }
        return results;
      });
      assert.equal(new Set(backdrops.map(image => image.path)).size, 14, 'each venue and terrain has a local asset in both compositions');
      for (const { layout, path, width, height } of backdrops) {
        assert.ok(width >= 768 && height >= 512 && (width > height) === (layout === 'landscape'),
          `${path} decodes in its intended ${layout} composition (${width}×${height})`);
      }
    }

    // Viewport emulation provides no physical notch. Simulate safe-area padding on the body.
    await page.addStyleTag({ content: 'body { padding: 18px 32px 23px !important; }' });
    await page.waitForFunction(() => {
      const body = getComputedStyle(document.body);
      return body.paddingTop === '18px' && body.paddingRight === '32px' &&
        body.paddingBottom === '23px' && body.paddingLeft === '32px';
    });
    await page.evaluate(() => window.applyDisplayMode());
    for (const [width, height] of sizes) {
      const layout = touch && height > width ? 'stack' : 'arena';
      await page.setViewportSize({ width, height });
      await page.waitForFunction(({ width, height, touch, layout }) => {
        const frame = document.querySelector('#app-root').getBoundingClientRect();
        return document.querySelector('#screen-battle').dataset.battleLayout === layout &&
          Math.round(frame.left) >= 32 && Math.round(frame.right) <= width - 32 &&
          Math.round(frame.top) >= 18 && Math.round(frame.bottom) <= height - 23 &&
          (!touch || (Math.round(frame.width) === width - 64 && Math.round(frame.height) === height - 41));
      }, { width, height, touch, layout }, { timeout: 5000 });
      await viewportPainted(page);
      const fight = page.locator('#command-menu [data-cmd="fight"]');
      const move = page.locator('#move-menu .battle-btn-move').first();
      const info = page.locator('#move-menu .move-info-hit').first();
      const close = page.getByRole('button', { name: 'Close move details' });
      const back = page.locator('#move-menu .move-menu-back');
      const fieldLabel = `${name} ${width}×${height} (${layout}, safe area)`;
      const folder = layout === 'stack' ? 'portrait' : 'landscape';
      await page.waitForFunction(folder => {
        const field = document.querySelector('#battle-field');
        return getComputedStyle(field).backgroundImage.includes(`/sprites/backgrounds/battle/${folder}/bg_neutral.webp`);
      }, folder, { timeout: 5000 });
      const commandField = await measureField(page);
      assertField(commandField, fieldLabel);
      if ((width === 320 || width === 844) && name === 'phone') await testTerrainArtwork(page, layout === 'stack');
      if (out && (width === 320 || height === 260 || width === 820 || width === 1600)) {
        await page.screenshot({ path: join(out, `field-${width}x${height}-commands.png`) });
      }
      const blocked = await page.locator('#foe-party-bar .party-bar-ball').evaluateAll(balls => {
        const gear = document.querySelector('.battle-settings-btn').getBoundingClientRect();
        return balls.some(ball => {
          const dot = ball.getBoundingClientRect();
          return dot.left < gear.right && dot.right > gear.left && dot.top < gear.bottom && dot.bottom > gear.top;
        });
      });
      assert.equal(blocked, false, 'opponent party markers must leave room for Settings');
      for (const command of ['fight', 'party', 'run']) {
        assert.ok((await centerPoint(page.locator(`#command-menu [data-cmd="${command}"]`))).hit,
          `${fieldLabel}: ${command} is reachable in the command dock`);
      }
      if (height === 260 || width === 1600) await testCommandDialogs(page, touch);
      await fight.focus();
      await page.keyboard.press('f');
      await move.waitFor({ state: 'visible' });
      const moveField = await measureField(page);
      assertField(moveField, `${fieldLabel}, moves`);
      assertFieldSteady(commandField, moveField, fieldLabel);
      assert.deepEqual(await clippedMoveText(page), [], `${fieldLabel}: move names and PP fit their tiles`);
      if (out && (width === 320 || height === 260 || width === 820 || width === 1600)) {
        await page.screenshot({ path: join(out, `field-${width}x${height}-moves.png`) });
      }
      const attackLabel = await move.getAttribute('aria-label');
      if (touch) {
        assert.ok((await info.boundingBox()).width >= 44);
        await info.tap({ timeout: 5000 });
      } else {
        await info.focus();
        await page.keyboard.press('Enter');
      }
      await close.waitFor({ state: 'visible' });
      await page.keyboard.press('1');
      assert.equal(await move.getAttribute('aria-label'), attackLabel, 'inspecting must leave PP and the selected move intact');
      if (touch) await close.tap({ timeout: 5000 });
      else await page.keyboard.press('Escape');
      assert.equal(await info.evaluate(el => el === document.activeElement), true);
      if (touch) await back.tap({ timeout: 5000 });
      else await page.keyboard.press('Escape');
      assert.equal(await fight.evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('f');
      await move.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      assert.equal(await fight.evaluate(el => el === document.activeElement), true);
      console.log(`${name} ${width}×${height} (${layout})`);
    }
    await page.keyboard.press('f');
    await page.keyboard.press('4');
    await page.waitForFunction(() => document.querySelector('#battle-log').textContent.includes('used Stone Edge'));
    assert.deepEqual(errors, []);
    await context.close();
  }
  await compactMoveTaps();
} finally {
  await browser.close();
}
