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
  check('Nature Rater NOT in City 0 (moved to C1)', !h0.includes('Nature Rater'));

  // --- City 1 (first gym city): Nature Rater now debuts here; Move Tutor present ---
  setup();
  const h1 = render(1);
  check('Move Tutor present in City 1', h1.includes('Move Tutor'));
  check('Nature Rater present in City 1 (debut)', h1.includes('Nature Rater'));
  check('Stone Sage NOT in City 1 (debuts C2)', !(h1.includes('Stone Sage') || h1.includes('Evolution Tutor')));

  // --- City 2: Stone Sage + Battle Dojo debut here (the "systems open up" town) ---
  setup();
  const h2c = render(2);
  check('Stone Sage present in City 2 (debut)', h2c.includes('Stone Sage'));
  check('Battle Dojo present in City 2 (debut, moved earlier from C4)', h2c.includes('Battle Dojo'));
  check('Stone Merchant NOT in City 2 (moved to C3)', !h2c.includes('Stone Emporium'));

  // --- Facility NEW/visited three-tier (the "still all NEW" report) ---
  // At City 2 the Pokémart is NOT its debut city, so un-introduced it should read NEW;
  // once facilityIntros.mart is set (player has met a Pokémart before) it must drop NEW.
  setup();
  const h2 = render(2);
  check('un-introduced facilities show NEW at City 2', newCount(h2) > 0, `count=${newCount(h2)}`);
  sm.facilityIntros = { mart:1, tutor:1, nature:1, evolab:1, stoneShop:1, link:1, fanclub:1, dept:1, casino:1, dojo:1, evtrainer:1, colress:1, artifacts:1, safari:1, center:1, relic:1 };
  const h2b = render(2);
  check('after facilityIntros set, NO NEW badges remain (three-tier fix lands)', newCount(h2b) === 0, `count=${newCount(h2b)}`);

  // --- Regression: stray "undefined" in the chip list (the CONNECT & BAG section
  // seed bug — _sections lacked a 'utility' key, so the first _push('utility',…)
  // concatenated onto `undefined`). Every city's rendered HTML must be clean. ---
  setup();
  for (const c of [0, 1, 2]) {
    const h = render(c);
    check(`no stray "undefined" in City ${c} chips`, !h.includes('undefined'));
  }

  // --- Regression: the Leave-City "Visit Bag first" gate must CLEAR once the Bag
  // is opened — including on an old save where facilitiesSeen[0].bag is already set
  // but the newer facilityIntros gate never recorded it (the early-return soft-lock). ---
  const gateNamesBag = (h) => /Continue Route[^<]*<span[^>]*>\(Visit [^<]*Bag[^<]*first\)/.test(h);
  // Isolate Bag: introduce every other C0 facility, satisfy the Professor gate.
  const introAllButBag = () => { sm.facilityIntros = { mart:1, tutor:1, nature:1, artifacts:1, center:1, relic:1 }; sm.profUsed = { 0: true }; };

  setup(); introAllButBag();
  check('C0 gate names Bag while un-visited', gateNamesBag(render(0)));
  SM.openCityBag();
  check('openCityBag sets facilityIntros.bag', sm.facilityIntros.bag === true);
  check('C0 gate clears after opening Bag', !gateNamesBag(render(0)));

  // Old-save path: per-city seen flag present, cross-city intro flag absent.
  setup(); introAllButBag();
  sm.facilitiesSeen = { 0: { bag: true } };
  check('old-save C0 gate still names Bag before re-open', gateNamesBag(render(0)));
  SM.openCityBag();
  check('old-save openCityBag back-fills facilityIntros.bag', sm.facilityIntros.bag === true);
  check('old-save C0 gate clears after re-opening Bag', !gateNamesBag(render(0)));

  // --- Regression: opening the Bag / Party panel must repaint the hub IN PLACE.
  // Both are modal overlays — closing them does NOT re-render the action strip, so
  // if open* doesn't repaint the hub, the disabled "Continue Route (Visit Bag and
  // Party first)" button stays stuck even after the player visits both. The checks
  // above pass either way because they call render() manually after open*; these
  // read #story-action-buttons directly to prove the live UI updated on its own. ---
  const stripHtml = () => { const el = window.document.getElementById('story-action-buttons'); return el ? el.innerHTML : ''; };
  const gateNamesIntro = (h) => /Continue Route[^<]*<span[^>]*>\(Visit [^<]*first\)/.test(h);
  const introAllButBagParty = () => { sm.facilityIntros = { mart:1, tutor:1, nature:1, artifacts:1, center:1, relic:1 }; sm.profUsed = { 0: true }; };

  setup(); introAllButBagParty();
  render(0); // initial hub paint — gate names Bag + Party
  check('live: C0 gate present on first paint', gateNamesIntro(stripHtml()));
  SM.openCityBag();    // first open → marks Bag seen AND repaints hub in place
  check('live: gate still present after Bag only (Party pending)', gateNamesIntro(stripHtml()));
  SM.openPartyModal(); // first open → marks Party seen AND repaints hub in place
  check('live: gate CLEARS after visiting Bag + Party (no manual re-render)', !gateNamesIntro(stripHtml()));

  // Order-independent: visiting Party first then Bag must also clear the live gate.
  setup(); introAllButBagParty();
  render(0);
  SM.openPartyModal();
  check('live: gate still present after Party only (Bag pending)', gateNamesIntro(stripHtml()));
  SM.openCityBag();
  check('live: gate CLEARS after Party + Bag (reverse order)', !gateNamesIntro(stripHtml()));

  // --- New-spread must-do intro gate: Battle Dojo debuts at C2; un-introduced it
  // carries the 🔴 Required pill, which clears once the player has met it. ---
  const reqCount = (h) => (h.match(/🔴 Required/g) || []).length;
  setup();
  const h2req = render(2);
  check('C2 debut facilities carry 🔴 Required when un-introduced', reqCount(h2req) > 0, `count=${reqCount(h2req)}`);
  check('Battle Dojo chip is flagged Required at its C2 debut', /Battle Dojo[\s\S]{0,260}?🔴 Required/.test(h2req));
  sm.facilityIntros = { dojo:1, evolab:1, link:1, mart:1, tutor:1, nature:1, fanclub:1 };
  const h2done = render(2);
  check('C2 Required pills clear once those facilities are introduced', reqCount(h2done) === 0, `count=${reqCount(h2done)}`);
}

console.log('\n===== EARLY-GAME VERIFY =====\n' + out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL') || l.startsWith('ERROR'));
console.log(`\n${fails.length ? 'FAILURES: ' + fails.length : 'ALL CHECKS PASSED'}`);
process.exit(fails.length ? 1 : 0);
