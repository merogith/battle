// P4 — structured victory card. Locks the v2 contract:
//   • card structure: head band (medallion on milestones), quote block only
//     when there's flavor to show, gold delta row, Continue INSIDE the card,
//   • itemized rewards: {icon,label} entries render as sprite chips, plain
//     strings keep rendering as full-width lines (mixed arrays work),
//   • the dismissal contract from P0.1 is untouched (Continue/cb-once),
//   • aria-label stays the title param; the heading stays "VICTORY!".
//   node --test tests/suites/victory-overlay-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

let W, ST;
before(async () => {
  ({ window: W } = await loadEngine());
  ST = W.__storyTest;
  W.__victoryInputArmMs = 0;
});

function setSm(extra = {}) {
  ST.sm = Object.assign({
    active: true, badges: 3, gold: 7500, runSeed: 5,
    team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } } }],
    settings: { enabledGens: [1] }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex: 0, trainerAssignments: {}, inventory: {}, facilityIntros: {}, facilitiesSeen: {},
    profUsed: {}, npcStageSeen: {}, gymCleared: {}, scenesShown: {},
  }, extra);
  return ST.sm;
}

function mount({ gotBadge = false, rewardLines = [], event = 'Basic Trainer', coins = 250, state = {} } = {}) {
  setSm(state);
  let cb = 0;
  ST.showVictoryOverlay('VICTORY!', coins, gotBadge, () => cb++, event, 5, rewardLines);
  const ov = W.document.querySelector('div[role="dialog"][aria-label="VICTORY!"]');
  assert.ok(ov, 'overlay mounted');
  return { ov, cbCount: () => cb };
}
const dismiss = (ov) => { const b = [...ov.querySelectorAll('button')].find(x => /Continue/.test(x.textContent || '')); if (b) b.click(); };

test('structured card: head, gold row, Continue lives inside the card', () => {
  const { ov, cbCount } = mount();
  const card = ov.querySelector('.story-victory-v2-card');
  assert.ok(card, 'card wrapper');
  assert.equal(card.querySelector('.story-victory-v2-title').textContent, 'VICTORY!');
  assert.ok(!card.querySelector('.story-victory-v2-medallion'), 'no medallion on plain wins');
  assert.match(card.querySelector('.story-victory-v2-gold').textContent, /250/, 'gold delta');
  assert.match(card.querySelector('.story-victory-v2-gold-total').textContent, /7,500/, 'running total');
  const cont = [...card.querySelectorAll('button')].find(b => /Continue/.test(b.textContent || ''));
  assert.ok(cont, 'Continue button is inside the card');
  cont.click();
  assert.equal(cbCount(), 1, 'P0.1 dismissal contract intact');
  assert.ok(!ov.isConnected, 'overlay removed');
});

test('milestone win shows the medallion + milestone line', () => {
  const { ov } = mount({ gotBadge: true, event: 'Gym Leader 3' });
  assert.ok(ov.querySelector('.story-victory-v2-medallion'), 'badge medallion');
  assert.match(ov.querySelector('.story-victory-v2-milestone').textContent, /Badge 3 of 8/, 'pinned line');
  assert.ok(ov.querySelector('.story-victory-v2-quote'), 'leader flavor renders in the quote block');
  dismiss(ov);
});

test('a new badge adds one chosen reserve without dismissing the results', () => {
  const build = { m: ['Tackle'], n: 'Hardy' };
  const egg = { id: 'egg-in-party', name: 'Eevee', isEgg: true };
  const reserve = { id: 'reserve', name: 'Abra', nickname: 'Wisp', build };
  const { ov, cbCount } = mount({ gotBadge: true, event: 'Gym Leader 1', state: {
    badges: 1, team: [{ id: 'first', name: 'Pikachu', build }, { id: 'second', name: 'Eevee', build }, egg],
    pcBox: [{ id: 'egg-in-box', name: 'Eevee', isEgg: true }, reserve],
  } });
  assert.match(ov.querySelector('.story-victory-party').textContent, /can now hold 3 Pokémon/);
  assert.equal(ov.querySelectorAll('.story-victory-v2-continue').length, 1, 'Continue stays distinct from the party controls');
  const toggle = ov.querySelector('[aria-controls="story-badge-reserve-picker"]');
  toggle.click();
  const menu = ov.querySelector('select');
  assert.equal(menu.options.length, 1, 'eggs cannot be selected as fighters');
  assert.match(menu.options[0].text, /Wisp \(Abra\)/);
  ov.querySelector('.story-victory-party-pick button').click();
  assert.equal(cbCount(), 0, 'the story only advances through Continue');
  assert.equal(ST.sm.team.at(-1), reserve);
  assert.equal(ST.sm.pcBox.length, 1);
  assert.match(ov.querySelector('.story-victory-party [role="status"]').textContent, /Wisp joined/);
  dismiss(ov);
  assert.equal(cbCount(), 1);
});

test('a badge shows a route hint when storage has no battle-ready reserves', () => {
  const { ov } = mount({ gotBadge: true, event: 'Gym Leader 1', state: { badges: 1, pcBox: [] } });
  assert.match(ov.querySelector('.story-victory-party').textContent, /new partner on the road/);
  assert.equal(ov.querySelector('[aria-controls="story-badge-reserve-picker"]'), null);
  dismiss(ov);
});

test('itemized rewards: sprite chips for {icon,label}, plain lines for strings — mixed', () => {
  const { ov } = mount({
    rewardLines: [
      '🎁 Gym bundle: 3 Poké Balls, 1 Rare Candy',
      { icon: 'sprites/pokesprite/items/protein.png', label: '+2 Protein' },
      { icon: 'sprites/pokesprite/items/iron.png', label: '+1 Iron' },
      '🏋️ EV training · +9 EVs to each of your 1 Pokémon',
    ],
  });
  const lines = [...ov.querySelectorAll('.story-victory-v2-line')].map(e => e.textContent);
  assert.equal(lines.length, 2, 'two plain lines');
  assert.match(lines[0], /Gym bundle/);
  const chips = [...ov.querySelectorAll('.story-victory-v2-chip')];
  assert.equal(chips.length, 2, 'two sprite chips');
  assert.match(chips[0].textContent, /\+2 Protein/);
  assert.match(chips[0].querySelector('img').getAttribute('src'), /protein\.png/, 'item sprite on the chip');
  dismiss(ov);
});

test('no rewards / no flavor → no empty containers', () => {
  const { ov } = mount({ rewardLines: [] });
  assert.ok(!ov.querySelector('.story-victory-v2-rewards'), 'no empty rewards block');
  // Plain trainer wins may still carry a banter quote — only assert the block
  // is absent when BOTH flavor sources are empty (no exchange recorded here).
  assert.ok(!ov.querySelector('.story-victory-v2-quote') || ov.querySelector('.story-victory-v2-quote').textContent.trim().length > 0,
    'quote block never renders empty');
  dismiss(ov);
});
