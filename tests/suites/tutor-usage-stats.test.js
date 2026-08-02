// The tutor's "% of Smogon builds use this option" must count the data, not sample it.
//
// A Smogon set often lists alternatives for its item / ability / nature
// ("Heavy-Duty Boots|Eject Pack"). loadBuildsCSV collapses each field to ONE scalar with
// Math.random() so a rolled team still varies per encounter — but the usage display used
// to count that scalar, which made it a random sample of size 1 per build. 21.8% of the
// 17k-build corpus lists multiple items, so the same species reported different usage on
// every page load (Garchomp's Lum Berry read 3.7% and 0.9% on consecutive loads with no
// data change), options that lost the coin flip showed no percentage at all, and the ★
// recommendation — which keys on the same counts — moved with it.
//
// _txAccumulateBuilds now spreads a build's weight evenly across every listed option. The
// roll-side scalar is deliberately left alone, so encounter variety is unchanged.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSV = fs.readFileSync(path.join(ROOT, 'data', 'builds.csv'), 'utf8').split('\n');
const HEADER = CSV[0].split(',');
const COL = { name: HEADER.indexOf('name'), item: HEADER.indexOf('item') };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let w, ST;
before(async () => { ({ window: w } = await loadEngine()); ST = w.__storyTest; });

// Render the tutor's item tab for one species and read every card's usage percentage.
async function itemPercentages(species) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = 6; ST.sm.gold = 99999; ST.sm.inventory = {}; ST.sm.eventIndex = 0;
  ST.sm.team = [{ name: species, build: { m: ['Tackle'], n: 'Hardy', a: null, i: 'Leftovers', evs: {}, ivs: {} } }];
  await w.StoryMode.enterTutor('loadout');
  await openTutorMon(w);
  await sleep(320);
  const host = w.document.getElementById('story-tutor-team');
  host.querySelector('.tx-chip--rec[data-filter-kind="recOnly"]')?.click();
  await sleep(250);
  const out = {};
  for (const c of host.querySelectorAll('.tx-card[data-card-kind="item"]')) {
    const m = /title="([\d.]+)% of Smogon builds/.exec(c.outerHTML);
    out[c.getAttribute('data-card-value')] = m ? Number(m[1]) : null;
  }
  return out;
}

describe('usage percentages count every listed option', () => {
  // Find a real multi-option row to assert against rather than hard-coding one, so this
  // keeps working when builds.csv is regenerated.
  const multi = [];
  for (const line of CSV.slice(1)) {
    if (!line.trim()) continue;
    const f = line.split(',');
    if ((f[COL.item] || '').includes('|')) multi.push({ species: f[COL.name], items: f[COL.item].split('|') });
  }

  it('builds.csv still contains multi-option item rows', () => {
    assert.ok(multi.length > 100, `expected many multi-option rows, got ${multi.length}`);
  });

  it('both halves of a slashed item field are represented', async () => {
    const row = multi.find((m) => m.species === 'Tatsugiri') || multi[0];
    const pct = await itemPercentages(row.species);
    const missing = row.items.filter((it) => !(pct[it.trim()] > 0));
    assert.deepEqual(missing, [],
      `${row.species} lists ${row.items.join(' | ')} but these show no usage: ${missing.join(', ')} ` +
      `(a build's weight must be split across its options, not assigned to one at random)`);
  });

  it('percentages are a share of builds, so they stay within 0-100', async () => {
    const pct = await itemPercentages('Garchomp');
    const bad = Object.entries(pct).filter(([, v]) => v != null && (v < 0 || v > 100));
    assert.deepEqual(bad, []);
  });

  it('the same species reports the same percentages on a re-render', async () => {
    const first = await itemPercentages('Garchomp');
    const second = await itemPercentages('Garchomp');
    assert.deepEqual(second, first, 'usage percentages must not move between renders');
  });
});
