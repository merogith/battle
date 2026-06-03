// Mobile fix — the confirm/buy bar must stay reachable without scrolling. It uses
// position:sticky, but an overflow:hidden on the mon card was defeating it; the open
// mon now gets overflow:visible so the bar pins to the real scroller. jsdom has no
// layout, so this guards the STRUCTURE (bar lives in the open mon's body) and the CSS
// that enables sticky (so a future edit can't silently re-clip it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine, openTutorMon } from '../helpers/load-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(__dirname, '..', '..', 'battle.html'), 'utf8');

const eng = await loadEngine();
const w = eng.window;
const ST = w.__storyTest;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function prime(city) {
  ST.sm.active = true; ST.sm.runSeed = 1; ST.sm._strngState = null;
  ST.sm.settings = { enabledGens: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
  ST.sm.badges = Math.max(0, city - 1); ST.sm.gold = 99999; ST.sm.inventory = {};
  let idx = 0;
  for (let ei = 0; ei <= 120; ei++) { let c = -1; try { c = ST.cityIndexFromEventIndex(ei) | 0; } catch (e) {} if (c === city) { idx = ei; break; } }
  ST.sm.eventIndex = idx;
  ST.sm.team = [{ name: 'Garchomp', build: { m: ['Earthquake', 'Dragon Claw'], n: 'Jolly', a: 'Rough Skin', i: 'Life Orb', evs: {}, ivs: {} } }];
}
const host = () => w.document.getElementById('story-tutor-team');

test('confirm/buy bar lives in the open mon body (so the sticky CSS applies)', async () => {
  prime(7);
  await w.StoryMode.enterTutor('moves');
  await openTutorMon(w); // screen starts all-closed — open the first mon
  for (let i = 0; i < 25; i++) { await sleep(40); if (host() && host().innerHTML.includes('tx-grid')) break; }
  const bar = host().querySelector('.tx-confirm-bar');
  assert.ok(bar, 'confirm bar renders');
  const body = bar.closest('.story-tutor-mon-body');
  assert.ok(body, 'bar is inside the editor body');
  const mon = body.closest('.story-tutor-mon');
  assert.ok(mon && mon.querySelector('.story-tutor-mon-body'), 'open mon has a body — the :has() overflow rule targets it');
});

test('CSS keeps the buy bar reachable without scrolling', () => {
  // The open mon must not clip (overflow:hidden was defeating position:sticky).
  assert.match(HTML, /\.story-tutor-mon:has\(\.story-tutor-mon-body\)\s*\{\s*overflow:\s*visible/,
    'open mon is overflow:visible so the sticky bar pins to the scroller, not the card');
  // The bar itself stays sticky to the bottom and above the scrolling cards.
  assert.match(HTML, /\.tx-confirm-bar\s*\{[^}]*position:\s*sticky[^}]*bottom:\s*0[^}]*z-index/,
    'confirm bar is sticky bottom:0 with a z-index above the grid');
});
