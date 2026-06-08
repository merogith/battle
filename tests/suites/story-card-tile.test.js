// Phase 3B — story-mode card consolidation: the shared "mon tile" (storyMonTileMain).
//
// Six story-mode accordion rows re-inlined the identical sprite + name/meta column
// markup: Move Tutor (collapsed, 3 editor modes), Fan Club, Cable Link, Colress
// (Battle Forms), EV Trainer, and Evolution Tutor (team). Phase 3B extracts that
// block into a single storyMonTileMain({imgHtml,nameHtml,metaHtml,colStyle})
// renderer; each facility's outer button + aside (tier badge, chevron, cost chip,
// data-facility, info button) stay at the call site.
//
// This is invisible to the player BY DESIGN — which is why it needs a snapshot
// test, not eyeballing. The guard drives each facility, pulls the collapsed (or,
// for Tutor modes, the first-rendered) row's .story-tutor-mon-main block, and
// asserts it matches a golden snapshot captured from the PRE-refactor code
// (whitespace normalized). Golden lives in story-card-tile.golden.json and was
// verified byte-identical across the extraction (see the commit). A regression in
// the shared tile — or an accidental re-divergence of one facility — fails here.
//
// NOTE: three expanded Tutor *editor* headers (moves/item/nature) and the Evo Lab
// *PC* row keep their own bespoke meta markup (editing-state class / inline style)
// and are intentionally NOT routed through storyMonTileMain — they are a different
// shape, not the collapsed tile.
//
// Run: node --test tests/suites/story-card-tile.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = JSON.parse(fs.readFileSync(path.join(HERE, 'story-card-tile.golden.json'), 'utf8'));

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// Fixed mons → deterministic markup (full IVs, no shiny, known typing/sets).
const T0 = { name: 'Garchomp', build: { m: ['Earthquake', 'Dragon Claw', 'Stone Edge', 'Swords Dance'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: {}, ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 } } };
const T1 = { name: 'Eevee', build: { m: ['Tackle', 'Quick Attack', 'Swift', 'Bite'], n: 'Hardy', a: 'Adaptability', i: '', evs: {}, ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 } } };

function primeRun() {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.gold = 99999; ST.sm.inventory = {}; ST.sm.badges = 6;
  // megaOn/etc. so Colress (Battle Forms) is enterable.
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9], megaOn: true, zOn: true, dynaOn: true, teraOn: true };
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 7) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ ...T0 }, { ...T1 }];
}

// The first row whose toggle is NOT expanded (story facilities render all-collapsed
// or with row 0 collapsed), reduced to its shared .story-tutor-mon-main block —
// the unit storyMonTileMain owns.
async function tileBlock(hostId, rowSel) {
  for (let i = 0; i < 60; i++) {
    const host = doc.getElementById(hostId);
    if (host && host.querySelector('.story-tutor-mon-toggle')) break;
    await sleep(25);
  }
  const host = doc.getElementById(hostId);
  assert.ok(host, `${hostId} must render`);
  const rows = [...host.querySelectorAll(rowSel)];
  const row = rows.find(n => {
    const tg = n.querySelector('.story-tutor-mon-toggle');
    return tg && tg.getAttribute('aria-expanded') === 'false';
  });
  assert.ok(row, `${hostId}: a collapsed ${rowSel} row must exist`);
  const mains = row.querySelectorAll('.story-tutor-mon-main');
  assert.equal(mains.length, 1, `${hostId}: exactly one .story-tutor-mon-main per row`);
  const main = mains[0];
  // Structural invariants the shared tile guarantees.
  assert.equal(main.querySelectorAll(':scope > img').length, 1, `${hostId}: tile has one sprite img`);
  assert.ok(main.querySelector('.story-tutor-mon-name'), `${hostId}: tile has a name slot`);
  assert.ok(main.querySelector('.story-tutor-mon-meta'), `${hostId}: tile has a meta slot`);
  return norm(main.outerHTML);
}

test('Move Tutor collapsed rows render the shared tile 1:1 (moves / nature / loadout)', async () => {
  for (const mode of ['moves', 'nature', 'loadout']) {
    primeRun();
    await w.StoryMode.enterTutor(mode);
    const got = await tileBlock('story-tutor-team', '.story-tutor-mon');
    assert.equal(got, GOLD['TUTOR_' + mode], `Tutor ${mode}: tile matches golden`);
  }
});

test('Fan Club roster rows render the shared tile 1:1', async () => {
  primeRun();
  await w.StoryMode.enterFanClub();
  assert.equal(await tileBlock('story-fanclub-roster', '.story-tutor-mon'), GOLD.FANCLUB);
});

test('Cable Link trade rows render the shared tile 1:1 (flex:1 column)', async () => {
  primeRun();
  await w.StoryMode.enterLink();
  assert.equal(await tileBlock('story-link-team', '.story-link-mon'), GOLD.LINK);
});

test('Colress (Battle Forms) rows render the shared tile 1:1', async () => {
  primeRun();
  await w.StoryMode.enterColress();
  assert.equal(await tileBlock('story-colress-team', '.story-tutor-mon'), GOLD.COLRESS);
});

test('EV Trainer rows render the shared tile 1:1', async () => {
  primeRun();
  await w.StoryMode.enterEVTrainer();
  assert.equal(await tileBlock('story-evtrainer-team', '.story-tutor-mon'), GOLD.EVTRAINER);
});

test('Evolution Tutor team rows render the shared tile 1:1 (flex:1 column)', async () => {
  primeRun();
  await w.StoryMode.enterEvolutionLab();
  assert.equal(await tileBlock('story-evolab-team', '.story-tutor-mon'), GOLD.EVOLAB_TEAM);
});

test('all migrated facilities share one tile shape (wrapper + sprite + name + meta)', () => {
  for (const [k, html] of Object.entries(GOLD)) {
    assert.ok(/^<div class="story-tutor-mon-main">/.test(html), `${k}: canonical wrapper`);
    assert.ok(/<div class="story-tutor-mon-name">/.test(html), `${k}: has name slot`);
    assert.ok(/<div class="story-tutor-mon-meta">/.test(html), `${k}: has meta slot`);
    assert.ok(/<img /.test(html), `${k}: has sprite`);
  }
});
