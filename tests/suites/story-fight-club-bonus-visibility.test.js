// The Fight Club permanent stat bonus (`build.bonus`, 0–10 per stat) must be
// visible on every surface where the player checks IVs, and must persist
// across PC deposit / withdraw cycles + save reloads.
// Run: node --test tests/suites/story-fight-club-bonus-visibility.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const { window } = eng;
const SM = window.StoryMode;
const sm = SM.state;
const doc = window.document;

window.confirm = () => true;
window.alert = () => {};
window.showGameAlert = () => {};
window.showToast = () => {};

function freshTeam(names, bonus) {
  return names.map((n, i) => ({
    name: n,
    id: 'vis_' + i + '_' + Math.random().toString(36).slice(2, 7),
    build: {
      m: ['Tackle', 'Tackle', 'Tackle', 'Tackle'],
      i: null, a: null, n: 'Hardy',
      ivs: { hp:28, atk:28, def:28, spa:28, spd:28, spe:28 },
      evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
      bonus: bonus ? { ...bonus } : { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
      tired: 0,
    },
  }));
}
function setup(bonus) {
  sm.active = true;
  sm.badges = 6;
  sm.gold = 10000;
  sm.eventIndex = 38;
  sm.team = freshTeam(['Garchomp', 'Gengar', 'Lapras', 'Snorlax', 'Gardevoir', 'Tyranitar'], bonus);
  sm.pcBox = [];
  sm.flags = sm.flags || {};
  sm.inventory = sm.inventory || {};
}

test('Pokémon Fan Club shows the +bonus tag on every stat row when bonus > 0', () => {
  setup({ hp:5, atk:7, def:0, spa:10, spd:3, spe:0 });
  SM.enterFanClub();
  SM.renderFanClubRoster();
  // The roster now starts all-closed — tap the first mon to expand its stat rows.
  doc.querySelector('.story-tutor-mon-toggle[data-team="0"]').click();
  const card = doc.getElementById('fanclub-mon-0');
  assert.ok(card, 'first mon card rendered (expanded after tap)');
  const html = card.innerHTML;
  // Per-stat tags for the stats that have bonus (hp, atk, spa, spd).
  assert.ok(/>\+5</.test(html), 'HP +5 tag present');
  assert.ok(/>\+7</.test(html), 'Atk +7 tag present');
  assert.ok(/>\+10</.test(html), 'SpA +10 tag present');
  assert.ok(/>\+3</.test(html), 'SpD +3 tag present');
  // Effective IV in the tooltip (eg. iv 28 + bonus 5 = 33/41).
  assert.ok(/effective 33\/41/.test(html), 'HP tooltip notes effective 33/41');
  assert.ok(/effective 38\/41/.test(html), 'SpA tooltip notes effective 38/41 (28+10 capped at 38, well under 41)');
  // Summary line carries an FC total (5+7+0+10+3+0 = 25).
  assert.ok(/FC \+25/.test(html), 'card summary shows the FC total bonus');
});

test('Pokémon Fan Club shows no bonus tags on an unboosted mon', () => {
  setup(null); // zero bonus everywhere
  SM.enterFanClub();
  SM.renderFanClubRoster();
  // The roster now starts all-closed — open the first mon so we assert on the expanded body.
  doc.querySelector('.story-tutor-mon-toggle[data-team="0"]').click();
  const card = doc.getElementById('fanclub-mon-0');
  const html = card.innerHTML;
  assert.ok(!/Fight Club bonus/.test(html), 'no FC bonus tooltips when bonus is zero');
  assert.ok(!/FC \+/.test(html), 'no FC total in summary line when bonus is zero');
});

test('Summary modal renders the +bonus next to each IV (when showEVs is on)', () => {
  setup({ hp:4, atk:0, def:6, spa:0, spd:8, spe:2 });
  // The party-info path opens the summary with showEVs on; mimic the call directly.
  const slot = sm.team[0];
  window.showDraftPokemonSummary({ name: slot.name, build: slot.build }, { showEVs: true });
  const modal = doc.getElementById('modal-summary') || doc.querySelector('#modal-summary');
  assert.ok(modal, 'summary modal renders');
  const html = modal.innerHTML;
  // Each tagged stat should produce a +N small element.
  assert.ok(/>\+4</.test(html), 'HP +4 tag present');
  assert.ok(/>\+6</.test(html), 'Def +6 tag present');
  assert.ok(/>\+8</.test(html), 'SpD +8 tag present');
  assert.ok(/>\+2</.test(html), 'Spe +2 tag present');
  assert.ok(/effective 32\/41/.test(html), 'HP tooltip notes effective 32/41 (28+4)');
});

test('Deposit + withdraw preserves the bonus on the mon', () => {
  setup({ hp:10, atk:10, def:10, spa:10, spd:10, spe:10 });
  const id = sm.team[0].id;
  const beforeBonus = { ...sm.team[0].build.bonus };
  SM.pcDeposit(id);
  // Now in the PC box, not the team.
  const inBox = sm.pcBox.find(s => s && s.id === id);
  assert.ok(inBox, 'mon is in the PC after deposit');
  assert.deepEqual(inBox.build.bonus, beforeBonus, 'bonus survives the deposit');
  SM.pcWithdraw(id);
  const back = sm.team.find(s => s && s.id === id);
  assert.ok(back, 'mon is back in the team after withdraw');
  assert.deepEqual(back.build.bonus, beforeBonus, 'bonus survives the withdraw');
});

test('Bonus survives JSON serialization (the same path save() takes)', () => {
  setup({ hp:9, atk:0, def:5, spa:0, spd:7, spe:0 });
  const beforeBonus = { ...sm.team[0].build.bonus };
  // save() stringifies the sm tree to localStorage; load() JSON.parses it back.
  // A JSON round-trip is the persistence guarantee, less the storage layer.
  const wire = JSON.parse(JSON.stringify(sm.team[0]));
  assert.ok(wire.build && wire.build.bonus, 'bonus survives JSON serialization');
  assert.deepEqual(wire.build.bonus, beforeBonus, 'bonus values intact byte-for-byte');
});
