// Hidden Power tutor-card discoverability (2026-07). Once the Diviner unlocks it,
// the Move Tutor offers a single unified "Hidden Power" card. movesDB types the bare
// move Normal/BP60 (its IV-form default), which hides what the player actually gets:
// on teach it becomes THIS Pokémon's own fixed element. The card now shows that
// element and explains the mechanic, so the feature is legible instead of opaque.
//
// This locks: (1) the unified card renders the mon's own hpType as its type badge
// (not Normal) and BP 60; (2) the desc explains the "hidden element" mechanic;
// (3) a waiting favor keeps the natural type visible and explains the choice.
// It also covers changing an equipped move with the favor. New lessons are
// covered by hidden-power-mentor.test.js.
//
// Run: node --test tests/suites/hidden-power-tutor-card.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installWritableStorage, loadEngine, openTutorMon } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const host = () => w.document.getElementById('story-tutor-team');
async function settle(needle, tries = 40) { for (let i = 0; i < tries; i++) { await sleep(40); const h = host(); if (h && h.innerHTML.includes(needle)) return true; } return false; }
async function searchHiddenPower(value = 'Hidden Power') {
  const search = host().querySelector('.tx-search-input[data-kind="moves"]');
  search.value = value;
  search.dispatchEvent(new w.Event('input', { bubbles: true }));
  await sleep(180);
}
function hpCard() { return host().querySelector('.tx-card[data-card-value="Hidden Power"]'); }

function prime({ choose }) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 6; ST.sm.gold = 99999; ST.sm.inventory = {};
  ST.sm.hiddenPowerUnlocked = true;
  // The one-time first-pick token has been ISSUED (hpChooseGranted) — otherwise the
  // point-of-use self-heal would lazily grant it and every card would read "you
  // choose". `choose` then models whether it is still pending (first lesson) or spent.
  ST.sm.hpChooseGranted = true;
  ST.sm.hiddenPowerChoosePending = !!choose;
  // A high-city (Guru) tutor so nothing gates the card; pick a mon and pin its element.
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 7) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', hpType: 'Ice', evs: {}, ivs: {} } }];
}

test('the unified Hidden Power card shows the mon\'s own element, not Normal', async () => {
  prime({ choose: false });
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w);
  await settle('tx-grid');
  await searchHiddenPower();
  const card = hpCard();
  assert.ok(card, 'the unified Hidden Power card is present at an unlocked tutor');
  const badge = card.querySelector('.type-badge');
  assert.ok(badge, 'the card has a type badge');
  assert.equal(badge.textContent.trim(), 'Ice', 'badge shows THIS mon\'s element (Ice), not Normal');
  assert.ok(/type-Ice/.test(badge.className), 'badge is coloured for the real element');
  assert.ok(!/type-Normal/.test(badge.className), 'never the misleading Normal default');
  const bp = card.querySelector('.tx-stat-bp');
  assert.ok(bp && /60/.test(bp.textContent), 'shows the canonical BP 60');
  const desc = card.querySelector('.tx-card-desc');
  assert.ok(desc && /hidden element/i.test(desc.textContent), 'desc explains the hidden-element mechanic');
  assert.ok(/Ice/.test(desc.textContent), 'desc names the resolved element');
});

test('the card carries an accessible "?" explainer (hover + touch + SR labelled)', async () => {
  prime({ choose: false });
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w);
  await settle('tx-grid');
  await searchHiddenPower();
  const card = hpCard();
  const info = card.querySelector('.tx-tapinfo--force');
  assert.ok(info, 'a forced tap-info affordance is present on the Hidden Power card');
  assert.ok(info.getAttribute('title') && /secret element/i.test(info.getAttribute('title')), 'hover text explains the mechanic');
  assert.ok(info.getAttribute('aria-label') && /Hidden Power/i.test(info.getAttribute('aria-label')), 'screen-reader label present');
  // It must NOT be independently focusable — nested interactive content inside the
  // card button would be invalid. The description is available in Details.
  assert.ok(!info.hasAttribute('tabindex'), 'not a nested focusable (valid button content)');
});

test('the natural type remains visible and searchable while the favor is available', async () => {
  prime({ choose: true });
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w);
  await settle('tx-grid');
  await searchHiddenPower('Hidden Power Ice');
  const card = hpCard();
  assert.ok(card, 'card present');
  assert.equal(card.hidden, false);
  assert.equal(card.querySelector('.type-badge').textContent.trim(), 'Ice');
  const desc = card.querySelector('.tx-card-desc');
  assert.match(desc?.textContent || '', /spend the Diviner’s favor to choose another type/i);
});

test('an equipped Hidden Power has one card with the real move name for Forget', async () => {
  prime({ choose: true });
  ST.sm.team[0].build.m.push('Hidden Power Ice');
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w);
  await settle('tx-grid');
  await searchHiddenPower();
  const equipped = host().querySelector('.tx-card[data-card-value="Hidden Power Ice"]');
  assert.ok(equipped && !equipped.hidden);
  assert.equal(equipped.querySelector('[data-unlearn-move]')?.dataset.unlearnMove, 'Hidden Power Ice');
  assert.equal(hpCard(), null);
});

test('one favor changes an equipped Hidden Power in place only after confirmation', async t => {
  installWritableStorage(w);
  prime({ choose: true });
  const [partner] = ST.sm.team;
  partner.build.m.push('Hidden Power Ice');
  partner.currentHp = 42;
  partner.pp = [7, 3];
  ST.sm.inventory = { heartScale: 1 };
  const { gold } = ST.sm;
  const originalConfirm = w.showGameConfirm;
  t.after(() => { w.showGameConfirm = originalConfirm; });
  let accept = false;
  let confirmed = 0;
  w.showGameConfirm = async prompt => {
    assert.match(prompt, /Garchomp’s Hidden Power to Fire/);
    confirmed++;
    return accept;
  };
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w);
  assert.ok(await settle('data-hp-retune'));
  await searchHiddenPower();
  const chooseFire = () => {
    host().querySelector('[data-hp-retune="1"]').click();
    w.document.querySelector('.story-hp-picker [data-hp="Fire"]').click();
  };
  chooseFire();
  await sleep(40);
  assert.equal(confirmed, 1);
  assert.equal(ST.sm.hiddenPowerChoosePending, true);
  assert.equal(partner.build.m[1], 'Hidden Power Ice');

  accept = true;
  chooseFire();
  assert.ok(await settle('data-card-value="Hidden Power Fire"'));
  assert.deepEqual(Array.from(partner.build.m), ['Earthquake', 'Hidden Power Fire']);
  assert.equal(partner.build.hpType, 'Fire');
  assert.equal(partner.currentHp, 42);
  assert.deepEqual(partner.pp, [7, 3]);
  assert.equal(ST.sm.gold, gold);
  assert.equal(ST.sm.inventory.heartScale, 1);
  assert.equal(ST.sm.hiddenPowerChoosePending, false);
  assert.equal(host().querySelector('[data-hp-retune]'), null);
  const saved = JSON.parse(w.localStorage.getItem('pbs_story_save'));
  assert.deepEqual(saved.team[0].build.m, ['Earthquake', 'Hidden Power Fire']);
  assert.equal(saved.hiddenPowerChoosePending, false);
});
