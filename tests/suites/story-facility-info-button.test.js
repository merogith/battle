// Every story facility's Pokémon header must render the SAME "Full summary" (ℹ)
// control — the shared `.story-mon-info-btn` that opens the party summary for that
// mon. Some facilities used to lack it (Move Tutor / Dojo / Nature / EV Trainer /
// Colress / Fan Club); others had a bespoke one (Link in the body, Evo Lab inline).
// This guards that all of them now expose the single shared button so the player can
// inspect any Pokémon from any facility.
// Run: node --test tests/suites/story-facility-info-button.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../helpers/load-engine.js';

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const SM = w.StoryMode;
const doc = w.document;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function prime() {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 8; ST.sm.gold = 999999; ST.sm.inventory = {};
  ST.sm.pcBox = [];
  let idx = 0;
  for (let ei = 0; ei <= 160; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 8) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [
    { name: 'Garchomp', build: { m: ['Earthquake', 'Dragon Claw', 'Stone Edge', 'Swords Dance'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: {}, ivs: {} } },
    { name: 'Gengar', build: { m: ['Shadow Ball', 'Sludge Wave', 'Nasty Plot', 'Substitute'], n: 'Timid', a: 'Cursed Body', i: 'Life Orb', evs: {}, ivs: {} } },
  ];
}

async function infoButtonsIn(hostId, tries = 50) {
  for (let i = 0; i < tries; i++) {
    await sleep(40);
    const host = doc.getElementById(hostId);
    if (host && host.querySelectorAll('.story-mon-info-btn').length) {
      return [...host.querySelectorAll('.story-mon-info-btn')];
    }
  }
  const host = doc.getElementById(hostId);
  return host ? [...host.querySelectorAll('.story-mon-info-btn')] : [];
}

const FACILITIES = [
  { label: 'Move Tutor',    host: 'story-tutor-team',     enter: async () => { await SM.enterTutor('moves'); } },
  { label: 'Battle Dojo',   host: 'story-tutor-team',     enter: async () => { await SM.enterTutor('loadout'); } },
  { label: 'Nature Rater',  host: 'story-tutor-team',     enter: async () => { await SM.enterTutor('nature'); } },
  { label: 'EV Trainer',    host: 'story-evtrainer-team', enter: async () => { SM.enterEVTrainer(); } },
  { label: 'Colress',       host: 'story-colress-team',   enter: async () => { SM.enterColress(); } },
  { label: 'Link Station',  host: 'story-link-team',      enter: async () => { SM.enterLink(); } },
  { label: 'Evolution Lab', host: 'story-evolab-team',    enter: async () => { SM.enterEvolutionLab(); } },
  { label: 'Fan Club',      host: 'story-fanclub-roster', enter: async () => { SM.enterFanClub(); } },
];

for (const fac of FACILITIES) {
  test(`${fac.label}: every mon header carries the shared ℹ info button`, async () => {
    prime();
    await fac.enter();
    const btns = await infoButtonsIn(fac.host);
    assert.ok(btns.length >= ST.sm.team.length,
      `${fac.label}: one info button per team mon (found ${btns.length} for ${ST.sm.team.length} mons)`);
    // Same control everywhere: a span-button that opens the summary for a team index.
    const onclick = btns[0].getAttribute('onclick') || '';
    assert.match(onclick, /openSummary\(/, `${fac.label}: info button opens the full summary`);
    assert.equal(btns[0].getAttribute('title'), 'Full summary', `${fac.label}: consistent tooltip`);
    assert.equal(btns[0].getAttribute('aria-label'), 'Full summary', `${fac.label}: consistent aria-label`);
  });
}

test('the shared info button never nests a <button> inside the header toggle button', () => {
  // The control is a <span role="button">, not a <button>, so it is valid inside the
  // header <button class="story-tutor-mon-toggle">. A literal <button class="story-mon-info-btn">
  // would be invalid nested-interactive markup.
  prime();
  SM.enterLink();
  const host = doc.getElementById('story-link-team');
  assert.ok(host, 'link host present');
  assert.equal(host.querySelectorAll('button.story-mon-info-btn').length, 0,
    'info control is a span (role=button), never a nested <button>');
  assert.ok(host.querySelectorAll('span.story-mon-info-btn[role="button"]').length >= 1,
    'info control is a span with role=button');
});
