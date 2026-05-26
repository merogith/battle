// Behavioral verification of the #42 early-game patch — renders specific cities
// through the real renderCityActions and asserts facility presence + the
// NEW/visited badge logic (the items reported broken in live testing).
// Run: node tests/verify-early-game.mjs
import { loadEngine } from './helpers/load-engine.js';

const { window } = await loadEngine();
const SM = window.StoryMode;
const sm = SM.state;
const SER = window.STORY_EVENTS_RAW;

const out = [];
const check = (label, cond, detail) => out.push(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`);
const cityEventIdx = (n) => SER.findIndex(r => Array.isArray(r) && r[1] === 'City' && r[2] === 'City' + n);
const newCount = (h) => (h.match(/>New</g) || []).length;
function freshMon(n) {
  return { name: n, id: 'm_' + n, build: { m: ['Tackle','Tackle','Tackle','Tackle'], i:null, a:null, n:'Hardy',
    ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31}, evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}, bonus:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}, tired:0 } };
}
function setup() { sm.active = true; sm.badges = 0; sm.gold = 4500; sm.team = [freshMon('Bulbasaur')]; sm.facilityIntros = {}; sm.facilitiesSeen = {}; }
const render = (n) => window.__renderCityActionsForTest(cityEventIdx(n));

if (typeof window.__renderCityActionsForTest !== 'function') {
  out.push('ERROR: __renderCityActionsForTest hook missing');
} else {
  // --- City 0: Artifact Hall mandatory + tutors present ---
  setup();
  const h0 = render(0);
  if (h0.startsWith('ERR:')) out.push('ERROR C0: ' + h0);
  check('Artifact Hall present in City 0', h0.includes('Artifact Hall'));
  check('Move Tutor present in City 0', h0.includes('Move Tutor'));
  check('Nature Rater present in City 0', h0.includes('Nature Rater'));

  // --- City 1 (first gym city): tutors were missing in the action list ---
  setup();
  const h1 = render(1);
  check('Move Tutor present in City 1 (was missing)', h1.includes('Move Tutor'));
  check('Nature Rater present in City 1 (was missing)', h1.includes('Nature Rater'));
  check('Evolution Sage present in City 1 (evolution Layer 1)', h1.includes('Stone Sage') || h1.includes('Evolution'));

  // --- Facility NEW/visited three-tier (the "still all NEW" report) ---
  // At City 2 the Pokémart is NOT its debut city, so un-introduced it should read NEW;
  // once facilityIntros.mart is set (player has met a Pokémart before) it must drop NEW.
  setup();
  const h2 = render(2);
  check('un-introduced facilities show NEW at City 2', newCount(h2) > 0, `count=${newCount(h2)}`);
  sm.facilityIntros = { mart:1, tutor:1, nature:1, evolab:1, stoneShop:1, link:1, fanclub:1, dept:1, casino:1, dojo:1, evtrainer:1, colress:1, artifacts:1, safari:1, center:1, relic:1 };
  const h2b = render(2);
  check('after facilityIntros set, NO NEW badges remain (three-tier fix lands)', newCount(h2b) === 0, `count=${newCount(h2b)}`);
}

console.log('\n===== EARLY-GAME VERIFY =====\n' + out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL') || l.startsWith('ERROR'));
console.log(`\n${fails.length ? 'FAILURES: ' + fails.length : 'ALL CHECKS PASSED'}`);
process.exit(fails.length ? 1 : 0);
