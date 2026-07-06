// ⚡ Battle Mentor (Auto-Build NPC) — availability + adaptation across game stages.
//
// The Mentor is a City-0 facility (like the Professor) that auto-builds each party mon,
// adapting to what's unlocked: City 0 (Move Tutor only) → moves only; later cities fold in
// item / ability / nature, and finally the full EV spread once the EV Trainer opens. This
// walks a Bulbasaur → Ivysaur → Venusaur evolution line across those stages, plus an
// endgame Venusaur, exactly as the maintainer asked.
//
//   node --test tests/suites/story-mentor-stages.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const eventIndexForCity = (city) => {
  for (let ei = 0; ei <= 140; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) return ei; }
  return 0;
};

async function primeMentor(name, city, build, inventory) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 999999; ST.sm.inventory = inventory || {};
  ST.sm.eventIndex = eventIndexForCity(city);
  ST.sm.facilityIntros = {}; ST.sm.facilitiesSeen = {}; ST.sm.npcStageSeen = {}; ST.sm.scenesShown = {};
  ST.sm.team = [{ name, build, id: 'm1' }];
  w.StoryMode.enterMentor();
  const host = () => doc.getElementById('story-mentor-team');
  for (let i = 0; i < 40; i++) { await wait(40); if (host() && (host().querySelector('[data-fastbuild-open]') || host().querySelector('.tx-fastbuild-bar--done'))) break; }
  return ST.txBuildFastBuildPlan(0);
}
const kinds = (plan) => plan.parts.map((p) => p.kind);
const lockedKinds = (plan) => plan.locked.map((l) => l.kind);

test('City-0 hub: the Battle Mentor NPC button is present and calls enterMentor()', () => {
  ST.sm = { active: true, badges: 0, gold: 5000, runSeed: 1, team: [{ name: 'Bulbasaur', build: { m: ['Tackle'], n: 'Hardy', a: 'Overgrow' }, id: 'm1' }], settings: { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, unlockedGimmicks: [], storyDifficulty: 'normal', eventIndex: eventIndexForCity(0), trainerAssignments: {}, inventory: {}, facilityIntros: {}, facilitiesSeen: {}, profUsed: {}, npcStageSeen: {}, gymCleared: {} };
  const grid = w.__renderCityActionsForTest(ST.sm.eventIndex);
  assert.ok(!String(grid).startsWith('ERR:'), `render failed: ${grid}`);
  assert.match(String(grid), /Battle Mentor/, 'Battle Mentor action rendered at City 0');
  assert.match(String(grid), /enterMentor\(\)/, 'button calls enterMentor()');
});

test('Bulbasaur @ City 0 — moves ONLY (item/nature locked, no EV yet)', async () => {
  const plan = await primeMentor('Bulbasaur', 0, { m: ['Tackle'], n: 'Hardy', a: 'Overgrow' });
  assert.ok(plan.moveSteps.length >= 1, 'moves are buildable at C0');
  assert.ok(!kinds(plan).includes('item'), 'no item build at C0 (Dojo locked)');
  assert.ok(!kinds(plan).includes('nature'), 'no nature build at C0 (Nature Rater locked)');
  assert.ok(!kinds(plan).includes('evs') && !kinds(plan).includes('evfocus'), 'no EV build at C0 (Party locked)');
  assert.ok(lockedKinds(plan).includes('item') && lockedKinds(plan).includes('nature'), 'item + nature shown as locked');
});

test('Ivysaur @ City 3 — moves + item + ability + nature, EV as free focus (EV Trainer still locked)', async () => {
  const plan = await primeMentor('Ivysaur', 3, { m: ['Tackle'], n: 'Hardy', a: 'Overgrow' });
  const k = kinds(plan);
  assert.ok(!lockedKinds(plan).includes('nature'), 'Nature Rater unlocked by C3');
  assert.ok(!lockedKinds(plan).includes('item'), 'Battle Dojo unlocked by C3');
  // At least the nature and an EV focus should be offered for an unbuilt mon.
  assert.ok(k.includes('nature'), 'nature is buildable');
  assert.ok(k.includes('evfocus') && !k.includes('evs'), 'EV is focus-only pre-EV-Trainer');
});

test('Venusaur @ City 6 — still focus-only EVs; full item/ability/nature build available', async () => {
  const plan = await primeMentor('Venusaur', 6, { m: ['Tackle'], n: 'Hardy', a: 'Overgrow' });
  const k = kinds(plan);
  assert.ok(!k.includes('evs'), 'no full EV spread before City 7');
  assert.ok(k.includes('evfocus'), 'EV training focus offered');
  assert.ok(k.includes('nature'), 'nature buildable');
});

test('Endgame Venusaur @ City 7 — FULL build incl. the EV spread', async () => {
  const plan = await primeMentor('Venusaur', 7, { m: ['Tackle'], n: 'Hardy', a: 'Overgrow', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } });
  const k = kinds(plan);
  assert.ok(k.includes('evs'), 'full EV spread available at City 7');
  assert.ok(!k.includes('evfocus'), 'focus-only replaced by the full spread');
  assert.ok(k.includes('nature'), 'nature buildable');
  assert.equal(lockedKinds(plan).length, 0, 'nothing locked at endgame');
});

test('apply works end-to-end at both ends: C0 teaches moves; C7 sets the whole kit', async () => {
  w.showGameConfirm = async () => true;
  // C0 Bulbasaur — moves only.
  await primeMentor('Bulbasaur', 0, { m: ['Tackle'], n: 'Hardy', a: 'Overgrow' });
  const beforeN = ST.sm.team[0].build.n;
  await ST.tutorApplyFastBuild(0);
  const b0 = ST.sm.team[0].build;
  assert.ok(b0.m.length >= 2 && !b0.m.every((m) => m === 'Tackle'), 'C0 taught real moves');
  assert.equal(b0.n, beforeN, 'C0 did NOT change nature (locked)');

  // C7 Venusaur — full kit.
  await primeMentor('Venusaur', 7, { m: ['Tackle'], n: 'Hardy', a: 'Overgrow', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } });
  await ST.tutorApplyFastBuild(0);
  const b7 = ST.sm.team[0].build;
  assert.notEqual(b7.n, 'Hardy', 'C7 set a real nature');
  const evTotal = Object.values(b7.evs).reduce((s, v) => s + (v | 0), 0);
  assert.ok(evTotal >= 400, 'C7 applied a full EV spread');
});
