import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const main = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
const url = new URL('competitive/index.html', main);
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });

async function match(speed, { reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, serviceWorkers: 'block', reducedMotion });
  await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url.href);
  await page.getByLabel('Battle speed').selectOption(speed);
  await page.getByText('Play with a seed').click();
  await page.getByLabel('Battle seed').fill('125');
  await page.getByRole('button', { name: 'Start battle' }).click();
  await page.getByRole('button', { name: /Great Tusk.*Lead/ }).click();
  await page.locator('#moves button:enabled').first().waitFor();
  await page.evaluate(() => {
    window.motionTrace = [];
    window.skipStart = null;
    const skip = document.getElementById('arena-skip-motion');
    new MutationObserver(() => {
      if (skip.hidden) return;
      const box = skip.getBoundingClientRect();
      window.skipStart = box.height >= 44 && skip.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }).observe(skip, { attributes: true, attributeFilter: ['hidden'] });
    const field = document.querySelector('.battlefield');
    new MutationObserver(() => {
      const canvas = field.querySelector('canvas[data-move]');
      const cue = canvas && [canvas.dataset.move, canvas.dataset.outcome];
      if (!cue || cue.join(':') === window.motionTrace.at(-1)?.cue.join(':')) return;
      window.motionTrace.push({ cue, hp: document.querySelector('#player-active meter').value });
    }).observe(field, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-move', 'data-outcome'] });
  });
  return { context, page, errors };
}

const chooseRush = page => page.getByRole('button', { name: /Headlong Rush/ }).click();
async function settle(page) {
  await page.waitForFunction(() => document.getElementById('turn').textContent === 'Turn 2' && !document.getElementById('actions').hasAttribute('aria-busy'));
  const snapshot = await page.evaluate(() => ({
    hp: document.querySelector('#player-active meter').value,
    log: document.getElementById('battle-log').textContent,
    trace: window.motionTrace,
    canvas: document.querySelectorAll('.battle-stage-motion').length,
  }));
  assert.equal(snapshot.canvas, 0, 'a finished turn removes the motion layer');
  assert.equal(snapshot.hp, 42);
  assert.match(snapshot.log, /Corviknight was immune/);
  return snapshot;
}

try {
  let baseline;
  for (const [speed, reduce] of [['normal', false], ['fast', false], ['instant', false], ['normal', true]]) {
    const { context, page, errors } = await match(speed, { reducedMotion: reduce ? 'reduce' : 'no-preference' });
    try {
      await chooseRush(page);
      const { hp, log, trace } = await settle(page);
      baseline ??= { hp, log };
      assert.deepEqual({ hp, log }, baseline);
      assert.deepEqual(trace, (reduce || speed === 'instant') ? [] : [
        { cue: ['headlongrush', 'immune'], hp: 100 },
        { cue: ['bravebird', 'hit'], hp: 100 },
      ], 'a public immunity never plays a hit, and HP waits for actual impact');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pbs_settings')).battleSpeed), speed);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }

  for (const skip of [true, false]) {
    const { context, page, errors } = await match('normal');
    try {
      await chooseRush(page);
      const skipButton = page.getByRole('button', { name: 'Skip animation' });
      await skipButton.waitFor();
      assert.equal(await page.evaluate(() => window.skipStart), true, 'the skip touch target is immediately accessible after choosing a move');
      if (skip) {
        await skipButton.click();
        const { hp, log } = await settle(page);
        assert.deepEqual({ hp, log }, baseline);
      } else {
        await page.getByRole('button', { name: 'Reset battle' }).click();
        await page.getByRole('button', { name: 'Start battle' }).waitFor();
        assert.equal(await page.locator('#match').isVisible(), false);
        assert.equal(await page.locator('.battle-stage-motion').count(), 0);
      }
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }

  console.log('Competitive Arena passed Normal, Fast, Instant, reduced motion, immunity, impact HP, skip, and reset.');
} finally { await browser.close(); }
