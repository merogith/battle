/* global state, settings */
import assert from 'node:assert/strict';
import { userInfo } from 'node:os';
import { chromium, firefox, webkit } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5173/battle.html');
const engine = process.env.BATTLE_TEST_ENGINE || 'chromium';
const browserType = { chromium, firefox, webkit }[engine];
assert.ok(browserType, `Unsupported browser engine ${engine}`);
const executables = { chromium: process.env.BATTLE_TEST_CHROMIUM, webkit: process.env.BATTLE_TEST_WEBKIT };
// GitHub's job container sets HOME to a directory owned by a different user.
// Give Firefox the actual current user's home without changing other job steps.
const env = engine === 'firefox' && process.env.GITHUB_ACTIONS === 'true'
  ? { ...process.env, HOME: userInfo().homedir }
  : undefined;
const browser = await browserType.launch({ executablePath: executables[engine], env });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: engine !== 'firefox', hasTouch: true,
    reducedMotion: 'no-preference', serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => window.prepareGameData()), true);
  const screen = page.locator('#screen-battle[data-battle-engine="showdown"]');
  const canvas = screen.locator('.battle-stage-motion');
  const foeHp = screen.locator('#foe-hp-bar');
  const log = screen.locator('#battle-log');
  const fight = screen.getByRole('button', { name: /Fight — choose a move/ });

  // Record short-lived frames in the page rather than relying on driver polling.
  await page.evaluate(() => {
    window.motionProbe = { cues: [], skip: false, skips: 0 };
    new MutationObserver(records => {
      const probe = window.motionProbe;
      for (const record of records) {
        const candidates = record.type === 'attributes' ? [record.target] : record.addedNodes;
        for (const node of candidates) {
          if (!(node instanceof HTMLCanvasElement) || !node.dataset.outcome) continue;
          const { move, outcome } = node.dataset;
          const button = document.getElementById('battle-skip-motion');
          const box = button.getBoundingClientRect();
          const overlaps = ['foe-stat-box', 'player-stat-box', 'battle-log'].filter(id => {
            const hud = document.getElementById(id).getBoundingClientRect();
            return box.left < hud.right && box.right > hud.left && box.top < hud.bottom && box.bottom > hud.top;
          });
          const skipTarget = box.width > 0 && box.height >= 44 && button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
          probe.cues.push({ move, outcome, pointerEvents: getComputedStyle(node).pointerEvents, skipsHud: overlaps.length === 0, skipTarget });
          if (probe.skip && move === 'seismictoss' && outcome === 'hit') {
            if (!button.classList.contains('hidden')) {
              probe.skip = false;
              probe.skips++;
              button.click();
            }
          }
        }
      }
    }).observe(document.getElementById('screen-battle'), {
      childList: true, subtree: true, attributes: true, attributeFilter: ['data-move', 'data-outcome'],
    });
  });
  const expectCue = async (move, outcome) => {
    const cue = await page.evaluate(([move, outcome]) =>
      window.motionProbe.cues.find(cue => cue.move === move && cue.outcome === outcome), [move, outcome]);
    assert.ok(cue, `Expected ${move} to render the ${outcome} cue`);
    return cue;
  };
  const ready = player => page.waitForFunction(expected => !state.isLocked && state.currentPlayer === expected, player);
  const start = async ({ speed, attacker, defender, skip = false }) => {
    await page.evaluate(async ({ speed, attacker, defender, skip }) => {
      Object.assign(window.motionProbe, { cues: [], skip });
      settings.battleSpeed = speed;
      settings.animations = true;
      settings.soundEnabled = false;
      state.mode = 'pvp';
      state.p1Draft = [attacker];
      state.p2Draft = [defender];
      await window.startBattle();
    }, { speed, attacker, defender, skip });
    await screen.waitFor();
    await ready(1);
  };
  const select = async name => {
    await fight.tap();
    await screen.locator('#move-menu .battle-btn-move:enabled').filter({ hasText: name }).tap();
  };
  const act = async (one, two) => {
    await select(one);
    await ready(2);
    await select(two);
  };

  await start({ speed: 'normal', attacker: { name: 'Raichu', build: { a: 'Static', m: ['Thunderbolt'] } },
    defender: { name: 'Gastrodon', build: { a: 'Storm Drain', m: ['Harden'] } } });
  await act('Thunderbolt', 'Harden');
  await ready(1);
  await expectCue('thunderbolt', 'immune');
  assert.equal(await foeHp.evaluate(bar => bar.style.width), '100%');
  assert.match(await log.textContent(), /Raichu used Thunderbolt!/);
  assert.match(await log.textContent(), /Gastrodon was immune/);
  assert.doesNotMatch(await log.textContent(), /Gastrodon dropped to/);

  const attacker = { name: 'Machamp', build: { a: 'No Guard', m: ['Seismic Toss'] } };
  const defender = { name: 'Snorlax', build: { a: 'Immunity', m: ['Amnesia'] } };
  await start({ speed: 'normal', attacker, defender: { ...defender, build: { ...defender.build, m: ['Protect'] } } });
  await act('Seismic Toss', 'Protect');
  await ready(1);
  await expectCue('seismictoss', 'block');
  assert.doesNotMatch(await log.textContent(), /Snorlax dropped to/);

  await start({ speed: 'fast', attacker: { ...attacker, build: { ...attacker.build, m: ['Seismic Toss', 'Bulk Up'] } },
    defender: { ...defender, build: { ...defender.build, m: ['Amnesia', 'Substitute'] } } });
  await act('Bulk Up', 'Substitute');
  await ready(1);
  await expectCue('substitute', 'effect');
  assert.ok(await page.evaluate(() => window.motionProbe.cues.every(cue => cue.move !== 'substitute' || cue.outcome !== 'hit')));
  const beforeDecoy = await page.evaluate(() => state.fActive.currentHp);
  await act('Seismic Toss', 'Amnesia');
  await ready(1);
  await expectCue('seismictoss', 'decoy');
  assert.equal(await page.evaluate(() => state.fActive.currentHp), beforeDecoy);

  const results = [];
  for (const [speed, viewport] of [
    ['normal', { width: 320, height: 568 }],
    ['fast', { width: 568, height: 260 }],
    ['instant', { width: 820, height: 1180 }],
  ]) {
    await page.setViewportSize(viewport);
    await start({ speed, attacker, defender, skip: speed === 'normal' });
    const hp = await page.evaluate(() => state.fActive.currentHp);
    await act('Seismic Toss', 'Amnesia');
    await ready(1);
    if (speed !== 'instant') {
      const cue = await expectCue('seismictoss', 'hit');
      assert.equal(cue.pointerEvents, 'none');
      assert.ok(cue.skipsHud && cue.skipTarget, `Skip stays tappable and clear of HUD and log at ${viewport.width}×${viewport.height}`);
      if (speed === 'normal') assert.equal(await page.evaluate(() => window.motionProbe.skips), 1);
    } else {
      assert.equal(await page.evaluate(() => window.motionProbe.cues.length), 0);
    }
    const result = await page.evaluate(() => [state.fActive.currentHp, state.pActive.moves[0].pp, state.turnNumber]);
    assert.equal(result[0], hp - 50);
    results.push(result);
    assert.match(await log.textContent(), /Machamp used Seismic Toss![\s\S]*Snorlax dropped to/);
    assert.equal((await log.textContent()).match(/Machamp used Seismic Toss!/g).length, 1);
    assert.equal(await canvas.count(), 0);
    assert.equal(await foeHp.evaluate(el => getComputedStyle(el).transitionDuration.split(',')[0]),
      { normal: '0.16s', fast: '0.08s', instant: '0s' }[speed]);
  }
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[1], results[2]);
  assert.deepEqual(errors, []);
  console.log('Battle effects distinguish immunity, Protect, and Substitute, honor speed and skip, and preserve state and log at three layout sizes.');
} finally {
  await browser.close();
}
