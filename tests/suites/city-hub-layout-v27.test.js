// CITY HUB V2 layout guard (P1) — the desktop hub redesign is presentation-
// only: CSS re-layout (grid via display:contents) + a static identity band.
// renderCityActions' gate logic and makeActionBtn markup are untouched. This
// suite locks that contract:
//   • per-city button parity: every City row's rendered (text, onclick, class)
//     triples match the committed golden (captured from the pre-redesign
//     renderer — regenerate with CITY_HUB_GOLDEN_REGEN=1 after an APPROVED
//     behaviour change),
//   • identity band renders the town name + 8 badge pips (earned = sm.badges),
//   • casino canary: the shared .story-action-btn base block is intact and the
//     casino-scoped rule survives; the V2 grid rules are desktop-gated and the
//     mobile inline layout on #story-action-buttons is byte-identical.
//   node --test tests/suites/city-hub-layout-v27.test.js
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const GOLD_PATH = path.join(HERE, 'city-hub-layout-v27.golden.json');
const REGEN = !!process.env.CITY_HUB_GOLDEN_REGEN;

let W, ST, SER;
before(async () => {
  ({ window: W } = await loadEngine());
  ST = W.__storyTest;
  SER = ST.STORY_EVENTS_RAW;
});

const INTROS_ALL = { mart: 1, tutor: 1, nature: 1, evolab: 1, stoneShop: 1, link: 1, fanclub: 1, dept: 1, casino: 1, dojo: 1, evtrainer: 1, colress: 1, artifacts: 1, safari: 1, center: 1, relic: 1, bag: 1, party: 1 };

// One FIXED sm across every city render → deterministic button output.
function setSm(eventIndex) {
  ST.sm = {
    active: true, badges: 3, gold: 4500, runSeed: 7,
    team: [{ name: 'Pikachu', build: { m: ['Thunderbolt'], i: null, a: null, n: 'Hardy', evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } } }],
    settings: { enabledGens: [1] }, unlockedGimmicks: [], storyDifficulty: 'normal',
    eventIndex, trainerAssignments: {}, inventory: {},
    facilityIntros: { ...INTROS_ALL }, facilitiesSeen: { ...INTROS_ALL },
    profUsed: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true },
    npcStageSeen: { tutor: 9, evolab: 9, dojo: 9 }, gymCleared: {}, rivalEncounterLog: [],
  };
}

const cityRows = () => SER.map((r, i) => ({ r, i })).filter(({ r }) => Array.isArray(r) && r[1] === 'City');

function renderButtons(i) {
  const html = W.__renderCityActionsForTest(i);
  assert.ok(!String(html).startsWith('ERR:'), `render failed @${i}: ${html}`);
  const host = W.document.getElementById('story-action-buttons');
  return [...host.querySelectorAll('button')].map(b => ({
    text: (b.textContent || '').replace(/\s+/g, ' ').trim(),
    onclick: b.getAttribute('onclick') || '',
    // story-gate-pulse is a transient one-shot animation hint added to a locked
    // CTA after render — strip it so parity tracks structural classes only.
    cls: (b.className || '').replace(/\bstory-gate-pulse\b/g, '').replace(/\s+/g, ' ').trim(),
  }));
}

// ── Per-city button parity vs the golden ─────────────────────────────────────
test('every City row renders the same buttons/onclicks as the golden snapshot', () => {
  const snapshot = {};
  for (const { r, i } of cityRows()) {
    setSm(i);
    snapshot[i] = { city: String(r[2]), buttons: renderButtons(i) };
  }
  if (REGEN) {
    fs.writeFileSync(GOLD_PATH, JSON.stringify(snapshot, null, 1));
    assert.ok(Object.keys(snapshot).length >= 8, 'regenerated golden covers the city set');
    return;
  }
  const gold = JSON.parse(fs.readFileSync(GOLD_PATH, 'utf8'));
  assert.deepEqual(Object.keys(snapshot), Object.keys(gold), 'same set of City rows');
  for (const k of Object.keys(gold)) {
    assert.deepEqual(snapshot[k], gold[k], `city row @${k} (${gold[k].city}): buttons/onclicks/classes unchanged`);
  }
});

// ── Identity band ────────────────────────────────────────────────────────────
test('identity band mirrors the town name and badge pips', () => {
  const { i } = cityRows()[1];
  setSm(i);
  W.__renderCityActionsForTest(i);
  const name = W.document.getElementById('story-city-identity-name');
  assert.ok(name && name.textContent.trim().length > 0, 'band shows a town name');
  const pips = W.document.querySelectorAll('#story-city-identity-badges .story-city-badge-pip');
  assert.equal(pips.length, 8, 'eight badge pips');
  const earned = W.document.querySelectorAll('#story-city-identity-badges .story-city-badge-pip.earned');
  assert.equal(earned.length, 3, 'earned pips match sm.badges');
});

// ── Casino canary + desktop gating (source-level) ────────────────────────────
test('base .story-action-btn block intact, casino rule survives, V2 rules desktop-gated', () => {
  const src = fs.readFileSync(path.join(ROOT, 'battle.html'), 'utf8');
  // Two pre-existing blocks: the desktop base rule and the phone font-size bump
  // inside the portrait media query. V2 must not add or edit either.
  const baseRuleCount = (src.match(/^\s*\.story-action-btn \{/gm) || []).length;
  assert.equal(baseRuleCount, 2, '.story-action-btn blocks: base + phone sizing only (V2 adds none)');
  assert.ok(src.includes('border: 2px solid #4a4f5e; border-radius: 0 !important;'),
    'base block signature line intact');
  assert.ok(src.includes('#screen-story-casino .story-action-btn.casino {'), 'casino-scoped reuse rule survives');
  assert.ok(src.includes('body:not(.is-mobile) #screen-story-city #story-action-buttons {'),
    'V2 grid rule exists and is desktop-gated');
  assert.ok(!/^\s*#story-action-buttons \{/m.test(src), 'no ungated #story-action-buttons layout rule');
  assert.ok(src.includes('body:not(.is-mobile) #screen-story-city #story-city-actions { display: contents !important; }'),
    'display:contents promotion is desktop-gated');
  // Mobile path byte-identical: the legacy inline layout still ships in markup.
  assert.ok(src.includes('<div id="story-action-buttons" style="display:flex;flex-direction:column;gap:8px;"></div>'),
    'mobile inline layout on #story-action-buttons unchanged');
  assert.ok(src.includes('id="story-city-left" style="width:165px;'),
    'mobile inline layout on #story-city-left unchanged');
});
