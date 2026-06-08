// Phase 3B — characterization net for the TWO mon-row shapes that the shared-tile
// consolidation (storyMonTileMain, see story-card-tile.test.js) intentionally LEFT
// OUT as "a different shape, not the collapsed tile":
//
//   1. PC box card        — `.pc-card`  (_pcCardHtml, where = party | pc | sell)
//   2. Party-review row   — `.prr-*`    (renderTeamPanel → #modal-story-party)
//
// Neither is routed through storyMonTileMain today. This file is a pure
// characterization snapshot of their CURRENT markup — it changes no behavior and
// drives only the real public render path (StoryMode.enterPokemonCenter /
// openPartyModal). Its jobs:
//   • lock the markup so an accidental drift in either shape fails loudly, and
//   • be the regression net already in place IF a future, sign-off-gated pass
//     decides to fold these two into storyMonTileMain after all.
//
// The golden (story-pc-party-card.golden.json) is captured from the live code with
// a fixed team / PC box. When you INTENTIONALLY change either shape's markup,
// regenerate it:  UPDATE_GOLDEN=1 node --test tests/suites/story-pc-party-card.test.js
//
// Run: node --test tests/suites/story-pc-party-card.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../helpers/load-engine.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD_PATH = path.join(HERE, 'story-pc-party-card.golden.json');
const UPDATE = !!process.env.UPDATE_GOLDEN;

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const doc = w.document;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// Fixed slots → deterministic markup. ids are explicit because they surface in the
// card markup (data-pc-id / button onclick). A strong mon (Garchomp, G1) and a
// weak, nicknamed one (Eevee "Fluffy", G4) exercise tier classes + the nickname
// branch; a bare egg slot exercises each shape's isEgg branch.
const SLOT_A = { id: 'fix-garchomp', name: 'Garchomp', nickname: '', starter: false, unsellable: false,
  build: { m: ['Earthquake', 'Dragon Claw', 'Stone Edge', 'Swords Dance'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: {}, ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }, _isShiny: false } };
const SLOT_B = { id: 'fix-eevee', name: 'Eevee', nickname: 'Fluffy', starter: false, unsellable: false,
  build: { m: ['Tackle', 'Quick Attack', 'Swift', 'Bite'], n: 'Hardy', a: 'Adaptability', i: '', evs: {}, ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }, _isShiny: false } };

function primeRun() {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.gold = 99999; ST.sm.inventory = {}; ST.sm.badges = 6;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9], megaOn: true, zOn: true, dynaOn: true, teraOn: true };
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === 7) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ ...SLOT_A }, { ...SLOT_B }, { id: 'egg-party', isEgg: true }];
  ST.sm.pcBox = [{ ...SLOT_A, id: 'box-garchomp' }, { id: 'egg-box', isEgg: true }];
}

async function waitFor(sel, tries = 60) {
  for (let i = 0; i < tries; i++) { if (doc.querySelector(sel)) return true; await sleep(25); }
  return false;
}

// Drive the real PC screen (lands on the Storage tab) and return its .pc-card nodes.
async function pcCards() {
  await w.StoryMode.enterPokemonCenter();
  assert.ok(await waitFor('#story-pc-body .pc-card'), '#story-pc-body must render .pc-card');
  return [...doc.querySelectorAll('#story-pc-body .pc-card')];
}

// Drive the real party modal and return its .party-reorder-row nodes.
async function prrRows() {
  await w.StoryMode.openPartyModal();
  assert.ok(await waitFor('#story-team-panel .party-reorder-row'), '#story-team-panel must render .party-reorder-row');
  return [...doc.querySelectorAll('#story-team-panel .party-reorder-row')];
}

const pickById = (nodes, attr, id) => {
  const n = nodes.find((x) => x.getAttribute(attr) === id);
  assert.ok(n, `expected a node with ${attr}="${id}"`);
  return norm(n.outerHTML);
};

// ── Capture every shape once, up front (single engine boot) ──────────────────
const RESULT = {};
{
  primeRun();
  const cards = await pcCards();
  RESULT.PC_PARTY      = pickById(cards, 'data-pc-id', 'fix-garchomp'); // where=party, plain
  RESULT.PC_PARTY_NICK = pickById(cards, 'data-pc-id', 'fix-eevee');    // where=party, nicknamed
  RESULT.PC_PARTY_EGG  = pickById(cards, 'data-pc-id', 'egg-party');    // where=party, egg branch
  RESULT.PC_BOX        = pickById(cards, 'data-pc-id', 'box-garchomp'); // where=pc
  RESULT.PC_BOX_EGG    = pickById(cards, 'data-pc-id', 'egg-box');      // where=pc, egg branch

  primeRun();
  const rows = await prrRows();
  RESULT.PRR_LEAD = norm(rows[0].outerHTML); // idx 0 → LEAD flag
  RESULT.PRR_NICK = norm(rows[1].outerHTML); // idx 1 → #2 + nickname
  RESULT.PRR_EGG  = norm(rows[2].outerHTML); // idx 2 → egg branch
}

if (UPDATE) {
  fs.writeFileSync(GOLD_PATH, JSON.stringify(RESULT, null, 2) + '\n');
  console.log(`[UPDATE_GOLDEN] wrote ${Object.keys(RESULT).length} shapes → ${path.basename(GOLD_PATH)}`);
}
assert.ok(fs.existsSync(GOLD_PATH), `golden missing — generate it with UPDATE_GOLDEN=1`);
const GOLD = JSON.parse(fs.readFileSync(GOLD_PATH, 'utf8'));

// ── Assertions ───────────────────────────────────────────────────────────────
test('PC box card (.pc-card) renders byte-identical to golden (party / pc / egg)', () => {
  for (const k of ['PC_PARTY', 'PC_PARTY_NICK', 'PC_PARTY_EGG', 'PC_BOX', 'PC_BOX_EGG']) {
    assert.equal(RESULT[k], GOLD[k], `${k}: matches golden (regen with UPDATE_GOLDEN=1 if the change is intentional)`);
  }
});

test('Party-review row (.prr-*) renders byte-identical to golden (lead / nick / egg)', () => {
  for (const k of ['PRR_LEAD', 'PRR_NICK', 'PRR_EGG']) {
    assert.equal(RESULT[k], GOLD[k], `${k}: matches golden (regen with UPDATE_GOLDEN=1 if the change is intentional)`);
  }
});

test('.pc-card keeps its canonical wrapper + hit target + actions', () => {
  for (const k of ['PC_PARTY', 'PC_PARTY_NICK', 'PC_BOX']) {
    const h = GOLD[k];
    assert.ok(/^<div class="pc-card /.test(h), `${k}: .pc-card wrapper`);
    assert.ok(/class="pc-card-hit"/.test(h), `${k}: tap target`);
    assert.ok(/class="pc-card-sprite"/.test(h), `${k}: sprite`);
    assert.ok(/class="pc-card-name"/.test(h), `${k}: name slot`);
    assert.ok(/class="pc-card-actions"/.test(h), `${k}: actions row`);
  }
  for (const k of ['PC_PARTY_EGG', 'PC_BOX_EGG']) {
    assert.ok(/^<div class="pc-card pc-card--egg"/.test(GOLD[k]), `${k}: egg variant wrapper`);
  }
});

test('.prr-* keeps its canonical sprite + body slots', () => {
  for (const k of ['PRR_LEAD', 'PRR_NICK']) {
    const h = GOLD[k];
    assert.ok(/^<div class="party-reorder-row /.test(h), `${k}: row wrapper`);
    assert.ok(/class="prr-sprite"/.test(h), `${k}: sprite slot`);
    assert.ok(/class="prr-body"/.test(h), `${k}: body slot`);
    assert.ok(/class="prr-name"/.test(h), `${k}: name slot`);
  }
  assert.ok(/party-reorder-row--egg/.test(GOLD.PRR_EGG), 'PRR_EGG: egg variant wrapper');
  assert.ok(/class="party-lead-flag"/.test(GOLD.PRR_LEAD), 'PRR_LEAD: lead flag present on slot 0');
  assert.ok(/class="party-slot-num"/.test(GOLD.PRR_NICK), 'PRR_NICK: slot number on non-lead row');
});
