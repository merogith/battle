/* global settings, state */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.BATTLE_TEST_URL || 'http://localhost:5177/battle.html');
assert.ok(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname));
const out = process.env.BATTLE_PLAYTEST_OUT;
if (out) await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
const checkpoints = [
  { width: 320, height: 568, touch: true },
  { width: 568, height: 260, touch: true },
  { width: 568, height: 260, touch: true, largeText: true },
  { width: 820, height: 1180, touch: true },
  { width: 1440, height: 900, touch: false },
];

async function inReach(control) {
  return control.evaluate(node => {
    const rect = node.getBoundingClientRect();
    const center = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return rect.width >= 44 && rect.height >= 44 && rect.x >= 0 && rect.y >= 0 &&
      rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1 && node.contains(center);
  });
}

async function reachChampion(page, url) {
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
  const scene = page.locator('.story-champion-entrance');
  const precedingActions = page.locator([
    '.story-narr-root [data-narr-continue]:visible',
    '.story-narr-root [data-narr-choice-idx]:visible',
    '[data-scene-cont]:visible',
    '[data-scene-opt]:visible',
    '.story-tutorial-continue:visible',
    '#modal-game-alert button:visible',
  ].join(', '));
  for (let step = 0; step < 45; step += 1) {
    if (await scene.isVisible()) return scene;
    const action = precedingActions.last();
    if (await action.count()) await action.click({ timeout: 600 }).catch(() => {});
    else await page.waitForTimeout(160);
  }
  throw new Error(`The Champion checkpoint did not reach the entrance. Visible controls: ${await page.getByRole('button').filter({ visible: true }).evaluateAll(buttons =>
    buttons.map(button => button.outerHTML.slice(0, 180)).join(' · '))}`);
}

async function verifyChampionVictory(page, capture) {
  const fight = page.locator('#command-menu [data-cmd="fight"]');
  const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save')));
  const startingGold = (await readSave()).gold;
  let turns = 0;
  // Play the six-foe Champion checkpoint through normal commands, choosing
  // attacks from the displayed effectiveness and power. No result is injected.
  for (let action = 0; action < 60; action++) {
    await page.waitForFunction(() => state.battleEngine === 'showdown' && (state.isOver || !state.isLocked));
    const request = await page.evaluate(() => state.isOver ? 'over' : state.nativeRequests?.[0]?.phase);
    if (request === 'over') break;
    const turn = await page.evaluate(() => state.turnNumber);
    if (request === 'replace') {
      await page.locator('#modal-party button[onclick^="window.selectPartyMember"]:enabled').first().click();
      await page.waitForFunction(() => state.isOver || state.nativeRequests?.[0]?.phase === 'move');
      continue;
    }
    assert.equal(request, 'move');
    await fight.click();
    const moves = page.locator('#move-menu .battle-btn-move:enabled:visible');
    const pick = await moves.evaluateAll(buttons => {
      const score = button => {
        const label = button.getAttribute('aria-label') || '';
        const power = Number(label.match(/Power (\d+)/)?.[1] || 0);
        const accuracy = Number(label.match(/Acc (\d+)%/)?.[1] || 100);
        const matchup = button.querySelector('.move-tile-matchup')?.textContent || '';
        return power * accuracy * (matchup.includes('▲') ? 2 : matchup.includes('▼') ? 0.5 : matchup.includes('⊘') ? 0 : 1);
      };
      return buttons.indexOf(buttons.reduce((best, button) => score(button) > score(best) ? button : best));
    });
    await moves.nth(pick).click();
    await page.waitForFunction(last => state.isOver || state.nativeRequests?.[0]?.phase === 'replace'
      || (state.turnNumber > last && !state.isLocked), turn);
    turns++;
  }
  const outcome = await page.evaluate(() => ({ winner: state.nativeWinner, turn: state.turnNumber,
    user: state.playerParty.map(mon => [mon.name, mon.currentHp]), foes: state.foeParty.map(mon => [mon.name, mon.currentHp]),
    lastMessages: document.getElementById('battle-log').innerText.slice(-1900) }));
  assert.equal(outcome.winner, 1, JSON.stringify(outcome));
  assert.ok(turns >= 6, 'Normal move choices defeated all six foes');
  const result = page.locator('.story-victory-v2[data-story-result-id]');
  await result.waitFor();
  await capture('champion-native-result');
  const receipt = await readSave();
  assert.equal(receipt.gold, startingGold + receipt.pendingBattleResult.coins);
  assert.ok(receipt.pendingBattleResult.coins > 0);
  await page.goto(base.href, { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-btn-quickplay--continue').click();
  await result.waitFor();
  const resumed = await readSave();
  assert.equal(resumed.pendingBattleResult.id, receipt.pendingBattleResult.id);
  assert.equal(resumed.gold, receipt.gold);
  await page.waitForTimeout(400);
  await result.locator('.story-victory-v2-continue').click();
  const rival = page.getByRole('dialog', { name: /Battle introduction with Rival/ });
  const storyAdvance = page.locator([
    '.story-narr-root [data-narr-continue]:visible', '.story-narr-root [data-narr-choice-idx]:visible',
    '[data-scene-cont]:visible', '.story-tutorial-continue:visible', '#modal-game-alert button:visible',
  ].join(', '));
  for (let step = 0; step < 25 && !await rival.isVisible(); step++) {
    if (await storyAdvance.count()) await storyAdvance.last().click();
    else await page.waitForTimeout(150);
  }
  assert.ok(await rival.isVisible(), (await page.locator('body').innerText()).slice(-1800));
  assert.match(await rival.innerText(), /Rival/);
  assert.equal((await readSave()).gold, receipt.gold);
  console.log(`Champion checkpoint won in ${turns} native turns; reload kept the one-time reward and reached the final Rival introduction.`);
}

async function verifyFinaleRecovery(page, capture, { partner, decision, failOnce }) {
  const narration = page.locator('.story-narr-root:visible:not([inert])');
  const backdrop = page.locator('#screen-story-crucible:visible');
  const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_save') || '{}'));
  const readCareer = () => page.evaluate(() => JSON.parse(localStorage.getItem('pbs_story_meta') || '{}'));
  const resume = async () => {
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#app-loading-overlay').waitFor({ state: 'hidden' });
    await page.locator('.menu-btn-quickplay--continue').click();
  };
  const readUntil = async (target, description) => {
    for (let step = 0; step < 25; step += 1) {
      if (await target.isVisible()) return;
      const advance = narration.locator('[data-narr-continue]:visible').last();
      if (await advance.count()) await advance.click({ timeout: 800 }).catch(() => {});
      else {
        const alert = page.locator('#modal-game-alert button:visible').last();
        if (await alert.count()) await alert.click({ timeout: 800 }).catch(() => {});
        else await page.waitForTimeout(120);
      }
    }
    const saved = await readSave();
    const visible = (await page.locator('body').innerText()).slice(-1800);
    throw new Error(`Narrative did not reach ${description}. Event ${saved.eventIndex}, Crucible ${saved.atCrucible}, outcome ${saved.mfFinalResult}, fired ${JSON.stringify(saved.storyEventsFired)}\n${visible}`);
  };
  await page.evaluate(partner => {
    const save = window.StoryMode.state;
    save.eventIndex = window.STORY_EVENTS_RAW.findIndex(row => row[1] === 'Battle' && row[2] === 'Mystery Figure');
    if (save.eventIndex < 0) throw new Error('Mystery Figure checkpoint has no timeline row');
    Object.assign(save, { storyLine: 'classic', postHofMysteryClimaxDone: true, mfFinalResult: 'won', atCrucible: false });
    save.trainerProfile = { ...save.trainerProfile, sprite: 'Cooltrainer~F.png' };
    save.storyEventsFired = { 'main.event9': true };
    for (const slot of [...save.team, ...save.pcBox]) delete slot.starter;
    if (partner === 'unrecorded') delete save.starterMemory;
    else {
      save.starterMemory = { slotId: 'starter-parity', speciesAtGift: 'Pikachu', nicknameAtGift: 'Spark', shinyAtGift: false };
      if (partner === 'present') {
        save.pcBox.push({ ...save.team[0], id: 'starter-parity', name: 'Raichu', nickname: 'Spark', starter: true });
      }
    }
    const career = JSON.parse(localStorage.getItem('pbs_story_meta') || '{}');
    career.lastLoopChoice = 'remember';
    career.loopChoices = { remember: true, forget: true };
    localStorage.setItem('pbs_story_meta', JSON.stringify(career));
    window.StoryMode.upgrades.save();
  }, partner);
  assert.equal((await readSave()).postHofMysteryClimaxDone, true);
  await resume();
  const oak = page.getByRole('dialog', { name: 'The wall is yours' }).getByText(/eighth fight/);
  await readUntil(oak, 'Oak’s epilogue after a saved victory');
  assert.equal((await readSave()).storyEventsFired['main.mfReveal'], true);
  assert.equal((await readSave()).atCrucible, true);
  await resume();
  await oak.waitFor();
  const remember = narration.getByRole('button', { name: 'Remember. Carry it forward.' });
  const forget = narration.getByRole('button', { name: 'Try not to remember. Walk through clean.' });
  await readUntil(remember, 'the finale choice');
  assert.match(await narration.evaluate(node => getComputedStyle(node).backgroundImage), /recovery-league\.webp/);
  await capture('run-one-choice');
  assert.ok(await inReach(remember) && await inReach(forget), 'Both finale choices are in reach');
  const portrait = narration.locator('.story-finale-portrait');
  assert.equal(await portrait.getAttribute('data-partner'), partner);
  const avatar = portrait.locator('img[src$="Cooltrainer~F.png"]');
  await avatar.waitFor({ state: 'visible' });
  assert.ok(await avatar.evaluate(node => node.complete && node.naturalWidth > 0), 'The selected avatar appears in the portrait');
  assert.match(await portrait.locator('figcaption').innerText(), {
    present: /First partner · Spark · Raichu/,
    memory: /As they were in Pallet · Spark · Pikachu/,
    unrecorded: /An empty frame beside yours/,
  }[partner]);
  assert.match(await portrait.locator('.story-finale-plates').innerText(), /Remembered\s*Forgotten/);
  const answer = decision === 'remember' ? remember : forget;
  if (failOnce) {
    await page.evaluate(() => { window.__storyExternalSave = true; });
    await answer.click();
    assert.match(await narration.locator('.story-finale-save-error').innerText(), /could not be saved/);
    assert.equal((await readSave()).storyChoices?.['main.loop.remember'], undefined);
    assert.ok(await inReach(answer), 'Failed saves leave the choice in reach');
    assert.equal((await readCareer()).lastLoopChoice, 'remember');
    await page.evaluate(() => {
      window.__storyExternalSave = false;
      const writer = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'pbs_story_meta') throw new DOMException('Fixture rejects career writes', 'QuotaExceededError');
        return writer.call(this, key, value);
      };
    });
  }
  await answer.click();
  assert.equal((await readSave()).storyChoices['main.loop.remember'], decision);
  assert.ok((await readSave()).loopChoiceCommittedAt > 0);
  assert.equal((await readCareer()).lastLoopChoice, failOnce ? 'remember' : decision);
  await resume();
  await narration.getByText(decision === 'remember' ? /You hold onto it/ : /You let it go/).waitFor();
  assert.equal((await readCareer()).lastLoopChoice, decision, 'A delayed career write is recovered from the active receipt');
  assert.equal((await readCareer()).achievements.r_both_paths.currentRank, 1);
  assert.equal(await narration.locator('[data-narr-choice-idx]').count(), 0, 'A saved finale answer is not offered again');
  assert.equal(await narration.getAttribute('data-gallery-motif'), null, 'The restored reply does not replay the cue');
  await capture(`run-one-${decision}`);
  await readUntil(backdrop, 'the Crucible');
  assert.equal((await readSave()).storyEventsFired['main.ending'], true);
}

try {
  for (const { width, height, touch, largeText = false } of checkpoints) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: touch,
      hasTouch: touch,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    try {
      const prefix = `${width}x${height}${largeText ? '-large' : ''}`;
      if (largeText) await context.addInitScript(() => {
        localStorage.setItem('pbs_accessibility', JSON.stringify({ largeText: true }));
      });
      await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const capture = name => out && page.screenshot({ path: join(out, `${prefix}-${name}.png`), animations: 'disabled' });
      const champion = new URL(base);
      champion.searchParams.set('storychampionweak', '1');
      const scene = await reachChampion(page, champion);
      const face = scene.getByRole('button', { name: 'Face the Champion' });
      if (largeText) assert.ok(await page.locator('body').evaluate(node => node.classList.contains('upgrade-large-text')));
      assert.match(await scene.evaluate(node => getComputedStyle(node).backgroundImage), /recovery-league\.webp/);
      assert.ok(await inReach(face), `Champion action fits ${prefix}`);
      await capture('champion');
      if (!touch) await page.evaluate(() => {
        settings.animations = false;
        settings.battleSpeed = 'instant';
        // Fix the lead’s legal moveset to keep the smoke test independent of
        // the debug fixture's randomized Choice and support builds.
        const lead = window.StoryMode.state.team[0];
        lead.build = { n: 'Jolly', a: 'Rough Skin', i: '', m: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Crunch'],
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }, evs: { hp: 4, atk: 252, spe: 252 } };
      });
      await page.waitForTimeout(450);
      await face.click();
      await page.locator('#command-menu [data-cmd="fight"]:visible').waitFor();
      if (!touch) await verifyChampionVictory(page, capture);

      const hall = new URL(base);
      hall.searchParams.set('debugPostHofClimax', '1');
      await page.goto(hall.href, { waitUntil: 'domcontentloaded' });
      const ceremony = page.getByRole('dialog', { name: 'Hall of Fame', exact: true });
      const proceed = ceremony.getByRole('button', { name: 'Continue (Post-Game)', exact: true });
      const save = ceremony.getByRole('button', { name: 'Save & Quit', exact: true });
      const panel = ceremony.locator('.story-hof-gba-panel');
      await ceremony.waitFor();
      assert.equal(await page.locator('.story-narr-root:visible').count(), 0, 'Only one ceremony is shown');
      assert.equal(await ceremony.getByRole('list', { name: 'Hall of Fame team' }).getByRole('listitem').count(), 6);
      assert.ok(await inReach(proceed) && await inReach(save), `Hall actions fit ${prefix}`);
      assert.ok(await panel.evaluate(node => {
        const bounds = node.getBoundingClientRect();
        return [...node.querySelectorAll('.story-hof-gba-cell')].every(member => {
          const rect = member.getBoundingClientRect();
          return rect.top >= bounds.top && rect.bottom <= bounds.bottom + 1;
        });
      }), `Each team member fits on the first ceremony frame at ${prefix}`);
      await proceed.hover();
      assert.ok(await proceed.evaluate(node => {
        const css = getComputedStyle(node);
        const [red] = css.backgroundColor.match(/\d+/g).map(Number);
        return red > 200 && css.fontFamily.includes('system-ui');
      }), 'The focused or hovered gold button keeps its readable style');
      await capture('hall');

      await ceremony.getByText('Words from the League', { exact: true }).click();
      if (height <= 260) {
        assert.ok(await panel.evaluate(node => {
          node.scrollTop = node.scrollHeight;
          return node.scrollTop > 0;
        }), 'Expanded Hall account scrolls within the ceremony');
        assert.ok(await inReach(proceed) && await inReach(save), 'Hall actions stay available when the account scrolls');
        await capture('hall-expanded');
      }
      await proceed.click();
      await ceremony.waitFor({ state: 'hidden' });
      await page.locator('.story-league-narration').first().waitFor();
      await verifyFinaleRecovery(page, capture, {
        partner: largeText ? 'memory' : !touch ? 'present' : 'unrecorded',
        decision: width <= 568 ? 'forget' : 'remember',
        failOnce: largeText,
      });
      assert.deepEqual(errors, []);
      console.log(`${prefix} · Champion entrance and Hall of Fame`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
