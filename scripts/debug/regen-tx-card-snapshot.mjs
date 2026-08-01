#!/usr/bin/env node
// Regenerates tests/fixtures/tx-cards-before.json, the byte-identical baseline behind
// tests/suites/story-tutor-card-snapshot.test.js.
//
// Why a regen tool is needed at all: the tutor's "% of Smogon builds use this option"
// figure counts ONE canonical option per build, and loadBuildsCSV picks that option with
// Math.random() (see _csvPickOption). Under the seeded test harness that is deterministic
// for a given data/builds.csv — but adding or removing any row shifts the RNG stream for
// every row after it, so unrelated species' percentages move. The snapshot is therefore
// coupled to the exact byte content of builds.csv, and any legitimate data change needs
// the baseline refreshed.
//
// Run AFTER confirming the only diff is percentage drift. If card markup changed shape,
// that is a real render change and wants review, not a regen.
//
//   node scripts/debug/regen-tx-card-snapshot.mjs
//   node scripts/debug/regen-tx-card-snapshot.mjs --dry   (print the diff, write nothing)

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine, openTutorMon } from '../../tests/helpers/load-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const FIXTURE = join(ROOT, 'tests', 'fixtures', 'tx-cards-before.json');
const DRY = process.argv.includes('--dry');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;

// Must mirror prime()/the capture flow in story-tutor-card-snapshot.test.js exactly —
// same mon, build, city and stage — or the baseline describes a different screen.
function prime(city) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) {
    let c = -1;
    try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {}
    if (c === city) { idx = ei; break; }
  }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Earthquake'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: {}, ivs: {} } }];
}

const host = () => w.document.getElementById('story-tutor-team');
async function settle(needle, tries = 30) {
  for (let i = 0; i < tries; i++) {
    await sleep(40);
    const h = host();
    if (h && h.innerHTML.includes(needle)) return;
  }
}
async function showAll() {
  host().querySelector('.tx-chip--rec[data-filter-kind="recOnly"]')?.click();
  await sleep(180);
}
function grab(kind) {
  const out = {};
  for (const c of host().querySelectorAll(`.tx-card[data-card-kind="${kind}"]`)) {
    out[c.getAttribute('data-card-value')] = c.outerHTML;
  }
  return out;
}

prime(7);
await w.StoryMode.enterTutor('loadout');
await openTutorMon(w);
await settle('tx-grid');
await showAll();
const items = grab('item');

prime(7);
await w.StoryMode.enterTutor('loadout');
await openTutorMon(w);
await settle('tx-grid');
host().querySelector('button.tx-tab[data-tab="ability"]').click();
await sleep(220);
await showAll();
const abilities = grab('ability');

const next = { items, abilities };
if (!Object.keys(items).length || !Object.keys(abilities).length) {
  console.error('[regen] captured an empty card set — the tutor screen did not render. Aborting.');
  process.exit(1);
}

const prev = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : { items: {}, abilities: {} };
let changed = 0, structural = 0;
for (const kind of ['items', 'abilities']) {
  const keysBefore = Object.keys(prev[kind] || {}).sort().join(',');
  const keysAfter = Object.keys(next[kind]).sort().join(',');
  if (keysBefore !== keysAfter) {
    structural++;
    console.log(`[regen] ${kind}: the SET of cards changed — review this, it is not percentage drift.`);
  }
  for (const k of Object.keys(next[kind])) {
    if (prev[kind] && prev[kind][k] !== next[kind][k]) {
      changed++;
      // Percentage-only drift is the expected case; anything else is worth eyeballing.
      // Strip both the tooltip figure and the rounded badge, which renders as "4%" or
      // "&lt;1%" depending on magnitude.
      const stripPct = (s) => String(s || '')
        .replace(/[\d.]+% of Smogon builds[^"]*"/g, '"')
        .replace(/>(?:&lt;)?[\d.]+%</g, '>%<');
      const onlyPct = stripPct(prev[kind][k]) === stripPct(next[kind][k]);
      if (!onlyPct) {
        structural++;
        console.log(`[regen] ${kind}/${k}: markup changed beyond the usage %, review before accepting.`);
      }
    }
  }
}

console.log(`[regen] ${Object.keys(items).length} item cards, ${Object.keys(abilities).length} ability cards; ${changed} changed (${structural} beyond usage %).`);
if (DRY) { console.log('[regen] --dry: nothing written.'); process.exit(0); }
writeFileSync(FIXTURE, JSON.stringify(next, null, 2) + '\n');
console.log(`[regen] wrote ${FIXTURE}`);
process.exit(0);
