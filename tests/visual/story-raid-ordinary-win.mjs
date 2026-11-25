import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/* global settings, state */
const url = new URL(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5177/battle.html');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
const browser = await chromium.launch({ executablePath: process.env.BATTLE_TEST_CHROMIUM });
try {
  const context = await browser.newContext({ viewport: { width: 960, height: 730 },
    reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(() => { window.__testHarness = true; });
  await context.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__testReady);
  const stage = await page.evaluate(async () => {
    await window.__testReady;
    window.__classicSimulationModule = await import('./competitive/classic-simulation.js');
    const story = window.__storyTest;
    const sceneKey = 'extra.cubone.raid';
    const anchor = story.EXTRA_STORY_BEATS.cubone.raid.roadAnchor;
    const eventIndex = story.STORY_EVENTS_RAW.findIndex((row, index) => row[1] === 'Battle' &&
      row[2] === 'Basic Trainer' && story.roadForArrayIdx(index) === anchor);
    if (eventIndex < 0) throw new Error(`No trainer row on ${anchor}.`);
    const row = story.STORY_EVENTS_RAW[eventIndex];
    const city = story.cityIndexFromEventIndex(eventIndex);
    const tracks = { main: 'classic_v2', villain: 'flare', extra: 'cubone' };
    const fired = {};
    for (const table of [story.MAIN_STORY_BEATS, story.VILLAIN_STORY_BEATS.flare, story.EXTRA_STORY_BEATS.cubone]) {
      for (const beat of Object.values(table)) if (beat.sceneKey !== sceneKey) fired[beat.sceneKey] = true;
    }
    const roster = [
      ['Blastoise', 'Squirtle', 'Torrent', 'Aqua Tail', 'Surf'],
      ['Gyarados', 'Magikarp', 'Intimidate', 'Waterfall', 'Surf'],
      ['Venusaur', 'Bulbasaur', 'Overgrow', 'Seed Bomb', 'Giga Drain'],
      ['Poliwrath', 'Poliwag', 'Water Absorb', 'Waterfall', 'Surf'],
      ['Seadra', 'Horsea', 'Sniper', 'Waterfall', 'Surf'],
      ['Seaking', 'Goldeen', 'Swift Swim', 'Waterfall', 'Surf'],
    ];
    const stats = value => ({ hp: value, atk: value, def: value, spa: value, spd: value, spe: value });
    const team = roster.map(([name, , a, physical, special], index) => ({ id: index + 1, name,
      starter: index === 0, build: { a, i: '', n: 'Hardy', ivs: stats(20), evs: stats(0),
        m: [special, physical], _isShiny: false } }));
    settings.animations = false;
    settings.battleSpeed = 'instant';
    // Only stage prior progression and a party. The authored roster, boss rules,
    // native battle, inventory, victory, and rewards run through the game.
    Object.assign(story.sm, { active: true, version: window.__STORY_SAVE_VER, eventIndex,
      runSeed: 22180, storyDifficulty: 'normal', badges: 5, gold: 3400, inventory: {},
      settings: { ...story.sm.settings, enabledGens: [1] }, tracks, storyEventsFired: fired,
      routeShown: { [eventIndex]: true }, currentEnemyLock: null, _activeBeatBattleKey: sceneKey, team });
    const admissible = await Promise.all(roster.map(async ([name, base, ability, physical, special], index) => {
      const learn = await story.tutorFetchLearnsetMoveNames(name);
      const accessible = await story.tutorGetStagedMovePoolAsync(name, [], index === 0);
      let ancestor = story.baseStats[name];
      while (ancestor.prevo) ancestor = story.baseStats[ancestor.prevo];
      return { name, base, ability, abilityAvailable: Object.values(story.baseStats[name].abilities || {}).includes(ability),
        familyAvailable: ancestor === story.baseStats[base] && ancestor.gen === 1 &&
          story.storyEvoStageOf(name) <= story.playerEvoStageCapForCity(city),
        movesLegal: [physical, special].every(move => learn.natural.includes(move) && accessible.includes(move)) };
    }));
    story.campMarkDone(eventIndex);
    story.enterBattleEvent(row, true, true, true);
    return { anchor, row: row[0], eventIndex, city, roster: admissible };
  });
  assert.equal(stage.anchor, 'road6');
  assert.deepEqual(stage.roster.filter(partner => !partner.movesLegal || !partner.familyAvailable || !partner.abilityAvailable), []);
  await page.getByRole('button', { name: 'Stand your ground →' }).click();
  await page.waitForFunction(() => state.battleEngine === 'showdown' && !state.isLocked);
  const screen = page.locator('#screen-battle[data-battle-engine="showdown"]');
  const fight = screen.locator('#command-menu [data-cmd="fight"]');
  const first = await page.evaluate(() => ({ boss: { hp: state.fActive.maxHp, moves: state.fActive.moves.map(move => move.name) },
    party: state.playerParty.map(mon => {
      const base = window.__storyTest.baseStats[mon.name];
      return { name: mon.name, hp: mon.maxHp, stats: mon.stats, level: mon.level ?? 50 + (mon.buildData?.expShareLevels || 0),
        matchesOrdinaryStats: mon.maxHp === base.hp + 70 &&
          ['atk', 'def', 'spa', 'spd', 'spe'].every(stat => mon.stats[stat] === base[stat] + 15) };
    }) }));
  assert.ok(first.party.every(mon => mon.matchesOrdinaryStats && mon.level === 50));
  const steps = [];
  for (let attempt = 0; attempt < 45; attempt++) {
    const before = await page.evaluate(() => ({ over: state.isOver, turn: state.turnNumber, player: state.pActive.name,
      hp: state.fActive.currentHp, phase: state._storyNativeBossPhases[0], request: state.nativeRequests?.[0]?.phase }));
    if (before.over) break;
    if (before.request === 'replace') {
      const reserve = page.locator('#modal-party:not(.hidden) button[onclick^="window.selectPartyMember"]:enabled').first();
      const name = await reserve.locator('xpath=ancestor::div[contains(@class,"party-slot")]/img').getAttribute('alt');
      await reserve.click();
      await page.waitForFunction(() => state.isOver || (!state.isLocked && state.nativeRequests?.[0]?.phase === 'move'));
      steps.push({ replacement: name });
      continue;
    }
    await fight.click();
    // Use Gyarados's stronger Attack and let Venusaur recover HP with Giga Drain.
    // Each partner can switch attack categories when Grave Guard comes up.
    const preferPhysical = before.phase ? before.phase.category === 'Special' : before.player === 'Gyarados';
    const category = preferPhysical ? 'Physical' : 'Special';
    const choice = screen.locator('#move-menu .battle-btn-move:enabled')
      .and(screen.getByRole('button', { name: new RegExp(`, ${category},`) }));
    assert.equal(await choice.count(), 1, `${before.player} needs an available ${category} move on turn ${before.turn + 1}`);
    const label = await choice.getAttribute('aria-label');
    await choice.click();
    await page.waitForFunction(turn => state.isOver || state.nativeRequests?.[0]?.phase === 'replace' ||
      (state.turnNumber > turn && !state.isLocked), before.turn);
    const hp = await page.evaluate(() => state.fActive.currentHp);
    steps.push({ turn: before.turn + 1, player: before.player, label, from: before.hp, to: hp,
      guard: before.phase?.category || null, category });
  }
  const victory = page.locator('.story-victory-v2');
  const final = await page.evaluate(() => ({ winner: state.nativeWinner, battleOver: state.isOver,
    foeHp: state.fActive.currentHp, party: state.playerParty.map(mon => [mon.name, mon.currentHp]),
    completedScene: !!window.StoryMode.state.storyEventsFired['extra.cubone.raid'] }));
  assert.equal(final.winner, 1, JSON.stringify({ stage, first, steps, final }));
  assert.ok(steps.some(step => step.guard === 'Special' && step.category === 'Physical' && step.to < step.from),
    `a Physical attack should connect during Grave Guard (${JSON.stringify(steps)})`);
  assert.equal(final.foeHp, 0);
  await victory.waitFor({ timeout: 12000 });
  assert.ok(await page.evaluate(() => window.StoryMode.state.storyEventsFired['extra.cubone.raid']));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ stage, first, steps, final }, null, 2));
} finally {
  await browser.close();
}
