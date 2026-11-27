#!/usr/bin/env node
// Compare meaningful, committed Story states from the same seeded actions.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installWritableStorage, loadEngine } from '../../tests/helpers/load-engine.js';

function snapshot(window) {
  const run = window.StoryMode.state;
  return {
    eventIndex: run.eventIndex,
    badges: run.badges,
    gold: run.gold,
    team: run.team.map(slot => ({
      name: slot.name, id: slot.id, starter: slot.starter, moves: [...slot.build.m],
      ivs: { ...slot.build.ivs }, ability: slot.build.a,
    })),
    inventory: { ...run.inventory },
    tracks: { ...run.tracks },
    choices: { ...run.storyChoices },
    rng: run._strngState,
  };
}

async function runReplay(seed) {
  assert.ok(Number.isSafeInteger(seed) && seed > 0 && seed < 2 ** 31, 'Use a positive 31-bit seed');
  const { window, engine, reset, logs, seedRng } = await loadEngine();
  const story = window.StoryMode;
  const hooks = window.__storyTest;
  assert.ok(story && hooks, 'Story initialized in the harness');
  installWritableStorage(window);
  seedRng(0);
  reset();
  window.showScreen('screen-menu');

  const snapshots = [];
  const capture = (label, extra) => snapshots.push({ label, ...snapshot(window), ...extra });
  story.state._trainerProfilePending = { seed, name: 'Replay Trainer', difficulty: 'normal' };
  story.startNewRun();
  assert.equal(story.state.runSeed, seed);
  assert.ok(story.state.active && story.state.tracks.villain && story.state.tracks.extra);
  capture('Pallet opening');

  await story.enterProfessor();
  const choices = [...window.document.querySelectorAll('#story-prof-rolled-card .prof-pick-choice')];
  assert.ok(choices.length >= 2, 'The Professor must offer a choice');
  capture('Starter offers', { offers: choices.map(choice => ({
    name: choice.querySelector('strong').textContent,
    moves: [...choice.querySelectorAll('[data-prof-move]')].map(move => move.dataset.profMove),
  })) });
  story.profSelectChoice(0);
  await story.profAccept();
  assert.ok(story.state.team[0]?.starter && story.state.profUsed[0]);
  capture('Starter accepted');

  story.enterShop('mart');
  const potion = window.POKEMART_ITEMS.find(item => item.id === 'potion');
  assert.ok(potion, 'Pallet Mart offers a Potion');
  const gold = story.state.gold;
  const stock = story.state.inventory.potion | 0;
  await story.buyItem(potion.id, potion.price);
  assert.equal(story.state.gold, gold - potion.price);
  assert.equal(story.state.inventory.potion, stock + 1);
  capture('Potion purchased', { price: potion.price });

  const saved = JSON.parse(window.localStorage.getItem('pbs_story_save'));
  const beforeContinue = snapshot(window);
  await story.continueRun();
  assert.equal(story.state.inventory.potion, saved.inventory.potion);
  assert.equal(story.state.gold, saved.gold);
  assert.deepEqual(snapshot(window).team, beforeContinue.team);
  capture('Continued saved run');

  // Fixed opponent isolates the encounter RNG after testing variable starter offers.
  const row = hooks.STORY_EVENTS_RAW.findIndex(candidate => candidate[0] === 1);
  assert.ok(row >= 0);
  story.state.eventIndex = row;
  async function firstTurn() {
    reset();
    await hooks.launchBattle([{ name: 'Eevee', build: { m: ['Tackle'], n: 'Hardy', a: 'None', _isShiny: false } }], 1);
    assert.equal(engine.state.mode, 'story');
    const player = engine.state.pActive;
    const slot = Math.max(0, player.moves.findIndex(move => move.category !== 'Status'));
    const pp = player.moves[slot].pp;
    logs.length = 0;
    await window.playTurn(slot, null);
    assert.ok(logs.length && player.moves[slot].pp < pp, 'A move was committed');
    return {
      foe: engine.state.fActive.name,
      hp: [player.currentHp, engine.state.fActive.currentHp],
      pp: [player.moves[slot].pp, engine.state.fActive.moves[0].pp],
      cursor: engine.state.storyBattleRng?.cursor ?? null,
    };
  }
  const turn = await firstTurn();
  capture('First battle turn', { turn });
  story.onBattleEnd(false, 'Defeat', '');
  const retry = await firstTurn();
  assert.deepEqual(retry, turn, 'A rematch restarts this encounter’s combat stream');
  capture('First battle turn replayed', { turn: retry });
  return { seed, snapshots };
}

async function main() {
  const [, , command = 'capture', seedArg = '12345'] = process.argv;
  const seed = Number(seedArg);
  switch (command) {
  case 'capture': {
    const path = new URL('../../tests/reports/story-replay-trace.json', import.meta.url);
    await mkdir(new URL('./', path), { recursive: true });
    const trace = await runReplay(seed);
    await writeFile(path, JSON.stringify(trace, null, 2) + '\n');
    console.log(`[story-replay] Captured ${trace.snapshots.length} milestones at ${fileURLToPath(path)}`);
    break;
  }
  case 'diff': {
    const first = await runReplay(seed);
    const repeated = await runReplay(seed);
    assert.deepEqual(repeated, first, 'The same seed and actions produce the same Story state');
    const control = await runReplay(seed === 2 ** 31 - 1 ? seed - 1 : seed + 1);
    assert.notDeepEqual(first.snapshots[1].offers, control.snapshots[1].offers,
      'A different seed changes the actual starter offers');
    console.log(`[story-replay] ${first.snapshots.length} milestones matched twice. Changing the seed changed the offers.`);
    break;
  }
  default: throw new Error('usage: story-replay.mjs [capture|diff] [seed]');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
}

export { runReplay };
