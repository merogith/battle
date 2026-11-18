// Browser playtest for the complete Camp activity menu.
// BATTLE_TEST_URL=http://127.0.0.1:5173/battle.html node scripts/debug/player-camp-playtest.mjs
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5173/battle.html');
assert.ok(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Use a loopback test server');
const out = process.env.BATTLE_PLAYTEST_OUT || 'agent-state/playthrough/camp-activities';
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const results = { activities: [], navigation: [], errors: [] };
const selectedGames = new Set((process.env.BATTLE_CAMP_GAMES || '').split(',').filter(Boolean));
const contexts = [
  { label: 'desktop', viewport: { width: 1100, height: 760 }, hasTouch: false },
  { label: 'compact', viewport: { width: 568, height: 260 }, hasTouch: true },
];

async function fixture(profile) {
  const context = await browser.newContext({ viewport: profile.viewport, hasTouch: profile.hasTouch, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(4500);
  page.on('pageerror', error => results.errors.push(error.message));
  await page.addInitScript(() => { window.__testHarness = true; });
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__testReady && window.StoryMode?.state);
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden', timeout: 25000 });
  return { context, page };
}

async function enterCamp(page) {
  await page.evaluate(() => {
    const sm = window.StoryMode.state;
    sm.active = true;
    sm.runSeed = 732; // first Camp grass search gives a valid encounter
    sm.eventIndex = 8;
    sm.catchTutorialDone = true;
    sm.gold = 5000;
    sm.citiesArrived = { 0: true, 1: true };
    sm.campByEventIdx = {};
    sm.wanderByEventIdx = {};
    sm.campReturnPoint = null;
    sm.balls = { poke: 3, great: 2, ultra: 1, master: 1 };
    sm.team = [{ name: 'Pikachu', nickname: 'Ember', id: 'camp-ember', build: { m: ['Thunder Shock'], n: 'Hardy', a: 'Static', _isShiny: false } }];
    window.__storyTest.enterCamp(8, () => { window.__qaCampResumed = true; });
  });
  await page.locator('#story-camp-scene').waitFor();
}

function camp(page) { return page.locator('#story-camp-scene'); }
function activity(page) { return page.locator('#camp-microgame'); }
function named(page, name) { return camp(page).getByRole('button', { name }); }
async function press(locator, touch = false) { return touch ? locator.tap() : locator.click(); }
async function shot(page, name) { await page.screenshot({ path: join(out, name + '.png'), animations: 'disabled' }); }
async function hitPoint(locator) {
  const point = await locator.boundingBox();
  assert.ok(point, 'Expected a visible control');
  return { x: point.x + point.width / 2, y: point.y + point.height / 2 };
}
async function tapAt(page, point) { await page.mouse.click(point.x, point.y); }

async function readEncounterIntro(page) {
  const tutorial = page.locator('.story-tutorial-overlay .story-tutorial-continue');
  while (await tutorial.count()) await press(tutorial.first(), true);
  const firstSighting = page.getByText('Pokédex — first sighting', { exact: true });
  if (await firstSighting.count()) await press(firstSighting.locator('../..').getByRole('button', { name: 'Continue' }), true);
}

async function openPartner(page, touch = false) {
  await press(named(page, /Spend time with your team/), touch);
  await press(named(page, /^Ember/), touch);
}

async function chooseActivity(page, action, index, touch = false, initialRolls = []) {
  await page.evaluate(({ index, initialRolls }) => {
    const slot = window.StoryMode.state.team[0];
    delete slot.bonds;   // each round checks the first-visit difficulty
    const rolls = [(index + 0.5) / 5, ...initialRolls];
    let rng = 154681;
    window.storyRngNext = () => {
      if (rolls.length) return rolls.shift();
      rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
      return rng / 0x100000000;
    };
  }, { index, initialRolls });
  await press(named(page, action), touch);
}

async function timing(page, button, condition) {
  const point = await hitPoint(button);
  for (let trial = 0; trial < 10 && await activity(page).count(); trial++) {
    await page.waitForFunction(condition, undefined, { timeout: 1700 }).catch(() => {});
    if (!(await activity(page).count())) break;
    await tapAt(page, point);
    await page.waitForTimeout(40);
  }
}

async function play(page, primitive) {
  const find = selector => activity(page).locator(selector);
  const present = () => activity(page).count();
  switch (primitive) {
    case 'tapTiming':
      await timing(page, find('#camp-tt-tap'), () => {
        const marker = parseFloat(document.getElementById('camp-tt-marker')?.style.left);
        const zone = document.getElementById('camp-tt-zone');
        return Math.abs(marker - (parseFloat(zone?.style.left) + parseFloat(zone?.style.width) / 2)) < 9;
      }); break;
    case 'gaugeStop':
      await timing(page, find('#camp-gs-stop'), () => {
        const needle = document.getElementById('camp-gs-needle');
        const zone = needle?.previousElementSibling;
        return Math.abs(parseFloat(needle?.style.left) - (parseFloat(zone?.style.left) + parseFloat(zone?.style.width) / 2)) < 7;
      }); break;
    case 'lobAim':
      await timing(page, find('#camp-lb-fire'), () => {
        const power = parseFloat(document.getElementById('camp-lb-pow')?.style.width);
        const band = document.getElementById('camp-lb-band');
        return Math.abs(power - (parseFloat(band?.style.left) + parseFloat(band?.style.width) / 2)) < 7;
      }); break;
    case 'stack':
      await timing(page, find('#camp-sk-drop'), () => {
        const field = document.getElementById('camp-sk-field');
        const slab = field?.querySelector('#camp-sk-slab');
        const last = [...(field?.querySelectorAll('.camp-sk-placed') || [])].at(-1);
        const target = last ? parseFloat(last.style.left) : field?.getBoundingClientRect().width / 2;
        return Math.abs(parseFloat(slab?.style.left) - target) < 18;
      }); break;
    case 'mash': {
      const point = await hitPoint(find('#camp-ms-btn'));
      for (let i = 0; i < 30 && await present(); i++) await tapAt(page, point);
      break;
    }
    case 'pickMatch': {
      const pose = await find('.camp-activity-play > div').nth(1).innerText();
      await find('[data-camp-pm]').filter({ hasText: pose }).first().click();
      break;
    }
    case 'holdRelease': {
      const button = find('#camp-hr-hold');
      await button.focus();
      await page.keyboard.down('Space');
      await page.waitForTimeout(1160);
      await page.keyboard.up('Space');
      break;
    }
    case 'dragAim': {
      const token = await hitPoint(find('#camp-da-token')), target = await hitPoint(find('#camp-da-target'));
      await page.mouse.move(token.x, token.y);
      await page.mouse.down();
      await page.mouse.move(target.x, target.y, { steps: 12 });
      await page.mouse.up();
      break;
    }
    case 'swipeCover': {
      const swatches = await find('[data-camp-sc]').all();
      const points = await Promise.all(swatches.map(hitPoint));
      await page.mouse.move(points[0].x, points[0].y);
      await page.mouse.down();
      for (const point of points.slice(1)) await page.mouse.move(point.x, point.y, { steps: 3 });
      await page.mouse.up();
      break;
    }
    case 'track': {
      const timer = Date.now();
      while (await present() && Date.now() - timer < 3200) {
        const box = await find('#camp-tk-mark').boundingBox({ timeout: 150 }).catch(() => null);
        if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(22);
      }
      break;
    }
    case 'restraint':
      break;  // waiting is the actual input
    case 'sequence': {
      const pads = await page.evaluate(() => new Promise(resolve => {
        const container = document.getElementById('camp-microgame');
        const msg = container.querySelector('#camp-sq-msg');
        const values = [];
        const onChange = () => {
          const on = [...container.querySelectorAll('[data-camp-sq]')].find(button => button.style.opacity === '1');
          const index = on?.dataset.campSq;
          if (index != null && index !== values.at(-1)) values.push(index);
          if (msg.textContent === 'Repeat it!') { observer.disconnect(); resolve(values); }
        };
        const observer = new MutationObserver(onChange);
        observer.observe(container, { attributes: true, childList: true, subtree: true });
        onChange();
      }));
      for (const index of pads) await find(`[data-camp-sq="${index}"]`).click();
      break;
    }
    case 'dodge': {
      const cue = find('#camp-dg-cue');
      await cue.filter({ hasText: 'Dodge!' }).waitFor();
      const direction = (await cue.innerText()).includes('Left') ? 'L' : 'R';
      await find(`[data-camp-dg="${direction}"]`).click();
      break;
    }
    case 'catch': {
      const timer = Date.now();
      while (await present() && Date.now() - timer < 6200) {
        const target = await page.evaluate(() => {
          const field = document.getElementById('camp-ct-field');
          if (!field) return null;
          const falling = [...field.children].filter(node => ['🍓', '💣'].includes(node.textContent))
            .sort((a, b) => parseFloat(b.style.top) - parseFloat(a.style.top));
          const danger = falling[0];
          if (!danger) return null;
          const box = danger.getBoundingClientRect(), r = field.getBoundingClientRect();
          const centre = box.x + box.width / 2;
          return { x: danger.textContent === '💣' ? (centre > r.x + r.width / 2 ? r.x + 5 : r.right - 5) : centre, y: r.y + r.height / 2 };
        });
        if (target) await page.mouse.move(target.x, target.y);
        await page.waitForTimeout(38);
      }
      break;
    }
    case 'steady': {
      const point = await hitPoint(find('#camp-st-dot'));
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      await page.waitForTimeout(2250);
      await page.mouse.up();
      break;
    }
    case 'block': {
      const timer = Date.now();
      const points = {
        '20%': await hitPoint(find('[data-camp-bk="L"]')),
        '50%': await hitPoint(find('[data-camp-bk="C"]')),
        '80%': await hitPoint(find('[data-camp-bk="R"]')),
      };
      while (await present() && Date.now() - timer < 6800) {
        const lane = await page.evaluate(() => document.getElementById('camp-bk-hit')?.style.left);
        if (points[lane]) await tapAt(page, points[lane]);
        await page.waitForTimeout(70);
      }
      break;
    }
    case 'balance': {
      const timer = Date.now(), left = await hitPoint(find('#camp-bl-l')), right = await hitPoint(find('#camp-bl-r'));
      let previousTilt = 0;
      while (await present() && Date.now() - timer < 4000) {
        const tilt = await page.evaluate(() => Number(document.getElementById('camp-bl-mon')?.style.transform.match(/rotate\((-?[0-9.]+)/)?.[1]));
        const lean = tilt + (tilt - previousTilt) * 4;
        if (Number.isFinite(tilt) && Math.abs(lean) > 5) await tapAt(page, lean > 0 ? left : right);
        previousTilt = tilt;
        await page.waitForTimeout(64);
      }
      break;
    }
    case 'quickMath': {
      const equation = await find('.camp-activity-play > div').first().innerText();
      const [, left, sign, right] = /^(\d+) ([+−]) (\d+)/.exec(equation);
      const answer = sign === '+' ? Number(left) + Number(right) : Number(left) - Number(right);
      await find(`[data-camp-qm="${answer}"]`).click();
      break;
    }
    case 'tracePath': {
      const points = await Promise.all((await find('#camp-tp-field > div').all()).map(hitPoint));
      await page.mouse.move(points[0].x, points[0].y);
      await page.mouse.down();
      for (const point of points) {
        await page.mouse.move(point.x, point.y, { steps: 4 });
        await page.waitForTimeout(60);
      }
      await page.mouse.up();
      break;
    }
    case 'breathBand': {
      const point = await hitPoint(find('#camp-bb-field'));
      await page.mouse.move(point.x, point.y);
      let down = false;
      const timer = Date.now();
      while (await present() && Date.now() - timer < 4300) {
        const lift = await page.evaluate(() => {
          const orb = document.getElementById('camp-bb-orb'), band = document.getElementById('camp-bb-band');
          return parseFloat(orb?.style.top) > parseFloat(band?.style.top) + parseFloat(band?.style.height) / 2;
        });
        if (down !== lift) { await (lift ? page.mouse.down() : page.mouse.up()); down = lift; }
        await page.waitForTimeout(33);
      }
      if (down) await page.mouse.up();
      break;
    }
    case 'goNoGo': {
      const tap = await hitPoint(find('#camp-gn-tap'));
      const timer = Date.now();
      let last = '';
      while (await present() && Date.now() - timer < 6500) {
        const cue = await page.evaluate(() => document.getElementById('camp-gn-cue')?.textContent);
        if (cue === 'GO' && last !== 'GO') await tapAt(page, tap);
        last = cue;
        await page.waitForTimeout(34);
      }
      break;
    }
    case 'whack': {
      const timer = Date.now();
      while (await present() && Date.now() - timer < 6800) {
        const target = activity(page).getByRole('button', { name: 'Tag target' }).last();
        const box = await target.boundingBox({ timeout: 100 }).catch(() => null);
        if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(60);
      }
      break;
    }
    default: throw new Error('No input script for ' + primitive);
  }
}

async function testRoadChoices(profile) {
  for (const [index, choice] of ['scout', 'help', 'pass'].entries()) {
    const { context, page } = await fixture(profile);
    try {
      await page.evaluate(() => {
        const story = window.StoryMode;
        const sm = story.state;
        const gym = window.STORY_EVENTS_RAW.find(row => row[2] === 'Gym Leader 1');
        sm.active = true;
        sm.roadDiscoveriesEnabled = true;
        sm.runSeed = 52341;
        sm.eventIndex = 6;
        sm.trainerAssignments = { [gym[0]]: 'Misty' };
        sm.citiesArrived = { 0: true };
        sm.storyChoices = {};
        sm.wanderByEventIdx = {};
        sm.balls = { poke: 2 };
        sm.inventory = { potion: 0 };
        sm.settings = { enabledGens: [1] };
        sm.team = [{ name: 'Pikachu', nickname: 'Ember', id: 'camp-ember', build: { ...window.makeBuild('Pikachu'), m: ['Thunder Shock'] } }];
        story.enterCity();
      });
      const scene = page.locator('.story-road-discovery');
      await scene.waitFor();
      const button = scene.locator(`[data-narr-choice-idx="${index}"]`);
      await press(button, true);
      if (choice === 'scout') assert.match(await scene.innerText(), /Ember already knows Thunder Shock/);
      if (choice === 'help') assert.match(await scene.innerText(), /Received Poké Ball \+ Potion/);
      if (choice === 'pass') assert.match(await scene.innerText(), /follow the firm ground/);
      await shot(page, 'route-' + choice);
      await press(scene.locator('[data-narr-continue]'), true);
      if (choice === 'scout') {
        await press(page.getByRole('button', { name: 'Follow the tracks' }), true);
        await page.locator('#screen-story-catch').waitFor({ timeout: 12000 });
        await readEncounterIntro(page);
        await press(page.locator('#story-catch-run-btn'), true);
        await press(page.locator('[data-wander-moveon]'), true);
      } else {
        assert.equal(await page.locator('.story-wander').count(), 0);
      }
      const arrival = page.locator('[data-arrival-dismiss]');
      if (await arrival.count()) await press(arrival, true);
      await page.locator('#screen-story-city').waitFor();
      const saved = await page.evaluate(() => {
        const sm = JSON.parse(localStorage.getItem('pbs_story_save'));
        return { choice: sm.storyChoices['road.discovery.1'], balls: sm.balls.poke, potions: sm.inventory.potion };
      });
      assert.deepEqual(saved, { choice, balls: choice === 'help' ? 3 : 2, potions: choice === 'help' ? 1 : 0 });
      results.navigation.push('Compact touch Road discovery ' + choice);
    } finally {
      await context.close();
    }
  }
}

try {
  for (const profile of contexts) {
    const { page, context } = await fixture(profile);
    try {
      await enterCamp(page);
      await openPartner(page, profile.hasTouch);
      const actions = await page.evaluate(() => Object.values(window.__storyTest.CAMP_ACTIONS).map(entry => ({
        label: entry.label.replace(/^\S+ /u, ''),
        games: entry.games.map(id => ({ id, ...window.__storyTest.CAMP_MICROGAMES[id] })),
      })));
      if (profile.hasTouch) {
        // Cancel during the real countdown before the timing-sensitive activities start.
        await chooseActivity(page, /Cheer/, 0, true);
        await press(page.locator('#camp-countdown [data-camp-exit]'), true);
        await named(page, /Cheer/).waitFor();
        await page.waitForTimeout(1950);
        assert.equal(await activity(page).count(), 0, 'cancelled countdown must not mount a late game');
        results.navigation.push('Compact touch countdown cancellation');
        await chooseActivity(page, /Drill/, 1, true, [0, 0, 0]);
        const shield = activity(page).getByRole('button', { name: 'Move shield left' });
        const shieldPoint = await hitPoint(shield);
        assert.ok(shieldPoint.y < profile.viewport.height, 'touch shield control is in view');
        await press(shield, true);
        await shot(page, 'compact-brace');
        await named(page, /^Continue/).waitFor();
        assert.match(await camp(page).innerText(), /warms to you/);
        await press(named(page, /^Continue/), true);
        results.navigation.push('Compact touch Brace win');
      } else {
        for (const action of actions) {
          for (const [index, game] of action.games.entries()) {
            if (selectedGames.size && !selectedGames.has(game.id)) continue;
            const record = { id: game.id, name: game.name, primitive: game.primitive, result: 'pending' };
            try {
              // Force overlapping spots for Brush and a pair of early GO cues for React.
              const rolls = game.id === 'brush' || game.id === 'react' ? Array(14).fill(0) : [];
              await chooseActivity(page, new RegExp(action.label), index, false, rolls);
              await activity(page).waitFor();
              assert.equal(await activity(page).getByRole('heading').innerText(), game.name);
              await play(page, game.primitive);
              const continued = await named(page, /^Continue/).waitFor({ timeout: 7000 }).then(() => true, () => false);
              if (continued) {
                const text = await camp(page).innerText();
                record.result = /warms to you/.test(text) ? 'win' : 'miss';
                await shot(page, 'result-' + game.id);
                await named(page, /^Continue/).click();
              } else if (await activity(page).count()) {
                record.result = 'left';
                await activity(page).getByRole('button', { name: 'Leave activity' }).click();
              }
              await named(page, /Cheer/).waitFor();
            } catch (error) {
              record.result = 'error';
              record.message = String(error);
              console.error(game.id, record.message);
              await shot(page, 'error-' + game.id);
              const countdownCancel = page.locator('#camp-countdown [data-camp-exit]');
              if (await countdownCancel.count()) await countdownCancel.click();
              const cancel = activity(page).getByRole('button', { name: 'Leave activity' });
              if (await cancel.count()) await cancel.click();
              const continueResult = named(page, /^Continue/);
              if (await continueResult.count()) await continueResult.click();
            }
            results.activities.push(record);
            console.log(game.id, record.result);
          }
        }
        if (results.activities.some(record => record.result === 'win')) {
          const last = JSON.parse(await page.evaluate(() => localStorage.getItem('pbs_story_save')));
          assert.ok(last.team[0].bonds, 'a completed timed activity stored bond progress');
        }
        await page.evaluate(() => { window.__accessibleCamp = true; });
        await chooseActivity(page, /Feed & Groom/, 0);
        await page.getByRole('button', { name: 'Spend time together' }).click();
        await named(page, /^Continue/).waitFor();
        await named(page, /^Continue/).click();
        await chooseActivity(page, /Feed & Groom/, 0);
        await page.getByRole('button', { name: 'Cancel activity' }).click();
        await named(page, /Feed & Groom/).waitFor();
        results.navigation.push('Untimed activity reward and neutral cancel');
      }

      await press(named(page, /^← Back/), profile.hasTouch);
      await press(named(page, /^← Back/), profile.hasTouch);
      await press(named(page, /Search the tall grass/), profile.hasTouch);
      await page.locator('.story-wander').waitFor();
      await shot(page, 'grass-' + profile.label);
      assert.match(await page.locator('.story-wander').innerText(), /head back to the fire/);
      if (profile.hasTouch) {
        await press(page.locator('[data-wander-search]'), true);
        const ball = page.locator('#screen-story-catch [data-ball-type="master"]');
        await ball.waitFor({ timeout: 12000 });
        await readEncounterIntro(page);
        await shot(page, 'camp-grass-wild');
        await press(ball, true);
        await press(page.locator('#screen-story-catch [data-catch-continue]'), true);
        await page.locator('.story-wander').waitFor();
        const caught = await page.evaluate(() => {
          const sm = window.StoryMode.state;
          return { master: sm.balls.master, collected: sm.team.length + sm.pcBox.length, searches: sm.wanderByEventIdx[100008].taps };
        });
        assert.deepEqual(caught, { master: 0, collected: 2, searches: 1 });
        results.navigation.push('Compact touch Camp grass catch, ball debit, and collection return');
      }
      await press(page.locator('[data-wander-moveon]'), profile.hasTouch);
      await named(page, /Break camp/).waitFor();
      assert.equal(await named(page, /Search the tall grass/).count(), 0);
      results.navigation.push(profile.label + ' Camp grass entry and Back to camp');
      await press(named(page, /Head back to/), profile.hasTouch);
      const road = page.getByRole('button', { name: /Back to the road/i }).first();
      await road.waitFor();
      await press(road, profile.hasTouch);
      await named(page, /Break camp/).waitFor();
      await press(named(page, /Break camp/), profile.hasTouch);
      await page.waitForFunction(() => window.StoryMode.state.campByEventIdx[8]?.done === true);
      results.navigation.push(profile.label + ' town round trip and Break camp');
    } finally {
      await context.close();
    }
  }
  await testRoadChoices(contexts[1]);
} catch (error) {
  results.errors.push(String(error));
  throw error;
} finally {
  await writeFile(join(out, 'report.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
assert.equal(results.activities.length, selectedGames.size || 30);
assert.ok(results.activities.every(activity => ['win', 'miss', 'left'].includes(activity.result)), 'Check the report for input errors');
assert.deepEqual(results.errors, []);
